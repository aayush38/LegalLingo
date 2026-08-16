import { GovernmentScheme } from './types';

export const SCHEMES_DATABASE: GovernmentScheme[] = [
  {
    id: 'scheme-pm-kisan',
    name: 'PM-Kisan Samman Nidhi',
    category: 'Agriculture & Farmers',
    description: 'Financial support of ₹6,000 per year paid in 3 equal installments directly to small and marginal farmers bank accounts.',
    whyMatches: 'Matches small/marginal landholders engaged in agricultural land ownership.',
    eligibility: {
      states: ['All States & UTs'],
      occupations: ['Farmer', 'Agriculturist'],
      landholdingLimit: 'Up to 2 Hectares',
      details: [
        'Must own cultivable land registered in revenue records',
        'Valid Aadhaar card linked with bank account',
        'Not paying Income Tax in previous assessment year'
      ]
    },
    requiredDocuments: [
      'Land Ownership 7/12 or RoR Extract',
      'Aadhaar Card',
      'Bank Account Passbook (e-KYC verified)',
      'Mobile number linked to Aadhaar'
    ],
    officialUrl: 'https://pmkisan.gov.in',
    matchScore: 95
  },
  {
    id: 'scheme-swamitva',
    name: 'SVAMITVA Scheme (Survey of Villages and Mapping with Improvised Technology)',
    category: 'Property Ownership & Rural Land',
    description: 'Provides Property Cards (Abadi Land Rights) to village household owners using drone surveys for credit and legal clarity.',
    whyMatches: 'Helps rural property owners establish official ownership title and secure bank loans.',
    eligibility: {
      states: ['All States & UTs'],
      occupations: ['Farmer', 'Rural Citizen', 'Senior Citizen'],
      details: [
        'Residing in inhabited (Abadi) areas of rural villages',
        'Physical ownership of rural property'
      ]
    },
    requiredDocuments: [
      'Aadhaar Card',
      'Gram Panchayat Property Tax Receipt or Possession proof',
      'Mobile Number'
    ],
    officialUrl: 'https://svamitva.nic.in',
    matchScore: 90
  },
  {
    id: 'scheme-nalsa-legal-aid',
    name: 'NALSA Free Legal Services & Legal Aid Scheme',
    category: 'Legal Aid & Citizen Rights',
    description: 'Free legal advice, attorney representation, and legal document preparation for women, SC/ST, low-income citizens, and farmers.',
    whyMatches: 'Provides free advocate guidance for verifying property contracts and land legal disputes.',
    eligibility: {
      states: ['All States & UTs'],
      occupations: ['Farmer', 'Rural Citizen', 'Senior Citizen', 'Student', 'Worker'],
      incomeLimit: 'Annual income below ₹3,00,000 (varies by State)',
      details: [
        'Women and children',
        'Members of SC/ST communities',
        'Landless farmers or low-income families',
        'Persons facing legal litigation'
      ]
    },
    requiredDocuments: [
      'Income Certificate or BPL Card',
      'Aadhaar Card / Photo ID',
      'Document copy under dispute'
    ],
    officialUrl: 'https://nalsa.gov.in',
    matchScore: 92
  },
  {
    id: 'scheme-pmay-g',
    name: 'Pradhan Mantri Awas Yojana (Gramin)',
    category: 'Rural Housing',
    description: 'Financial assistance of up to ₹1.20 Lakh to ₹1.30 Lakh for construction of pucca houses for rural homeless and pakka house seekers.',
    whyMatches: 'Provides housing construction assistance on newly acquired rural land.',
    eligibility: {
      states: ['All States & UTs'],
      occupations: ['Farmer', 'Worker', 'Rural Citizen'],
      incomeLimit: 'Low income / SECC 2011 census verified',
      details: [
        'Kutcha or dilapidated house owners',
        'No ownership of pucca house anywhere in India'
      ]
    },
    requiredDocuments: [
      'Aadhaar Card',
      'Bank Account details',
      'Job card / BPL certificate',
      'Land allotment certificate'
    ],
    officialUrl: 'https://pmayg.nic.in',
    matchScore: 88
  },
  {
    id: 'scheme-mudra',
    name: 'Pradhan Mantri MUDRA Yojana (PMMY)',
    category: 'Small Business Loans',
    description: 'Collateral-free loans up to ₹10 Lakhs for micro/small enterprises, agri-processing units, and rural shops.',
    whyMatches: 'Helps small entrepreneurs and farmers start agri-processing or village businesses.',
    eligibility: {
      states: ['All States & UTs'],
      occupations: ['Entrepreneur', 'Farmer', 'Worker'],
      details: [
        'Non-farm micro enterprise or agri-business',
        'Indian citizen with business proposal'
      ]
    },
    requiredDocuments: [
      'Business Plan / Proposal',
      'KYC Documents (Aadhaar & PAN)',
      'Bank Statement for 6 months'
    ],
    officialUrl: 'https://www.mudra.org.in',
    matchScore: 85
  }
];

export function filterSchemes(criteria: {
  state?: string;
  occupation?: string;
  incomeRange?: string;
  ruralUrban?: string;
}) {
  return SCHEMES_DATABASE.filter((scheme) => {
    if (criteria.occupation && criteria.occupation !== 'All') {
      const matchOcc = scheme.eligibility.occupations.some(
        (o) => o.toLowerCase().includes(criteria.occupation!.toLowerCase()) || o === 'All'
      );
      if (!matchOcc) return false;
    }
    return true;
  });
}
