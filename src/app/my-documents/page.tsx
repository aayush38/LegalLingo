'use client';

import React from 'react';
import Link from 'next/link';
import { FolderHeart, FileText, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { SavedDocuments } from '@/components/SavedDocuments';
import { useApp } from '@/context/AppContext';
import { getTranslation } from '@/lib/translations';

export default function MyDocumentsPage() {
  const { language } = useApp();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-lg">
              <FolderHeart className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {getTranslation('myAnalyzedDocsTitle', language)}
            </h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {getTranslation('myAnalyzedDocsSubText', language)}
          </p>
        </div>

        <Link
          href="/upload"
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <FileText className="w-4 h-4" /> {getTranslation('uploadNewDocLabel', language)}
        </Link>
      </div>

      <SavedDocuments />
    </div>
  );
}
