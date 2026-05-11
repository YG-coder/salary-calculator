// src/app/sitemap.ts
import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'
import { CALCULATOR_ROUTES, STATIC_ROUTES } from '@/lib/routes'

/**
 * sitemap.xml 생성
 *
 * NOTE (2026-05-11): /salary/[amount] 동적 페이지(27개)는 AdSense 정책상
 * doorway page 의심 신호를 피하기 위해 sitemap에서 제외합니다.
 * 페이지 자체는 유지되어 직접 URL 접근 및 기존 검색 결과는 작동하지만,
 * Google에 적극적으로 색인 요청하지 않습니다.
 * 향후 각 페이지를 구간별로 차별화한 후 다시 sitemap에 포함 가능.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

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
  ]
}