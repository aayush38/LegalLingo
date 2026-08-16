import React from 'react';
import { SavedDocuments } from '@/components/SavedDocuments';

export const metadata = {
  title: 'My Documents - LegalLingo',
  description: 'View saved legal document analyses and reports.'
};

export default function MyDocumentsPage() {
  return (
    <main className="min-h-screen bg-[#F4FBF7] pb-16">
      <SavedDocuments />
    </main>
  );
}
