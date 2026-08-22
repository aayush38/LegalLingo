'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, FileCheck, Layers, ArrowRight } from 'lucide-react';
import { ValidationResult } from '@/lib/api';

interface CrossDocValidationProps {
  validations: ValidationResult[];
}

export const CrossDocValidation: React.FC<CrossDocValidationProps> = ({ validations }) => {
  if (!validations || validations.length === 0) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONSISTENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Consistent
          </span>
        );
      case 'REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            Review
          </span>
        );
      case 'HIGH_ATTENTION':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5" />
            High Attention
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Layers className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Cross-Document Validation
            </h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Automated verification comparing extracted facts across main agreement and supporting documents
          </p>
        </div>
        <span className="text-xs font-medium px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700">
          {validations.length} Checks Executed
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {validations.map((val) => (
          <div
            key={val.id}
            className={`p-5 rounded-xl border transition-all ${
              val.status === 'CONSISTENT'
                ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/40'
                : val.status === 'REVIEW'
                ? 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/40'
                : 'bg-rose-50/40 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/40'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {val.category} • {val.field}
                </span>
              </div>
              {getStatusBadge(val.status)}
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-3 border border-slate-200/60 dark:border-slate-700/60 mb-3 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-600 dark:text-slate-400 min-w-[70px]">Source A:</span>
                <span className="font-medium text-slate-900 dark:text-white truncate">{val.source_a}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-600 dark:text-slate-400 min-w-[70px]">Source B:</span>
                <span className="font-medium text-slate-900 dark:text-white truncate">{val.source_b}</span>
              </div>
            </div>

            <p className="text-sm font-normal leading-relaxed text-slate-700 dark:text-slate-300">
              {val.reason}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
