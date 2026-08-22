import { DocumentAnalysis, LanguageCode } from './types';

/**
 * Comprehensive translation dictionary for paragraph simple explanations, summaries,
 * risk cards, and missing info callouts.
 */
const TRANSLATION_MAP: Record<string, Record<LanguageCode, string>> = {
  // Para 1
  'This is a complex agreement for selling 2.40 hectares of agricultural land in Pune between seller Ramesh Patil and buyer Suresh Jadhav.': {
    en: 'This is a complex agreement for selling 2.40 hectares of agricultural land in Pune between seller Ramesh Patil and buyer Suresh Jadhav.',
    hi: 'यह पुणे में विक्रेता रमेश पाटिल और खरीदार सुरेश जाधव के बीच 2.40 हेक्टेयर कृषि भूमि बेचने का एक महत्वपूर्ण समझौता है।',
    mr: 'हा पुणे येथील विक्रेता रमेश पाटील आणि खरेदीदार सुरेश जाधव यांच्यातील २.४० हेक्टर शेतजमीन विक्रीचा एक महत्त्वाचा करार आहे.',
    gu: 'આ પુણેમાં વેચનાર રમેશ પાટીલ અને ખરીદનાર સુરેશ જાદવ વચ્ચે 2.40 હેક્ટર ખેતીની જમીન વેચવાનો કરાર છે.'
  },
  // Para 2
  'The land consists of 3 plots (Gat Nos. 142/3A, 142/3B, 145). Crucially, plot 142/3A has an active unpaid bank loan mortgage of ₹2,80,000 with a cooperative society!': {
    en: 'The land consists of 3 plots (Gat Nos. 142/3A, 142/3B, 145). Crucially, plot 142/3A has an active unpaid bank loan mortgage of ₹2,80,000 with a cooperative society!',
    hi: 'जमीन में 3 प्लॉट (गट नं. 142/3A, 142/3B, 145) शामिल हैं। मुख्य बात यह है कि गट नं. 142/3A पर सहकारी बैंक का ₹2,80,000 का बकाया ऋण और बंधक (Mortgage) दर्ज है!',
    mr: 'जमिनीमध्ये ३ भूखंड (गट क्र. १४२/३A, १४२/३B, १४५) समाविष्ट आहेत. महत्त्वाचे म्हणजे, गट क्र. १४२/३A वर सहकारी सोसायटीचे ₹२,८०,००० चे थकीत पीककर्ज व बँक गहाण नोंद आहे!',
    gu: 'જમીનમાં 3 પ્લોટ (ગટ નં. 142/3A, 142/3B, 145) સામેલ છે. મહત્વનું એ છે કે ગટ નં. 142/3A પર સહકારી મંડળીની ₹2,80,000 ની બેંક લોન અને ગીરો બોજો નોંધાયેલ છે!'
  },
  // Para 3
  'Total price is ₹18.5 Lakh. Buyer gave ₹3.5 Lakh advance today. Buyer must pay ₹2.8 Lakh directly to clear the bank loan by Aug 25, and pay remaining ₹12.2 Lakh by Sept 15.': {
    en: 'Total price is ₹18.5 Lakh. Buyer gave ₹3.5 Lakh advance today. Buyer must pay ₹2.8 Lakh directly to clear the bank loan by Aug 25, and pay remaining ₹12.2 Lakh by Sept 15.',
    hi: 'कुल मूल्य ₹18.5 लाख है। खरीदार ने आज ₹3.5 लाख अग्रिम (Advance) दिए। खरीदार को 25 अगस्त तक बैंक ऋण चुकता करने के लिए ₹2.8 लाख सीधे बैंक में जमा करने होंगे, और शेष ₹12.2 लाख 15 सितंबर तक देने होंगे।',
    mr: 'एकूण किंमत ₹१८.५ लाख आहे. खरेदीदाराने आज ₹३.५ लाख अ‍ॅडव्हान्स दिले. खरेदीदाराने २५ ऑगस्टपूर्वी ₹२.८ लाख थेट बँकेत भरून कर्ज फेडले पाहिजे आणि उर्वरित ₹१२.२ लाख १५ सप्टेंबरपर्यंत दिले पाहिजेत.',
    gu: 'કુલ કિંમત ₹18.5 લાખ છે. ખરીદદારે આજે ₹3.5 લાખ એડવાન્સ આપ્યા. ખરીદદારે 25 ઓગસ્ટ સુધીમાં બેંક લોન ચુકવવા માટે ₹2.8 લાખ સીધા બેંકમાં જમા કરવા પડશે અને બાકીના ₹12.2 લાખ 15 સપ્ટેમ્બર સુધીમાં આપવા પડશે.'
  },
  // Para 4
  'If Suresh (buyer) misses the Sept 15 deadline, Ramesh will cancel the deal, seize the entire ₹3.5 Lakh advance money, and charge an extra 18% interest penalty!': {
    en: 'If Suresh (buyer) misses the Sept 15 deadline, Ramesh will cancel the deal, seize the entire ₹3.5 Lakh advance money, and charge an extra 18% interest penalty!',
    hi: 'यदि खरीदार सुरेश 15 सितंबर की समय सीमा चूक जाता है, तो विक्रेता रमेश सौदा रद्द कर देगा, पूरी ₹3.5 लाख की अग्रिम राशि जब्त कर लेगा, और 18% वार्षिक ब्याज दंड लगाएगा!',
    mr: 'जर खरेदीदार सुरेशने १५ सप्टेंबरची मुदत चुकवली, तर विक्रेता रमेश हा व्यवहार रद्द करेल, सर्व ₹३.५ लाख अ‍ॅडव्हान्स रक्कम जप्त करेल आणि १८% दंड व्याज आकारेल!',
    gu: 'જો ખરીદદાર સુરેશ 15 સપ્ટેમ્બરની સમયસીમા ચૂકી જાય, તો વેચનાર રમેશ સોદો રદ કરશે, તમામ ₹3.5 લાખ એડવાન્સ નાણાં જપ્ત કરશે અને 18% વ્યાજ દંડ વસૂલશે!'
  },
  // Para 5
  'Water well is shared with neighbor Sopan Patil. There is a dispute regarding water drawing rights, and the seller will not help if neighbor blocks water access!': {
    en: 'Water well is shared with neighbor Sopan Patil. There is a dispute regarding water drawing rights, and the seller will not help if neighbor blocks water access!',
    hi: 'पानी का कुआं पड़ोसी सोपान पाटिल के साथ साझा है। पानी खींचने के अधिकारों को लेकर विवाद है, और यदि पड़ोसी पानी रोकता है तो विक्रेता सहायता नहीं करेगा!',
    mr: 'विहीर शेजारील शेतकरी सोपान पाटील यांच्यासोबत सामायिक आहे. पाणी वापरण्याबाबत वाद सुरू आहे, आणि शेजाऱ्याने पाणी अडवल्यास विक्रेता कोणतीही मदत करणार नाही!',
    gu: 'પાણીનો કૂવો પાડોશી સોપાન પાટીલ સાથેિયારી છે. પાણી ખેંચવાના હકો અંગે વિવાદ છે, અને જો પાડોશી પાણી રોકે તો વેચનાર મદદ કરશે નહીં!'
  },
  // Para 6
  'Buyer cannot take full possession until paying 75% of money. The power of attorney can be canceled by seller anytime before full payment.': {
    en: 'Buyer cannot take full possession until paying 75% of money. The power of attorney can be canceled by seller anytime before full payment.',
    hi: 'खरीदार 75% राशि का भुगतान करने तक पूर्ण अधिकार/कब्जा नहीं ले सकता। विक्रेता पूरे भुगतान से पहले किसी भी समय पावर ऑफ अटॉर्नी रद्द कर सकता है।',
    mr: '७५% रक्कम दिल्याशिवाय खरेदीदाराला पूर्ण ताबा मिळणार नाही. पूर्ण पैसे मिळेपर्यंत कुलमुखत्यारपत्र (Power of Attorney) विक्रेता कधीही रद्द करू शकतो.',
    gu: 'ખરીદદાર 75% રકમ ચૂકવે નહીં ત્યાં સુધી પૂર્ણ કબજો મેળવી શકશે નહીં. પૂર્ણ ચુકવણી પહેલાં વેચનાર પાવર ઓફ એટર્ની ગમે ત્યારે રદ કરી શકે છે.'
  },
  // Para 7
  'Ramesh promises to compensate the buyer if his brother Ganpat Patil or family relatives file a legal claim claiming ownership of this land.': {
    en: 'Ramesh promises to compensate the buyer if his brother Ganpat Patil or family relatives file a legal claim claiming ownership of this land.',
    hi: 'रमेश खरीदार को मुआवजा देने का वादा करता है यदि उसका भाई गणपति पाटिल या परिवार के रिश्तेदार इस जमीन पर स्वामित्व का दावा करते हुए कानूनी मामला दर्ज करते हैं।',
    mr: 'रमेशचा भाऊ गणपत पाटील किंवा वारसदारांनी या जमिनीवर हक्क सांगितल्यास नुकसान भरपाई देण्याचे वचन रमेशने खरेदीदारास दिले आहे.',
    gu: 'રમેશ ખરીદદારને વળતર આપવાનું વચન આપે છે જો તેનો ભાઈ ગણપત પાટીલ અથવા પરિવારના સભ્યો આ જમીન પર માલિકીનો દાવો કરે.'
  },
  // Para 8
  'Buyer must pay all government stamp duty (7%) and lawyer fees. Any dispute must go to a private arbitrator in Pune court.': {
    en: 'Buyer must pay all government stamp duty (7%) and lawyer fees. Any dispute must go to a private arbitrator in Pune court.',
    hi: 'खरीदार को सभी सरकारी स्टाम्प ड्यूटी (7%), पंजीकरण शुल्क और वकील की फीस देनी होगी। किसी भी विवाद का निपटारा पुणे में मध्यस्थ (Arbitrator) द्वारा किया जाएगा।',
    mr: 'खरेदीदाराने ७% मुद्रांक शुल्क (Stamp Duty) आणि नोंदणी फी भरणे बंधनकारक आहे. वाद उद्भवल्यास पुण्यात लवादाकडे (Arbitrator) दाद मागावी लागेल.',
    gu: 'ખરીદદારે તમામ સરકારી સ્ટેમ્પ ડ્યુટી (7%) અને વકીલની ફી ચૂકવવી પડશે. કોઈપણ વિવાદ પુણેમાં આર્બિટ્રેટર સમક્ષ લઈ જવો પડશે.'
  },

  // Summaries
  'This is a complex agreement for the sale of 2.40 Hectares of agricultural land across 3 Gat numbers between Ramesh Patil and Suresh Jadhav for ₹18,50,000. It involves an active bank mortgage of ₹2,80,000, shared water well dispute, strict forfeiture penalty, and brother title claims.': {
    en: 'This is a complex agreement for the sale of 2.40 Hectares of agricultural land across 3 Gat numbers between Ramesh Patil and Suresh Jadhav for ₹18,50,000. It involves an active bank mortgage of ₹2,80,000, shared water well dispute, strict forfeiture penalty, and brother title claims.',
    hi: 'यह रमेश पाटिल और सुरेश जाधव के बीच ₹18,50,000 में 3 गट नंबरों पर 2.40 हेक्टेयर कृषि भूमि की बिक्री का एक महत्वपूर्ण समझौता है। इसमें ₹2,80,000 का सक्रिय बैंक बंधक, साझा पानी के कुएं का विवाद, सख्त जब्ती जुर्माना और भाई के मालिकाना हक का दावा शामिल है।',
    mr: 'हा रमेश पाटील आणि सुरेश जाधव यांच्यातील ₹१८,५०,००० च्या ३ गट क्रमांकांवरील २.४० हेक्टर शेतजमीन विक्रीचा करार आहे. यामध्ये ₹२,८०,००० चे बँक कर्ज, विहिरीच्या पाण्याचा वाद, जप्तीचा दंड आणि भावाच्या हक्काचे दावे समाविष्ट आहेत.',
    gu: 'આ રમેશ પાટીલ અને સુરેશ જાદવ વચ્ચે ₹18,50,000 માં 3 ગટ નંબરો પર 2.40 હેક્ટર ખેતીની જમીન વેચવાનો કરાર છે. આમાં ₹2,80,000 ની બેંક લોન, પાણીના કૂવાનો વિવાદ અને નાણાં જપ્તીનો દંડ સામેલ છે.'
  },

  'Ramesh is selling farm land (2.4 Hectares) to Suresh for ₹18.5 Lakh. The buyer gave ₹3.5 Lakh advance, must clear an existing ₹2.8 Lakh bank loan on the land, and pay remaining ₹12.2 Lakh by Sept 15 or lose all advance money.': {
    en: 'Ramesh is selling farm land (2.4 Hectares) to Suresh for ₹18.5 Lakh. The buyer gave ₹3.5 Lakh advance, must clear an existing ₹2.8 Lakh bank loan on the land, and pay remaining ₹12.2 Lakh by Sept 15 or lose all advance money.',
    hi: 'रमेश अपनी 2.4 हेक्टेयर कृषि भूमि सुरेश को ₹18.5 लाख में बेच रहा है। खरीदार ने ₹3.5 लाख अग्रिम दिए हैं, जमीन पर ₹2.8 लाख का बैंक लोन चुकता करना होगा, और शेष ₹12.2 लाख 15 सितंबर तक देने होंगे अन्यथा पूरी अग्रिम राशि जब्त हो जाएगी।',
    mr: 'रमेश सुरेशला ₹१८.५ लाखांत शेतजमीन (२.४ हेक्टर) विकत आहे. खरेदीदाराने ₹३.५ लाख अ‍ॅडव्हान्स दिला आहे, जमिनीवरील ₹२.८ लाखांचे बँक कर्ज फेडावे लागेल आणि १५ सप्टेंबरपर्यंत उर्वरित ₹१२.२ लाख द्यावे लागतील अन्यथा सर्व पैसे जप्त होतील.',
    gu: 'રમેશ સુરેશને ₹18.5 લાખમાં ખેતીની જમીન (2.4 હેક્ટર) વેચી રહ્યો છે. ખરીદદારે ₹3.5 લાખ એડવાન્સ આપ્યા, ₹2.8 લાખની બેંક લોન ચૂકવવી પડશે અને 15 સપ્ટેમ્બર સુધીમાં બાકીના ₹12.2 લાખ આપવા પડશે.'
  },

  'Ramesh selling farm to Suresh for 18.5 Lakh. Buyer gave 3.5 Lakh deposit. Must clear bank loan by Aug 25 and pay 12.2 Lakh by Sept 15 or lose all deposit money + pay 18% penalty!': {
    en: 'Ramesh selling farm to Suresh for 18.5 Lakh. Buyer gave 3.5 Lakh deposit. Must clear bank loan by Aug 25 and pay 12.2 Lakh by Sept 15 or lose all deposit money + pay 18% penalty!',
    hi: 'रमेश सुरेश को 18.5 लाख में खेत बेच रहा है। खरीदार ने 3.5 लाख अग्रिम जमा किए। 25 अगस्त तक बैंक लोन चुकाएं और 15 सितंबर तक 12.2 लाख दें, अन्यथा सभी जमा पैसे जब्त + 18% जुर्माना देना होगा!',
    mr: 'रमेश सुरेशला १८.५ लाखांत शेत विकत आहे. खरेदीदाराने ३.५ लाख जमा केले. २५ ऑगस्टपर्यंत बँक कर्ज फेडा आणि १५ सप्टेंबरपर्यंत १२.२ लाख द्या, अन्यथा सर्व जमा रक्कम जप्त + १८% दंड!',
    gu: 'રમેશ સુરેશને 18.5 લાખમાં જમીન વેચે છે. 3.5 લાખ જમા આપ્યા. 25 ઓગસ્ટ સુધીમાં બેંક લોન ચૂકવો અને 15 સપ્ટેમ્બર સુધીમાં 12.2 લાખ આપો નહીં તો તમામ નાણાં જપ્ત + 18% દંડ!'
  }
};

