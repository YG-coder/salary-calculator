/**
 * src/app/salary-calculator/page.tsx
 * 역할: /salary-calculator — SEO canonical 주 타겟 페이지
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
  description: `${TAX_YEAR}년 기준 연봉 실수령액을 계산합니다. 국민연금, 건강보험, 고용보험, 소득세 및 지방세를 반영한 월급 실수령액을 확인하세요.`,
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
    description: `${TAX_YEAR}년 기준 4대보험·소득세 자동 계산`,
    url: `${SITE_URL}/salary-calculator`,
    type: 'website',
    locale: 'ko_KR',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} 연봉 계산기`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `연봉 계산기 ${TAX_YEAR}`,
    description: `연봉 실수령액 자동 계산`,
    images: ['/og-image.png'],
  },
}

export default function SalaryCalculatorPage() {
  const webAppJsonLd = buildWebAppJsonLd()
  const faqJsonLd = buildFaqJsonLd()

  return (
      <>
        {/* JSON-LD */}
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

            {/* 제목 */}
            <div className="mb-7">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                연봉 실수령액 계산기
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                {TAX_YEAR}년 기준 · 4대보험 + 소득세 자동 계산
              </p>
            </div>

            {/* ✅ 광고 1개만 (애드센스 승인용) */}
            <AdSlot slotId="TOP_HORIZONTAL" format="horizontal" className="mb-6" />

            {/* 계산기 */}
            <CalculatorForm />

            {/* 콘텐츠 */}
            <ContentSection />

            {/* FAQ */}
            <FaqSection />

            {/* 🔥 SEO 내부링크 */}
            <div className="mt-10">
              <h2 className="text-lg font-bold mb-3">연봉별 실수령액</h2>

              <ul className="space-y-1 text-blue-600">
                <li><a href="/salary/3000">연봉 3000 실수령액</a></li>
                <li><a href="/salary/4000">연봉 4000 실수령액</a></li>
                <li><a href="/salary/5000">연봉 5000 실수령액</a></li>
                <li><a href="/salary/6000">연봉 6000 실수령액</a></li>
                <li><a href="/salary/7000">연봉 7000 실수령액</a></li>
                <li><a href="/salary/8000">연봉 8000 실수령액</a></li>
                <li><a href="/salary/9000">연봉 9000 실수령액</a></li>
                <li><a href="/salary/10000">연봉 1억 실수령액</a></li>
              </ul>
            </div>

            {/* ⚠️ 신뢰도 문구 (필수) */}
            <p className="text-xs text-gray-500 mt-6">
              본 계산기는 참고용으로 제공되며 실제 급여와 차이가 발생할 수 있습니다.
              정확한 금액은 회사 급여명세서 및 세법 기준을 참고하시기 바랍니다.
            </p>

          </main>

          <Footer />
        </div>
      </>
  )
}