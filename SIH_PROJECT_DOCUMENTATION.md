# LegalLingo Project Documentation 🛡️
## Current State of the `main` Branch

This document provides a comprehensive, easy-to-understand, and technically accurate guide to the **LegalLingo** codebase on the `main` branch. It explains the project's architecture, features, user journey, and backend mechanisms in simple language so that teammates can present it confidently at the Smart India Hackathon (SIH) and Claude can use it to draft presentation scripts.

---

# 1. Project Overview

### What is LegalLingo?
LegalLingo is a civic-tech web application designed to help average Indian citizens understand complex, jargon-heavy legal documents in their own native languages. It translates and simplifies legal agreements (such as sale deeds or rent agreements), highlights hidden risks, checks document consistency, and matches citizens with relevant welfare schemes.

### What Problem Does it Solve?
Most legal documents in India are drafted in complex English or formal vernacular scripts filled with archaic terminology (e.g., "hereinafter", "indemnify", "encumbrance"). Citizens often sign these documents without fully understanding the terms, leaving them vulnerable to fraud, unfair clauses, and property disputes. Legal fees for document review are high, and government welfare schemes are often underutilized because eligible citizens are unaware of them.

### What are the Target Users?
- **Rural Citizens & Farmers**: Landholders buying/selling agricultural land who need to check surveys and property details.
- **Tenants & Landlords**: People signing rent/lease agreements.
- **General Citizens**: Anyone who has been handed a legal notice, loan agreement, or contract and wants a plain-language explanation.

### Why This Problem Matters
Secure property ownership and clear contract terms are essential for financial security. In India, land and property disputes account for a massive percentage of litigation in courts. Preventing disputes at the time of signing by raising citizen awareness has a massive positive social and economic impact.

### What the User Does (Start to Finish)
1. **Welcome Screen**: The user selects their preferred language (English, Hindi, Marathi, or Gujarati) and chooses to sign in or proceed as a guest.
2. **Upload**: The user uploads their primary legal document (PDF or image) and optionally adds supporting documents (such as a bank NOC, PAN card, or 7/12 extract).
3. **Processing**: The application extracts the text in the browser using client-side PDF parsing or OCR (Optical Character Recognition).
4. **AI Analysis**: The extracted text is analyzed using AI, which translates it and returns structured explanations.
5. **Dashboard View**: The user views an interactive dashboard displaying:
   - A simplified section-by-section breakdown.
   - An overall health score.
   - A list of identified risks and attention items.
   - Curator-verified links to government services.
6. **Chat & Download**: The user can ask questions to a chat assistant grounded in the document, tick off items in an action checklist, and download a simplified PDF report in their chosen language.

### What Makes LegalLingo Different?
Unlike generic AI document summarizers, LegalLingo:
1. **Ensures 100% Coverage**: It uses a smart chunking pipeline to ensure that large documents are fully analyzed without silent truncations.
2. **Uses a Deterministic Risk Engine**: AI translates the text, but a set of hardcoded, rule-based checks (written in TS/JS) determines the risk levels. This prevents AI hallucinations from miscalculating critical legal risks.
3. **Integrates Cross-Document Validation**: It compares facts across multiple files, verifying if a seller's name matches their Aadhaar/PAN, or if an existing property mortgage has a corresponding bank discharge letter (NOC).

---

# 2. Main Features

Below are the key user-facing features currently implemented in the code:

### 1. Multi-File Sequential Upload & Role Assignment
*   **What it does**: Allows users to upload a primary legal agreement along with up to 8 supporting files (e.g., PAN cards, NOC letters, 7/12 extracts).
*   **Why it exists**: Property transactions depend on multiple files. Cross-document validation requires analyzing the primary agreement alongside supporting proofs.
*   **How a user uses it**: Drag-and-drop or select files in the uploader, choosing a role ("primary" or "supporting") and document type label for each.
*   **Behind the scenes**: Files are processed sequentially (to prevent browser freezing) and combined into one logical document for analysis.

### 2. Client-Side Text Extraction & OCR Fallback
*   **What it does**: Extracts text from digital PDFs directly in the browser. If a PDF is scanned (image-only) or is an image (JPG/PNG), it runs Optical Character Recognition (OCR) to convert the visual text into machine-readable characters.
*   **Why it exists**: Saves server bandwidth and works locally. Scanned documents and phone snapshots are very common.
*   **How a user uses it**: Automatically triggered when a user uploads a PDF or image.
*   **Behind the scenes**: Uses `pdfjs-dist` to extract digital text. If the text length is 40 characters or less, it falls back to `tesseract.js` to perform OCR on the canvas-rendered pages.

### 3. Indicator-Script Bilingual PDF Export
*   **What it does**: Exports a beautifully styled PDF report of the simplified document and checklist.
*   **Why it exists**: Citizens need a portable, offline copy of the simplified report that they can take to a sub-registrar, family member, or lawyer.
*   **How a user uses it**: Clicks the "Download PDF" button on the dashboard.
*   **Behind the scenes**: Uses `jsPDF`. Eagerly fetches Noto Sans Devanagari (for Hindi/Marathi) and Noto Sans Gujarati fonts client-side, embedding them into the PDF binary to prevent Indic character corruption.

