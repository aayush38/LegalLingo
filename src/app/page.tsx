'use client';

import React from 'react';
import { LandingHero } from '@/components/LandingHero';
import { DashboardOverview } from '@/components/DashboardOverview';
import { DocumentReader } from '@/components/DocumentReader';
import { FiveQuestionsCard } from '@/components/FiveQuestionsCard';
import { SupportingDocuments } from '@/components/SupportingDocuments';
import { RiskEngineFindings } from '@/components/RiskEngineFindings';
import { MissingInfoSection } from '@/components/MissingInfoSection';
import { ActionChecklist } from '@/components/ActionChecklist';
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
            The redesigned dashboard folds clause risk, document health, the
            legal dictionary and government services into its own summary cards
            and detail modals, so those four no longer appear as standalone
            sections here.

            The three below are kept because the dashboard has no equivalent for
            them: the five citizen questions, the verification documents read
            alongside the agreement, and the deterministic Risk Engine findings
            (the dashboard's risk card shows the model's clause opinion, which is
            a different thing from a rule firing on cited evidence).
          */}
          <DashboardOverview />

          {/* Document Reader (Side-by-Side, Simple, Original) */}
          <DocumentReader />

          {/* What You Need to Know (5 Citizen Questions) */}
          <FiveQuestionsCard />

          {/* Facts read out of the supporting documents */}
          <SupportingDocuments />

          {/* Deterministic rule findings, each carrying its evidence */}
          <RiskEngineFindings />

          {/* Missing Information / Things You Should Check */}
          <MissingInfoSection />

          {/* Citizen Action Checklist */}
          <ActionChecklist />

        </div>
      )}

    </main>
  );
}
