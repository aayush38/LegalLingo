import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { Navbar } from '@/components/Navbar';
import { AskLegalLingoChat } from '@/components/AskLegalLingoChat';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'LegalLingo - Legal Made Simple. Government Services Made Accessible.',
  description: 'AI-assisted legal document understanding platform for Indian citizens. Simplifies agreements, detects risks, checks survey numbers, and finds government schemes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#F4FBF7] text-slate-900 selection:bg-emerald-200">
        <AppProvider>
          <Navbar />
          <div className="flex-1">{children}</div>
          <AskLegalLingoChat />
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}
