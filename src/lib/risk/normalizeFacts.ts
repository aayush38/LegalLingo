/**
 * Builds a normalized, evidence-carrying fact sheet from a DocumentAnalysis.
 *
 * CRITICAL DISTINCTION — document text vs model commentary:
 *
 *   Document-derived (trusted as evidence of what the document SAYS):
 *     analysis.originalText, paragraphs[].original, importantClauses[].originalText
 *
 *   Model commentary (NOT evidence of document content):
 *     simpleMeaning, whyItMatters, recommendedAction, missingInformation[]
 *
 * The distinction matters concretely: a clause whose recommendedAction reads
 * "obtain a bank NOC before paying" would, if treated as document text, make
 * the engine conclude an NOC exists — inverting the very finding that advice
 * was warning about. Facts are read only from the first group.
 */

import type { DocumentAnalysis } from '../types';
import type { FactOccurrence, NormalizedFacts } from './types';
import {
  dedupeOccurrences,
  extractDatesNearPhrase,
  extractIdentifiers,
  extractSurveyNumbers,
  normalizeDate,
  normalizeName,
  parseIndianAmount,
  snippet
} from './textUtils';

/** A unit of document-derived text along with where it came from. */
interface TextSource {
  text: string;
  page?: number;
  clauseId?: string;
  sourceFile?: string;
}

function collectDocumentText(analysis: DocumentAnalysis): TextSource[] {
  const sources: TextSource[] = [];

  for (const clause of analysis.importantClauses || []) {
    if (clause.originalText?.trim()) {
      sources.push({
        text: clause.originalText,
        page: clause.page,
        clauseId: clause.id,
        sourceFile: clause.sourceFile
      });
    }
  }

  for (const para of analysis.paragraphs || []) {
    if (para.original?.trim()) {
      sources.push({ text: para.original, page: para.page, sourceFile: para.sourceFile });
    }
  }

  // Raw extracted text last: it has no page attribution, so page-bearing
  // sources above win when the same fact appears in both.
  if (analysis.originalText?.trim()) {
    sources.push({ text: analysis.originalText });
  }

  return sources;
}

const MORTGAGE_RE = /\b(mortgag(?:e|ed|es)|encumbrance|encumbered|hypothecat\w*|outstanding\s+loan|crop\s+loan|housing\s+loan|lien)\b/i;

/**
 * Release/discharge mechanisms. Deliberately requires wording that describes an
 * actual arrangement, not the mere word "NOC" — "NOC missing" and "obtain NOC"
 * must not read as "NOC present".
 */
const NOC_RE = /\b(?:no[-\s]?objection\s+certificate\s+(?:is\s+)?(?:attached|obtained|annexed|enclosed|provided|furnished|received)|noc\s+(?:is\s+)?(?:attached|obtained|annexed|enclosed|provided|furnished|received)|tripartite\s+agreement|release\s+(?:deed|letter)|release\s+of\s+mortgage|redemption\s+of\s+mortgage|satisfaction\s+of\s+charge|mortgage\s+(?:shall|will)\s+be\s+(?:released|redeemed|cleared|discharged)|loan\s+(?:shall|will)\s+be\s+(?:cleared|repaid|discharged))\b/i;

const FORFEIT_RE = /\b(?:forfeit\w*|liquidated\s+damages|earnest\s+money\s+(?:shall|will|may)\s+be\s+(?:forfeit\w*|retained))\b/i;

const WITNESS_RE = /\bwitness(?:es|eth)?\b/i;
// Note: no /i flag — the [A-Z] in the name group depends on case sensitivity,
// so the literal is spelled with explicit character classes instead.
const WITNESS_NAME_RE = /[Ww]itness(?:\s*(?:[Nn]o\.?)?\s*[0-9])?\s*[:\-]\s*((?:(?:[Mm]r|[Mm]rs|[Mm]s|[Ss]hri|[Ss]mt|[Ss]ri)\.?\s+)?[A-Z][a-zऀ-ॿ]+(?:\s+[A-Z][a-zऀ-ॿ]+){1,3})/g;

const REGISTRATION_RE = /\b(?:sub[-\s]?registrar|registration\s+(?:no|number|fee|act)|registered\s+(?:at|before|with|under)|stamp\s+duty|index\s+ii|talathi|mutation\s+entry)\b/i;