### 4. Grounded AI Chat Assistant (Ask LegalLingo)
*   **What it does**: A chat window where citizens ask questions about their document and receive plain-language answers.
*   **Why it exists**: Let's citizens clarify specific doubts (e.g., "When do I have to pay?", "Can I terminate this early?") interactively.
*   **How a user uses it**: Opens the floating chat launcher, types or speaks a question, and reads the reply.
*   **Behind the scenes**: Sends the user's question, chat history, and a compressed document summary to `/api/chat`. The AI generates answers strictly constrained by this context to prevent hallucinations.

### 5. Multi-Language INDIC Support (English, Hindi, Marathi, Gujarati)
*   **What it does**: Dynamically translates the user interface and AI analysis outputs into Hindi, Marathi, or Gujarati.
*   **Why it exists**: Most Indian citizens do not read English legal documents comfortably; native language support is critical for accessibility.
*   **How a user uses it**: Selects their language in the welcome flow or from the navigation bar drop-down.
*   **Behind the scenes**: Static UI strings use a dictionary (`translations.ts`). Dynamic AI analysis fields are translated on-demand by sending them in batches to `/api/translate`. Results are cached in the application context for instant switches.

### 6. Client-Side Aadhaar Profile Verification & Identity Match
*   **What it does**: Verifies the user's identity card (Aadhaar) using a secure browser OCR flow and matches their name against the document parties.
*   **Why it exists**: Verifies if the person reading the document is a party named in the deed, checking for spelling inconsistencies that could invalidate the contract.
*   **How a user uses it**: Uploads their Aadhaar card in the Profile Modal.
*   **Behind the scenes**: Runs local OCR. The full 12-digit number is checked using the **Verhoeff Checksum** in memory and is immediately discarded. Only the last 4 digits and name are stored. The `IdentityCheck` component compares this name against the document parties using a conservative initials-tolerant string distance helper.

### 7. Interactive Citizen Checklist & Welfare Scheme Finder
*   **What it does**: Provides an interactive checklist of recommended steps and a filterable catalog of government welfare programs.
*   **Why it exists**: Guides citizens on what to do next and connects them with actual government benefits.
*   **How a user uses it**: Ticks boxes in the Action Checklist; browses schemes by selecting their occupation and income on the Scheme Finder page.
*   **Behind the scenes**: Checklist clicks are saved optimistically in context and synced to Supabase (if logged in). Schemes are filtered instantly from a local database (`schemesData.ts`) based on user selections.

---

# 3. Complete User Flow

Here is the exact journey of a user based on the active codebase:

1. **Welcome Screen (`/welcome`)**: The user selects their active language, then decides to sign in or use the app as a guest.
2. **Onboarding Gate Redirect**: If the user hasn't onboarded yet, they are redirected to `/welcome`. Once they complete it, they are sent to the Home Page (`/`).
3. **Uploader Interface**: The user uploads their primary legal document, and optionally assigns roles and labels to supporting documents.
4. **Local Text Extraction**: The app sequentially extracts text from the files using PDF layers or Tesseract OCR, updating a progress percentage on the screen.
5. **Continuous Page Renumbering**: Multiple files are combined, assigning continuous 1-based page indices across the batch.
6. **Numbered Heading Splitting**: Page text is split into logical clauses at numbered sections, preventing random middle-sentence splits.
7. **Greedy Pack Chunking**: Sections are gathered into 8,000-character chunks, keeping file boundaries aligned.
8. **Analysis POST request**: Chunks are sent to the `/api/analyze` server route.
9. **Concurrency-Limited Extraction**: Chunks are processed in batches of 3, extracting clauses, summaries, missing details, and glossary terms.
10. **Document Synthesis**: A final API call synthesizes overview metrics, checklists, and 5 citizen questions.
11. **Deterministic Risk Engine Check**: The engine parses extracted texts and evaluates contract constraints, checking for mortgages, missing IDs, name inconsistencies, and payment calculations.
12. **Interactive UI Dashboard**: Results populate the dashboard components inline on `/` (no page refresh).
13. **Chat and Export**: The user asks questions in the chatbot drawer, clicks actions to complete checklist tasks, and exports a Noto Sans PDF report.

---

# 4. Frontend

### Architecture & Framework
The frontend is built using **Next.js 16.3** with the **App Router**. It utilizes client-side React hooks for managing state (`useState`, `useEffect`, `useContext`) and standard Tailwind CSS / Framer Motion for responsive layouts and animations.

### Important Routes & Pages
- **`/` (Home page - `src/app/page.tsx`)**: The primary product workspace. Renders the uploader and displays the comprehensive analysis dashboard inline once a document is loaded.
- **`/welcome` (Welcome page - `src/app/welcome/page.tsx`)**: First-run onboarding gate where users choose their language and select an account option.
- **`/schemes` (Schemes page - `src/app/schemes/page.tsx`)**: A standalone search portal where citizens filter government welfare programs based on occupation and income.
- **`/my-documents` (My Documents page - `src/app/my-documents/page.tsx`)**: Displays the list of previously saved analyses for the signed-in user.

