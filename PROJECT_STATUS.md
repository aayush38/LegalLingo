# LegalLingo — Project Status & Implementation Notes

This file is a handoff document: what's built, how it works, where the bodies are
buried. It's meant to let another AI session (or a human) pick up this codebase
without re-deriving everything from scratch. Written 2026-08-24.

Also read `AGENTS.md` / `CLAUDE.md` at the repo root before writing Next.js code —
this project pins a Next.js version with breaking API changes from what most
training data assumes; check `node_modules/next/dist/docs/` first.

## What LegalLingo is

A civic-tech app that lets Indian citizens upload a legal document (PDF or photo),
get it explained in plain language in English/Hindi/Marathi/Gujarati, ask an AI
chatbot questions about it, and download a translated PDF summary. Built as a
Next.js 16 App Router app with Gemini (`gemini-flash-lite-latest`) doing all the
actual language understanding.

## Two pipelines exist — only one is real

**The home page (`/`) is the real, working product surface.** Everything below
describes that flow. A second, older pipeline (`backend/` — a Python FastAPI
service, plus the Next.js pages `/upload`, `/processing/[id]`, `/analysis/[id]`)
also exists in the repo but was **explicitly deprioritized** partway through this
project's development and is *not* wired to real analysis or translated. Don't
assume work described here applies there. If someone asks to unify or fix that
path, it needs the same treatment as `/api/analyze` got (see below) — it currently
still does real OCR/extraction and then discards the result in favor of hardcoded
demo data in `backend/app/api/endpoints.py`.

## Primary user flow

```
Home page (src/app/page.tsx)
  → UploadDropzone (src/components/UploadDropzone.tsx)
  → AppContext.processUploadedFile (src/context/AppContext.tsx)
      → processDocumentFile (src/lib/ocr.ts)         — extract text, per page
      → analyzeDocumentText (src/lib/ai.ts)          — POST /api/analyze
  → currentAnalysis (DocumentAnalysis) lands in AppContext
  → Dashboard renders inline on the same page (no navigation):
      DashboardOverview, DocumentReader, FiveQuestionsCard, ClauseRiskAnalysis,
      DocumentHealthScore, DifficultWordsGlossary, MissingInfoSection,
      ActionChecklist, GovtServicesSection
```

There's also "Try Sample Document" (loads a hardcoded fixture,
`src/lib/sampleDocs.ts`, no AI call — useful for UI-only testing without burning
API quota) and a floating chat button that opens `AskLegalLingoChat.tsx`.

## Document analysis pipeline (the core feature)

**Files:** `src/lib/ocr.ts` → `src/lib/documentChunking.ts` →
`src/app/api/analyze/route.ts` → `src/lib/gemini.ts`

This was rewritten from a naive "truncate to 12,000 chars, one Gemini call" design
(which silently dropped most of any document longer than ~3 pages) to a proper
chunked pipeline:

1. **Extraction** (`ocr.ts`): `pdfjs-dist` pulls real text per PDF page (lazy-loaded
   client-side only — importing it eagerly crashes Next.js SSR because it touches
   `DOMMatrix`, a browser-only global). If a page has no text layer (scanned PDF),
   falls back to rendering the page to a canvas and running Tesseract.js OCR on it,
   still per-page. Images (JPG/PNG) go straight through Tesseract. Returns both a
   flat `text` string and a `pages: {pageNumber, text}[]` array.
2. **Section detection** (`documentChunking.ts::splitIntoSections`): splits each
   page's text at numbered-heading boundaries (`/^\s*\d+(\.\d+)*\.?\s+\S/m` —
   matches "1. DEFINITIONS", "6.5 Travel...") since that's the dominant structure
   in Indian legal drafting. Falls back to blank-line paragraph splitting for
   pages with no headings (affidavits, prose notices).
3. **Chunk assembly** (`buildChunks`): greedily packs sections into ~8000-char
   chunks in document order, tagging each chunk with its page range. A single
   section bigger than the budget (one huge clause) gets split into overlapping
   7000-char windows rather than hard-truncated.
4. **Chunk extraction**: each chunk gets its own LLM call (concurrency-limited
   to 3 at a time, `mapWithConcurrency` in `route.ts`, retried up to 2x with
   exponential backoff via `llm.ts::completeJson`, plus up to 2 JSON-repair
   re-prompts validated by `validateChunkExtraction`), extracting
   paragraphs/clauses/missing-info/legal-terms *for that chunk only*, each item
   tagged with a page number via an inline `[[PAGE N]]` marker the prompt asks
   the model to echo back. Chunks never span two uploaded files.
