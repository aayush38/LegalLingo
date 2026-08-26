'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { DocumentAnalysis, LanguageCode } from '@/lib/types';
import { SAMPLE_AGRICULTURAL_SALE_AGREEMENT } from '@/lib/sampleDocs';
import { analyzeDocumentText, collectTranslatableStrings, translateStrings } from '@/lib/ai';
import { processDocumentFiles, MAX_FILES_PER_UPLOAD, type UploadItem } from '@/lib/ocr';
import { useAuth } from '@/context/AuthContext';
import {
  saveAnalysis,
  deleteDocumentSet,
  setChecklistItemCompleted
} from '@/lib/persistence/saveAnalysis';
import { loadSavedDocuments } from '@/lib/persistence/loadDocuments';

const LANGUAGE_STORAGE_KEY = 'legallingo_language';
/**
 * Key used by earlier builds to keep documents on the device. Nothing writes
 * to it any more; it is only read in order to be deleted.
 */
const LEGACY_DOCS_STORAGE_KEY = 'legallingo_saved_docs';
const SUPPORTED_LANGUAGES: LanguageCode[] = ['en', 'hi', 'mr', 'gu'];

interface AppContextType {
  currentAnalysis: DocumentAnalysis | null;
  language: LanguageCode;
  translationCache: Record<string, string>;
  isTranslating: boolean;
  privacyShield: boolean;
  isAnalyzing: boolean;
  uploadProgressStage: string;
  uploadProgressPercent: number;
  ocrConfidence: number;
  savedDocuments: DocumentAnalysis[];
  /** True while the signed-in document list is being fetched or written. */
  isSyncing: boolean;
  /** Set when the last save failed, so the UI can say so instead of pretending. */
  syncError: string | null;
  isChatOpen: boolean;
  selectedParagraphId: number | null;
  setCurrentAnalysis: (analysis: any) => void;
  setIsChatOpen: (open: boolean) => void;
  setLanguage: (lang: LanguageCode) => void;
  togglePrivacyShield: () => void;
  setSelectedParagraphId: (id: number | null) => void;
  loadSampleDocument: () => void;
  processUploadedFile: (file: File) => Promise<void>;
  processUploadedFiles: (files: File[]) => Promise<void>;
  processUploadedItems: (items: UploadItem[]) => Promise<void>;
  updateExtractedText: (newText: string) => Promise<void>;
  toggleChecklistItem: (itemId: string) => void;
  deleteSavedDocument: (docId: string) => void;
  openSavedDocument: (docId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentAnalysis, setCurrentAnalysis] = useState<DocumentAnalysis | null>(null);
  // Starts as 'en' to match server-rendered output, then restored from
  // localStorage post-mount (see effect below) to avoid a hydration mismatch.
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [translationCacheByLang, setTranslationCacheByLang] = useState<Record<LanguageCode, Record<string, string>>>({
    en: {}, hi: {}, mr: {}, gu: {}
  });
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [privacyShield, setPrivacyShield] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [uploadProgressStage, setUploadProgressStage] = useState<string>('');
  const [uploadProgressPercent, setUploadProgressPercent] = useState<number>(0);
  const [ocrConfidence, setOcrConfidence] = useState<number>(94);
  const [savedDocuments, setSavedDocuments] = useState<DocumentAnalysis[]>([]);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [selectedParagraphId, setSelectedParagraphId] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Who, if anyone, is signed in. Documents are saved only for signed-in users.
  const { user } = useAuth();

  const translationCacheRef = useRef(translationCacheByLang);
  useEffect(() => {
    translationCacheRef.current = translationCacheByLang;
  }, [translationCacheByLang]);

