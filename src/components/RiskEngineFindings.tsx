'use client';

import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, AlertCircle, CheckCircle2, ChevronDown, FileSearch } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { applyPrivacyMask } from '@/lib/privacy';
import { getTranslatedExplanation } from '@/lib/ai';
import { getTranslation } from '@/lib/translations';
import type { RiskFinding, RiskSeverity } from '@/lib/types';

const SEVERITY_STYLES: Record<RiskSeverity, { badge: string; card: string; icon: React.ReactNode }> = {
  HIGH_ATTENTION: {
    badge: 'bg-red-100 text-red-800 border-red-200',
    card: 'border-red-200 bg-red-50/30',
    icon: <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
  },
  REVIEW: {
    badge: 'bg-amber-100 text-amber-900 border-amber-200',
    card: 'border-amber-200 bg-amber-50/30',
    icon: <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
  },
  STANDARD: {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    card: 'border-emerald-200 bg-emerald-50/20',
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
  }
};

/**
 * Renders deterministic Risk Engine findings.
 *
 * Every card names the rule that fired and the evidence it fired on, so a
 * finding is explainable rather than an opaque red badge. Returns null when the
 * engine produced nothing, which lets the page fall back to the existing
 * clause-level view without a layout gap.
 */
export const RiskEngineFindings: React.FC = () => {
  const { currentAnalysis, language, translationCache, privacyShield } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const findings = currentAnalysis?.riskEngine?.findings;
  if (!findings || findings.length === 0) return null;

  const t = (text: string) => getTranslatedExplanation(text, language, translationCache);
  const summary = currentAnalysis?.riskEngine?.summary;

  const severityLabel = (severity: RiskSeverity) =>
    severity === 'HIGH_ATTENTION'
      ? getTranslation('highAttention', language)
      : severity === 'REVIEW'
      ? getTranslation('reviewNeeded', language)
      : getTranslation('standardWording', language);

  const confidenceLabel = (confidence?: string) =>
    confidence === 'HIGH'
      ? getTranslation('confHigh', language)
      : confidence === 'MEDIUM'
      ? getTranslation('confMedium', language)
      : getTranslation('confLow', language);

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-emerald-100 mb-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">
            {getTranslation('riskEngineLabel', language)}
          </span>
          <h2 className="text-2xl font-black text-emerald-950">
            {getTranslation('riskEngineTitle', language)}
          </h2>
        </div>
      </div>

      <p className="text-xs font-medium text-slate-500 mb-5">
        {getTranslation('attentionEngineNote', language)}
        {summary ? (
          <span className="ml-1 font-bold text-slate-600">
            · {summary.highAttention} / {summary.review}
          </span>
        ) : null}
      </p>

      <div className="space-y-5">
        {findings.map((finding: RiskFinding) => {
          const styles = SEVERITY_STYLES[finding.severity];
          const isExpanded = expandedId === finding.id;

          return (
            <div
              key={finding.id}
              className={`rounded-2xl p-5 border ${styles.card} shadow-sm space-y-4 transition-all hover:shadow-md`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  {styles.icon}
                  {t(finding.title)}
                </h3>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border ${styles.badge} self-start sm:self-auto`}
                >
                  {severityLabel(finding.severity)}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  {getTranslation('whyItMatters', language)}
                </span>
                <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                  {applyPrivacyMask(t(finding.reason), privacyShield)}
                </p>
                {finding.simpleMeaning ? (
                  <p className="text-xs font-bold text-emerald-900 leading-relaxed mt-2">
                    {applyPrivacyMask(t(finding.simpleMeaning), privacyShield)}
                  </p>
                ) : null}
              </div>

              {finding.recommendedVerification && finding.recommendedVerification.length > 0 ? (
                <div className="bg-white p-3.5 rounded-xl border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1.5">
                    {getTranslation('recommendedVerification', language)}
                  </span>
                  <ul className="space-y-1">
                    {finding.recommendedVerification.map((step, i) => (
                      <li key={i} className="text-xs font-semibold text-slate-800 flex gap-2">
                        <span className="text-emerald-600 font-black">·</span>
                        <span>{applyPrivacyMask(t(step), privacyShield)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Explainability drawer — the rule and evidence behind the badge. */}
              <div className="pt-2 border-t border-slate-200/60">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : finding.id)}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 transition-colors"
                  aria-expanded={isExpanded}
                >
                  <FileSearch className="w-3.5 h-3.5" />
                  {getTranslation('whyFlagged', language)}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {isExpanded ? (
                  <div className="mt-3 bg-slate-50 rounded-xl border border-slate-200 p-3.5 space-y-3">
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          {getTranslation('ruleLabel', language)}
                        </span>
                        <code className="text-xs font-bold text-slate-800">{finding.ruleId}</code>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          {getTranslation('confidenceLabel', language)}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {confidenceLabel(finding.confidence)}
                        </span>
                      </div>
                      {finding.relatedFields && finding.relatedFields.length > 0 ? (
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">
                            {getTranslation('detectedFact', language)}
                          </span>
                          <span className="text-xs font-semibold text-slate-700">
                            {finding.relatedFields.join(', ')}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {finding.evidence && finding.evidence.length > 0 ? (
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                          {getTranslation('evidenceLabel', language)}
                        </span>
                        <div className="space-y-2">
                          {finding.evidence.map((ev, i) => (
                            <div
                              key={i}
                              className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700 leading-relaxed"
                            >
                              {ev.page !== undefined ? (
                                <span className="text-[10px] font-sans font-bold text-emerald-700 block mb-1">
                                  {getTranslation('pageLabel', language)} {ev.page}
                                  {ev.sourceFile ? ` · ${ev.sourceFile}` : ''}
                                </span>
                              ) : null}
                              {ev.sourceText
                                ? applyPrivacyMask(ev.sourceText, privacyShield)
                                : ev.clauseId}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
