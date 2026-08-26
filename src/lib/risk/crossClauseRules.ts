/**
 * Cross-clause validation — compares facts that are repeated in more than one
 * place and reports only meaningful disagreement.
 *
 * The hard part here is NOT detecting difference, it is suppressing difference
 * that is legitimate. A sale can genuinely span several parcels, have several
 * payment stages with different dates, and quote several amounts. Each check
 * below therefore states explicitly why a difference is or is not suspicious;
 * where it cannot tell, it stays silent rather than producing a false positive.
 *
 * Name comparison is handled by identityRules (ID_SELLER_CONFLICT_001 /
 * ID_BUYER_CONFLICT_001) and is deliberately not duplicated here.
 */

import type { FactOccurrence, NormalizedFacts, RiskFinding } from './types';
import { makeFinding, resolveConfidence, toEvidence } from './ruleHelpers';
import { formatIndianAmount, normalizeDate } from './textUtils';

export const CROSS_CLAUSE_RULE_IDS = [
  'XC_DEADLINE_CONFLICT_001',
  'XC_POSSESSION_CONFLICT_001'
] as const;

/**
 * Number of distinct dates beyond which a set stops looking like a conflict and
 * starts looking like a genuine instalment schedule.
 */
const SCHEDULE_THRESHOLD = 3;

export function crossClauseRules(facts: NormalizedFacts): RiskFinding[] {
  const findings: RiskFinding[] = [];

  const deadlineConflict = detectDateDisagreement(facts.paymentDeadlines);
  if (deadlineConflict) {
    findings.push(
      makeFinding({
        ruleId: 'XC_DEADLINE_CONFLICT_001',
        category: 'Cross-Clause Consistency',
        title: 'Payment deadline stated differently in more than one place',
        severity: 'REVIEW',
        reason: `More than one payment deadline appears for what looks like the same obligation: ${deadlineConflict.values.join(' and ')}. Confirm which date governs.`,
        simpleMeaning:
          'Two different payment dates appear in the document. If they refer to the same payment, one of them is wrong.',
        recommendedVerification: [
          'Confirm which date is the operative payment deadline.',
          'If these are separate instalments, check that each one is clearly labelled.'
        ],
        evidence: toEvidence(deadlineConflict.occurrences, 3),
        relatedFields: ['paymentDeadlines'],
        confidence: resolveConfidence(facts, 'LOW')
      })
    );
  }

  const possessionConflict = detectDateDisagreement(facts.possessionDates);
  if (possessionConflict) {
    findings.push(
      makeFinding({
        ruleId: 'XC_POSSESSION_CONFLICT_001',
        category: 'Cross-Clause Consistency',
        title: 'Possession date stated differently in more than one place',
        severity: 'REVIEW',
        reason: `More than one possession date appears in the document: ${possessionConflict.values.join(' and ')}. Confirm which date governs.`,
        simpleMeaning:
          'The document gives more than one date for when you get possession of the property.',
        recommendedVerification: [
          'Confirm the actual date on which possession transfers.',
          'Check whether possession is conditional on a payment milestone.'
        ],
        evidence: toEvidence(possessionConflict.occurrences, 3),
        relatedFields: ['possessionDates'],
        confidence: resolveConfidence(facts, 'LOW')
      })
    );
  }

  return findings;
}

interface DateDisagreement {
  values: string[];
  occurrences: FactOccurrence<string>[];
}

/**
 * Reports exactly two distinct dates as a possible conflict.
 *
 * Three or more distinct dates almost always means a real instalment or
 * milestone schedule, so the check backs off — the cost of a false "conflict"
 * on every staged-payment agreement is far worse than missing an ambiguous one.
 */
function detectDateDisagreement(dates: FactOccurrence<string>[]): DateDisagreement | null {
  if (dates.length < 2) return null;

  const byNormalized = new Map<string, FactOccurrence<string>>();
  for (const occurrence of dates) {
    const key = normalizeDate(occurrence.value);
    if (!byNormalized.has(key)) byNormalized.set(key, occurrence);
  }

  const distinct = [...byNormalized.values()];
  if (distinct.length !== 2) return null;

  if (distinct.length >= SCHEDULE_THRESHOLD) return null;

  return {
    values: distinct.map((d) => d.value),
    occurrences: distinct
  };
}

/**
 * Compares two amounts that should describe the same figure.
 * Exported for reuse; kept here so all cross-clause comparison logic lives
 * together even though only the financial pack currently calls it.
 */
export function amountsDisagree(a: number, b: number, tolerance = 1000): boolean {
  return Math.abs(a - b) > tolerance;
}

export function describeAmountGap(a: number, b: number): string {
  return `${formatIndianAmount(a)} vs ${formatIndianAmount(b)}`;
}
