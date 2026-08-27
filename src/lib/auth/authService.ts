'use client';

import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { parseEmail } from './email';

/**
 * Email and password sign-in.
 *
 * Chosen over one-time codes for a practical reason: signing in this way sends
 * no email at all. Supabase's built-in mailer is rate limited to a handful of
 * messages an hour, so an emailed code would make signing in fail for the third
 * citizen of the hour. A password costs one email at sign-up and none after.
 */

export type AuthErrorKey =
  | 'authErrorNotConfigured'
  | 'authErrorEmailProviderDisabled'
  | 'authErrorRateLimited'
  | 'authErrorInvalidEmail'
  | 'authErrorEmailRejected'
  | 'authErrorWrongCredentials'
  | 'authErrorEmailNotConfirmed'
  | 'authErrorWeakPassword'
  | 'authErrorAlreadyRegistered'
  | 'authErrorNetwork'
  | 'authErrorGeneric';

export interface AuthResult {
  ok: boolean;
  errorKey?: AuthErrorKey;
  /**
   * Set when the account was created but cannot be used until the emailed link
   * is clicked. The caller shows "check your inbox" rather than a failure.
   */
  needsEmailConfirmation?: boolean;
  /** The raw provider message, for the console only — never rendered. */
  debug?: string;
}

/** Supabase's own default minimum. Enforced here so the error is in-language. */
export const MIN_PASSWORD_LENGTH = 8;

function mapAuthError(error: { code?: string; status?: number; message?: string }): AuthErrorKey {
  const code = error.code ?? '';
  const message = (error.message ?? '').toLowerCase();

  if (code === 'email_provider_disabled') return 'authErrorEmailProviderDisabled';
  if (code === 'email_address_invalid' || message.includes('invalid format'))
    return 'authErrorEmailRejected';
  if (code === 'user_already_exists' || code === 'email_exists' || message.includes('already registered'))
    return 'authErrorAlreadyRegistered';
  if (code === 'email_not_confirmed' || message.includes('not confirmed'))
    return 'authErrorEmailNotConfirmed';
  if (code === 'weak_password' || message.includes('password should be'))
    return 'authErrorWeakPassword';
  // Deliberately the same message for a wrong password and an unknown address:
  // distinguishing them tells an attacker which addresses have accounts.
  if (code === 'invalid_credentials' || message.includes('invalid login credentials'))
    return 'authErrorWrongCredentials';
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || error.status === 429)
    return 'authErrorRateLimited';
  if (message.includes('fetch') || message.includes('network')) return 'authErrorNetwork';

  return 'authErrorGeneric';
}

function guard(emailInput: string, password: string): AuthResult | null {
  if (!isSupabaseConfigured()) return { ok: false, errorKey: 'authErrorNotConfigured' };
  if (!parseEmail(emailInput).ok) return { ok: false, errorKey: 'authErrorInvalidEmail' };
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, errorKey: 'authErrorWeakPassword' };
  }
  return null;
}

/** Signs in an existing citizen. Sends no email. */
export async function signInWithPassword(
  emailInput: string,
  password: string
): Promise<AuthResult> {
  const blocked = guard(emailInput, password);
  if (blocked) return blocked;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, errorKey: 'authErrorNotConfigured' };

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: parseEmail(emailInput).email!,
      password
    });
    if (error) {
      console.warn('[auth] signIn failed:', error.code, error.message);
      return { ok: false, errorKey: mapAuthError(error), debug: error.message };
    }
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, errorKey: 'authErrorNetwork', debug: message };
  }
}

/**
 * Creates an account.
 *
 * When the project requires email confirmation, Supabase returns a user with no
 * session and sends a link. That link must land on /auth/confirm — see the
 * route for why the default template does not work with this client.
 */
export async function signUpWithPassword(
  emailInput: string,
  password: string
): Promise<AuthResult> {
  const blocked = guard(emailInput, password);
  if (blocked) return blocked;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, errorKey: 'authErrorNotConfigured' };

  try {
    const { data, error } = await supabase.auth.signUp({
      email: parseEmail(emailInput).email!,
      password,
      options: {
        emailRedirectTo:
          typeof window !== 'undefined' ? `${window.location.origin}/auth/confirm` : undefined
      }
    });
    if (error) {
      console.warn('[auth] signUp failed:', error.code, error.message);
      return { ok: false, errorKey: mapAuthError(error), debug: error.message };
    }

    // A session means the citizen is already in.
    if (data.session) return { ok: true };

    // Supabase deliberately returns a fake success when the address is already
    // registered, so that signup cannot be used to discover who has an account.
    // The tell is a user object carrying no identities. Without this check the
    // UI says "check your email" for an account that already exists, and no
    // email is ever coming — which is indistinguishable from the app being
    // broken.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return { ok: false, errorKey: 'authErrorAlreadyRegistered' };
    }

    // Genuinely awaiting confirmation: the project requires it and no
    // auto-confirm is in place.
    return { ok: true, needsEmailConfirmation: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, errorKey: 'authErrorNetwork', debug: message };
  }
}

/** Sends a password-reset link. Lands on /auth/confirm like every other link. */
export async function requestPasswordReset(emailInput: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return { ok: false, errorKey: 'authErrorNotConfigured' };
  const parsed = parseEmail(emailInput);
  if (!parsed.ok || !parsed.email) return { ok: false, errorKey: 'authErrorInvalidEmail' };

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, errorKey: 'authErrorNotConfigured' };

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.email, {
      // No `next`: the confirm route sends recovery links to the set-password
      // screen by default, which is where this needs to land.
      redirectTo:
        typeof window !== 'undefined' ? `${window.location.origin}/auth/confirm` : undefined
    });
    if (error) return { ok: false, errorKey: mapAuthError(error), debug: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, errorKey: 'authErrorNetwork', debug: String(e) };
  }
}

export async function signOut(): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: true }; // Guest: nothing to sign out of.

  try {
    const { error } = await supabase.auth.signOut();
    if (error) return { ok: false, errorKey: mapAuthError(error), debug: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, errorKey: 'authErrorNetwork', debug: String(e) };
  }
}
