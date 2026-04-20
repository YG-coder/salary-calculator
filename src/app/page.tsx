/**
 * src/app/page.tsx
 * 역할: 루트(/) 랜딩 페이지 — 계산기 메인
 * - canonical: /salary-calculator (SEO 중복 콘텐츠 방지)
 * - JSON-LD: jsonld.ts 에서 공통 팩토리 사용 (중복 제거)
 * - 내부 링크: 소개, 개인정보처리방침
 */
import type { Metadata } from 'next'
import Header from '@/components/ui/Header'
import Footer from '@/components/ui/Footer'
import AdSlot from '@/components/ui/AdSlot'
import CalculatorForm from '@/components/calculator/CalculatorForm'
import ContentSection from '@/components/calculator/ContentSection'
import FaqSection from '@/components/calculator/FaqSection'
import { SITE_URL, SITE_NAME, TAX_YEAR } from '@/lib/constants'
import { buildWebAppJsonLd, buildFaqJsonLd } from '@/lib/jsonld'

export const metadata: Metadata = {
  title: `연봉 실수령액 계산기 ${TAX_YEAR} — 4대보험·소득세 자동 계산`,
  description: `${TAX_YEAR}년 기준 연봉 실수령액을 바로 계산하세요. 국민연금(4.5%), 건강보험(3.545%), 고용보험(0.9%), 소득세·지방세 자동 계산. 월 실수령액·연 실수령액 한눈에 확인.`,
  keywords: [
    '연봉 실수령액 계산기',
    '연봉계산기',
    '월급 실수령액',
    '4대보험 계산',
    `${TAX_YEAR} 연봉계산기`,
    '국민연금 계산',
    '건강보험 계산',
    '소득세 계산',
    '실수령액',
    '연봉 세후',
  ],
  alternates: {
    canonical: `${SITE_URL}/salary-calculator`,
  },
  openGraph: {
    title: `연봉 실수령액 계산기 ${TAX_YEAR} | ${SITE_NAME}`,
    description: `${TAX_YEAR}년 기준 4대보험·소득세 자동 계산. 월 실수령액을 바로 확인하세요.`,
    url: `${SITE_URL}/salary-calculator`,
    type: 'website',
    locale: 'ko_KR',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `${SITE_NAME} 연봉 실수령액 계산기` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `연봉 실수령액 계산기 ${TAX_YEAR} | ${SITE_NAME}`,
    description: `${TAX_YEAR}년 기준 4대보험·소득세 자동 계산. 월 실수령액을 바로 확인하세요.`,
    images: ['/og-image.png'],
  },
}

export default function RootPage() {
  const webAppJsonLd = buildWebAppJsonLd()
  const faqJsonLd    = buildFaqJsonLd()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="mb-7">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              연봉 실수령액 계산기
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              {TAX_YEAR}년 기준 · 4대보험 + 소득세 자동 계산
            </p>
          </div>

          <AdSlot slotId="TOP_HORIZONTAL" format="horizontal" className="mb-6" />

          <CalculatorForm />

          <AdSlot slotId="MID_RECTANGLE" format="rectangle" className="mt-8" />

          <ContentSection />

          <FaqSection />

          <AdSlot slotId="BOTTOM_HORIZONTAL" format="horizontal" className="mt-8" />
        </main>

        <Footer />
      </div>
    </>
  )
}
