'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { DocumentAnalysis, LanguageCode } from '@/lib/types';
import { SAMPLE_AGRICULTURAL_SALE_AGREEMENT } from '@/lib/sampleDocs';
import { analyzeDocumentText, collectTranslatableStrings, translateStrings } from '@/lib/ai';
import { processDocumentFile } from '@/lib/ocr';

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
  selectedParagraphId: number | null;
  setCurrentAnalysis: (analysis: any) => void;
  setIsChatOpen: (open: boolean) => void;
  setLanguage: (lang: LanguageCode) => void;
  togglePrivacyShield: () => void;
  setSelectedParagraphId: (id: number | null) => void;
  loadSampleDocument: () => void;
  processUploadedFile: (file: File) => Promise<void>;
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
  const [selectedParagraphId, setSelectedParagraphId] = useState<number | null>(null);

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

  const processUploadedFile = async (file: File) => {
    setIsAnalyzing(true);
    setUploadProgressStage('Uploading document...');
    setUploadProgressPercent(10);

    try {
      const { text, pages, confidence, isScanned } = await processDocumentFile(
        file,
        (stage, percent) => {
          setUploadProgressStage(stage);
          setUploadProgressPercent(percent);
        }
      );

      setOcrConfidence(confidence);
      const analysis = await analyzeDocumentText(text, file.name, pages);
      analysis.ocrConfidence = confidence;
      analysis.isScanned = isScanned;

      setCurrentAnalysis(analysis);
      persistSavedDocs([analysis, ...savedDocuments]);
    } catch (error) {
      console.error('File processing error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

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
        selectedParagraphId,
        setCurrentAnalysis,
        setIsChatOpen,
        setLanguage,
        togglePrivacyShield,
        setSelectedParagraphId,
        loadSampleDocument,
        processUploadedFile,
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