  /**
   * Removes any documents an earlier build left on this device.
   *
   * Documents are now account-only: nothing is written to localStorage, and a
   * device that already holds documents from the previous behaviour is cleared
   * on first load. Someone who analysed a sale deed on a borrowed handset
   * should not find it still there afterwards.
   */
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_DOCS_STORAGE_KEY);
    } catch (e) {
      console.warn('Could not clear legacy document storage:', e);
    }
  }, []);

  // Restore last-selected language (after mount, to avoid a hydration mismatch)
  useEffect(() => {
    try {
      const storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode | null;
      if (storedLang && SUPPORTED_LANGUAGES.includes(storedLang)) {
        setLanguage(storedLang);
      }
    } catch (e) {
      console.warn('LocalStorage language read failed:', e);
    }
  }, []);

  // Persist language choice and keep <html lang> in sync
  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (e) {
      console.warn('LocalStorage language save failed:', e);
    }
    document.documentElement.lang = language;
  }, [language]);

  // Translate the current document's AI-generated content into the selected
  // language, on demand. Cached per language so switching back is instant.
  useEffect(() => {
    if (language === 'en' || !currentAnalysis) return;

    const required = collectTranslatableStrings(currentAnalysis);
    const cached = translationCacheRef.current[language] || {};
    const missing = required.filter((s) => !(s in cached));
    if (missing.length === 0) return;

    let cancelled = false;
    setIsTranslating(true);

    translateStrings(missing, language)
      .then((map) => {
        if (cancelled || Object.keys(map).length === 0) return;
        setTranslationCacheByLang((prev) => ({
          ...prev,
          [language]: { ...prev[language], ...map }
        }));
      })
      .finally(() => {
        if (!cancelled) setIsTranslating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [language, currentAnalysis]);

  /**
   * Swaps the document list over when the signed-in user changes.
   *
   * Signing in shows what is in the account; signing out falls back to whatever
   * is on this device. Local documents are never deleted by this — a guest who
   * signs in and out again still finds their work.
   */
  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      if (!user) {
        // Signed out. There is no on-device library to fall back to, and
        // whatever was on screen belonged to the account that just left, so the
        // list is emptied rather than repopulated.
        if (!cancelled) setSavedDocuments([]);
        return;
      }

      if (!cancelled) setIsSyncing(true);
      try {
        const docs = await loadSavedDocuments();
        if (!cancelled) setSavedDocuments(docs);
      } finally {
        if (!cancelled) setIsSyncing(false);
      }
    };

    void sync();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Save to local storage whenever savedDocuments change
  /**
   * Updates the in-memory document list.
   *
   * Nothing is written to the device. For a signed-in user the durable copy is
   * in Supabase; for a guest there is deliberately no durable copy at all, so
   * this list lasts only as long as the tab.
   */
  const setDocuments = (docs: DocumentAnalysis[]) => {
    setSavedDocuments(docs);
  };

  const togglePrivacyShield = () => {
    setPrivacyShield((prev) => !prev);
  };

  const loadSampleDocument = () => {
    setIsAnalyzing(true);
    setUploadProgressStage('Loading sample document...');
    setUploadProgressPercent(30);

    setTimeout(() => {
      setUploadProgressStage('Understanding legal clauses...');
      setUploadProgressPercent(75);
    }, 400);

    setTimeout(() => {
      setUploadProgressStage('Preparing LegalLingo report...');
      setUploadProgressPercent(100);
      setCurrentAnalysis(SAMPLE_AGRICULTURAL_SALE_AGREEMENT);
      setIsAnalyzing(false);

      // Save sample if not exists
      if (!savedDocuments.some((d) => d.id === SAMPLE_AGRICULTURAL_SALE_AGREEMENT.id)) {
        setDocuments([SAMPLE_AGRICULTURAL_SALE_AGREEMENT, ...savedDocuments]);
      }
    }, 800);
  };

  /**
   * Runs OCR/extraction on a submission and analyzes it as one unit.
   *
   * A submission is one primary document (the agreement being explained) plus
   * any supporting documents (NOC, PAN, 7/12 extract...). They are combined
   * server-side rather than analyzed separately, so the summary, checklist and
   * cross-document risk checks all see the whole set.
   */
  const processUploadedItems = async (items: UploadItem[]) => {
    const selected = items.slice(0, MAX_FILES_PER_UPLOAD);
    if (selected.length === 0) return;

    const primary = selected.find((i) => i.role === 'primary') ?? selected[0];
    const supportingCount = selected.filter((i) => i.role === 'supporting').length;

    setIsAnalyzing(true);
    setUploadProgressStage(
      supportingCount > 0
        ? `Uploading document + ${supportingCount} supporting ${supportingCount === 1 ? 'file' : 'files'}...`
        : 'Uploading document...'
    );
    setUploadProgressPercent(5);

    try {
      const extraction = await processDocumentFiles(selected, (stage, percent) => {
        setUploadProgressStage(stage);
        setUploadProgressPercent(percent);
      });

      setOcrConfidence(extraction.confidence);
      setUploadProgressStage('Understanding legal clauses...');
      setUploadProgressPercent(92);

      const title =
        supportingCount > 0
          ? `${primary.file.name} + ${supportingCount} supporting`
          : primary.file.name;

      const analysis = await analyzeDocumentText(
        extraction.text,
        title,
        extraction.pages,
        extraction.files.map((f) => ({
          fileName: f.fileName,
          pages: f.pages,
          role: f.role,
          docType: f.docType
        }))
      );
      analysis.ocrConfidence = extraction.confidence;
      analysis.isScanned = extraction.isScanned;
      analysis.sourceFiles = extraction.files.map((f) => f.fileName);
      // The route returns supportingDocuments enriched with a summary and the
      // key facts it read out. Only synthesise a bare list locally when the
      // server sent none — overwriting it here would throw that work away.
      if (!analysis.supportingDocuments || analysis.supportingDocuments.length === 0) {
        const localSupporting = extraction.files
          .filter((f) => f.role === 'supporting')
          .map((f) => ({ fileName: f.fileName, docType: f.docType }));
        if (localSupporting.length > 0) analysis.supportingDocuments = localSupporting;
      }

      setUploadProgressPercent(100);
      setCurrentAnalysis(analysis);

      if (user) {
        // Signed in: the account is the source of truth. The save runs before
        // the list is updated so the card carries its real document_set id and
        // can be opened or deleted straight away.
        setIsSyncing(true);
        setSyncError(null);
        const saved = await saveAnalysis(
          analysis,
          extraction,
          selected.map((i) => ({ file: i.file, role: i.role, docType: i.docType }))
        );
        setIsSyncing(false);

        if (saved.ok && saved.documentSetId) {
          analysis.id = saved.documentSetId;
          if (saved.failedUploads && saved.failedUploads.length > 0) {
            // The analysis is safe; only the original scans are missing.
            console.warn('[sync] originals not uploaded:', saved.failedUploads.join(', '));
          }
        } else {
          // Never silently drop the document. It stays in the session list and
          // the UI can report that this one is not backed up.
          setSyncError(saved.error ?? 'save_failed');
        }
        setDocuments([analysis, ...savedDocuments]);
      } else {
        setDocuments([analysis, ...savedDocuments]);
      }
    } catch (error) {
      console.error('File processing error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /** Back-compat: a bare File[] is treated as one primary plus extra primaries. */
  const processUploadedFiles = (files: File[]) =>
    processUploadedItems(files.map((file) => ({ file, role: 'primary' as const })));

  const processUploadedFile = (file: File) => processUploadedFiles([file]);

  const updateExtractedText = async (newText: string) => {
    if (!currentAnalysis) return;
    setIsAnalyzing(true);
    setUploadProgressStage('Re-running analysis on edited text...');
    setUploadProgressPercent(50);

    try {
      const updated = await analyzeDocumentText(newText, currentAnalysis.documentTitle);
      updated.id = currentAnalysis.id;
      setCurrentAnalysis(updated);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleChecklistItem = (itemId: string) => {
    if (!currentAnalysis) return;
    const target = currentAnalysis.recommendedActions.find((i) => i.id === itemId);
    if (!target) return;
    const nextCompleted = !target.completed;

    const updatedActions = currentAnalysis.recommendedActions.map((item) =>
      item.id === itemId ? { ...item, completed: nextCompleted } : item
    );
    const updatedDoc = { ...currentAnalysis, recommendedActions: updatedActions };
    setCurrentAnalysis(updatedDoc);
    setDocuments(savedDocuments.map((doc) => (doc.id === updatedDoc.id ? updatedDoc : doc)));

    // Ticking a box should feel instant, so the write is fired without
    // awaiting it. The optimistic state above already reflects the change, and
    // a failed tick is recoverable by ticking again.
    if (user) {
      void setChecklistItemCompleted(updatedDoc.id, itemId, nextCompleted);
    }
  };

  const deleteSavedDocument = (docId: string) => {
    const filtered = savedDocuments.filter((d) => d.id !== docId);
    setDocuments(filtered);
    if (currentAnalysis?.id === docId) {
      setCurrentAnalysis(filtered[0] || null);
    }
    if (user) {
      // Removes the stored originals as well as the rows — see deleteDocumentSet.
      void deleteDocumentSet(docId);
    }
  };

  /**
   * Makes a saved document the one on screen.
   *
   * Previously the saved-document cards navigated to the reader without
   * selecting anything, so every card opened whichever analysis happened to be
   * active. With documents actually persisting, that would show one deed while
   * claiming to show another.
   */
  const openSavedDocument = (docId: string) => {
    const doc = savedDocuments.find((d) => d.id === docId);
    if (doc) setCurrentAnalysis(doc);
  };

  return (
    <AppContext.Provider
      value={{
        currentAnalysis,
        language,
        translationCache: translationCacheByLang[language] || {},
        isTranslating,
        privacyShield,
        isAnalyzing,
        uploadProgressStage,
        uploadProgressPercent,
        ocrConfidence,
        savedDocuments,
        isSyncing,
        syncError,
        isChatOpen,
        selectedParagraphId,
        setCurrentAnalysis,
        setIsChatOpen,
        setLanguage,
        togglePrivacyShield,
        setSelectedParagraphId,
        loadSampleDocument,
        processUploadedFile,
        processUploadedFiles,
        processUploadedItems,
        updateExtractedText,
        toggleChecklistItem,
        deleteSavedDocument,
        openSavedDocument,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
