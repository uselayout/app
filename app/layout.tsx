import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import "./globals.css";
import { ProjectHydrator } from "@/components/ProjectHydrator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://layout.design"),
  title: {
    default: "Layout",
    template: "%s | Layout",
  },
  description:
    "Extract design systems from Figma and websites. Generate LLM-optimised context bundles for AI coding agents.",
  openGraph: {
    title: "Layout",
    description:
      "Extract design systems from Figma and websites. Generate LLM-optimised context bundles for AI coding agents.",
    siteName: "Layout",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: "/favicon.ico",
  },
  themeColor: "#0C0C0E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          src="https://analytics.unified.studio/js/pa-quhX-YAYBj1aXc8GmZCkt.js"
          strategy="afterInteractive"
        />
        <Script id="plausible-init" strategy="afterInteractive">
          {`window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()`}
        </Script>
        <ProjectHydrator />
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--bg-elevated)",
              border: "1px solid var(--studio-border)",
              color: "var(--text-primary)",
            },
          }}
        />
      </body>
    </html>
  );
}
