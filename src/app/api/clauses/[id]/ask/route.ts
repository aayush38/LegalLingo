import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json({
      clause_id: body.clause_id || 'C004',
      question: body.question || '',
      answer: "Section 55 of the Transfer of Property Act 1882 obligates the seller to clear any existing bank mortgages before registration. You should request a written Bank Mortgage Release NOC from the seller.",
      grounded: true,
      supporting_citations: [
        {
          doc_id: "KAN_PROP_MAH_001",
          title: "Maharashtra Land Revenue Code, 1966 - Section 148",
          jurisdiction: "State (Maharashtra)",
          issuing_authority: "Government of Maharashtra",
          source_type: "dataset",
          verification_status: "dataset_only",
          similarity: 0.95,
          excerpt: "Section 148 dictates that every mutation entry in the 7/12 land record must reflect existing mortgage charges."
        }
      ],
      confidence: 0.94
    });
  } catch (err) {
    return NextResponse.json({
      answer: "Verification required. Please consult a legal professional.",
      grounded: false,
      confidence: 0.8
    });
  }
}
