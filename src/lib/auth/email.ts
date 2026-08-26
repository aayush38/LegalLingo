/**
 * Email normalisation and validation for OTP sign-in.
 *
 * The failure this guards against is quiet: a typo or a stray space produces an
 * address that Supabase accepts as well-formed, sends a code to, and never
 * delivers. The citizen sits waiting for a mail that was never going to arrive.
 * Anything we can catch before the request is caught here.
 */

export type EmailValidationError = 'empty' | 'no_at' | 'malformed' | 'too_long';

export interface EmailParseResult {
  /** Trimmed and lower-cased. Present only when ok is true. */
  email?: string;
  ok: boolean;
  error?: EmailValidationError;
}

/**
 * Deliberately permissive. The real test of an address is whether mail arrives,
 * and an over-strict pattern rejecting a valid address is worse than a loose
 * one letting a bad address through to a bounce: the first locks a citizen out
 * of their own documents, the second shows them a resend button.
 */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

/** RFC 5321 caps a path at 254 characters. */
const MAX_EMAIL_LENGTH = 254;

export function parseEmail(input: string): EmailParseResult {
  if (!input || !input.trim()) {
    return { ok: false, error: 'empty' };
  }

  // Strip whitespace anywhere, not just the ends: addresses pasted from a
  // messaging app routinely arrive with a line break in the middle.
  const cleaned = input.replace(/\s+/g, '').toLowerCase();

  if (cleaned.length > MAX_EMAIL_LENGTH) {
    return { ok: false, error: 'too_long' };
  }
  if (!cleaned.includes('@')) {
    return { ok: false, error: 'no_at' };
  }
  if (!EMAIL_SHAPE.test(cleaned)) {
    return { ok: false, error: 'malformed' };
  }

  return { ok: true, email: cleaned };
}

/** Convenience wrapper for callers that only want the normalised address. */
export function normaliseEmail(input: string): string | null {
  return parseEmail(input).email ?? null;
}

/**
 * Masks an address for the code screen: ramesh.patil@gmail.com becomes
 * ra•••••@gmail.com.
 *
 * The code screen is often reached on a borrowed handset. Showing enough to
 * confirm the address is theirs, without leaving the whole thing on screen.
 */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  if (at <= 0) return email;

  const local = email.slice(0, at);
  const domain = email.slice(at);

  if (local.length <= 2) return `${local[0]}•${domain}`;
  return `${local.slice(0, 2)}${'•'.repeat(Math.min(5, local.length - 2))}${domain}`;
}

/** Whether a string is a plausible 6-digit OTP. */
export function isValidOtp(token: string): boolean {
  return /^[0-9]{6}$/.test(token.trim());
}
