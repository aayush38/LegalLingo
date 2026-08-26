'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderHeart, FileText, Trash2, ArrowRight, ShieldCheck, Clock,
  Loader2, CloudOff, Smartphone
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { getTranslation } from '@/lib/translations';

const STATUS_KEY: Record<string, string> = {
  'Needs Attention': 'needsAttention',
  'Looks Standard': 'looksStandard',
  'High Risk': 'highRisk'
};

export const SavedDocuments: React.FC = () => {
  const { savedDocuments, deleteSavedDocument, openSavedDocument, loadSampleDocument, language,
    isSyncing, syncError } = useApp();
  const { isGuest, authAvailable, openAuthModal } = useAuth();
  const router = useRouter();

  const handleOpenDoc = (docId: string) => {
    // Select the document first, then show the reader. Without the select the
    // reader renders whichever analysis was already active, so every card
    // appeared to open the same document.
    openSavedDocument(docId);
    router.push('/');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-green-800 rounded-3xl p-6 sm:p-10 text-white shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white">
            <FolderHeart className="w-7 h-7" />
          </div>
          <div>
            <span className="bg-emerald-700/80 text-emerald-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {getTranslation('savedHistoryLabel', language)}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black mt-1">{getTranslation('myDocumentsTitle', language)}</h1>
          </div>
        </div>

        <button
          onClick={loadSampleDocument}
          className="hidden sm:flex px-5 py-2.5 bg-white text-emerald-950 hover:bg-emerald-50 rounded-2xl font-extrabold text-xs shadow-md items-center gap-2"
        >
          <FileText className="w-4 h-4 text-emerald-600" /> {getTranslation('loadSampleAgreement', language)}
        </button>
      </div>

      {/* Where these documents actually live. A citizen should never have to
          guess whether a deed is only on this handset. */}
      {isSyncing ? (
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
          <Loader2 className="w-4 h-4 animate-spin" />
          {getTranslation('syncingLabel', language)}
        </div>
      ) : syncError ? (
        <div className="flex items-start gap-2 text-xs bg-amber-50 border border-amber-300 rounded-xl px-4 py-3">
          <CloudOff className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-900">{getTranslation('syncFailedTitle', language)}</p>
            <p className="font-medium text-amber-800 mt-0.5">{getTranslation('syncFailedNote', language)}</p>
          </div>
        </div>
      ) : authAvailable && isGuest && savedDocuments.length > 0 ? (
        <div className="flex items-start gap-2 text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
          <Smartphone className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
          <p className="font-medium text-slate-700">{getTranslation('guestStorageNote', language)}</p>
        </div>
      ) : null}

      {/* Document Cards */}
      {savedDocuments.length === 0 && authAvailable && isGuest ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100 shadow-sm max-w-lg mx-auto">
          <CloudOff className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
          <h3 className="text-xl font-black text-gray-900 mb-2">
            {getTranslation('guestNoDocsTitle', language)}
          </h3>
          <p className="text-sm text-gray-500 font-medium mb-6">
            {getTranslation('guestNoDocsText', language)}
          </p>
          <button
            onClick={openAuthModal}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-md"
          >
            {getTranslation('signInToSave', language)}
          </button>
        </div>
      ) : savedDocuments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100 shadow-sm max-w-lg mx-auto">
          <FileText className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
          <h3 className="text-xl font-black text-gray-900 mb-2">{getTranslation('noSavedDocsTitle', language)}</h3>
          <p className="text-sm text-gray-500 font-medium mb-6">
            {getTranslation('noSavedDocsText', language)}
          </p>
          <button
            onClick={loadSampleDocument}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-md"
          >
            {getTranslation('trySample', language)}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-3xl p-6 shadow-md border border-emerald-100 flex flex-col justify-between hover:shadow-xl transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                    {doc.documentType}
                  </span>
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    🟠 {getTranslation(STATUS_KEY[doc.status] || 'needsAttention', language)}
                  </span>
                </div>

                <h3 className="text-lg font-black text-emerald-950 mb-2 group-hover:text-emerald-700 transition-colors">
                  {doc.documentTitle}
                </h3>

                <div className="flex items-center gap-4 text-xs text-gray-500 font-semibold mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {new Date(doc.createdAt).toLocaleDateString('en-IN')}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5" /> {getTranslation('scoreLabel', language)} {doc.understandingScore}/100
                  </span>
                </div>

                <p className="text-xs text-gray-600 font-medium line-clamp-2 leading-relaxed mb-4">
                  {doc.verySimpleSummary}
                </p>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenDoc(doc.id)}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95"
                >
                  <span>{getTranslation('continueAnalysisLabel', language)}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => deleteSavedDocument(doc.id)}
                  className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  title={getTranslation('deleteDocumentLabel', language)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
