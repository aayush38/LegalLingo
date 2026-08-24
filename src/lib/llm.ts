/**
 * LLM provider abstraction layer.
 *
 * Every LLM call in the app goes through this module — endpoint handlers never
 * import a provider (gemini.ts / ollama.ts) directly. That keeps provider
 * selection, retry/backoff, and JSON validation in exactly one place, and makes
 * swapping or A/B-testing a backend a config change rather than a code change.
 *
 * Provider selection order:
 *   1. explicit `provider` option on the call
 *   2. LLM_PROVIDER env var
 *   3. first provider that reports itself configured (gemini, then ollama)
 */

import { geminiProvider } from './gemini';
import { ollamaProvider } from './ollama';
import { LLMError, type LLMCompletionRequest, type LLMProvider, type LLMProviderName } from './llmTypes';

export { LLMError };
export type { LLMCompletionRequest, LLMProvider, LLMProviderName };

/** Transient conditions worth retrying: rate limits, overloaded/unavailable upstreams. */
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

export function isRetryableError(e: unknown): boolean {
  if (e instanceof LLMError) {
    if (e.permanent) return false;
    // status 0 = network/fetch failure (provider unreachable) — worth a retry.
    return e.status === 0 || RETRYABLE_STATUSES.has(e.status);
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Provider registry -----------------------------------------------------

const PROVIDERS: Record<LLMProviderName, LLMProvider> = {
  gemini: geminiProvider,
  ollama: ollamaProvider
};

const PROVIDER_PREFERENCE: LLMProviderName[] = ['gemini', 'ollama'];

function isProviderName(value: unknown): value is LLMProviderName {
  return typeof value === 'string' && value in PROVIDERS;
}

export function getProvider(name: LLMProviderName): LLMProvider {
  return PROVIDERS[name];
}

export function listProviders(): { name: LLMProviderName; model: string; configured: boolean }[] {
  return PROVIDER_PREFERENCE.map((name) => ({
    name,
    model: PROVIDERS[name].model,
    configured: PROVIDERS[name].isConfigured()
  }));
}

/**
 * Resolves which provider handles a call. Env is read on every call rather than
 * cached at module load so a provider switch doesn't require a server restart.
 */
export function resolveProvider(override?: LLMProviderName): LLMProvider {
  if (override) return PROVIDERS[override];

  const configured = process.env.LLM_PROVIDER?.trim().toLowerCase();
  if (isProviderName(configured)) return PROVIDERS[configured];
  if (configured) {
    console.warn(`[llm] Unknown LLM_PROVIDER "${configured}" — falling back to auto-detection.`);
  }

  const available = PROVIDER_PREFERENCE.find((name) => PROVIDERS[name].isConfigured());
  return PROVIDERS[available ?? 'gemini'];
}

/** Optional secondary provider used only when the primary fails outright. */
function resolveFallbackProvider(primary: LLMProvider): LLMProvider | null {
  const configured = process.env.LLM_FALLBACK_PROVIDER?.trim().toLowerCase();
  if (!isProviderName(configured)) return null;
  const fallback = PROVIDERS[configured];
  if (fallback.name === primary.name || !fallback.isConfigured()) return null;
  return fallback;
}

// --- Text completion -------------------------------------------------------

export interface LLMCallOptions {
  /** Force a specific provider for this call, ignoring env configuration. */
  provider?: LLMProviderName;
  /** Extra attempts after the first on transient failures. Default 0. */
  maxRetries?: number;
  /** Try LLM_FALLBACK_PROVIDER if the primary exhausts its retries. Default true. */
  allowFallback?: boolean;
  /** Label used in log lines to identify the call site. */
  label?: string;
  /**
   * Called with the provider that actually produced the result — which is not
   * necessarily the configured primary, since a call can be served by the
   * fallback. Callers that report provenance should use this rather than
   * assuming resolveProvider() describes what happened.
   */
  onProviderUsed?: (provider: LLMProvider) => void;
}

/**
 * Runs a completion against the resolved provider, with exponential backoff on
 * transient failures (1s, 2s, 4s + jitter) and an optional cross-provider
 * fallback. Permanent failures (400, missing config) fail immediately.
 */
export async function completeText(
  request: LLMCompletionRequest,
  options: LLMCallOptions = {}
): Promise<string> {
  const { maxRetries = 0, allowFallback = true, label = 'llm', onProviderUsed } = options;
  const primary = resolveProvider(options.provider);

  try {
    const text = await callWithRetries(primary, request, maxRetries, label);
    onProviderUsed?.(primary);
    return text;
  } catch (primaryError) {
    if (!allowFallback) throw primaryError;

    const fallback = resolveFallbackProvider(primary);
    if (!fallback) throw primaryError;

    console.warn(`[${label}] Provider "${primary.name}" failed — retrying on fallback "${fallback.name}".`);
    try {
      const text = await callWithRetries(fallback, request, maxRetries, label);
      onProviderUsed?.(fallback);
      return text;
    } catch {
      // Surface the primary's error: it's the one the operator configured and
      // the one whose status best describes what actually went wrong.
      throw primaryError;
    }
  }
}

async function callWithRetries(
  provider: LLMProvider,
  request: LLMCompletionRequest,
  maxRetries: number,
  label: string
): Promise<string> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await provider.complete(request);
    } catch (e) {
      lastError = e;
      if (!isRetryableError(e) || attempt === maxRetries) throw e;
      const delay = 1000 * 2 ** attempt + Math.random() * 250;
      console.warn(
        `[${label}] ${provider.name} transient failure (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms`
      );
      await sleep(delay);
    }
  }

  throw lastError;
}

