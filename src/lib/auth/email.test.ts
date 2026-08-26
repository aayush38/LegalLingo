import { describe, it, expect } from 'vitest';
import { parseEmail, normaliseEmail, maskEmail, isValidOtp } from './email';

describe('parseEmail — accepts what real people type', () => {
  const accepted: [string, string][] = [
    ['ramesh.patil@gmail.com', 'ordinary address'],
    ['  ramesh.patil@gmail.com  ', 'padded with spaces'],
    ['Ramesh.Patil@Gmail.COM', 'mixed case'],
    ['ramesh patil@gmail.com'.replace(' ', ''), 'space removed by the caller'],
    ['ramesh+legal@gmail.com', 'plus addressing'],
    ['r@a.co', 'short but valid'],
    ['ramesh.patil@mail.co.in', 'multi-part domain']
  ];

  it.each(accepted)('accepts %s (%s)', (input) => {
    expect(parseEmail(input).ok).toBe(true);
  });

  it('normalises case and whitespace', () => {
    // Sign-in must not depend on how the address was capitalised, or someone
    // typing Gmail.com is locked out of documents saved under gmail.com.
    expect(parseEmail('  Ramesh.Patil@GMAIL.com ').email).toBe('ramesh.patil@gmail.com');
  });

  it('strips a line break pasted from the middle of an address', () => {
    expect(parseEmail('ramesh.patil@\ngmail.com').email).toBe('ramesh.patil@gmail.com');
  });
});

describe('parseEmail — rejections explain themselves', () => {
  it('rejects empty input', () => {
    expect(parseEmail('').error).toBe('empty');
    expect(parseEmail('    ').error).toBe('empty');
  });

  it('rejects an address with no @', () => {
    expect(parseEmail('rameshpatil.gmail.com').error).toBe('no_at');
  });

  it('rejects malformed addresses', () => {
    for (const bad of ['ramesh@', '@gmail.com', 'ramesh@gmail', 'ramesh@@gmail.com', 'ramesh@.com', 'ramesh@gmail.']) {
      expect(parseEmail(bad).ok).toBe(false);
      expect(parseEmail(bad).error).toBe('malformed');
    }
  });

  it('rejects an over-long address', () => {
    const long = 'a'.repeat(250) + '@gmail.com';
    expect(parseEmail(long).error).toBe('too_long');
  });

  it('never throws on hostile input', () => {
    for (const junk of ['@', '@@', '\n\t', 'null', '<script>', '..@..']) {
      expect(() => parseEmail(junk)).not.toThrow();
      expect(parseEmail(junk).ok).toBe(false);
    }
  });
});

describe('normaliseEmail', () => {
  it('returns the normalised address or null', () => {
    expect(normaliseEmail(' Ramesh@Gmail.com ')).toBe('ramesh@gmail.com');
    expect(normaliseEmail('nonsense')).toBeNull();
  });
});

describe('maskEmail', () => {
  it('keeps the domain and the first two characters', () => {
    const masked = maskEmail('ramesh.patil@gmail.com');
    expect(masked.startsWith('ra')).toBe(true);
    expect(masked.endsWith('@gmail.com')).toBe(true);
    expect(masked).not.toContain('mesh.patil');
  });

  it('handles a very short local part without exposing it whole', () => {
    expect(maskEmail('ab@x.com')).toBe('a•@x.com');
  });

  it('leaves a malformed value alone rather than throwing', () => {
    expect(() => maskEmail('not-an-email')).not.toThrow();
    expect(maskEmail('not-an-email')).toBe('not-an-email');
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
