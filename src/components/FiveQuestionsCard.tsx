'use client';

import React from 'react';
import { HelpCircle, FileCheck, Users, IndianRupee, AlertTriangle, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { applyPrivacyMask } from '@/lib/privacy';

export const FiveQuestionsCard: React.FC = () => {
  const { currentAnalysis, privacyShield } = useApp();

  if (!currentAnalysis) return null;

  const { fiveQuestions, parties } = currentAnalysis;

  const cards = [
    {
      title: 'What is this document?',
      answer: fiveQuestions.documentType,
      icon: FileCheck,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      title: 'Who is involved?',
      answer: parties
        ? parties.map((p) => `${p.role}: ${applyPrivacyMask(p.name, privacyShield)}`).join(' | ')
        : 'Seller & Buyer',
      icon: Users,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      title: 'What is the amount?',
      answer: fiveQuestions.totalAmount,
      icon: IndianRupee,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      title: 'Is anything important missing?',
      answer: fiveQuestions.missingPoints,
      icon: AlertTriangle,
      color: 'bg-amber-50 text-amber-800 border-amber-200'
    },
    {
      title: 'What should I do next?',
      answer: fiveQuestions.nextStepsSummary,
      icon: ArrowRight,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    }
  ];

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-emerald-100 mb-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">
            CITIZEN QUICK FAQ
          </span>
          <h2 className="text-2xl font-black text-emerald-950">What You Need To Know</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl border ${card.color} shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-5 h-5" />
                  <h3 className="font-extrabold text-sm">{card.title}</h3>
                </div>
                <p className="text-base font-bold text-gray-900 leading-snug">{card.answer}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
