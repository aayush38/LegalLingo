import { DocumentAnalysis, LanguageCode } from './types';
import { PageText } from './ocr';

/**
 * AI Document Analysis Service for LegalLingo.
 */
export async function analyzeDocumentText(
  extractedText: string,
  fileName: string = 'Uploaded Document',
  pages?: PageText[]
): Promise<DocumentAnalysis> {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pages: pages && pages.length > 0 ? pages : [{ pageNumber: 1, text: extractedText }],
        fileName
      })
    });

    if (response.ok) {
      const data = await response.json();
      return {
        id: `doc-${Date.now()}`,
        documentTitle: fileName || 'Uploaded Legal Document',
        originalText: extractedText,
        createdAt: new Date().toISOString(),
        ...data
      } as DocumentAnalysis;
    }

    console.warn('[analyzeDocumentText] /api/analyze returned', response.status, '- using offline fallback');
  } catch (e) {
    console.warn('[analyzeDocumentText] /api/analyze request failed, using offline fallback:', e);
  }

  return generateOfflineAnalysis(extractedText, fileName);
}

const JARGON_GLOSSARY: { term: string; simpleMeaning: string; simpleExample: string }[] = [
  { term: 'Encumbrance', simpleMeaning: 'A legal liability, mortgage, or debt attached to a property title.', simpleExample: 'A bank loan against a house is an encumbrance on that property.' },
  { term: 'Forfeiture', simpleMeaning: 'Losing money or rights as a penalty for breaking the terms of an agreement.', simpleExample: 'If you miss a payment deadline, your advance may be forfeited.' },
  { term: 'Indemnity', simpleMeaning: 'A promise by one party to compensate the other for a specific loss or damage.', simpleExample: 'The seller indemnifies the buyer against future ownership disputes.' },
  { term: 'Sub-Registrar', simpleMeaning: 'The government official who officially registers property and legal documents.', simpleExample: 'The sale deed must be signed at the Sub-Registrar office.' },
  { term: 'Consideration', simpleMeaning: 'The price or value being exchanged in an agreement.', simpleExample: 'The total consideration for the property is ₹18,50,000.' },
  { term: 'Mortgage', simpleMeaning: 'Using property as security for a loan.', simpleExample: 'The land is under mortgage to the bank until the loan is repaid.' },
  { term: 'Lessee', simpleMeaning: 'The person renting or leasing a property from its owner.', simpleExample: 'The lessee must pay rent on the 5th of every month.' },
  { term: 'Lessor', simpleMeaning: 'The owner who rents or leases out a property.', simpleExample: 'The lessor is responsible for major structural repairs.' },
  { term: 'Arbitration', simpleMeaning: 'Settling a dispute outside court through a neutral third party.', simpleExample: 'Any dispute will be resolved through arbitration in Pune.' },
  { term: 'Power of Attorney', simpleMeaning: 'A legal document letting someone act on your behalf.', simpleExample: 'The seller signed a power of attorney allowing his son to complete the sale.' },
  { term: 'Deed', simpleMeaning: 'A signed legal document that transfers ownership or rights.', simpleExample: 'The sale deed transfers ownership of the property to the buyer.' },
  { term: 'Stamp Duty', simpleMeaning: 'A government tax paid when registering certain legal documents.', simpleExample: 'Stamp duty is calculated as a percentage of the property value.' },
  { term: 'Witness', simpleMeaning: 'A person who confirms that an agreement was signed correctly.', simpleExample: 'Two witnesses signed the agreement along with the buyer and seller.' },
  { term: 'Possession', simpleMeaning: 'Physical control or occupation of a property.', simpleExample: 'Possession will be handed over after the full payment is made.' },
  { term: 'Covenant', simpleMeaning: 'A formal promise within a legal agreement.', simpleExample: 'The seller covenants that the property has no pending litigation.' },
  { term: 'Termination', simpleMeaning: 'Ending an agreement before or at the end of its term.', simpleExample: 'Either party may terminate the agreement with 30 days notice.' },
  { term: 'Notice Period', simpleMeaning: 'The advance warning time required before ending an agreement.', simpleExample: 'The tenant must give a 2-month notice period before vacating.' },
  { term: 'Guarantor', simpleMeaning: 'A person who promises to repay a loan if the borrower fails to.', simpleExample: 'The loan requires a guarantor with a stable income.' },
  { term: 'Litigation', simpleMeaning: 'The process of taking legal action through the courts.', simpleExample: 'The property is currently free of any litigation.' },
  { term: 'Affidavit', simpleMeaning: 'A written statement sworn to be true, used as evidence.', simpleExample: 'The seller submitted an affidavit confirming sole ownership.' }
];

