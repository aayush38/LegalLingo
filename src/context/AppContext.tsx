'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { DocumentAnalysis, LanguageCode } from '@/lib/types';
import { SAMPLE_AGRICULTURAL_SALE_AGREEMENT } from '@/lib/sampleDocs';
import { analyzeDocumentText } from '@/lib/ai';
import { processDocumentFile } from '@/lib/ocr';

interface AppContextType {
  currentAnalysis: DocumentAnalysis | null;
  language: LanguageCode;
  privacyShield: boolean;
  isAnalyzing: boolean;
  uploadProgressStage: string;
  uploadProgressPercent: number;
  ocrConfidence: number;
  savedDocuments: DocumentAnalysis[];
  isChatOpen: boolean;
  selectedParagraphId: number | null;
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
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [privacyShield, setPrivacyShield] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [uploadProgressStage, setUploadProgressStage] = useState<string>('');
  const [uploadProgressPercent, setUploadProgressPercent] = useState<number>(0);
  const [ocrConfidence, setOcrConfidence] = useState<number>(94);
  const [savedDocuments, setSavedDocuments] = useState<DocumentAnalysis[]>([]);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [selectedParagraphId, setSelectedParagraphId] = useState<number | null>(null);

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
      const { text, confidence, isScanned } = await processDocumentFile(
        file,
        (stage, percent) => {
          setUploadProgressStage(stage);
          setUploadProgressPercent(percent);
        }
      );

      setOcrConfidence(confidence);
      const analysis = await analyzeDocumentText(text, file.name);
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
        privacyShield,
        isAnalyzing,
        uploadProgressStage,
        uploadProgressPercent,
        ocrConfidence,
        savedDocuments,
        isChatOpen,
        selectedParagraphId,
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
