'use client';

import React, { useState } from 'react';
import { BookMarked, HelpCircle, X, Check, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { LegalTerm } from '@/lib/types';

export const DifficultWordsGlossary: React.FC = () => {
  const { currentAnalysis } = useApp();
  const [selectedTerm, setSelectedTerm] = useState<LegalTerm | null>(null);

  if (!currentAnalysis || !currentAnalysis.legalTerms) return null;

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-emerald-100 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
          <BookMarked className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
            LEGAL DICTIONARY
          </span>
          <h2 className="text-2xl font-black text-emerald-950">Difficult Legal Words Explained</h2>
        </div>
      </div>

      <p className="text-xs font-semibold text-gray-500 mb-5">
        Click any difficult legal term below to see its plain English definition and real-life example.
      </p>

      {/* Clickable Term Chips */}
      <div className="flex flex-wrap gap-2.5 mb-6">
        {currentAnalysis.legalTerms.map((t, idx) => {
          const isSelected = selectedTerm?.term === t.term;
          return (
            <button
              key={idx}
              onClick={() => setSelectedTerm(isSelected ? null : t)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all border shadow-sm flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 scale-105 shadow-emerald-200'
                  : 'bg-emerald-50/80 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{t.term}</span>
            </button>
          );
        })}
      </div>

      {/* Active Term Popover Card */}
      {selectedTerm && (
        <div className="bg-emerald-900 text-white rounded-2xl p-6 shadow-xl relative animate-fade-in border border-emerald-700">
          <button
            onClick={() => setSelectedTerm(null)}
            className="absolute top-4 right-4 p-1 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-3">
            <span className="bg-emerald-500 text-emerald-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
              LEGAL TERM DEFINITION
            </span>
            <h3 className="text-2xl font-black text-white">{selectedTerm.term}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15">
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Simple Meaning
              </h4>
              <p className="text-sm font-semibold text-white leading-relaxed">
                {selectedTerm.simpleMeaning}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15">
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-1">
                Simple Example
              </h4>
              <p className="text-sm font-medium text-emerald-100 leading-relaxed">
                {selectedTerm.simpleExample}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