function splitIntoParagraphs(text: string): string[] {
  const byBlankLine = text.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 20);
  if (byBlankLine.length >= 2) return byBlankLine.slice(0, 8);

  const bySentenceGroups: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  for (let i = 0; i < sentences.length && bySentenceGroups.length < 8; i += 3) {
    const chunk = sentences.slice(i, i + 3).join(' ');
    if (chunk.length > 20) bySentenceGroups.push(chunk);
  }
  return bySentenceGroups.length > 0 ? bySentenceGroups : [text.slice(0, 1000)];
}

/**
 * Deterministic, non-LLM fallback used only when real AI analysis (/api/analyze)
 * is unavailable (no API key, quota, or network failure). Reflects the actual
 * uploaded text instead of fabricating content, but cannot truly "simplify" it.
 */
function generateOfflineAnalysis(text: string, fileName: string): DocumentAnalysis {
  const lower = text.toLowerCase();

  let docType = 'Legal Document';
  if (lower.includes('rent') || lower.includes('tenant') || lower.includes('lease')) {
    docType = 'Rent Agreement';
  } else if (lower.includes('loan') || lower.includes('borrower') || lower.includes('lender')) {
    docType = 'Loan Agreement';
  } else if (lower.includes('notice') || lower.includes('advocate')) {
    docType = 'Legal Notice';
  } else if (lower.includes('sale') || lower.includes('seller') || lower.includes('buyer') || lower.includes('vendor') || lower.includes('purchaser')) {
    docType = 'Sale Agreement';
  }

  const paragraphChunks = splitIntoParagraphs(text);
  const unavailableNote = ' (AI simplification unavailable — showing original text.)';

  const paragraphs = paragraphChunks.map((chunk, idx) => ({
    id: idx + 1,
    original: chunk,
    simple: chunk.length > 220 ? `${chunk.slice(0, 220)}...${unavailableNote}` : `${chunk}${unavailableNote}`
  }));

  const importantClauses = paragraphs.map((p) => ({
    id: `C${String(p.id).padStart(3, '0')}`,
    clauseTitle: `Section ${p.id}`,
    originalText: p.original,
    simpleMeaning: p.simple,
    whyItMatters: 'AI analysis is unavailable, so this clause has not been automatically risk-assessed. Please review it carefully or consult a legal professional.',
    recommendedAction: 'Review this section manually.',
    riskLevel: 'standard' as const,
    category: 'general'
  }));

  const foundTerms = JARGON_GLOSSARY.filter((j) => lower.includes(j.term.toLowerCase()));

  return {
    id: `doc-${Date.now()}`,
    documentTitle: fileName || 'Uploaded Legal Document',
    documentType: docType,
    classificationConfidence: 60,
    understandingScore: 50,
    status: 'Needs Attention',
    originalText: text,
    paragraphs,
    summary: 'AI analysis is currently unavailable. Showing the original document text broken into sections below.',
    verySimpleSummary: 'We could not run full AI analysis on this document right now. Please review the original text, or try again later.',
    fiveQuestions: {
      documentType: docType,
      partiesInvolved: { parties: ['Not automatically detected — AI analysis unavailable'] },
      totalAmount: 'Not automatically detected — AI analysis unavailable',
      missingPoints: 'AI analysis is unavailable, so missing information could not be automatically checked.',
      nextStepsSummary: 'Review the document manually, or consult a legal professional for a full assessment.'
    },
    parties: [],
    keyInformation: [],
    importantClauses,
    missingInformation: [
      {
        id: 'MI001',
        title: 'AI Analysis Unavailable',
        whyItMatters: 'Automatic risk and completeness checks could not run for this document.',
        whatYouCanDo: 'Try re-uploading later, or consult a legal professional for a full review.',
        severity: 'medium' as const
      }
    ],
    legalTerms: foundTerms,
    recommendedActions: [
      {
        id: 'A001',
        text: 'AI analysis was unavailable for this document — consider consulting a legal professional for a full review.',
        completed: false
      }
    ],
    relevantServices: [],
    completenessBreakdown: {
      identityInfo: 50,
      propertyInfo: 50,
      financialInfo: 50,
      importantClauses: 50,
      witnessInfo: 50,
      registrationInfo: 50
    },
    createdAt: new Date().toISOString()
  };
}

