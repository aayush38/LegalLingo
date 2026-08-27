'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX, Columns, AlignLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { applyPrivacyMask } from '@/lib/privacy';
import { getTranslatedExplanation } from '@/lib/ai';
import { getTranslation } from '@/lib/translations';

interface DocumentReaderProps {
  onOpenOcrEditor?: () => void;
}

export const DocumentReader: React.FC<DocumentReaderProps> = () => {
  const { currentAnalysis, language, translationCache, privacyShield, selectedParagraphId, setSelectedParagraphId } = useApp();
  const [viewMode, setViewMode] = useState<'sideBySide' | 'simple' | 'original'>('sideBySide');
  const [speakingParagraphId, setSpeakingParagraphId] = useState<number | null>(null);

  if (!currentAnalysis || !currentAnalysis.paragraphs) return null;

  // Speech Synthesis Helper
  const speakText = (text: string, id: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingParagraphId === id) {
      window.speechSynthesis.cancel();
      setSpeakingParagraphId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    if (language === 'hi') utterance.lang = 'hi-IN';
    else if (language === 'mr') utterance.lang = 'mr-IN';
    else if (language === 'gu') utterance.lang = 'gu-IN';
    else utterance.lang = 'en-US';

    utterance.onend = () => setSpeakingParagraphId(null);
    utterance.onerror = () => setSpeakingParagraphId(null);

    setSpeakingParagraphId(id);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-100 mb-10">

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {getTranslation('documentReaderLabel', language)}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-emerald-950">
            {getTranslation('weReadYourDoc', language)}
          </h2>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 flex-wrap">

          <div className="flex items-center bg-gray-100 p-1 rounded-2xl border border-gray-200">
            <button
              onClick={() => setViewMode('sideBySide')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${viewMode === 'sideBySide' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-700 hover:text-emerald-700'
                }`}
            >
              <Columns className="w-3.5 h-3.5" /> {getTranslation('sideBySide', language)}
            </button>

            <button
              onClick={() => setViewMode('simple')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${viewMode === 'simple' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-700 hover:text-emerald-700'
                }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> {getTranslation('simple', language)}
            </button>

            <button
              onClick={() => setViewMode('original')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${viewMode === 'original' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-700 hover:text-emerald-700'
                }`}
            >
              <AlignLeft className="w-3.5 h-3.5" /> {getTranslation('original', language)}
            </button>
          </div>
        </div>
      </div>

      {/* Reader Body Content */}
      <div className="mt-6">

        {/* MODE 1: SIDE-BY-SIDE */}
        {viewMode === 'sideBySide' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* LEFT SIDE: Original Document */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4 max-h-[550px] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <AlignLeft className="w-4 h-4 text-slate-500" /> {getTranslation('originalLegalDoc', language)}
                </h3>
              </div>

              {currentAnalysis.paragraphs.map((para) => {
                const isSelected = selectedParagraphId === para.id;
                const originalText = applyPrivacyMask(para.original, privacyShield);
                return (
                  <div
                    key={para.id}
                    onClick={() => setSelectedParagraphId(isSelected ? null : para.id)}
                    className={`p-3.5 rounded-xl text-xs leading-relaxed transition-all cursor-pointer font-mono border ${isSelected
                        ? 'bg-emerald-100/90 border-emerald-500 text-slate-900 shadow-sm font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'
                      }`}
                  >
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">{getTranslation('paraLabel', language)} #{para.id}</span>
                    {originalText}
                  </div>
                );
              })}
            </div>

            {/* RIGHT SIDE: Simple Explanation */}
            <div className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-200 space-y-4 max-h-[550px] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                <h3 className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" /> {getTranslation('simpleExplanation', language)}
                </h3>
              </div>

              {currentAnalysis.paragraphs.map((para) => {
                const isSelected = selectedParagraphId === para.id;
                const simpleText = applyPrivacyMask(
                  getTranslatedExplanation(para.simple, language, translationCache),
                  privacyShield
                );
                return (
                  <div
                    key={para.id}
                    onClick={() => setSelectedParagraphId(isSelected ? null : para.id)}
                    className={`p-4 rounded-xl text-sm leading-relaxed transition-all cursor-pointer border ${isSelected
                        ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-400 text-emerald-950 font-medium'
                        : 'bg-white/80 border-emerald-100 text-gray-800 hover:border-emerald-300'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> #{para.id}
                      </span>

                      {/* Text to Speech Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speakText(simpleText, para.id);
                        }}
                        className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-bold ${speakingParagraphId === para.id
                            ? 'bg-emerald-600 text-white animate-pulse'
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          }`}
                      >
                        {speakingParagraphId === para.id ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5" /> {getTranslation('stopAudio', language)}
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" /> {getTranslation('listenAudio', language)}
                          </>
                        )}
                      </button>
                    </div>

                    <p className="font-semibold text-gray-900 text-base">{simpleText}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MODE 2: SIMPLE ONLY */}
        {viewMode === 'simple' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            {currentAnalysis.paragraphs.map((para) => {
              const simpleText = applyPrivacyMask(
                getTranslatedExplanation(para.simple, language, translationCache),
                privacyShield
              );
              return (
                <div key={para.id} className="bg-emerald-50/70 rounded-2xl p-5 border border-emerald-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-extrabold text-emerald-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" /> #{para.id}
                    </h4>
                    <button
                      onClick={() => speakText(simpleText, para.id)}
                      className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <Volume2 className="w-3.5 h-3.5" /> {getTranslation('listenAudio', language)}
                    </button>
                  </div>
                  <p className="text-lg font-bold text-gray-900 leading-snug">{simpleText}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* MODE 3: ORIGINAL ONLY */}
        {viewMode === 'original' && (
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 max-w-4xl mx-auto">
            <h4 className="font-extrabold text-slate-900 text-base mb-3 flex items-center gap-2">
              <AlignLeft className="w-5 h-5 text-slate-600" /> {getTranslation('originalLegalDoc', language)}
            </h4>
            <div className="bg-white p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
              {applyPrivacyMask(currentAnalysis.originalText, privacyShield)}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
