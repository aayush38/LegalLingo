'use client';

import React from 'react';
import { LandingHero } from '@/components/LandingHero';
import { DashboardOverview } from '@/components/DashboardOverview';
import { DocumentReader } from '@/components/DocumentReader';
import { ClauseRiskAnalysis } from '@/components/ClauseRiskAnalysis';
import { DocumentHealthScore } from '@/components/DocumentHealthScore';
import { DifficultWordsGlossary } from '@/components/DifficultWordsGlossary';
import { MissingInfoSection } from '@/components/MissingInfoSection';
import { ActionChecklist } from '@/components/ActionChecklist';
import { GovtServicesSection } from '@/components/GovtServicesSection';
import { useApp } from '@/context/AppContext';

export default function HomePage() {
  const { currentAnalysis, showDocumentHealth } = useApp();

  return (
    <main className="min-h-screen bg-[#F4FBF7] pb-16">
      
      {/* Landing Hero Uploader */}
      <LandingHero />

      {/* Main Analysis Dashboard (Shown after uploading or clicking sample document) */}
      {currentAnalysis && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-8 animate-fade-in">
          
          {/* Top Metrics & Large Green AI Summary */}
          <DashboardOverview />

          {/* Document Reader (Side-by-Side, Simple, Original) */}
          <DocumentReader />

          {/* Risk and Clause Analysis */}
          <ClauseRiskAnalysis />

          {/* Document Health / AI Completeness Score Breakdown */}
          {showDocumentHealth && <DocumentHealthScore />}

          {/* Difficult Legal Words Glossary */}
          <DifficultWordsGlossary />

          {/* Missing Information Alerts */}
          <MissingInfoSection />

          {/* Citizen Action Checklist */}
          <ActionChecklist />

          {/* Relevant Government Services */}
          <GovtServicesSection />

        </div>
      )}

    </main>
  );
}