5. **Merge**: chunk results are concatenated in order, then deduped
   (`dedupeItems` — normalizes text, drops near-duplicates from chunk-boundary
   overlap) and given sequential IDs.
6. **Synthesis**: one final LLM call over the chunk summaries (not raw text
   again) produces document-level fields — type, summary, five-questions,
   completeness breakdown, recommended actions.
7. Response includes `analysisMeta: {fullyAnalyzed, totalPages, totalFiles,
   files[], totalChunks, chunksSucceeded, chunksFailed, warnings, llmCalls,
   provider, model, totalMs}` — an honest
   signal of whether the whole document was actually covered, not just a silent
   best-effort. If any chunk fails after retries, `fullyAnalyzed: false` and the
   failed page range is named in `warnings`, but everything that *did* succeed is
   still returned.

**Measured on a real 10-page/38-clause test contract:** 2 chunks, 3 Gemini calls,
~15s, all 38 sections captured (was 3 before the rewrite), `fullyAnalyzed: true`.

**Known limitation:** when the overlap-split path engages (a single clause >8000
chars), the two overlapping windows show up as two adjacent paragraph cards
rather than being re-stitched into one seamless paragraph. No content is lost —
it's a presentation nuance, not data loss.

## AI integration — provider abstraction layer

**Every LLM call goes through `src/lib/llm.ts`. No route imports a provider
module directly.** This was a deliberate de-risking of vendor lock-in; keep it
that way when adding features.

```
route handler  ->  llm.ts  ->  llmTypes.ts (contract)
                     |
                     +-->  gemini.ts   (geminiProvider)
                     +-->  ollama.ts   (ollamaProvider — Llama-family, local)
```

`llmTypes.ts` holds the `LLMProvider` interface and `LLMError` and imports
nothing. That exists purely to break the cycle that would otherwise form
(`llm.ts` imports the providers, providers need the interface). Do not move
those types back into `llm.ts`.

### Public API of `llm.ts`

- `completeText(request, options)` — plain text completion.
- `completeJson<T>(request, options)` — completion that returns parsed,
  **validated** JSON or throws.
- `resolveProvider(override?)` / `listProviders()` — which backend will serve.
- `parseLlmJson`, `extractJsonBody`, `sanitizeJsonEscapes`, `coerceJsonArray` —
  JSON repair helpers.
- `statusForError(e)` — maps an error to an HTTP status for the response.

### Provider selection

Resolved per call, reading env every time (so switching needs no code change,
and in production no restart of the module):

1. explicit `options.provider`
2. `LLM_PROVIDER` env (`gemini` | `ollama`)
3. first provider reporting `isConfigured()` — gemini, then ollama

`LLM_FALLBACK_PROVIDER` names an optional secondary tried only when the primary
fails outright. Verified working: with `LLM_PROVIDER=ollama` pointed at a dead
port and `LLM_FALLBACK_PROVIDER=gemini`, all three endpoints still return 200.

### Two independent retry layers — don't conflate them

- **`maxRetries`** — transport failures. Exponential backoff (1s, 2s, 4s +
  jitter) on retryable statuses (408/429/500/502/503/504) and on network errors
  (status `0`). Permanent failures (400/401/403/404, missing API key) are marked
  `permanent` on `LLMError` and fail immediately without burning quota.
- **`maxJsonAttempts`** (default 3) — the model answered fine but the JSON was
  malformed or structurally wrong. Re-prompts with the *specific* complaint
  appended ("your previous response was rejected because: ..."), which is what
  lets a weaker model self-correct. Supply `validate` to define "structurally
  wrong" for your call site.

`validate` returns `true` or a short human-readable problem string; that string
is what gets fed back to the model. See `validateChunkExtraction` and
`validateSynthesis` in `/api/analyze` for the pattern.

### Provider quirks that shaped the design

- **Ollama's `format: "json"` can only emit a top-level JSON _object_.** A bare
  top-level array is unreachable there. `/api/translate` therefore asks for
  `{"translations": [...]}` rather than a bare array, and unwraps with
  `coerceJsonArray`. Gemini handles the object form equally well, so one prompt
  serves both. **If you add an endpoint that wants an array, do the same.**
