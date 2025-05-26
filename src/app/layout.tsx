import React from "react";
import type { Metadata } from "next";
import { Noto_Sans, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { EstimateProvider } from "../context/EstimateContext";
import EstimateSidebar from "../components/EstimateSidebar";

const noto_sans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto-sans",
});

const plus_jakarta_sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: "Paint Estimate by Cline",
  description: "Get a quick paint estimate for your project.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${noto_sans.variable} ${plus_jakarta_sans.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com/" crossOrigin="" />
      </head>
      <body>
        <EstimateProvider>
          <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
            <EstimateSidebar />
          </div>
        </EstimateProvider>
      </body>
    </html>
  );
} 