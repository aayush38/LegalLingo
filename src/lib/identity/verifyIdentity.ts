import { compareNames } from '@/lib/risk/textUtils';
import type { DocumentAnalysis } from '@/lib/types';

/**
 * Checks whether the citizen holding the phone is actually named in the
 * document they are reading, and in what role.
 *
 * This is an attention check, not a legal determination. It cannot prove
 * identity — only that the name on the Aadhaar card and the name in the deed
 * either agree, differ in a way that is normal in Indian records (an initial
 * for a middle name, a dropped patronymic), or do not match at all. The last
 * case is worth surfacing loudly: a deed naming someone subtly different from
 * the person signing it is a known way for a sale to be challenged later.
 */

export type IdentityVerdict =
  /** The name appears in the document, spelled the same way. */
  | 'CONFIRMED'
  /** Present, but abbreviated or expanded — normal, still worth eyeballing. */
  | 'LIKELY'
  /** The document names people, and none of them is this citizen. */
  | 'NOT_NAMED'
  /** Nothing to compare: no profile name, or no parties extracted. */
  | 'UNKNOWN';

export interface IdentityMatch {
  /** Role as written in the document: Seller, Buyer, Vendor, Purchaser... */
  role: string;
  /** Name as written in the document. */
  documentName: string;
  quality: 'SAME' | 'ABBREVIATION';
}

export interface IdentityCheckResult {
  verdict: IdentityVerdict;
  /** The name checked against the document. */
  checkedName?: string;
  /** Every role in which this citizen appears. Usually one, sometimes two. */
  matches: IdentityMatch[];
  /** Names the document does contain, when none of them matched. */
  otherParties: { role: string; name: string }[];
}

/** Pulls every named party out of an analysis, from both places they land. */
function collectParties(analysis: DocumentAnalysis): { role: string; name: string }[] {
  const out: { role: string; name: string }[] = [];

  for (const p of analysis.parties ?? []) {
    if (p?.name && p.name.trim()) out.push({ role: p.role || 'Party', name: p.name.trim() });
  }

  // fiveQuestions carries the same people in a flatter shape; a document
  // sometimes populates one and not the other.
  const involved = analysis.fiveQuestions?.partiesInvolved;
  if (involved) {
    const named: [string, string | undefined][] = [
      ['Seller', involved.seller],
      ['Buyer', involved.buyer],
      ['Landlord', involved.landlord],
      ['Tenant', involved.tenant]
    ];
    for (const [role, name] of named) {
      if (name && name.trim()) out.push({ role, name: name.trim() });
    }
    for (const name of involved.parties ?? []) {
      if (name && name.trim()) out.push({ role: 'Party', name: name.trim() });
    }
  }

  // De-duplicate on role+name, preserving first-seen order.
  const seen = new Set<string>();
  return out.filter((p) => {
    const key = `${p.role.toLowerCase()}|${p.name.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Compares a citizen's name against the parties in a document.
 *
 * `checkedName` should be the name printed on the Aadhaar card where one has
 * been read, because that is the name a registrar will compare against. A
 * self-entered display name is accepted as a fallback but is weaker evidence.
 */
export function verifyIdentity(
  checkedName: string | null | undefined,
  analysis: DocumentAnalysis | null | undefined
): IdentityCheckResult {
  const empty: IdentityCheckResult = { verdict: 'UNKNOWN', matches: [], otherParties: [] };

  if (!checkedName || !checkedName.trim() || !analysis) return empty;

  const parties = collectParties(analysis);
  if (parties.length === 0) {
    return { ...empty, checkedName: checkedName.trim() };
  }

  const matches: IdentityMatch[] = [];
  const others: { role: string; name: string }[] = [];

  for (const party of parties) {
    const comparison = compareNames(checkedName, party.name);
    if (comparison === 'SAME' || comparison === 'ABBREVIATION') {
      matches.push({ role: party.role, documentName: party.name, quality: comparison });
    } else {
      others.push(party);
    }
  }

  if (matches.length === 0) {
    return {
      verdict: 'NOT_NAMED',
      checkedName: checkedName.trim(),
      matches: [],
      otherParties: others
    };
  }

  return {
    // An exact spelling anywhere is enough to call it confirmed; otherwise the
    // citizen is told it looks like them but the spelling differs.
    verdict: matches.some((m) => m.quality === 'SAME') ? 'CONFIRMED' : 'LIKELY',
    checkedName: checkedName.trim(),
    matches,
    otherParties: others
  };
}
