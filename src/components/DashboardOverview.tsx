'use client';

import React, { useState } from 'react';
import { Sparkles, Download, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { applyPrivacyMask } from '@/lib/privacy';
import { getTranslatedExplanation } from '@/lib/ai';
import { downloadLegalLingoSummaryPDF } from '@/lib/pdfExport';
import { getTranslation } from '@/lib/translations';

const STATUS_KEY: Record<string, string> = {
  'Needs Attention': 'needsAttention',
  'Looks Standard': 'looksStandard',
  'High Risk': 'highRisk'
};
const STATUS_EMOJI: Record<string, string> = {
  'Needs Attention': '🟠',
  'Looks Standard': '🟢',
  'High Risk': '🔴'
};

export const DashboardOverview: React.FC = () => {
  const { currentAnalysis, language, translationCache, privacyShield, showDocumentHealth, setShowDocumentHealth } = useApp();
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  if (!currentAnalysis) return null;

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleUnderstandingScoreClick = () => {
    setShowDocumentHealth(true);
    setTimeout(() => {
      scrollToSection('section-document-health');
    }, 50);
  };

  const summaryText = applyPrivacyMask(
    getTranslatedExplanation(currentAnalysis.summary, language, translationCache),
    privacyShield
  );

  const simpleText = applyPrivacyMask(
    getTranslatedExplanation(
      currentAnalysis.verySimpleSummary,
      language,
      translationCache
    ),
    privacyShield
  );

  const statusKey = STATUS_KEY[currentAnalysis.status] || 'needsAttention';
  const statusEmoji = STATUS_EMOJI[currentAnalysis.status] || '🟠';
  const documentTypeText = getTranslatedExplanation(currentAnalysis.documentType, language, translationCache);

  return (
    <section className="space-y-6 mb-10">
      
      {/* Top Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Card 1: Type (Static) */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            {getTranslation('docType', language)}
          </span>
          <p className="text-base font-black text-emerald-950 truncate">
            {documentTypeText}
          </p>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
            {currentAnalysis.classificationConfidence}% {getTranslation('confidenceSuffix', language)}
          </span>
        </div>

        {/* Card 2: Understanding Score -> Document Health (Interactive) */}
        <button
          type="button"
          onClick={handleUnderstandingScoreClick}
          className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer text-left group active:scale-[0.98] w-full"
          title={getTranslation('viewHealthBreakdown', language)}
        >
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1 group-hover:text-emerald-700 transition-colors">
            {getTranslation('understandingScore', language)}
          </span>
          <p className="text-xl font-black text-emerald-600">
            {currentAnalysis.understandingScore}<span className="text-xs text-gray-400">/100</span>
          </p>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded inline-flex items-center gap-1 group-hover:bg-emerald-100 transition-colors">
            {showDocumentHealth ? '✓ ' + getTranslation('completenessHighLabel', language) : getTranslation('viewHealthBreakdown', language)}
          </span>
        </button>

        {/* Card 3: Risk & Clause Analysis (Interactive) */}
        <button
          type="button"
          onClick={() => scrollToSection('section-clause-risk')}
          className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm hover:border-amber-300 hover:shadow-md transition-all cursor-pointer text-left group active:scale-[0.98] w-full"
          title={getTranslation('viewRiskAnalysisLabel', language)}
        >
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1 group-hover:text-amber-700 transition-colors truncate">
            {getTranslation('riskAndClauseAnalysis', language)}
          </span>
          <p className="text-xl font-black text-amber-600">
            {currentAnalysis.importantClauses.length}
          </p>
          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded inline-flex items-center gap-1 group-hover:bg-amber-100 transition-colors">
            {getTranslation('clauseFlagsLabel', language)}
          </span>
        </button>

        {/* Card 4: Government Services (Interactive) */}
        <button
          type="button"
          onClick={() => scrollToSection('section-govt-services')}
          className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer text-left group active:scale-[0.98] w-full"
          title={getTranslation('exploreServicesLabel', language)}
        >
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1 group-hover:text-emerald-700 transition-colors truncate">
            {getTranslation('govtServicesLabel', language)}
          </span>
          <p className="text-xl font-black text-emerald-700">
            {currentAnalysis.relevantServices?.length || 0}
          </p>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded inline-flex items-center gap-1 group-hover:bg-emerald-100 transition-colors">
            {getTranslation('portalsCountLabel', language)}
          </span>
        </button>

        {/* Card 5: Status (Static) */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            {getTranslation('statusLabel', language)}
          </span>
          <p className="text-sm font-black text-amber-700 flex items-center gap-1 truncate">
            {statusEmoji} {getTranslation(statusKey, language)}
          </p>
          <span className="text-[10px] font-bold text-gray-500">{getTranslation('actionRequiredLabel', language)}</span>
        </div>
      </div>

      {/* Large AI Summary Green Card */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-48 h-48 text-white" />
        </div>

        <div className="relative z-10 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-700/60 pb-4">
            <div>
              <span className="bg-emerald-700/80 text-emerald-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {getTranslation('aiDocumentSummaryLabel', language)}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-2">
                {getTranslation('summaryTitle', language)}
              </h2>
            </div>

            {/* Download PDF Summary Action Button */}
            <button
              onClick={async () => {
                if (isDownloadingPdf) return;
                setIsDownloadingPdf(true);
                try {
                  await downloadLegalLingoSummaryPDF(currentAnalysis, privacyShield, language, translationCache);
                } finally {
                  setIsDownloadingPdf(false);
                }
              }}
              disabled={isDownloadingPdf}
              className="px-5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-950 rounded-2xl font-extrabold text-xs shadow-md flex items-center gap-2 transition-transform active:scale-95 self-start sm:self-auto disabled:opacity-70 disabled:cursor-wait"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-emerald-600" />
              )}
              {getTranslation('downloadPdf', language)}
            </button>
          </div>

          <p className="text-base sm:text-lg font-medium text-emerald-100 leading-relaxed">
            {summaryText}
          </p>

          {/* Simple Words Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-3">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-300" /> {getTranslation('inVerySimpleWords', language)}
            </h3>

            <p className="text-base sm:text-xl font-bold text-white leading-snug">
              {simpleText}
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};