- Local models routinely wrap JSON in ```` ```json ```` fences or add a prose
  preamble. `extractJsonBody` strips both before parsing.
- Gemini's JSON mode still occasionally emits an invalid escape;
  `sanitizeJsonEscapes` repairs that case.
- Model names drift. `gemini-1.5-flash` 404s, `gemini-2.5-flash` and
  `gemini-flash-latest` were unavailable/overloaded during testing. Current
  default is `gemini-flash-lite-latest`, overridable with `GEMINI_MODEL`.

### Measured provider comparison (same code, same documents, only env changed)

| | Gemini `flash-lite` | Ollama `llama3.2:3b` (GTX 1650, 4GB) |
|---|---|---|
| 2-page lease analyze | ~8s | ~56-63s |
| multi-file analyze (3 pages) | ~8s | ~78-93s |
| chat reply | ~0.8-1s | ~1-82s (cold load) |
| Hindi translation | correct | **unusable gibberish** |

**Ollama is a working escape hatch, not a drop-in replacement.** The 3B model
handles English clause extraction acceptably but cannot produce Indic-script
translation. Anything larger will not fit this machine's 4GB VRAM and will spill
to CPU. Keep Gemini as the default.

Routes using the layer: `/api/analyze`, `/api/translate`, `/api/chat`.

## Multi-file upload and document combining

The upload input is `multiple`; `MAX_FILES_PER_UPLOAD` (10) caps a batch.

- `ocr.ts / processDocumentFiles(files, onProgress)` extracts each file
  **sequentially** — pdfjs and Tesseract are main-thread CPU-bound, so running
  them concurrently only makes the page janky. Each file gets its own band of
  the progress bar. One file failing does not fail the batch.
- `documentChunking.ts / combineDocuments(docs)` merges files into one logical
  document: pages are **renumbered continuously** across files, and each page
  keeps `sourceFile` plus its original in-file `sourcePage`.
- **`buildChunks` never lets a chunk span two source files.** The in-progress
  chunk is flushed at each file boundary. Mixing two unrelated agreements into
  one excerpt makes the model conflate their parties and amounts, which is worth
  the occasional short chunk. This is the "preserve chunk boundaries"
  requirement — if you touch the chunker, keep it.
- Dedup is **scoped per source file** (`sourceFile::text` fingerprint) for
  paragraphs/clauses/missing-info: two documents can legitimately share a clause
  title, and collapsing across files would hide one document's finding. Glossary
  terms still dedupe globally.
- Result items carry `sourceFile` **only for multi-file uploads**, so
  single-file responses are byte-identical in shape to before.

`analysisMeta` now reports `totalFiles`, a `files[]` array of per-file page
ranges, `llmCalls` (renamed from `geminiCalls` — it is no longer Gemini-specific)
and `provider`/`model` describing **what actually served the request**, which can
differ from what was configured when the fallback engaged.

`/api/analyze` accepts three request shapes, all still supported:
`{documents: [{fileName, pages}]}` (current), `{pages, fileName}`, `{text, fileName}`.

## Deterministic Risk Engine (`src/lib/risk/`)

**The LLM extracts and explains. Our own code decides what deserves attention.**
Severity no longer comes from the model — `importantClauses[].riskLevel` is still
returned for the legacy clause view, but the authoritative findings come from
`riskEngine.findings[]`, and every one is traceable to a `ruleId` plus the
evidence that triggered it.

```
chunk extraction -> merge -> synthesis
   -> normalizeFacts(analysis)      // evidence-carrying fact sheet
   -> runRiskEngine(facts)          // deterministic rule packs
   -> riskEngine { findings, summary, version }
