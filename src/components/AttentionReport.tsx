'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, ShieldCheck, CheckSquare, FileText, ArrowRight } from 'lucide-react';
import { AttentionItem } from '@/lib/api';

interface AttentionReportProps {
  items: AttentionItem[];
}

export const AttentionReport: React.FC<AttentionReportProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-rose-50 dark:bg-rose-950/50 rounded-lg text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Attention & Verification Report
            </h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Rule-based and evidence-grounded items requiring citizen verification
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 rounded-full border border-rose-300 dark:border-rose-800">
          {items.length} Action Items
        </span>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={`rounded-xl border p-5 transition-all ${
              item.severity === 'HIGH_ATTENTION'
                ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                : item.severity === 'REVIEW'
                ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                {item.severity === 'HIGH_ATTENTION' ? (
                  <span className="p-1.5 bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                  </span>
                ) : (
                  <span className="p-1.5 bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                )}
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  {item.title}
                </h4>
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                item.severity === 'HIGH_ATTENTION'
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {item.severity.replace('_', ' ')}
              </span>
            </div>

            <div className="space-y-3 mt-4 text-sm">
              <div className="bg-white/90 dark:bg-slate-800/90 rounded-lg p-3 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Original Clause Text
                </span>
                <p className="font-mono text-xs text-slate-800 dark:text-slate-200 italic">
                  "{item.original_clause}"
                </p>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                  Simple Citizen Meaning
                </span>
                <p className="text-slate-800 dark:text-slate-200 font-medium">
                  {item.simple_meaning}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 block mb-1">
                    Why This Matters
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {item.why_it_matters}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block mb-1">
                    What To Verify Next
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {item.what_to_verify}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                <span className="text-slate-500 font-mono">
                  Evidence: {item.evidence}
                </span>
                <span className="font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5" />
                  Recommended: {item.recommended_action}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
