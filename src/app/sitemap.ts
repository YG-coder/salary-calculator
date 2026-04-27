// src/app/sitemap.ts
import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'
import { CALCULATOR_ROUTES, STATIC_ROUTES } from '@/lib/routes'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const salaryPages = Array.from({ length: 27 }, (_, index) => {
    const amount = 2000 + index * 500

    return {
      url: `${SITE_URL}/salary/${amount}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }
  })

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    ...CALCULATOR_ROUTES.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    })),
    ...STATIC_ROUTES.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: 'yearly' as const,
      priority: 0.4,
    })),
    ...salaryPages,
  ]
}