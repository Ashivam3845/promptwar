import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { Navigation } from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'GigSaathi AI — Multilingual AI Companion for Gig & Informal Workers',
  description:
    'Calculate real take-home earnings, verify government welfare schemes, dispute wrongful platform penalties, and draft formal grievances in Hindi, Punjabi, and English.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col pb-16 md:pb-6 transition-colors">
        <ThemeProvider>
          <AuthProvider>
            <LanguageProvider>
              <Navigation />
              <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
                {children}
              </main>
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
