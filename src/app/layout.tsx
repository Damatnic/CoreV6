import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import CrisisButton from "@/components/crisis/CrisisButton";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Astral Core - Mental Health Support Platform",
  description: "We built Astral Core to be the voice people find when they've lost their own. Anonymous, immediate mental health support when you need it most.",
  keywords: "mental health, crisis support, therapy, wellness, peer support, anonymous help",
  authors: [{ name: "Astral Core Team" }],
  openGraph: {
    title: "Astral Core - Find Your Voice",
    description: "Anonymous, immediate mental health support when you need it most.",
    url: "https://astralcore.app",
    siteName: "Astral Core",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Astral Core - Mental Health Support",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Astral Core - Mental Health Support",
    description: "Anonymous, immediate mental health support when you need it most.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
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
        
        {/* Main application */}
        <main id="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
