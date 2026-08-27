'use client';

import React from 'react';
import { UploadDropzone } from './UploadDropzone';
import { useApp } from '@/context/AppContext';
import { getTranslation } from '@/lib/translations';

export const LandingHero: React.FC = () => {
  const { language } = useApp();

  return (
    <section className="relative pt-6 pb-12 overflow-hidden">

      {/* Background Accent Gradients */}
      <div className="absolute top-0 inset-x-0 h-96 green-gradient-bg -z-10 rounded-b-[40px] opacity-95 shadow-lg" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-6 pb-10">

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

        {/* Embedded Upload Uploader Box */}
        <UploadDropzone />
      </div>

      {/*
        The redesign branch put a floating chat launcher here. It lives in
        ChatLauncher instead, mounted once in the root layout, so it is reachable
        from every page rather than only this one — and so there is one button
        rather than two stacked on the same corner.
      */}
    </section>
  );
};
