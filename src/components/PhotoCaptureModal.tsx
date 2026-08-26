'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, X, Trash2, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getTranslation } from '@/lib/translations';

interface CapturedPhoto {
  id: string;
  file: File;
  url: string;
}

interface PhotoCaptureModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (files: File[]) => void;
  /** Shown in the header so the user knows what these pages are being added to. */
  targetLabel: string;
}

/**
 * Collects several photos of one document, one page per shot.
 *
 * Replaces the old single-shot camera input, which overwrote the previous photo
 * every time — unusable for a multi-page agreement, which is the common case
 * when someone photographs a document rather than scanning it.
 */
export const PhotoCaptureModal: React.FC<PhotoCaptureModalProps> = ({
  open,
  onClose,
  onConfirm,
  targetLabel
}) => {
  const { language } = useApp();
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // Object URLs are only freed on unmount, not on every render, or the
  // thumbnails would go blank as soon as the list changes.
  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files || []);
    if (incoming.length > 0) {
      setPhotos((prev) => [
        ...prev,
        ...incoming.map((file) => ({
          id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          url: URL.createObjectURL(file)
        }))
      ]);
    }
    // Reset so shooting the same-named file again still fires onChange.
    e.target.value = '';
  };

  const remove = (id: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
  };

  const confirm = () => {
    onConfirm(photos.map((p) => p.file));
    setPhotos([]);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-emerald-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={getTranslation('photoCaptureTitle', language)}
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border-2 border-emerald-500 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-emerald-100">
          <div>
            <h3 className="text-lg font-black text-emerald-950">
              {getTranslation('photoCaptureTitle', language)}
            </h3>
            <p className="text-xs font-semibold text-emerald-700 mt-0.5">{targetLabel}</p>
            <p className="text-xs text-gray-600 font-medium mt-1.5 max-w-sm">
              {getTranslation('photoCaptureHint', language)}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={getTranslation('closeLabel', language)}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {photos.length === 0 ? (
            <div className="text-center py-8 text-sm font-semibold text-gray-500">
              <Camera className="w-10 h-10 mx-auto mb-3 text-emerald-300" />
              {getTranslation('photoCaptureHint', language)}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, idx) => (
                <div key={photo.id} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={`Page ${idx + 1}`}
                    className="w-full h-28 object-cover rounded-xl border-2 border-emerald-200"
                  />
                  <span className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md">
                    {idx + 1}
                  </span>
                  <button
                    onClick={() => remove(photo.id)}
                    aria-label={`${getTranslation('removeFile', language)} ${idx + 1}`}
                    className="absolute top-1.5 right-1.5 bg-white/95 text-red-600 rounded-lg p-1 shadow-sm hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-emerald-100 space-y-3">
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" multiple onChange={addFiles} className="hidden" />
          <input ref={galleryRef} type="file" accept="image/*" multiple onChange={addFiles} className="hidden" />

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => cameraRef.current?.click()}
              className="flex-1 px-4 py-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Camera className="w-4 h-4" />
              {photos.length === 0
                ? getTranslation('takePhoto', language)
                : getTranslation('takeAnotherPhoto', language)}
            </button>
            <button
              onClick={() => galleryRef.current?.click()}
              className="flex-1 px-4 py-3 bg-white border-2 border-emerald-300 hover:bg-emerald-50 text-emerald-800 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <ImagePlus className="w-4 h-4" />
              {getTranslation('chooseFromGallery', language)}
            </button>
          </div>

          <button
            onClick={confirm}
            disabled={photos.length === 0}
            className="w-full px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            {getTranslation('doneAdding', language)}
            {photos.length > 0 ? ` · ${photos.length} ${getTranslation('photosAdded', language)}` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};
