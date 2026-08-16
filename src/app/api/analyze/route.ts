import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, fileName } = await req.json();
    const apiKey = process.env.AI_API_KEY || process.env.NEXT_PUBLIC_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'AI API Key not configured' }, { status: 400 });
    }

    // Call LLM API (OpenAI / Anthropic compatible endpoint)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are LegalLingo, an AI-assisted legal document understanding tool for Indian citizens.
Your task is to explain uploaded documents in plain language.
You must:
- distinguish information contained in the document from your interpretation
- never fabricate missing information
- clearly flag uncertainty
- identify potentially important clauses without declaring a document legally valid or invalid
- use simple language suitable for non-lawyers
- avoid giving definitive legal advice
- recommend professional legal review when material legal consequences exist
- preserve monetary amounts, dates and names accurately
- return valid JSON matching the schema.`
          },
          {
            role: 'user',
            content: `Analyze this document text:\n\n${text}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`LLM API returned status ${response.status}`);
    }

    const data = await response.json();
    const parsed = JSON.parse(data.choices[0].message.content);
    return NextResponse.json(parsed);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
