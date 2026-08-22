'use client';

import React from 'react';
import { ListTodo, CheckSquare, Square } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { applyPrivacyMask } from '@/lib/privacy';
import { getTranslatedExplanation } from '@/lib/ai';
import { getTranslation } from '@/lib/translations';

export const ActionChecklist: React.FC = () => {
  const { currentAnalysis, toggleChecklistItem, privacyShield, language, translationCache } = useApp();

  if (!currentAnalysis || !currentAnalysis.recommendedActions) return null;

  const actions = currentAnalysis.recommendedActions;
  const completedCount = actions.filter((a) => a.completed).length;
  const totalCount = actions.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-emerald-100 mb-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <ListTodo className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
              {getTranslation('citizenTasklistLabel', language)}
            </span>
            <h2 className="text-2xl font-black text-emerald-950">
              {getTranslation('whatNextTitle', language)}
            </h2>
          </div>
        </div>

        {/* Progress Counter & Bar */}
        <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl min-w-[200px]">
          <div className="flex justify-between items-center text-xs font-black text-emerald-950 mb-1">
            <span>{completedCount} of {totalCount} {getTranslation('completedOf', language)}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-emerald-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checkable Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {actions.map((act) => {
          const isDone = act.completed;
          const text = applyPrivacyMask(getTranslatedExplanation(act.text, language, translationCache), privacyShield);

          return (
            <div
              key={act.id}
              onClick={() => toggleChecklistItem(act.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                isDone
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 line-through opacity-80'
                  : 'bg-white border-gray-200 hover:border-emerald-400 text-gray-800 shadow-sm'
              }`}
            >
              <div className="mt-0.5 text-emerald-600 flex-shrink-0">
                {isDone ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <span className="text-sm font-bold leading-snug">{text}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
};
