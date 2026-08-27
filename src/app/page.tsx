'use client';

import React from 'react';
import { LandingHero } from '@/components/LandingHero';
import { DashboardOverview } from '@/components/DashboardOverview';
import { DocumentReader } from '@/components/DocumentReader';
import { SupportingDocuments } from '@/components/SupportingDocuments';
import { ActionChecklist } from '@/components/ActionChecklist';
import { GovtServicesSection } from '@/components/GovtServicesSection';
import { useApp } from '@/context/AppContext';

export default function HomePage() {
  const { currentAnalysis } = useApp();

  return (
    <main className="min-h-screen bg-[#F4FBF7] pb-16">

      {/* Landing Hero Uploader */}
      <LandingHero />

      {/* Main Analysis Dashboard (Shown after uploading or clicking sample document) */}
      {currentAnalysis && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-8 animate-fade-in">

          {/*
            Everything the citizen can dig into now lives behind the four cards
            in the dashboard:

              Clause Analysis  what each clause means           (Clause Engine)
              Legal Dictionary the difficult words
              Risk Engine      amounts, dates, identities, missing information
                               and cross-clause consistency, each finding citing
                               its evidence, plus the clauses flagged as risky
              Document Health  completeness, and what is missing

            Government schemes stay a full-width section at the bottom rather
            than a card: they are a next step to act on, not a finding to read.

            The sections that used to repeat that content underneath — the
            citizen summary, the standalone risk findings, and "things you
            should check" — were saying the same things twice.
          */}
          <DashboardOverview />

          {/* Document Reader (Side-by-Side, Simple, Original) */}
          <DocumentReader />

          {/* Facts read out of the supporting documents, which no card covers */}
          <SupportingDocuments />

          {/* Citizen Action Checklist */}
          <ActionChecklist />

          {/* Government schemes and portals matched to this document */}
          <GovtServicesSection />

        </div>
      )}

    </main>
  );
}
