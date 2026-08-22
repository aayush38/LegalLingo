# LegalLingo 🛡️
### Understand. Verify. Act.

> **Citizen Legal-Document Intelligence & Cross-Document Verification Platform**

LegalLingo is an evidence-aware, document-grounded intelligence platform designed to empower citizens to understand complex legal documents, cross-verify supporting identity and property records, detect rule-based attention flags, and retrieve grounded legal knowledge.

---

## 🌟 Key Architecture & Pipeline

```text
UPLOAD MAIN & SUPPORTING DOCUMENTS
   ↓
TEXT EXTRACTION & OPTICAL CHARACTER RECOGNITION (PyPDF / OCR)
   ↓
STRUCTURED FIELD & CLAUSE EXTRACTION (Gemini LLM)
   ↓
CROSS-DOCUMENT VALIDATION ENGINE (Identity, Property, Financial, NOC)
   ↓
DETERMINISTIC ATTENTION RULE ENGINE (Mortgage, Forfeiture, Deadlines)
   ↓
GROUNDED LEGAL RAG RETRIEVAL (KanoonGPT Corpus)
   ↓
GROUNDED CITIZEN EXPLANATION & ATTENTION REPORT
```

---

## 🚀 Features

- 📑 **Primary Document Support**: Agreement for Sale / Sale Agreement (Maharashtra & Central Indian Law Focus).
- 🪪 **Cross-Document Verification**: Compares extracted facts across Main Sale Agreement, Seller PAN, Previous Title Deeds, and Bank NOCs.
- ⚠️ **Attention & Verification Report**: Categorizes action items into `STANDARD`, `REVIEW`, and `HIGH_ATTENTION` (e.g. Existing Mortgage detected without Bank Release NOC).
- 📜 **KanoonGPT RAG Legal Retrieval**: Retrieves grounded legal citations from Maharashtra Land Revenue Code 1966, Transfer of Property Act 1882, and Registration Act 1908.
- 💡 **Side-by-Side Citizen Reader**: Shows original legal clause alongside plain citizen meaning, key questions, and difficulty explanation.
- 💬 **Ask LegalLingo Clause Q&A**: Grounded Q&A over specific clauses with strict hallucination safeguards.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Python 3.14, FastAPI, Uvicorn, Pydantic
- **LLM Engine**: Google Gemini API (`GEMINI_API_KEY`)
- **Text Extraction & OCR**: PyPDF, Scikit-learn, Numpy
- **Database & Storage**: SQLite / In-Memory JSON store

---

## 📁 Monorepo Project Structure

```
MMM/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI Application Entrypoint
│   │   ├── api/
│   │   │   └── endpoints.py     # REST Endpoints (/health, /analyze, /demo/load, /clauses/ask)
│   │   ├── services/
│   │   │   ├── ocr_parser.py    # PDF Extraction & OCR Service
│   │   │   ├── extractor.py     # Gemini Structured Field Extractor
│   │   │   ├── validation.py    # Cross-Document Validation Engine
│   │   │   ├── rules_engine.py  # Deterministic Attention Rules Engine
│   │   │   ├── rag_engine.py    # Grounded KanoonGPT RAG Retrieval Engine
│   │   │   └── llm_explainer.py # Gemini Citizen Explainer Service
│   │   └── db/
│   │       └── database.py      # SQLite Storage & Vector Corpus
│   └── tests/
│       └── test_pipeline.py     # Backend Pytest Suite
│
├── scripts/
│   ├── ingest_kanoon_dataset.py # KanoonGPT Dataset Ingestion Script
│   ├── evaluate_adalat_rag.py   # Adalat AI RAG Evaluation Script
│   └── seed_demo_data.py        # Demo Case Seeding Script
│
├── src/                         # Next.js 15 Frontend
│   ├── app/                     # Next.js App Router Pages
│   ├── components/              # React UI Components
│   └── lib/                     # API Client & Utilities
│
├── .env                         # Backend Environment Variables
├── .env.local                   # Frontend Environment Variables
└── README.md
```

---

## ⚡ Quick Start

### 1. Environment Setup

Copy `.env.example` to `.env` and `.env.local` and add your Google Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
LLM_PROVIDER=gemini
BACKEND_URL=http://localhost:8000
```

### 2. Run Backend (FastAPI)

```bash
# From workspace root
$env:PYTHONPATH='backend'
python backend/app/main.py
```
FastAPI server will start at `http://localhost:8000`. Docs available at `http://localhost:8000/docs`.

### 3. Run Frontend (Next.js)

```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 4. Run Demonstration Dataset

Click **"Try Sample Document"** on the home page or run:

```bash
python scripts/seed_demo_data.py
```

Expected happy-path findings:
1. **High Attention**: Existing bank mortgage (₹2,80,000) detected without Bank Release NOC.
2. **Review**: Seller middle name variation across Agreement and PAN card.
3. **Consistent**: Property Gat number matches supporting previous deed.
4. **Review**: Advance forfeiture deadline (15 September 2026).

---

## ⚖️ Legal Disclaimer

LegalLingo provides AI-assisted document explanations and informational guidance. It does not constitute legal advice or replace consultation with a qualified legal professional. Important legal, financial, and property matters should be independently verified with the appropriate professional or official authority.
