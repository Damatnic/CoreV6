import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import CrisisButton from "@/components/crisis/CrisisButton";
import PerformanceMonitor from "@/components/ui/PerformanceMonitor";
import DemoModeToggle from "@/components/ui/DemoModeToggle";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Astral Core - Mental Health Support Platform",
  description: "We built Astral Core to be the voice people find when they've lost their own. Anonymous, immediate mental health support when you need it most.",
  keywords: ["mental health", "crisis support", "therapy", "wellness", "peer support", "anonymous help"],
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Accessibility and Performance */}
        <meta name="color-scheme" content="light dark" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className="font-sans antialiased bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 min-h-screen">
        {/* Skip to main content for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-lg z-50"
        >
          Skip to main content
        </a>
        
        {/* Always-visible crisis button */}
        <CrisisButton variant="floating" />
        
        {/* Demo mode toggle for easy testing */}
        <DemoModeToggle compact={true} position="top-right" />
        
        {/* Performance monitoring in development/staging */}
        {process.env.NODE_ENV !== 'production' && (
          <PerformanceMonitor compact={true} position="bottom-left" />
        )}
        
        {/* Main application with error boundary */}
        <ErrorBoundary children={
          <main id="main-content">
            {children}
          </main>
        } />
      </body>
    </html>
  );
}
