import { LanguageCode } from './types';

export const UI_TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    home: 'Home / Reader',
    govtSchemes: 'Govt Schemes',
    myDocuments: 'My Documents',
    privacyShieldOn: 'Privacy Shield ON',
    privacyShieldOff: 'Privacy Shield OFF',
    taglineHero: 'Understand legal documents in your own language.',
    heroSubText: 'Upload any legal contract, agreement, or notice. LegalLingo explains what it says, detects hidden risks, and guides your next steps.',
    askByVoice: '🎙 Ask LegalLingo by Voice',
    uploadDoc: 'Upload Your Document',
    takePhoto: 'Take a Photo',
    trySample: 'Try Sample Document',
    understand: '1. Understand',
    understandDesc: 'Complex legal wording is converted into very simple citizen English, Hindi, Marathi, and Gujarati.',
    check: '2. Check',
    checkDesc: 'Automatically identifies risky cancellation clauses, missing survey/Gat numbers, and incomplete records.',
    act: '3. Act',
    actDesc: 'Generates checkable citizen action steps, connects with land record portals (7/12 Mahabhulekh), and matches schemes.',
    
    // Dashboard Header Metrics
    docType: 'Document Type',
    understandingScore: 'Understanding Score',
    importantIssues: 'Important Issues',
    missingInfo: 'Missing Information',
    languageLabel: 'Language',
    statusLabel: 'Status',
    needsAttention: 'Needs Attention',
    looksStandard: 'Looks Standard',
    highRisk: 'High Risk',
    
    // AI Summary
    summaryTitle: 'What is this document about?',
    inVerySimpleWords: 'In Very Simple Words',
    makeItEvenSimpler: 'Make It Even Simpler',
    superSimpleActive: '✓ Super Simple Mode Active',
    downloadPdf: 'Download Easy PDF Summary',

    // Document Reader
    weReadYourDoc: 'We Read Your Document',
    readerSubText: 'Compare legal clauses side-by-side with citizen-friendly explanations. Click any paragraph to highlight.',
    sideBySide: 'Side-by-Side',
    simple: 'Simple',
    original: 'Original',
    editText: 'Edit Text',
    originalLegalDoc: 'Original Legal Document',
    simpleExplanation: 'Simple Explanation',
    listenAudio: 'Listen 🔊',
    stopAudio: 'Stop',

    // 5 Questions
    whatYouNeedToKnow: 'What You Need To Know',
    q1Title: 'What is this document?',
    q2Title: 'Who is involved?',
    q3Title: 'What is the amount?',
    q4Title: 'Is anything important missing?',
    q5Title: 'What should I do next?',

    // Clause Risk
    clauseAuditTitle: 'Risk and Clause Analysis',
    highAttention: '🔴 High Attention',
    reviewNeeded: '🟠 Review',
    standardWording: '🟢 Standard',
    whyItMatters: 'Why This Matters',
    simpleMeaning: 'Simple Meaning',
    recommendedAction: 'Recommended Action',
    askAboutClause: 'Ask LegalLingo About This Clause',

    // Health Score
    docHealth: 'Document Health',
    completenessIndicator: 'AI Completeness & Attention Indicator (Not legal validity)',
    identityInfo: 'Identity Information',
    propertyInfo: 'Property Information',
    financialInfo: 'Financial Information',
    importantClauses: 'Important Clauses',
    witnessInfo: 'Witness Information',
    registrationInfo: 'Registration Information',

    // Glossary
    difficultWordsTitle: 'Difficult Legal Words Explained',
    difficultSubText: 'Click any difficult legal term below to see its plain definition and real-life example.',
    simpleExample: 'Simple Example',

    // Missing Info
    thingsToCheck: 'Things You Should Check',
    whatYouCanDo: 'What you can do:',

    // Checklist
    whatNextTitle: 'What Should I Do Next?',
    completedOf: 'Completed',

    // Govt Services
    govtServicesTitle: 'Relevant Government Services',
    openPortal: 'Open Official Portal',
    viewGuidance: 'View Guidance',

    // Disclaimer
    disclaimerTitle: 'Legal & Civic Disclaimer',
    disclaimerText: 'LegalLingo provides AI-assisted legal information and document understanding for awareness purposes. It does not constitute legal advice or replace consultation with a qualified legal professional.'
  },

  hi: {
    home: 'होम / पाठक (Reader)',
    govtSchemes: 'सरकारी योजनाएं',
    myDocuments: 'मेरे दस्तावेज़',
    privacyShieldOn: 'गोपनीयता शील्ड चालू',
    privacyShieldOff: 'गोपनीयता शील्ड बंद',
    taglineHero: 'अपनी भाषा में कानूनी दस्तावेजों को आसानी से समझें।',
    heroSubText: 'कोई भी कानूनी अनुबंध, समझौता या नोटिस अपलोड करें। लीगल लिंगो इसके अर्थ, छिपे जोखिमों और अगले कदमों की व्याख्या करता है।',
    askByVoice: '🎙 आवाज से पूछें',
    uploadDoc: 'अपना दस्तावेज़ अपलोड करें',
    takePhoto: 'फोटो खींचें',
    trySample: 'नमूना (Sample) दस्तावेज़ देखें',
    understand: '१. समझें',
    understandDesc: 'कठिन कानूनी भाषा को बहुत सरल हिंदी, मराठी, गुजराती और अंग्रेजी में बदला जाता है।',
    check: '२. जांचें',
    checkDesc: 'जोखिम भरी रद्दीकरण शर्तों, गायब सर्वेक्षण/गट नंबरों और अधूरी जानकारी की तुरंत पहचान करता है।',
    act: '३. कदम उठाएं',
    actDesc: 'कार्रवाई योग्य सूची तैयार करता है, भूमि रिकॉर्ड (7/12 महाभूलेख) से जोड़ता है और योजनाओं से मिलाता है।',

    // Dashboard Header Metrics
    docType: 'दस्तावेज़ का प्रकार',
    understandingScore: 'समझ का स्कोर',
    importantIssues: 'महत्वपूर्ण मुद्दे',
    missingInfo: 'गायब जानकारी',
    languageLabel: 'भाषा',
    statusLabel: 'स्थिति',
    needsAttention: 'ध्यान देने की आवश्यकता है',
    looksStandard: 'सामान्य दिखता है',
    highRisk: 'उच्च जोखिम',

    // AI Summary
    summaryTitle: 'यह दस्तावेज़ किस बारे में है?',
    inVerySimpleWords: 'बहुत सरल शब्दों में',
    makeItEvenSimpler: 'इसे और भी सरल बनाएं',
    superSimpleActive: '✓ अति-सरल मोड सक्रिय',
    downloadPdf: 'आसान PDF सारांश डाउनलोड करें',

    // Document Reader
    weReadYourDoc: 'हमने आपका दस्तावेज़ पढ़ा',
    readerSubText: 'नागरिक-अनुकूल स्पष्टीकरण के साथ कानूनी धाराओं की एक-दूसरे से तुलना करें।',
    sideBySide: 'आने-सामने (Side-by-Side)',
    simple: 'सरल',
    original: 'मूल (Original)',
    editText: 'पाठ संपादित करें',
    originalLegalDoc: 'मूल कानूनी दस्तावेज़',
    simpleExplanation: 'सरल स्पष्टीकरण',
    listenAudio: 'सुनें 🔊',
    stopAudio: 'रोकें',

    // 5 Questions
    whatYouNeedToKnow: 'आपको क्या जानना आवश्यक है',
    q1Title: 'यह दस्तावेज़ क्या है?',
    q2Title: 'कौन-कौन शामिल हैं?',
    q3Title: 'कुल राशि कितनी है?',
    q4Title: 'क्या कुछ महत्वपूर्ण गायब है?',
    q5Title: 'मुझे आगे क्या करना चाहिए?',

    // Clause Risk
    clauseAuditTitle: 'जोखिम और धारा विश्लेषण',
    highAttention: '🔴 उच्च ध्यान',
    reviewNeeded: '🟠 समीक्षा आवश्यक',
    standardWording: '🟢 मानक',
    whyItMatters: 'यह क्यों महत्वपूर्ण है',
    simpleMeaning: 'सरल अर्थ',
    recommendedAction: 'अनुशंसित कार्रवाई',
    askAboutClause: 'इस धारा के बारे में लीगल लिंगो से पूछें',

    // Health Score
    docHealth: 'दस्तावेज़ स्वास्थ्य',
    completenessIndicator: 'AI पूर्णता और ध्यान संकेतक (कानूनी वैधता नहीं)',
    identityInfo: 'पहचान की जानकारी',
    propertyInfo: 'संपत्ति की जानकारी',
    financialInfo: 'वित्तीय जानकारी',
    importantClauses: 'महत्वपूर्ण धाराएं',
    witnessInfo: 'गवाहों की जानकारी',
    registrationInfo: 'पंजीकरण की जानकारी',

    // Glossary
    difficultWordsTitle: 'कठिन कानूनी शब्दों का सरल अर्थ',
    difficultSubText: 'सरल परिभाषा और वास्तविक उदाहरण देखने के लिए किसी भी कानूनी शब्द पर क्लिक करें।',
    simpleExample: 'सरल उदाहरण',

    // Missing Info
    thingsToCheck: 'बातें जिन्हें आपको जांचना चाहिए',
    whatYouCanDo: 'आप क्या कर सकते हैं:',

    // Checklist
    whatNextTitle: 'मुझे आगे क्या करना चाहिए?',
    completedOf: 'पूरा हुआ',

    // Govt Services
    govtServicesTitle: 'संबंधित सरकारी सेवाएं',
    openPortal: 'आधिकारिक पोर्टल खोलें',
    viewGuidance: 'मार्गदर्शन देखें',

    // Disclaimer
    disclaimerTitle: 'कानूनी अस्वीकरण',
    disclaimerText: 'लीगल लिंगो केवल जागरूकता के लिए AI-सहायता प्राप्त जानकारी प्रदान करता है। यह औपचारिक कानूनी सलाह नहीं है।'
  },

  mr: {
    home: 'मुख्य पृष्ठ / वाचक',
    govtSchemes: 'शासकीय योजना',
    myDocuments: 'माझे कागदपत्रे',
    privacyShieldOn: 'गोपनीयता कवच चालू',
    privacyShieldOff: 'गोपनीयता कवच बंद',
    taglineHero: 'आपल्या स्वतःच्या भाषेत कायदेशीर कागदपत्रे सहज समजून घ्या.',
    heroSubText: 'कोणताही कायदेशीर करार, खरेदीखत किंवा नोटीस अपलोड करा. लीगल लिंगो त्याचा अर्थ, लपलेले धोके आणि पुढील पायऱ्या स्पष्ट करते.',
    askByVoice: '🎙 आवाजाने विचारा',
    uploadDoc: 'कागदपत्र अपलोड करा',
    takePhoto: 'फोटो काढा',
    trySample: 'नमूना (Sample) करार पहा',
    understand: '१. समजून घ्या',
    understandDesc: 'कठीण कायदेशीर भाषा अत्यंत सोप्या मराठी, हिंदी, गुजराती आणि इंग्रजीमध्ये रुपांतरित केली जाते.',
    check: '२. तपासा',
    checkDesc: 'धोकादायक रद्दबातल अटी, गहाळ सर्व्हे/गट क्रमांक आणि अपूर्ण नोंदी त्वरित ओळखते.',
    act: '३. कृती करा',
    actDesc: 'तपासणी सूची तयार करते, ७/१२ महाभूलेख पोर्टलशी जोडते आणि योजना शोधते.',

    // Dashboard Header Metrics
    docType: 'कागदपत्राचा प्रकार',
    understandingScore: 'समजून घेण्याचा स्कोर',
    importantIssues: 'महत्वाचे मुद्दे',
    missingInfo: 'गहाळ माहिती',
    languageLabel: 'भाषा',
    statusLabel: 'स्थिती',
    needsAttention: 'लक्ष देणे आवश्यक',
    looksStandard: 'सामान्य दिसते',
    highRisk: 'उच्च धोका',

    // AI Summary
    summaryTitle: 'हे कागदपत्र कशाबद्दल आहे?',
    inVerySimpleWords: 'अत्यंत सोप्या शब्दात',
    makeItEvenSimpler: 'अजून सोपे करा',
    superSimpleActive: '✓ अति-सोपा मोड चालू',
    downloadPdf: 'सोपा PDF अहवाल डाउनलोड करा',

    // Document Reader
    weReadYourDoc: 'आम्ही तुमचे कागदपत्र वाचले',
    readerSubText: 'कायदेशीर कलमांची सोप्या मराठी स्पष्टीकरणासह आमनेसामने तुलना करा.',
    sideBySide: 'आमनेसामने (Side-by-Side)',
    simple: 'सोपे',
    original: 'मूळ (Original)',
    editText: 'मजकूर संपादन करा',
    originalLegalDoc: 'मूळ कायदेशीर कागदपत्र',
    simpleExplanation: 'सोपे स्पष्टीकरण',
    listenAudio: 'ऐका 🔊',
    stopAudio: 'थांबवा',

    // 5 Questions
    whatYouNeedToKnow: 'तुम्हाला काय माहित असणे आवश्यक आहे',
    q1Title: 'हे कागदपत्र काय आहे?',
    q2Title: 'यामध्ये कोण समाविष्ट आहे?',
    q3Title: 'एकूण रक्कम किती आहे?',
    q4Title: 'काही महत्त्वाचे गहाळ आहे का?',
    q5Title: 'मी पुढे काय करावे?',

    // Clause Risk
    clauseAuditTitle: 'धोका आणि कलम विश्लेषण',
    highAttention: '🔴 उच्च लक्ष',
    reviewNeeded: '🟠 पुनरावलोकन आवश्यक',
    standardWording: '🟢 मानक',
    whyItMatters: 'हे का महत्त्वाचे आहे',
    simpleMeaning: 'सोपा अर्थ',
    recommendedAction: 'शिफारस केलेली कृती',
    askAboutClause: 'या कलमाबद्दल लीगल लिंगोला विचारा',

    // Health Score
    docHealth: 'कागदपत्र आरोग्य',
    completenessIndicator: 'AI पूर्णता व लक्ष निर्देशक (कायदेशीर वैधता नाही)',
    identityInfo: 'ओळख माहिती',
    propertyInfo: 'मालमत्ता माहिती',
    financialInfo: 'आर्थिक माहिती',
    importantClauses: 'महत्त्वाची कलमे',
    witnessInfo: 'साक्षीदारांची माहिती',
    registrationInfo: 'नोंदणी माहिती',

    // Glossary
    difficultWordsTitle: 'कठीण कायदेशीर शब्दांचे सोपे अर्थ',
    difficultSubText: 'सोपी व्याख्या आणि वास्तववादी उदाहरण पाहण्यासाठी कोणत्याही शब्दावर क्लिक करा.',
    simpleExample: 'सोपे उदाहरण',

    // Missing Info
    thingsToCheck: 'तुम्ही तपासल्या पाहिजेत अशा गोष्टी',
    whatYouCanDo: 'तुम्ही काय करू शकता:',

    // Checklist
    whatNextTitle: 'मी पुढे काय केले पाहिजे?',
    completedOf: 'पूर्ण झाले',

    // Govt Services
    govtServicesTitle: 'संबंधित शासकीय सेवा',
    openPortal: 'अधिकृत पोर्टल उघडा',
    viewGuidance: 'मार्गदर्शन पहा',

    // Disclaimer
    disclaimerTitle: 'कायदेशीर सुचना',
    disclaimerText: 'लीगल लिंगो केवळ जनजागृतीसाठी AI-सहाय्यित माहिती प्रदान करते. हा औपचारिक कायदेशीर सल्ला नाही.'
  },

  gu: {
    home: 'હોમ / રીડર',
    govtSchemes: 'સરકારી યોજનાઓ',
    myDocuments: 'મારા દસ્તાવેજો',
    privacyShieldOn: 'ગોપનીયતા કવચ ચાલુ',
    privacyShieldOff: 'ગોપનીયતા કવચ બંધ',
    taglineHero: 'તમારી પોતાની ભાષામાં કાનૂની દસ્તાવેજો સરળતાથી સમજો.',
    heroSubText: 'કોઈપણ કાનૂની કરાર કે નોટિસ અપલોડ કરો. લીગલ લિંગો તેના અર્થ અને જોખમોની સ્પષ્ટતા કરે છે.',
    askByVoice: '🎙 અવાજથી પૂછો',
    uploadDoc: 'તમારો દસ્તાવેજ અપલોડ કરો',
    takePhoto: 'ફોટો પાડો',
    trySample: 'નમૂનાનો દસ્તાવેજ જુઓ',
    understand: '૧. સમજો',
    understandDesc: 'અઘરી કાનૂની ભાષાને ખૂબ જ સરળ ગુજરાતી, હિન્દી અને અંગ્રેજીમાં રૂપાંતરિત કરવામાં આવે છે.',
    check: '૨. ચકાસો',
    checkDesc: 'જોખમી રદબાતલ શરતો અને ગાયબ સર્વે નંબરોની તુરંત ઓળખ કરે છે.',
    act: '૩. પગલાં લો',
    actDesc: 'કાર્યવાહી યાદી બનાવે છે અને સરકારી સેવાઓ સાથે જોડે છે.',

    // Dashboard Header Metrics
    docType: 'દસ્તાવેજનો પ્રકાર',
    understandingScore: 'સમજણનો સ્કોર',
    importantIssues: 'મહત્વના મુદ્દા',
    missingInfo: 'ગાયબ માહિતી',
    languageLabel: 'ભાષા',
    statusLabel: 'સ્થિતિ',
    needsAttention: 'ધ્યાન આપવાની જરૂર છે',
    looksStandard: 'સામાન્ય લાગે છે',
    highRisk: 'ઉચ્ચ જોખમ',

    // AI Summary
    summaryTitle: 'આ દસ્તાવેજ શેના વિશે છે?',
    inVerySimpleWords: 'ખૂબ જ સરળ શબ્દોમાં',
    makeItEvenSimpler: 'વધુ સરળ બનાવો',
    superSimpleActive: '✓ અતિ-સરળ મોડ સક્રિય',
    downloadPdf: 'સરળ PDF સારાંશ ડાઉનલોડ કરો',

    // Document Reader
    weReadYourDoc: 'અમે તમારો દસ્તાવેજ વાંચ્યો',
    readerSubText: 'કાનૂની કલમોની સરખામણી કરો.',
    sideBySide: 'સામે-સામે (Side-by-Side)',
    simple: 'સરળ',
    original: 'મૂળ (Original)',
    editText: 'લખાણ સુધારો',
    originalLegalDoc: 'મૂળ કાનૂની દસ્તાવેજ',
    simpleExplanation: 'સરળ સ્પષ્ટતા',
    listenAudio: 'સાંભળો 🔊',
    stopAudio: 'અટકાવો',

    // 5 Questions
    whatYouNeedToKnow: 'તમારે શું જાણવું જરૂરી છે',
    q1Title: 'આ દસ્તાવેજ શું છે?',
    q2Title: 'કોણ કોણ સામેલ છે?',
    q3Title: 'કુલ રકમ કેટલી છે?',
    q4Title: 'શું કંઈપણ મહત્વનું ગાયબ છે?',
    q5Title: 'મારે આગળ શું કરવું જોઈએ?',

    // Clause Risk
    clauseAuditTitle: 'જોખમ અને કલમ વિશ્લેષણ',
    highAttention: '🔴 ઉચ્ચ ધ્યાન',
    reviewNeeded: '🟠 સમીક્ષા જરૂરી',
    standardWording: '🟢 પ્રમાણભૂત',
    whyItMatters: 'આ કેમ મહત્વનું છે',
    simpleMeaning: 'સરળ અર્થ',
    recommendedAction: 'ભલામણ કરેલ પગલું',
    askAboutClause: 'આ કલમ વિશે પૂછો',

    // Health Score
    docHealth: 'દસ્તાવેજ સ્વાસ્થ્ય',
    completenessIndicator: 'AI પૂર્ણતા સૂચક',
    identityInfo: 'ઓળખ માહિતી',
    propertyInfo: 'મિલકત માહિતી',
    financialInfo: 'નાણાકીય માહિતી',
    importantClauses: 'મહત્વની કલમો',
    witnessInfo: 'સાક્ષીઓની માહિતી',
    registrationInfo: 'નોંધણી માહિતી',

    // Glossary
    difficultWordsTitle: 'અઘરા કાનૂની શબ્દોના સરળ અર્થ',
    difficultSubText: 'સરળ વ્યાખ્યા જોવા માટે શબ્દ પર ક્લિક કરો.',
    simpleExample: 'સરળ ઉદાહરણ',

    // Missing Info
    thingsToCheck: 'તમારે ચકાસવા જેવી બાબતો',
    whatYouCanDo: 'તમે શું કરી શકો:',

    // Checklist
    whatNextTitle: 'મારે આગળ શું કરવું જોઈએ?',
    completedOf: 'પૂર્ણ થયું',

    // Govt Services
    govtServicesTitle: 'સંબંધિત સરકારી સેવાઓ',
    openPortal: 'સત્તાવાર પોર્ટલ ખોલો',
    viewGuidance: 'માર્ગદર્શન જુઓ',

    // Disclaimer
    disclaimerTitle: 'કાનૂની સૂચના',
    disclaimerText: 'લીગલ લિંગો માત્ર જાગરૂકતા માટે AI સપોર્ટેડ માહિતી આપે છે.'
  }
};

export function getTranslation(key: string, lang: LanguageCode): string {
  return UI_TRANSLATIONS[lang]?.[key] || UI_TRANSLATIONS['en'][key] || key;
}