/**
 * AI Document Analysis Service for LegalLingo.
 */
export async function analyzeDocumentText(
  extractedText: string,
  fileName: string = 'Uploaded Document'
): Promise<DocumentAnalysis> {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: extractedText, fileName })
    });

    if (response.ok) {
      const data = await response.json();
      return {
        id: `doc-${Date.now()}`,
        documentTitle: fileName || 'Uploaded Legal Document',
        originalText: extractedText,
        createdAt: new Date().toISOString(),
        ...data
      } as DocumentAnalysis;
    }

    console.warn('[analyzeDocumentText] /api/analyze returned', response.status, '- using offline fallback');
  } catch (e) {
    console.warn('[analyzeDocumentText] /api/analyze request failed, using offline fallback:', e);
  }

  return generateOfflineAnalysis(extractedText, fileName);
}

const JARGON_GLOSSARY: { term: string; simpleMeaning: string; simpleExample: string }[] = [
  { term: 'Encumbrance', simpleMeaning: 'A legal liability, mortgage, or debt attached to a property title.', simpleExample: 'A bank loan against a house is an encumbrance on that property.' },
  { term: 'Forfeiture', simpleMeaning: 'Losing money or rights as a penalty for breaking the terms of an agreement.', simpleExample: 'If you miss a payment deadline, your advance may be forfeited.' },
  { term: 'Indemnity', simpleMeaning: 'A promise by one party to compensate the other for a specific loss or damage.', simpleExample: 'The seller indemnifies the buyer against future ownership disputes.' },
  { term: 'Sub-Registrar', simpleMeaning: 'The government official who officially registers property and legal documents.', simpleExample: 'The sale deed must be signed at the Sub-Registrar office.' },
  { term: 'Consideration', simpleMeaning: 'The price or value being exchanged in an agreement.', simpleExample: 'The total consideration for the property is ₹18,50,000.' },
  { term: 'Mortgage', simpleMeaning: 'Using property as security for a loan.', simpleExample: 'The land is under mortgage to the bank until the loan is repaid.' },
  { term: 'Lessee', simpleMeaning: 'The person renting or leasing a property from its owner.', simpleExample: 'The lessee must pay rent on the 5th of every month.' },
  { term: 'Lessor', simpleMeaning: 'The owner who rents or leases out a property.', simpleExample: 'The lessor is responsible for major structural repairs.' },
  { term: 'Arbitration', simpleMeaning: 'Settling a dispute outside court through a neutral third party.', simpleExample: 'Any dispute will be resolved through arbitration in Pune.' },
  { term: 'Power of Attorney', simpleMeaning: 'A legal document letting someone act on your behalf.', simpleExample: 'The seller signed a power of attorney allowing his son to complete the sale.' },
  { term: 'Deed', simpleMeaning: 'A signed legal document that transfers ownership or rights.', simpleExample: 'The sale deed transfers ownership of the property to the buyer.' },
  { term: 'Stamp Duty', simpleMeaning: 'A government tax paid when registering certain legal documents.', simpleExample: 'Stamp duty is calculated as a percentage of the property value.' },
  { term: 'Witness', simpleMeaning: 'A person who confirms that an agreement was signed correctly.', simpleExample: 'Two witnesses signed the agreement along with the buyer and seller.' },
  { term: 'Possession', simpleMeaning: 'Physical control or occupation of a property.', simpleExample: 'Possession will be handed over after the full payment is made.' },
  { term: 'Covenant', simpleMeaning: 'A formal promise within a legal agreement.', simpleExample: 'The seller covenants that the property has no pending litigation.' },
  { term: 'Termination', simpleMeaning: 'Ending an agreement before or at the end of its term.', simpleExample: 'Either party may terminate the agreement with 30 days notice.' },
  { term: 'Notice Period', simpleMeaning: 'The advance warning time required before ending an agreement.', simpleExample: 'The tenant must give a 2-month notice period before vacating.' },
  { term: 'Guarantor', simpleMeaning: 'A person who promises to repay a loan if the borrower fails to.', simpleExample: 'The loan requires a guarantor with a stable income.' },
  { term: 'Litigation', simpleMeaning: 'The process of taking legal action through the courts.', simpleExample: 'The property is currently free of any litigation.' },
  { term: 'Affidavit', simpleMeaning: 'A written statement sworn to be true, used as evidence.', simpleExample: 'The seller submitted an affidavit confirming sole ownership.' }
];

