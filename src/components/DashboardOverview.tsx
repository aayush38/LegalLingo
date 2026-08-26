'use client';

import React, { useState } from 'react';
import { Sparkles, Download, Loader2, ChevronRight, FileText, Compass } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { applyPrivacyMask } from '@/lib/privacy';
import { getTranslatedExplanation } from '@/lib/ai';
import { downloadLegalLingoSummaryPDF } from '@/lib/pdfExport';
import { getTranslation } from '@/lib/translations';
import { DashboardDetailModal, DashboardModalType } from '@/components/DashboardDetailModal';

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
  const { currentAnalysis, language, translationCache, privacyShield } = useApp();
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [selectedModal, setSelectedModal] = useState<DashboardModalType>(null);

  if (!currentAnalysis) return null;

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

  const importantClausesCount = currentAnalysis.importantClauses?.length || 0;
  const healthScore = currentAnalysis.understandingScore ?? 85;
  const termsCount = currentAnalysis.legalTerms?.length || 0;
  const servicesCount = currentAnalysis.relevantServices?.length || 0;

  return (
    <section className="space-y-6 mb-10">
      
      {/* 2-ROW SUMMARY CARDS SECTION */}
      <div className="space-y-4">

        {/* ROW 1: STATIC INFORMATION CARDS (Information about my document) */}
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 px-0.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>{getTranslation('infoAboutDocLabel', language)}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

            {/* Card 1: Document Type (Static) */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs cursor-default select-none">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {getTranslation('docType', language)}
              </span>
              <p className="text-base sm:text-lg font-black text-slate-900 truncate">
                {documentTypeText}
              </p>
              <div className="mt-2">
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/60 inline-block">
                  {currentAnalysis.classificationConfidence || 94}% {getTranslation('confidenceSuffix', language)}
                </span>
              </div>
            </div>

            {/* Card 2: Status (Static) */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs cursor-default select-none">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {getTranslation('statusLabel', language)}
              </span>
              <p className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-1.5 truncate">
                <span>{statusEmoji}</span>
                <span>{getTranslation(statusKey, language)}</span>
              </p>
              <div className="mt-2">
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md inline-block">
                  {getTranslation('actionRequiredLabel', language)}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* ROW 2: INTERACTIVE EXPLORATION CARDS (Things I can explore) */}
        <div>
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 px-0.5">
            <Compass className="w-3.5 h-3.5 text-emerald-600" />
            <span>{getTranslation('thingsToExploreLabel', language)}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

            {/* 1. Risk & Clause Analysis (Interactive Card) */}
            <button
              type="button"
              onClick={() => setSelectedModal('risk')}
              className="group bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-400 hover:shadow-md transition-all duration-200 text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none flex flex-col justify-between w-full active:scale-[0.99]"
              title={getTranslation('riskAndClauseAnalysis', language)}
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1 group-hover:text-amber-700 transition-colors truncate">
                  {getTranslation('riskAndClauseAnalysis', language)}
                </span>
                <p className="text-2xl font-black text-amber-600">
                  {importantClausesCount}
                </p>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 w-full">
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 group-hover:bg-amber-100 transition-colors">
                  {getTranslation('clausesAuditedLabel', language)}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-transform duration-200 flex-shrink-0" />
              </div>
            </button>

            {/* 2. Document Health (Interactive Card) */}
            <button
              type="button"
              onClick={() => setSelectedModal('health')}
              className="group bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all duration-200 text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none flex flex-col justify-between w-full active:scale-[0.99]"
              title={getTranslation('docHealth', language)}
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1 group-hover:text-emerald-700 transition-colors truncate">
                  {getTranslation('docHealth', language)}
                </span>
                <p className="text-2xl font-black text-emerald-600">
                  {healthScore}<span className="text-xs text-slate-400 font-bold">/100</span>
                </p>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 w-full">
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
                  {getTranslation('healthScoreLabel', language)}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-transform duration-200 flex-shrink-0" />
              </div>
            </button>

            {/* 3. Legal Dictionary (Interactive Card) */}
            <button
              type="button"
              onClick={() => setSelectedModal('dictionary')}
              className="group bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all duration-200 text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none flex flex-col justify-between w-full active:scale-[0.99]"
              title={getTranslation('legalDictionaryLabel', language)}
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1 group-hover:text-indigo-700 transition-colors truncate">
                  {getTranslation('legalDictionaryLabel', language)}
                </span>
                <p className="text-2xl font-black text-indigo-600">
                  {termsCount}
                </p>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 w-full">
                <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 group-hover:bg-indigo-100 transition-colors">
                  {getTranslation('termsFoundLabel', language)}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-transform duration-200 flex-shrink-0" />
              </div>
            </button>

            {/* 4. Government Services (Interactive Card) */}
            <button
              type="button"
              onClick={() => setSelectedModal('services')}
              className="group bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-400 hover:shadow-md transition-all duration-200 text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none flex flex-col justify-between w-full active:scale-[0.99]"
              title={getTranslation('govtServicesLabel', language)}
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1 group-hover:text-teal-700 transition-colors truncate">
                  {getTranslation('govtServicesLabel', language)}
                </span>
                <p className="text-2xl font-black text-teal-600">
                  {servicesCount}
                </p>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 w-full">
                <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100 group-hover:bg-teal-100 transition-colors">
                  {getTranslation('portalsCountLabel', language)}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-transform duration-200 flex-shrink-0" />
              </div>
            </button>

          </div>
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

      {/* DETAIL MODAL OVERLAY */}
      <DashboardDetailModal
        type={selectedModal}
        onClose={() => setSelectedModal(null)}
      />

    </section>
  );
};
