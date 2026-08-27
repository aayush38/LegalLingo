import { describe, it, expect } from 'vitest';
import { verifyIdentity } from './verifyIdentity';
import type { DocumentAnalysis } from '@/lib/types';

function analysis(overrides: Partial<DocumentAnalysis> = {}): DocumentAnalysis {
  return {
    id: 'doc',
    documentTitle: 'Sale Agreement',
    documentType: 'Sale Agreement',
    parties: [],
    fiveQuestions: {
      documentType: 'Sale Agreement',
      partiesInvolved: {},
      totalAmount: '',
      missingPoints: '',
      nextStepsSummary: ''
    },
    ...overrides
  } as unknown as DocumentAnalysis;
}

describe('verifyIdentity — the citizen is named', () => {
  it('confirms an exact match and reports the role', () => {
    const result = verifyIdentity(
      'Ramesh Vithal Patil',
      analysis({
        parties: [
          { role: 'Seller', name: 'Ramesh Vithal Patil' },
          { role: 'Buyer', name: 'Suresh Tukaram Jadhav' }
        ]
      })
    );
    expect(result.verdict).toBe('CONFIRMED');
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].role).toBe('Seller');
    expect(result.matches[0].quality).toBe('SAME');
  });

  it('treats an initialled middle name as LIKELY, not a mismatch', () => {
    // "Ramesh V. Patil" on the deed and "Ramesh Vithal Patil" on the Aadhaar is
    // the single most common benign difference in Indian records. Calling it a
    // mismatch would send people to a lawyer over nothing.
    const result = verifyIdentity(
      'Ramesh Vithal Patil',
      analysis({ parties: [{ role: 'Vendor', name: 'Ramesh V. Patil' }] })
    );
    expect(result.verdict).toBe('LIKELY');
    expect(result.matches[0].quality).toBe('ABBREVIATION');
  });

  it('reads parties from fiveQuestions when parties[] is empty', () => {
    const result = verifyIdentity(
      'Suresh Tukaram Jadhav',
      analysis({
        fiveQuestions: {
          documentType: 'Sale Agreement',
          partiesInvolved: { seller: 'Ramesh Vithal Patil', buyer: 'Suresh Tukaram Jadhav' },
          totalAmount: '',
          missingPoints: '',
          nextStepsSummary: ''
        }
      })
    );
    expect(result.verdict).toBe('CONFIRMED');
    expect(result.matches[0].role).toBe('Buyer');
  });

  it('reports both roles when the same person appears twice', () => {
    const result = verifyIdentity(
      'Ramesh Vithal Patil',
      analysis({
        parties: [
          { role: 'Seller', name: 'Ramesh Vithal Patil' },
          { role: 'Confirming Party', name: 'Ramesh Vithal Patil' }
        ]
      })
    );
    expect(result.matches).toHaveLength(2);
  });

  it('does not double-report the same person from both sources', () => {
    const result = verifyIdentity(
      'Ramesh Vithal Patil',
      analysis({
        parties: [{ role: 'Seller', name: 'Ramesh Vithal Patil' }],
        fiveQuestions: {
          documentType: 'Sale Agreement',
          partiesInvolved: { seller: 'Ramesh Vithal Patil' },
          totalAmount: '',
          missingPoints: '',
          nextStepsSummary: ''
        }
      })
    );
    expect(result.matches).toHaveLength(1);
  });
});

describe('verifyIdentity — the citizen is not named', () => {
  it('flags NOT_NAMED and lists who the document does name', () => {
    // The case worth surfacing: someone is handed a deed to sign that names a
    // different person.
    const result = verifyIdentity(
      'Ramesh Vithal Patil',
      analysis({
        parties: [
          { role: 'Seller', name: 'Ganpat Sopan Deshmukh' },
          { role: 'Buyer', name: 'Suresh Tukaram Jadhav' }
        ]
      })
    );
    expect(result.verdict).toBe('NOT_NAMED');
    expect(result.matches).toHaveLength(0);
    expect(result.otherParties.map((p) => p.name)).toEqual([
      'Ganpat Sopan Deshmukh',
      'Suresh Tukaram Jadhav'
    ]);
  });

  it('does not match on a shared surname alone', () => {
    const result = verifyIdentity(
      'Ramesh Vithal Patil',
      analysis({ parties: [{ role: 'Seller', name: 'Ganpat Sopan Patil' }] })
    );
    expect(result.verdict).toBe('NOT_NAMED');
  });
});

describe('verifyIdentity — nothing to compare', () => {
  it('returns UNKNOWN with no name', () => {
    expect(verifyIdentity('', analysis()).verdict).toBe('UNKNOWN');
    expect(verifyIdentity(null, analysis()).verdict).toBe('UNKNOWN');
    expect(verifyIdentity(undefined, analysis()).verdict).toBe('UNKNOWN');
  });

  it('returns UNKNOWN with no analysis', () => {
    expect(verifyIdentity('Ramesh Patil', null).verdict).toBe('UNKNOWN');
  });

  it('returns UNKNOWN when the document names nobody', () => {
    // Better to say nothing than to tell a citizen they are "not named" in a
    // document whose parties simply could not be extracted.
    const result = verifyIdentity('Ramesh Patil', analysis({ parties: [] }));
    expect(result.verdict).toBe('UNKNOWN');
  });

  it('never throws on malformed party data', () => {
    const bad = analysis({
      parties: [
        { role: '', name: '' },
        { role: 'Seller', name: '   ' }
      ] as never
    });
    expect(() => verifyIdentity('Ramesh Patil', bad)).not.toThrow();
    expect(verifyIdentity('Ramesh Patil', bad).verdict).toBe('UNKNOWN');
  });
});
