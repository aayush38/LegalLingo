import { createWorker } from 'tesseract.js';
import { combineDocuments, type FileRange } from './documentChunking';

export interface OcrProgressCallback {
  (stage: string, percent: number): void;
}

export interface PageText {
  pageNumber: number;
  text: string;
  sourceFile?: string;
  sourcePage?: number;
}

export interface ExtractionResult {
  text: string;
  pages: PageText[];
  confidence: number;
  isScanned: boolean;
}

/**
 * What a file is FOR in a submission.
 *
 * A primary document is the agreement the citizen wants explained. Supporting
 * documents (NOC, PAN, 7/12 extract, prior deed) exist to corroborate it — they
 * are not simplified clause-by-clause, they are mined for facts that the Risk
 * Engine can check the primary document against.
 */
export type DocumentRole = 'primary' | 'supporting';

/** The tags offered in the uploader; mirrors the doc types the rules care about. */
export const SUPPORTING_DOC_TYPES = [
  'NOC / Release Letter',
  'PAN Card',
  '7/12 Extract',
  'Previous Title Deed',
  'Encumbrance Certificate',
  'Other Supporting Document'
] as const;

export type SupportingDocType = (typeof SUPPORTING_DOC_TYPES)[number];

/** One file queued for analysis, with the role the user assigned it. */
export interface UploadItem {
  file: File;
  role: DocumentRole;
  /** Free-form label, e.g. 'NOC / Release Letter'. Absent for the primary doc. */
  docType?: string;
}

/** One file's extraction result within a multi-file upload. */
export interface FileExtractionResult extends ExtractionResult {
  fileName: string;
  role: DocumentRole;
  docType?: string;
}

export interface MultiFileExtractionResult {
  /** Per-file results, in the order the files were submitted. */
  files: FileExtractionResult[];
  /** All files' pages, renumbered continuously and tagged with their source file. */
  pages: PageText[];
  /** Combined plain text, with a header separating each file. */
  text: string;
  /** Page range each file occupies in the combined `pages` array. */
  fileRanges: FileRange[];
  /** Page-weighted mean OCR confidence across all files. */
  confidence: number;
  /** True if any file required the OCR path. */
  isScanned: boolean;
}

/**
 * Caps per submission. Photographed documents arrive one page per image, so a
 * 12-page agreement shot page-by-page would blow a flat cap of 10 and be
 * silently truncated — images therefore get a much higher ceiling than the
 * per-file LLM cost of PDFs warrants.
 */
export const MAX_FILES_PER_UPLOAD = 24;
export const MAX_SUPPORTING_DOCS = 8;

const MAX_PDF_PAGES = 30;
const MAX_OCR_PAGES = 8;

type PdfjsModule = typeof import('pdfjs-dist');
type PdfDocument = Awaited<ReturnType<PdfjsModule['getDocument']>['promise']>;

let pdfjsPromise: Promise<PdfjsModule> | null = null;

/**
 * pdfjs-dist touches browser-only globals (e.g. DOMMatrix) as soon as its
 * module is evaluated, which crashes if loaded eagerly — Next.js still runs
 * 'use client' module code in Node during SSR. Loading it lazily, only when
 * a file is actually being processed in the browser, avoids that entirely.
 */
async function loadPdfjs(): Promise<PdfjsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.mjs',
        import.meta.url
      ).toString();
      return mod;
    });
  }
  return pdfjsPromise;
}

/**
 * Perform OCR on Image files (JPG, PNG) or extract text from PDFs. Returns
 * both the flat concatenated text (for display/storage) and a per-page
 * breakdown (for page-aware chunked analysis).
 */
