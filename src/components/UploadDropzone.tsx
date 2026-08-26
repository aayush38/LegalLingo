'use client';

import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  Camera,
  Sparkles,
  CheckCircle2,
  Loader2,
  X,
  Plus,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getTranslation } from '@/lib/translations';
import { SUPPORTING_DOC_TYPES, MAX_SUPPORTING_DOCS, type UploadItem } from '@/lib/ocr';
import { PhotoCaptureModal } from './PhotoCaptureModal';

const ACCEPT = '.pdf,.png,.jpg,.jpeg';

/** A file queued in the uploader, before it is sent for analysis. */
interface QueuedFile {
  id: string;
  file: File;
  docType?: string;
}

/** Where the photo-capture modal should deposit its results. */
type CaptureTarget = { kind: 'primary' } | { kind: 'supporting'; docType: string } | null;

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

function sizeLabel(bytes: number) {
  return bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export const UploadDropzone: React.FC = () => {
  const {
    processUploadedItems,
    loadSampleDocument,
    isAnalyzing,
    uploadProgressStage,
    uploadProgressPercent,
    language
  } = useApp();

  // The primary document may be several files when it was photographed page by page.
  const [primary, setPrimary] = useState<QueuedFile[]>([]);
  const [supporting, setSupporting] = useState<QueuedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [captureTarget, setCaptureTarget] = useState<CaptureTarget>(null);

  const primaryInputRef = useRef<HTMLInputElement>(null);
  const supportingInputRef = useRef<HTMLInputElement>(null);
  const pendingDocType = useRef<string>('Other Supporting Document');

  const t = (key: string) => getTranslation(key, language);

  const addPrimary = (files: File[]) =>
    setPrimary((prev) => [...prev, ...files.map((file) => ({ id: newId(), file }))]);

  const addSupporting = (files: File[], docType: string) =>
    setSupporting((prev) =>
      [...prev, ...files.map((file) => ({ id: newId(), file, docType }))].slice(0, MAX_SUPPORTING_DOCS)
    );

  const handlePrimaryInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    addPrimary(Array.from(e.target.files || []));
    e.target.value = '';
  };

  const handleSupportingInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    addSupporting(Array.from(e.target.files || []), pendingDocType.current);
    e.target.value = '';
  };

  const openSupportingPicker = (docType: string) => {
    pendingDocType.current = docType;
    supportingInputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = Array.from(e.dataTransfer.files || []);
    // A drop with nothing queued yet is the main document; after that it's support.
    if (primary.length === 0) addPrimary(dropped);
    else addSupporting(dropped, 'Other Supporting Document');
  };

  const onCaptureConfirm = (files: File[]) => {
    if (!captureTarget || files.length === 0) return;
    if (captureTarget.kind === 'primary') addPrimary(files);
    else addSupporting(files, captureTarget.docType);
  };

  const analyse = () => {
    const items: UploadItem[] = [
      ...primary.map((q) => ({ file: q.file, role: 'primary' as const })),
      ...supporting.map((q) => ({ file: q.file, role: 'supporting' as const, docType: q.docType }))
    ];
    if (items.length === 0) return;
    processUploadedItems(items);
    setPrimary([]);
    setSupporting([]);
  };

  // ---------- processing state ----------
  if (isAnalyzing) {
    const stages: [number, string][] = [
      [20, 'stageUploading'],
      [40, 'stageReadingOcr'],
      [60, 'stageExtractingClauses'],
      [80, 'stageSimplifying'],
      [95, 'stageRiskAudit'],
      [100, 'stageReady']
    ];

    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-emerald-500 text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-emerald-950">{t('processingDocLabel')}</h3>
            <p className="text-sm font-semibold text-emerald-700 mt-1">{uploadProgressStage}</p>
          </div>

          <div className="w-full bg-emerald-100 rounded-full h-3 overflow-hidden p-0.5">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300 shadow"
              style={{ width: `${uploadProgressPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-semibold text-gray-600 pt-2 text-left">
            {stages.map(([threshold, key]) => (
              <div
                key={key}
                className={`flex items-center gap-1.5 ${
                  uploadProgressPercent >= threshold ? 'text-emerald-700' : 'text-gray-400'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {t(key)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---------- idle state ----------
  const hasPrimary = primary.length > 0;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`bg-white rounded-3xl p-6 sm:p-8 border-2 shadow-lg transition-all text-left ${
          isDragOver ? 'border-emerald-600 bg-emerald-50/40 scale-[1.01]' : 'border-emerald-200'
        }`}
      >
        <input ref={primaryInputRef} type="file" accept={ACCEPT} multiple onChange={handlePrimaryInput} className="hidden" />
        <input ref={supportingInputRef} type="file" accept={ACCEPT} multiple onChange={handleSupportingInput} className="hidden" />

        {/* ---- Step 1: the main document ---- */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0">
              1
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-emerald-950 leading-tight">
                {t('primaryDocLabel')}
              </h2>
              <p className="text-xs text-gray-600 font-medium">{t('primaryDocHint')}</p>
            </div>
          </div>
          <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full uppercase tracking-wide flex-shrink-0">
            {t('requiredLabel')}
          </span>
        </div>

        {!hasPrimary ? (
          <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-2xl p-7 text-center transition-colors">
            <div className="w-16 h-16 bg-emerald-100/80 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 mb-3">
              <UploadCloud className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-gray-800 mb-1">{t('uploadDocHeadline')}</p>
            <p className="text-xs text-gray-600 font-medium mb-4">
              {t('uploadDocSubText')} <span className="font-bold text-emerald-700">PDF, JPG, PNG</span>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                onClick={() => primaryInputRef.current?.click()}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <UploadCloud className="w-4 h-4" /> {t('uploadDoc')}
              </button>
              <button
                onClick={() => setCaptureTarget({ kind: 'primary' })}
                className="w-full sm:w-auto px-5 py-3 bg-white border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Camera className="w-4 h-4" /> {t('addPhotos')}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {primary.map((q, idx) => (
              <div
                key={q.id}
                className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-emerald-950 truncate">{q.file.name}</p>
                    <p className="text-[11px] text-emerald-700 font-semibold">
                      {sizeLabel(q.file.size)}
                      {primary.length > 1 ? ` · ${idx + 1}/${primary.length}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPrimary((prev) => prev.filter((p) => p.id !== q.id))}
                  aria-label={`${t('removeFile')} ${q.file.name}`}
                  className="p-1.5 text-emerald-700/60 hover:text-red-600 rounded-lg hover:bg-white flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="flex gap-2 pt-0.5">
              <button
                onClick={() => primaryInputRef.current?.click()}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> {t('uploadDoc')}
              </button>
              <span className="text-emerald-300">·</span>
              <button
                onClick={() => setCaptureTarget({ kind: 'primary' })}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                <Camera className="w-3.5 h-3.5" /> {t('addPhotos')}
              </button>
            </div>
          </div>
        )}

        {/* ---- Step 2: supporting documents ---- */}
        <div className="mt-7 pt-6 border-t border-emerald-100">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-emerald-800 text-white text-xs font-black flex items-center justify-center flex-shrink-0">
                2
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-black text-emerald-950 leading-tight">
                  {t('supportingDocsLabel')}
                </h2>
                <p className="text-xs text-gray-600 font-medium">{t('supportingDocsHint')}</p>
              </div>
            </div>
            <span className="text-[10px] font-black text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full uppercase tracking-wide flex-shrink-0">
              {t('optionalLabel')}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3.5">
            {SUPPORTING_DOC_TYPES.map((docType) => (
              <button
                key={docType}
                onClick={() => openSupportingPicker(docType)}
                disabled={supporting.length >= MAX_SUPPORTING_DOCS}
                className="border border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl px-3 py-2.5 flex items-center gap-1.5 text-left transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span className="text-[11px] font-bold text-emerald-900 leading-tight">{docType}</span>
              </button>
            ))}
          </div>

          {supporting.length > 0 && (
            <div className="space-y-2 mt-3.5">
              {supporting.map((q) => (
                <div
                  key={q.id}
                  className="p-3 rounded-xl bg-white border border-emerald-200 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md flex-shrink-0">
                      {q.docType}
                    </span>
                    <span className="text-xs font-semibold text-gray-800 truncate">{q.file.name}</span>
                  </div>
                  <button
                    onClick={() => setSupporting((prev) => prev.filter((p) => p.id !== q.id))}
                    aria-label={`${t('removeFile')} ${q.file.name}`}
                    className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-50 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ---- Actions ---- */}
        <div className="mt-7 pt-5 border-t border-emerald-100 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={analyse}
            disabled={!hasPrimary}
            className="w-full sm:flex-1 px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-2xl font-extrabold text-base shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <ShieldCheck className="w-5 h-5" /> {t('analyseDocuments')}
          </button>
          <button
            onClick={loadSampleDocument}
            className="w-full sm:w-auto px-5 py-3.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-emerald-700" /> {t('trySample')}
          </button>
        </div>
      </div>

      <PhotoCaptureModal
        open={captureTarget !== null}
        onClose={() => setCaptureTarget(null)}
        onConfirm={onCaptureConfirm}
        targetLabel={
          captureTarget?.kind === 'supporting' ? captureTarget.docType : t('primaryDocLabel')
        }
      />
    </div>
  );
};