### State Management & Communication
State is managed globally by **`AppContext.tsx`** and **`AuthContext.tsx`**.
- `AuthContext` checks if Supabase is configured and tracks the logged-in user session.
- `AppContext` orchestrates files through the extraction pipeline, manages the currently displayed analysis (`currentAnalysis`), handles indicating language states, fetches dynamic translations, and coordinates DB syncing.
- Components communicate by reading and writing to these shared contexts via the custom hooks `useApp()` and `useAuth()`.

### Key Frontend Components

| File/Component | Purpose |
|---|---|
| [`LandingHero.tsx`](file:///c:/Users/Aarohi/Desktop/LegalLingo/src/components/LandingHero.tsx) | Renders the hero header and holds the `UploadDropzone` component for file inputs. |
| [`UploadDropzone.tsx`](file:///c:/Users/Aarohi/Desktop/LegalLingo/src/components/UploadDropzone.tsx) | Handles drag-and-drop, captures file queues, and allows users to set roles and document types before uploading. |
| [`DashboardOverview.tsx`](file:///c:/Users/Aarohi/Desktop/LegalLingo/src/components/DashboardOverview.tsx) | Displays the large plain-language summaries (simple and extra-simple) and metric indicators. |
| [`DocumentReader.tsx`](file:///c:/Users/Aarohi/Desktop/LegalLingo/src/components/DocumentReader.tsx) | Displays the side-by-side view showing original clauses next to simplified meanings. Enables manual text editing. |
| [`RiskEngineFindings.tsx`](file:///c:/Users/Aarohi/Desktop/LegalLingo/src/components/RiskEngineFindings.tsx) | Renders the warnings generated by the deterministic Risk Engine, complete with "Why was this flagged?" drawers showing evidence. |
| [`FiveQuestionsCard.tsx`](file:///c:/Users/Aarohi/Desktop/LegalLingo/src/components/FiveQuestionsCard.tsx) | Renders five key questions that citizens immediately want answers to (e.g., parties involved, total amount, next steps). |
| [`SchemeFinder.tsx`](file:///c:/Users/Aarohi/Desktop/LegalLingo/src/components/SchemeFinder.tsx) | Provides the standalone questionnaire dashboard for finding welfare schemes. |
| [`AskLegalLingoChat.tsx`](file:///c:/Users/Aarohi/Desktop/LegalLingo/src/components/AskLegalLingoChat.tsx) | Floating chatbot UI. Handles input queries, manages speech recognition, text-to-speech, and prints message history. |
| [`ProfileModal.tsx`](file:///c:/Users/Aarohi/Desktop/LegalLingo/src/components/ProfileModal.tsx) | Contains the user profile forms and integrates browser-only Aadhaar card uploads and OCR validation. |

---

# 5. Backend

### API Architecture
LegalLingo uses **Next.js API Route Handlers** (running server-side in Node.js) for processing requests. A secondary legacy FastAPI Python server (`backend/`) exists in the directory but is deprioritized and unused by the home page flow. The primary Next.js backend handles analysis, translations, and chat.

### API Routes

| API/Route | What it does | Used by |
|---|---|---|
| `/api/analyze` | Receives combined document pages, splits them into greedy chunks, calls the LLM in parallel to extract structured information, dedupes the combined items, synthesizes a document-level summary, and runs the deterministic Risk Engine. | `AppContext.processUploadedItems` |
| `/api/translate` | Translates a batch of English strings into Hindi, Marathi, or Gujarati. Enforces Indic-script constraints and handles array ordering checks. | `AppContext` (translation caching), `pdfExport.ts` |
| `/api/chat` | Receives a user question, recent history, and a document digest. Generates a grounded, language-aligned response. | `AskLegalLingoChat.tsx` |

### Error Handling & Validation
- **JSON Validation**: The `/api/analyze` and `/api/translate` endpoints use custom validator functions (e.g., `validateSynthesis`, `validateChunkExtraction`) passed to the LLM layer. If the AI returns malformed JSON or mismatched arrays, the system catches it and re-prompts the AI with the specific error, allowing it to repair its output up to 2 times.
- **Fail Degradation**: The deterministic Risk Engine is wrapped in a `try/catch` block. If a rule fails due to unexpected formatting, it degrades gracefully—omitting only the rule findings rather than crashing the entire document analysis.
- **Quota Safeguards**: Transport errors (e.g., API limits, timeout errors) are automatically retried using exponential backoff (retrying up to 2 times). Client-side errors (e.g., missing API keys) are marked permanent and fail immediately.

---

# 6. Document Processing Pipeline

The step-by-step pipeline from upload to display is highly structured and runs as follows:

- **Upload Stage**: Files are uploaded through `UploadDropzone.tsx` (limit: 24). Ordered sequentially: primary deed first.
- **Extraction Stage (`ocr.ts`)**: Lazily loads `pdfjs-dist` in browser. If selectable text layer has more than 40 characters, extracts it directly. If not (scanned PDF), renders pages to browser canvas and runs `tesseract.js` OCR. Local image files run through Tesseract OCR directly.
- **Combining Stage (`documentChunking.ts::combineDocuments`)**: Drops empty pages. Renumbers remaining pages from 1 to N continuously, while keeping `sourceFile` and original `sourcePage` metadata tags intact.
- **Section Detection (`documentChunking.ts::splitIntoSections`)**: Matches numbered heading patterns (e.g. `1. DEFINITIONS`) to split text into clauses. Falls back to blank-line paragraph splitting for affidavits and prose documents.
- **Chunk Assembly Stage (`documentChunking.ts::buildChunks`)**: Greedily gathers sections into chunks of up to 8,000 characters. Splits oversized clauses into overlapping 7,000-character windows (500-character overlap) to prevent arbitrary truncations. Flushes chunks at file boundaries so chunks never cross file boundaries.
- **API POST request**: Chunks are POSTed to `/api/analyze`.
- **Parallel Chunk Extraction (`/api/analyze/route.ts`)**: Processes chunks with concurrency limited to 3. Primary chunks receive a full simplification prompt, extracting summaries, paragraphs, clauses, missing info, and terms. Supporting chunks get a facts-only extraction prompt (no simplification).
- **Deduplication & Coercion (`/api/analyze/route.ts`)**: Coerces page number markers to real integers. Deduplicates paragraphs, clauses, and missing info based on a file-scoped text fingerprint. Glossary terms are deduped globally.
- **Synthesis Stage (`/api/analyze/route.ts`)**: Invokes one final LLM call over chunk summaries and opening pages to generate document type classification, understanding score, general status, summaries, 5 questions, completeness breakdown, and actions list.
- **Risk Engine Stage (`/api/analyze/route.ts`)**: Normalizes facts from document text only (excludes commentary) and runs rule check packs in Javascript.
- **Dashboard Display**: Analysis details land in `AppContext` and render the metrics and side-by-side components.

---

# 7. AI / LLM System

### AI Model & Provider Abstraction
The application uses the **Google Gemini API** with **`gemini-flash-lite-latest`** as the default model (overridable via `GEMINI_MODEL`). It supports **Ollama** (`llama3.1`/`llama3.2:3b` by default) as a local fallback when configured.

All LLM calls are routed through a provider abstraction layer (**`src/lib/llm.ts`**). No API endpoint communicates directly with Gemini or Ollama. This modular design isolates retry logs, JSON repair functions, and vendor configurations.

### Key Prompts & AI Inputs
- **Chunk Extraction Prompt**: Receives a single document chunk (under 8,000 characters) containing inline `[[PAGE N]]` page markers. It commands the model to output a JSON object containing a chunk summary, simplified paragraphs, important clauses, missing information, and a legal terms glossary. It strictly orders the model to preserve numbers, amounts, and dates.
- **Synthesis Prompt**: Receives a text digest of all extracted clauses and summaries, along with the first few paragraphs of each uploaded file (to serve as grounding text for party names). It instructs the model to generate the document classification, understanding score, overall status, summaries, 5 citizen questions, completeness scores, and recommended citizen actions.
- **Chat Prompt**: Receives a compact 10,000-character text digest of the document analysis, the last 6 messages of conversation history, and the user's question. It instructs the model to answer strictly based on the provided context in the user's selected language.

### AI Concept Definitions
- **Chunking**: Large documents are divided into smaller pieces so the AI can process them reliably.
- **Synthesis**: Combining separate chunk summaries and findings into a single document-wide overview.
- **Hallucination Safeguards**: Constraints that ensure the AI chatbot only answers using facts from the uploaded document, saying "Not clearly defined in the document" when information is missing.

---

# 8. OCR / Text Extraction

### Libraries Used
- **`pdfjs-dist` (PDF.js)**: A library that parses PDF files. It is loaded lazily in the browser so that Next.js server-side rendering does not crash (since PDF.js accesses browser-only DOM globals).
- **`tesseract.js`**: A Javascript wrapper for Tesseract OCR. Converts visual characters in images or scanned canvases into digital text.

### When OCR is Triggered
1. Automatically when a JPG or PNG image is uploaded.
2. Automatically when a PDF is uploaded, but `pdfjs-dist` extracts 40 characters or less (which indicates that it is a scanned document without a selectable text layer).

### Limitations
- Can only process up to 8 scanned pages per document (`MAX_OCR_PAGES = 8`) to prevent browser crashes, whereas digital text PDFs can handle up to 30 pages (`MAX_PDF_PAGES = 30`).
- OCR accuracy is highly dependent on image quality, camera angle, and handwriting. Poorly lit photos may result in spelling variations (which the Aadhaar and risk engines try to handle gracefully).

---

# 9. Document Analysis

LegalLingo performs a variety of analyses to make documents understandable:

### 1. Document Classification
*   **What it means**: Detects if the document is a Sale Agreement, Rent Agreement, Loan Agreement, Legal Notice, or other contract.
*   **Confidence**: The AI returns a classification confidence percentage.

### 2. Side-by-Side Citizen Reader
*   **What it means**: Divides the original document into readable paragraphs, placing each original clause next to a simplified plain-language explanation and a note on "Why it matters."

### 3. Five Citizen Questions
*   Extracts critical answers citizens want to know immediately:
    - What type of document is this?
    - Who are the parties involved (e.g., buyer/seller, tenant/landlord)?
    - What is the total monetary amount involved?
    - What critical information is missing from the document?
    - What are the concrete next steps?

### 4. Completeness & Health Score
*   Calculates percentage scores from 0-100 across six key areas:
    - **Identity Info**: Are names and ID numbers fully specified?
    - **Property Info**: Is the property location, survey number, and size clear?
    - **Financial Info**: Are the payments, dates, and amounts complete?
    - **Important Clauses**: Are dispute, termination, and default terms present?
    - **Witness Info**: Are witnesses named?
    - **Registration Info**: Is Sub-Registrar or stamp duty information mentioned?

### 5. Difficult Words Glossary
*   Highlights complex legal terms (e.g., *Indemnity*, *Encumbrance*, *Lessee*) that appear in the text and defines them with simple examples.

### 6. Action Checklist
*   Translates recommended actions into an interactive checklist where citizens can mark tasks as completed (e.g., "Confirm receipt of ₹2,80,000 advance payment").

---

# 10. Chat / Ask LegalLingo

- **Implementation**: Handled by `/api/chat` route and `AskLegalLingoChat.tsx` component.
- **Context Grounding**: The frontend gathers all extracted data (summaries, clauses, glossary, missing info, and original paragraphs) and compiles it into a compact digest. This digest is prefixed to the prompt, capping it at 10,000 characters.
- **Conversation Window**: The system feeds the last 6 messages of conversation history to the model, maintaining context without bloating the request.
- **Multilingual Response**: The API receives the user's active language and prompts the AI to reply directly in that language (no separate translation round-trip required), which is faster and preserves tone.
- **Safeguards**: Strict prompt guidelines prevent the assistant from providing speculative legal advice or guessing facts that are not present in the document.

---

# 11. Privacy and Security

### Implemented Security & Privacy Controls
1. **Local File Extraction**: PDF text parsing and OCR occur entirely in the citizen's browser. The original document files and image bytes are never sent to the backend during analysis; only the extracted text strings are analyzed.
2. **Aadhaar Number Protection**: In the profile Aadhaar upload, the 12-digit number is processed in-memory for the Verhoeff checksum validation and then immediately discarded. Only the last 4 digits are stored (`aadhaar_last4`). A database check constraint enforces that this column cannot exceed 4 characters.
3. **Interactive Privacy Masking**: A regex-based "Privacy Shield" utility (`privacy.ts`) can be toggled on the dashboard. When active, it masks personal identifiers (PAN cards, phone numbers, Aadhaar numbers, and names) in the UI text and downloaded PDFs using asterisk/X masking.
4. **Guest Privacy**: Guests can analyze documents without an account. In this state, the analysis resides in React state (browser memory) and is destroyed as soon as the tab is closed. No cookies, trackers, or databases persist guest uploads.

### Not Implemented (For Demo/Hackathon Only)
- The Supabase client in the frontend bypasses OAuth/multifactor authentication.
- API keys are read from environment variables; in a production deployment, these would need to be stored in a secure key vault (e.g., Google Secret Manager).
- No server-side antivirus scanning is run on uploaded files.

### Needed for Production
- **Valkyrie Security Audit**: A full security evaluation of the local file storage and RLS (Row Level Security) database rules.
- **Encrypted Document Storage**: Documents uploaded to the Supabase Storage bucket by logged-in users are currently protected by standard RLS, but should be encrypted at rest using KMS (Key Management Service) keys.
- **LLM Rate Limiting**: Gating API endpoints to prevent server abuse.

---

# 12. Database / Storage

### Database Schema
LegalLingo uses a **Supabase PostgreSQL database**. For signed-in users, analyses are automatically written across the following tables:

- **`profiles`**: Stores user registration details, preferred language, and Aadhaar verification metadata (`aadhaar_last4`, `aadhaar_name`, `aadhaar_verified_at`).
- **`document_sets`**: Acts as a header representing one user upload batch, storing title, document type, and overall scores.
- **`documents`**: Tracks each file in a document set, storing its filename, size, role (`primary` or `supporting`), and the storage path in Supabase buckets.
- **`document_pages`**: Stores the raw extracted text of each page to enable rapid re-analysis.
- **`analyses`**: Stores the full synthesized JSON result, including summaries, question answers, and processing metadata.
- **`clauses`**: Stores the section-by-section original text and simplified explanations.
- **`risk_findings`**: Stores the deterministic rules findings (severities, evidence snippets, reasons).
- **`extracted_facts`**: Stores key facts read from supporting documents (names, parcel numbers, amounts) to support rule checks.
- **`checklist_items`**: Tracks the completion state of recommended citizen actions.
- **`translation_cache`**: Caches AI translations of document text to speed up language switching.

### Storage Bucket
Original document files for logged-in users are stored in a Supabase Storage bucket named `documents` using the key pattern `{userId}/{documentSetId}/{index}-{fileName}`. Deleting a document set cascades and removes all database rows and associated storage objects.

---

# 13. Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js (16.3.1)** | Application framework for App Router pages and API routes. |
| **React (19.2.8)** | Frontend rendering, component UI, and context state management. |
| **TypeScript** | Static typing for code reliability and API contract matching. |
| **Supabase** | Cloud PostgreSQL database, user authentication, and file storage. |
| **Tesseract.js** | Client-side OCR engine for scanned PDFs and image files. |
| **pdfjs-dist** | Client-side lazy-loaded PDF parsing library. |
| **jsPDF** | PDF generation engine for report summaries. |
| **Framer Motion** | Smooth UI transitions, sidebar reveals, and page animations. |
| **Lucide React** | Premium icon library. |
| **Vitest** | Unit testing framework for evaluating risk rules. |
| **PostCSS / Tailwind** | Styling and responsive design utilities. |

---

# 14. Project Architecture

The overall system architecture and layers flow as follows:

```text
       ┌────────────────────────────────────────────────────────┐
       │                       CITIZEN                          │
       └───────────────────┬────────────────┬───────────────────┘
                           │                ▲
   1. Primary & Supporting │                │ 9. Simplifications,
      Files (PDF / Image)  │                │    Risks, Chat & PDFs
                           ▼                │
       ┌────────────────────────────────────┴───────────────────┐
       │                   NEXT.JS FRONTEND                     │
       │                                                        │
       │   - Extraction Pipeline: pdfjs-dist & tesseract.js     │
       │   - Document Chunker: Splits text & builds chunks      │
       │   - AppState & Language Context: translationCache      │
       │   - PDF Generator: Unicode embedding (Noto Fonts)      │
       └───────────────────┬────────────────▲───────────────────┘
                           │                │
     2. JSON Chunks        │                │ 8. Synthesized Analysis,
        & File Meta        │                │    Risk Findings
                           ▼                │
       ┌────────────────────────────────────┴───────────────────┐
       │                   API ROUTE HANDLER                    │
       │                    (/api/analyze)                      │
       └───────────────────┬────────────────▲───────────────────┘
                           │                │
            3. Concurrency │                │ 7. Assembled Facts & Clauses
               Chunks      ▼                │
       ┌────────────────────────┐      ┌────┴───────────────────┐
       │  AI PROVIDER LAYER     ├─────►│  DETERMINISTIC RISK    │
       │      (llm.ts)          │      │     RULE ENGINE        │
       │                        │      │      (src/lib/risk/)   │
       │  - Gemini API (Cloud)  │      │                        │
       │  - Ollama API (Local)  │      │  Checks facts against  │
       │  - Auto-Retry & Repair │      │  hardcoded property,   │
       │  - Fallback Provider   │      │  identity & financial  │
       └────────────────────────┘      │  consistency rules     │
                                       └────────────▲───────────┘
                                                    │
                                      4. Read &     │ 6. Write Analysis
                                         Write Auth │    to account tables
                                                    ▼
                                       ┌────────────────────────┐
                                       │    SUPABASE BACKEND    │
                                       │   (DB & File Storage)  │
                                       └────────────────────────┘
```

### Explanations of Layers
- **Citizen**: User triggering uploads, reading breakdowns, ticking checkboxes, chatting, and triggering PDF prints.
- **Next.js Frontend**: Coordinates text extraction, builds contiguous page maps, breaks text into 8k chunks, and runs UI views.
- **API Route Handler**: Next.js Serverless API endpoints mapping chunks to extractors, deduping outputs, and running rule checks.
- **AI Provider Layer**: Abstraction layer coordinating connection details, retry policies, and re-prompt repair validations for both local and cloud setups.
- **Deterministic Risk Engine**: Code rule packs analyzing property details, identities, and finances based on extracted facts.
- **Supabase Backend**: Storage tables holding saved records, user profiles, and original file streams.

---

# 15. Important Files and Folders

A quick developer map of the LegalLingo repository:

```text
LegalLingo/
├── backend/                       → Deprioritized Python FastAPI backend (unused in main flow)
├── public/
│   └── fonts/                     → TrueType fonts (NotoSansDevanagari/Gujarati) for PDF exports
├── src/
│   ├── app/                       → App Router Pages & API Routes
│   │   ├── api/
│   │   │   ├── analyze/route.ts   → Primary analysis orchestrator
│   │   │   ├── chat/route.ts      → Q&A endpoint grounded in doc analysis
│   │   │   └── translate/route.ts → Indict translator endpoint
│   │   ├── welcome/page.tsx       → Onboarding welcome screen
│   │   ├── schemes/page.tsx       → Standalone Scheme Finder page
│   │   ├── my-documents/page.tsx  → List of saved user documents
│   │   └── page.tsx               → Main workspace, uploader & dashboard inline view
│   ├── components/                → Reusable React UI Components
│   │   ├── UploadDropzone.tsx     ─ Upload handler interface
│   │   ├── DocumentReader.tsx     ─ Side-by-side clause visualizer
│   │   ├── AskLegalLingoChat.tsx  ─ Chat assistant box & Web Speech APIs
│   │   └── RiskEngineFindings.tsx ─ Displays warnings from the Risk Engine
│   ├── context/                   → Shared Application States
│   │   ├── AppContext.tsx         ─ Pipeline runner, translations, and global variables
│   │   └── AuthContext.tsx        ─ Tracks Supabase authenticated user sessions
│   └── lib/                       → Core processing & helper modules
│       ├── aadhaar/aadhaar.ts     ─ Aadhaar OCR parser & Verhoeff validation
│       ├── identity/              ─ Compares profile Aadhaar name against document parties
│       ├── risk/                  ─ Rules and normalization logic for the Risk Engine
│       ├── ai.ts                  ─ Client-side API fetch client & offline fallback generator
│       ├── documentChunking.ts    ─ Heading-based split & greedy chunk packing
│       ├── gemini.ts / ollama.ts  ─ AI provider SDK integrations
│       ├── llm.ts                 ─ Abstraction layer, exponential retry, JSON repair
│       ├── pdfExport.ts           ─ PDF export builder with embedded Noto fonts
│       ├── translations.ts        ─ Dictionary for static UI string localized keys
│       └── types.ts               ─ Central TypeScript definitions
├── tsconfig.json                  → TypeScript configurations
├── package.json                   → Dependencies (Next.js, pdfjs-dist, tesseract.js, jspdf)
└── PROJECT_STATUS.md              → Implementation history and notes
```

---

# 16. Key Technical Decisions

-   **Why Next.js Route Handlers instead of Python FastAPI?** The Next.js API router allows the team to deploy the entire application on a single serverless host (like Vercel) instead of managing multiple instances. It simplifies calls and prevents CORS (Cross-Origin Resource Sharing) headaches.
-   **Why client-side PDF text extraction and OCR?** Moving PDF reading and character recognition to the citizen's browser saves server CPU bandwidth. It also guarantees privacy, as raw document bytes never leave the client's device during extraction.
-   **Why split-by-headings chunking?** Standard contracts are divided by clause headings (e.g., "1. DEFINITIONS"). Splitting text at heading boundaries ensures that clauses stay intact during analysis. Greedy packing up to 8,000 characters ensures that large documents are fully analyzed without exceeding LLM context windows.
-   **Why is the Risk Engine deterministic?** Generative AI is prone to hallucinations. It can say "No mortgage exists" because it misread a negative sentence. Having custom typescript parsers search the text for terms and execute logic (e.g., check if a mortgage is mentioned but no release statement is found) provides a reliable, explainable security check.
-   **Why is the Provider Abstraction layer separate?** It decouples the application from vendor lock-in. If Gemini changes its API, only `gemini.ts` needs an update. It also enables instant, code-free fallbacks (e.g., falling back to a local Ollama model if Gemini is offline).

---

# 17. Current Limitations

-   **Client-side CPU strain**: Running OCR (Tesseract.js) and canvas rendering in the browser's main thread is CPU-bound. Uploading a scanned 8-page PDF can cause the browser to stutter on slow mobile devices.
-   **Scanned page limit**: The system enforces a strict cap of 8 scanned pages (`MAX_OCR_PAGES = 8`) to prevent browser crashes. Uploading a scanned document longer than 8 pages results in incomplete extraction.
-   **Ollama Indic-translation limits**: While Ollama can extract English clauses locally, smaller models (e.g., `llama3.2:3b`) generate unusable gibberish when asked to translate into Hindi, Marathi, or Gujarati. A cloud API (like Gemini) is required for Indic languages.
-   **No production-ready authentication audit**: Supabase Auth functions are configured for development. A production deployment requires implementing proper multi-factor authentication (MFA) and auditing Row Level Security policies.
-   **No RAG Legal Citations**: While the database structure (`risk_findings.legal_basis`) supports citing laws (e.g., citing sections of the Transfer of Property Act), the legal dataset is not yet connected to the rule engine (legalBasis remains null).

---

# 18. Production Readiness

### What Already Works
- 100% chunked document analysis with Gemini and Ollama.
- High-fidelity Indic translation (Hindi, Marathi, Gujarati) with context caching.
- Client-side Aadhaar OCR, Verhoeff checksum checks, and identity validation.
- Deterministic Risk Engine checks with 36 Vitest regression tests.
- High-quality PDF summary export embedding Unicode Indic fonts.
- Supabase account persistence and storage sync with automatic cleanup cascades.

### What Needs to Change Before Production Deployment
1.  **Move OCR to Web Workers**: Tesseract.js and pdfjs-dist rendering must be moved to background Web Workers to prevent main-thread browser freezing on budget mobile devices.
2.  **Server-Side Antivirus Scanning**: Add an intermediate file scanning server (e.g., ClamAV) to scan documents for malware before saving them to Supabase storage.
3.  **Incorporate RAG Legal Citations**: Connect a vector search database (like Supabase pgvector) containing Indian legal codes to populate the `legalBasis` field, grounding the Risk Engine findings in actual statutes.
4.  **Security Audit**: Complete a professional security evaluation of Row Level Security (RLS) policies to ensure that a user can never access another user's document set or storage files.
5.  **Indic OCR support**: Configure Tesseract workers to load Hindi, Marathi, and Gujarati training models to support OCR on regional-language scanned documents.

---

# 19. SIH Presentation Talking Points

Here are the key talking points for the SIH presentation:

-   **The Problem**: Indian citizens sign property and rent agreements written in complex, legal English containing hidden risks (like mortgage liabilities or unfair forfeiture clauses) which they cannot read or understand.
-   **The Solution**: LegalLingo—a civic-tech app that simplifies legal documents into regional languages (Hindi, Marathi, Gujarati), runs a deterministic security check, and highlights action steps.
-   **How it Works**: Upload -> Local Browser text extraction -> Greedy context chunking -> Parallel AI clause simplification -> Deterministic Risk Engine evaluation -> Citizen Dashboard.
-   **Key Innovation**: The separation of AI-based simplification (which requires linguistic intelligence) from Risk Calculation (which runs on deterministic typescript rules). This eliminates AI hallucinations for critical safety checks.
-   **AI Usage**: Uses Gemini for multi-lingual translation and chunk simplification. Uses the Web Speech API to enable voice commands for older or less-literate citizens.
-   **Aadhaar Verification**: Integrates client-side Aadhaar OCR. Uses the **Verhoeff Checksum** in-memory to validate cards locally without storing the sensitive 12-digit number, protecting citizen privacy.
-   **Social Impact**: Reduces land fraud, empowers rural land buyers, and prevents costly contract disputes before they reach the courts.
-   **Future Scope**: Connecting pgvector databases to cite Indian statutes (e.g. RERA guidelines) and integrating regional OCR models.

---

# 20. "Explain It Like I'm a Teammate" Section

### What exactly does our project do and how does it work?

Imagine you are a farmer in Maharashtra buying a piece of agricultural land. The seller hands you a 15-page "Agreement for Sale" written in complex legal English. You don't read English well, and hiring a lawyer to review it costs ₹5,000, which is too expensive.

You open LegalLingo on your phone. You take photos of the agreement, your bank mortgage discharge letter (NOC), and your Aadhaar card. 

First, LegalLingo runs OCR directly in your browser to extract the text. It reads your name on your Aadhaar card and checks its validity locally using a mathematical formula called the Verhoeff checksum. The app stores only the last 4 digits of your card, so your sensitive details are safe.

Next, it divides the massive agreement into small sections, matching headings like "3. PURCHASE PRICE." It packs these sections into 8,000-character chunks so they fit nicely into the AI's memory.

The app sends these chunks to our backend, which calls the Google Gemini API to translate and explain each section in Marathi. Because we send chunks in parallel, it takes only 10 to 15 seconds to process a large document. The AI returns a simple explanation of what each clause means and what you need to do.

But we don't trust the AI to tell us if the contract is safe—AI models can make mistakes. Instead, we run the extracted facts through our own code-based **Risk Engine**. The engine checks if the seller's name matches their ID, calculates if the advance payment plus the mortgage equals the total price, and checks if a mortgage exists but there is no bank release letter uploaded.

Finally, the app renders a clean dashboard in Marathi. You see an overall completeness score, a warning saying "Seller's name is spelled differently on page 3," and a checklist of steps. You can chat with our bot in Marathi to ask questions like "When is the possession date?" and download a simplified PDF report to show the sub-registrar.

In short: LegalLingo is a digital legal assistant that extracts text locally, simplifies it using AI, checks it for fraud using a rule engine, and displays it in regional languages, helping citizens sign documents safely.

---

# 21. Technical Glossary

-   **API (Application Programming Interface)**: A set of rules that lets different software programs talk to each other. For example, our frontend calls the `/api/analyze` API to send text to the backend.
-   **OCR (Optical Character Recognition)**: Technology that reads text from images or scanned documents and converts it into selectable digital text. We use `tesseract.js` for this.
-   **LLM (Large Language Model)**: An AI model trained on massive amounts of text that can understand and write human language. We use Gemini to simplify and translate text.
-   **AI Inference**: The process of running text through an AI model to get an output (e.g., asking Gemini to translate a clause).
-   **Chunking**: Splitting a long document into smaller parts (chunks) so that it can be processed by an AI without exceeding memory limits.
-   **Client-Side**: Operations that run directly in the user's web browser (e.g., running OCR or PDF parsing on their phone CPU).
-   **Server-Side**: Operations that run on a remote server (e.g., calling the Gemini API key or writing to the database).
-   **API Key**: A secret password used by our code to authenticate with an external service (like the Google Gemini API).
-   **Environment Variable**: A configuration setting stored outside the code (e.g., `GEMINI_API_KEY`), letting us change settings without editing code.
-   **React Component**: A modular, reusable piece of code that renders a part of the web page interface (e.g., the chat button or the uploader dropzone).
-   **Next.js Route**: An API endpoint folder structure in Next.js (e.g., `/api/analyze/route.ts`) that handles incoming web requests.
-   **Verhoeff Checksum**: A mathematical algorithm used to check if a number (like an Aadhaar card number) is valid and free of typos, based on algebra.
-   **RLS (Row Level Security)**: A database feature in Supabase that ensures users can read and write only their own rows, preventing data leaks.
-   **jsPDF**: A popular JavaScript library used to create and download PDF files directly from the browser.