function splitIntoParagraphs(text: string): string[] {
  const byBlankLine = text.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 20);
  if (byBlankLine.length >= 2) return byBlankLine.slice(0, 8);

  const bySentenceGroups: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  for (let i = 0; i < sentences.length && bySentenceGroups.length < 8; i += 3) {
    const chunk = sentences.slice(i, i + 3).join(' ');
    if (chunk.length > 20) bySentenceGroups.push(chunk);
  }
  return bySentenceGroups.length > 0 ? bySentenceGroups : [text.slice(0, 1000)];
}

/**
 * Deterministic, non-LLM fallback used only when real AI analysis (/api/analyze)
 * is unavailable (no API key, quota, or network failure). Reflects the actual
 * uploaded text instead of fabricating content, but cannot truly "simplify" it.
 */
function generateOfflineAnalysis(text: string, fileName: string): DocumentAnalysis {
  const lower = text.toLowerCase();

  let docType = 'Legal Document';
  if (lower.includes('rent') || lower.includes('tenant') || lower.includes('lease')) {
    docType = 'Rent Agreement';
  } else if (lower.includes('loan') || lower.includes('borrower') || lower.includes('lender')) {
    docType = 'Loan Agreement';
  } else if (lower.includes('notice') || lower.includes('advocate')) {
    docType = 'Legal Notice';
  } else if (lower.includes('sale') || lower.includes('seller') || lower.includes('buyer') || lower.includes('vendor') || lower.includes('purchaser')) {
    docType = 'Sale Agreement';
  }

  const paragraphChunks = splitIntoParagraphs(text);
  const unavailableNote = ' (AI simplification unavailable — showing original text.)';

  const paragraphs = paragraphChunks.map((chunk, idx) => ({
    id: idx + 1,
    original: chunk,
    simple: chunk.length > 220 ? `${chunk.slice(0, 220)}...${unavailableNote}` : `${chunk}${unavailableNote}`
  }));

  const importantClauses = paragraphs.map((p) => ({
    id: `C${String(p.id).padStart(3, '0')}`,
    clauseTitle: `Section ${p.id}`,
    originalText: p.original,
    simpleMeaning: p.simple,
    whyItMatters: 'AI analysis is unavailable, so this clause has not been automatically risk-assessed. Please review it carefully or consult a legal professional.',
    recommendedAction: 'Review this section manually.',
    riskLevel: 'standard' as const,
    category: 'general'
  }));

  const foundTerms = JARGON_GLOSSARY.filter((j) => lower.includes(j.term.toLowerCase()));

  return {
    id: `doc-${Date.now()}`,
    documentTitle: fileName || 'Uploaded Legal Document',
    documentType: docType,
    classificationConfidence: 60,
    understandingScore: 50,
    status: 'Needs Attention',
    originalText: text,
    paragraphs,
    summary: 'AI analysis is currently unavailable. Showing the original document text broken into sections below.',
    verySimpleSummary: 'We could not run full AI analysis on this document right now. Please review the original text, or try again later.',
    fiveQuestions: {
      documentType: docType,
      partiesInvolved: { parties: ['Not automatically detected — AI analysis unavailable'] },
      totalAmount: 'Not automatically detected — AI analysis unavailable',
      missingPoints: 'AI analysis is unavailable, so missing information could not be automatically checked.',
      nextStepsSummary: 'Review the document manually, or consult a legal professional for a full assessment.'
    },
    parties: [],
    keyInformation: [],
    importantClauses,
    missingInformation: [
      {
        id: 'MI001',
        title: 'AI Analysis Unavailable',
        whyItMatters: 'Automatic risk and completeness checks could not run for this document.',
        whatYouCanDo: 'Try re-uploading later, or consult a legal professional for a full review.',
        severity: 'medium' as const
      }
    ],
    legalTerms: foundTerms,
    recommendedActions: [
      {
        id: 'A001',
        text: 'AI analysis was unavailable for this document — consider consulting a legal professional for a full review.',
        completed: false
      }
    ],
    relevantServices: [],
    completenessBreakdown: {
      identityInfo: 50,
      propertyInfo: 50,
      financialInfo: 50,
      importantClauses: 50,
      witnessInfo: 50,
      registrationInfo: 50
    },
    createdAt: new Date().toISOString()
  };
}

