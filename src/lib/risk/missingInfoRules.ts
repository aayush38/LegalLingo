/**
 * Deterministic "expected analysis fields" checklist.
 *
 * Wording matters here. These are the fields LegalLingo expects to be able to
 * locate in a sale-type agreement — they are NOT a statement of what the law
 * requires. A field being absent from our analysis can equally mean the
 * document omitted it or that extraction missed it, and the copy says so.
 */

import type { NormalizedFacts, RiskFinding } from './types';
import { makeFinding, resolveConfidence, toEvidence, isSaleLike } from './ruleHelpers';

export const MISSING_INFO_RULE_IDS = ['MISS_WITNESS_001', 'MISS_FIELD_001'] as const;

interface ExpectedField {
  key: string;
  label: string;
  present: (facts: NormalizedFacts) => boolean;
  whatToDo: string;
}

const EXPECTED_FIELDS: ExpectedField[] = [
  {
    key: 'sellerIdentity',
    label: 'Seller identity',
    present: (f) => f.sellerNames.length > 0,
    whatToDo: 'Confirm the seller full name against the title record.'
  },
  {
    key: 'buyerIdentity',
    label: 'Buyer identity',
    present: (f) => f.buyerNames.length > 0,
    whatToDo: 'Confirm the buyer full name as it will appear at registration.'
  },
  {
    key: 'propertyIdentifier',
    label: 'Property identifier',
    present: (f) => f.surveyNumbers.length > 0,
    whatToDo: 'Confirm the survey/Gat/CTS number against the land record.'
  },
  {
    key: 'consideration',
    label: 'Total consideration',
    present: (f) => f.consideration !== undefined,
    whatToDo: 'Confirm the total price, in both words and figures.'
  },
  {
    key: 'paymentTerms',
    label: 'Payment terms',
    present: (f) =>
      f.paymentDeadlines.length > 0 || f.advancePaid !== undefined || f.balanceAmount !== undefined,
    whatToDo: 'Confirm how much is payable, when, and by what method.'
  },
  {
    key: 'encumbranceStatus',
    label: 'Encumbrance status',
    present: (f) => f.mortgagePresent || f.nocDetected,
    whatToDo: 'Obtain an encumbrance certificate to confirm whether any charge exists.'
  },
  {
    key: 'possessionTerms',
    label: 'Possession terms',
    present: (f) => f.possessionDates.length > 0,
    whatToDo: 'Confirm when physical possession transfers, and on what condition.'
  },
  {
    key: 'witnessInformation',
    label: 'Witness information',
    present: (f) => f.witnessNames.length > 0 || f.witnessMentioned,
    whatToDo: 'Confirm witness names and signatures are complete on the executed copy.'
  }
];

export function missingInfoRules(facts: NormalizedFacts): RiskFinding[] {
  const findings: RiskFinding[] = [];

  // RULE 5 — witness information specifically (called out separately because
  // it is the single most commonly incomplete field in practice).
  if (facts.witnessNames.length === 0) {
    findings.push(
      makeFinding({
        ruleId: 'MISS_WITNESS_001',
        category: 'Expected Analysis Fields',
        title: 'Witness information not located',
        severity: 'REVIEW',
        reason: 'Witness information could not be identified in the analysed document.',
        simpleMeaning:
          'We could not find witness names in this document. They may be missing, or they may only appear on the signed physical copy.',
        recommendedVerification: [
          'Check the executed copy for complete witness names and signatures.',
          'Confirm what witness details are expected for this document type in your state.'
        ],
        evidence: toEvidence(facts.witnessNames),
        relatedFields: ['witnessNames', 'witnessMentioned'],
        // If the document never mentions witnesses at all, that is a stronger
        // signal than merely failing to parse a name out of a witness block.
        confidence: resolveConfidence(facts, facts.witnessMentioned ? 'LOW' : 'MEDIUM')
      })
    );
  }

  // Remaining checklist fields, reported as one grouped finding so the UI does
  // not fill with six near-identical cards.
  if (!isSaleLike(facts)) return findings;

  const absent = EXPECTED_FIELDS.filter(
    (field) => field.key !== 'witnessInformation' && !field.present(facts)
  );

  if (absent.length > 0) {
    findings.push(
      makeFinding({
        ruleId: 'MISS_FIELD_001',
        category: 'Expected Analysis Fields',
        title: `Expected analysis field not located (${absent.length})`,
        severity: absent.length >= 3 ? 'HIGH_ATTENTION' : 'REVIEW',
        reason: `The following expected analysis fields could not be located: ${absent
          .map((f) => f.label)
          .join(', ')}. This may mean the information is absent from the document, or that it was not captured during extraction.`,
        simpleMeaning:
          'Some details we normally expect to find in this kind of agreement were not found. They might be missing from the document, or written in a way we could not read.',
        recommendedVerification: absent.map((f) => f.whatToDo),
        relatedFields: absent.map((f) => f.key),
        confidence: resolveConfidence(facts, 'MEDIUM')
      })
    );
  }

  return findings;
}
