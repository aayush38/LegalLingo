import { NextRequest, NextResponse } from 'next/server';
import { getRelevantServicesForDocType } from '@/lib/govtServices';
import { callGemini, parseGeminiJson, GeminiRequestError } from '@/lib/gemini';

const ANALYSIS_JSON_SCHEMA = `{
  "documentType": "string - the actual type of this document, e.g. Sale Agreement, Rent Agreement, Loan Agreement, Legal Notice, Affidavit, Will, Power of Attorney, etc. Detect it from the text, do not assume.",
  "classificationConfidence": "number 0-100",
  "understandingScore": "number 0-100, how complete/clear this document is for a citizen to understand",
  "status": "'Needs Attention' | 'Looks Standard' | 'High Risk'",
  "summary": "string - 1-2 sentence factual summary of the document",
  "verySimpleSummary": "string - 2-4 sentence plain-language summary a layperson can understand",
  "extraSimpleSummary": "string - an even shorter, extremely simple 1-2 sentence version",
  "paragraphs": [ { "id": "number starting at 1", "original": "string - the actual original paragraph/section text from the document", "simple": "string - plain language explanation of that paragraph" } ],
  "importantClauses": [ { "id": "string like C001", "clauseTitle": "string", "originalText": "string - actual clause text from the document", "simpleMeaning": "string", "whyItMatters": "string", "recommendedAction": "string", "riskLevel": "'high' | 'review' | 'standard'", "category": "string" } ],
  "missingInformation": [ { "id": "string", "title": "string", "whyItMatters": "string", "whatYouCanDo": "string", "severity": "'high' | 'medium' | 'low'" } ],
  "legalTerms": [ { "term": "string - a difficult/legal word that actually appears in the document", "simpleMeaning": "string", "simpleExample": "string" } ],
  "recommendedActions": [ { "id": "string", "text": "string", "completed": false } ],
  "fiveQuestions": {
    "documentType": "string",
    "partiesInvolved": {
      "seller": "string, only if this is a sale-type document, else omit",
      "buyer": "string, only if this is a sale-type document, else omit",
      "tenant": "string, only if this is a rent/lease-type document, else omit",
      "landlord": "string, only if this is a rent/lease-type document, else omit",
      "parties": "string[] - use this generic list instead if the document type doesn't fit seller/buyer or tenant/landlord roles"
    },
    "totalAmount": "string - key monetary figure(s) in the document, or 'Not specified' if none",
    "missingPoints": "string - key missing/unclear information a citizen should know about",
    "nextStepsSummary": "string - short numbered plain-language next steps"
  },
  "completenessBreakdown": { "identityInfo": "0-100", "propertyInfo": "0-100", "financialInfo": "0-100", "importantClauses": "0-100", "witnessInfo": "0-100", "registrationInfo": "0-100" }
}`;

export async function POST(req: NextRequest) {
  try {
    const { text, fileName } = await req.json();

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'No document text provided' }, { status: 400 });
    }

    const prompt = `You are LegalLingo, an AI assistant that helps Indian citizens understand legal and civic documents in plain language.

Analyze the following document text (from a file named "${fileName || 'Uploaded Document'}") and return ONLY a valid JSON object matching exactly this structure:

${ANALYSIS_JSON_SCHEMA}

Rules:
- Base everything strictly on the actual document text below. Do not invent names, amounts, or clauses that are not present.
- Detect the real document type instead of assuming it is a property sale agreement.
- Write all explanations in simple, plain English suitable for a citizen with no legal background.
- Produce between 3 and 10 items in "paragraphs" and "importantClauses" covering the substantive parts of the document.
- Only include terms in "legalTerms" that actually appear in the document text.

Document Text:
"""
${text.slice(0, 12000)}
"""`;

    const rawText = await callGemini(prompt);

    let parsed: Record<string, unknown>;
    try {
      parsed = parseGeminiJson(rawText);
    } catch (e2) {
      console.error('[api/analyze] Failed to parse Gemini JSON output:', e2, rawText.slice(0, 500));
      return NextResponse.json({ error: 'AI analysis returned malformed data' }, { status: 502 });
    }

    const documentType = typeof parsed.documentType === 'string' ? parsed.documentType : 'Legal Document';

    return NextResponse.json({
      ...parsed,
      relevantServices: getRelevantServicesForDocType(documentType)
    });
  } catch (e) {
    if (e instanceof GeminiRequestError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('[api/analyze] Unexpected error:', e);
    return NextResponse.json({ error: 'Unexpected error during AI analysis' }, { status: 500 });
  }
}
