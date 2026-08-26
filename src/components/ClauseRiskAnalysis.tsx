'use client';

import React from 'react';
import { ShieldAlert, AlertTriangle, AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { applyPrivacyMask } from '@/lib/privacy';
import { getTranslatedExplanation } from '@/lib/ai';
import { getTranslation } from '@/lib/translations';

export const ClauseRiskAnalysis: React.FC = () => {
  const { currentAnalysis, language, translationCache, privacyShield, setIsChatOpen } = useApp();

  if (!currentAnalysis || !currentAnalysis.importantClauses) return null;

  return (
    <section id="section-clause-risk" className="scroll-mt-20 bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-emerald-100 mb-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">
            {getTranslation('clauseAuditLabel', language)}
          </span>
          <h2 className="text-2xl font-black text-emerald-950">
            {getTranslation('clauseAuditTitle', language)}
          </h2>
        </div>
      </div>

      {/* Clause Cards Grid */}
      <div className="space-y-5">
        {currentAnalysis.importantClauses.map((clause) => {
          const isHigh = clause.riskLevel === 'high';
          const isReview = clause.riskLevel === 'review';

          const badgeLabel = isHigh
            ? getTranslation('highAttention', language)
            : isReview
            ? getTranslation('reviewNeeded', language)
            : getTranslation('standardWording', language);

          const badgeBg = isHigh
            ? 'bg-red-100 text-red-800 border-red-200'
            : isReview
            ? 'bg-amber-100 text-amber-900 border-amber-200'
            : 'bg-emerald-100 text-emerald-800 border-emerald-200';

          const cardBorder = isHigh
            ? 'border-red-200 bg-red-50/30'
            : isReview
            ? 'border-amber-200 bg-amber-50/30'
            : 'border-emerald-200 bg-emerald-50/20';

          const originalText = applyPrivacyMask(clause.originalText, privacyShield);
          const clauseTitle = getTranslatedExplanation(clause.clauseTitle, language, translationCache);
          const simpleMeaning = applyPrivacyMask(
            getTranslatedExplanation(clause.simpleMeaning, language, translationCache),
            privacyShield
          );
          const whyItMatters = applyPrivacyMask(
            getTranslatedExplanation(clause.whyItMatters, language, translationCache),
            privacyShield
          );
          const recommendedAction = applyPrivacyMask(
            getTranslatedExplanation(clause.recommendedAction, language, translationCache),
            privacyShield
          );

          return (
            <div
              key={clause.id}
              className={`rounded-2xl p-5 border ${cardBorder} shadow-sm space-y-4 transition-all hover:shadow-md`}
            >
              {/* Card Title & Risk Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  {isHigh ? (
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  ) : isReview ? (
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  )}
                  {clauseTitle}
                </h3>

                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${badgeBg} self-start sm:self-auto`}>
                  {badgeLabel}
                </span>
              </div>

              {/* Original Clause Text Box */}
              <div className="bg-white/80 p-3.5 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 leading-relaxed">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{getTranslation('originalWordingLabel', language)}:</span>
                "{originalText}"
              </div>

              {/* Simple Meaning & Why It Matters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                
                <div className="bg-white p-3.5 rounded-xl border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">
                    {getTranslation('simpleMeaning', language)}:
                  </span>
                  <p className="text-xs font-bold text-slate-900 leading-relaxed">{simpleMeaning}</p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-amber-100">
                  <span className="text-[10px] font-bold text-amber-800 uppercase block mb-1">
                    {getTranslation('whyItMatters', language)}:
                  </span>
                  <p className="text-xs font-semibold text-slate-800 leading-relaxed">{whyItMatters}</p>
                </div>

              </div>

              {/* Action & Ask AI Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200/60">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <span className="text-emerald-700 font-black">{getTranslation('recommendedAction', language)}:</span>
                  <span>{recommendedAction}</span>
                </div>

                <button
                  onClick={() => setIsChatOpen(true)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95 self-start sm:self-auto"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{getTranslation('askAboutClause', language)}</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>
    </section>
  );
};
