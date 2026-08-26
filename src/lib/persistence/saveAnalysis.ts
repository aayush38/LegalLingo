'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { DocumentAnalysis } from '@/lib/types';
import type { MultiFileExtractionResult } from '@/lib/ocr';
import type { Enums, Json } from '@/lib/supabase/database.types';

/**
 * Persists a completed analysis for a signed-in citizen.
 *
 * Guests never reach this code, and nothing is written to their device either:
 * a guest analysis lives in memory for the length of the tab and is then gone.
 * That is the deliberate privacy position — a citizen who reads a sale deed on
 * a borrowed handset leaves no copy of it behind.
 */

/**
 * Bridges an application type into a jsonb column.
 *
 * The domain interfaces have no index signature, so they are not structurally
 * `Json`. Round-tripping through JSON both satisfies that and guarantees the
 * value actually serialises — a Date or an undefined slipping into a jsonb
 * column would otherwise fail at the network boundary instead of here.
 */
function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? null)) as Json;
}

/** The UI uses lowercase risk words; the database uses the Risk Engine scale. */
function toAttentionLevel(level: string | undefined): Enums<'attention_level'> {
  switch ((level ?? '').toLowerCase()) {
    case 'high':
    case 'high_attention':
      return 'HIGH_ATTENTION';
    case 'review':
      return 'REVIEW';
    default:
      return 'STANDARD';
  }
}

function toDocStatus(status: string | undefined): Enums<'doc_status'> | null {
  if (status === 'High Risk' || status === 'Needs Attention' || status === 'Looks Standard') {
    return status;
  }
  return null;
}

/** Clamps a score into the smallint CHECK range rather than failing the insert. */
function clampPercent(value: number | undefined): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * English text is stored under the 'en' key of a translation map. Phase 4 adds
 * the other languages beside it instead of overwriting anything.
 */
function englishOnly(text: string | undefined): Record<string, string> {
  return text ? { en: text } : {};
}

/** Object key for an uploaded original. The first path segment gates storage RLS. */
function storageKey(uid: string, setId: string, index: number, fileName: string): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
  return `${uid}/${setId}/${index}-${safe}`;
}

export interface SaveResult {
  ok: boolean;
  documentSetId?: string;
  /** Files whose bytes could not be uploaded. The analysis is still saved. */
  failedUploads?: string[];
  error?: string;
}

/**
 * Writes one submission and its analysis across the schema.
 *
 * There is no multi-table transaction over PostgREST, so on any failure the
 * document_set is deleted and the foreign keys cascade the partial rows away.
 * A half-written document in someone's list would be worse than no document:
 * they would believe a deed was saved when its clauses were missing.
 */
