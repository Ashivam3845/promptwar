import { WelfareScheme } from '@/types';

export const VERIFIED_SCHEMES: WelfareScheme[] = [
  {
    id: 'eshram-portal',
    name: 'e-Shram Portal (Ministry of Labour & Employment)',
    category: 'Social Security',
    officialSourceUrl: 'https://eshram.gov.in',
    jurisdiction: 'Central (All India)',
    isVerified: true,
    lastVerifiedDate: '2026-03-15',
    eligibilityCriteria: [
      'Unorganized / gig / platform / domestic / construction worker',
      'Age between 16 and 59 years',
      'Not an income tax payer',
      'Not an active member of EPFO (PF) or ESIC'
    ],
    relevantExclusions: [
      'Organized sector employees enrolled in regular EPF/ESIC',
      'Individuals above 59 or below 16 years of age'
    ],
    verifiedBenefits: [
      'Universal Account Number (UAN) 12-digit card across India',
      'Accident insurance coverage: ₹2,00,000 on death or permanent disability and ₹1,00,000 on partial disability under PMSBY',
      'Direct benefit transfer portability during national emergencies or disaster relief'
    ],
    applicationSteps: [
      'Visit eshram.gov.in or nearest Common Services Centre (CSC)',
      'Enter Aadhaar linked mobile number and OTP',
      'Fill in personal details, bank account (active IFSC), and gig/occupation type',
      'Download and print the e-Shram UAN digital identity card'
    ],
    summary: {
      en: 'National database of unorganized workers offering 12-digit UAN card, accident insurance, and direct welfare linkages.',
      hi: 'असंगठित व गिग कामगारों के लिए राष्ट्रीय पहचान पत्र (UAN), ₹2 लाख तक दुर्घटना बीमा और सरकारी कल्याणकारी योजनाओं से सीधा जुड़ाव।',
      pa: 'ਅਸੰਗਠਿਤ ਅਤੇ ਗਿੱਗ ਕਾਮਿਆਂ ਲਈ ਰਾਸ਼ਟਰੀ UAN ਕਾਰਡ, ₹2 ਲੱਖ ਦਾ ਦੁਰਘਟਨਾ ਬੀਮਾ ਅਤੇ ਸਰਕਾਰੀ ਭਲਾਈ ਯੋਜਨਾਵਾਂ ਦਾ ਲਾਭ।'
    }
  },
  {
    id: 'pmjay-ayushman-bharat',
    name: 'Ayushman Bharat PM-JAY (Health Protection Scheme)',
    category: 'Health Insurance',
    officialSourceUrl: 'https://pmjay.gov.in',
    jurisdiction: 'Central (All India)',
    isVerified: true,
    lastVerifiedDate: '2026-02-28',
    eligibilityCriteria: [
      'Families identified under SECC 2011 deprivation criteria (rural/urban informal worker classifications)',
      'Valid Ration Card / Aadhaar identification',
      'All senior citizens aged 70+ now eligible regardless of income criteria'
    ],
    relevantExclusions: [
      'Families owning motorized vehicles (3-4 wheelers for personal non-commercial use) or mechanized agricultural equipment in some states',
      'Government employees and organized corporate ESIC beneficiaries'
    ],
    verifiedBenefits: [
      'Cashless secondary and tertiary hospitalization coverage up to ₹5,00,000 per family per year',
      'Empanelled public and private hospitals across all states in India',
      'Covers pre-existing conditions from Day 1 and 3 days pre- / 15 days post-hospitalization costs'
    ],
    applicationSteps: [
      'Check eligibility on mera.pmjay.gov.in or call 14555',
      'Visit any PM-JAY empanelled hospital or CSC with Aadhaar and Ration Card',
      'Complete biometric e-KYC with an Ayushman Mitra',
      'Receive instant PVC Ayushman Bharat card'
    ],
    summary: {
      en: 'World largest health insurance scheme providing ₹5 Lakh cashless hospital treatment per family per year.',
      hi: 'हर परिवार को प्रति वर्ष ₹5 लाख तक का मुफ्त व कैशलेस अस्पताल इलाज (सरकारी व निजी सूचीबद्ध अस्पतालों में)।',
      pa: 'ਹਰ ਪਰਿਵਾਰ ਨੂੰ ਸਾਲਾਨਾ ₹5 ਲੱਖ ਤੱਕ ਦਾ ਮੁਫਤ ਅਤੇ ਕੈਸ਼ਲੈਸ ਹਸਪਤਾਲ ਇਲਾਜ।'
    }
  },
  {
    id: 'rajasthan-gig-workers-act',
    name: 'Rajasthan Platform Based Gig Workers Welfare Board Act',
    category: 'State Gig Welfare',
    officialSourceUrl: 'https://labour.rajasthan.gov.in',
    jurisdiction: 'Rajasthan',
    isVerified: true,
    lastVerifiedDate: '2026-01-20',
    eligibilityCriteria: [
      'Active delivery executive, cab driver, or home-service worker operating via digital platforms in Rajasthan',
      'Registered with an aggregator (Zomato, Swiggy, Uber, Ola, Urban Company, etc.) operating in Rajasthan'
    ],
    relevantExclusions: [
      'Gig workers strictly operating outside Rajasthan state territorial boundaries',
      'Traditional informal labor not onboarded to any app platform'
    ],
    verifiedBenefits: [
      'Unique Gig Worker Registration ID valid across all platforms',
      'Dedicated Welfare Fund financed by platform transaction cess (1% to 2% on customer transaction)',
      'Accident cover, medical emergency grants, and institutional dispute resolution forum against arbitrary account deactivations'
    ],
    applicationSteps: [
      'Platforms are mandated to automatically register active onboarded workers with the State Board',
      'Workers can verify registration status on the Rajasthan Jan Soochna / Labour portal using mobile number'
    ],
    summary: {
      en: 'First-of-its-kind statutory welfare fund in India for platform workers, funding social security and grievance redressal.',
      hi: 'भारत का पहला वैधानिक गिग वर्कर बोर्ड जो डिलीवरी और टैक्सी चालकों को सामाजिक सुरक्षा फंड और आईडी प्रदान करता है।',
      pa: 'ਪਲੇਟਫਾਰਮ ਅਤੇ ਡਿਲੀਵਰੀ ਕਾਮਿਆਂ ਲਈ ਭਾਰਤ ਦਾ ਪਹਿਲਾ ਕਾਨੂੰਨੀ ਵੈਲਫੇਅਰ ਬੋਰਡ ਅਤੇ ਸੁਰੱਖਿਆ ਫੰਡ।'
    }
  },
  {
    id: 'pmsym-pension',
    name: 'PM Shram Yogi Maan-dhan (PM-SYM Pension Scheme)',
    category: 'Pension',
    officialSourceUrl: 'https://maandhan.in',
    jurisdiction: 'Central (All India)',
    isVerified: true,
    lastVerifiedDate: '2026-03-01',
    eligibilityCriteria: [
      'Informal / gig worker with monthly income of ₹15,000 or less',
      'Entry age between 18 and 40 years',
      'Must have Aadhaar card and Savings Bank account with auto-debit facility'
    ],
    relevantExclusions: [
      'Income taxpayers',
      'EPFO, ESIC, or NPS government pension subscribers'
    ],
    verifiedBenefits: [
      'Guaranteed lifelong minimum pension of ₹3,000 per month after reaching 60 years of age',
      '50% monthly contribution matched equally by the Central Government (e.g., ₹55 to ₹200/month based on entry age)',
      '50% family pension to surviving spouse in case of subscriber demise'
    ],
    applicationSteps: [
      'Visit nearest CSC (Common Services Centre) or maandhan.in',
      'Provide Aadhaar, bank passbook, and give initial cash contribution',
      'Sign auto-debit mandate form',
      'Shram Yogi Pension Card generated immediately'
    ],
    summary: {
      en: 'Voluntary old-age pension providing guaranteed ₹3,000/month after 60 years with 50% government co-contribution.',
      hi: '60 वर्ष की आयु के बाद ₹3,000 प्रति माह की निश्चित पेंशन। जितना अंशदान आप जमा करेंगे, उतना ही सरकार देगी।',
      pa: '60 ਸਾਲ ਦੀ ਉਮਰ ਤੋਂ ਬਾਅਦ ₹3,000 ਪ੍ਰਤੀ ਮਹੀਨਾ ਪੈਨਸ਼ਨ। ਬਰਾਬਰ ਹਿੱਸਾ ਸਰਕਾਰ ਵਲੋਂ ਪਾਇਆ ਜਾਂਦਾ ਹੈ।'
    }
  },
  {
    id: 'delhi-aggregator-scheme',
    name: 'Delhi Motor Vehicle Aggregator and Delivery Service Provider Scheme',
    category: 'State Gig Welfare',
    officialSourceUrl: 'https://transport.delhi.gov.in',
    jurisdiction: 'Delhi NCT',
    isVerified: true,
    lastVerifiedDate: '2026-02-15',
    eligibilityCriteria: [
      'Delivery partners and taxi/bike drivers operating under licensed aggregators in National Capital Territory of Delhi'
    ],
    relevantExclusions: [
      'Drivers operating personal unlicensed commercial fleets without platform booking logs'
    ],
    verifiedBenefits: [
      'Mandatory on-duty accidental insurance of at least ₹5,00,000 for drivers/riders provided by aggregators',
      'Health insurance cover of minimum ₹25,000 provided by platform companies',
      'Strict mandated grievance redressal mechanism with defined resolution timelines for arbitrary deactivations'
    ],
    applicationSteps: [
      'Aggregators are legally obligated to provide policy certificate and grievance desk contacts to onboarded partners',
      'Workers can file escalations on Delhi Transport Department portal if aggregator denies mandatory cover'
    ],
    summary: {
      en: 'Mandates ₹5 Lakh accidental cover, health insurance, and formal dispute desk from aggregators operating in Delhi.',
      hi: 'दिल्ली में कंपनियों द्वारा ₹5 लाख का ऑन-ड्यूटी दुर्घटना बीमा और मनमानी आईडी ब्लॉक के खिलाफ शिकायत तंत्र अनिवार्य।',
      pa: 'ਦਿੱਲੀ ਵਿੱਚ ਐਗਰੀਗੇਟਰ ਕੰਪਨੀਆਂ ਵਲੋਂ ₹5 ਲੱਖ ਦਾ ਦੁਰਘਟਨਾ ਬੀਮਾ ਅਤੇ ਸ਼ਿਕਾਇਤ ਨਿਵਾਰਨ ਲਾਜ਼ਮੀ।'
    }
  },
  {
    id: 'national-consumer-helpline',
    name: 'National Consumer Helpline (NCH) & Umang Portal',
    category: 'Social Security',
    officialSourceUrl: 'https://consumerhelpline.gov.in',
    jurisdiction: 'Central (All India)',
    isVerified: true,
    lastVerifiedDate: '2026-03-20',
    eligibilityCriteria: [
      'Any citizen/worker suffering unfair platform trade practices, unauthorized wallet balance deductions, or failure of contracted payment'
    ],
    relevantExclusions: [
      'Matters currently sub-judice before high courts or industrial tribunals'
    ],
    verifiedBenefits: [
      'Free government mediation with corporate nodal officers',
      'Toll-free 1915 phone access or SMS/WhatsApp grievance filing',
      'Direct formal notice issued to companies for resolution within 45 days'
    ],
    applicationSteps: [
      'Call toll-free 1915 or visit consumerhelpline.gov.in',
      'Register with mobile number and select company/aggregator name',
      'Attach screenshot of order deductions, wallet hold, or unpaid incentives',
      'Track real-time docket number online'
    ],
    summary: {
      en: 'Official government escalation channel for disputed payments, wallet holds, and unfair digital aggregator deductions.',
      hi: 'अनुचित कटौती, रोके गए भुगतान या आईडी ब्लॉक के खिलाफ सरकारी उपभोक्ता हेल्पलाइन (टोल-फ्री 1915)।',
      pa: 'ਕਟੌਤੀਆਂ, ਰੋਕੇ ਹੋਏ ਭੁਗਤਾਨ ਜਾਂ ਬਿਨਾਂ ਵਜ੍ਹਾ ਆਈਡੀ ਬੰਦ ਕਰਨ ਖਿਲਾਫ ਸਰਕਾਰੀ ਹੈਲਪਲਾਈਨ (1915)।'
    }
  }
];

export function searchSchemes(query?: string, jurisdiction?: string): WelfareScheme[] {
  let results = VERIFIED_SCHEMES;

  if (jurisdiction && jurisdiction !== 'All') {
    results = results.filter(
      (s) => s.jurisdiction === jurisdiction || s.jurisdiction === 'Central (All India)'
    );
  }

  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    results = results.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.summary.en.toLowerCase().includes(q) ||
        s.summary.hi.toLowerCase().includes(q) ||
        s.summary.pa.toLowerCase().includes(q) ||
        s.eligibilityCriteria.some((c) => c.toLowerCase().includes(q))
    );
  }

  return results;
}
