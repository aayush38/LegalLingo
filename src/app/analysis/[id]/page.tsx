'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { fetchDemoAnalysis, AnalysisResponse } from '@/lib/api';

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
  const { currentAnalysis, setCurrentAnalysis } = useApp();
  const [data, setData] = useState<AnalysisResponse | null>(currentAnalysis as any);
  const [isOcrOpen, setIsOcrOpen] = useState(false);

  useEffect(() => {
    async function load() {
      if (!currentAnalysis) {
        const res = await fetchDemoAnalysis();
        setCurrentAnalysis(res as any);
        setData(res);
      } else {
        setData(currentAnalysis as any);
      }
    }
    load();
  }, [currentAnalysis, setCurrentAnalysis]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Loading analysis dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Upload
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {data.title}
            </h1>
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-bold border border-emerald-300 dark:border-emerald-800">
              {data.document_type}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Processed via LegalLingo Engine • State: {data.state} • Confidence: {Math.round(data.confidence * 100)}%
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
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Document Type</span>
          <p className="text-lg font-extrabold text-slate-900 dark:text-white">{data.document_type}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attention Flags</span>
          <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400">
            {data.attention_report?.length || 0} Action Items
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cross-Doc Checks</span>
          <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
            {data.validations?.length || 0} Executed
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completeness</span>
          <p className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
            {data.completeness?.overall_score || 87}% Score
          </p>
        </div>
      </div>

      {/* B. AI Document Summary */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 text-white p-6 rounded-2xl shadow-md space-y-2">
        <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" /> AI Document Summary • What is this document about?
        </div>
        <h2 className="text-xl font-bold text-white">
          {data.summary}
        </h2>
        <p className="text-sm text-emerald-100 leading-relaxed pt-1">
          {data.simple_explanation}
        </p>
      </div>

      {/* C. Citizen Summary Cards */}
      <FiveQuestionsCard />

      {/* E. Cross-Document Validation Engine Results */}
      <CrossDocValidation validations={data.validations} />

      {/* F. Attention & Verification Report */}
      <AttentionReport items={data.attention_report} />

      {/* G. Evidence Drawer */}
      <EvidenceDrawer citations={data.legal_citations} />

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
