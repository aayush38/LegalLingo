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
        
        {/* Top Disclaimer Box */}
        <div className="bg-emerald-900/80 border border-emerald-700/60 rounded-2xl p-4 sm:p-6 text-xs leading-relaxed text-emerald-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-amber-300 uppercase tracking-wider mb-1">
                {getTranslation('disclaimerTitle', language)}
              </h4>
              <p className="font-medium text-emerald-100">
                {getTranslation('disclaimerText', language)} Important legal and government information should be verified from official government sources (such as Mahabhulekh 7/12 & IGR Maharashtra).
              </p>
            </div>
          </div>
        </div>

        {/* Footer Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-4">
          
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-black text-xl text-white">LegalLingo</span>
            </div>
            <p className="text-xs text-emerald-300/80 font-medium">
              Legal made simple. Government services made accessible. Civic Tech Platform for Citizens.
            </p>
          </div>

          {/* Col 2: Core Tools */}
          <div>
            <h4 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider mb-3">
              Core Capabilities
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-emerald-200">
              <li>• OCR PDF & Image Text Extraction</li>
              <li>• Side-by-Side Paragraph Reader</li>
              <li>• Clause Risk & Cancellation Flags</li>
              <li>• Survey Number & Missing Info Audit</li>
              <li>• Multilingual Hindi, Marathi, Gujarati</li>
            </ul>
          </div>

          {/* Col 3: Government Portals */}
          <div>
            <h4 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider mb-3">
              Civic Portals
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-emerald-200">
              <li>
                <a href="https://bhulekh.mahabhumi.gov.in" target="_blank" rel="noreferrer" className="hover:underline">
                  • Mahabhulekh 7/12 Land Records
                </a>
              </li>
              <li>
                <a href="https://igrmaharashtra.gov.in" target="_blank" rel="noreferrer" className="hover:underline">
                  • Sub-Registrar Stamp Duty
                </a>
              </li>
              <li>
                <a href="https://pmkisan.gov.in" target="_blank" rel="noreferrer" className="hover:underline">
                  • PM-Kisan Samman Nidhi
                </a>
              </li>
              <li>
                <a href="https://nalsa.gov.in" target="_blank" rel="noreferrer" className="hover:underline">
                  • NALSA Free Legal Aid
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Target Audience */}
          <div>
            <h4 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider mb-3">
              Target Citizens
            </h4>
            <p className="text-xs text-emerald-300 font-medium leading-relaxed">
              Designed for rural citizens, farmers, senior citizens, non-lawyers, and citizens unfamiliar with complex legal terminology across India.
            </p>
          </div>

        </div>

        {/* Copyright */}
        <div className="pt-6 border-t border-emerald-900 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-400 font-semibold gap-2">
          <span>© 2026 LegalLingo - Civic Tech Platform.</span>
          <span>Civic Tech for Inclusive Governance</span>
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
          onClick={() => setIsChatOpen(true)}
          className="flex flex-col items-center text-[10px] font-bold text-white bg-emerald-600 p-2 rounded-full shadow-lg -mt-4 border-2 border-emerald-400"
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
