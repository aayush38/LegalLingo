/**
 * Payment rule pack — forfeiture consequences and time-bound obligations.
 */

import type { NormalizedFacts, RiskFinding } from './types';
import { makeFinding, resolveConfidence, toEvidence } from './ruleHelpers';

export const PAYMENT_RULE_IDS = ['PAY_FORFEIT_001', 'PAY_DEADLINE_001'] as const;

export function paymentRules(facts: NormalizedFacts): RiskFinding[] {
  const findings: RiskFinding[] = [];

  // RULE 3 — forfeiture consequence attached to payment or performance
  if (facts.forfeitureDetected) {
    findings.push(
      makeFinding({
        ruleId: 'PAY_FORFEIT_001',
        category: 'Payment & Obligations',
        title: 'Forfeiture consequence identified',
        severity: 'HIGH_ATTENTION',
        reason: 'A forfeiture consequence has been linked to payment or performance.',
        simpleMeaning:
          'The document says money already paid can be kept by the other side if a condition is not met.',
        recommendedVerification: [
          'Confirm exactly which amount can be forfeited, and under what conditions.',
          'Check whether a written notice period or grace period applies before forfeiture takes effect.',
          'Consider whether the consequence is balanced against the other party obligations.'
        ],
        evidence: toEvidence(facts.forfeitureEvidence),
        relatedFields: ['forfeitureDetected'],
        confidence: resolveConfidence(facts, 'HIGH', { unambiguous: true })
      })
    );
  }

  // RULE 4 — time-bound payment obligation
  if (facts.paymentDeadlines.length > 0) {
    const dates = facts.paymentDeadlines.map((d) => d.value).slice(0, 3).join(', ');
    findings.push(
      makeFinding({
        ruleId: 'PAY_DEADLINE_001',
        category: 'Payment & Obligations',
        title: 'Time-bound payment obligation identified',
        severity: 'REVIEW',
        reason: `The agreement contains a time-bound payment obligation (${dates}).`,
        simpleMeaning: 'There is a deadline by which money has to be paid.',
        recommendedVerification: [
          'Confirm the exact deadline and diarise it well in advance.',
          'Check what happens if the deadline is missed, and whether an extension is possible.',
          'If funding depends on a loan approval, confirm the timeline is realistic.'
        ],
        evidence: toEvidence(facts.paymentDeadlines),
        relatedFields: ['paymentDeadlines'],
        confidence: resolveConfidence(facts, 'HIGH', { unambiguous: true })
      })
    );
  }

  return findings;
}