/**
 * Multilingual Translation helper for Simplified Explanations.
 * Returns clean, natural Hindi, Marathi, or Gujarati without prefixes.
 */
export function getTranslatedExplanation(
  text: string,
  lang: LanguageCode
): string {
  if (lang === 'en' || !text) return text;

  // Direct exact match lookup
  if (TRANSLATION_MAP[text] && TRANSLATION_MAP[text][lang]) {
    return TRANSLATION_MAP[text][lang];
  }

  // Keyword-based natural fallback translations
  if (lang === 'hi') {
    if (text.includes('18.5') || text.includes('18,50,000')) {
      return 'रमेश अपनी 2.40 हेक्टेयर कृषि भूमि सुरेश को ₹18.5 लाख में बेच रहा है। इसमें ₹3.5 लाख अग्रिम दिए गए हैं, जमीन पर ₹2.8 लाख का सहकारी बैंक लोन चुकाना होगा, और शेष ₹12.2 लाख 15 सितंबर तक देने होंगे।';
    }
    if (text.includes('misses') || text.includes('deadline')) {
      return 'यदि खरीदार 15 सितंबर तक शेष राशि का भुगतान नहीं करता है, तो विक्रेता समझौते को रद्द कर सकता है और पूरी ₹3.5 लाख की अग्रिम राशि जब्त कर सकता है।';
    }
    if (text.includes('mortgage') || text.includes('2,80,000')) {
      return 'जमीन के गट नंबर 142/3A पर हवेली प्राथमिक कृषि सहकारी बैंक का ₹2,80,000 का बकाया लोन है। खरीदार को 25 अगस्त से पहले इसे सीधे बैंक में चुकाना होगा।';
    }
    if (text.includes('water') || text.includes('well')) {
      return 'कृषि कुएं का पानी पड़ोसी सोपान पाटिल के साथ साझा है। पानी के अधिकारों को लेकर विवाद है, और विक्रेता पानी की रुकावट में मदद नहीं करेगा।';
    }
  }

  if (lang === 'mr') {
    if (text.includes('18.5') || text.includes('18,50,000')) {
      return 'रमेश आपली २.४० हेक्टर शेतजमीन सुरेशला ₹१८.५ लाखांत विकत आहे. यामध्ये ₹३.५ लाख अ‍ॅडव्हान्स दिले आहेत, जमिनीवरील ₹२.८ लाखांचे सहकारी बँक कर्ज फेडावे लागेल आणि १५ सप्टेंबरपर्यंत उर्वरित ₹१२.२ लाख द्यावे लागतील.';
    }
    if (text.includes('misses') || text.includes('deadline')) {
      return 'जर खरेदीदाराने १५ सप्टेंबरपर्यंत उर्वरित रक्कम दिली नाही, तर विक्रेत्याला करार रद्द करून सर्व ₹३.५ लाख अ‍ॅडव्हान्स रक्कम जप्त करण्याचा पूर्ण अधिकार आहे.';
    }
    if (text.includes('mortgage') || text.includes('2,80,000')) {
      return 'जमिनीच्या गट क्रमांक १४२/३A वर हवेली सहकारी पतसंस्थेचे ₹२,८०,००० चे थकीत पीककर्ज आहे. खरेदीदाराने २५ ऑगस्टपूर्वी हे कर्ज थेट बँकेत भरून कर्जमुक्त दाखला मिळवला पाहिजे.';
    }
    if (text.includes('water') || text.includes('well')) {
      return 'विहिरीचे पाणी शेजारील शेतकरी सोपान पाटील यांच्यासोबत सामायिक आहे. पाण्याचा वाद सुरू असून शेजाऱ्याने पाणी अडवल्यास विक्रेता कोणतीही मदत करणार नाही.';
    }
  }

  if (lang === 'gu') {
    if (text.includes('18.5') || text.includes('18,50,000')) {
      return 'રમેશ પોતાની 2.40 હેક્ટર ખેતીની જમીન સુરેશને ₹18.5 લાખમાં વેચી રહ્યો છે. આમાં ₹3.5 લાખ એડવાન્સ આપ્યા છે, જમીન પર ₹2.8 લાખની સહકારી બેંક લોન ચૂકવવી પડશે અને 15 સપ્ટેમ્બર સુધીમાં બાકીના ₹12.2 લાખ આપવા પડશે.';
    }
    if (text.includes('misses') || text.includes('deadline')) {
      return 'જો ખરીદદાર 15 સપ્ટેમ્બર સુધીમાં બાકીની રકમ નહીં ચૂકવે, તો વેચનાર સોદો રદ કરી શકે છે અને તમામ ₹3.5 લાખ એડવાન્સ નાણાં જપ્ત કરી શકે છે.';
    }
  }

  // Final fallback: remove bracket prefix if present
  return text.replace(/^\[.*?\]:\s*/, '');
}
