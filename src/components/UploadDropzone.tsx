'use client';

import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  Camera,
  Sparkles,
  FileText,
  CheckCircle2,
  Loader2,
  Trash2,
  Plus,
  Layers,
  Star
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getTranslation } from '@/lib/translations';
import { UploadedFileItem } from '@/lib/types';

function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileTypeBadge(fileName: string, mimeType: string): { label: string; color: string } {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.pdf') || mimeType === 'application/pdf') {
    return { label: 'PDF', color: 'bg-red-100 text-red-700 border-red-200' };
  }
  if (lower.endsWith('.png') || mimeType === 'image/png') {
    return { label: 'PNG', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  }
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || mimeType === 'image/jpeg') {
    return { label: 'JPG', color: 'bg-blue-100 text-blue-700 border-blue-200' };
  }
  return { label: 'DOC', color: 'bg-slate-100 text-slate-700 border-slate-200' };
}

export const UploadDropzone: React.FC = () => {
  const {
    selectedFiles,
    addSelectedFiles,
    removeSelectedFile,
    updateFileRole,
    clearSelectedFiles,
    processUploadedFiles,
    loadSampleDocument,
    isAnalyzing,
    uploadProgressStage,
    uploadProgressPercent,
    language
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addSelectedFiles(Array.from(files));
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const primaryCount = selectedFiles.filter((f) => f.role === 'primary').length;
  const supportingCount = selectedFiles.filter((f) => f.role === 'supporting').length;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".pdf,.png,.jpg,.jpeg"
        multiple
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
      <input
        type="file"
        ref={addMoreInputRef}
        onChange={handleFileSelect}
        accept=".pdf,.png,.jpg,.jpeg"
        multiple
        className="hidden"
      />

      {/* 1. Animated Upload Loader overlay when processing */}
      {isAnalyzing ? (
        <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-emerald-500 text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-emerald-950">{getTranslation('processingDocLabel', language)}</h3>
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
            <div className={`flex items-center gap-1.5 ${uploadProgressPercent >= 20 ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {getTranslation('stageUploading', language)}
            </div>
            <div className={`flex items-center gap-1.5 ${uploadProgressPercent >= 40 ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {getTranslation('stageReadingOcr', language)}
            </div>
            <div className={`flex items-center gap-1.5 ${uploadProgressPercent >= 60 ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {getTranslation('stageExtractingClauses', language)}
            </div>
            <div className={`flex items-center gap-1.5 ${uploadProgressPercent >= 80 ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {getTranslation('stageSimplifying', language)}
            </div>
            <div className={`flex items-center gap-1.5 ${uploadProgressPercent >= 95 ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {getTranslation('stageRiskAudit', language)}
            </div>
            <div className={`flex items-center gap-1.5 ${uploadProgressPercent === 100 ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {getTranslation('stageReady', language)}
            </div>
          </div>
        </div>
      ) : selectedFiles.length > 0 ? (
        /* 2. Selected Documents View (Phase 2 Multi-File Management) */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`bg-white rounded-3xl p-6 sm:p-8 border-2 transition-all shadow-xl space-y-6 animate-fade-in ${
            isDragOver ? 'border-emerald-600 bg-emerald-50/40 scale-[1.005]' : 'border-emerald-300'
          }`}
        >
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
                <Layers className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  {getTranslation('selectedDocumentsLabel', language)}
                </h3>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mt-0.5">
                  <span className="text-emerald-700 font-bold">
                    {selectedFiles.length}{' '}
                    {selectedFiles.length === 1
                      ? getTranslation('singleDocumentSelectedCount', language)
                      : getTranslation('documentsSelectedCount', language)}
                  </span>
                  <span>•</span>
                  <span>
                    {primaryCount} {getTranslation('primaryRoleBadge', language)}, {supportingCount} {getTranslation('supportingRoleBadge', language)}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={clearSelectedFiles}
              className="text-xs font-bold text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 border border-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {getTranslation('clearAllLabel', language)}
            </button>
          </div>

          {/* Selected File Items List */}
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {selectedFiles.map((item: UploadedFileItem) => {
              const typeBadge = getFileTypeBadge(item.file.name, item.file.type);

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    item.role === 'primary'
                      ? 'bg-emerald-50/50 border-emerald-300 shadow-sm'
                      : 'bg-slate-50/80 border-slate-200'
                  }`}
                >
                  {/* Left: Thumbnail/Icon & Details */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Visual Preview */}
                    {item.previewUrl ? (
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-emerald-200 shadow-sm shrink-0 bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 text-red-600 flex flex-col items-center justify-center shadow-sm shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                    )}

                    {/* File Title & Meta */}
                    <div className="min-w-0 flex-1 text-left">
                      <p
                        className="text-sm font-bold text-slate-900 truncate leading-snug"
                        title={item.file.name}
                      >
                        {item.file.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${typeBadge.color}`}>
                          {typeBadge.label}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {formatFileSize(item.file.size)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Role Switcher & Remove */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                    {/* Primary vs Supporting Role Toggle */}
                    <div className="inline-flex rounded-xl bg-white border border-slate-200 p-1 shadow-sm">
                      <button
                        type="button"
                        onClick={() => updateFileRole(item.id, 'primary')}
                        title={getTranslation('primaryRoleDesc', language)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                          item.role === 'primary'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        <Star className={`w-3 h-3 ${item.role === 'primary' ? 'fill-white' : ''}`} />
                        {getTranslation('primaryRoleBadge', language)}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateFileRole(item.id, 'supporting')}
                        title={getTranslation('supportingRoleDesc', language)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                          item.role === 'supporting'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-indigo-700 hover:bg-indigo-50'
                        }`}
                      >
                        {getTranslation('supportingRoleBadge', language)}
                      </button>
                    </div>

                    {/* Remove Action Button */}
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(item.id)}
                      title={getTranslation('removeFileLabel', language)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100">
            {/* Secondary actions: Add more / Camera */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => addMoreInputRef.current?.click()}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 border border-slate-300 hover:border-emerald-400 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4 text-emerald-600" />
                {getTranslation('addMoreFilesLabel', language)}
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="px-3.5 py-2.5 bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 border border-slate-300 hover:border-emerald-400 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                title={getTranslation('takePhoto', language)}
              >
                <Camera className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">{getTranslation('takePhoto', language)}</span>
              </button>
            </div>

            {/* Primary Action: Start Analysis */}
            <button
              type="button"
              onClick={() => processUploadedFiles()}
              className="px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <Sparkles className="w-5 h-5 text-emerald-200 animate-pulse" />
              <span>
                {getTranslation('startAnalysisLabel', language)} ({selectedFiles.length})
              </span>
            </button>
          </div>
        </div>
      ) : (
        /* 3. Empty / Initial File Drop Area */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`bg-white rounded-3xl p-8 sm:p-10 text-center border-2 border-dashed transition-all shadow-lg ${
            isDragOver
              ? 'border-emerald-600 bg-emerald-50/50 scale-[1.01]'
              : 'border-emerald-300 hover:border-emerald-500'
          }`}
        >
          <div className="w-20 h-20 bg-emerald-100/80 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 mb-4 shadow-sm">
            <UploadCloud className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
            {getTranslation('uploadDocHeadline', language)}
          </h2>
          <p className="text-sm font-bold text-emerald-800 max-w-md mx-auto mb-6">
            {getTranslation('uploadDocSubText', language)}
          </p>

          {/* Primary & Secondary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-extrabold text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <UploadCloud className="w-5 h-5" /> {getTranslation('uploadDoc', language)}
            </button>

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="w-full sm:w-auto px-5 py-3.5 bg-white border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Camera className="w-4 h-4" /> {getTranslation('takePhoto', language)}
            </button>

            <button
              type="button"
              onClick={loadSampleDocument}
              className="w-full sm:w-auto px-5 py-3.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-emerald-700" /> {getTranslation('trySample', language)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