const PAYMENT_DEADLINE_RE = /\b(?:on\s+or\s+before|not\s+later\s+than|within\s+\d+\s+(?:days?|months?)|due\s+(?:on|by)|payable\s+(?:on|by|before))\b/i;
const PAYMENT_CONTEXT_RE = /\b(?:pay|payment|paid|consideration|balance|instal)/i;
const POSSESSION_RE = /\bpossession\b/i;

const ROLE_PATTERNS: { role: 'seller' | 'buyer'; words: string }[] = [
  { role: 'seller', words: 'seller|vendor|first\\s+party|transferor' },
  { role: 'buyer', words: 'buyer|purchaser|second\\s+party|transferee' }
];

/** Capitalized legal boilerplate that must not be mistaken for a person. */
const NOT_A_NAME_RE = /^(?:This|That|The|Whereas|Now|Therefore|Agreement|Sale|Deed|Purchaser|Vendor|Seller|Buyer|Party|Parties|Village|Taluka|District|State|Survey|Gat|Hissa|Plot|Rupees|Indian|Schedule|Annexure|Witness)\b/i;

/**
 * Extracts a party name only from an explicit DEFINITIONAL construction, e.g.
 *   "Shri Ramesh Vithal Patil, ... (hereinafter the Vendor/Seller)"
 *   "Suresh Jadhav (the Purchaser)"
 *
 * An earlier version harvested capitalised word pairs from any sentence that
 * mentioned a role. In real conveyancing prose that also collects
 * "Village Khed", "Taluka Haveli" and "Haveli Primary Agricultural Cooperative
 * Credit Society", which then compare as materially different names and fire a
 * false seller/buyer conflict on essentially every document. Requiring the
 * role-defining parenthetical is far narrower, but it is actually trustworthy.
 */
function namesFromDefinition(text: string, roleWords: string): string[] {
  const out: string[] = [];
  // String.raw so the backslash escapes reach the RegExp constructor intact.
  const defRe = new RegExp(
    String.raw`([^.;()]{3,160}?)\s*\(\s*(?:herein\s*after|hereinafter)?\s*(?:called|referred\s+to\s+as|known\s+as)?\s*(?:the\s+)?(?:${roleWords})`,
    'gi'
  );

  for (const m of text.matchAll(defRe)) {
    const segment = m[1];
    const nameRe = /(?:(?:mr|mrs|ms|shri|smt|sri|kum)\.?\s+)?\b([A-Z][a-zऀ-ॿ]{2,}(?:\s+[A-Z][a-zऀ-ॿ]{2,}){1,3})\b/g;
    for (const nameMatch of segment.matchAll(nameRe)) {
      // "Shri" itself matches the capitalised-word pattern, so it lands inside
      // the capture group; strip it so the stored value is the bare name.
      const candidate = nameMatch[1].replace(/^(?:Mr|Mrs|Ms|Shri|Smt|Sri|Kum|Dr)\.?\s+/i, '').trim();
      if (!candidate || NOT_A_NAME_RE.test(candidate)) continue;
      // The party name leads the definitional segment; what follows is
      // occupation and address, so the first surviving candidate is the name.
      out.push(candidate);
      break;
    }
  }

  return out;
}

/** Reads a labelled amount out of keyInformation, which is already label/value. */
function amountFromKeyInfo(analysis: DocumentAnalysis, labelRe: RegExp): FactOccurrence<number> | undefined {
  for (const item of analysis.keyInformation || []) {
    if (!labelRe.test(item.label || '')) continue;
    const value = parseIndianAmount(item.value || '');
    if (value !== null) {
      return { value, sourceText: `${item.label}: ${item.value}` };
    }
  }
  return undefined;
}

/**
 * Finds the amount that FOLLOWS a label, within a short window.
 *
 * An earlier version split the text into sentences and looked for a label and
 * an amount in the same sentence. Indian legal drafting writes amounts as
 * "Rs. 18,50,000", and the full stop in "Rs." splits the sentence right between
 * the label and its number — so the label fragment had no amount and the amount
 * fragment had no label, and nothing was ever extracted. Searching forward from
 * the label instead is immune to that.
 */
function amountFromText(
  sources: TextSource[],
  labelRe: RegExp,
  window = 140
): FactOccurrence<number> | undefined {
  const global = new RegExp(labelRe.source, 'gi');

  for (const src of sources) {
    for (const m of src.text.matchAll(global)) {
      const from = m.index ?? 0;
      const segment = src.text.slice(from, from + m[0].length + window);
      const value = parseIndianAmount(segment);
      if (value !== null) {
        return {
          value,
          page: src.page,
          clauseId: src.clauseId,
          sourceFile: src.sourceFile,
          sourceText: snippet(segment)
        };
      }
    }
  }
  return undefined;
}

