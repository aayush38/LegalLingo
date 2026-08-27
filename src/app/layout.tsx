import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { AskLegalLingoChat } from '@/components/AskLegalLingoChat';
import { ChatLauncher } from '@/components/ChatLauncher';
import { AuthModal } from '@/components/AuthModal';
import { OnboardingGate } from '@/components/OnboardingGate';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'LegalLingo - Legal Made Simple. Government Services Made Accessible.',
  description: 'AI-assisted legal document understanding platform for Indian citizens. Simplifies agreements, detects risks, checks survey numbers, and finds government schemes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#F4FBF7] text-slate-900 selection:bg-emerald-200">
        {/* AuthProvider wraps AppProvider so AppContext can see who is signed in
            and persist their documents. The auth UI still reads `language`
            because context flows down to it from AppProvider either way. */}
        <AuthProvider>
          <AppProvider>
            <Navbar />
            <div className="flex-1">
              <OnboardingGate>{children}</OnboardingGate>
            </div>
            <AskLegalLingoChat />
            <ChatLauncher />
            <Footer />
            <AuthModal />
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
