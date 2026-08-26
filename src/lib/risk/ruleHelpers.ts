/**
 * Shared helpers for building findings, so every rule pack produces findings
 * with consistent evidence, confidence and wording.
 */

import type {
  FactOccurrence,
  NormalizedFacts,
  RiskConfidence,
  RiskEvidence,
  RiskFinding,
  RiskSeverity
} from './types';

/** Relative weights used for ordering findings and scoring the document. */
export const SEVERITY_SCORE: Record<RiskSeverity, number> = {
  HIGH_ATTENTION: 30,
  REVIEW: 10,
  STANDARD: 0
};

export function toEvidence<T>(occurrences: FactOccurrence<T>[], limit = 3): RiskEvidence[] {
  return occurrences.slice(0, limit).map((o) => ({
    page: o.page,
    sourceText: o.sourceText,
    clauseId: o.clauseId,
    sourceFile: o.sourceFile
  }));
}

/**
 * Resolves the confidence label for a finding.
 *
 * `base` is what the rule would claim given perfect coverage. It is downgraded
 * one step when the document was not fully analyzed, because a rule that fires
 * on absence ("no witness found") is only as trustworthy as the coverage behind
 * it — unless the rule says its evidence is unambiguous regardless.
 */
export function resolveConfidence(
  facts: NormalizedFacts,
  base: RiskConfidence,
  options: { unambiguous?: boolean } = {}
): RiskConfidence {
  if (facts.fullyAnalyzed || options.unambiguous) return base;
  if (base === 'HIGH') return 'MEDIUM';
  if (base === 'MEDIUM') return 'LOW';
  return 'LOW';
}

let counter = 0;

/** Resets the finding-id counter; call at the start of each engine run. */
export function resetFindingIds(): void {
  counter = 0;
}

export function makeFinding(input: {
  ruleId: string;
  category: string;
  title: string;
  severity: RiskSeverity;
  reason: string;
  simpleMeaning?: string;
  recommendedVerification?: string[];
  evidence?: RiskEvidence[];
  relatedFields?: string[];
  confidence?: RiskConfidence;
}): RiskFinding {
  counter += 1;
  return {
    id: `RF${String(counter).padStart(3, '0')}`,
    ruleId: input.ruleId,
    category: input.category,
    title: input.title,
    severity: input.severity,
    score: SEVERITY_SCORE[input.severity],
    reason: input.reason,
    simpleMeaning: input.simpleMeaning,
    recommendedVerification: input.recommendedVerification,
    evidence: input.evidence?.filter((e) => e.page !== undefined || e.sourceText || e.clauseId),
    relatedFields: input.relatedFields,
    confidence: input.confidence,
    sourceType: 'RULE_ENGINE'
  };
}

/** True when this document looks like a sale/transfer of property. */
export function isSaleLike(facts: NormalizedFacts): boolean {
  return /sale|sell|purchase|transfer|conveyance|agreement\s+to\s+sell|deed/i.test(facts.documentType);
}
