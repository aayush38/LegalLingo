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
4. **Chunk extraction**: each chunk gets its own Gemini call (concurrency-limited
   to 3 at a time, `mapWithConcurrency` in `route.ts`, retried up to 2x with
   exponential backoff on 429/502/503/504 via `gemini.ts::callGemini`), extracting
   paragraphs/clauses/missing-info/legal-terms *for that chunk only*, each item
   tagged with a page number via an inline `[[PAGE N]]` marker the prompt asks
   Gemini to echo back.
5. **Merge**: chunk results are concatenated in order, then deduped
   (`dedupeItems` — normalizes text, drops near-duplicates from chunk-boundary
   overlap) and given sequential IDs.
6. **Synthesis**: one final Gemini call over the chunk summaries (not raw text
   again) produces document-level fields — type, summary, five-questions,
   completeness breakdown, recommended actions.
7. Response includes `analysisMeta: {fullyAnalyzed, totalPages, totalChunks,
   chunksSucceeded, chunksFailed, warnings, geminiCalls, totalMs}` — an honest
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

## AI integration

`src/lib/gemini.ts` is the single shared entry point for every Gemini call in the
app — do not call the REST API directly from a route, use `callGemini(prompt,
temperature, json, {maxRetries})`. It:
- Reads `GEMINI_API_KEY` from `process.env` (server-side only, works because
  Next.js auto-loads the root `.env`).
- Calls `gemini-flash-lite-latest` via direct REST `fetch` (no SDK dependency).
  **This model name matters** — `gemini-1.5-flash` (old default in some sample
  code) is deprecated/404s, `gemini-flash-latest` and `gemini-2.5-flash` were
  found overloaded/deprecated during testing. Re-verify against `ListModels` if
  Gemini calls start failing — model availability shifts over time.
- Optionally retries on retryable HTTP statuses (429/502/503/504) with
  exponential backoff — pass `{maxRetries: N}` explicitly; default is 0 (no
  retry) to avoid changing behavior for existing low-stakes callers.
- `parseGeminiJson` / `sanitizeJsonEscapes`: Gemini's `responseMimeType:
  'application/json'` mode still occasionally emits invalid JSON (a literal
  backslash that isn't a valid escape, or once, an unquoted bare word in an
  array). The sanitizer fixes the escape case; there's no recovery for
  structurally broken JSON beyond that — those calls just fail and get retried
  or reported as a chunk failure.

Three routes use this: `/api/analyze` (document analysis, above), `/api/translate`
(batch string translation), `/api/chat` (grounded chatbot).

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

Root `.env` (Next.js auto-loads it): `GEMINI_API_KEY` is the one that matters
for everything described above. The backend/FastAPI `.env` usage is separate and
irrelevant to the primary flow.

## Testing pattern used throughout this project's development

No committed test suite exists yet. Verification so far has been: run
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
