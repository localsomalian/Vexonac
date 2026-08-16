import type { Metadata } from "next";

// Base site configuration
export const siteConfig = {
  name: "VexonAC",
  title: "VexonAC - Best FiveM Anticheat 2025",
  description: "VexonAC is a growing FiveM anticheat solution with 1 year of experience. Protect your FiveM server with advanced cheat detection, real-time monitoring, and comprehensive player intelligence. Trusted by 10 FiveM servers.",
  url: "https://vexonac.com",
  ogImage: "/panel.webp",
  logo: "/logo.png",
  twitter: "@vexonac",
  pricing: {
    starting: "$12",
    currency: "USD",
  },
  stats: {
    servers: "10+",
    rating: "4.8",
    reviews: "214",
  },
} as const;

// SEO Keywords
export const seoKeywords = [
  // Primary target keywords
  "best fivem anti cheat 2025",
  "fivem anti cheat",
  "fivem anticheat",
  "anticheat fivem",
  "anti cheat fivem",
  "best fivem anticheat",
  "cheap fivem anticheat",
  "fivem anti-cheat",

  // Long-tail keywords
  "fivem server anti cheat protection",
  "best anti cheat for fivem server",
  "fivem cheat detection system",
  "fivem anti cheat free trial",
  "professional fivem anti cheat",
  "advanced fivem security system",

  // Feature-specific keywords
  "fivem aimbot detection",
  "fivem exploit protection",
  "fivem mod menu detection",
  "fivem speed hack protection",
  "fivem teleport hack detection",
  "fivem godmode detection",

  // Server-related keywords
  "fivem server protection",
  "fivem server security",
  "fivem server management",
  "fivem admin tools",
  "fivem ban system",
  "fivem player monitoring",

  // Game-specific keywords
  "gta v roleplay anti cheat",
  "gta 5 fivem security",
  "roleplay server protection",
  "gta rp anti cheat",

  // Competitor and comparison keywords
  "better than anticheat",
  "vexonac vs other anticheat",
  "fivem anticheat comparison",
  "reliable fivem protection",

  // Brand and product
  "VexonAC",
  "VexonAC anticheat",
  "gaming anti-cheat",
  "multiplayer security",
  "server anti cheat software",

  // Technical keywords
  "lua injection protection",
  "fivem event protection",
  "network packet analysis",
  "real-time cheat detection",
  "automated ban system",
  "player behavior analysis",

  // Detection keywords
  "fivem anti trigger",
  "fivem anti triggerbot",
  "fivem anti event protection",
  "fivem anti aimbot",
  "fivem anti wallhack",
  "fivem anti godmode",
  "fivem anti silent aim",
  "fivem anti noclip",
  "fivem anti esp",

  // Google search console keywords
  "fiveguard",
  "reaperac",
  "electronac",
  "fiveshield",
  "fivemshield",
  "fivem shield",
  "fivem guard",
  "anti hack shield",
  "shield fivem",
  "fivem ac",
  "fivem anticheats",
  "anti aimbot fivem",
  "best anti cheat for fivem",
  "best fivem anticheat 2025",
  "fivem best anti cheat",
  "anti cheats fivem",
  "cyber anticheat",
  "reaper anti cheat",
  "fivem anti",
  "detect ac fivem",
  "anticheese fivem",
  "cyber anticheat fivem",
  "five guard anti cheat",
  "best anti cheat fivem",
  "fivem best anticheat",
  "best fivem anti cheat",
  "fivem protection",
  "zerotrust anticheat",
  "fivem cheat detector",
  "anti cheat five m",
  "best anticheat for fivem",
  "lifeshield fivem",
  "fivem anticheat free",
  "ac fivem",
  "meilleur anti cheat fivem",
  "anti cheat for fivem",
  "anti-cheat fivem",
  "fivem anti cheat script",
  "seashield fivem",
  "fivem free anticheat",
  "fivem anti dump",
  "five guard fivem",
  "anti dump fivem"
]

