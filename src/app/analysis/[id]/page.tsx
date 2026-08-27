'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { SAMPLE_AGRICULTURAL_SALE_AGREEMENT } from '@/lib/sampleDocs';
import { DocumentAnalysis } from '@/lib/types';
import { getTranslation } from '@/lib/translations';
import { applyPrivacyMask } from '@/lib/privacy';
import { getTranslatedExplanation } from '@/lib/ai';

import { ShieldCheck, AlertCircle, Layers, Scale, Sparkles, CheckCircle2, FileText, Download, ArrowLeft } from 'lucide-react';
import { CrossDocValidation } from '@/components/CrossDocValidation';
import { AttentionReport } from '@/components/AttentionReport';
import { EvidenceDrawer } from '@/components/EvidenceDrawer';
import { DocumentReader } from '@/components/DocumentReader';
import { FiveQuestionsCard } from '@/components/FiveQuestionsCard';
import { DocumentHealthScore } from '@/components/DocumentHealthScore';
import { DifficultWordsGlossary } from '@/components/DifficultWordsGlossary';
import { ActionChecklist } from '@/components/ActionChecklist';
import { GovtServicesSection } from '@/components/GovtServicesSection';
import { OcrTextEditorModal } from '@/components/OcrTextEditorModal';

export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const docId = (params?.id as string) || '';
  const { currentAnalysis, setCurrentAnalysis, savedDocuments, language, translationCache, privacyShield } = useApp();
  const [data, setData] = useState<any>(currentAnalysis);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [isOcrOpen, setIsOcrOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    // 1. Check if currentAnalysis in memory matches this docId
    if (currentAnalysis && currentAnalysis.id === docId) {
      setData(currentAnalysis);
      setIsLoading(false);
      return;
    }

    // 2. Check savedDocuments in AppContext
    const foundInContext = savedDocuments.find((d) => d.id === docId);
    if (foundInContext) {
      setCurrentAnalysis(foundInContext);
      setData(foundInContext);
      setIsLoading(false);
      return;
    }

    // 3. Fallback: check localStorage directly (useful immediately on cold page refresh)
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('legallingo_saved_docs') : null;
      if (raw) {
        const parsed: DocumentAnalysis[] = JSON.parse(raw);
        const foundInStorage = parsed.find((d) => d.id === docId);
        if (foundInStorage) {
          setCurrentAnalysis(foundInStorage);
          setData(foundInStorage);
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to load saved doc from localStorage:', err);
    }

    // 4. Check if this is the sample document ID
    if (docId === SAMPLE_AGRICULTURAL_SALE_AGREEMENT.id) {
      setCurrentAnalysis(SAMPLE_AGRICULTURAL_SALE_AGREEMENT);
      setData(SAMPLE_AGRICULTURAL_SALE_AGREEMENT);
      setIsLoading(false);
      return;
    }

    // 5. If not found in any store
    if (isMounted) {
      setNotFound(true);
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [docId, currentAnalysis, savedDocuments, setCurrentAnalysis]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Loading analysis dashboard...</p>
        </div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-md border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {getTranslation('analysisNotFoundTitle', language)}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {getTranslation('analysisNotFoundDesc', language)}
          </p>
          <div className="pt-2">
            <button
              onClick={() => router.push('/my-documents')}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all"
            >
              {getTranslation('backToMyDocs', language)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const rawTitle = data.documentTitle || data.title || 'Legal Document';
  const title = applyPrivacyMask(
    getTranslatedExplanation(rawTitle, language, translationCache),
    privacyShield
  );

  const rawDocType = data.documentType || data.document_type || 'Legal Document';
  const docType = getTranslatedExplanation(rawDocType, language, translationCache);

  const confidence = data.classificationConfidence || data.ocrConfidence || (data.confidence !== undefined ? Math.round(data.confidence * 100) : 94);

  const summary = applyPrivacyMask(
    getTranslatedExplanation(data.summary || '', language, translationCache),
    privacyShield
  );

  const rawSimpleExplanation = data.verySimpleSummary || data.simple_explanation || '';
  const simpleExplanation = applyPrivacyMask(
    getTranslatedExplanation(rawSimpleExplanation, language, translationCache),
    privacyShield
  );

  const fileCount = data.sourceFiles?.length || data.analysisMeta?.totalFiles || 1;
  const completenessScore = data.understandingScore || data.completeness?.overall_score || 87;
  const attentionCount = data.missingInformation?.length || data.attention_report?.length || (data.importantClauses?.filter((c: any) => c.riskLevel === 'high')?.length ?? 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <button
            onClick={() => router.push('/my-documents')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {getTranslation('backToMyDocs', language)}
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {title}
            </h1>
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-bold border border-emerald-300 dark:border-emerald-800">
              {docType}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Processed via LegalLingo Engine • Confidence: {confidence}%
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
          >
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* A. Top Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {getTranslation('docType', language)}
          </span>
          <p className="text-lg font-extrabold text-slate-900 dark:text-white">{docType}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {getTranslation('attentionRequiredLabel', language)}
          </span>
          <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400">
            {attentionCount} {getTranslation('actionRequiredLabel', language)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {getTranslation('selectedDocumentsLabel', language)}
          </span>
          <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
            {fileCount} {getTranslation(fileCount > 1 ? 'filesLabel' : 'fileLabel', language)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {getTranslation('understandingScore', language)}
          </span>
          <p className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
            {completenessScore}% {getTranslation('scoreLabel', language)}
          </p>
        </div>
      </div>

      {/* B. AI Document Summary */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 text-white p-6 rounded-2xl shadow-md space-y-2">
        <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" /> {getTranslation('aiDocumentSummaryLabel', language)} • {getTranslation('summaryTitle', language)}
        </div>
        <h2 className="text-xl font-bold text-white">
          {summary}
        </h2>
        {simpleExplanation && (
          <p className="text-sm text-emerald-100 leading-relaxed pt-1">
            {simpleExplanation}
          </p>
        )}
      </div>

      {/* C. Citizen Summary Cards */}
      <FiveQuestionsCard />

      {/* E. Cross-Document Validation Engine Results */}
      {data.validations && <CrossDocValidation validations={data.validations} />}

      {/* F. Attention & Verification Report */}
      {data.attention_report && <AttentionReport items={data.attention_report} />}

      {/* G. Evidence Drawer */}
      {data.legal_citations && <EvidenceDrawer citations={data.legal_citations} />}

      {/* D. Side-by-Side Document Reader */}
      <DocumentReader onOpenOcrEditor={() => setIsOcrOpen(true)} />

      {/* H. Document Health & Completeness Indicator */}
      <DocumentHealthScore />

      {/* I. Difficult Legal Words Explained */}
      <DifficultWordsGlossary />

      {/* J. Citizen Action Checklist */}
      <ActionChecklist />

      {/* K. Relevant Government Services */}
      <GovtServicesSection />

      {/* OCR Modal */}
      <OcrTextEditorModal isOpen={isOcrOpen} onClose={() => setIsOcrOpen(false)} />
    </div>
  );
}
