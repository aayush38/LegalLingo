import { DocumentAnalysis } from './types';

export const SAMPLE_AGRICULTURAL_SALE_AGREEMENT: DocumentAnalysis = {
  id: 'sample-agri-land-sale-01',
  documentTitle: 'Sample Agricultural Land Sale Agreement',
  documentType: 'Sale Agreement',
  classificationConfidence: 96,
  understandingScore: 84,
  status: 'Needs Attention',
  createdAt: new Date().toISOString(),
  ocrConfidence: 94,
  isScanned: false,
  originalText: `AGREEMENT FOR SALE OF AGRICULTURAL LAND

This Agreement for Sale is executed on this 10th day of August 2026 at Pune, Maharashtra.

BY AND BETWEEN:
Mr. Ramesh Vithal Patil, Age 52, Occupation: Agriculturist, Residing at Village Khed, Taluka Haveli, District Pune, Maharashtra (hereinafter referred to as the "VENDOR", which expression shall include his legal heirs, successors and assigns).

AND

Mr. Suresh Tukaram Jadhav, Age 44, Occupation: Business, Residing at Flat 402, Green Park Society, Kothrud, Pune, Maharashtra (hereinafter referred to as the "PURCHASER", which expression shall include his legal heirs and assigns).

WHEREAS the Vendor is the sole and absolute owner of agricultural land bearing Gat No. 142/3, measuring 1 Hectare 20 Ares, situated at Village Khed, Taluka Haveli, District Pune.

1. CONSIDERATION AND PAYMENT TERMS:
The Vendor agrees to sell and the Purchaser agrees to purchase the said agricultural land for a total consideration of Rs. 8,50,000/- (Rupees Eight Lakh Fifty Thousand Only). The Purchaser has paid Rs. 1,50,000/- as earnest money deposit on this day via Cheque No. 440219. The balance amount of Rs. 7,00,000/- shall be paid at the time of final Deed of Conveyance registration on or before 30th August 2026.

2. COVENANT AGAINST ENCUMBRANCES:
The Vendor hereby covenants that the said property is free from all encumbrances, bank loans, mortgages, charges, litigation, and legal claims whatsoever. The Vendor agrees to indemnify the Purchaser against any loss incurred due to defective title.

3. POSSESSION AND CANCELLATION CLAUSE:
Physical possession of the land shall be delivered to the Purchaser upon full payment on 30th August 2026. If the Purchaser fails to pay the balance consideration within the stipulated time limit of 30th August 2026, the Vendor shall have the right to cancel this agreement and forfeit 50% of the advance earnest money deposit paid.

4. JURISDICTION & STAMP DUTY:
All expenses regarding stamp duty, registration charges, and advocate fees shall be borne exclusively by the Purchaser. Any legal dispute arising out of this agreement shall be subject to the jurisdiction of Civil Courts at Pune.

IN WITNESS WHEREOF the parties have set their signatures in the presence of witness 1: Prakash Shinde and witness 2: [Details Incomplete].`,
  paragraphs: [
    {
      id: 1,
      original: 'AGREEMENT FOR SALE OF AGRICULTURAL LAND. Executed on 10th August 2026 at Pune between Mr. Ramesh Vithal Patil (Vendor) and Mr. Suresh Tukaram Jadhav (Purchaser).',
      simple: 'This is an agreement for selling agricultural land in Pune between Ramesh Patil (seller) and Suresh Jadhav (buyer) dated 10th August 2026.'
    },
    {
      id: 2,
      original: 'WHEREAS the Vendor is the sole and absolute owner of agricultural land bearing Gat No. 142/3, measuring 1 Hectare 20 Ares, situated at Village Khed, Taluka Haveli, District Pune.',
      simple: 'Ramesh claims he is the single owner of 1.20 hectares of farm land located at Gat No. 142/3 in Khed village, Pune.'
    },
    {
      id: 3,
      original: '1. CONSIDERATION AND PAYMENT TERMS: Total consideration of Rs. 8,50,000/-. Advance paid Rs. 1,50,000/-. Balance Rs. 7,00,000/- due by 30th August 2026.',
      simple: 'The total agreed price is ₹8,50,000. Suresh paid ₹1,50,000 advance today. He must pay the remaining ₹7,00,000 by 30th August 2026.'
    },
    {
      id: 4,
      original: '2. COVENANT AGAINST ENCUMBRANCES: The Vendor hereby covenants that the said property is free from all encumbrances and claims whatsoever.',
      simple: 'The seller guarantees that nobody else has a bank loan, mortgage, legal dispute, or claim on this land.'
    },
    {
      id: 5,
      original: '3. POSSESSION AND CANCELLATION CLAUSE: If the purchaser fails to pay balance by 30th August 2026, Vendor may cancel and forfeit 50% earnest money.',
      simple: 'If Suresh (buyer) misses the 30th August deadline to pay ₹7 lakh, Ramesh can cancel the deal and keep half (₹75,000) of the advance money!'
    },
    {
      id: 6,
      original: '4. JURISDICTION & STAMP DUTY: Purchaser pays stamp duty and registration fees. Disputes subject to Pune courts.',
      simple: 'The buyer must pay for government stamp duty and land registration costs. Any court dispute will happen in Pune.'
    }
  ],
  summary: 'This is an agreement for the sale of agricultural land between Ramesh Patil and Suresh Jadhav for ₹8,50,000. The document describes the payment terms, possession date and responsibilities of both parties.',
  verySimpleSummary: 'Ramesh is selling land to Suresh for ₹8.5 lakh. The document explains when the money should be paid, when the land will be handed over and what each person has agreed to do.',
  extraSimpleSummary: 'Ramesh sell farm land to Suresh for 8.5 Lakh rupees. Suresh gave 1.5 Lakh deposit. Must pay balance by Aug 30 or lose half deposit.',
  fiveQuestions: {
    documentType: 'Sale Agreement (Agricultural Land)',
    partiesInvolved: {
      seller: 'Ramesh Vithal Patil',
      buyer: 'Suresh Tukaram Jadhav'
    },
    totalAmount: '₹8,50,000 (Advance paid: ₹1,50,000 | Balance due: ₹7,00,000)',
    missingPoints: 'Gat/Survey sub-number details unclear & Witness 2 identity details incomplete.',
    nextStepsSummary: 'Verify 7/12 land extract record and check if Ramesh is officially sole owner before paying balance.'
  },
  parties: [
    { role: 'Seller (Vendor)', name: 'Ramesh Vithal Patil', details: 'Agriculturist, Residing at Village Khed, Pune' },
    { role: 'Buyer (Purchaser)', name: 'Suresh Tukaram Jadhav', details: 'Business, Residing at Kothrud, Pune' }
  ],
  keyInformation: [
    { label: 'Document Type', value: 'Sale Agreement', iconName: 'FileText' },
    { label: 'Total Amount', value: '₹8,50,000', iconName: 'IndianRupee' },
    { label: 'Advance Paid', value: '₹1,50,000', iconName: 'CheckCircle2' },
    { label: 'Balance Due Date', value: '30th August 2026', iconName: 'Calendar' },
    { label: 'Land Area', value: '1 Hectare 20 Ares (Gat No. 142/3)', iconName: 'MapPin' },
    { label: 'Location', value: 'Village Khed, Taluka Haveli, Pune', iconName: 'Building' }
  ],
  importantClauses: [
    {
      id: 'c1',
      clauseTitle: 'Cancellation & Forfeiture Clause',
      originalText: 'If the Purchaser fails to pay the balance consideration within the stipulated time limit of 30th August 2026, the Vendor shall have the right to cancel this agreement and forfeit 50% of the advance earnest money deposit paid.',
      simpleMeaning: 'If the buyer misses a payment deadline, they may lose half of all advance money paid (₹75,000 penalty).',
      whyItMatters: 'This creates a large financial risk if your loan approval is delayed by banks.',
      recommendedAction: 'Ask for a 30-day grace period extension clause if bank loan processing takes longer.',
      riskLevel: 'high'
    },
    {
      id: 'c2',
      clauseTitle: 'Encumbrance & Guarantee Clause',
      originalText: 'The Vendor hereby covenants that the said property is free from all encumbrances, bank loans, mortgages, charges, litigation, and legal claims whatsoever.',
      simpleMeaning: 'The seller is saying that nobody else has a loan, legal claim or right over this property.',
      whyItMatters: 'You should still independently verify official revenue 7/12 records before handing over land payment.',
      recommendedAction: 'Obtain a formal Search Report for 30 years from a local advocate.',
      riskLevel: 'review'
    },
    {
      id: 'c3',
      clauseTitle: 'Stamp Duty & Registration Expense',
      originalText: 'All expenses regarding stamp duty, registration charges, and advocate fees shall be borne exclusively by the Purchaser.',
      simpleMeaning: 'The buyer is responsible for all government stamp duty tax and lawyer fees.',
      whyItMatters: 'This will add approximately 6% to 7% extra cost over the ₹8,50,000 purchase price.',
      recommendedAction: 'Calculate extra budget for government registration fees before final payment.',
      riskLevel: 'standard'
    }
  ],
  missingInformation: [
    {
      id: 'm1',
      title: 'Survey / Gat Sub-Number Not Clearly Found',
      whyItMatters: 'The exact survey/Gat sub-division determines exact plot boundaries.',
      whatYouCanDo: 'Compare the agreement with official Mahabhulekh 7/12 online land record.',
      severity: 'high'
    },
    {
      id: 'm2',
      title: 'Witness Information Incomplete',
      whyItMatters: 'Witness 2 details are left blank in the draft, making legal witness verification weak.',
      whatYouCanDo: 'Ensure full name, Aadhaar, address and sign of two independent witnesses at final execution.',
      severity: 'medium'
    }
  ],
  legalTerms: [
    {
      term: 'Encumbrance',
      simpleMeaning: 'A loan, claim, mortgage or legal right that someone else or a bank has over the property.',
      simpleExample: 'If land was mortgaged to SBI bank for a farm loan, that loan is an encumbrance.'
    },
    {
      term: 'Covenant',
      simpleMeaning: 'A formal legal promise or guarantee made by one party to another in an agreement.',
      simpleExample: 'The seller covenants (promises) that he is the rightful owner.'
    },
    {
      term: 'Vendor',
      simpleMeaning: 'The seller of the property or land.',
      simpleExample: 'Ramesh Patil is the Vendor.'
    },
    {
      term: 'Vendee / Purchaser',
      simpleMeaning: 'The buyer of the property.',
      simpleExample: 'Suresh Jadhav is the Purchaser.'
    },
    {
      term: 'Indemnify',
      simpleMeaning: 'A promise to compensate or repay someone if they suffer a financial loss due to your fault.',
      simpleExample: 'If a old legal dispute arises, seller promises to pay back any loss caused to buyer.'
    }
  ],
  recommendedActions: [
    { id: 'a1', text: "Verify Seller Ramesh Patil's name on 7/12 Land Record", completed: false },
    { id: 'a2', text: 'Check 7/12 extract for existing bank crop loan entries', completed: false },
    { id: 'a3', text: 'Verify Gat Number 142/3 boundaries with Village Talathi', completed: false },
    { id: 'a4', text: 'Confirm payment receipt of ₹1,50,000 cheque clearance', completed: false },
    { id: 'a5', text: 'Add 30-day grace period to Cancellation clause before signing', completed: false },
    { id: 'a6', text: 'Obtain full Aadhaar and address of 2nd witness', completed: false }
  ],
  relevantServices: [
    {
      id: 's1',
      title: 'Mahabhulekh (Maharashtra Land Records)',
      whyRelevant: 'Check official digital 7/12 & 8A land records to verify Ramesh Patil ownership.',
      officialUrl: 'https://bhulekh.mahabhumi.gov.in',
      actionText: 'Check 7/12 Online'
    },
    {
      id: 's2',
      title: 'IGR Maharashtra Property Registration',
      whyRelevant: 'Calculate stamp duty fees and book registration slot at Sub-Registrar Office.',
      officialUrl: 'https://igrmaharashtra.gov.in',
      actionText: 'View Registration Guidance'
    },
    {
      id: 's3',
      title: 'Mutation / Ferfar Entry Service',
      whyRelevant: 'Understand how to update your name in revenue records after land buying.',
      officialUrl: 'https://mahabhumi.gov.in',
      actionText: 'View Mutation Process'
    }
  ],
  completenessBreakdown: {
    identityInfo: 95,
    propertyInfo: 72,
    financialInfo: 92,
    importantClauses: 80,
    witnessInfo: 65,
    registrationInfo: 68
  }
};

export const SAMPLE_DOCUMENTS = [
  SAMPLE_AGRICULTURAL_SALE_AGREEMENT
];