```

The engine is wrapped in try/catch inside `/api/analyze`: a bug in a rule must
never cost the user their whole analysis, so it degrades to "no deterministic
findings" and the rest of the response still returns.

### Vocabulary is a product constraint, not a style choice

Severities are `STANDARD` / `REVIEW` / `HIGH_ATTENTION`. Findings never say a
document is *illegal, invalid, fraudulent, unsafe* or *legally defective* —
there is a test (`never uses prohibited legal-validity wording`) that fails the
build if those words appear in any finding's prose. This is an **attention and
verification engine**, not a legal-validity engine.

### The single most important rule in this module

`normalizeFacts` reads facts from **document text only**:

| Trusted as evidence | NOT evidence |
|---|---|
| `originalText`, `paragraphs[].original`, `importantClauses[].originalText` | `simpleMeaning`, `whyItMatters`, `recommendedAction`, `missingInformation[]` |

The right column is the model's *advice*. A clause whose `recommendedAction`
reads "obtain a bank NOC before paying" would, if treated as document text, make
the engine conclude an NOC exists — inverting the very finding that advice was
warning about. There is a regression test for exactly this. **Do not widen the
fact sources to include commentary fields.**

### Rules implemented (v1)

| Rule ID | Fires when | Severity |
|---|---|---|
| `PROP_MORT_001` | mortgage/encumbrance mentioned | REVIEW |
| `PROP_MORT_002` | mortgage present, **no** release/discharge wording | HIGH_ATTENTION |
| `MISS_PROPERTY_ID_001` | no survey/Gat/flat identifier found | HIGH_ATTENTION on sale, REVIEW otherwise |
| `PROP_ID_CONFLICT_001` | bare parcel used alongside its own sub-division | HIGH_ATTENTION |
| `PAY_FORFEIT_001` | forfeiture consequence found | HIGH_ATTENTION |
| `PAY_DEADLINE_001` | time-bound payment obligation | REVIEW |
| `FIN_RECON_001` | advance + mortgage + balance ≠ consideration | HIGH_ATTENTION |
| `MISS_SELLER_001` / `MISS_BUYER_001` | party not located (sale-type only) | HIGH_ATTENTION |
| `ID_SELLER_CONFLICT_001` / `ID_BUYER_CONFLICT_001` | party named inconsistently | HIGH_ATTENTION (certain) / REVIEW (abbreviation) |
| `MISS_WITNESS_001` | no witness names located | REVIEW |
| `MISS_FIELD_001` | grouped "expected analysis fields" checklist | scales with count |
| `XC_DEADLINE_CONFLICT_001` / `XC_POSSESSION_CONFLICT_001` | exactly two conflicting dates | REVIEW |

### False positives are the failure mode that matters

Real conveyancing prose broke four naive implementations. Each fix is guarded by
a regression test — **read these before "simplifying" the parsers**:

1. **Amounts.** `parseIndianAmount` checks currency-marked numbers *first*.
   Searching for the first number-like token made "Gat No. 142/3A … loan of
   Rs. 2,80,000" parse as **142**. Bare 3-digit numbers are never matched.
2. **Labels.** `amountFromText` searches forward from the label, it does not
   split into sentences. Indian drafting writes "Rs. 18,50,000", and the full
   stop in "Rs." split the label from its own number, so nothing parsed at all —
   which silently made `FIN_RECON_001` unable to fire.
3. **Names.** `namesFromDefinition` only accepts a name from an explicit
   definitional parenthetical ("… (hereinafter the Vendor)"). Harvesting
   capitalised word pairs from any sentence mentioning a role also collected
   "Village Khed", "Taluka Haveli" and "Haveli Primary Agricultural Cooperative
   Credit Society", firing a bogus party conflict on essentially every document.
4. **Dates.** `extractDatesNearPhrase` requires the date to sit close after the
   deadline phrase. Attributing every date in a clause to the deadline turned the
   execution date into a second "payment deadline" and fired a bogus conflict.

Cross-clause checks back off deliberately: three or more distinct dates reads as
a real instalment schedule, and multiple sub-divided parcels (142/3A + 142/3B) is
a normal multi-parcel sale. Silence beats a false positive here.

### Confidence

`HIGH` / `MEDIUM` / `LOW`, engine-assigned — never model-invented percentages.
`resolveConfidence` downgrades one step when `analysisMeta.fullyAnalyzed` is
false, **except** for rules whose evidence is unambiguous positive text (a
forfeiture clause we actually read stays HIGH). Rules that fire on *absence*
never get that override, because absence is only as trustworthy as coverage.

### UI

`RiskEngineFindings.tsx` renders above `ClauseRiskAnalysis`, and returns `null`
when `riskEngine` is absent — so the sample document and any previously saved
analysis fall back to the old clause view with no layout gap. Each card has a
"Why was this flagged?" drawer showing rule id, confidence, detected fields and
page-numbered evidence. `riskEngine` is optional on `DocumentAnalysis` for this
reason; keep it optional.

### Not done yet

`RiskFinding.legalBasis` exists but is deliberately never populated — that is
the RAG phase. **Do not hardcode statutory citations into rules.**

## Multi-language support (en/hi/mr/gu)

Two separate systems, both necessary:

1. **Static UI chrome** — `src/lib/translations.ts`, a hand-maintained (initially
   Gemini-batch-translated, then manually reviewed for corruption — see below)
   `UI_TRANSLATIONS: Record<LanguageCode, Record<string,string>>` dictionary.
   Components call `getTranslation(key, language)`. ~200+ keys covering every
   component in the home-page flow, Navbar, Footer, chat UI, PDF labels. If you
   add a new user-facing string anywhere in the home-page flow, it needs a key
   here in all 4 languages or it silently falls back to English (see
   `getTranslation`'s fallback chain).
2. **Dynamic AI-generated content** — the actual document analysis, chat answers,
   etc. `AppContext.tsx` maintains a `translationCacheByLang` map, populated by
   POSTing to `/api/translate` whenever `language` changes and the current
   document's translatable strings (`collectTranslatableStrings` in `ai.ts`)
   aren't all cached yet. Components read via `getTranslatedExplanation(text,
   language, translationCache)` which just does a cache lookup (falls back to the
   original English if not yet cached — never shows garbage).

**Language persists** to `localStorage` and `<html lang>` syncs, both in
`AppContext.tsx`. Language state starts as `'en'` even when a stored preference
exists, and is corrected via `useEffect` after mount — this is deliberate, to
avoid a hydration mismatch (SSR always renders English; correcting synchronously
in a lazy `useState` initializer was tried and reverted for this reason).

**Batch-translating a new set of strings** (e.g. if you add a new UI section):
write the English keys to a JSON file, POST them in chunks of ~20 to
`/api/translate` (larger batches were observed to occasionally produce malformed
JSON from Gemini), then **manually scan the output for script-mixing corruption**
— Gemini occasionally emits Bengali/Cyrillic/Gurmukhi characters embedded in
otherwise-correct Devanagari/Gujarati text, or a stray English word mid-sentence.
This happened multiple times during this project's translation work and is not
theoretical — always spot-check, don't blindly merge AI-translated UI strings.

## PDF export

`src/lib/pdfExport.ts`. Two non-obvious things:

1. **jsPDF's built-in fonts (Helvetica etc.) cannot render Devanagari or
   Gujarati at all** — they come out as complete glyph garbage, confirmed by
   generating and reading a test PDF. Fixed by embedding real Unicode fonts:
   `public/fonts/NotoSansDevanagari.ttf` (covers Hindi + Marathi) and
   `NotoSansGujarati.ttf`, fetched client-side and registered via
   `doc.addFileToVFS`/`doc.addFont` before rendering. If you ever need another
   script, same pattern — Google Fonts CSS API (`fonts.googleapis.com/css2?family=...`)
   gives you the current TTF URL.
2. **The PDF export is self-sufficient for translation** — it does NOT trust
   `AppContext`'s background translation cache to already be complete, because a
   user can click "Download PDF" immediately after switching language, before
   that background fetch finishes (confirmed as a real bug via testing: the
   downloaded PDF silently had untranslated English content). `pdfExport.ts` now
   checks what it needs via `collectTranslatableStrings` and fetches anything
   missing itself before rendering.

## Chatbot

`src/app/api/chat/route.ts` + `src/components/AskLegalLingoChat.tsx`. Real Gemini
call grounded in the current document's analysis (summary, clauses, five
questions, missing info — built into a compact text digest in
`buildDocumentContextText`, capped at 10,000 chars) plus the last 6 messages of
conversation history. Answers directly in the selected language (no separate
translation round-trip). Voice input (Web Speech API `SpeechRecognition`) and
TTS (`speechSynthesis`) are pre-existing browser-API features layered on top —
untouched, just now backed by real answers instead of hardcoded keyword-matched
ones.

## Government schemes — two unrelated things share the name

1. **Per-document `relevantServices`** — 2-3 static links shown on the analysis
   dashboard, chosen by document type (`src/lib/govtServices.ts`,
   `getRelevantServicesForDocType`). Deliberately not LLM-generated, to avoid
   hallucinated government URLs.
2. **`/schemes` page** (`SchemeFinder.tsx` + `schemesData.ts`) — a completely
   separate, independent filterable database of welfare schemes (PM-Kisan,
   SVAMITVA, NALSA, etc.) by occupation/state/income, unrelated to any uploaded
   document. Pre-existing, only its UI chrome was translated this round — the
   scheme data itself is still English-only.

## Data model

`src/lib/types.ts::DocumentAnalysis` is the central shape. Notable fields:
- `paragraphs[]` / `importantClauses[]` / `missingInformation[]` now carry an
  optional `page?: number` (added for the chunking rewrite; always a real number
  now, not a numeric string — Gemini isn't consistent about this so the route
  coerces it).
- `analysisMeta?: AnalysisMeta` — see pipeline section above.
- `fiveQuestions.partiesInvolved` is a union-ish shape (`seller/buyer` OR
  `tenant/landlord` OR generic `parties[]`) depending on detected document type —
  components need to check which one is populated, don't assume `seller`/`buyer`
  (this was itself a bug fixed this round — `FiveQuestionsCard.tsx` used to
  hardcode `seller`/`buyer` and would render "undefined & undefined" for a rent
  agreement).

## What's explicitly out of scope / not done

- The `backend/` FastAPI service and `/upload` → `/processing` →
  `/analysis/[id]` pages: not translated, not connected to real chunked
  analysis, still return demo data. A conscious scoping decision, not an
  oversight — ask before touching unless specifically requested.
- `AskClauseModal.tsx` — dead code, not imported anywhere. Don't bother fixing
  unless it's actually wired up first.
- "My Documents" saved-history list shows each saved document in whatever
  language it was originally analyzed in — no per-saved-document translation
  cache. Only the surrounding page chrome is translated.
- `schemesData.ts` scheme content (names/descriptions/eligibility) is English-only.
- Offline fallback (`ai.ts::generateOfflineAnalysis`, used only when Gemini is
  genuinely unreachable) doesn't get the chunking treatment — it's a
  best-effort non-AI degraded path with its own paragraph-splitting heuristic.

## Environment

Root `.env` (Next.js auto-loads it). The backend/FastAPI `.env` usage is separate
and irrelevant to the primary flow.

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | *(required for Gemini)* | The one that matters for the default setup. |
| `GEMINI_MODEL` | `gemini-flash-lite-latest` | Override if the model name drifts again. |
| `LLM_PROVIDER` | auto-detect | `gemini` or `ollama`. |
| `LLM_FALLBACK_PROVIDER` | *(none)* | Secondary provider, tried only if the primary fails outright. |
| `OLLAMA_BASE_URL` | `http://127.0.0.1:11434` | Setting this **or** `OLLAMA_MODEL` marks Ollama configured. |
| `OLLAMA_MODEL` | `llama3.1` | Any pulled model, e.g. `llama3.2:3b`. |
| `OLLAMA_TIMEOUT_MS` | `120000` | Local generation is slow; `fetch` has no default timeout. |

