import { RelevantService } from './types';

/**
 * Hand-authored, stable government portal links keyed by document category.
 * Deliberately not LLM-generated — avoids hallucinated URLs.
 */
const SERVICE_BUCKETS: Record<string, RelevantService[]> = {
  property: [
    {
      id: 'gs-mahabhulekh',
      title: 'Mahabhulekh (Maharashtra 7/12 & 8A Land Records)',
      whyRelevant: 'Verify the official digital land record for the property mentioned in this document, including any recorded loan/mortgage charges.',
      officialUrl: 'https://bhulekh.mahabhumi.gov.in',
      actionText: 'Check 7/12 Online'
    },
    {
      id: 'gs-igr',
      title: 'IGR Maharashtra Property Stamp Duty & Sub-Registrar',
      whyRelevant: 'Calculate applicable stamp duty, verify a title search report, and book a registration slot for this property transaction.',
      officialUrl: 'https://igrmaharashtra.gov.in',
      actionText: 'View Registration Portal'
    },
    {
      id: 'gs-mutation',
      title: 'Mahabhumi E-Ferfar / Mutation Record Service',
      whyRelevant: 'Understand the online Ferfar mutation process required to transfer revenue ownership records after a property purchase.',
      officialUrl: 'https://mahabhumi.gov.in',
      actionText: 'View Mutation Guidance'
    }
  ],
  rent: [
    {
      id: 'gs-rent-registration',
      title: 'Maharashtra Online Rent Agreement Registration',
      whyRelevant: 'Register this rent/leave-and-license agreement online, which is legally required and helps enforce the terms if disputed.',
      officialUrl: 'https://efilingigr.maharashtra.gov.in',
      actionText: 'Register Rent Agreement'
    },
    {
      id: 'gs-nalsa',
      title: 'NALSA Free Legal Services & Legal Aid Scheme',
      whyRelevant: 'Get free legal advice if you have concerns about deposit, eviction, or maintenance clauses in this agreement.',
      officialUrl: 'https://nalsa.gov.in',
      actionText: 'Get Free Legal Aid'
    }
  ],
  loan: [
    {
      id: 'gs-rbi',
      title: 'RBI Sachet / Banking Ombudsman Portal',
      whyRelevant: 'File a complaint or check lender credentials if you have concerns about interest rates, penalties, or recovery practices in this loan.',
      officialUrl: 'https://sachet.rbi.org.in',
      actionText: 'Check Lender / File Complaint'
    },
    {
      id: 'gs-nalsa-loan',
      title: 'NALSA Free Legal Services & Legal Aid Scheme',
      whyRelevant: 'Get free legal advice on loan recovery, guarantor liability, or repayment dispute clauses.',
      officialUrl: 'https://nalsa.gov.in',
      actionText: 'Get Free Legal Aid'
    }
  ],
  notice: [
    {
      id: 'gs-nalsa-notice',
      title: 'NALSA Free Legal Services & Legal Aid Scheme',
      whyRelevant: 'Get free legal advice and representation to respond to this legal notice within the required timeframe.',
      officialUrl: 'https://nalsa.gov.in',
      actionText: 'Get Free Legal Aid'
    },
    {
      id: 'gs-econsumer',
      title: 'National Consumer Helpline',
      whyRelevant: 'File a complaint if this notice relates to a consumer dispute, defective service, or unfair trade practice.',
      officialUrl: 'https://consumerhelpline.gov.in',
      actionText: 'File Consumer Complaint'
    }
  ],
  generic: [
    {
      id: 'gs-nalsa-generic',
      title: 'NALSA Free Legal Services & Legal Aid Scheme',
      whyRelevant: 'Free legal advice, attorney representation, and legal document review for citizens who qualify.',
      officialUrl: 'https://nalsa.gov.in',
      actionText: 'Get Free Legal Aid'
    },
    {
      id: 'gs-digilocker',
      title: 'DigiLocker',
      whyRelevant: 'Store and verify official copies of identity and property documents referenced in this agreement.',
      officialUrl: 'https://digilocker.gov.in',
      actionText: 'Open DigiLocker'
    }
  ]
};

export function getRelevantServicesForDocType(documentType: string): RelevantService[] {
  const t = (documentType || '').toLowerCase();

  if (t.includes('sale') || t.includes('property') || t.includes('deed') || t.includes('land')) {
    return SERVICE_BUCKETS.property;
  }
  if (t.includes('rent') || t.includes('lease') || t.includes('license')) {
    return SERVICE_BUCKETS.rent;
  }
  if (t.includes('loan') || t.includes('mortgage') || t.includes('credit')) {
    return SERVICE_BUCKETS.loan;
  }
  if (t.includes('notice') || t.includes('legal notice')) {
    return SERVICE_BUCKETS.notice;
  }
  return SERVICE_BUCKETS.generic;
}
