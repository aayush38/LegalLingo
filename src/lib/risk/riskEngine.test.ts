import { describe, it, expect } from 'vitest';
import type { DocumentAnalysis } from '../types';
import { runRiskEngine, RISK_ENGINE_VERSION } from './riskEngine';
import { normalizeFacts } from './normalizeFacts';
import { compareNames, parseIndianAmount, extractSurveyNumbers, maskIdentifier } from './textUtils';

/**
 * Builds a minimal DocumentAnalysis. Only the fields the Risk Engine reads are
 * populated; everything else is cast away so tests stay readable.
 */
function makeAnalysis(overrides: Partial<DocumentAnalysis> = {}): DocumentAnalysis {
  return {
    id: 'test-doc',
    documentTitle: 'Test Agreement',
    documentType: 'Sale Agreement',
    originalText: '',
    paragraphs: [],
    importantClauses: [],
    missingInformation: [],
    parties: [],
    keyInformation: [],
    legalTerms: [],
    recommendedActions: [],
    relevantServices: [],
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

function clause(id: string, originalText: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    clauseTitle: `Clause ${id}`,
    originalText,
    simpleMeaning: '',
    whyItMatters: '',
    recommendedAction: '',
    riskLevel: 'standard' as const,
    page: 1,
    ...extra
  };
}

const ruleIds = (analysis: DocumentAnalysis) => runRiskEngine(analysis).findings.map((f) => f.ruleId);
const findingFor = (analysis: DocumentAnalysis, ruleId: string) =>
  runRiskEngine(analysis).findings.find((f) => f.ruleId === ruleId);

describe('Risk Engine — mortgage / release (PROP_MORT_002)', () => {
  // Test 1
  it('fires HIGH_ATTENTION when a mortgage exists and no release mechanism is stated', () => {
    const analysis = makeAnalysis({
      importantClauses: [
        clause(
          'c1',
          'The Vendor admits that Gat No. 142/3A is mortgaged to Haveli Cooperative Credit Society for an outstanding crop loan of Rs. 2,80,000/-.'
        )
      ]
    });

    const finding = findingFor(analysis, 'PROP_MORT_002');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('HIGH_ATTENTION');
    expect(finding!.evidence?.length).toBeGreaterThan(0);
  });

  // Test 2
  it('does NOT fire when a release/discharge mechanism is present', () => {
    const analysis = makeAnalysis({
      importantClauses: [
        clause('c1', 'Gat No. 142/3A is mortgaged to Haveli Cooperative Credit Society for Rs. 2,80,000/-.'),
        clause('c2', 'The mortgage shall be released by the Vendor prior to execution of the final sale deed.')
      ]
    });

    expect(ruleIds(analysis)).not.toContain('PROP_MORT_002');
    // The mortgage itself is still worth reviewing.
    expect(ruleIds(analysis)).toContain('PROP_MORT_001');
  });

  it('does NOT treat advisory text as evidence that an NOC exists', () => {
    // recommendedAction is model commentary. If it were read as document text,
    // "obtain a bank NOC" would suppress the very finding it is warning about.
    const analysis = makeAnalysis({
      importantClauses: [
        clause(
          'c1',
          'The Vendor admits the land is mortgaged to the bank for Rs. 2,80,000/-.',
          { recommendedAction: 'Obtain an official tripartite agreement and release deed from the bank before paying.' }
        )
      ]
    });

    expect(ruleIds(analysis)).toContain('PROP_MORT_002');
  });
});

describe('Risk Engine — financial reconciliation (FIN_RECON_001)', () => {
  // Test 3
  it('does NOT fire when the components reconcile', () => {
    const analysis = makeAnalysis({
      fiveQuestions: {
        documentType: 'Sale Agreement',
        partiesInvolved: { seller: 'Ramesh Patil', buyer: 'Suresh Jadhav' },
        // 3,50,000 + 2,80,000 + 12,20,000 = 18,50,000
        totalAmount: 'Rs 18,50,000 (Advance: Rs 3,50,000 | Bank Loan Debt: Rs 2,80,000 | Balance: Rs 12,20,000)',
        missingPoints: '',
        nextStepsSummary: ''
      }
    });

    expect(ruleIds(analysis)).not.toContain('FIN_RECON_001');
  });

  // Test 4
  it('fires HIGH_ATTENTION on a material mismatch', () => {
    const analysis = makeAnalysis({
      fiveQuestions: {
        documentType: 'Sale Agreement',
        partiesInvolved: { seller: 'Ramesh Patil', buyer: 'Suresh Jadhav' },
        // Components total 15,00,000 against a stated 18,50,000.
        totalAmount: 'Rs 18,50,000 (Advance: Rs 3,00,000 | Bank Loan Debt: Rs 2,00,000 | Balance: Rs 10,00,000)',
        missingPoints: '',
        nextStepsSummary: ''
      }
    });

    const finding = findingFor(analysis, 'FIN_RECON_001');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('HIGH_ATTENTION');
    expect(finding!.reason).toContain('3,50,000');
  });

  it('tolerates a rounding-level difference', () => {
    const analysis = makeAnalysis({
      fiveQuestions: {
        documentType: 'Sale Agreement',
        partiesInvolved: {},
        totalAmount: 'Rs 18,50,000 (Advance: Rs 3,50,000 | Bank Loan Debt: Rs 2,80,000 | Balance: Rs 12,19,500)',
        missingPoints: '',
        nextStepsSummary: ''
      }
    });

    expect(ruleIds(analysis)).not.toContain('FIN_RECON_001');
  });
});

describe('Risk Engine — party name consistency', () => {
  // Test 5
  it('reports no conflict when the seller name is identical across clauses', () => {
    const analysis = makeAnalysis({
      parties: [
        { role: 'Seller', name: 'Ramesh Vithal Patil' },
        { role: 'Buyer', name: 'Suresh Tukaram Jadhav' }
      ],
      fiveQuestions: {
        documentType: 'Sale Agreement',
        partiesInvolved: { seller: 'Ramesh Vithal Patil', buyer: 'Suresh Tukaram Jadhav' },
        totalAmount: '',
        missingPoints: '',
        nextStepsSummary: ''
      }
    });

    expect(ruleIds(analysis)).not.toContain('ID_SELLER_CONFLICT_001');
  });

  // Test 6
  it('flags materially different seller names', () => {
    const analysis = makeAnalysis({
      parties: [
        { role: 'Seller', name: 'Ramesh Vithal Patil' },
        { role: 'Vendor', name: 'Ganpat Sopan Deshmukh' }
      ]
    });

    const finding = findingFor(analysis, 'ID_SELLER_CONFLICT_001');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('HIGH_ATTENTION');
  });

  it('treats an abbreviated middle name as REVIEW, not a conflict', () => {
    const analysis = makeAnalysis({
      parties: [
        { role: 'Seller', name: 'Ramesh Vithal Patil' },
        { role: 'Vendor', name: 'Ramesh V. Patil' }
      ]
    });

    const finding = findingFor(analysis, 'ID_SELLER_CONFLICT_001');
    expect(finding?.severity).toBe('REVIEW');
  });
});

describe('Risk Engine — witness information (MISS_WITNESS_001)', () => {
  // Test 7
  it('fires when no witness information is present', () => {
    const analysis = makeAnalysis({
      importantClauses: [clause('c1', 'The Purchaser shall pay the balance amount as agreed.')]
    });

    const finding = findingFor(analysis, 'MISS_WITNESS_001');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('REVIEW');
  });

  it('does not fire when witness names are present', () => {
    const analysis = makeAnalysis({
      importantClauses: [clause('c1', 'Witness 1: Anil Kumar Sharma\nWitness 2: Vijay Raghunath More')]
    });

    expect(ruleIds(analysis)).not.toContain('MISS_WITNESS_001');
  });
});

describe('Risk Engine — forfeiture and deadlines', () => {
  it('flags a forfeiture consequence as HIGH_ATTENTION', () => {
    const analysis = makeAnalysis({
      importantClauses: [
        clause('c1', 'The Vendor reserves the right to cancel this agreement and forfeit Rs. 3,50,000/- earnest deposit.')
      ]
    });

    const finding = findingFor(analysis, 'PAY_FORFEIT_001');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('HIGH_ATTENTION');
  });

  it('flags a time-bound payment obligation as REVIEW', () => {
    const analysis = makeAnalysis({
      importantClauses: [
        clause('c1', 'The Purchaser shall pay the balance consideration on or before 15th September 2026.')
      ]
    });

    const finding = findingFor(analysis, 'PAY_DEADLINE_001');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('REVIEW');
  });
});

describe('Risk Engine — confidence and coverage', () => {
  // Test 8
  it('downgrades confidence when the document was not fully analyzed', () => {
    const clauses = [clause('c1', 'The land is mortgaged to the bank for Rs. 2,80,000/-.')];

    const complete = makeAnalysis({
      importantClauses: clauses,
      analysisMeta: { fullyAnalyzed: true } as DocumentAnalysis['analysisMeta']
    });
    const partial = makeAnalysis({
      importantClauses: clauses,
      analysisMeta: { fullyAnalyzed: false } as DocumentAnalysis['analysisMeta']
    });

    expect(findingFor(complete, 'PROP_MORT_002')!.confidence).toBe('MEDIUM');
    expect(findingFor(partial, 'PROP_MORT_002')!.confidence).toBe('LOW');
  });

  it('keeps HIGH confidence for unambiguous positive evidence even on partial coverage', () => {
    // A forfeiture clause we actually read is unambiguous regardless of whether
    // later pages failed — the evidence is present, not inferred from absence.
    const partial = makeAnalysis({
      importantClauses: [clause('c1', 'The seller may forfeit the earnest money if payment is delayed.')],
      analysisMeta: { fullyAnalyzed: false } as DocumentAnalysis['analysisMeta']
    });

    expect(findingFor(partial, 'PAY_FORFEIT_001')!.confidence).toBe('HIGH');
  });
});

describe('Risk Engine — property identifiers', () => {
  it('does not flag a genuine multi-parcel sale', () => {
    const analysis = makeAnalysis({
      importantClauses: [clause('c1', 'The property comprises Gat No. 142/3A, Gat No. 142/3B and Gat No. 145.')]
    });

    expect(ruleIds(analysis)).not.toContain('PROP_ID_CONFLICT_001');
  });

  it('flags a base parcel used alongside its own sub-division', () => {
    const analysis = makeAnalysis({
      importantClauses: [
        clause('c1', 'The property is Gat No. 142/3A situated at Village Khed.'),
        clause('c2', 'The Vendor shall deliver possession of Gat No. 142 to the Purchaser.')
      ]
    });

    expect(ruleIds(analysis)).toContain('PROP_ID_CONFLICT_001');
  });

  it('flags a missing property identifier', () => {
    const analysis = makeAnalysis({
      importantClauses: [clause('c1', 'The Vendor agrees to sell the said land to the Purchaser.')]
    });

    expect(ruleIds(analysis)).toContain('MISS_PROPERTY_ID_001');
  });
});

describe('Risk Engine — output contract', () => {
  it('returns a well-formed result with version, summary and checksRun', () => {
    const result = runRiskEngine(
      makeAnalysis({ importantClauses: [clause('c1', 'The land is mortgaged for Rs. 2,80,000/-.')] })
    );

    expect(result.version).toBe(RISK_ENGINE_VERSION);
    expect(result.checksRun.length).toBeGreaterThan(0);
    expect(result.summary.highAttention + result.summary.review + result.summary.standard).toBe(
      result.findings.length
    );
    for (const finding of result.findings) {
      expect(finding.ruleId).toBeTruthy();
      expect(finding.sourceType).toBe('RULE_ENGINE');
      expect(finding.id).toMatch(/^RF\d{3}$/);
    }
  });

  it('orders HIGH_ATTENTION findings before REVIEW', () => {
    const result = runRiskEngine(
      makeAnalysis({
        importantClauses: [
          clause('c1', 'The land is mortgaged for Rs. 2,80,000/- and the deposit may be forfeited.')
        ]
      })
    );

    const severities = result.findings.map((f) => f.severity);
    const firstReview = severities.indexOf('REVIEW');
    const lastHigh = severities.lastIndexOf('HIGH_ATTENTION');
    if (firstReview !== -1 && lastHigh !== -1) expect(lastHigh).toBeLessThan(firstReview);
  });

  it('never uses prohibited legal-validity wording', () => {
    const result = runRiskEngine(
      makeAnalysis({
        importantClauses: [clause('c1', 'The land is mortgaged and the deposit may be forfeited.')]
      })
    );

    const prose = result.findings
      .map((f) => [f.title, f.reason, f.simpleMeaning, ...(f.recommendedVerification || [])].join(' '))
      .join(' ')
      .toLowerCase();

    for (const banned of ['illegal', 'invalid', 'fraudulent', 'unsafe', 'legally defective']) {
      expect(prose).not.toContain(banned);
    }
  });
});

describe('parsing helpers', () => {
  it('parses Indian currency notation', () => {
    expect(parseIndianAmount('Rs. 18,50,000/-')).toBe(1850000);
    expect(parseIndianAmount('12,20,000')).toBe(1220000);
    expect(parseIndianAmount('3.5 Lakh')).toBe(350000);
    expect(parseIndianAmount('1.2 Crore')).toBe(12000000);
    expect(parseIndianAmount('no amount here')).toBeNull();
  });

  it('extracts Maharashtra parcel identifiers with their type', () => {
    expect(extractSurveyNumbers('Gat No. 142/3A and Survey No. 145')).toEqual(['GAT 142/3A', 'SURVEY 145']);
    // A Gat and a Survey with the same number are different parcels.
    expect(extractSurveyNumbers('Gat No 12')).not.toEqual(extractSurveyNumbers('Survey No 12'));
  });

  it('compares names conservatively', () => {
    expect(compareNames('Ramesh Vithal Patil', 'Mr. Ramesh Vithal Patil')).toBe('SAME');
    expect(compareNames('Ramesh Vithal Patil', 'Ramesh V. Patil')).toBe('ABBREVIATION');
    expect(compareNames('Ramesh Vithal Patil', 'Ramesh Patil')).toBe('ABBREVIATION');
    expect(compareNames('Ramesh Vithal Patil', 'Ganpat Sopan Deshmukh')).toBe('DIFFERENT');
  });

  it('masks sensitive identifiers', () => {
    expect(maskIdentifier('9876 5432 1098')).toBe('XXXX XXXX 1098');
    expect(maskIdentifier('ABCPP1234F')).toBe('A****4F');
  });
});

describe('normalizeFacts — provenance', () => {
  it('reads facts from document text but not from model commentary', () => {
    const facts = normalizeFacts(
      makeAnalysis({
        importantClauses: [
          clause('c1', 'The Purchaser shall pay Rs. 5,00,000 as advance.', {
            simpleMeaning: 'There is a mortgage on this land.',
            whyItMatters: 'A forfeiture clause applies.',
            recommendedAction: 'Get a release deed from the bank.'
          })
        ]
      })
    );

    // None of the mortgage/forfeiture/release wording above is document text.
    expect(facts.mortgagePresent).toBe(false);
    expect(facts.forfeitureDetected).toBe(false);
    expect(facts.nocDetected).toBe(false);
  });

  it('carries page numbers into evidence', () => {
    const facts = normalizeFacts(
      makeAnalysis({
        importantClauses: [clause('c1', 'The land is mortgaged to the bank.', { page: 7 })]
      })
    );

    expect(facts.mortgageEvidence[0].page).toBe(7);
    expect(facts.mortgageEvidence[0].clauseId).toBe('c1');
  });
});

/**
 * Regressions for false positives found by end-to-end testing against realistic
 * conveyancing prose. Each of these fired incorrectly on a perfectly ordinary
 * agreement, which is the failure mode that destroys trust in the feature.
 */
describe('Risk Engine — false-positive regressions', () => {
  const REAL_PROSE_P1 = `AGREEMENT FOR SALE OF AGRICULTURAL LAND

This Agreement is made on 10th March 2026 between Shri Ramesh Vithal Patil, Agriculturist, residing at Village Khed, Taluka Haveli, District Pune (hereinafter the Vendor/Seller) and Shri Suresh Tukaram Jadhav, residing at Kothrud, Pune (hereinafter the Purchaser/Buyer).

1. PROPERTY
The Vendor agrees to sell Gat No. 142/3A admeasuring 2.40 Hectares situated at Village Khed.

2. CONSIDERATION
The total sale consideration is Rs. 18,50,000/- (Rupees Eighteen Lakh Fifty Thousand only).

3. ADVANCE
The Purchaser has paid an advance of Rs. 3,50,000/- as earnest money on execution hereof.`;

  const REAL_PROSE_P2 = `4. EXISTING MORTGAGE
The Vendor admits that Gat No. 142/3A is mortgaged to Haveli Primary Agricultural Cooperative Credit Society towards an outstanding crop loan of Rs. 2,80,000/-.

5. BALANCE PAYMENT
The Purchaser shall pay the balance consideration of Rs. 12,20,000/- on or before 15th September 2026.`;

  const realDoc = () =>
    makeAnalysis({
      originalText: `${REAL_PROSE_P1}

${REAL_PROSE_P2}`,
      paragraphs: [
        { id: 1, original: REAL_PROSE_P1, simple: '', page: 1 },
        { id: 2, original: REAL_PROSE_P2, simple: '', page: 2 }
      ]
    });

  it('does not mistake a Gat number for a currency amount', () => {
    // "Gat No. 142/3A ... crop loan of Rs. 2,80,000" must yield 2,80,000.
    const facts = normalizeFacts(realDoc());
    expect(facts.mortgageAmount?.value).toBe(280000);
  });

  it('extracts amounts despite the full stop in "Rs."', () => {
    const facts = normalizeFacts(realDoc());
    expect(facts.consideration?.value).toBe(1850000);
    expect(facts.advancePaid?.value).toBe(350000);
    expect(facts.balanceAmount?.value).toBe(1220000);
  });

  it('does not report a party conflict from place or institution names', () => {
    // "Village Khed", "Taluka Haveli" and "Haveli Primary Agricultural
    // Cooperative Credit Society" must not be read as party names.
    const ids = ruleIds(realDoc());
    expect(ids).not.toContain('ID_SELLER_CONFLICT_001');
    expect(ids).not.toContain('ID_BUYER_CONFLICT_001');
  });

  it('extracts party names from the definitional parenthetical', () => {
    const facts = normalizeFacts(realDoc());
    expect(facts.sellerNames.map((n) => n.value)).toContain('Ramesh Vithal Patil');
    expect(facts.buyerNames.map((n) => n.value)).toContain('Suresh Tukaram Jadhav');
  });

  it('does not treat the execution date as a payment deadline', () => {
    // "made on 10th March 2026" must not become a second payment deadline and
    // trigger a bogus cross-clause conflict against 15th September 2026.
    const facts = normalizeFacts(realDoc());
    expect(facts.paymentDeadlines.map((d) => d.value)).toEqual(['15th September 2026']);
    expect(ruleIds(realDoc())).not.toContain('XC_DEADLINE_CONFLICT_001');
  });

  it('does not fire reconciliation on a document whose figures add up', () => {
    // Guards against a vacuous pass: the amounts must actually be parsed.
    const facts = normalizeFacts(realDoc());
    expect(facts.consideration?.value).toBe(1850000);
    expect(
      (facts.advancePaid?.value ?? 0) + (facts.mortgageAmount?.value ?? 0) + (facts.balanceAmount?.value ?? 0)
    ).toBe(1850000);
    expect(ruleIds(realDoc())).not.toContain('FIN_RECON_001');
  });
});

describe('Risk Engine — document-type sensitivity', () => {
  it('treats a flat number as a valid property identifier on a lease', () => {
    const analysis = makeAnalysis({
      documentType: 'Rent Agreement',
      importantClauses: [
        clause('c1', 'The Landlord leases Flat No. 402, Sunrise Apartments, Kothrud, Pune to the Tenant.')
      ]
    });

    expect(ruleIds(analysis)).not.toContain('MISS_PROPERTY_ID_001');
  });

  it('reports a missing identifier on a lease as REVIEW, not HIGH_ATTENTION', () => {
    // A lease without a unit number is worth confirming, but it is not
    // title-critical the way it is on a sale.
    const lease = makeAnalysis({
      documentType: 'Rent Agreement',
      importantClauses: [clause('c1', 'The Landlord leases the said premises to the Tenant for 11 months.')]
    });
    const sale = makeAnalysis({
      documentType: 'Sale Agreement',
      importantClauses: [clause('c1', 'The Vendor agrees to sell the said land to the Purchaser.')]
    });

    expect(findingFor(lease, 'MISS_PROPERTY_ID_001')?.severity).toBe('REVIEW');
    expect(findingFor(sale, 'MISS_PROPERTY_ID_001')?.severity).toBe('HIGH_ATTENTION');
  });

  it('does not expect seller/buyer parties on a non-sale document', () => {
    const notice = makeAnalysis({
      documentType: 'Legal Notice',
      importantClauses: [clause('c1', 'You are hereby called upon to vacate the premises within 30 days.')]
    });

    const ids = ruleIds(notice);
    expect(ids).not.toContain('MISS_SELLER_001');
    expect(ids).not.toContain('MISS_BUYER_001');
    expect(ids).not.toContain('MISS_FIELD_001');
  });
});
