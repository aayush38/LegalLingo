/**
 * Financial rule pack — reconciliation of payment components against the
 * stated total consideration.
 */

import type { NormalizedFacts, RiskFinding } from './types';
import { makeFinding, resolveConfidence } from './ruleHelpers';
import { formatIndianAmount } from './textUtils';

export const FINANCIAL_RULE_IDS = ['FIN_RECON_001'] as const;

/**
 * Tolerance for reconciliation, as a fraction of the total.
 *
 * Rounding in drafting, and amounts recovered via OCR, routinely differ by a
 * few hundred rupees. Flagging that would train users to ignore the finding,
 * so only a material gap (>1%, and at least ₹1,000) is reported.
 */
const TOLERANCE_RATIO = 0.01;
const TOLERANCE_FLOOR = 1000;

export function financialRules(facts: NormalizedFacts): RiskFinding[] {
  const findings: RiskFinding[] = [];

  const total = facts.consideration?.value;
  const components = [facts.advancePaid, facts.mortgageAmount, facts.balanceAmount].filter(
    (c): c is NonNullable<typeof c> => c !== undefined
  );

  // Needs a total and at least two components — reconciling a total against a
  // single component would just be comparing two unrelated numbers.
  if (total === undefined || components.length < 2) return findings;

  const sum = components.reduce((acc, c) => acc + c.value, 0);
  const difference = Math.abs(sum - total);
  const tolerance = Math.max(total * TOLERANCE_RATIO, TOLERANCE_FLOOR);

  if (difference <= tolerance) return findings;

  const parts: string[] = [];
  if (facts.advancePaid) parts.push(`advance ${formatIndianAmount(facts.advancePaid.value)}`);
  if (facts.mortgageAmount) parts.push(`loan/mortgage ${formatIndianAmount(facts.mortgageAmount.value)}`);
  if (facts.balanceAmount) parts.push(`balance ${formatIndianAmount(facts.balanceAmount.value)}`);

  findings.push(
    makeFinding({
      ruleId: 'FIN_RECON_001',
      category: 'Financial Consistency',
      title: 'Payment components do not reconcile with the total',
      severity: 'HIGH_ATTENTION',
      reason: `The payment components do not reconcile with the stated total consideration. Components (${parts.join(' + ')}) total ${formatIndianAmount(sum)}, against a stated consideration of ${formatIndianAmount(total)} — a difference of ${formatIndianAmount(difference)}.`,
      simpleMeaning:
        'The individual amounts in the document do not add up to the total price stated. One of the figures may be wrong, or a payment may be unaccounted for.',
      recommendedVerification: [
        'Re-check each amount against the document, including any amount written in words.',
        'Confirm whether a further payment, deduction or expense accounts for the difference.',
        'Ensure the figures in words and figures in numerals agree throughout.'
      ],
      evidence: [
        facts.consideration && {
          page: facts.consideration.page,
          sourceText: facts.consideration.sourceText,
          clauseId: facts.consideration.clauseId
        },
        ...components.map((c) => ({ page: c.page, sourceText: c.sourceText, clauseId: c.clauseId }))
      ].filter((e): e is NonNullable<typeof e> => Boolean(e)),
      relatedFields: ['consideration', 'advancePaid', 'mortgageAmount', 'balanceAmount'],
      confidence: resolveConfidence(facts, 'MEDIUM')
    })
  );

  return findings;
}
