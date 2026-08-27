'use client';

import React from 'react';
import { UserCheck, UserX, HelpCircle, AlertTriangle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getTranslation } from '@/lib/translations';
import { verifyIdentity } from '@/lib/identity/verifyIdentity';

/**
 * Shows whether the citizen is named in the document currently open.
 *
 * The NOT_NAMED case is styled as a warning rather than a neutral fact. Being
 * handed a deed that names somebody subtly different is a real way for a sale
 * to be undone later, and a grey information box would not carry that.
 *
 * This is an attention check. It never says a document is valid or invalid —
 * only whether two names agree.
 */
export const IdentityCheck: React.FC<{ checkedName?: string | null }> = ({ checkedName }) => {
  const { currentAnalysis, language } = useApp();
  const t = (key: string) => getTranslation(key, language);

  const result = verifyIdentity(checkedName, currentAnalysis);

  const tone = {
    CONFIRMED: {
      wrap: 'bg-emerald-50 border-emerald-300',
      head: 'text-emerald-900',
      Icon: UserCheck,
      iconClass: 'text-emerald-700',
      label: t('identityConfirmed')
    },
    LIKELY: {
      wrap: 'bg-amber-50 border-amber-300',
      head: 'text-amber-900',
      Icon: AlertTriangle,
      iconClass: 'text-amber-700',
      label: t('identityLikely')
    },
    NOT_NAMED: {
      wrap: 'bg-red-50 border-red-300',
      head: 'text-red-900',
      Icon: UserX,
      iconClass: 'text-red-700',
      label: t('identityNotNamed')
    },
    UNKNOWN: {
      wrap: 'bg-slate-50 border-slate-200',
      head: 'text-slate-700',
      Icon: HelpCircle,
      iconClass: 'text-slate-500',
      label: t('identityUnknown')
    }
  }[result.verdict];

  const { Icon } = tone;

  return (
    <div>
      <h3 className="text-base font-black text-emerald-950 mb-3">{t('identityCheckTitle')}</h3>

      <div className={`rounded-2xl border p-4 space-y-2.5 ${tone.wrap}`}>
        <div className="flex items-start gap-2.5">
          <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${tone.iconClass}`} />
          <p className={`text-sm font-black leading-snug ${tone.head}`}>{tone.label}</p>
        </div>

        {result.matches.length > 0 && (
          <dl className="space-y-1.5 pl-7">
            {result.matches.map((m, i) => (
              <div key={i} className="text-xs">
                <dt className="inline font-bold text-slate-600">{t('identityRoleLabel')}: </dt>
                <dd className="inline font-black text-emerald-900">{m.role}</dd>
                <div className="text-[11px] text-slate-600 font-semibold mt-0.5">
                  {t('identityAsWritten')}: <span className="font-bold">{m.documentName}</span>
                </div>
              </div>
            ))}
          </dl>
        )}

        {result.verdict === 'LIKELY' && (
          <p className="text-xs font-semibold text-amber-900 pl-7 leading-relaxed">
            {t('identityLikelyNote')}
          </p>
        )}

        {result.verdict === 'NOT_NAMED' && (
          <div className="pl-7 space-y-2">
            <p className="text-xs font-semibold text-red-900 leading-relaxed">
              {t('identityNotNamedNote')}
            </p>
            {result.otherParties.length > 0 && (
              <div className="text-[11px] text-slate-700">
                <span className="font-bold">{t('identityOtherParties')}: </span>
                {result.otherParties.map((p) => `${p.name} (${p.role})`).join(', ')}
              </div>
            )}
          </div>
        )}

        {result.verdict === 'UNKNOWN' && (
          <p className="text-xs font-medium text-slate-600 pl-7">{t('identityNeedsProfile')}</p>
        )}
      </div>
    </div>
  );
};
