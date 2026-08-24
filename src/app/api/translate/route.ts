import { NextRequest, NextResponse } from 'next/server';
import { coerceJsonArray, completeJson, LLMError, statusForError } from '@/lib/llm';

const LANGUAGE_NAMES: Record<string, string> = {
  hi: 'Hindi',
  mr: 'Marathi',
  gu: 'Gujarati'
};

const MAX_STRINGS = 200;
const TRANSLATE_RETRIES = 1;
const TRANSLATE_JSON_ATTEMPTS = 3;

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

    // The response is requested as an OBJECT wrapping the array, not a bare
    // array: Ollama's JSON mode can only emit a top-level object, so asking for
    // a bare array makes the endpoint unusable on that provider. Gemini handles
    // the object form equally well, so one prompt serves both.
    const prompt = `Translate each string in this JSON array from English to ${languageName}, for Indian citizens reading a legal document explanation app.

Return ONLY a JSON object of the form {"translations": [...]}, where "translations" is an array of ${inputStrings.length} strings — the translations, in the same order as the input.

Rules:
- Keep numbers, currency amounts, dates, proper nouns (people/place/organization names), and URLs unchanged.
- Keep the tone simple and plain-language, suitable for a citizen with no legal background.
- Do not add, remove, or merge array items — the output array length must exactly match the input (${inputStrings.length} items).
- Do not translate an item if it is already in ${languageName}; return it unchanged instead.
- Use only ${languageName} script characters — do not mix in characters from other Indic scripts.

Input:
${JSON.stringify(inputStrings)}`;

    // The length check is a validator rather than a post-hoc rejection: when the
    // model drops or merges an item, completeJson re-prompts with that exact
    // complaint instead of failing the whole request.
    const parsed = await completeJson<unknown>(
      { prompt, temperature: 0.1, json: true },
      {
        label: 'api/translate',
        maxRetries: TRANSLATE_RETRIES,
        maxJsonAttempts: TRANSLATE_JSON_ATTEMPTS,
        validate: (value) => {
          const arr = coerceJsonArray(value, 'translations');
          if (!arr) return 'the response must be a JSON object of the form {"translations": ["...", "..."]}';
          if (arr.length !== inputStrings.length) {
            return `"translations" had ${arr.length} items but must have exactly ${inputStrings.length}, one per input string, in the same order`;
          }
          if (!arr.every((v) => typeof v === 'string')) return 'every item in "translations" must be a string';
          return true;
        }
      }
    );

    // Non-null: the validator above already guaranteed the shape.
    const translations = coerceJsonArray(parsed, 'translations') as string[];

    return NextResponse.json({ translations });
  } catch (e) {
    if (e instanceof LLMError) {
      console.error('[api/translate] LLM failure:', e.message);
      return NextResponse.json({ error: e.message }, { status: statusForError(e) });
    }
    console.error('[api/translate] Unexpected error:', e);
    return NextResponse.json({ error: 'Unexpected error during translation' }, { status: 500 });
  }
}
