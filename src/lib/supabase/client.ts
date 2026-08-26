'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Whether persistence is available in this deployment.
 *
 * LegalLingo has to keep working with no Supabase project configured at all:
 * analysis, risk checks and the reader are all client-side. Every call site
 * checks this rather than assuming a client, so a missing environment variable
 * degrades to a guest-only build instead of taking down the upload flow.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && publishableKey);
}

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * The browser Supabase client, or null when persistence is not configured.
 *
 * Memoised because createBrowserClient sets up auth listeners and storage
 * subscriptions; creating one per render would leak them.
 */
export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) return null;
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(url!, publishableKey!);
  }
  return browserClient;
}
