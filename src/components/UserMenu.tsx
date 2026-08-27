'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LogIn, LogOut, UserRound, ChevronDown, IdCard } from 'lucide-react';
import { ProfileModal } from './ProfileModal';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { getTranslation } from '@/lib/translations';
import { maskEmail } from '@/lib/auth/email';

/**
 * Sign-in control for the navbar.
 *
 * Renders nothing at all when the deployment has no Supabase project: offering
 * a sign-in button that cannot work is worse than not offering one.
 */
export const UserMenu: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { language } = useApp();
  const { user, profile, isLoading, isGuest, authAvailable, openAuthModal, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const t = (key: string) => getTranslation(key, language);

  useEffect(() => {
    if (!menuOpen) return;
    const onClickAway = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, [menuOpen]);

  if (!authAvailable) return null;

  // Hold the space during the initial session lookup so the navbar does not
  // jump once it settles.
  if (isLoading) {
    return <div className="w-24 h-8 rounded-full bg-emerald-50 animate-pulse" aria-hidden="true" />;
  }

  if (isGuest) {
    return (
      <button
        onClick={openAuthModal}
        className={`flex items-center gap-1.5 rounded-full font-bold transition-all shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-1.5 text-xs'
        }`}
      >
        <LogIn className="w-3.5 h-3.5" />
        {t('signIn')}
      </button>
    );
  }

  // The address is shown masked: the navbar is on screen whenever the app is,
  // including when the handset is being shown to someone else.
  const identity = profile?.email || user?.email;
  const label = profile?.display_name || (identity ? maskEmail(identity) : t('guestLabel'));

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setMenuOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold text-emerald-900 transition-colors"
      >
        <UserRound className="w-3.5 h-3.5 text-emerald-700" />
        <span className="max-w-[10rem] truncate">{label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-emerald-100 p-2 z-50"
        >
          <div className="px-3 py-2 border-b border-emerald-50 mb-1">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
              {t('signedInAs')}
            </p>
            <p className="text-sm font-black text-emerald-950 truncate">{label}</p>
          </div>
          <button
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              setProfileOpen(true);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-emerald-800 hover:bg-emerald-50 transition-colors"
          >
            <IdCard className="w-4 h-4" />
            {t('myProfile')}
          </button>

          <button
            role="menuitem"
            onClick={async () => {
              setMenuOpen(false);
              await signOut();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-red-700 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t('signOut')}
          </button>
        </div>
      )}

      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </div>
  );
};
