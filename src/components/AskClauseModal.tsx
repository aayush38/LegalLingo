'use client';

import React, { useState } from 'react';
import { MessageSquare, Send, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { askClauseQuestion } from '@/lib/api';

interface AskClauseModalProps {
  clauseId: string;
  clauseText: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AskClauseModal: React.FC<AskClauseModalProps> = ({
  clauseId,
  clauseText,
  isOpen,
  onClose
}) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [answerData, setAnswerData] = useState<any>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    try {
      const res = await askClauseQuestion(clauseId, question);
      setAnswerData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Ask LegalLingo About This Clause
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300">
          "{clauseText}"
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Your Question
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What happens if the seller does not provide the bank NOC?"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
          >
            {loading ? 'Analyzing with Gemini...' : 'Get Grounded Answer'}
            <Send className="w-4 h-4" />
          </button>
        </form>

        {answerData && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-2 text-xs">
            <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-bold">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Evidence Grounded Answer
              </span>
              <span>{Math.round((answerData.confidence || 0.9) * 100)}% Confidence</span>
            </div>
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-sm">
              {answerData.answer}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
