'use client';

import React from 'react';
import { HelpCircle, FileCheck, Users, IndianRupee, AlertTriangle, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { applyPrivacyMask } from '@/lib/privacy';
import { getTranslatedExplanation } from '@/lib/ai';
import { getTranslation } from '@/lib/translations';

export const FiveQuestionsCard: React.FC = () => {
  const { currentAnalysis, language, translationCache, privacyShield } = useApp();

  if (!currentAnalysis || !currentAnalysis.fiveQuestions) return null;

  const fq = currentAnalysis.fiveQuestions;
  const t = (text: string) => getTranslatedExplanation(text, language, translationCache);

  const partiesLabel = fq.partiesInvolved.seller && fq.partiesInvolved.buyer
    ? `${t(fq.partiesInvolved.seller)} & ${t(fq.partiesInvolved.buyer)}`
    : fq.partiesInvolved.landlord && fq.partiesInvolved.tenant
    ? `${t(fq.partiesInvolved.landlord)} & ${t(fq.partiesInvolved.tenant)}`
    : fq.partiesInvolved.parties && fq.partiesInvolved.parties.length > 0
    ? fq.partiesInvolved.parties.map(t).join(' & ')
    : getTranslation('notSpecified', language);

  const items = [
    {
      icon: FileCheck,
      title: getTranslation('q1Title', language),
      content: applyPrivacyMask(t(fq.documentType), privacyShield),
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    {
      icon: Users,
      title: getTranslation('q2Title', language),
      content: applyPrivacyMask(partiesLabel, privacyShield),
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    {
      icon: IndianRupee,
      title: getTranslation('q3Title', language),
      content: applyPrivacyMask(t(fq.totalAmount), privacyShield),
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    {
      icon: AlertTriangle,
      title: getTranslation('q4Title', language),
      content: applyPrivacyMask(t(fq.missingPoints), privacyShield),
      color: 'bg-amber-100 text-amber-900 border-amber-300'
    },
    {
      icon: ArrowRight,
      title: getTranslation('q5Title', language),
      content: applyPrivacyMask(t(fq.nextStepsSummary), privacyShield),
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    }
  ];

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-emerald-100 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
            {getTranslation('citizenSummaryLabel', language)}
          </span>
          <h2 className="text-2xl font-black text-emerald-950">
            {getTranslation('whatYouNeedToKnow', language)}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-slate-50 rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 border ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-slate-800 mb-1.5 uppercase tracking-wide">
                  {item.title}
                </h3>
                <p className="text-xs font-semibold text-slate-900 leading-snug">
                  {item.content}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
