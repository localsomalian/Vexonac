import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // Configure transpilePackages for monorepo
  transpilePackages: ["@vexonac/database", "@vexonac/config", "@vexonac/types", "@vexonac/utils"],

  images: {
    remotePatterns: [
      { hostname: "cdn.discordapp.com" },
      { hostname: "media.discordapp.net" },
      { hostname: "r2.vexonac.com" },
    ],
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: false,
  },

  // Enable compression for better performance
  compress: true,
  poweredByHeader: false,

  // Enhanced redirects for SEO
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
    ];
  },

  // SEO and performance headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Security headers
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: process.env.NODE_ENV === "production"
              ? "upgrade-insecure-requests; frame-src 'self' https://*.vexonac.com https://vexonac.com https://*.nowpayments.io https://nowpayments.io https://*.polar.sh https://polar.sh https://*.googletagmanager.com https://www.googletagmanager.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.nowpayments.io https://nowpayments.io https://*.polar.sh https://polar.sh https://*.cloudflareinsights.com https://static.cloudflareinsights.com https://*.googletagmanager.com https://www.googletagmanager.com https://*.doubleclick.net https://googleads.g.doubleclick.net; connect-src 'self' https://*.vexonac.com https://api.vexonac.com wss://*.vexonac.com wss://api.vexonac.com https://*.nowpayments.io https://nowpayments.io https://account-api.nowpayments.io https://*.google.com https://www.google.com https://*.googleadservices.com https://www.googleadservices.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://www.googletagmanager.com https://*.cloudflareinsights.com https://*.doubleclick.net https://googleads.g.doubleclick.net;"
              : "frame-src 'self' https://*.vexonac.com https://vexonac.com https://*.nowpayments.io https://nowpayments.io https://*.polar.sh https://polar.sh https://*.googletagmanager.com https://www.googletagmanager.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.nowpayments.io https://nowpayments.io https://*.polar.sh https://polar.sh https://*.cloudflareinsights.com https://static.cloudflareinsights.com https://*.googletagmanager.com https://www.googletagmanager.com https://*.doubleclick.net https://googleads.g.doubleclick.net; connect-src 'self' http://localhost:* ws://localhost:* https://*.vexonac.com https://api.vexonac.com wss://*.vexonac.com wss://api.vexonac.com https://*.nowpayments.io https://nowpayments.io https://account-api.nowpayments.io https://*.google.com https://www.google.com https://*.googleadservices.com https://www.googleadservices.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://www.googletagmanager.com https://*.cloudflareinsights.com https://*.doubleclick.net https://googleads.g.doubleclick.net;",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Performance headers
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          // SEO headers
          {
            key: "X-Robots-Tag",
            value:
              "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
          },
        ],
      },
      // Specific caching for images
      {
        source: "/(.*)\\.(jpg|jpeg|png|webp|avif|ico|svg)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Caching for fonts
      {
        source: "/(.*)\\.(woff|woff2|eot|ttf|otf)",
        headers: [
          {
            key: "Cache-Control", 
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Enable experimental features for better SEO and performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "framer-motion",
      "@/components/ui",
      "sonner",
      "@/components/magicui",
    ],
    webVitalsAttribution: ["CLS", "LCP"],
  },

  // Output configuration for better performance
  output: "standalone",

  // Temporarily disable StrictMode to reduce websocket connection spam during development
  // Can be re-enabled once the websocket connection management is fully stable
  reactStrictMode: false,

  // SEO-friendly trailing slash handling
  trailingSlash: false,

  // Generate optimized builds
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
};

export default nextConfig;


