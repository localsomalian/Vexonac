import type { MetadataRoute } from "next";

export const dynamicParams = false // Prevents dynamic route parameters.
export const dynamic = 'force-static' // Forces the page to be statically rendered.
export const fetchCache = 'force-cache' // Force caching of fetch requests.
export const revalidate = 0 // Disable Incremental Static Regeneration (ISR).

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VexonAC - Best FiveM Anticheat 2025",
    short_name: "VexonAC",
    description:
      "VexonAC — FiveM anticheat with real-time cheat detection, automated bans, and a powerful management panel. Trusted by 10 FiveM servers.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#005eff",
    orientation: "portrait-primary",
    scope: "/",
    categories: ["security", "utilities", "productivity"],
    lang: "en-US",
    dir: "ltr",
    icons: [
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "VexonAC Dashboard",
        short_name: "Dashboard",
        description: "Access your VexonAC anticheat dashboard",
        url: "/dashboard",
        icons: [{ src: "/logo.png", sizes: "512x512", type: "image/png" }],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
    screenshots: [
      {
        src: "/panel.webp",
        sizes: "1200x630",
        type: "image/webp",
        form_factor: "wide",
        label: "VexonAC FiveM Anticheat Dashboard Interface",
      },
    ],
  };
}

