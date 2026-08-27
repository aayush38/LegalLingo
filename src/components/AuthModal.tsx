'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mail, Loader2, AlertCircle, Eye, EyeOff, MailCheck, LogIn, UserPlus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { getTranslation } from '@/lib/translations';
import {
  signInWithPassword,
  signUpWithPassword,
  requestPasswordReset,
  MIN_PASSWORD_LENGTH,
  type AuthErrorKey
} from '@/lib/auth/authService';
import { parseEmail } from '@/lib/auth/email';

type Mode = 'signIn' | 'signUp';

/**
 * Email and password sign-in.
 *
 * Password rather than an emailed code, for a practical reason: signing in this
 * way sends no email at all. Supabase's built-in mailer is rate limited to a
 * handful of messages an hour, so an emailed code would simply fail for the
 * third citizen of the hour.
 *
 * Signing in stays optional throughout — the modal can always be dismissed and
 * the app keeps working as a guest. Someone standing in a tehsil office trying
 * to understand a notice should never be blocked behind an account.
 */
export const AuthModal: React.FC = () => {
  const { language } = useApp();
  const { isAuthModalOpen, closeAuthModal } = useAuth();

  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<AuthErrorKey | null>(null);
  const [notice, setNotice] = useState<'checkInbox' | 'resetSent' | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const t = (key: string) => getTranslation(key, language);

  const reset = useCallback(() => {
    setMode('signIn');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setBusy(false);
    setErrorKey(null);
    setNotice(null);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    closeAuthModal();
  }, [reset, closeAuthModal]);

  useEffect(() => {
    if (!isAuthModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isAuthModalOpen, handleClose]);

  useEffect(() => {
    if (!isAuthModalOpen) return;
    const id = setTimeout(() => emailRef.current?.focus(), 80);
    return () => clearTimeout(id);
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const emailOk = parseEmail(email).ok;
  const passwordOk = password.length >= MIN_PASSWORD_LENGTH;
  const canSubmit = emailOk && passwordOk && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setErrorKey(null);
    setNotice(null);
    setBusy(true);

    const result =
      mode === 'signIn'
        ? await signInWithPassword(email, password)
        : await signUpWithPassword(email, password);

    setBusy(false);

    if (!result.ok) {
      setErrorKey(result.errorKey ?? 'authErrorGeneric');
      return;
    }
    if (result.needsEmailConfirmation) {
      // The account exists but cannot be used yet. Say so plainly rather than
      // closing the modal and leaving them apparently still signed out.
      setNotice('checkInbox');
      return;
    }
    // AuthContext picks the session up through onAuthStateChange.
    handleClose();
  };

  const forgotPassword = async () => {
    if (!emailOk || busy) {
      setErrorKey('authErrorInvalidEmail');
      return;
    }
    setErrorKey(null);
    setBusy(true);
    await requestPasswordReset(email);
    setBusy(false);
    // The same message whether or not the address has an account: anything else
    // turns this into a way of discovering who has one.
    setNotice('resetSent');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-emerald-950/60 backdrop-blur-sm overflow-y-auto overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={handleClose}
    >
      <div className="min-h-full flex items-end sm:items-start justify-center p-0 sm:py-10 sm:px-4">
        <div
          className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border-2 border-emerald-500"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="flex items-start justify-between gap-3 p-6 pb-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              {notice === 'checkInbox' ? <MailCheck className="w-6 h-6" /> : <Mail className="w-6 h-6" />}
            </div>
            <div className="min-w-0">
              <h2 id="auth-modal-title" className="text-lg font-black text-emerald-950 leading-tight">
                {notice === 'checkInbox' ? t('checkInboxTitle') : t('authModalTitle')}
              </h2>
              <p className="text-xs text-gray-600 font-medium mt-1 leading-relaxed">
                {notice === 'checkInbox' ? t('checkInboxText') : t('authModalSubtitle')}
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

        {notice === 'checkInbox' ? (
          <div className="px-6 pb-6 space-y-3">
            <button
              onClick={() => {
                setNotice(null);
                setMode('signIn');
                setPassword('');
              }}
              className="w-full px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-extrabold text-base"
            >
              {t('signInAction')}
            </button>
            <button
              onClick={handleClose}
              className="w-full px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-sm"
            >
              {t('continueAsGuest')}
            </button>
          </div>
        ) : (
          <div className="px-6 pb-6 space-y-4">
            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-bold text-emerald-900 uppercase tracking-wide mb-1.5"
              >
                {t('emailLabel')}
              </label>
              <input
                ref={emailRef}
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
                  setNotice(null);
                }}
                className="w-full px-4 py-3 border-2 border-emerald-200 focus:border-emerald-600 rounded-xl text-base font-bold text-emerald-950 outline-none transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-bold text-emerald-900 uppercase tracking-wide mb-1.5"
              >
                {t('passwordLabel')}
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  // Tells a password manager whether to offer the saved password
                  // or to generate a new one.
                  autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                  placeholder={t('passwordPlaceholder')}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorKey(null);
                    setNotice(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && canSubmit) void submit();
                  }}
                  className="w-full px-4 py-3 pr-12 border-2 border-emerald-200 focus:border-emerald-600 rounded-xl text-base font-bold text-emerald-950 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-emerald-700 rounded-lg"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorKey && (
              <div role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-amber-900 leading-relaxed">{t(errorKey)}</p>
              </div>
            )}

            {notice === 'resetSent' && (
              <div role="status" className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-300">
                <MailCheck className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-emerald-900 leading-relaxed">
                  {t('resetLinkSent')}
                </p>
              </div>
            )}

            <button
              onClick={submit}
              disabled={!canSubmit}
              className="w-full px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all active:scale-95"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === 'signIn' ? (
                <LogIn className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {busy
                ? mode === 'signIn'
                  ? t('signingIn')
                  : t('creatingAccount')
                : mode === 'signIn'
                  ? t('signInAction')
                  : t('createAccountAction')}
            </button>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  setMode(mode === 'signIn' ? 'signUp' : 'signIn');
                  setErrorKey(null);
                  setNotice(null);
                }}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 text-left"
              >
                {mode === 'signIn' ? t('noAccountYet') : t('haveAccount')}
              </button>

              {mode === 'signIn' && (
                <button
                  onClick={forgotPassword}
                  disabled={busy}
                  className="text-xs font-bold text-gray-500 hover:text-emerald-700 disabled:opacity-50 whitespace-nowrap"
                >
                  {t('forgotPassword')}
                </button>
              )}
            </div>

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
        )}
        </div>
      </div>
    </div>
  );
};
