import type { Metadata } from "next";
import { baseMetadata, structuredData } from "@/lib/metadata";
import Landing from "../../components/landing";
import Script from "next/script";


export default function HomePage() {
  return (
    <>
      {/* SEO-friendly structured content for crawlers */}
      <Script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              structuredData.website,
              structuredData.organization,
              structuredData.softwareApplication,
              structuredData.breadcrumb([
                { name: "Home", url: "https://vexonac.com" },
                { name: "Pricing", url: "https://vexonac.com/#pricing" },
                { name: "Features", url: "https://vexonac.com/#features" },
                { name: "FAQ", url: "https://vexonac.com/#faq" },
              ]),
              structuredData.faq([
                {
                  question: "Is VexonAC the best FiveM anticheat in 2025?",
                  answer: "VexonAC is a powerful and actively developed FiveM anticheat solution with strong detection coverage across common exploits. It's built for real-world servers and is continuously updated.",
                },
                {
                  question: "How much does VexonAC FiveM anticheat cost?",
                  answer: "VexonAC pricing starts from €49.99/month to €249.99 for lifetime access.",
                },
                {
                  question: "What cheats does VexonAC detect?",
                  answer: "VexonAC detects aimbot, speed hacks, teleportation, godmode, ESP, wallhacks, lua injection, trigger bots, and many other FiveM exploits with real-time monitoring.",
                },
                {
                  question: "How easy is it to install VexonAC on my FiveM server?",
                  answer: "VexonAC installation takes less than 5 minutes. Simply download the resource, add it to your server, configure your license key, and restart your server.",
                },
              ]),
            ],
          }),
        }}
      />

      <Script
        id="tech-article-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TechArticle",
            headline:
              "Best FiveM Anticheat 2025: Complete Server Protection Guide",
            description:
              "Comprehensive guide to protecting your FiveM server with VexonAC anticheat. Learn about advanced cheat detection, setup, and optimization.",
            author: {
              "@type": "Organization",
              name: "VexonAC Team",
            },
            datePublished: "2024-01-01",
            dateModified: new Date().toISOString(),
            publisher: {
              "@type": "Organization",
              name: "VexonAC",
              logo: {
                "@type": "ImageObject",
                url: "https://vexonac.com/logo.png",
              },
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": "https://vexonac.com",
            },
            image: {
              "@type": "ImageObject",
              url: "https://vexonac.com/panel.webp",
              width: 1200,
              height: 630,
            },
          }),
        }}
      />
        
      {/* Static SEO content visible to search engines - positioned above the fold */}
      <div className="absolute top-0 left-0 w-full h-0 overflow-hidden">
        <div className="sr-only">
          <h1>VexonAC - Best FiveM Anticheat 2025</h1>
          <h2>Advanced FiveM Server Protection and Cheat Detection System</h2>
          <p>
            VexonAC is the leading FiveM anticheat solution designed
            specifically for FiveM servers in 2025. Our advanced cheat detection system
            protects against aimbot, speed hacks, teleportation, godmode, ESP, wallhacks,
            and other exploits. With real-time monitoring and automated ban systems,
            VexonAC ensures your FiveM server remains secure and provides the
            best gaming experience for legitimate players.
          </p>
          <h3>Why Choose VexonAC FiveM Anticheat?</h3>
          <ul>
            <li>Best FiveM anticheat detection rates in 2025</li>
            <li>Real-time player monitoring and behavior analysis</li>
            <li>Advanced aimbot and ESP detection</li>
            <li>Comprehensive FiveM server protection system</li>
            <li>Easy installation and configuration for server owners</li>
            <li>Professional 24/7 support and regular updates</li>
            <li>Trusted by 10 FiveM servers with 1 year of experience in cheat detection</li>
            <li>Affordable pricing starting from €9.99/month</li>
          </ul>
          <h3>FiveM Anticheat Features and Protection</h3>
          <p>
            Our FiveM anticheat system includes advanced detection algorithms
            for: speed hacks, teleportation exploits, godmode cheats, aimbot
            detection, wallhack prevention, ESP blocking, lua injection protection,
            trigger bot detection, and resource dumping prevention. Perfect for 
            FiveM roleplay servers, PvP servers, and competitive gaming communities
            that need reliable server protection.
          </p>
          <h3>Best FiveM Anticheat Solution 2025</h3>
          <p>
            Join thousands of successful FiveM server owners who trust VexonAC
            for their server security. Our anticheat solution offers superior
            protection compared to other FiveM anticheats, with industry-leading
            detection rates and minimal false positives. Get started today and
            protect your FiveM server with the best anticheat available.
          </p>
        </div>
      </div>

      <Landing />
    </>
  );
}

