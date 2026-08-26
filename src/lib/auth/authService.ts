'use client';

import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { parseEmail, isValidOtp } from './email';

/**
 * Passwordless email sign-in: a six-digit code sent to the citizen's address.
 *
 * No password is set anywhere in this flow. That is the point — a password is
 * one more thing to forget, to reset over a slow connection, and to reuse from
 * somewhere it has already leaked. The account is only ever as reachable as the
 * inbox.
 */

/**
 * Translation keys for every failure this flow can produce.
 *
 * The auth layer returns a key, never a raw Supabase message: those are English
 * developer strings and this app's users read Hindi, Marathi and Gujarati.
 * Anything unrecognised falls back to authErrorGeneric rather than leaking the
 * raw text to someone who cannot act on it.
 */
export type AuthErrorKey =
  | 'authErrorNotConfigured'
  | 'authErrorEmailProviderDisabled'
  | 'authErrorRateLimited'
  | 'authErrorInvalidEmail'
  | 'authErrorEmailRejected'
  | 'authErrorInvalidOtp'
  | 'authErrorOtpExpired'
  | 'authErrorSendFailed'
  | 'authErrorNetwork'
  | 'authErrorGeneric';

export interface AuthResult {
  ok: boolean;
  errorKey?: AuthErrorKey;
  /** The raw provider message, for the console only — never rendered. */
  debug?: string;
}

function mapAuthError(error: { code?: string; status?: number; message?: string }): AuthErrorKey {
  const code = error.code ?? '';
  const message = (error.message ?? '').toLowerCase();

  if (code === 'email_provider_disabled' || message.includes('email logins are disabled')) {
    return 'authErrorEmailProviderDisabled';
  }
  // Supabase's built-in mailer is rate limited hard, and this is the error a
  // real deployment hits first. It is not the citizen's fault and it is
  // temporary, so it must not read like a rejected address.
  if (
    code === 'over_email_send_rate_limit' ||
    code === 'over_request_rate_limit' ||
    error.status === 429
  ) {
    return 'authErrorRateLimited';
  }
  if (code === 'email_address_invalid' || code === 'validation_failed') {
    return 'authErrorEmailRejected';
  }
  if (code === 'otp_expired' || message.includes('expired')) return 'authErrorOtpExpired';
  if (code === 'otp_disabled' || message.includes('invalid') || message.includes('token'))
    return 'authErrorInvalidOtp';
  if (message.includes('send') && message.includes('fail')) return 'authErrorSendFailed';
  if (message.includes('fetch') || message.includes('network')) return 'authErrorNetwork';

  return 'authErrorGeneric';
}

/**
 * Sends a six-digit code to an email address, creating the account if it is new.
 *
 * `shouldCreateUser` is true because there is no separate sign-up step: a
 * citizen who has never used LegalLingo and one coming back to their documents
 * take exactly the same path.
 */
export async function requestEmailOtp(emailInput: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, errorKey: 'authErrorNotConfigured' };
  }

  const parsed = parseEmail(emailInput);
  if (!parsed.ok || !parsed.email) {
    return { ok: false, errorKey: 'authErrorInvalidEmail' };
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, errorKey: 'authErrorNotConfigured' };

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.email,
      options: { shouldCreateUser: true }
    });
    if (error) {
      console.warn('[auth] requestEmailOtp failed:', error.code, error.message);
      return { ok: false, errorKey: mapAuthError(error), debug: error.message };
    }
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.warn('[auth] requestEmailOtp threw:', message);
    return { ok: false, errorKey: 'authErrorNetwork', debug: message };
  }
}

/**
 * Verifies the code and establishes the session.
 *
 * The profile row is created by a database trigger on auth.users, so there is
 * nothing to insert here — see supabase/README.md.
 */
export async function verifyEmailOtp(emailInput: string, token: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, errorKey: 'authErrorNotConfigured' };
  }

  const parsed = parseEmail(emailInput);
  if (!parsed.ok || !parsed.email) {
    return { ok: false, errorKey: 'authErrorInvalidEmail' };
  }
  if (!isValidOtp(token)) {
    return { ok: false, errorKey: 'authErrorInvalidOtp' };
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, errorKey: 'authErrorNotConfigured' };

  try {
    const { error } = await supabase.auth.verifyOtp({
      email: parsed.email,
      token: token.trim(),
      // 'email' covers both a first sign-up and a later sign-in; Supabase
      // resolves which against the token it issued.
      type: 'email'
    });
    if (error) {
      console.warn('[auth] verifyEmailOtp failed:', error.code, error.message);
      return { ok: false, errorKey: mapAuthError(error), debug: error.message };
    }
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.warn('[auth] verifyEmailOtp threw:', message);
    return { ok: false, errorKey: 'authErrorNetwork', debug: message };
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

/**
 * How long the UI blocks a resend.
 *
 * Sixty seconds matches Supabase's default minimum interval between OTP
 * emails. Offering a resend button that is guaranteed to return a rate-limit
 * error would just teach people the app is broken.
 */
export const RESEND_COOLDOWN_SECONDS = 60;
