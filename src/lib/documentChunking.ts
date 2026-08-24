export interface PageInput {
  /** Page number within the combined document (1-based, continuous across files). */
  pageNumber: number;
  text: string;
  /** File this page came from — set when multiple documents were combined. */
  sourceFile?: string;
  /** Page number within its own source file, before combining renumbered it. */
  sourcePage?: number;
}

export interface SourceDocument {
  fileName: string;
  pages: PageInput[];
}

export interface FileRange {
  fileName: string;
  /** Inclusive page range this file occupies in the combined document. */
  startPage: number;
  endPage: number;
  pageCount: number;
  charCount: number;
}

export interface CombinedDocument {
  pages: PageInput[];
  files: FileRange[];
  totalPages: number;
}

export interface Section {
  page: number;
  text: string;
  sourceFile?: string;
}

export interface Chunk {
  index: number;
  startPage: number;
  endPage: number;
  text: string;
  /** Sections included in this chunk, in order, each still tagged with its page. */
  sections: Section[];
  /** File all sections in this chunk came from — chunks never span two files. */
  sourceFile?: string;
}

const MAX_CHARS_PER_CHUNK = 8000;
const OVERSIZED_WINDOW = 7000;
const OVERSIZED_OVERLAP = 500;

// Matches numbered legal section/clause headings: "1. DEFINITIONS", "6.5 Travel...",
// "21.1 The Service Provider...". This is the dominant structure in Indian legal
// drafting and in both of this app's test documents.
const HEADING_RE = /^\s*\d+(?:\.\d+)*\.?\s+\S/;

/**
 * Merges several uploaded files into one logical document.
 *
 * Pages are renumbered continuously across files so every page number in the
 * final analysis is unique and orderable, while each page keeps a `sourceFile`
 * and its original in-file `sourcePage` so the UI can still say "page 2 of
 * lease.pdf". Empty pages are dropped here, before section splitting, so they
 * can't produce empty chunks downstream.
 */
export function combineDocuments(docs: SourceDocument[]): CombinedDocument {
  const pages: PageInput[] = [];
  const files: FileRange[] = [];

  for (const doc of docs) {
    const usable = (doc.pages || []).filter((p) => p && typeof p.text === 'string' && p.text.trim());
    if (usable.length === 0) continue;

    const startPage = pages.length + 1;
    let charCount = 0;

    for (const page of usable) {
      charCount += page.text.length;
      pages.push({
        pageNumber: pages.length + 1,
        text: page.text,
        sourceFile: doc.fileName,
        sourcePage: page.pageNumber
      });
    }

    files.push({
      fileName: doc.fileName,
      startPage,
      endPage: pages.length,
      pageCount: usable.length,
      charCount
    });
  }

  return { pages, files, totalPages: pages.length };
}

/**
 * Splits each page's text into sections at numbered-heading boundaries, falling
 * back to blank-line paragraph splitting for pages with no detected headings
 * (affidavits, prose-style notices, etc). Every section keeps its source page —
 * this is what lets the final analysis attribute a clause back to a page number.
 */
export function splitIntoSections(pages: PageInput[]): Section[] {
  const sections: Section[] = [];

  for (const page of pages) {
    const lines = page.text.split('\n');
    const headingIndices: number[] = [];
    lines.forEach((line, i) => {
      if (HEADING_RE.test(line)) headingIndices.push(i);
    });

    const sourceFile = page.sourceFile;

    if (headingIndices.length >= 1) {
      // Text before the first heading (if any) is its own section.
      if (headingIndices[0] > 0) {
        const pre = lines.slice(0, headingIndices[0]).join('\n').trim();
        if (pre) sections.push({ page: page.pageNumber, text: pre, sourceFile });
      }
      for (let i = 0; i < headingIndices.length; i++) {
        const start = headingIndices[i];
        const end = i + 1 < headingIndices.length ? headingIndices[i + 1] : lines.length;
        const text = lines.slice(start, end).join('\n').trim();
        if (text) sections.push({ page: page.pageNumber, text, sourceFile });
      }
    } else {
      // No numbered headings on this page — fall back to paragraph splitting.
      const paras = page.text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
      if (paras.length > 0) {
        for (const p of paras) sections.push({ page: page.pageNumber, text: p, sourceFile });
      } else if (page.text.trim()) {
        sections.push({ page: page.pageNumber, text: page.text.trim(), sourceFile });
      }
    }
  }

  return sections;
}

/** Splits a single oversized section into overlapping windows so a clause larger
 * than the chunk budget never gets hard-truncated at an arbitrary character cut. */
function splitOversizedSection(section: Section): Section[] {
  const { text, page, sourceFile } = section;
  if (text.length <= MAX_CHARS_PER_CHUNK) return [section];

  const windows: Section[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + OVERSIZED_WINDOW, text.length);
    windows.push({ page, text: text.slice(start, end), sourceFile });
    if (end >= text.length) break;
    start = end - OVERSIZED_OVERLAP;
  }
  return windows;
}

/**
 * Greedily packs sections into chunks in document order until the char budget
 * is hit. Guarantees every section (and therefore every page) lands in exactly
 * one chunk — there is no slice/cutoff step, so nothing is silently discarded.
 *
 * A chunk never spans two source files: when several documents are combined,
 * the chunk in progress is flushed at each file boundary. Mixing two unrelated
 * agreements into one excerpt makes the model conflate their parties, amounts
 * and clauses, so the boundary is worth the occasional short chunk.
 */
export function buildChunks(sections: Section[], maxChars = MAX_CHARS_PER_CHUNK): Chunk[] {
  const expanded = sections.flatMap((s) => (s.text.length > maxChars ? splitOversizedSection(s) : [s]));

  const chunks: Chunk[] = [];
  let current: Section[] = [];
  let currentLen = 0;

  const flush = () => {
    if (current.length === 0) return;
    chunks.push({
      index: chunks.length,
      startPage: current[0].page,
      endPage: current[current.length - 1].page,
      text: current.map((s) => `[[PAGE ${s.page}]]\n${s.text}`).join('\n\n'),
      sections: current,
      sourceFile: current[0].sourceFile
    });
    current = [];
    currentLen = 0;
  };

  for (const section of expanded) {
    const crossesFileBoundary = current.length > 0 && current[0].sourceFile !== section.sourceFile;
    if (crossesFileBoundary || (currentLen > 0 && currentLen + section.text.length > maxChars)) {
      flush();
    }
    current.push(section);
    currentLen += section.text.length;
  }
  flush();

  return chunks;
}

/**
 * Normalizes text into a short fingerprint (trimmed, lowercased, whitespace
 * collapsed, first ~120 chars) for near-duplicate detection at chunk-boundary
 * overlaps. Drops later items whose fingerprint matches or is contained in /
 * contains an earlier one, keeping the first occurrence (preserves order).
 */
export function dedupeItems<T>(items: T[], getFingerprintText: (item: T) => string): T[] {
  const seen: string[] = [];
  const result: T[] = [];

  for (const item of items) {
    const raw = getFingerprintText(item) || '';
    const fp = raw.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 120);
    if (!fp) {
      result.push(item);
      continue;
    }
    const isDuplicate = seen.some((s) => s === fp || (fp.length > 20 && (s.includes(fp) || fp.includes(s))));
    if (!isDuplicate) {
      seen.push(fp);
      result.push(item);
    }
  }

  return result;
}
