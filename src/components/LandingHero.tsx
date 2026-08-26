'use client';

import React from 'react';
import { Mic, Sparkles } from 'lucide-react';
import { UploadDropzone } from './UploadDropzone';
import { useApp } from '@/context/AppContext';
import { getTranslation } from '@/lib/translations';

export const LandingHero: React.FC = () => {
  const { setIsChatOpen, language } = useApp();

  return (
    <section className="relative pt-6 pb-12 overflow-hidden">
      
      {/* Background Accent Gradients */}
      <div className="absolute top-0 inset-x-0 h-96 green-gradient-bg -z-10 rounded-b-[40px] opacity-95 shadow-lg" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-6 pb-10">
        
        {/* Civic Tech Platform Badge */}
        <div className="inline-flex items-center gap-2 bg-emerald-900/90 backdrop-blur-md px-4 py-1.5 rounded-full text-emerald-100 text-xs sm:text-sm font-black border border-emerald-400/40 mb-6 shadow-sm">
          <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
          <span>Civic Tech Platform</span>
        </div>

        {/* Hero Tagline: Bold & Black as requested */}
        <div className="mb-4">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight text-black bg-white py-3 px-8 rounded-3xl inline-block border-2 border-emerald-400 shadow-xl">
            {getTranslation('taglineHeroTitle', language)}
          </h1>
        </div>
        
        {/* Subtitles: High Contrast, Crisp Dark Text, Bold & Visible */}
        <div className="bg-white/95 backdrop-blur-md max-w-3xl mx-auto rounded-2xl p-4 sm:p-6 border border-emerald-200 shadow-lg mb-8 space-y-2">
          <h2 className="text-xl sm:text-3xl font-black text-slate-950 tracking-tight leading-snug">
            {getTranslation('taglineHero', language)}
          </h2>

          <p className="text-sm sm:text-base text-slate-800 font-bold max-w-2xl mx-auto leading-relaxed">
            {getTranslation('heroSubText', language)}
          </p>
        </div>

        {/* Quick Voice Ask Button */}
        <div className="flex justify-center mb-10">
          <button
            onClick={() => setIsChatOpen(true)}
            className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full font-black text-sm shadow-xl flex items-center gap-2.5 transition-transform hover:scale-105 border-2 border-emerald-400"
          >
            <div className="w-6 h-6 rounded-full bg-white text-emerald-800 flex items-center justify-center animate-bounce">
              <Mic className="w-4 h-4" />
            </div>
            <span>{getTranslation('askByVoice', language)}</span>
          </button>
        </div>

        {/* Embedded Upload Uploader Box */}
        <UploadDropzone />
      </div>
    </section>
  );
};
