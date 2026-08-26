'use client';

import React from 'react';
import { MessageSquare } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getTranslation } from '@/lib/translations';

/**
 * Floating chat button, bottom-right.
 *
 * Desktop only (`hidden md:flex`): on mobile the fixed bottom navigation in
 * Footer.tsx already has a centre chat button, and a second floating one would
 * both duplicate it and overlap that bar.
 *
 * Hidden while the panel is open so it never sits on top of the chat itself.
 */
export const ChatLauncher: React.FC = () => {
  const { isChatOpen, setIsChatOpen, language } = useApp();

  if (isChatOpen) return null;

  const label = getTranslation('askLegalLingoAiTitle', language);

  return (
    <button
      onClick={() => setIsChatOpen(true)}
      aria-label={label}
      title={label}
      className="hidden md:flex fixed bottom-6 right-6 z-40 items-center justify-center w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-900/25 border-2 border-emerald-400 transition-transform hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
    >
      <MessageSquare className="w-6 h-6" />
    </button>
  );
};
