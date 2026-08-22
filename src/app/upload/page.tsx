'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileUp, Upload, CheckCircle2, ShieldCheck, X, Plus, Sparkles, AlertCircle } from 'lucide-react';
import { analyzeDocuments, fetchDemoAnalysis } from '@/lib/api';
import { useApp } from '@/context/AppContext';

export default function UploadPage() {
  const router = useRouter();
  const { setCurrentAnalysis } = useApp();
  
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [supportingFiles, setSupportingFiles] = useState<{ file: File; tag: string }[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleMainFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMainFile(e.target.files[0]);
    }
  };

  const handleAddSupporting = (e: React.ChangeEvent<HTMLInputElement>, tag: string = 'Supporting Document') => {
    if (e.target.files && e.target.files[0]) {
      setSupportingFiles([...supportingFiles, { file: e.target.files[0], tag }]);
    }
  };

  const removeSupporting = (index: number) => {
    setSupportingFiles(supportingFiles.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const docId = `docset-${Date.now()}`;
    
    try {
      const formData = new FormData();
      if (mainFile) formData.append('main_file', mainFile);
      supportingFiles.forEach(sf => formData.append('supporting_files', sf.file));

      const result = await analyzeDocuments(formData);
      setCurrentAnalysis(result as any);
      router.push(`/processing/${result.id || docId}`);
    } catch (err) {
      console.error(err);
      const demo = await fetchDemoAnalysis();
      setCurrentAnalysis(demo as any);
      router.push(`/processing/demo-sale-agreement-001`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-bold">
          <ShieldCheck className="w-4 h-4" /> Multi-Document Verification Engine
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Upload Documents for Intelligence Analysis
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Upload your primary agreement along with supporting identity cards, NOCs, or previous deeds for cross-document consistency checks.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-8">
        
        {/* Main Document Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">1</span>
              Primary Legal Document (Sale Agreement / Lease / Notice)
            </h2>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">Required</span>
          </div>

          {!mainFile ? (
            <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
              <FileUp className="w-10 h-10 text-emerald-600 mb-3" />
              <span className="text-sm font-semibold text-slate-800 dark:text-white">Click to upload main agreement PDF</span>
              <span className="text-xs text-slate-500 mt-1">Supports digital PDFs, scanned documents & images</span>
              <input type="file" accept=".pdf,.doc,.docx,.png,.jpg" onChange={handleMainFileChange} className="hidden" />
            </label>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileUp className="w-6 h-6 text-emerald-600" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{mainFile.name}</p>
                  <p className="text-xs text-slate-500">{(mainFile.size / 1024).toFixed(1)} KB • Main Sale Agreement</p>
                </div>
              </div>
              <button onClick={() => setMainFile(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Supporting Documents Section */}
        <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                Supporting Verification Documents (PAN, NOC, 7/12 Extract, Deeds)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Used by LegalLingo cross-validation engine to detect seller name mismatches or missing NOCs</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['PAN Copy', 'NOC Release', 'Previous Title Deed', '7/12 Extract'].map((tag) => (
              <label key={tag} className="border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer text-center space-y-1">
                <Plus className="w-5 h-5 text-indigo-600" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Add {tag}</span>
                <input type="file" accept=".pdf,.png,.jpg" onChange={(e) => handleAddSupporting(e, tag)} className="hidden" />
              </label>
            ))}
          </div>

          {supportingFiles.length > 0 && (
            <div className="space-y-2 pt-2">
              {supportingFiles.map((sf, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold">{sf.tag}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{sf.file.name}</span>
                  </div>
                  <button onClick={() => removeSupporting(idx)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 flex items-center justify-end gap-3">
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
          >
            {isAnalyzing ? 'Processing Pipeline...' : 'Analyse Documents'}
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
