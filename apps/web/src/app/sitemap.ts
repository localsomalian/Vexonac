import type { MetadataRoute } from 'next'

export const dynamic = 'force-static' // Forces the page to be statically rendered.

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://vexonac.com'
  const currentDate = new Date()

  return [
    // Homepage - Most important
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/dashboard/server/demo`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.1,
    },
    {
      url: `${baseUrl}/refund`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.1,
      // alternates: {
      //   languages: {
      //     'x-default': `${baseUrl}/refund`,
      //     'en': `${baseUrl}/refund`,
      //     'es': `${baseUrl}/es/refund`,
      //     'fr': `${baseUrl}/fr/refund`,
      //     'de': `${baseUrl}/de/refund`,
      //     'it': `${baseUrl}/it/refund`,
      //     'nl': `${baseUrl}/nl/refund`,
      //     'pt': `${baseUrl}/pt/refund`,
      //     'ko': `${baseUrl}/ko/refund`,
      //   },
      // },
    },
    // Blog sections for SEO
    // {
    //   url: `${baseUrl}/blog`,
    //   lastModified: currentDate,
    //   changeFrequency: 'weekly',
    //   priority: 0.8,
    // },
    // {
    //   url: `${baseUrl}/blog/best-fivem-anticheat-2025`,
    //   lastModified: currentDate,
    //   changeFrequency: 'monthly',
    //   priority: 0.8,
    // },
    // {
    //   url: `${baseUrl}/blog/how-to-protect-fivem-server`,
    //   lastModified: currentDate,
    //   changeFrequency: 'monthly',
    //   priority: 0.7,
    // },
    // {
    //   url: `${baseUrl}/blog/fivem-mod-menu-protection`,
    //   lastModified: currentDate,
    //   changeFrequency: 'monthly',
    //   priority: 0.7,
    // },
    // // Comparison pages (high SEO value)
    // {
    //   url: `${baseUrl}/compare/vexonac-vs-fiveguard`,
    //   lastModified: currentDate,
    //   changeFrequency: 'monthly',
    //   priority: 0.8,
    // },
    // {
    //   url: `${baseUrl}/compare/best-fivem-anticheat-comparison`,
    //   lastModified: currentDate,
    //   changeFrequency: 'monthly',
    //   priority: 0.8,
    // },
  ]
}

