import { NextRequest, NextResponse } from 'next/server';
import { getRelevantServicesForDocType } from '@/lib/govtServices';
import { completeJson, LLMError, resolveProvider, statusForError, type LLMProvider } from '@/lib/llm';
import {
  splitIntoSections,
  buildChunks,
  combineDocuments,
  dedupeItems,
  type Chunk,
  type PageInput,
  type SourceDocument
} from '@/lib/documentChunking';

const CHUNK_CONCURRENCY = 3;
const CHUNK_RETRIES = 2;
const SYNTHESIS_RETRIES = 2;
const JSON_ATTEMPTS = 2;

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

/** Structural check fed to completeJson so a malformed shape gets re-prompted, not dropped. */
function validateChunkExtraction(value: unknown): true | string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return 'the response must be a single JSON object';
  }
  const obj = value as Record<string, unknown>;
  for (const key of ['paragraphs', 'importantClauses', 'missingInformation', 'legalTerms']) {
    if (obj[key] !== undefined && !Array.isArray(obj[key])) {
      return `"${key}" must be a JSON array`;
    }
  }
  if (typeof obj.chunkSummary !== 'string' || !obj.chunkSummary.trim()) {
    return '"chunkSummary" must be a non-empty string';
  }
  return true;
}

/**
 * Records which provider(s) actually served this request. A single analysis can
 * be served by more than one when the primary fails partway and the fallback
 * picks up, so this tracks a set rather than a single name.
 */
class ProviderTracker {
  private used = new Map<string, string>();

  readonly note = (provider: LLMProvider) => {
    this.used.set(provider.name, provider.model);
  };

  get names(): string {
    return [...this.used.keys()].join('+');
  }

  get models(): string {
    return [...this.used.values()].join('+');
  }
}

async function extractChunk(
  chunk: Chunk,
  fileName: string,
  tracker: ProviderTracker
): Promise<{ chunk: Chunk; data?: ChunkExtraction; error?: string }> {
  const documentLabel = chunk.sourceFile || fileName;
  const prompt = `You are LegalLingo, an AI assistant that helps Indian citizens understand legal and civic documents in plain language.

This is EXCERPT ${chunk.index + 1} (pages ${chunk.startPage}-${chunk.endPage}) of a larger document named "${documentLabel}". The excerpt contains "[[PAGE N]]" markers showing which page each section came from — use the nearest marker above a piece of text as its "page" value.

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
    const data = await completeJson<ChunkExtraction>(
      { prompt, temperature: 0.2, json: true },
      {
        label: `api/analyze#chunk${chunk.index}`,
        maxRetries: CHUNK_RETRIES,
        maxJsonAttempts: JSON_ATTEMPTS,
        validate: validateChunkExtraction,
        onProviderUsed: tracker.note
      }
    );
    return { chunk, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
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

function validateSynthesis(value: unknown): true | string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return 'the response must be a single JSON object';
  }
  const obj = value as Record<string, unknown>;
  if (typeof obj.documentType !== 'string' || !obj.documentType.trim()) {
    return '"documentType" must be a non-empty string';
  }
  if (!obj.fiveQuestions || typeof obj.fiveQuestions !== 'object') {
    return '"fiveQuestions" must be a JSON object';
  }
  if (obj.recommendedActions !== undefined && !Array.isArray(obj.recommendedActions)) {
    return '"recommendedActions" must be a JSON array of strings';
  }
  return true;
}

