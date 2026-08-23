import { NextRequest, NextResponse } from 'next/server';
import { getRelevantServicesForDocType } from '@/lib/govtServices';
import { callGemini, parseGeminiJson, GeminiRequestError } from '@/lib/gemini';
import { splitIntoSections, buildChunks, dedupeItems, type Chunk, type PageInput } from '@/lib/documentChunking';

const CHUNK_CONCURRENCY = 3;
const CHUNK_RETRIES = 2;
const SYNTHESIS_RETRIES = 2;

interface ChunkParagraph {
  page: number;
  original: string;
  simple: string;
}
interface ChunkClause {
  clauseTitle: string;
  originalText: string;
  simpleMeaning: string;
  whyItMatters: string;
  recommendedAction: string;
  riskLevel: 'high' | 'review' | 'standard';
  category: string;
  page: number;
}
interface ChunkMissingInfo {
  title: string;
  whyItMatters: string;
  whatYouCanDo: string;
  severity: 'high' | 'medium' | 'low';
  page: number;
}
interface ChunkLegalTerm {
  term: string;
  simpleMeaning: string;
  simpleExample: string;
}
interface ChunkExtraction {
  chunkSummary: string;
  paragraphs: ChunkParagraph[];
  importantClauses: ChunkClause[];
  missingInformation: ChunkMissingInfo[];
  legalTerms: ChunkLegalTerm[];
}

const CHUNK_SCHEMA = `{
  "chunkSummary": "string - 1-2 sentence summary of what this excerpt of the document covers",
  "paragraphs": [ { "page": "number - the [[PAGE N]] marker nearest above this text", "original": "string - the actual original text from this excerpt", "simple": "string - plain language explanation" } ],
  "importantClauses": [ { "clauseTitle": "string", "originalText": "string - actual clause text from this excerpt", "simpleMeaning": "string", "whyItMatters": "string", "recommendedAction": "string", "riskLevel": "'high' | 'review' | 'standard'", "category": "string", "page": "number - nearest [[PAGE N]] marker above" } ],
  "missingInformation": [ { "title": "string", "whyItMatters": "string", "whatYouCanDo": "string", "severity": "'high' | 'medium' | 'low'", "page": "number - nearest [[PAGE N]] marker above" } ],
  "legalTerms": [ { "term": "string - a difficult/legal word that actually appears in this excerpt", "simpleMeaning": "string", "simpleExample": "string" } ]
}`;

async function extractChunk(chunk: Chunk, fileName: string): Promise<{ chunk: Chunk; data?: ChunkExtraction; error?: string }> {
  const prompt = `You are LegalLingo, an AI assistant that helps Indian citizens understand legal and civic documents in plain language.

This is EXCERPT ${chunk.index + 1} (pages ${chunk.startPage}-${chunk.endPage}) of a larger document named "${fileName}". The excerpt contains "[[PAGE N]]" markers showing which page each section came from — use the nearest marker above a piece of text as its "page" value.

Extract structured information from ONLY this excerpt and return ONLY a valid JSON object matching exactly this structure:

${CHUNK_SCHEMA}

Rules:
- Base everything strictly on the actual text below. Do not invent names, amounts, or clauses that are not present.
- Extract EVERY distinct clause/section/paragraph present in this excerpt — do not skip any and do not artificially limit the count.
- Write all explanations in simple, plain language suitable for a citizen with no legal background.
- Only include terms in "legalTerms" that actually appear in this excerpt.
- This is a partial excerpt of a larger document, so it is normal and expected if it starts or ends mid-topic.

Excerpt Text:
"""
${chunk.text}
"""`;

  try {
    const rawText = await callGemini(prompt, 0.2, true, { maxRetries: CHUNK_RETRIES });
    const data = parseGeminiJson<ChunkExtraction>(rawText);
    return { chunk, data };
  } catch (e) {
    const message = e instanceof GeminiRequestError ? e.message : e instanceof Error ? e.message : 'Unknown error';
    console.error(`[api/analyze] Chunk ${chunk.index} (pages ${chunk.startPage}-${chunk.endPage}) failed:`, message);
    return { chunk, error: message };
  }
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const idx = nextIndex++;
      results[idx] = await fn(items[idx]);
    }
  }

  const workerCount = Math.min(limit, items.length) || 1;
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

