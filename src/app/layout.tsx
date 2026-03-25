import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PushSubscribe } from "@/components/pwa/push-subscribe";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { ToastProvider } from "@/components/ui/toast-provider";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://tapwash.app";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "TapWash",
  description: "Laundry marketplace platform for customers and laundry shops",
  manifest: "/manifest.json",
  icons: {
    icon: "/tapwash-logo.png",
    shortcut: "/tapwash-logo.png",
    apple: "/tapwash-logo.png",
  },
  openGraph: {
    title: "TapWash",
    description: "Laundry marketplace platform for customers and laundry shops",
    images: [
      {
        url: "/tapwash-logo.png",
        width: 512,
        height: 512,
        alt: "TapWash Logo",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@700,900&display=swap" />
        {/* Favicon and TapWash logo for browser tab and search */}
        <link rel="icon" href="/tapwash-logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/tapwash-logo.png" />
        <meta property="og:image" content="/tapwash-logo.png" />
        <meta property="og:title" content="TapWash" />
        <meta property="og:description" content="Laundry marketplace platform for customers and laundry shops" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <ToastProvider />
        <RegisterServiceWorker />
        <PushSubscribe />
      </body>
    </html>
  );
}
