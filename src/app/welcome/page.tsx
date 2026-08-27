'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Globe, LogIn, ArrowRight, ArrowLeft, UserRound, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/types';
import { getTranslation } from '@/lib/translations';
import { markOnboarded } from '@/lib/onboarding';

type Step = 'language' | 'account';

/**
 * First-run landing: choose a language, then choose whether to have an account.
 *
 * Language comes first on purpose. Everything after it — including the question
 * about signing in — is then asked in a language the citizen actually reads,
 * rather than making them agree to something in English first.
 */
export default function WelcomePage() {
  const router = useRouter();
  const { language, setLanguage } = useApp();
  const { openAuthModal, user } = useAuth();
  const [step, setStep] = useState<Step>('language');

  const t = (key: string) => getTranslation(key, language);

  const enterApp = useCallback(() => {
    markOnboarded();
    router.replace('/');
  }, [router]);

  /**
   * Signing in finishes the welcome flow.
   *
   * Without this the modal closes on success and leaves the citizen looking at
   * the same "sign in or continue as guest" screen they just completed, with no
   * sign anything happened.
   */
  useEffect(() => {
    if (user) enterApp();
  }, [user, enterApp]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10 bg-gradient-to-b from-emerald-50/60 to-transparent">
      <div className="w-full max-w-xl">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 flex items-center justify-center text-white shadow-lg mx-auto mb-4">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-emerald-950 tracking-tight">
            {t('welcomeTitle')}
          </h1>
          <p className="text-sm text-gray-600 font-medium mt-2 max-w-md mx-auto">
            {t('welcomeSubtitle')}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6" aria-hidden="true">
          {(['language', 'account'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <span
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  step === s || (step === 'account' && i === 0)
                    ? 'bg-emerald-600'
                    : 'bg-emerald-200'
                }`}
              />
              {i === 0 && <span className="w-8 h-0.5 bg-emerald-200" />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white rounded-3xl border-2 border-emerald-200 shadow-xl p-6 sm:p-8">
          {step === 'language' ? (
            <>
              <div className="flex items-center gap-2.5 mb-1">
                <Globe className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-black text-emerald-950">{t('chooseLanguageTitle')}</h2>
              </div>
              <p className="text-xs text-gray-600 font-medium mb-5">
                {t('chooseLanguageSubtitle')}
              </p>

              <div
                role="radiogroup"
                aria-label={t('chooseLanguageTitle')}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
              >
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const selected = language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setLanguage(lang.code as LanguageCode)}
                      className={`flex items-center justify-between gap-2 px-4 py-3.5 rounded-2xl border-2 text-left transition-all ${
                        selected
                          ? 'border-emerald-600 bg-emerald-50 shadow-sm'
                          : 'border-emerald-100 hover:border-emerald-300 bg-white'
                      }`}
                    >
                      <span>
                        <span className="block text-base font-black text-emerald-950">
                          {lang.nativeName}
                        </span>
                        <span className="block text-[11px] font-semibold text-gray-500">
                          {lang.name}
                        </span>
                      </span>
                      {selected && <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setStep('account')}
                className="w-full mt-6 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-transform active:scale-95"
              >
                {getTranslation('continueLabel', language)}
                <ArrowRight className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2.5 mb-1">
                <LogIn className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-black text-emerald-950">{t('accountChoiceTitle')}</h2>
              </div>
              <p className="text-xs text-gray-600 font-medium mb-5 leading-relaxed">
                {t('accountChoiceSubtitle')}
              </p>

              <div className="space-y-2.5">
                <button
                  onClick={() => {
                    // The modal opens over this page. On success the effect
                    // above sees the new user and moves straight into the app.
                    markOnboarded();
                    openAuthModal();
                  }}
                  className="w-full px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-transform active:scale-95"
                >
                  <LogIn className="w-5 h-5" />
                  {t('createOrSignIn')}
                </button>

                <button
                  onClick={enterApp}
                  className="w-full px-6 py-4 bg-white border-2 border-emerald-300 hover:bg-emerald-50 text-emerald-800 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-colors"
                >
                  <UserRound className="w-5 h-5" />
                  {t('continueAsGuest')}
                </button>
              </div>

              <p className="text-[11px] text-gray-500 font-medium text-center mt-4">
                {t('guestChoiceNote')}
              </p>

              <div className="mt-5 pt-4 border-t border-emerald-100 flex items-center justify-between">
                <button
                  onClick={() => setStep('language')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('backLabel')}
                </button>


              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
