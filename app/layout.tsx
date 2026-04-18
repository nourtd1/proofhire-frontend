import type { Metadata } from "next";
import { Inter } from "next/font-google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import StoreProvider from "@/store/StoreProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ProofHire - AI Talent Screening",
  description: "AI-powered talent screening tool for modern recruiters",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#f8fafc] text-slate-900 min-h-screen`}>
        <StoreProvider>
          <div className="flex">
            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen flex flex-col">
              <Header />
              <div className="p-8">
                {children}
              </div>
            </main>
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
