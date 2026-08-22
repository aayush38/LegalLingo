'use client';

import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Edit3, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getTranslation } from '@/lib/translations';

interface OcrTextEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OcrTextEditorModal: React.FC<OcrTextEditorModalProps> = ({ isOpen, onClose }) => {
  const { currentAnalysis, updateExtractedText, isAnalyzing, language } = useApp();
  const [editedText, setEditedText] = useState<string>('');

  useEffect(() => {
    if (currentAnalysis) {
      setEditedText(currentAnalysis.originalText || '');
    }
  }, [currentAnalysis]);

  if (!isOpen || !currentAnalysis) return null;

  const handleSaveAndReAnalyze = async () => {
    await updateExtractedText(editedText);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-emerald-100 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-emerald-950">{getTranslation('editExtractedTextTitle', language)}</h3>
              <p className="text-xs text-gray-500 font-semibold">
                {getTranslation('editExtractedTextSubText', language)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Textarea Editor */}
        <div className="flex-1 overflow-y-auto mb-6">
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full h-80 p-4 bg-slate-50 border border-slate-300 rounded-2xl font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
            placeholder={getTranslation('editExtractedTextPlaceholder', language)}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl text-xs font-bold"
          >
            {getTranslation('cancelLabel', language)}
          </button>

          <button
            onClick={handleSaveAndReAnalyze}
            disabled={isAnalyzing}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{getTranslation('rerunAnalysisLabel', language)}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
