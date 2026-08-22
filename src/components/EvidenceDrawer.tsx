'use client';

import React, { useState } from 'react';
import { BookOpen, ShieldCheck, ChevronDown, ChevronUp, FileText, ExternalLink, Scale } from 'lucide-react';
import { LegalSourceCitation } from '@/lib/api';

interface EvidenceDrawerProps {
  citations: LegalSourceCitation[];
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ citations }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!citations || citations.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100/50 dark:hover:bg-slate-800 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Scale className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Retrieved Legal Evidence Drawer
              <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-md">
                KanoonGPT Corpus
              </span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Grounded legal statutes, sections, and precedent records retrieved for this analysis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">
            {citations.length} Sources
          </span>
          {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-6 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
          {citations.map((cite) => (
            <div
              key={cite.doc_id}
              className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    {cite.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-800 dark:text-slate-200 font-medium">
                      {cite.jurisdiction}
                    </span>
                    <span>• {cite.issuing_authority}</span>
                    <span>• Confidence Match: {Math.round(cite.similarity * 100)}%</span>
                  </div>
                </div>
                <span className="text-xs font-mono px-2 py-1 bg-emerald-100 text-emerald-800 rounded">
                  {cite.verification_status}
                </span>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 mt-2">
                "{cite.excerpt}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
