import Providers from "@/components/providers";
import { ConversionTracking } from "@/components/conversion-tracking";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { baseMetadata, siteConfig, structuredData } from "@/lib/metadata";
import "../../index.css";

const interSans = Inter({
  variable: "--font-inter-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: false,
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  fallback: ['ui-monospace', 'SFMono-Regular'],
  adjustFontFallback: false,
});

// Dynamic metadata generation based on locale
export async function generateMetadata(): Promise<Metadata> {
  return {
    ...baseMetadata,
    alternates: {
      ...baseMetadata.alternates,
      canonical: siteConfig.url,
    },
    openGraph: {
      ...baseMetadata.openGraph,
      url: siteConfig.url,
      locale: "en_US",
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Static SEO meta tags for immediate crawling */}
        <title>{baseMetadata.title.default}</title>
        <meta name="description" content={baseMetadata.description} />
        <meta name="keywords" content={baseMetadata.keywords} />
        <link rel="canonical" href={locale === "en" ? `${siteConfig.url}` : `${siteConfig.url}/${locale}`} />

        {/* Open Graph tags */}
        <meta property="og:title" content={baseMetadata.openGraph?.title as string} />
        <meta property="og:description" content={baseMetadata.openGraph?.description as string} />
        <meta property="og:url" content={locale === "en" ? `${siteConfig.url}` : `${siteConfig.url}/${locale}`} />
        <meta property="og:site_name" content={baseMetadata.applicationName} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={baseMetadata.openGraph.images[0].url} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="VexonAC - Anticheat Dashboard" />

        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@vexonac" />
        <meta name="twitter:creator" content="@vexonac" />
        <meta name="twitter:title" content={baseMetadata.twitter?.title as string} />
        <meta name="twitter:description" content={baseMetadata.twitter?.description as string} />
        <meta name="twitter:image" content={baseMetadata.openGraph?.images?.[0]?.url as string} />

        {/* Additional SEO tags */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content={baseMetadata.authors?.[0]?.name as string} />
        <meta name="application-name" content={baseMetadata.applicationName as string} />
        <meta name="theme-color" content="#005eff" />
        <meta name="publisher" content={baseMetadata.publisher} />
        <meta name="category" content={baseMetadata.category} />
        <meta name="classification" content={baseMetadata.classification} />
      </head>
      <body
        className={cn(
          "!font-default min-h-screen overflow-x-hidden bg-background text-foreground antialiased",
          interSans.variable,
          jetBrainsMono.variable
        )}
        suppressHydrationWarning={true}
      >

        <div className="bg-background">
          {children}
        </div>
      </body>
    </html>
  );
}


