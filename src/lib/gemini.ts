/**
 * Gemini provider module.
 *
 * Implements the shared LLMProvider contract (see llmTypes.ts). Application
 * code must not import this file directly — go through `llm.ts` so provider
 * selection stays configurable.
 */

import { LLMError, type LLMCompletionRequest, type LLMProvider } from './llmTypes';

export const DEFAULT_GEMINI_MODEL = 'gemini-flash-lite-latest';

function geminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

/** Permanent client errors — retrying these just burns quota. */
const PERMANENT_STATUSES = new Set([400, 401, 403, 404]);

export const geminiProvider: LLMProvider = {
  name: 'gemini',

  get model() {
    return geminiModel();
  },

  isConfigured() {
    return Boolean(process.env.GEMINI_API_KEY);
  },

  async complete(request: LLMCompletionRequest): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new LLMError('Gemini is not configured (GEMINI_API_KEY missing)', 503, 'gemini', true);
    }

    const model = geminiModel();
    const { prompt, temperature = 0.2, json = false, maxOutputTokens } = request;

    let res: Response;
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature,
              ...(json ? { responseMimeType: 'application/json' } : {}),
              ...(maxOutputTokens ? { maxOutputTokens } : {})
            }
          })
        }
      );
    } catch (e) {
      // Network-level failure — status 0 marks it retryable in llm.ts.
      throw new LLMError(
        `Could not reach Gemini: ${e instanceof Error ? e.message : 'network error'}`,
        0,
        'gemini'
      );
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('[gemini] request failed:', res.status, errText.slice(0, 500));
      // Propagate Gemini's real status so retry logic can tell a rate limit
      // (429) apart from a permanent failure (e.g. 400 bad request).
      throw new LLMError('AI request failed', res.status, 'gemini', PERMANENT_STATUSES.has(res.status));
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      console.error('[gemini] returned no content:', JSON.stringify(data).slice(0, 500));
      throw new LLMError('AI returned no content', 502, 'gemini');
    }

    return rawText;
  }
};
