import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import "./globals.css";
import { ProjectHydrator } from "@/components/ProjectHydrator";
import { OrgProvider } from "@/components/OrgProvider";
import { DeploymentBanner } from "@/components/DeploymentBanner";
import { MaintenancePage } from "@/components/MaintenancePage";
import { ThemeProvider } from "@/components/ThemeProvider";

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
    "Extract your design system from Figma or any live website, serve it to Claude Code, Cursor, Copilot and Codex, and gate every AI edit to your tokens. Unmetered, agent-agnostic, open source.",
  openGraph: {
    title: "Layout — Your design system, enforced in every AI agent",
    description:
      "Extract your design system from Figma or any live website, serve it to Claude Code, Cursor, Copilot and Codex, and gate every AI edit to your tokens. Unmetered, agent-agnostic, open source.",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  name: "Layout",
                  url: "https://layout.design",
                  logo: "https://layout.design/marketing/logo-mark.svg",
                  sameAs: [
                    "https://github.com/uselayout",
                    "https://www.npmjs.com/package/@layoutdesign/context",
                  ],
                },
                {
                  "@type": "WebApplication",
                  name: "Layout",
                  url: "https://layout.design",
                  applicationCategory: "DeveloperApplication",
                  operatingSystem: "Web",
                  description:
                    "Extract your design system from Figma or any live website, serve it to AI coding agents unmetered, and gate every AI edit to your tokens.",
                  offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "USD",
                  },
                },
              ],
            }),
          }}
        />
      </head>
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
        <ThemeProvider>
          {process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true" ? (
            <MaintenancePage />
          ) : (
            <>
              <ProjectHydrator />
              <OrgProvider>{children}</OrgProvider>
              <DeploymentBanner />
            </>
          )}
        </ThemeProvider>
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
