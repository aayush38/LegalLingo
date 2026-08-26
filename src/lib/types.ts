export type LanguageCode = 'en' | 'hi' | 'mr' | 'gu';

export type DocumentRole = 'primary' | 'supporting';

export interface UploadedFileItem {
  id: string;
  file: File;
  role: DocumentRole;
  previewUrl?: string;
}

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
];

export interface Party {
  role: string; // Seller, Buyer, Tenant, Landlord, Borrower, Lender, etc.
  name: string;
  details?: string;
}

export interface KeyInformationItem {
  label: string;
  value: string;
  iconName?: string;
}

export interface FiveQuestions {
  documentType: string;
  partiesInvolved: {
    seller?: string;
    buyer?: string;
    tenant?: string;
    landlord?: string;
    parties?: string[];
  };
  totalAmount: string;
  missingPoints: string;
  nextStepsSummary: string;
}

export interface ClauseAnalysis {
  id: string;
  clauseTitle: string;
  originalText: string;
  simpleMeaning: string;
  whyItMatters: string;
  recommendedAction: string;
  riskLevel: 'high' | 'review' | 'standard'; // 🔴, 🟠, 🟢
  category?: string;
  page?: number;
  /** Which uploaded file this came from — only set for multi-file uploads. */
  sourceFile?: string;
}

export interface MissingInfoItem {
  id: string;
  title: string;
  whyItMatters: string;
  whatYouCanDo: string;
  severity: 'high' | 'medium' | 'low';
  page?: number;
  /** Which uploaded file this came from — only set for multi-file uploads. */
  sourceFile?: string;
}

export interface AnalyzedFileInfo {
  fileName: string;
  /** Inclusive page range this file occupies in the combined document. */
  startPage: number;
  endPage: number;
  pageCount: number;
}

export interface AnalysisMeta {
  fullyAnalyzed: boolean;
  totalPages: number;
  /** Number of source files combined into this analysis (1 for a single upload). */
  totalFiles: number;
  files: AnalyzedFileInfo[];
  totalChunks: number;
  chunksSucceeded: number;
  chunksFailed: number;
  warnings: string[];
  /** Total LLM completions issued (chunk extractions + synthesis). */
  llmCalls: number;
  /** Which provider/model actually served this analysis. */
  provider: string;
  model: string;
  totalMs: number;
}

export interface LegalTerm {
  term: string;
  simpleMeaning: string;
  simpleExample: string;
}

export interface RelevantService {
  id: string;
  title: string;
  whyRelevant: string;
  officialUrl?: string;
  actionText: string;
}

export interface CompletenessBreakdown {
  identityInfo: number;
  propertyInfo: number;
  financialInfo: number;
  importantClauses: number;
  witnessInfo: number;
  registrationInfo: number;
}

export interface DocumentAnalysis {
  id: string;
  documentTitle: string;
  documentType: string;
  classificationConfidence: number; // 0 - 100%
  understandingScore: number; // 0 - 100
  status: 'Needs Attention' | 'Looks Standard' | 'High Risk';
  originalText: string;
  paragraphs: { id: number; original: string; simple: string; page?: number; sourceFile?: string }[];
  summary: string;
  verySimpleSummary: string;
  extraSimpleSummary?: string;
  fiveQuestions: FiveQuestions;
  parties: Party[];
  keyInformation: KeyInformationItem[];
  importantClauses: ClauseAnalysis[];
  missingInformation: MissingInfoItem[];
  legalTerms: LegalTerm[];
  recommendedActions: { id: string; text: string; completed: boolean }[];
  relevantServices: RelevantService[];
  completenessBreakdown: CompletenessBreakdown;
  createdAt: string;
  ocrConfidence?: number;
  isScanned?: boolean;
  /** Names of every file in this submission — length > 1 for multi-file uploads. */
  sourceFiles?: string[];
  analysisMeta?: AnalysisMeta;
}

export interface GovernmentScheme {
  id: string;
  name: string;
  category: string;
  description: string;
  whyMatches: string;
  eligibility: {
    states: string[];
    occupations: string[];
    incomeLimit?: string;
    landholdingLimit?: string;
    details: string[];
  };
  requiredDocuments: string[];
  officialUrl: string;
  matchScore: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  audioUrl?: string;
}
