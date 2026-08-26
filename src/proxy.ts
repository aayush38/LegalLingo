import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/supabase/database.types';

/**
 * Refreshes the Supabase auth session on every request.
 *
 * Supabase access tokens are short-lived. Without a refresh here, a citizen
 * who leaves a long document open comes back to a silently expired session and
 * an empty document list, which reads as data loss even though nothing was
 * lost. The proxy renews the token and writes the rotated cookies onto
 * the outgoing response.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // No Supabase configured: the app runs guest-only, so there is no session to
  // refresh and the request passes straight through.
  if (!url || !publishableKey) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      }
    }
  });

  // getUser() revalidates the token with the auth server, which is what
  // actually triggers the refresh. Do not replace this with getSession().
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image files — those never carry a
     * session and refreshing on each one would triple the auth traffic.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf)$).*)'
  ]
};
