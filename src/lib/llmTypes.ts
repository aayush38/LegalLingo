/**
 * The shared LLM provider contract.
 *
 * Kept separate from `llm.ts` so provider modules (gemini.ts, ollama.ts) can
 * implement the interface without importing the registry that imports them —
 * i.e. this file is the leaf of the dependency graph, breaking what would
 * otherwise be a circular import.
 *
 * Application code should import from `llm.ts`, which re-exports everything
 * here alongside the routing/retry helpers.
 */

export type LLMProviderName = 'gemini' | 'ollama';

export interface LLMCompletionRequest {
  prompt: string;
  /** 0 = deterministic, 1 = creative. Defaults to 0.2. */
  temperature?: number;
  /** Ask the provider for a JSON-only response where it supports a JSON mode. */
  json?: boolean;
  maxOutputTokens?: number;
}

/**
 * The contract every provider module implements. Deliberately minimal — a
 * single text-in/text-out completion — because that is all three endpoints
 * need, and a narrow interface is what makes new providers cheap to add.
 */
export interface LLMProvider {
  readonly name: LLMProviderName;
  /** Model id this provider will use for the current environment. */
  readonly model: string;
  /** True when the environment has everything this provider needs (keys, host). */
  isConfigured(): boolean;
  complete(request: LLMCompletionRequest): Promise<string>;
}

export class LLMError extends Error {
  constructor(
    message: string,
    public status: number,
    public provider?: LLMProviderName,
    /** Set for permanent failures (bad request, missing config) so retry logic skips them. */
    public permanent = false
  ) {
    super(message);
    this.name = 'LLMError';
  }
}
