/**
 * Risk Engine entry point.
 *
 * Deterministic and explainable: given the same DocumentAnalysis it always
 * produces the same findings, and every finding carries the ruleId that fired
 * plus the evidence it fired on. The LLM extracts and explains; this decides
 * what deserves attention.
 *
 * This is an attention engine, not a legal-validity engine.
 */

import type { DocumentAnalysis } from '../types';
import type { NormalizedFacts, RiskEngineResult, RiskFinding, RiskSeverity } from './types';
import { normalizeFacts } from './normalizeFacts';
import { resetFindingIds, SEVERITY_SCORE } from './ruleHelpers';
import { propertyRules, PROPERTY_RULE_IDS } from './propertyRules';
import { paymentRules, PAYMENT_RULE_IDS } from './paymentRules';
import { financialRules, FINANCIAL_RULE_IDS } from './financialRules';
import { identityRules, IDENTITY_RULE_IDS } from './identityRules';
import { missingInfoRules, MISSING_INFO_RULE_IDS } from './missingInfoRules';
import { crossClauseRules, CROSS_CLAUSE_RULE_IDS } from './crossClauseRules';

export const RISK_ENGINE_VERSION = 'risk-engine-v1';

/** Every rule id the engine evaluates, whether or not it fires. */
export const ALL_RULE_IDS: string[] = [
  ...PROPERTY_RULE_IDS,
  ...PAYMENT_RULE_IDS,
  ...FINANCIAL_RULE_IDS,
  ...IDENTITY_RULE_IDS,
  ...MISSING_INFO_RULE_IDS,
  ...CROSS_CLAUSE_RULE_IDS
];

const SEVERITY_ORDER: Record<RiskSeverity, number> = {
  HIGH_ATTENTION: 0,
  REVIEW: 1,
  STANDARD: 2
};

/**
 * Runs every rule pack over the normalized facts.
 *
 * Accepts pre-normalized facts so unit tests can drive rules directly without
 * constructing a full DocumentAnalysis.
 */
export function runRules(facts: NormalizedFacts): RiskFinding[] {
  resetFindingIds();

  return [
    ...propertyRules(facts),
    ...paymentRules(facts),
    ...financialRules(facts),
    ...identityRules(facts),
    ...missingInfoRules(facts),
    ...crossClauseRules(facts)
  ];
}

export function runRiskEngine(analysis: DocumentAnalysis): RiskEngineResult {
  const facts = normalizeFacts(analysis);
  const findings = runRules(facts).sort((a, b) => {
    const bySeverity = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (bySeverity !== 0) return bySeverity;
    return b.score - a.score;
  });

  return {
    findings,
    summary: summarize(findings),
    checksRun: ALL_RULE_IDS,
    version: RISK_ENGINE_VERSION
  };
}

export function summarize(findings: RiskFinding[]) {
  return {
    highAttention: findings.filter((f) => f.severity === 'HIGH_ATTENTION').length,
    review: findings.filter((f) => f.severity === 'REVIEW').length,
    // Findings are only emitted when a rule fires, so a STANDARD count here
    // reflects rules that fired at STANDARD severity, not rules that stayed quiet.
    standard: findings.filter((f) => f.severity === 'STANDARD').length
  };
}

/**
 * Maps a Risk Engine severity onto the existing ClauseAnalysis.riskLevel union,
 * so deterministic findings can drive the existing clause UI without changing
 * that component's contract.
 */
export function severityToRiskLevel(severity: RiskSeverity): 'high' | 'review' | 'standard' {
  if (severity === 'HIGH_ATTENTION') return 'high';
  if (severity === 'REVIEW') return 'review';
  return 'standard';
}

/** Total attention weight, useful for ordering documents in a list view. */
export function attentionScore(findings: RiskFinding[]): number {
  return findings.reduce((sum, f) => sum + (f.score || SEVERITY_SCORE[f.severity]), 0);
}

export { normalizeFacts };
