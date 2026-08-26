import { describe, it, expect } from 'vitest';
import {
  parseIndianPhone,
  toE164,
  formatIndianPhoneInput,
  maskPhone,
  isValidOtp
} from './phone';

describe('parseIndianPhone — the ways people actually write their number', () => {
  const accepted: [string, string][] = [
    ['9876543210', 'plain 10 digits'],
    ['98765 43210', 'spaced as printed'],
    ['98765-43210', 'hyphenated'],
    ['+919876543210', 'E.164 already'],
    ['+91 98765 43210', 'E.164 with spaces'],
    ['+91-98765-43210', 'E.164 hyphenated'],
    ['919876543210', 'country code, no plus'],
    ['09876543210', 'domestic trunk prefix'],
    ['00919876543210', 'international dialling prefix'],
    ['  9876543210  ', 'padded with whitespace'],
    ['(98765) 43210', 'parenthesised']
  ];

  it.each(accepted)('accepts %s (%s)', (input) => {
    const result = parseIndianPhone(input);
    expect(result.ok).toBe(true);
    expect(result.e164).toBe('+919876543210');
    expect(result.national).toBe('9876543210');
  });

  it('accepts every valid Indian mobile prefix', () => {
    for (const prefix of ['6', '7', '8', '9']) {
      const result = parseIndianPhone(`${prefix}123456789`);
      expect(result.ok).toBe(true);
      expect(result.e164).toBe(`+91${prefix}123456789`);
    }
  });

  it('does not mistake a national number beginning 91 for a country code', () => {
    // 9123456789 is a valid mobile that happens to start with 91. Peeling the
    // country code off it would produce an 8-digit number and a failed OTP.
    const result = parseIndianPhone('9123456789');
    expect(result.ok).toBe(true);
    expect(result.e164).toBe('+919123456789');
  });
});

describe('parseIndianPhone — rejections explain themselves', () => {
  it('rejects empty input', () => {
    expect(parseIndianPhone('').error).toBe('empty');
    expect(parseIndianPhone('   ').error).toBe('empty');
  });

  it('rejects a short number', () => {
    expect(parseIndianPhone('98765').error).toBe('too_short');
  });

  it('rejects a long number', () => {
    expect(parseIndianPhone('98765432101234').error).toBe('too_long');
  });

  it('rejects landline and invalid prefixes', () => {
    // Indian mobiles never start 0-5; 2012345678 is a landline pattern.
    expect(parseIndianPhone('2012345678').error).toBe('invalid_prefix');
    expect(parseIndianPhone('5012345678').error).toBe('invalid_prefix');
  });

  it('rejects a non-Indian country code rather than silently rewriting it', () => {
    // The dangerous case: +1 555... must not become +91 5555... and send an
    // OTP to a stranger's Indian number.
    expect(parseIndianPhone('+15555555555').error).toBe('not_indian');
    expect(parseIndianPhone('+442071838750').error).toBe('not_indian');
  });

  it('never throws on hostile input', () => {
    for (const junk of ['abc', '+', '++91', '---', '\n\t', '+91', 'null']) {
      expect(() => parseIndianPhone(junk)).not.toThrow();
      expect(parseIndianPhone(junk).ok).toBe(false);
    }
  });
});

describe('toE164', () => {
  it('returns the E.164 string or null', () => {
    expect(toE164('98765 43210')).toBe('+919876543210');
    expect(toE164('nonsense')).toBeNull();
  });
});

describe('formatIndianPhoneInput', () => {
  it('groups as the user types and caps at 10 digits', () => {
    expect(formatIndianPhoneInput('98765')).toBe('98765');
    expect(formatIndianPhoneInput('987654')).toBe('98765 4');
    expect(formatIndianPhoneInput('9876543210')).toBe('98765 43210');
    expect(formatIndianPhoneInput('98765432109999')).toBe('98765 43210');
  });

  it('strips non-digits so pasted numbers reformat cleanly', () => {
    expect(formatIndianPhoneInput('+91-98765-43210')).toBe('91987 65432');
  });
});

describe('maskPhone', () => {
  it('shows only the last four digits', () => {
    const masked = maskPhone('+919876543210');
    expect(masked).toContain('3210');
    expect(masked).not.toContain('98765');
  });
});

describe('isValidOtp', () => {
  it('accepts exactly six digits', () => {
    expect(isValidOtp('123456')).toBe(true);
    expect(isValidOtp(' 123456 ')).toBe(true);
  });

  it('rejects anything else', () => {
    for (const bad of ['12345', '1234567', '12345a', '', 'abcdef']) {
      expect(isValidOtp(bad)).toBe(false);
    }
  });
});
