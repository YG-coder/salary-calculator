// src/app/sitemap.ts
import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'

const CALCULATOR_PAGES = [
  '/salary-calculator',
  '/payroll-tax-calculator',
  '/social-insurance-calculator',
  '/severance-pay-calculator',
  '/annual-leave-pay-calculator',
  '/weekly-holiday-pay-calculator',
  '/unemployment-benefit-calculator',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const salaryPages = []
  for (let i = 2000; i <= 15000; i += 500) {
    salaryPages.push({
      url: `${SITE_URL}/salary/${i}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })
  }

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    ...CALCULATOR_PAGES.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    })),
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly' as const,
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'yearly' as const,
      priority: 0.4,
    },
    ...salaryPages,
  ]
}
