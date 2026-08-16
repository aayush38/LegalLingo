/**
 * Privacy Shield Utility for masking PII (Personally Identifiable Information)
 * in legal document explanations and exported summaries.
 */

export function maskName(name: string): string {
  if (!name) return name;
  const parts = name.trim().split(/\s+/);
  return parts
    .map((part) => {
      if (part.length <= 2) return part[0] + '*';
      return part[0] + '*'.repeat(part.length - 2) + part[part.length - 1];
    })
    .join(' ');
}

export function maskPhone(phone: string): string {
  if (!phone) return phone;
  const clean = phone.replace(/\D/g, '');
  if (clean.length >= 10) {
    return '******' + clean.slice(-4);
  }
  return '******' + clean.slice(-2);
}

export function maskAadhaar(aadhaar: string): string {
  if (!aadhaar) return aadhaar;
  const clean = aadhaar.replace(/\D/g, '');
  if (clean.length >= 12) {
    return 'XXXX XXXX ' + clean.slice(-4);
  }
  return 'XXXX XXXX ' + clean.slice(-4);
}

export function maskPAN(pan: string): string {
  if (!pan) return pan;
  const clean = pan.trim().toUpperCase();
  if (clean.length === 10) {
    return clean[0] + '****' + clean.slice(5, 9) + '*';
  }
  return clean[0] + '****' + clean.slice(-2);
}

export function applyPrivacyMask(text: string, enabled: boolean): string {
  if (!enabled || !text) return text;

  let masked = text;

  // Mask Aadhaar: 12 digit numbers or XXXX XXXX 1234
  masked = masked.replace(/\b\d{4}\s?\d{4}\s?(\d{4})\b/g, 'XXXX XXXX $1');

  // Mask PAN card format: 5 letters, 4 digits, 1 letter
  masked = masked.replace(/\b([A-Z]{5})(\d{4})([A-Z]{1})\b/gi, (match, p1, p2, p3) => {
    return `${p1[0]}****${p2}${p3}`;
  });

  // Mask Indian phone numbers (10 digits starting with 6, 7, 8, 9)
  masked = masked.replace(/\b[6-9]\d{9}\b/g, (match) => '******' + match.slice(-4));

  return masked;
}
