/**
 * Property rule pack — encumbrance status and parcel identification.
 *
 * Wording rule: these findings describe what needs verifying. None of them may
 * assert that a mortgage makes a transaction invalid or that an NOC is legally
 * mandatory — that varies by lender, parcel and state, and is not something a
 * regex can establish.
 */

import type { NormalizedFacts, RiskFinding } from './types';
import { makeFinding, resolveConfidence, toEvidence, isSaleLike } from './ruleHelpers';

export const PROPERTY_RULE_IDS = [
  'PROP_MORT_001',
  'PROP_MORT_002',
  'MISS_PROPERTY_ID_001',
  'PROP_ID_CONFLICT_001'
] as const;

export function propertyRules(facts: NormalizedFacts): RiskFinding[] {
  const findings: RiskFinding[] = [];

  // RULE 1 — mortgage / encumbrance detected
  if (facts.mortgagePresent) {
    findings.push(
      makeFinding({
        ruleId: 'PROP_MORT_001',
        category: 'Property & Encumbrance',
        title: 'Existing mortgage or encumbrance identified',
        severity: 'REVIEW',
        reason: 'An existing mortgage or encumbrance has been identified in the document.',
        simpleMeaning:
          'The document mentions that a loan or other claim is currently attached to this property.',
        recommendedVerification: [
          'Obtain a current encumbrance certificate for the property.',
          'Ask the lender for a written outstanding-balance statement as of the transaction date.'
        ],
        evidence: toEvidence(facts.mortgageEvidence),
        relatedFields: ['mortgagePresent'],
        confidence: resolveConfidence(facts, 'HIGH', { unambiguous: true })
      })
    );
  }

  // RULE 2 — mortgage present but no release / discharge mechanism found
  if (facts.mortgagePresent && !facts.nocDetected) {
    findings.push(
      makeFinding({
        ruleId: 'PROP_MORT_002',
        category: 'Property & Encumbrance',
        title: 'Mortgage identified without a clear release mechanism',
        severity: 'HIGH_ATTENTION',
        reason:
          'An existing mortgage is mentioned, but a clear release/NOC mechanism was not identified in the analysed text.',
        simpleMeaning:
          'The document says there is a loan on the property but does not clearly explain how that loan will be cleared or released as part of this deal.',
        recommendedVerification: [
          'Verify how the existing mortgage will be discharged or released as part of the transaction.',
          'Ask the lender in writing what it requires before the charge is removed.',
          'Confirm who pays the outstanding amount, and at what point in the payment schedule.'
        ],
        evidence: toEvidence(facts.mortgageEvidence),
        relatedFields: ['mortgagePresent', 'nocDetected'],
        // Fires on the ABSENCE of release wording, so incomplete coverage
        // genuinely weakens it — no unambiguous override here.
        confidence: resolveConfidence(facts, 'MEDIUM')
      })
    );
  }

  // RULE 8 — no property identifier located.
  //
  // Severity scales with document type: on a sale the identifier is what ties
  // the agreement to a title record, so its absence is HIGH_ATTENTION. On a
  // lease it is worth confirming but is not title-critical, and reporting every
  // tenancy at HIGH_ATTENTION would dilute the badge.
  if (facts.surveyNumbers.length === 0) {
    findings.push(
      makeFinding({
        ruleId: 'MISS_PROPERTY_ID_001',
        category: 'Property & Encumbrance',
        title: 'Property identifier not located',
        severity: isSaleLike(facts) ? 'HIGH_ATTENTION' : 'REVIEW',
        reason:
          'No survey number, Gat number or comparable property identifier was located in the analysed text.',
        simpleMeaning:
          'We could not find the official plot number that identifies exactly which piece of land this document covers.',
        recommendedVerification: [
          'Confirm the survey/Gat/CTS number of the property against the title record.',
          'Check that the identifier in the agreement matches the 7/12 extract or property card.'
        ],
        relatedFields: ['surveyNumbers'],
        confidence: resolveConfidence(facts, 'MEDIUM')
      })
    );
  }

  // RULE 10 — the same parcel referenced by inconsistent identifiers.
  //
  // Conservative by design: a genuine multi-parcel sale (Gat 142/3A + 142/3B +
  // 145) is normal and must not be flagged. Only sub-divisions of the SAME base
  // parcel that disagree are reported, e.g. "GAT 142/3A" alongside a bare
  // "GAT 142" — which usually means one mention lost its sub-division suffix.
  const conflicts = findIdentifierConflicts(facts.surveyNumbers.map((s) => s.value));
  if (conflicts.length > 0) {
    findings.push(
      makeFinding({
        ruleId: 'PROP_ID_CONFLICT_001',
        category: 'Property & Encumbrance',
        title: 'Property identifiers appear inconsistent',
        severity: 'HIGH_ATTENTION',
        reason: `Different property identifiers appear across the document and should be verified (${conflicts.join('; ')}).`,
        simpleMeaning:
          'The same plot seems to be written differently in different places. One version may be missing part of the plot number.',
        recommendedVerification: [
          'Confirm the exact sub-division of the plot against the land record.',
          'Ensure every clause refers to the property using the identical identifier.'
        ],
        evidence: toEvidence(facts.surveyNumbers, 4),
        relatedFields: ['surveyNumbers'],
        confidence: resolveConfidence(facts, 'LOW')
      })
    );
  }

  return findings;
}

/**
 * Detects a bare base parcel used alongside its own sub-divisions.
 *
 * "GAT 142" + "GAT 142/3A" is reported. "GAT 142/3A" + "GAT 142/3B" is not —
 * those are two real parcels in one sale.
 */
function findIdentifierConflicts(values: string[]): string[] {
  const unique = Array.from(new Set(values));
  const conflicts: string[] = [];

  for (const value of unique) {
    if (value.includes('/')) continue;
    const subdivided = unique.filter((other) => other !== value && other.startsWith(`${value}/`));
    if (subdivided.length > 0) {
      conflicts.push(`${value} vs ${subdivided.join(', ')}`);
    }
  }

  return conflicts;
}