const SYNTHESIS_SCHEMA = `{
  "documentType": "string - the actual type of this document, e.g. Sale Agreement, Rent Agreement, Loan Agreement, Master Services Agreement, Legal Notice, Affidavit, Will, Power of Attorney, etc.",
  "classificationConfidence": "number 0-100",
  "understandingScore": "number 0-100, how complete/clear this document is for a citizen to understand",
  "status": "'Needs Attention' | 'Looks Standard' | 'High Risk'",
  "summary": "string - 1-2 sentence factual summary of the whole document",
  "verySimpleSummary": "string - 2-4 sentence plain-language summary a layperson can understand",
  "extraSimpleSummary": "string - an even shorter, extremely simple 1-2 sentence version",
  "fiveQuestions": {
    "documentType": "string",
    "partiesInvolved": {
      "seller": "string, only if this is a sale-type document, else omit",
      "buyer": "string, only if this is a sale-type document, else omit",
      "tenant": "string, only if this is a rent/lease-type document, else omit",
      "landlord": "string, only if this is a rent/lease-type document, else omit",
      "parties": "string[] - use this generic list instead if the document type doesn't fit seller/buyer or tenant/landlord roles"
    },
    "totalAmount": "string - key monetary figure(s) in the document, or 'Not specified' if none",
    "missingPoints": "string - key missing/unclear information a citizen should know about, across the whole document",
    "nextStepsSummary": "string - short numbered plain-language next steps"
  },
  "completenessBreakdown": { "identityInfo": "0-100", "propertyInfo": "0-100", "financialInfo": "0-100", "importantClauses": "0-100", "witnessInfo": "0-100", "registrationInfo": "0-100" },
  "recommendedActions": [ "string - a concrete action item for the citizen, covering the whole document" ]
}`;

