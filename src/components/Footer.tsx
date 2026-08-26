'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, FileText, Landmark, FolderHeart, Mic, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getTranslation } from '@/lib/translations';

export const Footer: React.FC = () => {
  const { setIsChatOpen, language } = useApp();

  return (
    <footer className="bg-emerald-950 text-white pt-12 pb-24 sm:pb-12 border-t border-emerald-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Brand Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-black text-xl text-white tracking-tight">LegalLingo</span>
          </div>
          <p className="text-xs text-emerald-300/90 font-medium max-w-2xl leading-relaxed">
            {getTranslation('footerBrandTagline', language)}
          </p>
        </div>

        {/* Legal & Civic Disclaimer */}
        <div className="bg-emerald-900/80 border border-emerald-700/60 rounded-2xl p-4 sm:p-5 text-xs leading-relaxed text-emerald-200 shadow-sm">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-extrabold text-amber-300 uppercase tracking-wider">
                {getTranslation('disclaimerTitle', language)}
              </h4>
              <p className="font-medium text-emerald-100 leading-relaxed">
                {getTranslation('disclaimerText', language)}
              </p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-4 border-t border-emerald-900 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-400 font-semibold gap-2">
          <span>{getTranslation('copyrightText', language)}</span>
        </div>

      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-emerald-950/95 backdrop-blur-md border-t border-emerald-800 py-2.5 px-4 z-40 flex items-center justify-around">
        <Link href="/" className="flex flex-col items-center text-[10px] font-bold text-emerald-200">
          <FileText className="w-5 h-5 text-emerald-400 mb-0.5" />
          <span>{getTranslation('home', language)}</span>
        </Link>

        <Link href="/schemes" className="flex flex-col items-center text-[10px] font-bold text-emerald-200">
          <Landmark className="w-5 h-5 text-emerald-400 mb-0.5" />
          <span>{getTranslation('govtSchemes', language)}</span>
        </Link>

        <button
          type="button"
          onClick={() => setIsChatOpen(true)}
          title={getTranslation('chatbotLauncherLabel', language)}
          aria-label={getTranslation('chatbotLauncherLabel', language)}
          className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] text-[10px] font-bold text-white bg-emerald-600 p-2 rounded-full shadow-lg -mt-4 border-2 border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:outline-none"
        >
          <Mic className="w-5 h-5 text-white" />
        </button>

        <Link href="/my-documents" className="flex flex-col items-center text-[10px] font-bold text-emerald-200">
          <FolderHeart className="w-5 h-5 text-emerald-400 mb-0.5" />
          <span>{getTranslation('myDocuments', language)}</span>
        </Link>
      </div>

    </footer>
  );
};
