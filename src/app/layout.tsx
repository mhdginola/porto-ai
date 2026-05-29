import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { LocaleProvider } from "@/components/layout/LocaleProvider";
import { NavigationProgressShell } from "@/components/layout/NavigationProgressShell";
import { PropertyAgencyPreviewProvider } from "@/components/layout/PropertyAgencyPreviewProvider";
import { PortfolioShell } from "@/components/layout/PortfolioShell";
import { siteConfig } from "@/lib/site";
import { getDefaultModelRef } from "@/lib/ai";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — ${siteConfig.title}`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <LocaleProvider>
          <PropertyAgencyPreviewProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <NavigationProgressShell />
              <PortfolioShell defaultModelRef={getDefaultModelRef()}>
                {children}
              </PortfolioShell>
            </ThemeProvider>
          </PropertyAgencyPreviewProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