// --- JSON parsing, validation and repair -----------------------------------

/**
 * Escapes backslashes that aren't part of a valid JSON escape sequence
 * (\" \\ \/ \b \f \n \r \t \uXXXX). Models occasionally emit a literal
 * backslash inside a string value, which breaks JSON.parse otherwise.
 */
export function sanitizeJsonEscapes(raw: string): string {
  return raw.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, '\\\\');
}

/**
 * Strips markdown code fences and any prose around the JSON body. Providers
 * without a native JSON mode (Ollama with some models) routinely wrap output in
 * ```json fences or add a sentence before it.
 */
export function extractJsonBody(raw: string): string {
  let text = raw.trim();

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) text = fenced[1].trim();

  const firstBrace = text.search(/[[{]/);
  if (firstBrace > 0) text = text.slice(firstBrace);

  const lastBrace = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
  if (lastBrace !== -1 && lastBrace < text.length - 1) text = text.slice(0, lastBrace + 1);

  return text.trim();
}

/** Parses model JSON output, repairing common malformations before giving up. */
export function parseLlmJson<T = unknown>(rawText: string): T {
  const candidates = [rawText, extractJsonBody(rawText), sanitizeJsonEscapes(extractJsonBody(rawText))];

  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

/**
 * Pulls an array out of a model response that may or may not be wrapped in an
 * object.
 *
 * Providers disagree on whether a top-level JSON array is even expressible:
 * Gemini's responseMimeType happily returns one, while Ollama's `format: "json"`
 * constrains generation to a JSON *object*, so a bare array is unreachable
 * there. Rather than push that difference onto every call site, callers ask for
 * an object with a named array property and run the result through this.
 *
 * Accepts, in order: a bare array; `value[key]` when `key` is given; or the
 * single array-valued property of a one-array object. Returns null otherwise.
 */
export function coerceJsonArray(value: unknown, key?: string): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return null;

  const obj = value as Record<string, unknown>;
  if (key && Array.isArray(obj[key])) return obj[key] as unknown[];

  const arrayProps = Object.values(obj).filter(Array.isArray) as unknown[][];
  return arrayProps.length === 1 ? arrayProps[0] : null;
}

/**
 * Returns `true` when the parsed value is acceptable, or a short string
 * describing what is wrong (fed back to the model on the repair attempt).
 */
export type LLMJsonValidator = (value: unknown) => true | string;

export interface LLMJsonOptions extends LLMCallOptions {
  validate?: LLMJsonValidator;
  /**
   * Total attempts at getting valid JSON, including the first. Each retry
   * re-prompts with the previous failure described. Default 3.
   */
  maxJsonAttempts?: number;
}

/**
 * Completion that is guaranteed to return parsed, validated JSON or throw.
 *
 * Two independent retry layers apply: `maxRetries` covers transport failures
 * (handled in completeText), while `maxJsonAttempts` covers a model that
 * responded successfully but with malformed or structurally invalid JSON — the
 * latter re-prompts with the specific problem so the model can correct itself.
 */
export async function completeJson<T = unknown>(
  request: LLMCompletionRequest,
  options: LLMJsonOptions = {}
): Promise<T> {
  const { validate, maxJsonAttempts = 3, label = 'llm', ...callOptions } = options;
  let lastProblem = '';
  let lastError: unknown;

  for (let attempt = 0; attempt < maxJsonAttempts; attempt++) {
    const prompt =
      attempt === 0
        ? request.prompt
        : `${request.prompt}

IMPORTANT: your previous response was rejected because: ${lastProblem}
Respond again with ONLY the corrected, complete JSON. No markdown fences, no commentary, no trailing text.`;

    let rawText: string;
    try {
      rawText = await completeText({ ...request, prompt, json: true }, { ...callOptions, label });
    } catch (e) {
      // Transport failure — completeText already exhausted its own retries.
      throw e;
    }

    let parsed: T;
    try {
      parsed = parseLlmJson<T>(rawText);
    } catch (e) {
      lastError = e;
      lastProblem = `the response was not valid JSON (${e instanceof Error ? e.message : 'parse error'})`;
      console.warn(`[${label}] JSON parse failed on attempt ${attempt + 1}/${maxJsonAttempts}: ${lastProblem}`);
      continue;
    }

    if (validate) {
      const verdict = validate(parsed);
      if (verdict !== true) {
        lastError = new LLMError(`JSON validation failed: ${verdict}`, 502);
        lastProblem = verdict;
        console.warn(`[${label}] JSON validation failed on attempt ${attempt + 1}/${maxJsonAttempts}: ${verdict}`);
        continue;
      }
    }

    return parsed;
  }

  throw lastError instanceof Error
    ? new LLMError(`Model did not return valid JSON after ${maxJsonAttempts} attempts: ${lastError.message}`, 502)
    : new LLMError(`Model did not return valid JSON after ${maxJsonAttempts} attempts`, 502);
}

/** Maps any error into an HTTP status suitable for an API response. */
export function statusForError(e: unknown): number {
  if (e instanceof LLMError) return e.status && e.status !== 0 ? e.status : 502;
  return 500;
}
