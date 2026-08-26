import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './database.types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(url && publishableKey);
}

/**
 * Supabase client bound to the caller's session cookies, or null when
 * persistence is not configured.
 *
 * This client is subject to RLS, which is the point: a route handler using it
 * can only ever read the documents belonging to the citizen who made the
 * request, even if a query forgets its own auth_uid filter.
 */
export async function getSupabaseServerClient() {
  if (!isSupabaseConfigured()) return null;

  const cookieStore = await cookies();

  return createServerClient<Database>(url!, publishableKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Components cannot set cookies. The proxy layer refreshes the
          // session instead, so this is safe to swallow rather than throw.
        }
      }
    }
  });
}

/**
 * The signed-in user, or null for a guest.
 *
 * Always reads through getUser() rather than getSession(): getSession() returns
 * whatever the cookie claims without verifying it, which is not a basis on
 * which to hand back somebody's legal documents.
 */
export async function getCurrentUser() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}