/**
 * Looks up a real Gemini-translated version of `text` from the per-language
 * cache built by AppContext (see collectTranslatableStrings / translateContent
 * below). Falls back to the original English text if not yet cached — never
 * shows stale or fabricated content.
 */
export function getTranslatedExplanation(
  text: string,
  lang: LanguageCode,
  cache?: Record<string, string>
): string {
  if (lang === 'en' || !text) return text;
  return cache?.[text] || text;
}

/**
 * Collects every user-facing, AI-generated string out of a DocumentAnalysis
 * that should be translated when the language changes. Order/dedup doesn't
 * matter — the caller (AppContext) dedupes before sending to /api/translate.
 */
export function collectTranslatableStrings(analysis: DocumentAnalysis): string[] {
  const strings: (string | undefined)[] = [
    analysis.documentType,
    analysis.summary,
    analysis.verySimpleSummary,
    analysis.extraSimpleSummary,
    analysis.fiveQuestions?.documentType,
    analysis.fiveQuestions?.totalAmount,
    analysis.fiveQuestions?.missingPoints,
    analysis.fiveQuestions?.nextStepsSummary,
    analysis.fiveQuestions?.partiesInvolved?.seller,
    analysis.fiveQuestions?.partiesInvolved?.buyer,
    analysis.fiveQuestions?.partiesInvolved?.tenant,
    analysis.fiveQuestions?.partiesInvolved?.landlord,
    ...(analysis.fiveQuestions?.partiesInvolved?.parties || []),
    ...(analysis.paragraphs || []).map((p) => p.simple),
    ...(analysis.importantClauses || []).flatMap((c) => [c.clauseTitle, c.simpleMeaning, c.whyItMatters, c.recommendedAction]),
    ...(analysis.missingInformation || []).flatMap((m) => [m.title, m.whyItMatters, m.whatYouCanDo]),
    ...(analysis.legalTerms || []).flatMap((t) => [t.term, t.simpleMeaning, t.simpleExample]),
    ...(analysis.recommendedActions || []).map((a) => a.text),
    ...(analysis.relevantServices || []).flatMap((s) => [s.title, s.whyRelevant, s.actionText])
  ];

  return Array.from(new Set(strings.filter((s): s is string => Boolean(s && s.trim()))));
}

/**
 * Translates a batch of strings via /api/translate and returns a
 * text -> translated-text map for the requested language.
 */
export async function translateStrings(
  strings: string[],
  targetLanguage: LanguageCode
): Promise<Record<string, string>> {
  if (strings.length === 0 || targetLanguage === 'en') return {};

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strings, targetLanguage })
    });

    if (!res.ok) {
      console.warn('[translateStrings] /api/translate returned', res.status);
      return {};
    }

    const data = await res.json();
    const translations: string[] = data.translations || [];
    const map: Record<string, string> = {};
    strings.forEach((original, i) => {
      if (translations[i]) map[original] = translations[i];
    });
    return map;
  } catch (e) {
    console.warn('[translateStrings] request failed:', e);
    return {};
  }
}
