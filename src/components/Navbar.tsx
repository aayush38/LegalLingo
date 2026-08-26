'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, ShieldAlert, Globe, FileText, Landmark, FolderHeart, Menu, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { SUPPORTED_LANGUAGES, LanguageCode } from '@/lib/types';
import { getTranslation } from '@/lib/translations';
import { UserMenu } from './UserMenu';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { language, setLanguage, privacyShield, togglePrivacyShield } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Tagline */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl text-emerald-950 tracking-tight">LegalLingo</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-medium hidden sm:block">
                {getTranslation('navTagline', language)}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                pathname === '/'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:text-emerald-700 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> {getTranslation('home', language)}
              </span>
            </Link>

            <Link
              href="/schemes"
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                pathname === '/schemes'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:text-emerald-700 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Landmark className="w-4 h-4" /> {getTranslation('govtSchemes', language)}
              </span>
            </Link>

            <Link
              href="/my-documents"
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                pathname === '/my-documents'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:text-emerald-700 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <FolderHeart className="w-4 h-4" /> {getTranslation('myDocuments', language)}
              </span>
            </Link>
          </nav>

          {/* Controls: Language & Privacy Shield */}
          <div className="hidden md:flex items-center gap-3">
            
            {/* Privacy Shield Toggle */}
            <button
              onClick={togglePrivacyShield}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                privacyShield
                  ? 'bg-emerald-600 text-white shadow-emerald-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={getTranslation('privacyShieldTooltip', language)}
            >
              {privacyShield ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-white animate-pulse" />
                  <span>{getTranslation('privacyShieldOn', language)}</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-gray-500" />
                  <span>{getTranslation('privacyShieldOff', language)}</span>
                </>
              )}
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative flex items-center bg-emerald-50/80 rounded-lg px-2.5 py-1.5 border border-emerald-200">
              <Globe className="w-4 h-4 text-emerald-600 mr-1.5" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="bg-transparent text-xs font-bold text-emerald-900 focus:outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>

            <UserMenu />
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={togglePrivacyShield}
              className={`p-1.5 rounded-full ${privacyShield ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              <ShieldCheck className="w-4 h-4" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-emerald-100 bg-white px-4 py-3 space-y-3">
          <div className="flex flex-col space-y-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-emerald-50"
            >
              {getTranslation('home', language)}
            </Link>
            <Link
              href="/schemes"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-emerald-50"
            >
              {getTranslation('govtSchemes', language)}
            </Link>
            <Link
              href="/my-documents"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-emerald-50"
            >
              {getTranslation('myDocuments', language)}
            </Link>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600">{getTranslation('languageColonLabel', language)}</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              className="bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 rounded px-2 py-1"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 border-t border-gray-100 flex justify-start">
            <UserMenu compact />
          </div>
        </div>
      )}
    </header>
  );
};
