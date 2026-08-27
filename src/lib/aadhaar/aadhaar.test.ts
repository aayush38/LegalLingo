import { describe, it, expect } from 'vitest';
import { isVerhoeffValid, extractAadhaar, looksLikeAadhaarCard } from './aadhaar';

/**
 * Verhoeff-valid twelve-digit strings, generated to satisfy the checksum.
 * These are not real Aadhaar numbers — they are structurally valid strings,
 * which is exactly what the checksum is being tested against.
 */
const VALID = '234567890124';
const INVALID = '234567890123';

describe('Verhoeff checksum', () => {
  it('accepts a valid string', () => {
    expect(isVerhoeffValid(VALID)).toBe(true);
  });

  it('rejects a single wrong digit', () => {
    expect(isVerhoeffValid(INVALID)).toBe(false);
  });

  it('catches every single-digit error in a valid number', () => {
    // The property that makes the checksum worth running: any one-digit OCR
    // misread is detected.
    for (let pos = 0; pos < VALID.length; pos++) {
      for (let d = 0; d <= 9; d++) {
        if (Number(VALID[pos]) === d) continue;
        const mutated = VALID.slice(0, pos) + d + VALID.slice(pos + 1);
        expect(isVerhoeffValid(mutated)).toBe(false);
      }
    }
  });

  it('catches adjacent transpositions', () => {
    for (let i = 0; i < VALID.length - 1; i++) {
      if (VALID[i] === VALID[i + 1]) continue;
      const swapped =
        VALID.slice(0, i) + VALID[i + 1] + VALID[i] + VALID.slice(i + 2);
      expect(isVerhoeffValid(swapped)).toBe(false);
    }
  });

  it('rejects non-digits without throwing', () => {
    expect(isVerhoeffValid('abcd')).toBe(false);
    expect(isVerhoeffValid('')).toBe(false);
    expect(isVerhoeffValid('1234 5678 9012')).toBe(false);
  });
});

const CARD = `
Government of India
भारत सरकार

रमेश विठ्ठल पाटील
Ramesh Vithal Patil
DOB: 14/08/1979
MALE / पुरुष

${VALID.slice(0, 4)} ${VALID.slice(4, 8)} ${VALID.slice(8)}
आधार - आम आदमी का अधिकार
`;

describe('extractAadhaar — the safety property', () => {
  it('NEVER returns the full number anywhere in its output', () => {
    const result = extractAadhaar(CARD);
    expect(result.found).toBe(true);

    // Every string the caller can reach must be free of the whole number.
    const serialised = JSON.stringify(result);
    expect(serialised).not.toContain(VALID);
    expect(serialised).not.toContain(VALID.slice(0, 8));
    // Only the last four survive.
    expect(result.last4).toBe(VALID.slice(-4));
    expect(result.last4).toHaveLength(4);
  });

  it('returns last4 that satisfies the database CHECK constraint', () => {
    const result = extractAadhaar(CARD);
    expect(result.last4).toMatch(/^[0-9]{4}$/);
  });
});

describe('extractAadhaar — reading the card', () => {
  it('finds the Latin-script name above the date of birth', () => {
    // Not the Devanagari copy: the deed being cross-checked is in English.
    expect(extractAadhaar(CARD).name).toBe('Ramesh Vithal Patil');
  });

  it('does not mistake card furniture for a name', () => {
    const name = extractAadhaar(CARD).name ?? '';
    expect(name).not.toMatch(/government|india|aadhaar|male/i);
  });

  it('reads date of birth and gender', () => {
    const r = extractAadhaar(CARD);
    expect(r.dob).toBe('14/08/1979');
    expect(r.gender).toBe('Male');
  });

  it('handles the number printed without spaces', () => {
    const r = extractAadhaar(`Government of India\nRamesh Patil\nDOB: 01/01/1980\n${VALID}`);
    expect(r.found).toBe(true);
    expect(r.last4).toBe(VALID.slice(-4));
  });

  it('reads "Year of Birth" cards', () => {
    const r = extractAadhaar(
      `Government of India\nSuresh Jadhav\nYear of Birth: 1985\nFEMALE\n${VALID}`
    );
    expect(r.dob).toBe('1985');
    expect(r.gender).toBe('Female');
  });
});

describe('extractAadhaar — text with no line structure', () => {
  // A PDF text layer routinely yields the whole card as one run. The original
  // implementation anchored on "the line above the date of birth", found no
  // such line, and returned no name at all — caught only by running a real
  // card through the real OCR path, not by the tests above.
  const ONE_RUN =
    `GOVERNMENT OF INDIA Ramesh Vithal Patil DOB: 14/08/1979 MALE ` +
    `${VALID.slice(0, 4)} ${VALID.slice(4, 8)} ${VALID.slice(8)} ` +
    `Unique Identification Authority of India`;

  it('still finds the name when everything is on one line', () => {
    const r = extractAadhaar(ONE_RUN);
    expect(r.found).toBe(true);
    expect(r.name).toBe('Ramesh Vithal Patil');
  });

  it('does not let card furniture bleed into the name', () => {
    expect(extractAadhaar(ONE_RUN).name).not.toMatch(/government|india|dob|male/i);
  });

  it('still reads the rest of the card', () => {
    const r = extractAadhaar(ONE_RUN);
    expect(r.last4).toBe(VALID.slice(-4));
    expect(r.dob).toBe('14/08/1979');
    expect(r.gender).toBe('Male');
  });

  it('keeps the safety property with no line structure', () => {
    expect(JSON.stringify(extractAadhaar(ONE_RUN))).not.toContain(VALID);
  });

  it('handles the name running straight into the number', () => {
    const r = extractAadhaar(`GOVERNMENT OF INDIA Suresh Jadhav ${VALID}`);
    expect(r.found).toBe(true);
    expect(r.name).toBe('Suresh Jadhav');
  });
});

