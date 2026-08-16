import React from 'react';
import { SchemeFinder } from '@/components/SchemeFinder';

export const metadata = {
  title: 'Government Scheme Finder - LegalLingo',
  description: 'Discover eligible Indian government schemes, housing support, land records, and legal aid.'
};

export default function SchemesPage() {
  return (
    <main className="min-h-screen bg-[#F4FBF7] pb-16">
      <SchemeFinder />
    </main>
  );
}
