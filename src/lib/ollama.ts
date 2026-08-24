/**
 * Ollama provider module — talks to a local (or self-hosted) Ollama instance,
 * which is how this app runs Llama-family models.
 *
 * Implements the shared LLMProvider contract (see llmTypes.ts). Application
 * code must not import this file directly — go through `llm.ts`.
 *
 * Configuration:
 *   OLLAMA_BASE_URL   default http://127.0.0.1:11434
 *   OLLAMA_MODEL      default llama3.1  (any pulled model: llama3.2, mistral, ...)
 *   OLLAMA_TIMEOUT_MS default 120000 — local generation is much slower than a
 *                     hosted API, and Next.js gives fetch no timeout by default.
 */

import { LLMError, type LLMCompletionRequest, type LLMProvider } from './llmTypes';

export const DEFAULT_OLLAMA_BASE_URL = 'http://127.0.0.1:11434';
export const DEFAULT_OLLAMA_MODEL = 'llama3.1';
const DEFAULT_TIMEOUT_MS = 120_000;

function baseUrl(): string {
  return (process.env.OLLAMA_BASE_URL?.trim() || DEFAULT_OLLAMA_BASE_URL).replace(/\/+$/, '');
}

function ollamaModel(): string {
  return process.env.OLLAMA_MODEL?.trim() || DEFAULT_OLLAMA_MODEL;
}

function timeoutMs(): number {
  const raw = Number(process.env.OLLAMA_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TIMEOUT_MS;
}

export const ollamaProvider: LLMProvider = {
  name: 'ollama',

  get model() {
    return ollamaModel();
  },

  /**
   * Ollama needs no API key, so "configured" means the operator explicitly
   * opted in by setting a host or model. Without that signal, auto-detection
   * would silently route to a localhost port that probably isn't listening.
   */
  isConfigured() {
    return Boolean(process.env.OLLAMA_BASE_URL || process.env.OLLAMA_MODEL);
  },

  async complete(request: LLMCompletionRequest): Promise<string> {
    const { prompt, temperature = 0.2, json = false, maxOutputTokens } = request;
    const url = `${baseUrl()}/api/generate`;

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(timeoutMs()),
        body: JSON.stringify({
          model: ollamaModel(),
          prompt,
          stream: false,
          // Ollama's structured-output mode; equivalent to Gemini's responseMimeType.
          ...(json ? { format: 'json' } : {}),
          options: {
            temperature,
            ...(maxOutputTokens ? { num_predict: maxOutputTokens } : {})
          }
        })
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'network error';
      const isTimeout = e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError');
      throw new LLMError(
        isTimeout
          ? `Ollama timed out after ${timeoutMs()}ms at ${url}`
          : `Could not reach Ollama at ${url}: ${message}`,
        isTimeout ? 504 : 0,
        'ollama'
      );
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('[ollama] request failed:', res.status, errText.slice(0, 500));
      // A 404 here almost always means the model isn't pulled — permanent until
      // someone runs `ollama pull <model>`, so don't burn retries on it.
      const permanent = res.status === 404 || res.status === 400;
      const message =
        res.status === 404
          ? `Ollama model "${ollamaModel()}" not found — run: ollama pull ${ollamaModel()}`
          : 'AI request failed';
      throw new LLMError(message, res.status, 'ollama', permanent);
    }

    const data = await res.json();
    const rawText: unknown = data?.response;

    if (typeof rawText !== 'string' || !rawText.trim()) {
      console.error('[ollama] returned no content:', JSON.stringify(data).slice(0, 500));
      throw new LLMError('AI returned no content', 502, 'ollama');
    }

    return rawText;
  }
};
