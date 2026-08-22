export const GEMINI_MODEL = 'gemini-flash-lite-latest';

/**
 * Escapes backslashes that aren't part of a valid JSON escape sequence
 * (\" \\ \/ \b \f \n \r \t \uXXXX). Gemini occasionally emits a literal
 * backslash inside a string value that breaks JSON.parse otherwise.
 */
export function sanitizeJsonEscapes(raw: string): string {
  return raw.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, '\\\\');
}

/** Parses Gemini's JSON output, retrying once with sanitized escapes on failure. */
export function parseGeminiJson<T = unknown>(rawText: string): T {
  try {
    return JSON.parse(rawText) as T;
  } catch {
    return JSON.parse(sanitizeJsonEscapes(rawText)) as T;
  }
}

export class GeminiRequestError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'GeminiRequestError';
  }
}

/**
 * Calls Gemini's generateContent REST API directly (no SDK dependency) and
 * returns the raw text of the first candidate. Throws GeminiRequestError on
 * any failure (missing key, HTTP error, empty response) so callers can map
 * it to an appropriate API response.
 */
export async function callGemini(prompt: string, temperature = 0.2, json = true): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiRequestError('AI analysis is not configured', 503);
  }

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          ...(json ? { responseMimeType: 'application/json' } : {})
        }
      })
    }
  );

  if (!geminiRes.ok) {
    const errText = await geminiRes.text().catch(() => '');
    console.error('[gemini] request failed:', geminiRes.status, errText);
    throw new GeminiRequestError('AI request failed', 502);
  }

  const geminiData = await geminiRes.json();
  const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    console.error('[gemini] returned no content:', JSON.stringify(geminiData).slice(0, 500));
    throw new GeminiRequestError('AI returned no content', 502);
  }

  return rawText;
}
