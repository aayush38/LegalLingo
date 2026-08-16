import { DocumentAnalysis } from './types';

export const SAMPLE_AGRICULTURAL_SALE_AGREEMENT: DocumentAnalysis = {
  id: 'sample-complex-agri-land-sale-01',
  documentTitle: 'Agreement for Sale Cum Mortgage & Possession Transfer of Agricultural Land',
  documentType: 'Sale Agreement (Agricultural Land)',
  classificationConfidence: 98,
  understandingScore: 78,
  status: 'Needs Attention',
  createdAt: new Date().toISOString(),
  ocrConfidence: 92,
  isScanned: false,
  originalText: `AGREEMENT FOR SALE CUM MORTGAGE RELEASE AND CONDITIONAL POSSESSION TRANSFER OF AGRICULTURAL LAND

This Agreement for Sale Cum Conditional Possession Transfer is made and executed on this 10th day of August 2026 at Pune, District Pune, Maharashtra State.

BY AND BETWEEN:
1. Mr. Ramesh Vithal Patil, Age 56, Occupation: Agriculturist, PAN: ABCPP1234F, Aadhaar: 9876 5432 1098, Residing at House No. 44, Village Khed, Taluka Haveli, District Pune (hereinafter called the "VENDOR / SELLER", which term includes his legal heirs, executors, administrators and legal assigns).

AND

2. Mr. Suresh Tukaram Jadhav, Age 48, Occupation: Business / Real Estate, PAN: BJJPS5678K, Aadhaar: 1234 5678 9012, Residing at Flat 402, Green Park Society, Kothrud, Pune - 411038 (hereinafter called the "PURCHASER / BUYER", which term includes his legal heirs and assigns).

WHEREAS:
A. The Vendor claims to be the exclusive owner in title and physical possession of agricultural land comprising:
   (i) Gat No. 142/3A, measuring 1 Hectare 20 Ares,
   (ii) Gat No. 142/3B, measuring 0 Hectare 80 Ares, and
   (iii) Gat No. 145 (Sub-division unspecified), measuring 0 Hectare 40 Ares,
   Totaling 2 Hectares 40 Ares, situated at Revenue Village Khed, Taluka Haveli, District Pune.

B. The Vendor admits that Gat No. 142/3A is currently mortgaged to Haveli Primary Agricultural Cooperative Credit Society for an outstanding crop loan of Rs. 2,80,000/- (Rupees Two Lakh Eighty Thousand Only).

NOW THIS AGREEMENT WITNESSETH AND IT IS HEREBY MUTUALLY AGREED BY AND BETWEEN THE PARTIES AS FOLLOWS:

1. TOTAL CONSIDERATION AND SCHEDULE OF PAYMENT:
The agreed total sale consideration for the entire 2.40 Hectares of land is Rs. 18,50,000/- (Rupees Eighteen Lakh Fifty Thousand Only).
   a) The Purchaser has paid Rs. 3,50,000/- (Rupees Three Lakh Fifty Thousand Only) as non-refundable earnest money deposit on this day via Cheque No. 550912 drawn on State Bank of India.
   b) The Purchaser agrees to directly clear the bank mortgage debt of Rs. 2,80,000/- with Haveli Cooperative Credit Society on or before 25th August 2026 to obtain a No-Objection Certificate (NOC).
   c) The remaining balance consideration of Rs. 12,20,000/- (Rupees Twelve Lakh Twenty Thousand Only) shall be paid at the time of final Deed of Conveyance registration on or before 15th September 2026.

2. CANCELLATION, DEFAULT AND PENALTY CLAUSE:
If the Purchaser fails to pay the balance consideration of Rs. 12,20,000/- or clear the bank loan on or before 15th September 2026, the Vendor reserves the unconditional right to terminate this agreement immediately. Upon such cancellation, the earnest deposit of Rs. 3,50,000/- shall be forfeited completely, and the Purchaser shall pay interest penalty at 18% per annum on the delayed amount.

3. WATER RIGHTS AND SHARED ELECTRIC PUMP DISPUTE:
The land includes a 1/3rd joint share in an agricultural well located on adjacent Gat No. 143, powered by a 5 HP electric pump. The Vendor does not guarantee independent electricity connection or unhindered water drawing rights, and any dispute with neighboring landholder Mr. Sopan Patil regarding well usage shall be resolved at the Purchaser's own cost.

4. POWER OF ATTORNEY AND POSSESSION:
The Vendor grants conditional permissive possession for farming purposes only upon receipt of 75% of total payment. The Vendor executes a separate General Power of Attorney (GPA) in favor of Purchaser, which remains revocable until full payment is received.

5. INDEMNITY AND COVENANT AGAINST TITLE CLAIMS:
The Vendor covenants to indemnify and hold harmless the Purchaser against any third-party ownership claims made by his brother, Mr. Ganpat Vithal Patil, or any ancestral heirs.

6. JURISDICTION AND STAMP DUTY CHARGES:
The Purchaser agrees to bear all expenses relating to stamp duty (calculated at 7%), registration fees, advocate title verification fees, and mutation revenue entry charges. All disputes shall be referred to sole arbitration in Pune under Indian Arbitration Act.

IN WITNESS WHEREOF the parties have set their hands in the presence of:
Witness 1: Mr. Prakash Maruti Shinde, Aadhaar: 5566 7788 9900, Residing at Village Khed, Pune.
Witness 2: [Details Blank / Name & Address Incomplete].`,
  paragraphs: [
    {
      id: 1,
      original: 'AGREEMENT FOR SALE CUM MORTGAGE RELEASE AND CONDITIONAL POSSESSION TRANSFER OF AGRICULTURAL LAND. Executed on 10th August 2026 at Pune between Mr. Ramesh Vithal Patil (Vendor, Seller) and Mr. Suresh Tukaram Jadhav (Purchaser, Buyer).',
      simple: 'This is a complex agreement for selling 2.40 hectares of agricultural land in Pune between seller Ramesh Patil and buyer Suresh Jadhav.'
    },
    {
      id: 2,
      original: 'WHEREAS: The Vendor claims ownership of Gat No. 142/3A (1.20 Hec), Gat No. 142/3B (0.80 Hec), and Gat No. 145 (0.40 Hec). Vendor admits Gat No. 142/3A is mortgaged for an outstanding loan of Rs. 2,80,000 to Cooperative Credit Society.',
      simple: 'The land consists of 3 plots (Gat Nos. 142/3A, 142/3B, 145). Crucially, plot 142/3A has an active unpaid bank loan mortgage of ₹2,80,000 with a cooperative society!'
    },
    {
      id: 3,
      original: '1. TOTAL CONSIDERATION: Agreed price is Rs. 18,50,000. Earnest money paid today: Rs. 3,50,000. Purchaser must clear bank loan of Rs. 2,80,000 by 25th Aug 2026. Balance Rs. 12,20,000 due by 15th Sept 2026.',
      simple: 'Total price is ₹18.5 Lakh. Buyer gave ₹3.5 Lakh advance today. Buyer must pay ₹2.8 Lakh directly to clear the bank loan by Aug 25, and pay remaining ₹12.2 Lakh by Sept 15.'
    },
    {
      id: 4,
      original: '2. CANCELLATION AND PENALTY: If Purchaser fails to pay balance by 15th Sept 2026, Vendor will cancel agreement, forfeit Rs. 3,50,000 deposit, and charge 18% per annum penalty interest.',
      simple: 'If Suresh (buyer) misses the Sept 15 deadline, Ramesh will cancel the deal, seize the entire ₹3.5 Lakh advance money, and charge an extra 18% interest penalty!'
    },
    {
      id: 5,
      original: '3. WATER RIGHTS & SHARED WELL DISPUTE: Land includes 1/3rd share in well on adjacent Gat No. 143. Vendor does not guarantee unhindered water drawing rights; disputes with neighbor Sopan Patil must be handled by buyer.',
      simple: 'Water well is shared with neighbor Sopan Patil. There is a dispute regarding water drawing rights, and the seller will not help if neighbor blocks water access!'
    },
    {
      id: 6,
      original: '4. POWER OF ATTORNEY & POSSESSION: Conditional possession given after 75% payment. General Power of Attorney remains revocable until full payment.',
      simple: 'Buyer cannot take full possession until paying 75% of money. The power of attorney can be canceled by seller anytime before full payment.'
    },
    {
      id: 7,
      original: '5. INDEMNITY & COVENANT: Vendor promises to indemnify buyer against any title claim made by his brother Mr. Ganpat Vithal Patil or ancestral legal heirs.',
      simple: 'Ramesh promises to compensate the buyer if his brother Ganpat Patil or family relatives file a legal claim claiming ownership of this land.'
    },
    {
      id: 8,
      original: '6. STAMP DUTY & ARBITRATION: Purchaser pays 7% stamp duty, registration fees, and legal fees. All legal disputes referred to sole arbitration in Pune.',
      simple: 'Buyer must pay all government stamp duty (7%) and lawyer fees. Any dispute must go to a private arbitrator in Pune court.'
    }
  ],
  summary: 'This is a complex agreement for the sale of 2.40 Hectares of agricultural land across 3 Gat numbers between Ramesh Patil and Suresh Jadhav for ₹18,50,000. It involves an active bank mortgage of ₹2,80,000, shared water well dispute, strict forfeiture penalty, and brother title claims.',
  verySimpleSummary: 'Ramesh is selling farm land (2.4 Hectares) to Suresh for ₹18.5 Lakh. The buyer gave ₹3.5 Lakh advance, must clear an existing ₹2.8 Lakh bank loan on the land, and pay remaining ₹12.2 Lakh by Sept 15 or lose all advance money.',
  extraSimpleSummary: 'Ramesh selling farm to Suresh for 18.5 Lakh. Buyer gave 3.5 Lakh deposit. Must clear bank loan by Aug 25 and pay 12.2 Lakh by Sept 15 or lose all deposit money + pay 18% penalty!',
  fiveQuestions: {
    documentType: 'Sale Agreement Cum Mortgage & Possession Transfer',
    partiesInvolved: {
      seller: 'Ramesh Vithal Patil (Seller)',
      buyer: 'Suresh Tukaram Jadhav (Buyer)'
    },
    totalAmount: '₹18,50,000 (Advance: ₹3,50,000 | Bank Loan Debt: ₹2,80,000 | Balance: ₹12,20,000)',
    missingPoints: 'Gat No. 145 sub-boundary map missing, Witness 2 details blank, N.A. status unspecified.',
    nextStepsSummary: 'Verify bank loan NOC with Haveli Cooperative Society and check brother Ganpat Patil claim on 7/12 record before paying balance.'
  },
  parties: [
    { role: 'Seller (Vendor)', name: 'Ramesh Vithal Patil', details: 'Agriculturist, Residing at Village Khed, Pune (Aadhaar: 9876 5432 1098, PAN: ABCPP1234F)' },
    { role: 'Buyer (Purchaser)', name: 'Suresh Tukaram Jadhav', details: 'Business / Real Estate, Residing at Kothrud, Pune (Aadhaar: 1234 5678 9012, PAN: BJJPS5678K)' }
  ],
  keyInformation: [
    { label: 'Document Type', value: 'Sale Agreement Cum Mortgage Release', iconName: 'FileText' },
    { label: 'Total Transaction Amount', value: '₹18,50,000', iconName: 'IndianRupee' },
    { label: 'Earnest Money Deposit Paid', value: '₹3,50,000', iconName: 'CheckCircle2' },
    { label: 'Bank Mortgage Loan Debt', value: '₹2,80,000 (Haveli Co-op Credit Society)', iconName: 'AlertTriangle' },
    { label: 'Balance Payment Deadline', value: '15th September 2026', iconName: 'Calendar' },
    { label: 'Land Area & Gat Nos.', value: '2.40 Hectares (Gat 142/3A, 142/3B, 145)', iconName: 'MapPin' },
    { label: 'Location', value: 'Village Khed, Taluka Haveli, District Pune', iconName: 'Building' }
  ],
  importantClauses: [
    {
      id: 'c1',
      clauseTitle: 'Strict Cancellation & Forfeiture Penalty',
      originalText: 'If the Purchaser fails to pay the balance consideration of Rs. 12,20,000/- or clear the bank loan on or before 15th September 2026, the Vendor reserves the right to cancel this agreement, forfeit Rs. 3,50,000/- earnest deposit, and charge interest penalty at 18% per annum.',
      simpleMeaning: 'If the buyer misses the payment deadline by even one day, the seller can cancel the agreement, keep all ₹3.5 Lakh advance money, and demand 18% penalty interest!',
      whyItMatters: 'Extreme financial risk for the buyer if bank housing or agri loan approval is delayed.',
      recommendedAction: 'Insist on adding a mandatory 30-day written notice and grace period before forfeiture.',
      riskLevel: 'high'
    },
    {
      id: 'c2',
      clauseTitle: 'Active Bank Mortgage & Loan Clearance Obligation',
      originalText: 'The Vendor admits Gat No. 142/3A is mortgaged to Haveli Primary Agricultural Cooperative Credit Society for an outstanding crop loan of Rs. 2,80,000/-. Purchaser agrees to clear loan directly on or before 25th August 2026.',
      simpleMeaning: 'The property has an existing unpaid bank loan. The buyer is being forced to pay off the seller\'s bank loan directly to clear the mortgage.',
      whyItMatters: 'If you pay the bank directly without a formal bank NOC tripartite letter, you might risk losing that ₹2.8 Lakh if the deal fails.',
      recommendedAction: 'Obtain an official Bank Loan Outstanding Statement & Tripartite NOC from Haveli Cooperative Society before paying.',
      riskLevel: 'high'
    },
    {
      id: 'c3',
      clauseTitle: 'Shared Well & Water Rights Dispute Clause',
      originalText: 'Land includes 1/3rd joint share in well on Gat No. 143. Vendor does not guarantee unhindered water drawing rights, and any dispute with neighbor Mr. Sopan Patil shall be resolved at Purchaser\'s own cost.',
      simpleMeaning: 'The farm well is shared with a neighboring farmer (Sopan Patil). There is an active water dispute, and the seller will NOT help if neighbor blocks irrigation water!',
      whyItMatters: 'Without guaranteed water rights, agricultural land value and crop yield will suffer significantly.',
      recommendedAction: 'Verify water sharing agreement on Gram Panchayat / Talathi revenue records before signing.',
      riskLevel: 'review'
    },
    {
      id: 'c4',
      clauseTitle: 'Revocable Power of Attorney & Permissive Possession',
      originalText: 'Vendor grants conditional permissive possession upon 75% payment. General Power of Attorney remains revocable until full payment.',
      simpleMeaning: 'Buyer gets temporary farming rights only after paying 75% money. The seller can revoke power of attorney anytime prior to full payment.',
      whyItMatters: 'Protects seller until full payment, but buyer cannot construct structures or mortgage the land until final deed.',
      recommendedAction: 'Ensure Possession Receipt is signed simultaneously with final 7/12 mutation entry.',
      riskLevel: 'standard'
    }
  ],
  missingInformation: [
    {
      id: 'm1',
      title: 'Gat No. 145 Sub-Division Boundary Map Missing',
      whyItMatters: 'Gat No. 145 (0.40 Hec) sub-division is unspecified, making exact plot boundary line unclear.',
      whatYouCanDo: 'Obtain official Mojani (Measurement Map) from Taluka Land Records Office (Cadastral Surveyor).',
      severity: 'high'
    },
    {
      id: 'm2',
      title: 'Brother Ganpat Patil No-Objection Certificate (NOC) Missing',
      whyItMatters: 'Ancestral land often faces legal lawsuits by brothers or sisters claiming inheritance rights.',
      whatYouCanDo: 'Require seller Ramesh Patil to obtain signed NOC / Quit Claim Deed from brother Ganpat Patil.',
      severity: 'high'
    },
    {
      id: 'm3',
      title: 'Witness 2 Identity Details Left Blank',
      whyItMatters: 'Incomplete witness details weaken agreement validity in court disputes.',
      whatYouCanDo: 'Ensure full name, Aadhaar card number, address, and signature of 2nd independent witness.',
      severity: 'medium'
    }
  ],
  legalTerms: [
    {
      term: 'Encumbrance',
      simpleMeaning: 'A bank mortgage, loan debt, legal dispute, or third-party claim attached to a land property.',
      simpleExample: 'The ₹2,80,000 crop loan from Haveli Cooperative Society is an encumbrance on Gat 142/3A.'
    },
    {
      term: 'Indemnity',
      simpleMeaning: 'A legal guarantee to repay or refund money if a legal dispute or financial loss occurs.',
      simpleExample: 'Ramesh promises to repay Suresh if his brother Ganpat files a court case claiming ownership.'
    },
    {
      term: 'Revocable Power of Attorney',
      simpleMeaning: 'A legal authority letter given to act on someone\'s behalf that can be canceled at any time.',
      simpleExample: 'The seller can cancel the Power of Attorney anytime before final registration.'
    },
    {
      term: 'Vendor',
      simpleMeaning: 'The legal seller of the land.',
      simpleExample: 'Ramesh Vithal Patil is the Vendor.'
    },
    {
      term: 'Purchaser',
      simpleMeaning: 'The legal buyer of the land.',
      simpleExample: 'Suresh Tukaram Jadhav is the Purchaser.'
    }
  ],
  recommendedActions: [
    { id: 'a1', text: "Obtain official Bank Loan Outstanding Certificate from Haveli Cooperative Credit Society", completed: false },
    { id: 'a2', text: "Check 7/12 Land Record extract for Ramesh Patil's brother Ganpat Patil name entry", completed: false },
    { id: 'a3', text: 'Obtain Cadastral Measurement Map (Mojani) for Gat No. 145 sub-division', completed: false },
    { id: 'a4', text: 'Negotiate 30-day written notice grace period before 18% forfeiture penalty applies', completed: false },
    { id: 'a5', text: 'Verify well water sharing agreement with neighbor Sopan Patil at Village Panchayat', completed: false },
    { id: 'a6', text: 'Ensure full Aadhaar and signature of 2nd independent witness before registration', completed: false }
  ],
  relevantServices: [
    {
      id: 's1',
      title: 'Mahabhulekh (Maharashtra 7/12 & 8A Land Records)',
      whyRelevant: 'Verify official digital 7/12 extract for Gat 142/3A, 142/3B, 145 and check bank crop loan entries.',
      officialUrl: 'https://bhulekh.mahabhumi.gov.in',
      actionText: 'Check 7/12 Online'
    },
    {
      id: 's2',
      title: 'IGR Maharashtra Property Stamp Duty & Sub-Registrar',
      whyRelevant: 'Calculate 7% stamp duty fees, verify title search report, and book registration slot.',
      officialUrl: 'https://igrmaharashtra.gov.in',
      actionText: 'View Registration Portal'
    },
    {
      id: 's3',
      title: 'Mahabhumi E-Ferfar / Mutation Record Service',
      whyRelevant: 'Understand online Ferfar mutation process for transferring revenue ownership after purchase.',
      officialUrl: 'https://mahabhumi.gov.in',
      actionText: 'View Mutation Guidance'
    }
  ],
  completenessBreakdown: {
    identityInfo: 92,
    propertyInfo: 68,
    financialInfo: 85,
    importantClauses: 74,
    witnessInfo: 55,
    registrationInfo: 62
  }
};

export const SAMPLE_DOCUMENTS = [
  SAMPLE_AGRICULTURAL_SALE_AGREEMENT
];
