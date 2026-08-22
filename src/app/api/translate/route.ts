import { NextRequest, NextResponse } from 'next/server';
import { callGemini, parseGeminiJson, GeminiRequestError } from '@/lib/gemini';

const LANGUAGE_NAMES: Record<string, string> = {
  hi: 'Hindi',
  mr: 'Marathi',
  gu: 'Gujarati'
};

const MAX_STRINGS = 200;

export async function POST(req: NextRequest) {
  try {
    const { strings, targetLanguage } = await req.json();

    if (!Array.isArray(strings) || strings.length === 0) {
      return NextResponse.json({ error: 'No strings provided' }, { status: 400 });
    }
    const languageName = LANGUAGE_NAMES[targetLanguage];
    if (!languageName) {
      return NextResponse.json({ error: 'Unsupported target language' }, { status: 400 });
    }

    const inputStrings: string[] = strings.slice(0, MAX_STRINGS).map((s) => String(s));

    const prompt = `Translate each string in this JSON array from English to ${languageName}, for Indian citizens reading a legal document explanation app.

Return ONLY a JSON array of the same length, in the same order, containing the translated strings.

Rules:
- Keep numbers, currency amounts, dates, proper nouns (people/place/organization names), and URLs unchanged.
- Keep the tone simple and plain-language, suitable for a citizen with no legal background.
- Do not add, remove, or merge array items — the output array length must exactly match the input.
- Do not translate an item if it is already in ${languageName}; return it unchanged instead.

Input:
${JSON.stringify(inputStrings)}`;

    const rawText = await callGemini(prompt, 0.1);

    let translations: unknown;
    try {
      translations = parseGeminiJson(rawText);
    } catch (e) {
      console.error('[api/translate] Failed to parse Gemini JSON output:', e, rawText.slice(0, 500));
      return NextResponse.json({ error: 'Translation returned malformed data' }, { status: 502 });
    }

    if (!Array.isArray(translations) || translations.length !== inputStrings.length) {
      console.error('[api/translate] Translation array length mismatch:', Array.isArray(translations) ? translations.length : typeof translations);
      return NextResponse.json({ error: 'Translation returned mismatched data' }, { status: 502 });
    }

    return NextResponse.json({ translations });
  } catch (e) {
    if (e instanceof GeminiRequestError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('[api/translate] Unexpected error:', e);
    return NextResponse.json({ error: 'Unexpected error during translation' }, { status: 500 });
  }
}