async function synthesizeDocumentLevel(
  fileName: string,
  chunkSummaries: string[],
  clauseDigest: string,
  openingText: string
): Promise<Record<string, unknown>> {
  const prompt = `You are LegalLingo, an AI assistant that helps Indian citizens understand legal and civic documents in plain language.

You are given a per-section digest of a document named "${fileName}" that was too long to analyze in one pass, plus the opening text for concrete grounding (names, dates, parties). Using ONLY this information, produce a document-level summary.

Return ONLY a valid JSON object matching exactly this structure:

${SYNTHESIS_SCHEMA}

Rules:
- Base everything strictly on the digest and opening text below. Do not invent facts not implied by them.
- Produce 3-8 "recommendedActions" covering the most important things a citizen should do, drawn from the clause digest.
- Write all explanations in simple, plain language suitable for a citizen with no legal background.

OPENING TEXT (first part of the document):
"""
${openingText}
"""

SECTION-BY-SECTION DIGEST (in document order):
${chunkSummaries.map((s, i) => `${i + 1}. ${s}`).join('\n')}

KEY CLAUSES FOUND (title [risk level]):
${clauseDigest}`;

  const rawText = await callGemini(prompt, 0.3, true, { maxRetries: SYNTHESIS_RETRIES });
  return parseGeminiJson<Record<string, unknown>>(rawText);
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let geminiCalls = 0;

  try {
    const body = await req.json();
    const fileName: string = body.fileName || 'Uploaded Document';

    let pages: PageInput[] = Array.isArray(body.pages) ? body.pages : [];
    if (pages.length === 0 && typeof body.text === 'string') {
      // Backward-compatible fallback for callers still sending the old {text} shape.
      pages = [{ pageNumber: 1, text: body.text }];
    }
    pages = pages.filter((p) => p && typeof p.text === 'string' && p.text.trim());

    if (pages.length === 0) {
      return NextResponse.json({ error: 'No document text provided' }, { status: 400 });
    }

    const sections = splitIntoSections(pages);
    const chunks = buildChunks(sections);

    if (chunks.length === 0) {
      return NextResponse.json({ error: 'No analyzable text found in document' }, { status: 400 });
    }

    // --- Chunk-level extraction (batched, concurrency-limited, retried) ---
    const chunkResults = await mapWithConcurrency(chunks, CHUNK_CONCURRENCY, (chunk) => extractChunk(chunk, fileName));
    geminiCalls += chunks.length;

    const succeeded = chunkResults.filter((r) => r.data);
    const failed = chunkResults.filter((r) => !r.data);

    // --- Deterministic merge, in document order ---
    // Gemini doesn't always echo the [[PAGE N]] marker back as a JSON number
    // (sometimes a numeric string) — coerce so `page` is always a real number.
    const toPage = (value: unknown, fallback: number): number => {
      const n = Number(value);
      return Number.isFinite(n) && n > 0 ? n : fallback;
    };

    let paragraphs = succeeded.flatMap((r) =>
      (r.data!.paragraphs || []).map((p) => ({ page: toPage(p.page, r.chunk.startPage), original: p.original, simple: p.simple }))
    );
    let clauses = succeeded.flatMap((r) =>
      (r.data!.importantClauses || []).map((c) => ({ ...c, page: toPage(c.page, r.chunk.startPage) }))
    );
    let missingInfo = succeeded.flatMap((r) =>
      (r.data!.missingInformation || []).map((m) => ({ ...m, page: toPage(m.page, r.chunk.startPage) }))
    );
    let legalTerms = succeeded.flatMap((r) => r.data!.legalTerms || []);

    paragraphs = dedupeItems(paragraphs, (p) => p.original);
    clauses = dedupeItems(clauses, (c) => c.originalText || c.clauseTitle);
    missingInfo = dedupeItems(missingInfo, (m) => m.title);
    legalTerms = dedupeItems(legalTerms, (t) => t.term);

    const finalParagraphs = paragraphs.map((p, i) => ({ id: i + 1, original: p.original, simple: p.simple, page: p.page }));
    const finalClauses = clauses.map((c, i) => ({
      id: `C${String(i + 1).padStart(3, '0')}`,
      clauseTitle: c.clauseTitle,
      originalText: c.originalText,
      simpleMeaning: c.simpleMeaning,
      whyItMatters: c.whyItMatters,
      recommendedAction: c.recommendedAction,
      riskLevel: c.riskLevel,
      category: c.category,
      page: c.page
    }));
    const finalMissingInfo = missingInfo.map((m, i) => ({
      id: `M${String(i + 1).padStart(3, '0')}`,
      title: m.title,
      whyItMatters: m.whyItMatters,
      whatYouCanDo: m.whatYouCanDo,
      severity: m.severity,
      page: m.page
    }));

    // --- Document-level synthesis over chunk summaries (not raw text again) ---
    const chunkSummaries = succeeded.map((r) => r.data!.chunkSummary).filter(Boolean);
    const clauseDigest = finalClauses.map((c) => `${c.clauseTitle} [${c.riskLevel}]`).join('\n') || '(none extracted)';
    const openingText = pages.map((p) => p.text).join('\n\n').slice(0, 3000);

    let synthesis: Record<string, unknown>;
    try {
      synthesis = await synthesizeDocumentLevel(fileName, chunkSummaries, clauseDigest, openingText);
      geminiCalls += 1;
    } catch (e) {
      console.error('[api/analyze] Synthesis call failed:', e);
      geminiCalls += 1;
      synthesis = {
        documentType: 'Legal Document',
        classificationConfidence: 50,
        understandingScore: 50,
        status: 'Needs Attention',
        summary: 'AI summary generation failed for this document, but clause-level analysis below is still based on the real document text.',
        verySimpleSummary: 'We could not generate an overall summary, but you can review the extracted clauses and paragraphs below.',
        fiveQuestions: {
          documentType: 'Legal Document',
          partiesInvolved: { parties: ['Not automatically detected'] },
          totalAmount: 'Not specified',
          missingPoints: 'Overall summary generation failed.',
          nextStepsSummary: 'Review the extracted clauses below, or consult a legal professional.'
        },
        completenessBreakdown: { identityInfo: 50, propertyInfo: 50, financialInfo: 50, importantClauses: 50, witnessInfo: 50, registrationInfo: 50 },
        recommendedActions: []
      };
    }

    const documentType = typeof synthesis.documentType === 'string' ? synthesis.documentType : 'Legal Document';
    const recommendedActionsRaw = Array.isArray(synthesis.recommendedActions) ? synthesis.recommendedActions : [];
    const recommendedActions = recommendedActionsRaw.map((text: unknown, i: number) => ({
      id: `A${String(i + 1).padStart(3, '0')}`,
      text: String(text),
      completed: false
    }));

    const totalPages = pages.length;
    const totalMs = Date.now() - startTime;
    const warnings = failed.map((r) => `Pages ${r.chunk.startPage}-${r.chunk.endPage}: analysis failed (${r.error})`);

    return NextResponse.json({
      documentType,
      classificationConfidence: synthesis.classificationConfidence,
      understandingScore: synthesis.understandingScore,
      status: synthesis.status,
      summary: synthesis.summary,
      verySimpleSummary: synthesis.verySimpleSummary,
      extraSimpleSummary: synthesis.extraSimpleSummary,
      fiveQuestions: synthesis.fiveQuestions,
      completenessBreakdown: synthesis.completenessBreakdown,
      paragraphs: finalParagraphs,
      importantClauses: finalClauses,
      missingInformation: finalMissingInfo,
      legalTerms,
      recommendedActions,
      relevantServices: getRelevantServicesForDocType(documentType),
      analysisMeta: {
        fullyAnalyzed: failed.length === 0,
        totalPages,
        totalChunks: chunks.length,
        chunksSucceeded: succeeded.length,
        chunksFailed: failed.length,
        warnings,
        geminiCalls,
        totalMs
      }
    });
  } catch (e) {
    if (e instanceof GeminiRequestError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('[api/analyze] Unexpected error:', e);
    return NextResponse.json({ error: 'Unexpected error during AI analysis' }, { status: 500 });
  }
}
