'use client';

import React from 'react';
import { SavedDocuments } from '@/components/SavedDocuments';

export default function MyDocumentsPage() {
  return (
    <main className="min-h-screen bg-[#F4FBF7] pb-16">
      <SavedDocuments />
    </main>
  );
}
