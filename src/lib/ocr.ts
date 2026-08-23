import { createWorker } from 'tesseract.js';

export interface OcrProgressCallback {
  (stage: string, percent: number): void;
}

export interface PageText {
  pageNumber: number;
  text: string;
}

export interface ExtractionResult {
  text: string;
  pages: PageText[];
  confidence: number;
  isScanned: boolean;
}

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
