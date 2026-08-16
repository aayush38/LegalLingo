'use client';

import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export const DocumentHealthScore: React.FC = () => {
  const { currentAnalysis } = useApp();

  if (!currentAnalysis) return null;

  const { completenessBreakdown, understandingScore } = currentAnalysis;

  const metrics = [
    { label: 'Identity Information', value: completenessBreakdown.identityInfo, color: 'bg-emerald-600' },
    { label: 'Property Information', value: completenessBreakdown.propertyInfo, color: 'bg-emerald-500' },
    { label: 'Financial Information', value: completenessBreakdown.financialInfo, color: 'bg-emerald-600' },
    { label: 'Important Clauses', value: completenessBreakdown.importantClauses, color: 'bg-emerald-500' },
    { label: 'Witness Information', value: completenessBreakdown.witnessInfo, color: 'bg-amber-500' },
    { label: 'Registration Information', value: completenessBreakdown.registrationInfo, color: 'bg-emerald-500' },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-md border border-emerald-100 mb-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-emerald-950">Document Health</h3>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
              AI Indicator
            </span>
          </div>
          <p className="text-xs font-semibold text-gray-500 mt-0.5 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-emerald-600" /> AI Completeness & Attention Indicator (Not legal validity)
          </p>
        </div>

        {/* Big Health Score Badge */}
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl">
          <ShieldCheck className="w-8 h-8 text-emerald-600" />
          <div>
            <div className="text-2xl font-black text-emerald-950 leading-none">
              {understandingScore} <span className="text-sm font-semibold text-emerald-700">/ 100</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Completeness Score</span>
          </div>
        </div>
      </div>

      {/* Progress Bars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-5">
        {metrics.map((item, i) => (
          <div key={i} className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
            <div className="flex justify-between items-center text-xs font-bold text-gray-800 mb-1.5">
              <span>{item.label}</span>
              <span className={item.value < 70 ? 'text-amber-700 font-extrabold' : 'text-emerald-700'}>
                {item.value}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
