/**
 * Identity rule pack — party presence and internal name consistency.
 *
 * Scope limit: this checks only whether the DOCUMENT is internally consistent.
 * It never validates whether an Aadhaar/PAN actually belongs to a person, and
 * makes no external calls. Identifiers are masked before they reach a finding,
 * so a full Aadhaar number is never surfaced in the UI or an exported PDF.
 */

import type { FactOccurrence, NormalizedFacts, RiskFinding, RiskSeverity } from './types';
import { makeFinding, resolveConfidence, toEvidence, isSaleLike } from './ruleHelpers';
import { compareNames, maskIdentifier } from './textUtils';

export const IDENTITY_RULE_IDS = [
  'MISS_SELLER_001',
  'MISS_BUYER_001',
  'ID_SELLER_CONFLICT_001',
  'ID_BUYER_CONFLICT_001',
  'ID_IDENTIFIER_CONFLICT_001'
] as const;

export function identityRules(facts: NormalizedFacts): RiskFinding[] {
  const findings: RiskFinding[] = [];
  const saleLike = isSaleLike(facts);

  // RULES 6 & 7 — party identity not located.
  // Only meaningful for sale-type documents; a legal notice or affidavit has no
  // seller/buyer, and flagging their absence would be a guaranteed false positive.
  if (saleLike && facts.sellerNames.length === 0) {
    findings.push(
      makeFinding({
        ruleId: 'MISS_SELLER_001',
        category: 'Identity Consistency',
        title: 'Seller identity not located',
        severity: 'HIGH_ATTENTION',
        reason: 'The seller/vendor identity could not be identified in the analysed document.',
        simpleMeaning: 'We could not find who is selling the property in this document.',
        recommendedVerification: [
          'Confirm the full name of the seller as it appears on the title record.',
          'Check that the seller named in the agreement matches the recorded owner.'
        ],
        relatedFields: ['sellerNames'],
        confidence: resolveConfidence(facts, 'MEDIUM')
      })
    );
  }

  if (saleLike && facts.buyerNames.length === 0) {
    findings.push(
      makeFinding({
        ruleId: 'MISS_BUYER_001',
        category: 'Identity Consistency',
        title: 'Buyer identity not located',
        severity: 'HIGH_ATTENTION',
        reason: 'The buyer/purchaser identity could not be identified in the analysed document.',
        simpleMeaning: 'We could not find who is buying the property in this document.',
        recommendedVerification: [
          'Confirm the full name of the buyer, spelled consistently throughout.',
          'Ensure the buyer name matches the identity documents being used for registration.'
        ],
        relatedFields: ['buyerNames'],
        confidence: resolveConfidence(facts, 'MEDIUM')
      })
    );
  }

  // RULES 11 & 12 — name inconsistency across the document
  const sellerConflict = detectNameConflict(facts.sellerNames);
  if (sellerConflict) {
    findings.push(
      buildNameConflictFinding('ID_SELLER_CONFLICT_001', 'Seller', sellerConflict, facts)
    );
  }

  const buyerConflict = detectNameConflict(facts.buyerNames);
  if (buyerConflict) {
    findings.push(buildNameConflictFinding('ID_BUYER_CONFLICT_001', 'Buyer', buyerConflict, facts));
  }

  return findings;
}

interface NameConflict {
  a: FactOccurrence<string>;
  b: FactOccurrence<string>;
  certain: boolean;
}

/**
 * Finds the first materially different pair of names.
 *
 * `compareNames` returns ABBREVIATION for initials and shortened forms, which
 * are ordinary drafting variation — those are reported at REVIEW rather than
 * HIGH_ATTENTION, and only when no exact match exists elsewhere in the set.
 */
function detectNameConflict(names: FactOccurrence<string>[]): NameConflict | null {
  if (names.length < 2) return null;

  let softConflict: NameConflict | null = null;

  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const verdict = compareNames(names[i].value, names[j].value);
      if (verdict === 'DIFFERENT') {
        return { a: names[i], b: names[j], certain: true };
      }
      if (verdict === 'ABBREVIATION' && !softConflict) {
        softConflict = { a: names[i], b: names[j], certain: false };
      }
    }
  }

  return softConflict;
}

function buildNameConflictFinding(
  ruleId: string,
  role: string,
  conflict: NameConflict,
  facts: NormalizedFacts
): RiskFinding {
  const severity: RiskSeverity = conflict.certain ? 'HIGH_ATTENTION' : 'REVIEW';

  return makeFinding({
    ruleId,
    category: 'Identity Consistency',
    title: conflict.certain
      ? `${role} name appears inconsistent`
      : `${role} name appears in more than one form`,
    severity,
    reason: conflict.certain
      ? `Two materially different ${role.toLowerCase()} names appear in the document: "${conflict.a.value}" and "${conflict.b.value}".`
      : `The ${role.toLowerCase()} name appears in more than one form: "${conflict.a.value}" and "${conflict.b.value}". This is often an abbreviation rather than a conflict.`,
    simpleMeaning: conflict.certain
      ? `The document names two different people as the ${role.toLowerCase()}. This should be checked before signing.`
      : `The ${role.toLowerCase()} name is written slightly differently in different places — for example with or without a middle name.`,
    recommendedVerification: [
      `Confirm the correct full ${role.toLowerCase()} name against an identity document.`,
      'Ensure the same spelling is used consistently in every clause and in the registration record.'
    ],
    evidence: toEvidence([conflict.a, conflict.b], 2),
    relatedFields: [`${role.toLowerCase()}Names`],
    confidence: resolveConfidence(facts, conflict.certain ? 'MEDIUM' : 'LOW')
  });
}

/** Exposed for the cross-clause pack so masking stays in one place. */
export function maskedIdentifierList(identifiers: FactOccurrence<string>[]): string {
  return identifiers.map((i) => maskIdentifier(i.value)).join(', ');
}
