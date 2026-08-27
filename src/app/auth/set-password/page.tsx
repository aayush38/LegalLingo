'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Loader2, Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { getTranslation } from '@/lib/translations';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/authService';
import { markOnboarded } from '@/lib/onboarding';

/**
 * Where a recovery link lands.
 *
 * By the time this renders, /auth/confirm has already exchanged the emailed
 * token for a session, so the citizen is signed in — they just have no password
 * they can use next time. This is also the path for an account created by the
 * earlier magic-link flow, which never set one at all.
 */
export default function SetPasswordPage() {
  const router = useRouter();
  const { language } = useApp();
  const { user, isLoading } = useAuth();

  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = (key: string) => getTranslation(key, language);

  // Reaching this page means a link was followed, so the welcome flow has been
  // answered one way or another.
  useEffect(() => {
    markOnboarded();
  }, []);

  const save = async () => {
    if (password.length < MIN_PASSWORD_LENGTH || busy) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setBusy(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (updateError) {
      console.warn('[set-password] failed:', updateError.code, updateError.message);
      // No session means the recovery token was already used or has expired.
      setError(updateError.message.toLowerCase().includes('session')
        ? t('setPasswordExpired')
        : t('authErrorWeakPassword'));
      return;
    }

    setDone(true);
    setTimeout(() => router.replace('/'), 1200);
  };

  const canSave = password.length >= MIN_PASSWORD_LENGTH && !busy;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl border-2 border-emerald-200 shadow-xl p-6 sm:p-8">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-emerald-950 leading-tight">
              {t('setPasswordTitle')}
            </h1>
            <p className="text-xs text-gray-600 font-medium mt-1 leading-relaxed">
              {t('setPasswordSubtitle')}
            </p>
          </div>
        </div>

        {!isLoading && !user ? (
          <div role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-amber-900 leading-relaxed">
              {t('setPasswordExpired')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="new-password"
                className="block text-xs font-bold text-emerald-900 uppercase tracking-wide mb-1.5"
              >
                {t('passwordLabel')}
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={show ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder={t('passwordPlaceholder')}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && canSave) void save();
                  }}
                  className="w-full px-4 py-3 pr-12 border-2 border-emerald-200 focus:border-emerald-600 rounded-xl text-base font-bold text-emerald-950 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? t('hidePassword') : t('showPassword')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-emerald-700 rounded-lg"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-amber-900 leading-relaxed">{error}</p>
              </div>
            )}

            {done && (
              <div role="status" className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-300">
                <Check className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <p className="text-xs font-bold text-emerald-900">{t('passwordUpdated')}</p>
              </div>
            )}

            <button
              onClick={save}
              disabled={!canSave || done}
              className="w-full px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all active:scale-95"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('setPasswordAction')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
