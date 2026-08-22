'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CheckCircle2, Loader2, FileSearch, Layers, Scale, Sparkles } from 'lucide-react';
import { fetchDemoAnalysis } from '@/lib/api';
import { useApp } from '@/context/AppContext';

const STAGES = [
  'Uploading documents',
  'Reading text & running OCR',
  'Classifying document types',
  'Extracting key structured fields',
  'Segmenting clause categories',
  'Comparing cross-document consistency',
  'Running deterministic attention rules',
  'Retrieving KanoonGPT legal knowledge',
  'Generating grounded citizen explanation'
];

export default function ProcessingPage() {
  const router = useRouter();
  const params = useParams();
  const docId = params.id as string;
  const { setCurrentAnalysis } = useApp();
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev < STAGES.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(async () => {
            const demoData = await fetchDemoAnalysis();
            setCurrentAnalysis(demoData as any);
            router.push(`/analysis/${docId || 'demo-sale-agreement-001'}`);
          }, 800);
          return prev;
        }
      });
    }, 450);

    return () => clearInterval(interval);
  }, [docId, router, setCurrentAnalysis]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto animate-pulse">
          <Sparkles className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            LegalLingo Intelligence Pipeline
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Analyzing document structure, extracting facts & executing KanoonGPT legal retrieval
          </p>
        </div>

        <div className="space-y-3 text-left pt-2">
          {STAGES.map((stage, idx) => (
            <div
              key={stage}
              className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold transition-all ${
                idx < currentStage
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
                  : idx === currentStage
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900 text-indigo-800 dark:text-indigo-300 shadow-sm'
                  : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-400'
              }`}
            >
              {idx < currentStage ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : idx === currentStage ? (
                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" />
              )}
              <span>{stage}</span>
            </div>
          ))}
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-emerald-600 h-full transition-all duration-300 ease-out"
            style={{ width: `${((currentStage + 1) / STAGES.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
