'use client';

import React from 'react';
import { ShieldAlert, AlertCircle, CheckCircle2, MessageSquare, ArrowUpRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { applyPrivacyMask } from '@/lib/privacy';
import { getTranslatedExplanation } from '@/lib/ai';

export const ClauseRiskAnalysis: React.FC = () => {
  const { currentAnalysis, language, privacyShield, setIsChatOpen } = useApp();

  if (!currentAnalysis) return null;

  const handleAskAboutClause = (clauseTitle: string, originalText: string) => {
    setIsChatOpen(true);
  };

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-emerald-100 mb-8">
      
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
              CLAUSE SAFETY AUDIT
            </span>
            <h2 className="text-2xl font-black text-emerald-950">Risk and Clause Analysis</h2>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="flex items-center gap-1 text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
            🔴 High Attention
          </span>
          <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            🟠 Review
          </span>
          <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            🟢 Standard
          </span>
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-6">
        {currentAnalysis.importantClauses.map((clause) => {
          const isHigh = clause.riskLevel === 'high';
          const isReview = clause.riskLevel === 'review';

          const simpleMeaning = applyPrivacyMask(
            getTranslatedExplanation(clause.simpleMeaning, language),
            privacyShield
          );

          const whyItMatters = applyPrivacyMask(
            getTranslatedExplanation(clause.whyItMatters, language),
            privacyShield
          );

          return (
            <div
              key={clause.id}
              className={`rounded-2xl p-6 border transition-all shadow-sm hover:shadow-md ${
                isHigh
                  ? 'bg-red-50/40 border-red-200'
                  : isReview
                  ? 'bg-amber-50/40 border-amber-200'
                  : 'bg-emerald-50/40 border-emerald-200'
              }`}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  {isHigh && <span className="text-red-600 text-xl">🔴</span>}
                  {isReview && <span className="text-amber-600 text-xl">🟠</span>}
                  {!isHigh && !isReview && <span className="text-emerald-600 text-xl">🟢</span>}
                  <span>{clause.clauseTitle}</span>
                </h3>

                <span
                  className={`text-xs font-extrabold px-3 py-1 rounded-full self-start ${
                    isHigh
                      ? 'bg-red-100 text-red-800'
                      : isReview
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-emerald-100 text-emerald-900'
                  }`}
                >
                  {isHigh ? 'Potential High Concern' : isReview ? 'Needs Careful Review' : 'Standard Wording'}
                </span>
              </div>

              {/* Original snippet */}
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-xs font-mono text-gray-600 mb-4 italic">
                <span className="font-bold text-gray-400 block not-italic mb-1">Original Text:</span>
                &quot;{applyPrivacyMask(clause.originalText, privacyShield)}&quot;
              </div>

              {/* Simple Meaning & Why it matters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                  <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider mb-1">
                    Simple Meaning
                  </h4>
                  <p className="text-sm font-bold text-gray-900 leading-relaxed">{simpleMeaning}</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200">
                  <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider mb-1">
                    Why This Matters
                  </h4>
                  <p className="text-sm font-semibold text-gray-800 leading-relaxed">{whyItMatters}</p>
                </div>
              </div>

              {/* Recommended Action & Ask AI Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-200/60">
                <div className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Recommended Action: <strong className="text-gray-900">{clause.recommendedAction}</strong></span>
                </div>

                <button
                  onClick={() => handleAskAboutClause(clause.clauseTitle, clause.originalText)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95 self-start sm:self-auto"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Ask LegalLingo About This Clause
                </button>
              </div>

            </div>
          );
        })}
      </div>
    </section>
  );
};
