/**
 * Aadhaar card reading.
 *
 * THE RULE THIS FILE EXISTS TO ENFORCE: the full twelve-digit number never
 * leaves this module. It is needed briefly to run the checksum, and then only
 * the last four digits and the printed name are returned. Nothing here has a
 * return path for the whole number, so no caller can accidentally persist one,
 * and `profiles.aadhaar_last4` carries a CHECK constraint that would reject it
 * anyway.
 */

/* ------------------------------------------------------------------ *
 * Verhoeff checksum
 *
 * Aadhaar numbers are Verhoeff-checked. Running it means a stray twelve-digit
 * string on a card — an enrolment id, a phone number run together, an OCR
 * misread — is rejected rather than stored as somebody's Aadhaar.
 * ------------------------------------------------------------------ */

/** Multiplication table for the dihedral group D5. */
const D5_MULTIPLY = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

/** Permutation table, applied by position. */
const PERMUTE = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

/** True when a digit string satisfies the Verhoeff checksum. */
export function isVerhoeffValid(digits: string): boolean {
  if (!/^[0-9]+$/.test(digits)) return false;

  let c = 0;
  const reversed = digits.split('').reverse();
  for (let i = 0; i < reversed.length; i++) {
    c = D5_MULTIPLY[c][PERMUTE[i % 8][Number(reversed[i])]];
  }
  return c === 0;
}

/* ------------------------------------------------------------------ *
 * Card reading
 * ------------------------------------------------------------------ */

export interface AadhaarExtraction {
  /** Whether a structurally valid Aadhaar number was found. */
  found: boolean;
  /** Last four digits only. Never the whole number. */
  last4?: string;
  /** Name as printed on the card, when it could be located. */
  name?: string;
  /** Date of birth or year, as printed. */
  dob?: string;
  gender?: 'Male' | 'Female' | 'Other';
  /**
   * Set when a twelve-digit candidate was present but failed the checksum —
   * usually an OCR misread of a genuine card rather than a forged one, so the
   * UI asks for a clearer photo instead of accusing anyone.
   */
  checksumFailed?: boolean;
}

/** Markers that this is an Aadhaar card at all, in English and Devanagari. */
const CARD_MARKERS = [
  /government\s+of\s+india/i,
  /unique\s+identification/i,
  /भारत\s*सरकार/,
  /आधार/,
  /aadhaar/i,
  /\buidai\b/i
];

/** Words that mean a fragment is card furniture rather than a person's name. */
const NOT_A_NAME =
  /government|india|unique|identification|authority|aadhaar|uidai|address|dob|birth|year|male|female|gender|mobile|vid|enrol|download|issue|help|www|\.gov|\d/i;

const DEVANAGARI = /[ऀ-ॿ]/;

/**
 * Phrases printed on every card. Used twice: to cut the text into segments,
 * and to strip a segment's prefix before judging what is left.
 */
const SEGMENT_BOUNDARY =
  /(?=\b(?:government\s+of\s+india|unique\s+identification\s+authority(?:\s+of\s+india)?|date\s+of\s+birth|year\s+of\s+birth|d\.o\.b|dob|transgender|female|male|aadhaar|uidai|vid)\b)/gi;

const LEADING_FURNITURE =
  /^(?:government\s+of\s+india|unique\s+identification\s+authority(?:\s+of\s+india)?|date\s+of\s+birth|year\s+of\s+birth|d\.o\.b|dob|transgender|female|male|aadhaar|uidai|vid)\b[\s:.-]*/i;

/**
 * Breaks card text into ordered segments.
 *
 * Newlines alone are not enough. A PDF text layer often yields the whole card
 * as a single run — "GOVERNMENT OF INDIA Ramesh Vithal Patil DOB: ..." — which
 * leaves no line above the date of birth for the name to sit on. Splitting
 * before each known printed phrase recreates the structure that a photographed
 * card gets from OCR for free.
 */
