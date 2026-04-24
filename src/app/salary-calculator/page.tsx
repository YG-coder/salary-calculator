/**
 * src/app/salary-calculator/page.tsx
 * 실수령액 계산기 페이지
 */

import type { Metadata } from 'next'
import Script from 'next/script'
import AdSlot from '@/components/ui/AdSlot'
import CalculatorForm from '@/components/calculator/CalculatorForm'
import ContentSection from '@/components/calculator/ContentSection'
import FaqSection from '@/components/calculator/FaqSection'
import RelatedCalculators from '@/components/calculator/RelatedCalculators'
import { SITE_NAME, TAX_YEAR } from '@/lib/constants'
import { buildWebAppJsonLd, buildFaqJsonLd } from '@/lib/jsonld'

export const metadata: Metadata = {
  title: `연봉 실수령액 계산기 ${TAX_YEAR} | ${SITE_NAME}`,
  description: `${TAX_YEAR}년 기준 연봉 실수령액을 빠르게 계산하세요. 4대보험(국민연금·건강보험·고용보험) 및 소득세·지방소득세 자동 반영.`,
}

const RELATED = [
  {
    href: '/social-insurance-calculator',
    emoji: '🏥',
    label: '4대보험 계산기',
    description: '4대보험 항목별 상세 계산',
  },
  {
    href: '/severance-pay-calculator',
    emoji: '📦',
    label: '퇴직금 계산기',
    description: '근속기간별 퇴직금 산출',
  },
  {
    href: '/payroll-tax-calculator',
    emoji: '🧾',
    label: '급여 세금 간편 계산',
    description: '월급 세금 빠른 확인',
  },
  {
    href: '/unemployment-benefit-calculator',
    emoji: '🛡️',
    label: '실업급여 계산기',
    description: '퇴직 후 받을 실업급여 예상',
  },
]

export default function SalaryCalculatorPage() {
  const webAppJsonLd = buildWebAppJsonLd()
  const faqJsonLd = buildFaqJsonLd()

  return (
    <>
      <Script
        id="webapp-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
      <Script
        id="faq-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-4">연봉 실수령액 계산기</h1>

        <p className="text-gray-500 mb-6">
          {TAX_YEAR}년 기준 · 4대보험 + 소득세 자동 계산
        </p>

        <AdSlot slotId="TOP_HORIZONTAL" format="horizontal" />

        <div className="mt-6">
          <CalculatorForm />
        </div>

        <div className="mt-10">
          <AdSlot slotId="MID_RECTANGLE" format="rectangle" />
        </div>

        <div className="mt-10">
          <ContentSection />
        </div>

        <div className="mt-10">
          <FaqSection />
        </div>

        <RelatedCalculators items={RELATED} title="함께 사용하면 좋은 계산기" />

        {/* 세금계산기 외부 CTA */}
        <section className="mt-10 rounded-2xl border bg-blue-50 p-6">
          <h2 className="text-base font-bold mb-1 text-slate-900">
            세금 상세 계산이 필요하신가요?
          </h2>
          <p className="text-slate-600 text-sm mb-4">
            부가세, 종합소득세 등 더 자세한 세금 계산은 세금계산기에서 확인하세요.
          </p>
          <a
            href="https://taxsim.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            세금 계산기 바로가기 →
          </a>
        </section>

        <div className="mt-10">
          <AdSlot slotId="BOTTOM_HORIZONTAL" format="horizontal" />
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-bold mb-3">연봉별 실수령액</h2>
          <ul className="grid grid-cols-2 gap-2 text-brand-600">
            {Array.from({ length: 20 }, (_, i) => {
              const val = 2000 + i * 500
              return (
                <li key={val}>
                  <a href={`/salary/${val}`} className="hover:underline text-sm">
                    연봉 {val}만원
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </main>
    </>
  )
}