describe('extractAadhaar — rejections', () => {
  it('reports a checksum failure rather than storing a misread number', () => {
    const r = extractAadhaar(`Government of India\nRamesh Patil\nDOB: 01/01/1980\n${INVALID}`);
    expect(r.found).toBe(false);
    expect(r.checksumFailed).toBe(true);
    expect(r.last4).toBeUndefined();
  });

  it('does not treat a 16-digit VID as an Aadhaar number', () => {
    // A VID contains valid-looking 12-digit substrings; accepting one would
    // store the wrong last four digits against somebody's profile.
    const r = extractAadhaar(`Government of India\nVID : 9182 7364 5546 1234\nRamesh Patil`);
    expect(r.found).toBe(false);
  });

  it('returns not-found for text with no number at all', () => {
    const r = extractAadhaar('Government of India\nRamesh Patil\nDOB: 01/01/1980');
    expect(r.found).toBe(false);
    expect(r.checksumFailed).toBeUndefined();
  });

  it('never throws on junk', () => {
    for (const junk of ['', '   ', '\n\n', 'aaaa', '1234']) {
      expect(() => extractAadhaar(junk)).not.toThrow();
      expect(extractAadhaar(junk).found).toBe(false);
    }
  });
});

describe('extractAadhaar - address and care-of name', () => {
  const NL = String.fromCharCode(10);
  const grouped = VALID.slice(0, 4) + ' ' + VALID.slice(4, 8) + ' ' + VALID.slice(8);

  const WITH_ADDRESS = [
    'Government of India',
    'Ramesh Vithal Patil',
    'DOB: 14/08/1979',
    'MALE',
    'Address: S/O Vithal Ganpat Patil, Plot 14 Shivaji Nagar, Khed, Pune, Maharashtra - 410501',
    grouped
  ].join(NL);

  it('reads the S/O name', () => {
    expect(extractAadhaar(WITH_ADDRESS).careOfName).toBe('Vithal Ganpat Patil');
  });

  it('splits the address into form fields', () => {
    const a = extractAadhaar(WITH_ADDRESS).address;
    expect(a).toBeDefined();
    expect(a!.state).toBe('Maharashtra');
    expect(a!.pincode).toBe('410501');
    expect(a!.district).toBe('Pune');
    expect(a!.city).toBe('Khed');
    expect(a!.line).toContain('Shivaji Nagar');
    // The father's name must not leak into the address line.
    expect(a!.line).not.toContain('Vithal Ganpat Patil');
    expect(a!.line).not.toMatch(/S\/O/i);
  });

  it('does not take a PIN code out of the Aadhaar number', () => {
    // Six consecutive digits sit inside every twelve-digit Aadhaar. Reading one
    // as a PIN would drop a fragment of somebody's Aadhaar into their address.
    const noPin = [
      'Government of India',
      'Ramesh Patil',
      'Address: Plot 14, Khed, Pune, Maharashtra',
      VALID
    ].join(NL);
    expect(extractAadhaar(noPin).address?.pincode).toBeUndefined();
  });

  it('rejects a PIN code starting with zero', () => {
    const bad = [
      'Government of India',
      'Ramesh Patil',
      'Address: Plot 14, Khed, Pune, Maharashtra - 010501',
      VALID
    ].join(NL);
    expect(extractAadhaar(bad).address?.pincode).toBeUndefined();
  });

  it('handles W/O, D/O and C/O as well as S/O', () => {
    for (const rel of ['W/O', 'D/O', 'C/O']) {
      const t = [
        'Government of India',
        'Sunita Patil',
        'Address: ' + rel + ' Ramesh Patil, Khed, Pune, Maharashtra - 410501',
        VALID
      ].join(NL);
      expect(extractAadhaar(t).careOfName).toBe('Ramesh Patil');
    }
  });

  it('returns no address when the card has none', () => {
    const t = ['Government of India', 'Ramesh Patil', 'DOB: 01/01/1980', VALID].join(NL);
    expect(extractAadhaar(t).address).toBeUndefined();
  });

  it('still never exposes the full number', () => {
    expect(JSON.stringify(extractAadhaar(WITH_ADDRESS))).not.toContain(VALID);
  });
});

describe('looksLikeAadhaarCard', () => {
  it('recognises the card in English and Hindi', () => {
    expect(looksLikeAadhaarCard('GOVERNMENT OF INDIA')).toBe(true);
    expect(looksLikeAadhaarCard('भारत सरकार')).toBe(true);
    expect(looksLikeAadhaarCard('Unique Identification Authority')).toBe(true);
  });

  it('rejects an unrelated document', () => {
    expect(looksLikeAadhaarCard('THIS AGREEMENT OF SALE is made at Pune')).toBe(false);
  });
});