function toSegments(text: string): string[] {
  return text
    .split(/\r?\n/)
    .flatMap((line) => line.split(SEGMENT_BOUNDARY))
    .map((seg) => seg.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

/** Removes card furniture from the front of a segment, repeatedly. */
function stripLeadingFurniture(segment: string): string {
  let out = segment.trim();
  for (let i = 0; i < 4; i++) {
    const next = out.replace(LEADING_FURNITURE, '').trim();
    if (next === out) break;
    out = next;
  }
  // Everything from the first digit onward is a number, date or identifier
  // rather than part of the name.
  const firstDigit = out.search(/\d/);
  if (firstDigit >= 0) out = out.slice(0, firstDigit).trim();
  return out;
}

/** Whether a stripped segment reads as a person's name. */
function looksLikeName(candidate: string): boolean {
  if (!candidate || DEVANAGARI.test(candidate)) return false;
  if (NOT_A_NAME.test(candidate)) return false;
  const words = candidate.split(/\s+/);
  if (words.length < 2 || words.length > 6) return false;
  return /^[A-Za-z][A-Za-z.'\s-]*$/.test(candidate);
}

/**
 * Pulls the twelve-digit candidates out of OCR text.
 *
 * Aadhaar is printed in groups of four, and OCR renders the gaps as spaces or
 * nothing at all. Sixteen-digit runs are the Virtual ID and are skipped: they
 * would otherwise contribute a false twelve-digit substring.
 */
function aadhaarCandidates(text: string): string[] {
  const out: string[] = [];

  const grouped = text.matchAll(/\b(\d{4})[\s-]?(\d{4})[\s-]?(\d{4})\b/g);
  for (const m of grouped) {
    // Reject a match sitting inside a longer digit run, which is what a
    // 16-digit VID looks like once the spaces are stripped.
    const before = text[m.index! - 1];
    const after = text[m.index! + m[0].length];
    if (before && /\d/.test(before)) continue;
    if (after && /\d/.test(after)) continue;
    out.push(m[1] + m[2] + m[3]);
  }

  return Array.from(new Set(out));
}

/**
 * Finds the cardholder's name.
 *
 * The name sits immediately above the date of birth on every Aadhaar layout,
 * so the search anchors there and walks backwards. Falling back to "the first
 * fragment that is not card furniture" would happily return "Government of
 * India".
 */
function findName(text: string): string | undefined {
  const segments = toSegments(text);

  const dobIndex = segments.findIndex((seg) =>
    /^(?:dob|d\.o\.b|date\s+of\s+birth|year\s+of\s+birth)\b/i.test(seg) || /जन्म/.test(seg)
  );

  if (dobIndex > 0) {
    for (let i = dobIndex - 1; i >= 0 && i >= dobIndex - 4; i--) {
      // The card prints the name twice; the Devanagari copy is skipped by
      // looksLikeName because the deed being cross-checked is in English.
      const candidate = stripLeadingFurniture(segments[i]);
      if (looksLikeName(candidate)) return candidate;
    }
  }

  // No usable date of birth — take the first plausible name near the top.
  for (const seg of segments.slice(0, 12)) {
    const candidate = stripLeadingFurniture(seg);
    if (looksLikeName(candidate)) return candidate;
  }

  return undefined;
}

function findDob(text: string): string | undefined {
  const full = text.match(/\b(\d{2}[/-]\d{2}[/-]\d{4})\b/);
  if (full) return full[1];
  const year = text.match(/year\s+of\s+birth\s*:?\s*(\d{4})/i);
  if (year) return year[1];
  return undefined;
}

function findGender(text: string): AadhaarExtraction['gender'] {
  if (/\bfemale\b/i.test(text) || /महिला/.test(text)) return 'Female';
  if (/\bmale\b/i.test(text) || /पुरुष/.test(text)) return 'Male';
  if (/\btransgender\b/i.test(text)) return 'Other';
  return undefined;
}

/** Whether the text looks like an Aadhaar card at all. */
export function looksLikeAadhaarCard(text: string): boolean {
  return CARD_MARKERS.some((re) => re.test(text));
}

/**
 * Reads an Aadhaar card from OCR text.
 *
 * Returns the last four digits and the printed name. The full number is held
 * only long enough to run the checksum and is never returned.
 */
export function extractAadhaar(text: string): AadhaarExtraction {
  if (!text || !text.trim()) return { found: false };

  const candidates = aadhaarCandidates(text);

  let last4: string | undefined;
  let checksumFailed = false;

  for (const candidate of candidates) {
    if (isVerhoeffValid(candidate)) {
      last4 = candidate.slice(-4);
      // The full candidate goes out of scope here and is never assigned
      // anywhere that outlives this loop.
      break;
    }
    checksumFailed = true;
  }

  if (!last4) {
    return { found: false, checksumFailed: checksumFailed || undefined };
  }

  return {
    found: true,
    last4,
    name: findName(text),
    dob: findDob(text),
    gender: findGender(text)
  };
}
