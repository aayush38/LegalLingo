'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mail, ShieldCheck, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { getTranslation } from '@/lib/translations';
import {
  requestEmailOtp,
  verifyEmailOtp,
  RESEND_COOLDOWN_SECONDS,
  type AuthErrorKey
} from '@/lib/auth/authService';
import { parseEmail, maskEmail, isValidOtp } from '@/lib/auth/email';

type Step = 'email' | 'otp';

/**
 * Email + one-time-code sign-in.
 *
 * Signing in is optional throughout: the modal can always be dismissed and the
 * app keeps working as a guest. That is deliberate — someone standing in a
 * tehsil office trying to understand a notice should never be blocked behind
 * an account. What signing in buys is that the document is still there
 * tomorrow.
 */
export const AuthModal: React.FC = () => {
  const { language } = useApp();
  const { isAuthModalOpen, closeAuthModal } = useAuth();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<AuthErrorKey | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  const t = (key: string) => getTranslation(key, language);

  const reset = useCallback(() => {
    setStep('email');
    setEmail('');
    setOtp('');
    setBusy(false);
    setErrorKey(null);
    setCooldown(0);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    closeAuthModal();
  }, [reset, closeAuthModal]);

  // Resend countdown.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  useEffect(() => {
    if (!isAuthModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isAuthModalOpen, handleClose]);

  // Focus the field that matters for the current step.
  useEffect(() => {
    if (!isAuthModalOpen) return;
    const target = step === 'email' ? emailInputRef.current : otpInputRef.current;
    const id = setTimeout(() => target?.focus(), 80);
    return () => clearTimeout(id);
  }, [isAuthModalOpen, step]);

  if (!isAuthModalOpen) return null;

  const parsed = parseEmail(email);

  const sendCode = async () => {
    setErrorKey(null);
    if (!parsed.ok) {
      setErrorKey('authErrorInvalidEmail');
      return;
    }
    setBusy(true);
    const result = await requestEmailOtp(email);
    setBusy(false);

    if (!result.ok) {
      setErrorKey(result.errorKey ?? 'authErrorGeneric');
      return;
    }
    setStep('otp');
    setCooldown(RESEND_COOLDOWN_SECONDS);
  };

  const submitCode = async () => {
    setErrorKey(null);
    if (!isValidOtp(otp)) {
      setErrorKey('authErrorInvalidOtp');
      return;
    }
    setBusy(true);
    const result = await verifyEmailOtp(email, otp);
    setBusy(false);

    if (!result.ok) {
      setErrorKey(result.errorKey ?? 'authErrorGeneric');
      return;
    }
    // AuthContext picks the new session up through onAuthStateChange.
    handleClose();
  };

  const resend = async () => {
    if (cooldown > 0 || busy) return;
    setErrorKey(null);
    setBusy(true);
    const result = await requestEmailOtp(email);
    setBusy(false);
    if (!result.ok) {
      setErrorKey(result.errorKey ?? 'authErrorGeneric');
      return;
    }
    setCooldown(RESEND_COOLDOWN_SECONDS);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-emerald-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border-2 border-emerald-500 max-h-[94vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-6 pb-4">
          <div className="flex items-start gap-3 min-w-0">
            {step === 'otp' && (
              <button
                onClick={() => {
                  setStep('email');
                  setOtp('');
                  setErrorKey(null);
                }}
                aria-label={t('changeNumber')}
                className="p-1.5 -ml-1 text-emerald-700 hover:bg-emerald-50 rounded-lg flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              {step === 'email' ? (
                <Mail className="w-6 h-6" />
              ) : (
                <ShieldCheck className="w-6 h-6" />
              )}
            </div>
            <div className="min-w-0">
              <h2 id="auth-modal-title" className="text-lg font-black text-emerald-950 leading-tight">
                {step === 'email' ? t('authModalTitle') : t('otpTitle')}
              </h2>
              <p className="text-xs text-gray-600 font-medium mt-1">
                {step === 'email' ? (
                  t('authModalSubtitle')
                ) : (
                  <>
                    {t('otpSentTo')}{' '}
                    <span className="font-bold text-emerald-800 break-all">
                      {parsed.email ? maskEmail(parsed.email) : email}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label={t('closeLabel')}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {step === 'email' ? (
            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-bold text-emerald-900 uppercase tracking-wide mb-1.5"
              >
                {t('emailLabel')}
              </label>
              <input
                ref={emailInputRef}
                id="auth-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorKey(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && parsed.ok && !busy) void sendCode();
                }}
                className="w-full px-4 py-3 border-2 border-emerald-200 focus:border-emerald-600 rounded-xl text-base font-bold text-emerald-950 outline-none transition-colors"
              />
            </div>
          ) : (
            <div>
              <label
                htmlFor="auth-otp"
                className="block text-xs font-bold text-emerald-900 uppercase tracking-wide mb-1.5"
              >
                {t('otpLabel')}
              </label>
              <input
                ref={otpInputRef}
                id="auth-otp"
                type="text"
                inputMode="numeric"
                // Lets Android and iOS offer the code straight from the SMS.
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="––––––"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setErrorKey(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isValidOtp(otp) && !busy) void submitCode();
                }}
                className="w-full px-4 py-3.5 border-2 border-emerald-200 focus:border-emerald-600 rounded-xl text-center text-2xl font-black tracking-[0.5em] text-emerald-950 outline-none transition-colors"
              />
            </div>
          )}

          {errorKey && (
            <div
              role="alert"
              className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-300"
            >
              <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-amber-900 leading-relaxed">{t(errorKey)}</p>
            </div>
          )}

          {step === 'email' ? (
            <button
              onClick={sendCode}
              disabled={!parsed.ok || busy}
              className="w-full px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all active:scale-95"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {busy ? t('sendingOtp') : t('sendOtp')}
            </button>
          ) : (
            <div className="space-y-2.5">
              <button
                onClick={submitCode}
                disabled={!isValidOtp(otp) || busy}
                className="w-full px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all active:scale-95"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                {busy ? t('verifyingOtp') : t('verifyOtpAction')}
              </button>

              <p className="text-[11px] text-gray-500 font-medium text-center">
                {t('checkSpamNote')}
              </p>

              <button
                onClick={resend}
                disabled={cooldown > 0 || busy}
                className="w-full text-xs font-bold text-emerald-700 hover:text-emerald-900 disabled:text-gray-400 disabled:cursor-not-allowed py-1.5"
              >
                {cooldown > 0
                  ? `${t('resendIn')} ${cooldown}${t('secondsShort')}`
                  : t('resendOtp')}
              </button>
            </div>
          )}

          <div className="pt-2 border-t border-emerald-100">
            <p className="text-[11px] text-gray-500 font-medium leading-relaxed mb-2.5">
              {t('authWhySignIn')}
            </p>
            <button
              onClick={handleClose}
              className="w-full px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-sm transition-colors"
            >
              {t('continueAsGuest')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
