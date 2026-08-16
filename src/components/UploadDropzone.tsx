'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, Camera, Sparkles, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export const UploadDropzone: React.FC = () => {
  const { processUploadedFile, loadSampleDocument, isAnalyzing, uploadProgressStage, uploadProgressPercent } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processUploadedFile(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      
      {/* Animated Upload Loader overlay when processing */}
      {isAnalyzing ? (
        <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-emerald-500 text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-emerald-950">Processing Your Document</h3>
            <p className="text-sm font-semibold text-emerald-700 mt-1">{uploadProgressStage}</p>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full bg-emerald-100 rounded-full h-3 overflow-hidden p-0.5">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300 shadow"
              style={{ width: `${uploadProgressPercent}%` }}
            />
          </div>

          {/* Processing Stages Indicator */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-semibold text-gray-600 pt-2 text-left">
            <div className={`flex items-center gap-1.5 ${uploadProgressPercent >= 20 ? 'text-emerald-700' : 'text-gray-400'}`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Uploading document
            </div>
            <div className={`flex items-center gap-1.5 ${uploadProgressPercent >= 40 ? 'text-emerald-700' : 'text-gray-400'}`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Reading & OCR
            </div>
            <div className={`flex items-center gap-1.5 ${uploadProgressPercent >= 60 ? 'text-emerald-700' : 'text-gray-400'}`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Extracting clauses
            </div>
            <div className={`flex items-center gap-1.5 ${uploadProgressPercent >= 80 ? 'text-emerald-700' : 'text-gray-400'}`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Simplifying language
            </div>
            <div className={`flex items-center gap-1.5 ${uploadProgressPercent >= 95 ? 'text-emerald-700' : 'text-gray-400'}`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Risk & Scheme audit
            </div>
            <div className={`flex items-center gap-1.5 ${uploadProgressPercent === 100 ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> LegalLingo Ready
            </div>
          </div>
        </div>
      ) : (
        /* Standard File Drop Area */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`bg-white rounded-3xl p-8 sm:p-10 text-center border-2 border-dashed transition-all shadow-lg ${
            isDragOver ? 'border-emerald-600 bg-emerald-50/50 scale-[1.01]' : 'border-emerald-300 hover:border-emerald-500'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
          />

          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          <div className="w-20 h-20 bg-emerald-100/80 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 mb-4 shadow-sm">
            <UploadCloud className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
            Upload Your Legal Document
          </h2>
          <p className="text-sm text-gray-600 font-medium max-w-md mx-auto mb-6">
            Upload Sale Agreements, Land 7/12, Rent Agreements, Loans or Legal Notices. Supports <span className="font-bold text-emerald-700">PDF, JPG, JPEG, PNG</span>.
          </p>

          {/* Primary & Secondary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-extrabold text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <UploadCloud className="w-5 h-5" /> Upload Your Document
            </button>

            <button
              onClick={() => cameraInputRef.current?.click()}
              className="w-full sm:w-auto px-5 py-3.5 bg-white border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Camera className="w-4 h-4" /> Take a Photo
            </button>

            <button
              onClick={loadSampleDocument}
              className="w-full sm:w-auto px-5 py-3.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-emerald-700" /> Try Sample Document
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-xs font-semibold text-emerald-800 bg-emerald-50 py-2 px-4 rounded-full max-w-fit mx-auto border border-emerald-100">
            <span className="flex items-center gap-1">🔒 100% Private & Encrypted</span>
            <span>•</span>
            <span className="flex items-center gap-1">⚡ Automatic OCR Text Extraction</span>
          </div>
        </div>
      )}
    </div>
  );
};