// Base metadata template
export const baseMetadata: any = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name} - Best FiveM Anticheat`,
  },
  description: siteConfig.description,
  keywords: seoKeywords,
  authors: [{ name: "VexonAC Team", url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "FiveM Anticheat Software",
  classification: "FiveM Anticheat, leader of the market",
  applicationName: siteConfig.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    siteName: `${siteConfig.name} - Best FiveM Anticheat`,
    title: siteConfig.title,
    description: `Advanced anticheat protection for FiveM servers. Built for performance, trusted by ${siteConfig.stats.servers} server owners.`,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: "VexonAC FiveM Anticheat Dashboard",
        type: "image/webp",
      },
      {
        url: siteConfig.logo,
        width: 512,
        height: 512,
        alt: `${siteConfig.name} Logo`,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: siteConfig.twitter,
    creator: siteConfig.twitter,
    title: siteConfig.title,
    description: `Advanced anticheat protection for FiveM servers. Built for performance, trusted by ${siteConfig.stats.servers} server owners.`,
    images: [siteConfig.ogImage],
  },
  alternates: {
    canonical: siteConfig.url,
    languages: {
      "x-default": `${siteConfig.url}`,
      "en-US": `${siteConfig.url}`,
      "en-GB": `${siteConfig.url}`,
      "es-ES": `${siteConfig.url}/es`,
      "fr-FR": `${siteConfig.url}/fr`,
      "pt-PT": `${siteConfig.url}/pt`,
      "de-DE": `${siteConfig.url}/de`,
      "it-IT": `${siteConfig.url}/it`,
      "nl-NL": `${siteConfig.url}/nl`,
      "ko-KR": `${siteConfig.url}/ko`,
    },
  },
  other: {
    "msapplication-TileColor": "#2b5797",
    "theme-color": "#005eff",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "mobile-web-app-capable": "yes",
  },
};

// JSON-LD structured data generators
export const structuredData = {
  website: {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    inLanguage: ["en-US", "es-ES", "fr-FR", "de-DE", "it-IT", "nl-NL", "ko-KR", "pt-PT"],
  },
  
  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: {
      "@type": "ImageObject",
      url: `${siteConfig.url}${siteConfig.logo}`,
      width: 512,
      height: 512,
    },
    description: "Leading provider of FiveM anticheat solutions",
    foundingDate: "2019",
    sameAs: [
      "https://discord.gg/NrzrubrYad",
      "https://www.youtube.com/@vexonacanticheat",
      "https://github.com/AYZNN",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      url: "https://discord.gg/NrzrubrYad",
      availableLanguage: ["English", "Spanish", "French", "German", "Italian", "Dutch", "Korean", "Portuguese"],
    },
  },
  
  softwareApplication: {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "SecurityApplication",
    applicationSubCategory: "Anticheat Software",
    operatingSystem: "FiveM, Windows, Linux",
    description: siteConfig.description,
    url: siteConfig.url,
    logo: {
      "@type": "ImageObject",
      url: `${siteConfig.url}${siteConfig.logo}`,
      width: 512,
      height: 512,
    },
    image: {
      "@type": "ImageObject",
      url: `${siteConfig.url}${siteConfig.ogImage}`,
      width: 1200,
      height: 630,
      caption: "VexonAC FiveM Anticheat Dashboard Interface",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: siteConfig.stats.rating,
      ratingCount: siteConfig.stats.reviews,
      bestRating: "5",
      worstRating: "1",
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: siteConfig.pricing.currency,
      lowPrice: "9.99",
      highPrice: "199.99",
      offerCount: "4",
      availability: "https://schema.org/InStock",
      validFrom: "2024-01-01",
    },
    featureList: [
      "Real-time cheat detection",
      "Advanced aimbot protection",
      "Web-based management panel",
      "Player behavior analysis",
      "Automated ban system",
      "Event protection",
      "Network intelligence",
      "24/7 monitoring",
      "Easy installation",
      "Multi-language support",
    ],
    downloadUrl: `${siteConfig.url}/#pricing`,
    installUrl: `${siteConfig.url}/#pricing`,
    softwareVersion: "4.0",
    releaseNotes: "Enhanced detection algorithms and improved performance",
    requirements: "FiveM Server, Windows or Linux",
    fileSize: "2.5MB",
    memoryRequirements: "512MB RAM",
    storageRequirements: "100MB",
    permissions: "Server administration access",
  },
  
  breadcrumb: (items: Array<{ name: string; url: string }>) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }),
  
  faq: (questions: Array<{ question: string; answer: string }>) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  }),
};

// Export everything for easy importing
export default {
  siteConfig,
  seoKeywords,
  baseMetadata,
  structuredData,
}; 

