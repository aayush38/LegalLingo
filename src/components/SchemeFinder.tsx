'use client';

import React, { useState } from 'react';
import { Landmark, Search, Filter, ExternalLink, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { SCHEMES_DATABASE, filterSchemes } from '@/lib/schemesData';
import { GovernmentScheme } from '@/lib/types';

export const SchemeFinder: React.FC = () => {
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedOccupation, setSelectedOccupation] = useState<string>('Farmer');
  const [incomeRange, setIncomeRange] = useState<string>('Below ₹3 Lakh');
  const [ruralUrban, setRuralUrban] = useState<string>('Rural');
  const [landholding, setLandholding] = useState<string>('Small Landholder (< 2 Hectares)');

  const matchedSchemes = filterSchemes({
    state: selectedState,
    occupation: selectedOccupation,
    incomeRange,
    ruralUrban
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-green-800 rounded-3xl p-6 sm:p-10 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white">
            <Landmark className="w-7 h-7" />
          </div>
          <div>
            <span className="bg-emerald-700/80 text-emerald-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              CITIZEN WELFARE PORTAL
            </span>
            <h1 className="text-3xl sm:text-4xl font-black mt-1">Find Government Schemes</h1>
          </div>
        </div>
        <p className="text-base sm:text-lg text-emerald-100 font-medium max-w-2xl">
          Select your citizen profile to discover eligible agricultural, housing, property card, and legal aid schemes.
        </p>
      </div>

      {/* Filter Questionnaire Grid */}
      <div className="bg-white rounded-3xl p-6 shadow-md border border-emerald-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Occupation */}
        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1.5">Occupation</label>
          <select
            value={selectedOccupation}
            onChange={(e) => setSelectedOccupation(e.target.value)}
            className="w-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-950 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All">All Occupations</option>
            <option value="Farmer">Farmer / Agriculturist</option>
            <option value="Worker">Laborer / Rural Worker</option>
            <option value="Entrepreneur">Small Business / Entrepreneur</option>
            <option value="Senior Citizen">Senior Citizen</option>
            <option value="Student">Student</option>
          </select>
        </div>

        {/* State */}
        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1.5">State / UT</label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-950 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All">All States & UTs</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Uttar Pradesh">Uttar Pradesh</option>
            <option value="Bihar">Bihar</option>
            <option value="Madhya Pradesh">Madhya Pradesh</option>
            <option value="Gujarat">Gujarat</option>
          </select>
        </div>

        {/* Income Range */}
        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1.5">Annual Income Range</label>
          <select
            value={incomeRange}
            onChange={(e) => setIncomeRange(e.target.value)}
            className="w-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-950 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Below ₹3 Lakh">Below ₹3 Lakh</option>
            <option value="₹3 Lakh - ₹6 Lakh">₹3 Lakh - ₹6 Lakh</option>
            <option value="Above ₹6 Lakh">Above ₹6 Lakh</option>
          </select>
        </div>

        {/* Area */}
        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1.5">Area Type</label>
          <select
            value={ruralUrban}
            onChange={(e) => setRuralUrban(e.target.value)}
            className="w-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-950 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Rural">Rural Citizen</option>
            <option value="Semi-Urban">Semi-Urban</option>
            <option value="Urban">Urban</option>
          </select>
        </div>

      </div>

      {/* Matched Scheme Cards */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-emerald-950">
            Matched Government Schemes ({matchedSchemes.length})
          </h2>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
            Updated Database
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matchedSchemes.map((scheme) => (
            <div
              key={scheme.id}
              className="bg-white rounded-3xl p-6 shadow-md border border-emerald-100 flex flex-col justify-between hover:shadow-xl transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                    {scheme.category}
                  </span>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                    🟢 Potential Match ({scheme.matchScore}%)
                  </span>
                </div>

                <h3 className="text-xl font-black text-emerald-950 mb-2">{scheme.name}</h3>
                <p className="text-xs text-gray-600 font-medium mb-4 leading-relaxed">
                  {scheme.description}
                </p>

                {/* Why matches */}
                <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100 mb-4">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-0.5">Why it matches your profile:</span>
                  <p className="text-xs font-bold text-emerald-950">{scheme.whyMatches}</p>
                </div>

                {/* Eligibility checklist */}
                <div className="space-y-1.5 mb-4 text-xs font-semibold text-gray-800">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Eligibility:</span>
                  {scheme.eligibility.details.map((d, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>{d}</span>
                    </div>
                  ))}
                </div>

                {/* Required Documents */}
                <div className="mb-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Documents Required:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {scheme.requiredDocuments.map((doc, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Official Button & Disclaimer */}
              <div className="pt-4 border-t border-gray-100 space-y-2">
                <a
                  href={scheme.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95"
                >
                  <span>Open Official Portal</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                <p className="text-[10px] font-semibold text-gray-400 text-center">
                  * Final eligibility is determined by the relevant government authority.
                </p>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