To run fully locally: `ollama pull llama3.2:3b`, then start with
`LLM_PROVIDER=ollama OLLAMA_MODEL=llama3.2:3b OLLAMA_TIMEOUT_MS=300000 npm run dev`.
Read the provider-comparison table above first — translation quality does not
survive the switch.

### Adding a new provider

1. Create `src/lib/<name>.ts` exporting a `LLMProvider` (implement `name`,
   `model`, `isConfigured()`, `complete()`). Import the contract from
   `llmTypes.ts`, never from `llm.ts`.
2. Throw `LLMError(message, status, name, permanent)` — set `permanent` for
   client errors so retries don't burn quota; use status `0` for network
   failures so they stay retryable.
3. Add it to `PROVIDERS` and `PROVIDER_PREFERENCE` in `llm.ts`, and to the
   `LLMProviderName` union in `llmTypes.ts`.
4. No route changes are needed.

## Testing pattern used throughout this project's development

A Vitest suite now covers the Risk Engine (`npm test`, 36 tests in
`src/lib/risk/riskEngine.test.ts`). Everything else is still verified by hand: run
`npx tsc --noEmit` and `npx eslint <changed files>`, then drive the actual
running dev server (`npm run dev`) with Playwright — upload a real generated
test PDF, intercept the `/api/analyze` (or `/translate`, `/chat`) network
response to inspect the real payload, and screenshot the rendered UI. Test PDFs
were generated on the fly with `jsPDF` (Node-side, `doc.output('arraybuffer')` →
write to file — `.save()` doesn't work outside a browser) for text-based cases,
and Playwright screenshot → `jsPDF.addImage` for scanned/no-text-layer cases. If
you're continuing this project, that's the fastest way to verify a real change —
don't just trust `tsc`/`eslint` for anything touching the analysis pipeline or
UI rendering.
