/**
 * Indian phone number normalisation.
 *
 * No longer part of sign-in — that moved to email one-time codes. This is kept
 * for `profiles.phone`, which is a contact number used for scheme matching, and
 * for a possible later return to SMS once DLT registration is in place.
 *
 * People type their number every way it is printed in India: "98765 43210",
 * "098765-43210", "+91 98765 43210", "0091...". Anything stored should be one
 * form, E.164, so it can be compared and dialled.
 */

/** India. The only country code these helpers normalise to. */
export const DEFAULT_COUNTRY_CODE = '91';

/** Indian mobile numbers are 10 digits and start with 6, 7, 8 or 9. */
const INDIAN_MOBILE = /^[6-9][0-9]{9}$/;

export type PhoneValidationError =
  | 'empty'
  | 'too_short'
  | 'too_long'
  | 'invalid_prefix'
  | 'not_indian';

export interface PhoneParseResult {
  /** E.164, e.g. +919876543210. Present only when ok is true. */
  e164?: string;
  /** The 10 national digits, for display as "98765 43210". */
  national?: string;
  ok: boolean;
  error?: PhoneValidationError;
}

/**
 * Strips everything that is not a digit, then peels off the country code in
 * whichever form it was written.
 */
function toNationalDigits(input: string): { digits: string; sawCountryCode: boolean } {
  let digits = input.replace(/\D/g, '');
  let sawCountryCode = false;

  // 00 91 XXXXXXXXXX — international prefix as dialled from a landline.
  if (digits.startsWith('00' + DEFAULT_COUNTRY_CODE)) {
    digits = digits.slice(2 + DEFAULT_COUNTRY_CODE.length);
    sawCountryCode = true;
  } else if (digits.length > 10 && digits.startsWith(DEFAULT_COUNTRY_CODE)) {
    // 91XXXXXXXXXX, with or without a leading +. Length-guarded so a national
    // number that happens to begin with 91 is not mistaken for a country code.
    digits = digits.slice(DEFAULT_COUNTRY_CODE.length);
    sawCountryCode = true;
  }

  // A single leading 0 is the domestic trunk prefix and is not dialled from
  // abroad. Strip it only when what remains is a plausible mobile number.
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  return { digits, sawCountryCode };
}

/**
 * Parses user input into E.164, or explains why it cannot.
 *
 * Never throws: the caller renders `error` as a translated message beneath the
 * input rather than handling an exception.
 */
export function parseIndianPhone(input: string): PhoneParseResult {
  if (!input || !input.trim()) {
    return { ok: false, error: 'empty' };
  }

  const raw = input.trim();

  // An explicit +<code> that is not +91 is out of scope for this build, and
  // must be rejected loudly rather than silently rewritten to an Indian number.
  const explicit = raw.match(/^\+(\d{1,3})/);
  if (explicit && !('91'.startsWith(explicit[1]) || explicit[1].startsWith('91'))) {
    return { ok: false, error: 'not_indian' };
  }

  const { digits } = toNationalDigits(raw);

  if (digits.length < 10) return { ok: false, error: 'too_short' };
  if (digits.length > 10) return { ok: false, error: 'too_long' };
  if (!INDIAN_MOBILE.test(digits)) return { ok: false, error: 'invalid_prefix' };

  return {
    ok: true,
    e164: `+${DEFAULT_COUNTRY_CODE}${digits}`,
    national: digits
  };
}

/** Convenience wrapper for callers that only need the E.164 string. */
export function toE164(input: string): string | null {
  return parseIndianPhone(input).e164 ?? null;
}

/**
 * Groups the national number as "98765 43210" for display while typing.
 * Applied to partial input too, so the field formats as the user types.
 */
export function formatIndianPhoneInput(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
}

/**
 * Masks a number for display: +91 98765 43210 becomes +91 ••••• 43210.
 *
 * Used on the OTP screen, which is often reached on a shared or borrowed
 * handset — the citizen needs to confirm the last digits are theirs without
 * the whole number sitting on screen.
 */
export function maskPhone(e164: string): string {
  const digits = e164.replace(/\D/g, '');
  const last4 = digits.slice(-4);
  if (digits.length < 4) return e164;
  return `+${DEFAULT_COUNTRY_CODE} •••••• ${last4}`;
}

/** Whether a string is a plausible 6-digit OTP. */
export function isValidOtp(token: string): boolean {
  return /^[0-9]{6}$/.test(token.trim());
}
