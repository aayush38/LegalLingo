/**
 * Shared parsing/normalization helpers for the Risk Engine.
 *
 * Everything here is deterministic and side-effect free so the rules built on
 * top of it can be unit tested without an LLM.
 */

import type { FactOccurrence } from './types';

/** Honorifics stripped before comparing person names. */
const HONORIFICS = /\b(?:mr|mrs|ms|miss|shri|sri|smt|smmt|kum|kumari|dr|adv|late|shrimati)\.?\s+/gi;

/** Trailing role annotations the model often appends: "Ramesh Patil (Seller)". */
const ROLE_SUFFIX = /\s*\((?:the\s+)?(?:seller|vendor|buyer|purchaser|tenant|landlord|lessor|lessee|borrower|lender|first party|second party)\)\s*$/gi;

/**
 * Normalizes a person name for comparison: drops honorifics and role suffixes,
 * lowercases, strips punctuation and collapses whitespace.
 */
export function normalizeName(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(ROLE_SUFFIX, ' ')
    .replace(HONORIFICS, ' ')
    .toLowerCase()
    .replace(/[.,'"`]/g, ' ')
    .replace(/[^a-z\u0900-\u097F\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function nameTokens(raw: string): string[] {
  return normalizeName(raw).split(' ').filter((t) => t.length > 0);
}

export type NameComparison = 'SAME' | 'ABBREVIATION' | 'DIFFERENT';

/**
 * Compares two person names conservatively.
 *
 * Returns ABBREVIATION (not DIFFERENT) when one name is a subset of the other
 * or differs only by initials — "Ramesh V. Patil" vs "Ramesh Vithal Patil" is a
 * normal drafting variation, and flagging it as a conflict would bury the real
 * findings in noise.
 */
export function compareNames(a: string, b: string): NameComparison {
  const ta = nameTokens(a);
  const tb = nameTokens(b);
  if (ta.length === 0 || tb.length === 0) return 'DIFFERENT';
  if (ta.join(' ') === tb.join(' ')) return 'SAME';

  const setB = new Set(tb);
  const shared = ta.filter((t) => setB.has(t));

  // One name fully contained in the other → an expanded/shortened form.
  if (shared.length === Math.min(ta.length, tb.length)) return 'ABBREVIATION';

  // Initial-vs-full-word on the differing token, e.g. "v" vs "vithal".
  const longer = ta.length >= tb.length ? ta : tb;
  const shorter = ta.length >= tb.length ? tb : ta;
  const initialsMatch = shorter.every((tok) =>
    longer.some((other) => other === tok || (tok.length === 1 && other.startsWith(tok)))
  );
  if (initialsMatch) return 'ABBREVIATION';

  // Surname plus at least one more token in common → still the same person.
  if (shared.length >= 2) return 'ABBREVIATION';

  return 'DIFFERENT';
}

const LAKH = 100_000;
const CRORE = 10_000_000;

/**
 * Parses Indian currency notation into a number.
 *
 * Handles ₹/Rs prefixes, Indian comma grouping (18,50,000), the /- suffix, and
 * lakh/crore word forms ("3.5 Lakh"). Returns null when nothing parseable is
 * found rather than guessing.
 */
export function parseIndianAmount(raw: string): number | null {
  if (!raw) return null;
  const text = String(raw).replace(/₹/g, ' Rs ');

  // 1. Lakh/crore word forms.
  const wordMatch = text.match(/([0-9]+(?:[.,][0-9]+)?)\s*(lakhs?|lacs?|crores?|cr\b)/i);
  if (wordMatch) {
    const base = Number(wordMatch[1].replace(/,/g, ''));
    if (Number.isFinite(base)) {
      return /cr/i.test(wordMatch[2]) ? base * CRORE : base * LAKH;
    }
  }

  // 2. A number carrying an explicit currency marker. Checked before any bare
  //    number so that "Gat No. 142/3A ... loan of Rs. 2,80,000" yields 280000
  //    rather than the parcel number that happens to appear first.
  const currencyMatch = text.match(/(?:rs\.?|inr|rupees)\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i);
  if (currencyMatch) {
    const n = Number(currencyMatch[1].replace(/,/g, ''));
    if (Number.isFinite(n) && n > 0) return n;
  }

  // 3. Indian digit grouping (18,50,000) — unambiguous enough to trust.
  const groupedMatch = text.match(/\b([0-9]{1,3}(?:,[0-9]{2,3})+)\b/);
  if (groupedMatch) {
    const n = Number(groupedMatch[1].replace(/,/g, ''));
    if (Number.isFinite(n) && n > 0) return n;
  }

  // 4. A bare run of 4+ digits. Three-digit bare numbers are deliberately NOT
  //    matched: survey numbers, clause numbers and areas look exactly like them.
  const plain = text.match(/\b([0-9]{4,})\b/);
  if (plain) {
    const n = Number(plain[1]);
    if (Number.isFinite(n) && n > 0) return n;
  }

  return null;
}

/** Formats a number back into Indian grouping for display in findings. */
export function formatIndianAmount(value: number): string {
  const s = Math.round(value).toString();
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
}

/**
 * Maharashtra land parcel identifiers: Gat No, Survey No, S.No, Hissa, CTS,
 * Khasra, Plot No — with sub-division forms like 142/3A.
 */
// Land parcel identifiers (sale/transfer documents) plus built-unit identifiers
// (leases). A rent agreement for a flat has a "Flat No. 402" and no survey
// number at all, so without the second group every lease would be reported as
// having no identifiable property.
const SURVEY_RE =
  /\b(gat|survey|sy|s\.?\s?no|hissa|khasra|cts|plot|final plot|f\.?p\.?|flat|unit|shop|house|door|apartment|office|premises)\s*(?:nos?\.?|number)?\s*:?\s*([0-9]+(?:\s*\/\s*[0-9A-Za-z]+)*)/gi;

/**
 * Normalizes the matched keyword to a canonical parcel/unit type. The type is
 * kept in the value because "Gat 145" and "Survey 145" are different parcels,
 * and comparing them as equal would hide a real inconsistency.
 */
function labelForKind(kind: string): string {
  if (kind.startsWith('gat')) return 'GAT';
  if (kind.startsWith('cts')) return 'CTS';
  if (kind.startsWith('khasra')) return 'KHASRA';
  if (kind.startsWith('plot') || kind.startsWith('fp') || kind.startsWith('finalplot')) return 'PLOT';
  if (kind.startsWith('hissa')) return 'HISSA';
  if (kind.startsWith('flat') || kind.startsWith('apartment')) return 'FLAT';
  if (kind.startsWith('unit')) return 'UNIT';
  if (kind.startsWith('shop')) return 'SHOP';
  if (kind.startsWith('house') || kind.startsWith('door')) return 'HOUSE';
  if (kind.startsWith('office') || kind.startsWith('premises')) return 'PREMISES';
  return 'SURVEY';
}

export function extractSurveyNumbers(text: string): string[] {
  if (!text) return [];
  const out: string[] = [];
  for (const m of text.matchAll(SURVEY_RE)) {
    const kind = m[1].toLowerCase().replace(/[.\s]/g, '');
    const num = m[2].replace(/\s*\/\s*/g, '/').trim();
    // Keep the parcel-type prefix: "Gat 145" and "Survey 145" are not the same parcel.
    const label = labelForKind(kind);
    out.push(`${label} ${num.toUpperCase()}`);
  }
  return out;
}

/** Dates in the forms Indian legal drafting actually uses. */
const DATE_RE =
  /\b(?:(?:[0-3]?\d)(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}|(?:[0-3]?\d)[/-](?:[01]?\d)[/-](?:\d{2}|\d{4})|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+[0-3]?\d(?:st|nd|rd|th)?,?\s+\d{4})\b/gi;

export function extractDates(text: string): string[] {
  if (!text) return [];
  return [...text.matchAll(DATE_RE)].map((m) => m[0].trim());
}

/**
 * Returns dates that sit close after a deadline phrase.
 *
 * Scanning a whole clause for "on or before" and then attributing EVERY date in
 * that clause to the deadline is too loose: a block that mentions both the
 * execution date and a payment date yields two "deadlines" and fires a bogus
 * cross-clause conflict. Requiring proximity keeps "on or before 15th September
 * 2026" and drops the unrelated execution date.
 */
export function extractDatesNearPhrase(text: string, phraseRe: RegExp, window = 60): string[] {
  if (!text) return [];
  const out: string[] = [];
  const global = new RegExp(phraseRe.source, 'gi');

  for (const m of text.matchAll(global)) {
    const from = m.index ?? 0;
    const segment = text.slice(from, from + window + m[0].length);
    for (const d of extractDates(segment)) out.push(d);
  }

  return out;
}

/** Normalizes a date string enough to tell two mentions apart. */
export function normalizeDate(raw: string): string {
  return raw.toLowerCase().replace(/(st|nd|rd|th)\b/g, '').replace(/[.,]/g, '').replace(/\s+/g, ' ').trim();
}

/** Masks Aadhaar/PAN so a finding never echoes a full sensitive identifier. */
export function maskIdentifier(raw: string): string {
  const clean = raw.trim();
  if (/^[A-Z]{5}\d{4}[A-Z]$/i.test(clean.replace(/\s/g, ''))) {
    const c = clean.replace(/\s/g, '').toUpperCase();
    return `${c[0]}****${c.slice(-2)}`;
  }
  const digits = clean.replace(/\D/g, '');
  if (digits.length >= 4) return `XXXX XXXX ${digits.slice(-4)}`;
  return 'XXXX';
}

const AADHAAR_RE = /\b\d{4}\s?\d{4}\s?\d{4}\b/g;
const PAN_RE = /\b[A-Z]{5}\d{4}[A-Z]\b/gi;

export function extractIdentifiers(text: string): string[] {
  if (!text) return [];
  return [...(text.match(AADHAAR_RE) || []), ...(text.match(PAN_RE) || [])];
}

/** Trims a snippet to a readable length for evidence display. */
export function snippet(text: string, max = 220): string {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`;
}

/** Deduplicates occurrences by normalized value, keeping the first evidence. */
export function dedupeOccurrences<T>(
  items: FactOccurrence<T>[],
  keyOf: (value: T) => string
): FactOccurrence<T>[] {
  const seen = new Set<string>();
  const out: FactOccurrence<T>[] = [];
  for (const item of items) {
    const key = keyOf(item.value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
