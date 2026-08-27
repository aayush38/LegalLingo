'use client';

import React from 'react';
import { Activity, ShieldCheck } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getTranslation } from '@/lib/translations';

export const DocumentHealthScore: React.FC = () => {
  const { currentAnalysis, language } = useApp();

  if (!currentAnalysis || !currentAnalysis.completenessBreakdown) return null;

  const cb = currentAnalysis.completenessBreakdown;

  const items = [
    { label: getTranslation('identityInfo', language), value: cb.identityInfo },
    { label: getTranslation('propertyInfo', language), value: cb.propertyInfo },
    { label: getTranslation('financialInfo', language), value: cb.financialInfo },
    { label: getTranslation('importantClauses', language), value: cb.importantClauses },
    { label: getTranslation('witnessInfo', language), value: cb.witnessInfo },
    { label: getTranslation('registrationInfo', language), value: cb.registrationInfo }
  ];

  return (
    <section id="section-document-health" className="scroll-mt-20 bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-emerald-100 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
            ANALYSIS COMPLETENESS
          </span>
          <h2 className="text-2xl font-black text-emerald-950">
            {getTranslation('docHealth', language)}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((item, idx) => (
          <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs font-extrabold text-slate-800">
              <span>{item.label}</span>
              <span className={item.value >= 75 ? 'text-emerald-600' : 'text-amber-600'}>
                {item.value}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  item.value >= 75 ? 'bg-emerald-600' : 'bg-amber-500'
                }`}
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
