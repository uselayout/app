import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import "./globals.css";
import { ProjectHydrator } from "@/components/ProjectHydrator";
import { OrgProvider } from "@/components/OrgProvider";
import { DeploymentBanner } from "@/components/DeploymentBanner";
import { MaintenancePage } from "@/components/MaintenancePage";

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
    "Extract your design system from Figma or any website. Layout generates structured context bundles that make Claude Code, Cursor, and Codex build on-brand UI automatically.",
  openGraph: {
    title: "Layout — The compiler between design systems and AI coding agents",
    description:
      "Extract your design system from Figma or any website. Layout generates structured context bundles that make Claude Code, Cursor, and Codex build on-brand UI automatically.",
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
                    "Extract design systems from Figma and websites. Generate LLM-optimised context bundles for AI coding agents.",
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
        {process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true" ? (
          <MaintenancePage />
        ) : (
          <>
            <ProjectHydrator />
            <OrgProvider>{children}</OrgProvider>
            <DeploymentBanner />
          </>
        )}
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
