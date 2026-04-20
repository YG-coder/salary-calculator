// src/app/sitemap.ts
import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // 🔥 연봉 페이지 자동 생성
  const salaryPages = []
  for (let i = 2000; i <= 15000; i += 500) {
    salaryPages.push({
      url: `${SITE_URL}/salary/${i}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })
  }

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    ...salaryPages,
  ]
}