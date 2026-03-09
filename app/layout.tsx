import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { OfflineSyncProvider } from '@/components/OfflineSyncProvider';
import { ThemeProvider } from '@/components/ThemeProvider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ME-4 FIX: themeColor must be in viewport export, not metadata in Next.js 13+
export const viewport: Viewport = {
  themeColor: "#8B1DDF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",  // enables safe area insets on iPhone notch
};

export const metadata: Metadata = {
  title: "Allegra | Sistema de Gestión",
  description: "Sistema integral para productoras de audio",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-512.png",
    apple: "/icon-512.png",
  },
  appleWebApp: {
    capable: true,
    title: "Allegra",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
          <Toaster position="top-right" richColors />
          <OfflineSyncProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
