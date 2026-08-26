'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { DocumentAnalysis } from '@/lib/types';

/**
 * Reads a signed-in citizen's saved documents back.
 *
 * Every query here relies on RLS for scoping rather than adding its own
 * `auth_uid` filter. That is intentional: if a filter is ever forgotten the
 * database still returns nothing, whereas a hand-written filter that drifts
 * would silently widen access.
 */

/**
 * Lists saved documents, newest first.
 *
 * `analysis_json` is the whole DocumentAnalysis, so a listed document opens
 * with exactly the content it was rendered with — including any checklist
 * ticks, which are merged back over it from their own table.
 */
export async function loadSavedDocuments(): Promise<DocumentAnalysis[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('document_sets')
    .select(
      `
      id,
      created_at,
      analysis_status,
      analyses ( id, analysis_json, is_current ),
      checklist_items ( item_key, completed )
    `
    )
    // A set still marked 'processing' is a partial write from an interrupted
    // save. Showing it would promise a document whose clauses may be missing.
    .eq('analysis_status', 'complete')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[persistence] load failed:', error.message);
    return [];
  }

  const results: DocumentAnalysis[] = [];

  for (const row of data ?? []) {
    const analyses = (row.analyses ?? []) as { id: string; analysis_json: unknown; is_current: boolean }[];
    const current = analyses.find((a) => a.is_current) ?? analyses[0];
    if (!current?.analysis_json) continue;

    const analysis = current.analysis_json as DocumentAnalysis;

    // The stored id is the client-side one from the moment of analysis. Replace
    // it with the document_set id so opening and deleting address the same row.
    analysis.id = row.id;
    if (row.created_at) analysis.createdAt = row.created_at;

    // Checklist ticks live in their own table because they change after the
    // analysis is written; the snapshot in analysis_json is stale by design.
    const ticks = (row.checklist_items ?? []) as { item_key: string; completed: boolean }[];
    if (ticks.length > 0 && Array.isArray(analysis.recommendedActions)) {
      const byKey = new Map(ticks.map((t) => [t.item_key, t.completed]));
      analysis.recommendedActions = analysis.recommendedActions.map((a) =>
        byKey.has(a.id) ? { ...a, completed: byKey.get(a.id)! } : a
      );
    }

    results.push(analysis);
  }

  return results;
}

/**
 * A time-limited URL for an uploaded original.
 *
 * The bucket is private, so there is no permanent public link to hand out —
 * which is the point for a scanned sale deed.
 */
export async function getDocumentFileUrl(
  storagePath: string,
  expiresInSeconds = 300
): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error) {
    console.warn('[persistence] signed URL failed:', error.message);
    return null;
  }
  return data?.signedUrl ?? null;
}