export async function saveAnalysis(
  analysis: DocumentAnalysis,
  extraction: MultiFileExtractionResult | null,
  originalFiles: { file: File; role: 'primary' | 'supporting'; docType?: string }[] = []
): Promise<SaveResult> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, error: 'not_configured' };

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'not_signed_in' };

  const uid = user.id;
  const setId = crypto.randomUUID();
  const meta = analysis.analysisMeta;

  try {
    // 1. The submission header.
    const { error: setError } = await supabase.from('document_sets').insert({
      id: setId,
      auth_uid: uid,
      title: analysis.documentTitle,
      document_type: analysis.documentType,
      status: toDocStatus(analysis.status),
      understanding_score: clampPercent(analysis.understandingScore),
      classification_confidence: clampPercent(analysis.classificationConfidence),
      ocr_confidence: clampPercent(analysis.ocrConfidence),
      is_scanned: Boolean(analysis.isScanned),
      analysis_status: 'processing'
    });
    if (setError) throw new Error(`document_sets: ${setError.message}`);

    // 2. The files. Ids are generated up front so pages can reference them
    //    without a second round trip per file.
    const fileRows = (meta?.files ?? []).map((f, i) => ({
      id: crypto.randomUUID(),
      document_set_id: setId,
      auth_uid: uid,
      file_name: f.fileName,
      role: (f.role ?? 'primary') as Enums<'document_role'>,
      doc_type: f.docType ?? null,
      start_page: f.startPage ?? null,
      end_page: f.endPage ?? null,
      page_count: f.pageCount ?? 0,
      position: i,
      extraction_summary:
        analysis.supportingDocuments?.find((s) => s.fileName === f.fileName)?.summary ?? null,
      extraction_failed:
        analysis.supportingDocuments?.find((s) => s.fileName === f.fileName)?.extractionFailed ??
        false
    }));

    if (fileRows.length > 0) {
      const { error } = await supabase.from('documents').insert(fileRows);
      if (error) throw new Error(`documents: ${error.message}`);
    }

    // 3. Per-page text, the input the chunker consumed.
    const pageRows = (extraction?.pages ?? []).map((p, i) => {
      const owner =
        fileRows.find((f) => f.file_name === p.sourceFile) ?? fileRows[0];
      return {
        document_id: owner?.id,
        document_set_id: setId,
        auth_uid: uid,
        page_number: p.pageNumber ?? i + 1,
        source_page: p.sourcePage ?? null,
        text_content: p.text ?? ''
      };
    }).filter((r) => Boolean(r.document_id));

    if (pageRows.length > 0) {
      const { error } = await supabase.from('document_pages').insert(pageRows);
      if (error) throw new Error(`document_pages: ${error.message}`);
    }

    // 4. The analysis itself.
    const analysisId = crypto.randomUUID();
    const { error: analysisError } = await supabase.from('analyses').insert({
      id: analysisId,
      document_set_id: setId,
      auth_uid: uid,
      // Stored whole so the reader can rehydrate exactly what was rendered.
      analysis_json: toJson(analysis),
      summary: analysis.summary ?? null,
      very_simple_summary: analysis.verySimpleSummary ?? null,
      five_questions: toJson(analysis.fiveQuestions),
      parties: toJson(analysis.parties ?? []),
      key_information: toJson(analysis.keyInformation ?? []),
      legal_terms: toJson(analysis.legalTerms ?? []),
      missing_information: toJson(analysis.missingInformation ?? []),
      completeness_breakdown: toJson(analysis.completenessBreakdown),
      fully_analyzed: meta?.fullyAnalyzed ?? true,
      total_pages: meta?.totalPages ?? null,
      total_files: meta?.totalFiles ?? null,
      supporting_files: meta?.supportingFiles ?? null,
      total_chunks: meta?.totalChunks ?? null,
      chunks_succeeded: meta?.chunksSucceeded ?? null,
      chunks_failed: meta?.chunksFailed ?? null,
      warnings: meta?.warnings ?? [],
      llm_calls: meta?.llmCalls ?? null,
      provider: meta?.provider ?? null,
      model: meta?.model ?? null,
      total_ms: meta?.totalMs ?? null,
      risk_engine_version: analysis.riskEngine?.version ?? null,
      is_current: true
    });
    if (analysisError) throw new Error(`analyses: ${analysisError.message}`);

    // 5. Normalised children, each in a single batched insert.
    const clauseRows = (analysis.importantClauses ?? []).map((c, i) => ({
      analysis_id: analysisId,
      document_set_id: setId,
      auth_uid: uid,
      clause_key: c.id ?? null,
      position: i,
      title: englishOnly(c.clauseTitle),
      original_text: c.originalText ?? '',
      simple_meaning: englishOnly(c.simpleMeaning),
      why_it_matters: englishOnly(c.whyItMatters),
      recommended_action: englishOnly(c.recommendedAction),
      risk_level: toAttentionLevel(c.riskLevel),
      category: c.category ?? null,
      page: c.page ?? null,
      source_file: c.sourceFile ?? null
    }));
    if (clauseRows.length > 0) {
      const { error } = await supabase.from('clauses').insert(clauseRows);
      if (error) throw new Error(`clauses: ${error.message}`);
    }

    const findingRows = (analysis.riskEngine?.findings ?? []).map((f) => ({
      analysis_id: analysisId,
      document_set_id: setId,
      auth_uid: uid,
      finding_key: f.id,
      rule_id: f.ruleId,
      category: f.category,
      title: f.title,
      severity: toAttentionLevel(f.severity),
      score: f.score ?? 0,
      reason: f.reason,
      simple_meaning: f.simpleMeaning ?? null,
      recommended_verification: f.recommendedVerification ?? [],
      evidence: toJson(f.evidence ?? []),
      related_fields: f.relatedFields ?? [],
      confidence: (f.confidence ?? null) as Enums<'risk_confidence'> | null,
      source_type: f.sourceType ?? 'RULE_ENGINE',
      // Stays null until the RAG phase can cite a real retrieved source.
      legal_basis: null
    }));
    if (findingRows.length > 0) {
      const { error } = await supabase.from('risk_findings').insert(findingRows);
      if (error) throw new Error(`risk_findings: ${error.message}`);
    }

    const factRows = (analysis.supportingDocuments ?? []).flatMap((doc) =>
      (doc.keyFacts ?? []).map((fact) => ({
        analysis_id: analysisId,
        document_id: fileRows.find((f) => f.file_name === doc.fileName)?.id ?? null,
        document_set_id: setId,
        auth_uid: uid,
        label: fact.label,
        value: fact.value,
        page: fact.page ?? null,
        source_file: doc.fileName,
        doc_type: doc.docType ?? null
      }))
    );
    if (factRows.length > 0) {
      const { error } = await supabase.from('extracted_facts').insert(factRows);
      if (error) throw new Error(`extracted_facts: ${error.message}`);
    }

    const checklistRows = (analysis.recommendedActions ?? []).map((a, i) => ({
      analysis_id: analysisId,
      document_set_id: setId,
      auth_uid: uid,
      item_key: a.id,
      position: i,
      text: englishOnly(a.text),
      completed: Boolean(a.completed),
      completed_at: a.completed ? new Date().toISOString() : null
    }));
    if (checklistRows.length > 0) {
      const { error } = await supabase.from('checklist_items').insert(checklistRows);
      if (error) throw new Error(`checklist_items: ${error.message}`);
    }

    // 6. Original files. Deliberately last and non-fatal: the simplified text
    //    is what the citizen came for, and losing a scan upload should not
    //    discard a completed analysis.
    const failedUploads: string[] = [];
    for (let i = 0; i < originalFiles.length; i++) {
      const { file } = originalFiles[i];
      const key = storageKey(uid, setId, i, file.name);
      const { error } = await supabase.storage
        .from('documents')
        .upload(key, file, { upsert: false, contentType: file.type || undefined });

      if (error) {
        failedUploads.push(file.name);
        console.warn('[persistence] upload failed for', file.name, error.message);
        continue;
      }
      const row = fileRows.find((f) => f.file_name === file.name);
      if (row) {
        await supabase
          .from('documents')
          .update({ storage_path: key, file_size: file.size, mime_type: file.type || null })
          .eq('id', row.id);
      }
    }

    // 7. Only now is the set complete. Anything left at 'processing' is a
    //    partial write and can be identified as such.
    const { error: finalError } = await supabase
      .from('document_sets')
      .update({ analysis_status: 'complete' })
      .eq('id', setId);
    if (finalError) throw new Error(`finalise: ${finalError.message}`);

    return { ok: true, documentSetId: setId, failedUploads };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[persistence] save failed, rolling back:', message);

    // Cascade removes documents, pages, analyses, clauses, findings, facts and
    // checklist items along with the set.
    await supabase.from('document_sets').delete().eq('id', setId);

    return { ok: false, error: message };
  }
}

/** Persists a single checklist tick. Failure is silent by design — see caller. */
export async function setChecklistItemCompleted(
  documentSetId: string,
  itemKey: string,
  completed: boolean
): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from('checklist_items')
    .update({ completed, completed_at: completed ? new Date().toISOString() : null })
    .eq('document_set_id', documentSetId)
    .eq('item_key', itemKey);

  if (error) console.warn('[persistence] checklist update failed:', error.message);
  return !error;
}

/** Deletes a submission. Storage objects are removed before the rows that name them. */
export async function deleteDocumentSet(documentSetId: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  const { data: docs } = await supabase
    .from('documents')
    .select('storage_path')
    .eq('document_set_id', documentSetId);

  const paths = (docs ?? [])
    .map((d) => d.storage_path)
    .filter((p): p is string => Boolean(p));

  if (paths.length > 0) {
    const { error } = await supabase.storage.from('documents').remove(paths);
    if (error) console.warn('[persistence] storage cleanup failed:', error.message);
  }

  const { error } = await supabase.from('document_sets').delete().eq('id', documentSetId);
  if (error) {
    console.warn('[persistence] delete failed:', error.message);
    return false;
  }
  return true;
}