export async function processDocumentFile(
  file: File,
  onProgress?: OcrProgressCallback
): Promise<ExtractionResult> {
  try {
    if (onProgress) onProgress('Uploading document...', 10);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      if (onProgress) onProgress('Reading PDF pages...', 25);

      const pdfjsLib = await loadPdfjs();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pageCount = Math.min(pdf.numPages, MAX_PDF_PAGES);

      const pages: PageText[] = [];
      for (let i = 1; i <= pageCount; i++) {
        if (onProgress) {
          onProgress(`Extracting text from page ${i} of ${pageCount}...`, 25 + Math.round((i / pageCount) * 35));
        }
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ')
          .trim();
        pages.push({ pageNumber: i, text: pageText });
      }
      const fullText = pages.map((p) => p.text).join('\n\n').trim();

      if (fullText.length > 40) {
        if (onProgress) onProgress('Understanding legal clauses...', 90);
        return { text: fullText, pages, confidence: 96, isScanned: false };
      }

      // No extractable text layer (likely a scanned/image-only PDF) — OCR the page images.
      if (onProgress) onProgress('No text layer found, running OCR on scanned pages...', 55);
      const ocrPages = await ocrPdfPages(pdf, onProgress);
      const ocrText = ocrPages.map((p) => p.text).join('\n\n').trim();

      if (ocrText.length > 30) {
        return { text: ocrText, pages: ocrPages, confidence: 82, isScanned: true };
      }

      const fallbackText = 'Could not extract readable text from this PDF. It may be a scanned document with poor image quality, or contain no text.';
      return {
        text: fallbackText,
        pages: [{ pageNumber: 1, text: fallbackText }],
        confidence: 30,
        isScanned: true
      };
    }

    // Image file: run Tesseract OCR
    if (onProgress) onProgress('Running OCR on document image...', 40);

    const worker = await createWorker('eng');
    const imageUrl = URL.createObjectURL(file);

    if (onProgress) onProgress('Extracting text characters...', 65);
    const ret = await worker.recognize(imageUrl);
    await worker.terminate();
    URL.revokeObjectURL(imageUrl);

    if (onProgress) onProgress('Simplifying language & preparing report...', 90);

    const text = ret.data.text && ret.data.text.trim().length > 30
      ? ret.data.text
      : 'Could not extract readable text from this image. Please try a clearer photo or a different file.';

    return {
      text,
      pages: [{ pageNumber: 1, text }],
      confidence: Math.round(ret.data.confidence || 60),
      isScanned: true
    };
  } catch (error) {
    console.error('Document processing failed:', error);
    if (onProgress) onProgress('Document processing failed', 100);

    const fallbackText = 'We could not process this document. Please try re-uploading it, or use a clearer scan/photo.';
    return {
      text: fallbackText,
      pages: [{ pageNumber: 1, text: fallbackText }],
      confidence: 0,
      isScanned: true
    };
  }
}

/**
 * Extracts text from several uploaded files and combines them into one logical
 * document for analysis.
 *
 * Files are processed sequentially rather than in parallel: both pdfjs and
 * Tesseract are CPU-bound in the browser's main thread, so running them
 * concurrently makes the page janky without finishing any sooner. Each file
 * gets its own slice of the progress bar.
 *
 * A file that fails extraction does not fail the batch — it is returned with
 * its error text so the caller can report it, and the remaining files are
 * still analyzed.
 */
export async function processDocumentFiles(
  items: UploadItem[],
  onProgress?: OcrProgressCallback
): Promise<MultiFileExtractionResult> {
  // Primary documents first, so page 1 of the combined document is always page
  // 1 of the agreement rather than of whatever supporting file was picked first.
  const ordered = [...items].sort((a, b) => (a.role === b.role ? 0 : a.role === 'primary' ? -1 : 1));
  const selected = ordered.slice(0, MAX_FILES_PER_UPLOAD);
  const results: FileExtractionResult[] = [];

  for (let i = 0; i < selected.length; i++) {
    const { file, role, docType } = selected[i];
    // Map each file's 0-100 progress into its own band of the overall bar.
    const bandStart = (i / selected.length) * 100;
    const bandSize = 100 / selected.length;

    const result = await processDocumentFile(file, (stage, percent) => {
      if (!onProgress) return;
      const overall = Math.round(bandStart + (percent / 100) * bandSize);
      const prefix = selected.length > 1 ? `File ${i + 1} of ${selected.length}: ` : '';
      onProgress(`${prefix}${stage}`, Math.min(overall, 100));
    });

    results.push({ ...result, fileName: file.name, role, docType });
  }

  const combined = combineDocuments(
    results.map((r) => ({ fileName: r.fileName, pages: r.pages, role: r.role, docType: r.docType }))
  );

  const text = results
    .map((r) => (selected.length > 1 ? `=== ${r.fileName} ===\n${r.text}` : r.text))
    .join('\n\n');

  const totalPages = results.reduce((sum, r) => sum + r.pages.length, 0);
  const confidence =
    totalPages > 0
      ? Math.round(results.reduce((sum, r) => sum + r.confidence * r.pages.length, 0) / totalPages)
      : 0;

  return {
    files: results,
    pages: combined.pages,
    text,
    fileRanges: combined.files,
    confidence,
    isScanned: results.some((r) => r.isScanned)
  };
}

async function ocrPdfPages(
  pdf: PdfDocument,
  onProgress?: OcrProgressCallback
): Promise<PageText[]> {
  const worker = await createWorker('eng');
  const pagesToOcr = Math.min(pdf.numPages, MAX_OCR_PAGES);
  const pages: PageText[] = [];

  try {
    for (let i = 1; i <= pagesToOcr; i++) {
      if (onProgress) {
        onProgress(`Running OCR on page ${i} of ${pagesToOcr}...`, 55 + Math.round((i / pagesToOcr) * 35));
      }

      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvas, viewport }).promise;

      const { data } = await worker.recognize(canvas);
      pages.push({ pageNumber: i, text: (data.text || '').trim() });
    }
  } finally {
    await worker.terminate();
  }

  return pages;
}
