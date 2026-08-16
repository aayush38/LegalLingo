'use client';

import React from 'react';
import { Mic, BookOpenCheck, ShieldAlert, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { UploadDropzone } from './UploadDropzone';
import { useApp } from '@/context/AppContext';

export const LandingHero: React.FC = () => {
  const { setIsChatOpen, loadSampleDocument } = useApp();

  return (
    <section className="relative pt-6 pb-12 overflow-hidden">
      
      {/* Background Accent Gradients */}
      <div className="absolute top-0 inset-x-0 h-96 green-gradient-bg -z-10 rounded-b-[40px] opacity-95 shadow-lg" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white pt-6 pb-10">
        
        {/* Main Hero Tagline */}
        <div className="inline-flex items-center gap-2 bg-emerald-800/60 backdrop-blur-md px-4 py-1.5 rounded-full text-emerald-200 text-xs sm:text-sm font-bold border border-emerald-500/30 mb-6">
          <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
          <span>Smart India Hackathon Prototype</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-4 drop-shadow-sm">
          समझें. पूछें. आगे बढ़ें.
        </h1>
        
        <p className="text-xl sm:text-2xl font-bold text-emerald-100 max-w-3xl mx-auto mb-3">
          Understand legal documents in your own language.
        </p>

        <p className="text-sm sm:text-base text-emerald-200/90 max-w-2xl mx-auto font-medium mb-8">
          Upload any legal contract, agreement, or notice. LegalLingo explains what it says, detects hidden risks, and guides your next steps.
        </p>

        {/* Quick Voice Ask Button */}
        <div className="flex justify-center mb-10">
          <button
            onClick={() => setIsChatOpen(true)}
            className="px-6 py-3 bg-white text-emerald-900 hover:bg-emerald-50 rounded-full font-extrabold text-sm shadow-lg flex items-center gap-2.5 transition-transform hover:scale-105 border-2 border-emerald-400"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center animate-bounce">
              <Mic className="w-3.5 h-3.5" />
            </div>
            <span>🎙 Ask LegalLingo by Voice</span>
          </button>
        </div>

        {/* Embedded Upload Uploader Box */}
        <UploadDropzone />
      </div>

      {/* Three Civic Feature Cards: Understand, Check, Act */}
      <div className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white rounded-3xl p-6 shadow-md border border-emerald-100 hover:shadow-xl transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <BookOpenCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-emerald-950 mb-2">1. Understand</h3>
          <p className="text-sm text-gray-600 font-medium">
            Complex legal wording is converted into very simple citizen English, Hindi, Marathi, and Gujarati with side-by-side comparison.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-md border border-emerald-100 hover:shadow-xl transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-emerald-950 mb-2">2. Check</h3>
          <p className="text-sm text-gray-600 font-medium">
            Automatically identifies risky cancellation clauses, missing survey/Gat numbers, incomplete witness records, and missing info.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-md border border-emerald-100 hover:shadow-xl transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-emerald-950 mb-2">3. Act</h3>
          <p className="text-sm text-gray-600 font-medium">
            Generates checkable citizen action steps, connects with land record portals (7/12 Mahabhulekh), and matches government schemes.
          </p>
        </div>
      </div>
    </section>
  );
};
