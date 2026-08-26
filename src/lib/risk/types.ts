/**
 * Risk Engine type contracts.
 *
 * This is an ATTENTION engine, not a legal-validity engine. Nothing here may
 * assert that a document is valid, invalid, legal, illegal, safe or fraudulent
 * — findings say what should be checked, and always carry the evidence and the
 * rule id that produced them.
 */

export type RiskSeverity = 'STANDARD' | 'REVIEW' | 'HIGH_ATTENTION';

export type RiskConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

/** A single observation of a fact, kept with the evidence that produced it. */
export interface FactOccurrence<T> {
  value: T;
  page?: number;
  sourceText?: string;
  /** Which uploaded file this came from, for multi-file submissions. */
  sourceFile?: string;
  /** Clause id when the fact was read out of an extracted clause. */
  clauseId?: string;
}

export interface RiskEvidence {
  page?: number;
  sourceText?: string;
  clauseId?: string;
  sourceFile?: string;
}

/**
 * Placeholder for the RAG phase — a finding will later be able to cite a real
 * statutory or advisory source. Deliberately unpopulated: never hardcode a
 * fake legal citation here.
 */
export interface RiskLegalBasis {
  sourceId?: string;
  title?: string;
  url?: string;
  lastVerified?: string;
}

export interface RiskFinding {
  id: string;
  ruleId: string;
  category: string;
  title: string;
  severity: RiskSeverity;
  /** Relative weight used for ordering and for the document attention score. */
  score: number;
  reason: string;
  simpleMeaning?: string;
  recommendedVerification?: string[];
  evidence?: RiskEvidence[];
  relatedFields?: string[];
  confidence?: RiskConfidence;
  sourceType: 'RULE_ENGINE';
  legalBasis?: RiskLegalBasis;
}

export interface RiskEngineSummary {
  highAttention: number;
  review: number;
  standard: number;
}

export interface RiskEngineResult {
  findings: RiskFinding[];
  summary: RiskEngineSummary;
  /** Rule ids evaluated on this document, whether or not they fired. */
  checksRun: string[];
  version: string;
}

/**
 * Normalized, evidence-carrying view of a sale-type agreement.
 *
 * Populated only from document-derived text (raw OCR, paragraph originals,
 * clause originalText) and structured extraction — never from the model's
 * advisory prose, because "obtain an NOC" is a recommendation, not evidence
 * that an NOC exists.
 */
export interface SaleAgreementFacts {
  sellerNames: FactOccurrence<string>[];
  buyerNames: FactOccurrence<string>[];

  consideration?: FactOccurrence<number>;
  advancePaid?: FactOccurrence<number>;
  balanceAmount?: FactOccurrence<number>;
  mortgageAmount?: FactOccurrence<number>;

  mortgagePresent: boolean;
  mortgageEvidence: FactOccurrence<string>[];

  nocDetected: boolean;
  nocEvidence: FactOccurrence<string>[];

  paymentDeadlines: FactOccurrence<string>[];
  possessionDates: FactOccurrence<string>[];

  surveyNumbers: FactOccurrence<string>[];
  propertyDescriptions: FactOccurrence<string>[];

  witnessNames: FactOccurrence<string>[];
  witnessMentioned: boolean;

  registrationDetailsPresent: boolean;

  forfeitureDetected: boolean;
  forfeitureEvidence: FactOccurrence<string>[];

  identifiers: FactOccurrence<string>[];
  addresses: FactOccurrence<string>[];
}

export interface NormalizedFacts extends SaleAgreementFacts {
  /** Mirrors analysisMeta.fullyAnalyzed; false downgrades finding confidence. */
  fullyAnalyzed: boolean;
  documentType: string;
}

/** Signature every rule pack module exposes. */
export type RiskRule = (facts: NormalizedFacts) => RiskFinding[];