/**
 * The fiveQuestions.totalAmount string is often a compact summary such as
 * "Rs 18,50,000 (Advance: Rs 3,50,000 | Bank Loan Debt: Rs 2,80,000 | Balance: Rs 12,20,000)".
 * Parsing it gives the financial reconciliation rule real numbers to work with.
 */
function amountsFromTotalAmountString(raw: string): {
  consideration?: number;
  advance?: number;
  balance?: number;
  mortgage?: number;
} {
  const result: { consideration?: number; advance?: number; balance?: number; mortgage?: number } = {};
  if (!raw) return result;

  const openIdx = raw.indexOf('(');
  const closeIdx = raw.lastIndexOf(')');

  const head = openIdx >= 0 ? raw.slice(0, openIdx) : raw;
  const headValue = parseIndianAmount(head);
  if (headValue !== null) result.consideration = headValue;

  if (openIdx >= 0 && closeIdx > openIdx) {
    const inner = raw.slice(openIdx + 1, closeIdx);
    // Split on | and ; only — a comma is a digit-group separator in Indian
    // notation (3,50,000), so splitting on it shreds every amount into fragments.
    for (const part of inner.split(/[|;]/)) {
      const value = parseIndianAmount(part);
      if (value === null) continue;
      if (/advance|earnest|token|deposit/i.test(part)) result.advance = value;
      else if (/balance|remaining/i.test(part)) result.balance = value;
      else if (/loan|mortgage|debt|encumbrance/i.test(part)) result.mortgage = value;
    }
  }

  return result;
}

