'use client';

import React from 'react';
import { Landmark, ExternalLink, ShieldCheck } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export const GovtServicesSection: React.FC = () => {
  const { currentAnalysis } = useApp();

  if (!currentAnalysis || !currentAnalysis.relevantServices) return null;

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-emerald-100 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
          <Landmark className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
            GOVERNMENT PORTALS
          </span>
          <h2 className="text-2xl font-black text-emerald-950">Relevant Government Services</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {currentAnalysis.relevantServices.map((service) => (
          <div
            key={service.id}
            className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <h3 className="font-extrabold text-base text-emerald-950 mb-2">{service.title}</h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed mb-4">
                {service.whyRelevant}
              </p>
            </div>

            {service.officialUrl ? (
              <a
                href={service.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <span>{service.actionText}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <button className="w-full px-4 py-2.5 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                <span>View Guidance</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
