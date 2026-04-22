import type { Metadata } from "next";
import type { Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import StoreProvider from "@/store/StoreProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ProofHire - AI Talent Screening",
  description: "AI-powered talent screening tool for modern recruiters",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#f8fafc] text-slate-900 min-h-screen`}>
        <StoreProvider>
          <OnboardingTour />
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-white"
          >
            Skip to main content
          </a>
          <div className="flex">
            <Sidebar />
            <main id="main-content" className="flex-1 min-h-screen flex flex-col lg:ml-64">
              <Header />
              <div className="px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-8">
                {children}
              </div>
            </main>
            <MobileNav />
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
