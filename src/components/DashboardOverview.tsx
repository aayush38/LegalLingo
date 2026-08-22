'use client';

import React, { useState } from 'react';
import { Sparkles, Download } from 'lucide-react';
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
  const { currentAnalysis, language, translationCache, privacyShield } = useApp();
  const [evenSimpler, setEvenSimpler] = useState<boolean>(false);

  if (!currentAnalysis) return null;

  const summaryText = applyPrivacyMask(
    getTranslatedExplanation(currentAnalysis.summary, language, translationCache),
    privacyShield
  );

  const simpleText = applyPrivacyMask(
    getTranslatedExplanation(
      evenSimpler && currentAnalysis.extraSimpleSummary
        ? currentAnalysis.extraSimpleSummary
        : currentAnalysis.verySimpleSummary,
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Card 1: Type */}
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

        {/* Card 2: Health Score */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            {getTranslation('understandingScore', language)}
          </span>
          <p className="text-xl font-black text-emerald-600">
            {currentAnalysis.understandingScore}<span className="text-xs text-gray-400">/100</span>
          </p>
          <span className="text-[10px] font-bold text-emerald-800">{getTranslation('completenessHighLabel', language)}</span>
        </div>

        {/* Card 3: Important Issues */}
        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            {getTranslation('importantIssues', language)}
          </span>
          <p className="text-xl font-black text-amber-600">
            {currentAnalysis.importantClauses.length}
          </p>
          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
            {getTranslation('clauseFlagsLabel', language)}
          </span>
        </div>

        {/* Card 4: Missing Info */}
        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            {getTranslation('missingInfo', language)}
          </span>
          <p className="text-xl font-black text-amber-600">
            {currentAnalysis.missingInformation.length}
          </p>
          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
            {getTranslation('toCheckLabel', language)}
          </span>
        </div>

        {/* Card 5: Language */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            {getTranslation('languageLabel', language)}
          </span>
          <p className="text-base font-black text-emerald-950 capitalize">
            {language === 'en' ? 'English' : language === 'hi' ? 'हिंदी (Hindi)' : language === 'mr' ? 'मराठी (Marathi)' : 'ગુજરાતી (Gujarati)'}
          </p>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
            {getTranslation('citizenModeLabel', language)}
          </span>
        </div>

        {/* Card 6: Status */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            {getTranslation('statusLabel', language)}
          </span>
          <p className="text-sm font-black text-amber-700 flex items-center gap-1">
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
              onClick={() => downloadLegalLingoSummaryPDF(currentAnalysis, privacyShield, language, translationCache)}
              className="px-5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-950 rounded-2xl font-extrabold text-xs shadow-md flex items-center gap-2 transition-transform active:scale-95 self-start sm:self-auto"
            >
              <Download className="w-4 h-4 text-emerald-600" /> {getTranslation('downloadPdf', language)}
            </button>
          </div>

          <p className="text-base sm:text-lg font-medium text-emerald-100 leading-relaxed">
            {summaryText}
          </p>

          {/* Simple Words Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-300" /> {getTranslation('inVerySimpleWords', language)}
              </h3>

              {/* Make It Even Simpler Button */}
              <button
                onClick={() => setEvenSimpler(!evenSimpler)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
                  evenSimpler
                    ? 'bg-emerald-400 text-emerald-950 border-emerald-300'
                    : 'bg-white/15 text-emerald-100 hover:bg-white/25 border-white/20'
                }`}
              >
                {evenSimpler ? getTranslation('superSimpleActive', language) : getTranslation('makeItEvenSimpler', language)}
              </button>
            </div>

            <p className="text-base sm:text-xl font-bold text-white leading-snug">
              {simpleText}
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};