async function synthesizeDocumentLevel(
  fileName: string,
  chunkSummaries: string[],
  clauseDigest: string,
  openingText: string,
  fileManifest: string,
  tracker: ProviderTracker
): Promise<Record<string, unknown>> {
  const prompt = `You are LegalLingo, an AI assistant that helps Indian citizens understand legal and civic documents in plain language.

You are given a per-section digest of a document named "${fileName}" that was too long to analyze in one pass, plus the opening text for concrete grounding (names, dates, parties). Using ONLY this information, produce a document-level summary.
${fileManifest}

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

  return completeJson<Record<string, unknown>>(
    { prompt, temperature: 0.3, json: true },
    {
      label: 'api/analyze#synthesis',
      maxRetries: SYNTHESIS_RETRIES,
      maxJsonAttempts: JSON_ATTEMPTS,
      validate: validateSynthesis,
      onProviderUsed: tracker.note
    }
  );
}

/**
 * Normalizes the three accepted request shapes into one combined document.
 *
 *   { documents: [{ fileName, pages }] }  — multi-file upload (current client)
 *   { pages, fileName }                   — single-file upload
 *   { text, fileName }                    — plain text (edited-OCR path)
 */
function readRequestDocuments(body: Record<string, unknown>, fileName: string): SourceDocument[] {
  if (Array.isArray(body.documents) && body.documents.length > 0) {
    return (body.documents as SourceDocument[])
      .filter((d) => d && Array.isArray(d.pages))
      .map((d, i) => ({
        fileName: typeof d.fileName === 'string' && d.fileName.trim() ? d.fileName : `Document ${i + 1}`,
        pages: d.pages
      }));
  }

  if (Array.isArray(body.pages) && body.pages.length > 0) {
    return [{ fileName, pages: body.pages as PageInput[] }];
  }

  if (typeof body.text === 'string' && body.text.trim()) {
    return [{ fileName, pages: [{ pageNumber: 1, text: body.text }] }];
  }

  return [];
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const tracker = new ProviderTracker();
  let llmCalls = 0;

  try {
    const body = await req.json();
    const fileName: string = body.fileName || 'Uploaded Document';

    const documents = readRequestDocuments(body, fileName);
    const combined = combineDocuments(documents);
    const pages = combined.pages;

    if (pages.length === 0) {
      return NextResponse.json({ error: 'No document text provided' }, { status: 400 });
    }

    const isMultiFile = combined.files.length > 1;
    const documentLabel = isMultiFile
      ? `${combined.files.length} documents (${combined.files.map((f) => f.fileName).join(', ')})`
      : combined.files[0]?.fileName || fileName;

    const sections = splitIntoSections(pages);
    const chunks = buildChunks(sections);

    if (chunks.length === 0) {
      return NextResponse.json({ error: 'No analyzable text found in document' }, { status: 400 });
    }

    // --- Chunk-level extraction (batched, concurrency-limited, retried) ---
    const chunkResults = await mapWithConcurrency(chunks, CHUNK_CONCURRENCY, (chunk) => extractChunk(chunk, fileName, tracker));
    llmCalls += chunks.length;

    const succeeded = chunkResults.filter((r) => r.data);
    const failed = chunkResults.filter((r) => !r.data);

    // --- Deterministic merge, in document order ---
    // Models don't always echo the [[PAGE N]] marker back as a JSON number
    // (sometimes a numeric string) — coerce so `page` is always a real number.
    const toPage = (value: unknown, fallback: number): number => {
      const n = Number(value);
      return Number.isFinite(n) && n > 0 ? n : fallback;
    };

    let paragraphs = succeeded.flatMap((r) =>
      (r.data!.paragraphs || []).map((p) => ({
        page: toPage(p.page, r.chunk.startPage),
        original: p.original,
        simple: p.simple,
        sourceFile: r.chunk.sourceFile
      }))
    );
    let clauses = succeeded.flatMap((r) =>
      (r.data!.importantClauses || []).map((c) => ({
        ...c,
        page: toPage(c.page, r.chunk.startPage),
        sourceFile: r.chunk.sourceFile
      }))
    );
    let missingInfo = succeeded.flatMap((r) =>
      (r.data!.missingInformation || []).map((m) => ({
        ...m,
        page: toPage(m.page, r.chunk.startPage),
        sourceFile: r.chunk.sourceFile
      }))
    );
    let legalTerms = succeeded.flatMap((r) => r.data!.legalTerms || []);

    // Dedupe is scoped per source file: two different uploaded documents can
    // legitimately share a clause title or a missing-info heading, and collapsing
    // those across files would silently hide one document's finding.
    const scoped = (sourceFile: string | undefined, text: string) => `${sourceFile || ''}::${text}`;

    paragraphs = dedupeItems(paragraphs, (p) => scoped(p.sourceFile, p.original));
    clauses = dedupeItems(clauses, (c) => scoped(c.sourceFile, c.originalText || c.clauseTitle));
    missingInfo = dedupeItems(missingInfo, (m) => scoped(m.sourceFile, m.title));
    // Glossary terms are document-agnostic, so they dedupe globally.
    legalTerms = dedupeItems(legalTerms, (t) => t.term);

    const finalParagraphs = paragraphs.map((p, i) => ({
      id: i + 1,
      original: p.original,
      simple: p.simple,
      page: p.page,
      ...(isMultiFile ? { sourceFile: p.sourceFile } : {})
    }));
    const finalClauses = clauses.map((c, i) => ({
      id: `C${String(i + 1).padStart(3, '0')}`,
      clauseTitle: c.clauseTitle,
      originalText: c.originalText,
      simpleMeaning: c.simpleMeaning,
      whyItMatters: c.whyItMatters,
      recommendedAction: c.recommendedAction,
      riskLevel: c.riskLevel,
      category: c.category,
      page: c.page,
      ...(isMultiFile ? { sourceFile: c.sourceFile } : {})
    }));
    const finalMissingInfo = missingInfo.map((m, i) => ({
      id: `M${String(i + 1).padStart(3, '0')}`,
      title: m.title,
      whyItMatters: m.whyItMatters,
      whatYouCanDo: m.whatYouCanDo,
      severity: m.severity,
      page: m.page,
      ...(isMultiFile ? { sourceFile: m.sourceFile } : {})
    }));

    // --- Document-level synthesis over chunk summaries (not raw text again) ---
    const chunkSummaries = succeeded.map((r) => r.data!.chunkSummary).filter(Boolean);
    const clauseDigest =
      finalClauses
        .map((c) => `${isMultiFile && c.sourceFile ? `[${c.sourceFile}] ` : ''}${c.clauseTitle} [${c.riskLevel}]`)
        .join('\n') || '(none extracted)';

    // Grounding text is sampled from each file rather than only the first, so a
    // multi-file summary can name every document's parties instead of just one's.
    const perFileBudget = Math.max(600, Math.floor(3000 / Math.max(combined.files.length, 1)));
    const openingText = combined.files
      .map((f) => {
        const filePages = pages.filter((p) => p.pageNumber >= f.startPage && p.pageNumber <= f.endPage);
        const head = filePages.map((p) => p.text).join('\n\n').slice(0, perFileBudget);
        return isMultiFile ? `--- ${f.fileName} ---\n${head}` : head;
      })
      .join('\n\n');

    const fileManifest = isMultiFile
      ? `\nThis analysis covers ${combined.files.length} separate uploaded files, treated as one submission:\n${combined.files
          .map((f) => `- "${f.fileName}" (pages ${f.startPage}-${f.endPage} of the combined document)`)
          .join('\n')}\nDescribe them together, and where they differ or relate to each other, say so explicitly.`
      : '';

    let synthesis: Record<string, unknown>;
    try {
      synthesis = await synthesizeDocumentLevel(documentLabel, chunkSummaries, clauseDigest, openingText, fileManifest, tracker);
      llmCalls += 1;
    } catch (e) {
      console.error('[api/analyze] Synthesis call failed:', e);
      llmCalls += 1;
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
    const warnings = failed.map(
      (r) =>
        `${r.chunk.sourceFile ? `${r.chunk.sourceFile}, ` : ''}pages ${r.chunk.startPage}-${r.chunk.endPage}: analysis failed (${r.error})`
    );
    // Report the provider(s) that actually served the request, falling back to
    // the configured one only if every call failed before reporting.
    const configured = resolveProvider();
    const provider = tracker.names || configured.name;
    const model = tracker.models || configured.model;

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
        totalFiles: combined.files.length,
        files: combined.files.map((f) => ({
          fileName: f.fileName,
          startPage: f.startPage,
          endPage: f.endPage,
          pageCount: f.pageCount
        })),
        totalChunks: chunks.length,
        chunksSucceeded: succeeded.length,
        chunksFailed: failed.length,
        warnings,
        llmCalls,
        provider,
        model,
        totalMs
      }
    });
  } catch (e) {
    if (e instanceof LLMError) {
      console.error('[api/analyze] LLM failure:', e.message);
      return NextResponse.json({ error: e.message }, { status: statusForError(e) });
    }
    console.error('[api/analyze] Unexpected error:', e);
    return NextResponse.json({ error: 'Unexpected error during AI analysis' }, { status: 500 });
  }
}
