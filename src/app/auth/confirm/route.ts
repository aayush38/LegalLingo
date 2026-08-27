import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import type { EmailOtpType } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

/**
 * Exchanges an emailed token for a session.
 *
 * Supabase's default email template links straight at its own verify endpoint,
 * which works only for the implicit flow. `@supabase/ssr` uses PKCE, where the
 * link has to land on the application so the token hash can be exchanged here,
 * with the code verifier that is sitting in this browser's cookies. Without
 * this route every emailed link fails with `otp_expired` — the token was never
 * expired, it was never exchanged.
 *
 * The email template must therefore point here:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  // A recovery link means the citizen has no usable password yet — either they
  // forgot it, or the account was created by an earlier magic-link flow that
  // never set one. Send them somewhere they can choose one, rather than to a
  // home page that looks identical to being signed out.
  const defaultNext = type === 'recovery' ? '/auth/set-password' : '/';
  const rawNext = searchParams.get('next') ?? defaultNext;

  // Only same-origin paths are honoured, so a crafted link cannot bounce a
  // freshly authenticated citizen off to somebody else's site.
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/';

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    return NextResponse.redirect(`${origin}/?auth_error=not_configured`);
  }
  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/?auth_error=link_incomplete`);
  }

  const response = NextResponse.redirect(`${origin}${next}`);
  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // Written onto the redirect response, so the session cookie travels
        // with the hop back into the app.
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      }
    }
  });

  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    console.warn('[auth/confirm] verification failed:', error.code, error.message);
    // A used or genuinely expired link is the common case, and the citizen just
    // needs to be told to request another one rather than shown a raw code.
    return NextResponse.redirect(`${origin}/?auth_error=link_expired`);
  }

  return response;
}
