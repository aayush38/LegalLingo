'use client';

import React from 'react';
import { FileCheck2, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { applyPrivacyMask } from '@/lib/privacy';
import { getTranslatedExplanation } from '@/lib/ai';
import { getTranslation } from '@/lib/translations';

/**
 * Shows the verification documents submitted alongside the agreement, and the
 * concrete values read out of each one.
 *
 * These are not simplified clause-by-clause — their job is to give the Risk
 * Engine something to check the agreement against — but the citizen still needs
 * to see that the NOC they uploaded was read, and what it was understood to say.
 */
export const SupportingDocuments: React.FC = () => {
  const { currentAnalysis, language, translationCache, privacyShield } = useApp();

  const docs = currentAnalysis?.supportingDocuments;
  if (!docs || docs.length === 0) return null;

  const t = (text: string) => getTranslatedExplanation(text, language, translationCache);
  const mask = (text: string) => applyPrivacyMask(text, privacyShield);

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-emerald-100 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
          <FileCheck2 className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
            {getTranslation('verificationDocsLabel', language)}
          </span>
          <h2 className="text-2xl font-black text-emerald-950">
            {getTranslation('verificationDocsTitle', language)}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {docs.map((doc) => (
          <div
            key={doc.fileName}
            className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  {doc.docType || 'Supporting Document'}
                </span>
                <p className="text-xs font-bold text-slate-700 mt-1.5 truncate">{doc.fileName}</p>
              </div>
              {doc.startPage ? (
                <span className="text-[10px] font-bold text-emerald-700 whitespace-nowrap">
                  {getTranslation('pageLabel', language)} {doc.startPage}
                  {doc.endPage && doc.endPage !== doc.startPage ? `–${doc.endPage}` : ''}
                </span>
              ) : null}
            </div>

            {doc.extractionFailed ? (
              <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {getTranslation('couldNotRead', language)}
              </p>
            ) : (
              <>
                {doc.summary ? (
                  <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                    {mask(t(doc.summary))}
                  </p>
                ) : null}

                {doc.keyFacts && doc.keyFacts.length > 0 ? (
                  <div className="bg-white rounded-xl border border-emerald-100 p-3">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1.5">
                      {getTranslation('keyFactsLabel', language)}
                    </span>
                    <dl className="space-y-1">
                      {doc.keyFacts.map((fact, i) => (
                        <div key={i} className="flex gap-2 text-xs">
                          <dt className="font-bold text-slate-600 flex-shrink-0">{t(fact.label)}:</dt>
                          <dd className="font-semibold text-slate-900 min-w-0 break-words">
                            {mask(fact.value)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ) : null}
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
