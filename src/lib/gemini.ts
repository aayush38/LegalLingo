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

const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGeminiOnce(prompt: string, temperature: number, json: boolean): Promise<string> {
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
    // Propagate Gemini's real status so callers (e.g. retry logic) can tell a
    // rate limit (429) apart from a permanent failure (e.g. 400 bad request).
    throw new GeminiRequestError('AI request failed', geminiRes.status);
  }

  const geminiData = await geminiRes.json();
  const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    console.error('[gemini] returned no content:', JSON.stringify(geminiData).slice(0, 500));
    throw new GeminiRequestError('AI returned no content', 502);
  }

  return rawText;
}

/**
 * Calls Gemini's generateContent REST API directly (no SDK dependency) and
 * returns the raw text of the first candidate. Throws GeminiRequestError on
 * any failure (missing key, HTTP error, empty response) so callers can map
 * it to an appropriate API response.
 *
 * With maxRetries > 0, retries on transient failures (429/502/503/504) with
 * exponential backoff (1s, 2s, 4s, ... + jitter). Non-retryable errors (e.g.
 * a 400 from a malformed request) fail immediately regardless of maxRetries.
 */
export async function callGemini(
  prompt: string,
  temperature = 0.2,
  json = true,
  options?: { maxRetries?: number }
): Promise<string> {
  const maxRetries = options?.maxRetries ?? 0;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await callGeminiOnce(prompt, temperature, json);
    } catch (e) {
      lastError = e;
      const retryable = e instanceof GeminiRequestError && RETRYABLE_STATUSES.has(e.status);
      if (!retryable || attempt === maxRetries) throw e;
      const delay = 1000 * 2 ** attempt + Math.random() * 250;
      console.warn(`[gemini] retryable failure (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms`);
      await sleep(delay);
    }
  }

  throw lastError;
}
