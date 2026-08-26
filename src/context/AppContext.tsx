'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { DocumentAnalysis, LanguageCode, UploadedFileItem, DocumentRole, ClauseAnalysis } from '@/lib/types';
import { SAMPLE_AGRICULTURAL_SALE_AGREEMENT } from '@/lib/sampleDocs';
import { analyzeDocumentText, collectTranslatableStrings, translateStrings } from '@/lib/ai';
import { processDocumentFiles, MAX_FILES_PER_UPLOAD } from '@/lib/ocr';

const LANGUAGE_STORAGE_KEY = 'legallingo_language';
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
  isChatOpen: boolean;
  selectedClause: ClauseAnalysis | null;
  selectedParagraphId: number | null;
  selectedFiles: UploadedFileItem[];
  showDocumentHealth: boolean;
  setShowDocumentHealth: (show: boolean) => void;
  addSelectedFiles: (files: File[]) => void;
  removeSelectedFile: (id: string) => void;
  updateFileRole: (id: string, role: DocumentRole) => void;
  clearSelectedFiles: () => void;
  setCurrentAnalysis: (analysis: any) => void;
  setIsChatOpen: (open: boolean) => void;
  setSelectedClause: (clause: ClauseAnalysis | null) => void;
  setLanguage: (lang: LanguageCode) => void;
  togglePrivacyShield: () => void;
  setSelectedParagraphId: (id: number | null) => void;
  loadSampleDocument: () => void;
  processUploadedFile: (file: File) => Promise<void>;
  processUploadedFiles: (files?: (File | UploadedFileItem)[]) => Promise<void>;
  updateExtractedText: (newText: string) => Promise<void>;
  toggleChecklistItem: (itemId: string) => void;
  deleteSavedDocument: (docId: string) => void;
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
  const [selectedClause, setSelectedClause] = useState<ClauseAnalysis | null>(null);
  const [selectedParagraphId, setSelectedParagraphId] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<UploadedFileItem[]>([]);
  const [showDocumentHealth, setShowDocumentHealth] = useState<boolean>(false);

  // Cleanup object URLs on unmount or file removal
  useEffect(() => {
    return () => {
      selectedFiles.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [selectedFiles]);

  const addSelectedFiles = (newFiles: File[]) => {
    if (!newFiles || newFiles.length === 0) return;
    setSelectedFiles((prev) => {
      const hasPrimary = prev.some((item) => item.role === 'primary');
      const itemsToAdd: UploadedFileItem[] = newFiles.map((file, idx) => {
        const isImg = file.type.startsWith('image/') || /\.(png|jpe?g)$/i.test(file.name);
        const previewUrl = isImg ? URL.createObjectURL(file) : undefined;
        const role: DocumentRole = (!hasPrimary && idx === 0) ? 'primary' : 'supporting';
        return {
          id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${idx}`,
          file,
          role,
          previewUrl,
        };
      });
      return [...prev, ...itemsToAdd].slice(0, MAX_FILES_PER_UPLOAD);
    });
  };

  const removeSelectedFile = (id: string) => {
    setSelectedFiles((prev) => {
      const itemToRemove = prev.find((item) => item.id === id);
      if (itemToRemove?.previewUrl) {
        URL.revokeObjectURL(itemToRemove.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const updateFileRole = (id: string, role: DocumentRole) => {
    setSelectedFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, role } : item))
    );
  };

  const clearSelectedFiles = () => {
    selectedFiles.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setSelectedFiles([]);
  };

  const translationCacheRef = useRef(translationCacheByLang);
  useEffect(() => {
    translationCacheRef.current = translationCacheByLang;
  }, [translationCacheByLang]);

  // Load initial sample document or local storage history
  useEffect(() => {
    try {
      const storedDocs = localStorage.getItem('legallingo_saved_docs');
      if (storedDocs) {
        const parsed = JSON.parse(storedDocs);
        setSavedDocuments(parsed);
      } else {
        setSavedDocuments([SAMPLE_AGRICULTURAL_SALE_AGREEMENT]);
      }
    } catch (e) {
      setSavedDocuments([SAMPLE_AGRICULTURAL_SALE_AGREEMENT]);
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

  // Save to local storage whenever savedDocuments change
  const persistSavedDocs = (docs: DocumentAnalysis[]) => {
    setSavedDocuments(docs);
    try {
      localStorage.setItem('legallingo_saved_docs', JSON.stringify(docs));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  };

  const togglePrivacyShield = () => {
    setPrivacyShield((prev) => !prev);
  };

  const loadSampleDocument = () => {
    setShowDocumentHealth(false);
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
        persistSavedDocs([SAMPLE_AGRICULTURAL_SALE_AGREEMENT, ...savedDocuments]);
      }
    }, 800);
  };

  /**
   * Runs OCR/extraction on one or more uploaded files and analyzes them as a
   * single submission. Multiple files are combined server-side rather than
   * analyzed separately, so the summary and checklist cover the whole set.
   */
  const processUploadedFiles = async (filesOrItems?: (File | UploadedFileItem)[]) => {
    let itemsToProcess: UploadedFileItem[] = [];

    if (filesOrItems && filesOrItems.length > 0) {
      itemsToProcess = filesOrItems.map((item, idx) => {
        if ('file' in item && (item as UploadedFileItem).file instanceof File) {
          return item as UploadedFileItem;
        }
        const file = item as File;
        return {
          id: `doc_${Date.now()}_${idx}`,
          file,
          role: (idx === 0 ? 'primary' : 'supporting') as DocumentRole,
        };
      });
    } else {
      itemsToProcess = selectedFiles;
    }

    if (itemsToProcess.length === 0) return;

    // Order so primary files come first, followed by supporting files
    const sortedItems = [...itemsToProcess].sort((a, b) => {
      if (a.role === 'primary' && b.role !== 'primary') return -1;
      if (a.role !== 'primary' && b.role === 'primary') return 1;
      return 0;
    });

    const selected = sortedItems.map((item) => item.file).slice(0, MAX_FILES_PER_UPLOAD);
    if (itemsToProcess.length === 0) return;

    setShowDocumentHealth(false);
    setIsAnalyzing(true);
    setUploadProgressStage(
      selected.length > 1 ? `Uploading ${selected.length} documents...` : 'Uploading document...'
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
        selected.length > 1
          ? `${selected[0].name} + ${selected.length - 1} more`
          : selected[0].name;

      const analysis = await analyzeDocumentText(
        extraction.text,
        title,
        extraction.pages,
        extraction.files.map((f) => ({ fileName: f.fileName, pages: f.pages }))
      );
      analysis.ocrConfidence = extraction.confidence;
      analysis.isScanned = extraction.isScanned;
      analysis.sourceFiles = extraction.files.map((f) => f.fileName);

      setUploadProgressPercent(100);
      setCurrentAnalysis(analysis);
      persistSavedDocs([analysis, ...savedDocuments]);
    } catch (error) {
      console.error('File processing error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

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
    const updatedActions = currentAnalysis.recommendedActions.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    const updatedDoc = { ...currentAnalysis, recommendedActions: updatedActions };
    setCurrentAnalysis(updatedDoc);
    persistSavedDocs(
      savedDocuments.map((doc) => (doc.id === updatedDoc.id ? updatedDoc : doc))
    );
  };

  const deleteSavedDocument = (docId: string) => {
    const filtered = savedDocuments.filter((d) => d.id !== docId);
    persistSavedDocs(filtered);
    if (currentAnalysis?.id === docId) {
      setCurrentAnalysis(filtered[0] || null);
    }
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
        isChatOpen,
        selectedClause,
        selectedParagraphId,
        selectedFiles,
        showDocumentHealth,
        setShowDocumentHealth,
        addSelectedFiles,
        removeSelectedFile,
        updateFileRole,
        clearSelectedFiles,
        setCurrentAnalysis,
        setIsChatOpen,
        setSelectedClause,
        setLanguage,
        togglePrivacyShield,
        setSelectedParagraphId,
        loadSampleDocument,
        processUploadedFile,
        processUploadedFiles,
        updateExtractedText,
        toggleChecklistItem,
        deleteSavedDocument,
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
