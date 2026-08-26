'use client';

import React, { useEffect, useCallback } from 'react';
import {
  X,
  ShieldAlert,
  Activity,
  BookOpen,
  Landmark,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Info,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { applyPrivacyMask } from '@/lib/privacy';
import { getTranslatedExplanation } from '@/lib/ai';
import { getTranslation } from '@/lib/translations';

export type DashboardModalType = 'risk' | 'health' | 'dictionary' | 'services' | null;

interface DashboardDetailModalProps {
  type: DashboardModalType;
  onClose: () => void;
}

const STATUS_KEY: Record<string, string> = {
  'Needs Attention': 'needsAttention',
  'Looks Standard': 'looksStandard',
  'High Risk': 'highRisk',
};

const STATUS_EMOJI: Record<string, string> = {
  'Needs Attention': '🟠',
  'Looks Standard': '🟢',
  'High Risk': '🔴',
};

export const DashboardDetailModal: React.FC<DashboardDetailModalProps> = ({ type, onClose }) => {
  const { currentAnalysis, language, translationCache, privacyShield } = useApp();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!type) return;
    window.addEventListener('keydown', handleKeyDown);
    // Prevent background scrolling when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [type, handleKeyDown]);

  if (!type || !currentAnalysis) return null;

  const t = (text: string) => getTranslatedExplanation(text, language, translationCache);

  const statusKey = STATUS_KEY[currentAnalysis.status] || 'needsAttention';
  const statusEmoji = STATUS_EMOJI[currentAnalysis.status] || '🟠';

  const importantClauses = currentAnalysis.importantClauses || [];
  const highRiskCount = importantClauses.filter((c) => c.riskLevel === 'high').length;
  const reviewCount = importantClauses.filter((c) => c.riskLevel === 'review').length;
  const standardCount = importantClauses.filter((c) => c.riskLevel === 'standard').length;

  const completeness = currentAnalysis.completenessBreakdown || {
    identityInfo: 80,
    propertyInfo: 75,
    financialInfo: 85,
    importantClauses: 70,
    witnessInfo: 60,
    registrationInfo: 90,
  };

  const healthScore = currentAnalysis.understandingScore ?? 85;
  const legalTerms = currentAnalysis.legalTerms || [];
  const relevantServices = currentAnalysis.relevantServices || [];
  const missingInfo = currentAnalysis.missingInformation || [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-emerald-100 overflow-hidden transform transition-all duration-200 scale-100">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            {type === 'risk' && (
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 shadow-xs">
                <ShieldAlert className="w-5 h-5" />
              </div>
            )}
            {type === 'health' && (
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 shadow-xs">
                <Activity className="w-5 h-5" />
              </div>
            )}
            {type === 'dictionary' && (
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 shadow-xs">
                <BookOpen className="w-5 h-5" />
              </div>
            )}
            {type === 'services' && (
              <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0 shadow-xs">
                <Landmark className="w-5 h-5" />
              </div>
            )}

            <div>
              <h2 id="dashboard-modal-title" className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                {type === 'risk' && getTranslation('riskAndClauseAnalysis', language)}
                {type === 'health' && getTranslation('docHealth', language)}
                {type === 'dictionary' && getTranslation('legalDictionaryLabel', language)}
                {type === 'services' && getTranslation('govtServicesLabel', language)}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {type === 'risk' && getTranslation('riskModalSubtitle', language)}
                {type === 'health' && getTranslation('healthModalSubtitle', language)}
                {type === 'dictionary' && getTranslation('dictionaryModalSubtitle', language)}
                {type === 'services' && getTranslation('govtServicesModalSubtitle', language)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={getTranslation('closeLabel', language)}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* ---------------- 1. RISK & CLAUSE ANALYSIS MODAL ---------------- */}
          {type === 'risk' && (
            <div className="space-y-5">
              {/* Summary Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {getTranslation('overallRiskLevel', language)}
                  </span>
                  <p className="text-sm font-black text-slate-900 mt-1 flex items-center gap-1 truncate">
                    <span>{statusEmoji}</span>
                    <span>{getTranslation(statusKey, language)}</span>
                  </p>
                </div>

                <div className="bg-red-50/60 p-3.5 rounded-2xl border border-red-200">
                  <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">
                    {getTranslation('highAttentionCountLabel', language)}
                  </span>
                  <p className="text-xl font-black text-red-600 mt-0.5">{highRiskCount}</p>
                </div>

                <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                    {getTranslation('reviewCountLabel', language)}
                  </span>
                  <p className="text-xl font-black text-amber-600 mt-0.5">{reviewCount}</p>
                </div>

                <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    {getTranslation('standardCountLabel', language)}
                  </span>
                  <p className="text-xl font-black text-emerald-600 mt-0.5">{standardCount}</p>
                </div>
              </div>

              {/* "What this means" Plain-Language Explanation */}
              <div className="bg-amber-50/80 rounded-2xl p-4 sm:p-5 border border-amber-200/80 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                    {getTranslation('whatThisMeansLabel', language)}
                  </h4>
                  <p className="text-xs sm:text-sm font-semibold text-amber-900 leading-relaxed">
                    {getTranslation('riskExplanationText', language)}
                  </p>
                </div>
              </div>

              {/* Clause List */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {getTranslation('importantClauses', language)} ({importantClauses.length})
                </h4>

                {importantClauses.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 font-semibold">
                    {getTranslation('noClausesFound', language)}
                  </div>
                ) : (
                  importantClauses.map((clause) => {
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
                      ? 'border-red-200 bg-red-50/20'
                      : isReview
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-emerald-200 bg-emerald-50/10';

                    const clauseTitle = t(clause.clauseTitle);
                    const originalText = applyPrivacyMask(clause.originalText, privacyShield);
                    const simpleMeaning = applyPrivacyMask(t(clause.simpleMeaning), privacyShield);
                    const whyItMatters = applyPrivacyMask(t(clause.whyItMatters), privacyShield);
                    const recommendedAction = applyPrivacyMask(t(clause.recommendedAction), privacyShield);

                    return (
                      <div
                        key={clause.id}
                        className={`rounded-2xl p-4 sm:p-5 border ${cardBorder} shadow-2xs space-y-3`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <h5 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                            {isHigh ? (
                              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                            ) : isReview ? (
                              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            )}
                            <span>{clauseTitle}</span>
                          </h5>

                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeBg} self-start sm:self-auto`}>
                            {badgeLabel}
                          </span>
                        </div>

                        {/* Original wording */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700 leading-relaxed">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                            {getTranslation('originalWordingLabel', language)}:
                          </span>
                          "{originalText}"
                        </div>

                        {/* Simple meaning & Why it matters */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          <div className="bg-white p-3 rounded-xl border border-emerald-100">
                            <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">
                              {getTranslation('simpleMeaning', language)}:
                            </span>
                            <p className="text-xs font-bold text-slate-900 leading-relaxed">
                              {simpleMeaning}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-amber-100">
                            <span className="text-[10px] font-bold text-amber-800 uppercase block mb-1">
                              {getTranslation('whyItMatters', language)}:
                            </span>
                            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                              {whyItMatters}
                            </p>
                          </div>
                        </div>

                        {/* Recommended Action */}
                        {recommendedAction && (
                          <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-950 flex items-start gap-2">
                            <span className="text-emerald-700 font-black flex-shrink-0">
                              {getTranslation('recommendedAction', language)}:
                            </span>
                            <span>{recommendedAction}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ---------------- 2. DOCUMENT HEALTH MODAL ---------------- */}
          {type === 'health' && (
            <div className="space-y-6">
              {/* Overall Score Header Box */}
              <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                    {getTranslation('docHealth', language)}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl sm:text-4xl font-black text-emerald-700">
                      {healthScore}
                    </span>
                    <span className="text-base font-bold text-gray-400">/100</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-emerald-900 mt-2">
                    {healthScore >= 75
                      ? getTranslation('healthScoreExplanationGood', language)
                      : getTranslation('healthScoreExplanationFair', language)}
                  </p>
                </div>

                <div className="px-4 py-2 bg-white rounded-xl border border-emerald-200 shadow-2xs self-start sm:self-auto text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">
                    {getTranslation('confidenceSuffix', language)}
                  </span>
                  <span className="text-sm font-black text-emerald-700">
                    {currentAnalysis.classificationConfidence || 94}%
                  </span>
                </div>
              </div>

              {/* Completeness Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {getTranslation('completenessBreakdownLabel', language)}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: getTranslation('identityInfo', language), value: completeness.identityInfo },
                    { label: getTranslation('propertyInfo', language), value: completeness.propertyInfo },
                    { label: getTranslation('financialInfo', language), value: completeness.financialInfo },
                    { label: getTranslation('importantClauses', language), value: completeness.importantClauses },
                    { label: getTranslation('witnessInfo', language), value: completeness.witnessInfo },
                    { label: getTranslation('registrationInfo', language), value: completeness.registrationInfo },
                  ].map((item, idx) => {
                    const isGood = (item.value ?? 0) >= 75;
                    return (
                      <div key={idx} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                        <div className="flex justify-between items-center text-xs font-extrabold text-slate-800">
                          <span>{item.label}</span>
                          <span className={isGood ? 'text-emerald-700' : 'text-amber-700'}>
                            {item.value ?? 0}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isGood ? 'bg-emerald-600' : 'bg-amber-500'
                            }`}
                            style={{ width: `${item.value ?? 0}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Missing Information / Alerts */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {getTranslation('missingDetailsLabel', language)} ({missingInfo.length})
                </h4>

                {missingInfo.length === 0 ? (
                  <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{getTranslation('allSectionsComplete', language)}</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {missingInfo.map((info) => {
                      const isHigh = info.severity === 'high';
                      return (
                        <div
                          key={info.id}
                          className={`p-4 rounded-2xl border ${
                            isHigh ? 'bg-red-50/40 border-red-200' : 'bg-amber-50/40 border-amber-200'
                          } space-y-2`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                              {isHigh ? (
                                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                              )}
                              <span>{t(info.title)}</span>
                            </h5>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200">
                              {info.severity}
                            </span>
                          </div>

                          <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                            {t(info.whyItMatters)}
                          </p>

                          {info.whatYouCanDo && (
                            <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/80 text-xs font-bold text-slate-900">
                              <span className="text-emerald-700 font-extrabold">
                                {getTranslation('whatYouCanDo', language)}{' '}
                              </span>
                              <span>{t(info.whatYouCanDo)}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---------------- 3. LEGAL DICTIONARY MODAL ---------------- */}
          {type === 'dictionary' && (
            <div className="space-y-4">
              {legalTerms.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-black text-slate-800">
                    {getTranslation('noLegalTermsTitle', language)}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                    {getTranslation('noLegalTermsDesc', language)}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {legalTerms.map((term, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-colors space-y-2 flex flex-col justify-between"
                    >
                      <div>
                        <h4 className="text-sm font-black text-emerald-950 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>{t(term.term)}</span>
                        </h4>

                        <p className="text-xs font-semibold text-slate-700 mt-2 leading-relaxed">
                          {t(term.simpleMeaning)}
                        </p>
                      </div>

                      {term.simpleExample && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200/80 bg-white p-3 rounded-xl space-y-1">
                          <span className="text-[10px] font-extrabold text-emerald-800 uppercase block">
                            {getTranslation('simpleExample', language)}:
                          </span>
                          <p className="text-xs font-bold text-slate-900 italic">
                            "{t(term.simpleExample)}"
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ---------------- 4. GOVERNMENT SERVICES MODAL ---------------- */}
          {type === 'services' && (
            <div className="space-y-4">
              {relevantServices.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                    <Landmark className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-black text-slate-800">
                    {getTranslation('noGovtServicesTitle', language)}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                    {getTranslation('noGovtServicesDesc', language)}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relevantServices.map((service) => (
                    <div
                      key={service.id}
                      className="bg-emerald-50/40 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <h4 className="font-black text-sm sm:text-base text-emerald-950">
                          {t(service.title)}
                        </h4>
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold text-emerald-800 uppercase block">
                            {getTranslation('whyRelevantLabel', language)}
                          </span>
                          <p className="text-xs text-slate-700 font-medium leading-relaxed">
                            {t(service.whyRelevant)}
                          </p>
                        </div>
                      </div>

                      {service.officialUrl ? (
                        <a
                          href={service.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors shadow-xs active:scale-98"
                        >
                          <span>
                            {service.actionText ? t(service.actionText) : getTranslation('openOfficialPortal', language)}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <div className="w-full px-4 py-2.5 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold text-center">
                          {getTranslation('viewGuidance', language)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-extrabold transition-colors cursor-pointer shadow-xs active:scale-98"
          >
            {getTranslation('closeLabel', language)}
          </button>
        </div>

      </div>
    </div>
  );
};
