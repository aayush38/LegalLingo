'use client';

import React from 'react';
import { AlertOctagon, HelpCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export const MissingInfoSection: React.FC = () => {
  const { currentAnalysis } = useApp();

  if (!currentAnalysis || !currentAnalysis.missingInformation) return null;

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-emerald-100 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
          <AlertOctagon className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">
            ATTENTION REQUIRED
          </span>
          <h2 className="text-2xl font-black text-emerald-950">Things You Should Check</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentAnalysis.missingInformation.map((item) => (
          <div
            key={item.id}
            className="bg-amber-50/60 rounded-2xl p-5 border border-amber-200 shadow-sm space-y-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🟠</span>
              <h3 className="text-base font-extrabold text-amber-950">{item.title}</h3>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-amber-100 space-y-2">
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase block">Why it matters:</span>
                <p className="text-xs font-semibold text-gray-800">{item.whyItMatters}</p>
              </div>

              <div className="pt-1 border-t border-gray-100">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">What you can do:</span>
                <p className="text-xs font-bold text-emerald-900">{item.whatYouCanDo}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
