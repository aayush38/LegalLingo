'use client';

import React, { useState } from 'react';
import { BookOpen, Search, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getTranslatedExplanation } from '@/lib/ai';
import { getTranslation } from '@/lib/translations';

export const DifficultWordsGlossary: React.FC = () => {
  const { currentAnalysis, language, translationCache } = useApp();
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const t = (text: string) => getTranslatedExplanation(text, language, translationCache);

  if (!currentAnalysis || !currentAnalysis.legalTerms) return null;

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-emerald-100 mb-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
            {getTranslation('legalDictionaryLabel', language)}
          </span>
          <h2 className="text-2xl font-black text-emerald-950">
            {getTranslation('difficultWordsTitle', language)}
          </h2>
        </div>
      </div>

      <p className="text-xs text-gray-500 font-semibold mb-5">
        {getTranslation('difficultSubText', language)}
      </p>

      {/* Terms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentAnalysis.legalTerms.map((term, idx) => {
          const isOpen = selectedTerm === term.term;

          return (
            <div
              key={idx}
              onClick={() => setSelectedTerm(isOpen ? null : term.term)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                isOpen
                  ? 'bg-emerald-50 border-emerald-400 shadow-md ring-2 ring-emerald-300'
                  : 'bg-slate-50/70 border-slate-200 hover:border-emerald-300 hover:bg-white shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-emerald-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  {t(term.term)}
                </h3>
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {isOpen ? getTranslation('closeLabel', language) : getTranslation('explainLabel', language)}
                </span>
              </div>

              <p className="text-xs font-semibold text-gray-700 mt-2 leading-relaxed">
                {t(term.simpleMeaning)}
              </p>

              {isOpen && (
                <div className="mt-3 pt-2.5 border-t border-emerald-200 bg-white p-3 rounded-xl space-y-1">
                  <span className="text-[10px] font-extrabold text-emerald-800 uppercase block">
                    {getTranslation('simpleExample', language)}:
                  </span>
                  <p className="text-xs font-bold text-emerald-950 italic">
                    "{t(term.simpleExample)}"
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