export function normalizeFacts(analysis: DocumentAnalysis): NormalizedFacts {
  const sources = collectDocumentText(analysis);
  const joined = sources.map((s) => s.text).join('\n');

  // --- Parties -----------------------------------------------------------
  const sellerNames: FactOccurrence<string>[] = [];
  const buyerNames: FactOccurrence<string>[] = [];

  const parties = analysis.fiveQuestions?.partiesInvolved;
  if (parties?.seller) sellerNames.push({ value: parties.seller, sourceText: 'Extracted party: seller' });
  if (parties?.buyer) buyerNames.push({ value: parties.buyer, sourceText: 'Extracted party: buyer' });

  for (const party of analysis.parties || []) {
    if (!party?.name) continue;
    if (/seller|vendor|transferor|first\s+party/i.test(party.role || '')) {
      sellerNames.push({ value: party.name, sourceText: `${party.role}: ${party.name}` });
    } else if (/buyer|purchaser|transferee|second\s+party/i.test(party.role || '')) {
      buyerNames.push({ value: party.name, sourceText: `${party.role}: ${party.name}` });
    }
  }

  for (const src of sources) {
    for (const { role, words } of ROLE_PATTERNS) {
      for (const name of namesFromDefinition(src.text, words)) {
        const occ: FactOccurrence<string> = {
          value: name,
          page: src.page,
          clauseId: src.clauseId,
          sourceFile: src.sourceFile,
          sourceText: snippet(src.text)
        };
        if (role === 'seller') sellerNames.push(occ);
        else buyerNames.push(occ);
      }
    }
  }

  // --- Money -------------------------------------------------------------
  const fromTotal = amountsFromTotalAmountString(analysis.fiveQuestions?.totalAmount || '');
  const totalAmountEvidence = analysis.fiveQuestions?.totalAmount
    ? snippet(analysis.fiveQuestions.totalAmount)
    : undefined;

  const consideration =
    amountFromKeyInfo(analysis, /total|consideration|transaction\s+amount|sale\s+price/i) ??
    (fromTotal.consideration !== undefined
      ? { value: fromTotal.consideration, sourceText: totalAmountEvidence }
      : amountFromText(sources, /total\s+(?:sale\s+)?consideration|sale\s+consideration|total\s+(?:sale\s+)?price|total\s+amount/i));

  const advancePaid =
    amountFromKeyInfo(analysis, /advance|earnest|token/i) ??
    (fromTotal.advance !== undefined
      ? { value: fromTotal.advance, sourceText: totalAmountEvidence }
      : amountFromText(sources, /\b(?:advance|earnest\s+money|token\s+amount)\b/i));

  const balanceAmount =
    amountFromKeyInfo(analysis, /balance|remaining/i) ??
    (fromTotal.balance !== undefined
      ? { value: fromTotal.balance, sourceText: totalAmountEvidence }
      : amountFromText(sources, /\bbalance\s+(?:consideration|amount|payment|of)\b/i));

  const mortgageAmount =
    amountFromKeyInfo(analysis, /mortgage|loan|debt|encumbrance/i) ??
    (fromTotal.mortgage !== undefined
      ? { value: fromTotal.mortgage, sourceText: totalAmountEvidence }
      : amountFromText(sources, /\b(?:outstanding|mortgage|crop\s+loan|bank\s+loan)\b/i));

  // --- Per-source scanning ------------------------------------------------
  const mortgageEvidence: FactOccurrence<string>[] = [];
  const nocEvidence: FactOccurrence<string>[] = [];
  const forfeitureEvidence: FactOccurrence<string>[] = [];
  const paymentDeadlines: FactOccurrence<string>[] = [];
  const possessionDates: FactOccurrence<string>[] = [];
  const surveyNumbers: FactOccurrence<string>[] = [];
  const witnessNames: FactOccurrence<string>[] = [];
  const identifiers: FactOccurrence<string>[] = [];

  for (const src of sources) {
    const base = { page: src.page, clauseId: src.clauseId, sourceFile: src.sourceFile };

    const mortgageHit = src.text.match(MORTGAGE_RE);
    if (mortgageHit) mortgageEvidence.push({ value: mortgageHit[0], ...base, sourceText: snippet(src.text) });

    const nocHit = src.text.match(NOC_RE);
    if (nocHit) nocEvidence.push({ value: nocHit[0], ...base, sourceText: snippet(src.text) });

    const forfeitHit = src.text.match(FORFEIT_RE);
    if (forfeitHit) forfeitureEvidence.push({ value: forfeitHit[0], ...base, sourceText: snippet(src.text) });

    for (const survey of extractSurveyNumbers(src.text)) {
      surveyNumbers.push({ value: survey, ...base, sourceText: snippet(src.text) });
    }

    for (const id of extractIdentifiers(src.text)) {
      identifiers.push({ value: id, ...base, sourceText: 'identifier' });
    }

    // Only dates sitting immediately after a deadline phrase count as a
    // deadline — see extractDatesNearPhrase for why proximity is required.
    if (PAYMENT_CONTEXT_RE.test(src.text)) {
      for (const d of extractDatesNearPhrase(src.text, PAYMENT_DEADLINE_RE)) {
        paymentDeadlines.push({ value: d, ...base, sourceText: snippet(src.text) });
      }
    }
    if (POSSESSION_RE.test(src.text)) {
      for (const d of extractDatesNearPhrase(src.text, POSSESSION_RE, 120)) {
        possessionDates.push({ value: d, ...base, sourceText: snippet(src.text) });
      }
    }

    for (const m of src.text.matchAll(WITNESS_NAME_RE)) {
      witnessNames.push({ value: m[1].trim(), ...base, sourceText: snippet(src.text) });
    }
  }

  for (const party of analysis.parties || []) {
    for (const id of extractIdentifiers(party.details || '')) {
      identifiers.push({ value: id, sourceText: `${party.role} identifier` });
    }
  }

  return {
    documentType: analysis.documentType || 'Legal Document',
    fullyAnalyzed: analysis.analysisMeta?.fullyAnalyzed !== false,

    sellerNames: dedupeOccurrences(sellerNames, normalizeName),
    buyerNames: dedupeOccurrences(buyerNames, normalizeName),

    consideration,
    advancePaid,
    balanceAmount,
    mortgageAmount,

    mortgagePresent: mortgageEvidence.length > 0,
    mortgageEvidence,

    nocDetected: nocEvidence.length > 0,
    nocEvidence,

    paymentDeadlines: dedupeOccurrences(paymentDeadlines, normalizeDate),
    possessionDates: dedupeOccurrences(possessionDates, normalizeDate),

    surveyNumbers: dedupeOccurrences(surveyNumbers, (v) => v),
    propertyDescriptions: [],

    witnessNames: dedupeOccurrences(witnessNames, normalizeName),
    witnessMentioned: WITNESS_RE.test(joined),

    registrationDetailsPresent: REGISTRATION_RE.test(joined),

    forfeitureDetected: forfeitureEvidence.length > 0,
    forfeitureEvidence,

    identifiers: dedupeOccurrences(identifiers, (v) => v.replace(/\s/g, '').toUpperCase()),
    addresses: []
  };
}
