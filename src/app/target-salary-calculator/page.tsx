/**
 * src/app/target-salary-calculator/page.tsx
 * 목표 실수령액 역산 계산기 — "이 실수령을 받으려면 연봉이 얼마여야 하나"
 * 순방향 연봉계산기와 입력 계약·결과 카드를 공유하며 입력 방향만 뒤집는다.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import AdSlot from '@/components/ui/AdSlot'
import ReverseCalculatorForm from '@/components/calculator/ReverseCalculatorForm'
import RelatedCalculators from '@/components/calculator/RelatedCalculators'
import { SITE_URL, SITE_NAME, TAX_YEAR } from '@/lib/constants'

const PATH = '/target-salary-calculator'

export const metadata: Metadata = {
  title: `목표 실수령액 역산 계산기 ${TAX_YEAR} | 필요한 연봉 계산 - ${SITE_NAME}`,
  description: `원하는 월 실수령액을 입력하면 필요한 최소 세전 연봉을 역산합니다. ${TAX_YEAR}년 기준 4대보험·소득세를 반영해 목표 실수령을 받기 위한 연봉을 계산하세요.`,
  alternates: { canonical: `${SITE_URL}${PATH}` },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: `${SITE_URL}${PATH}`,
    siteName: SITE_NAME,
    title: `목표 실수령액 역산 계산기 ${TAX_YEAR}`,
    description: `원하는 월 실수령액을 입력하면 필요한 최소 세전 연봉을 역산합니다.`,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `목표 실수령액 역산 계산기 ${TAX_YEAR}`,
    description: `원하는 월 실수령액으로 필요한 연봉을 역산하세요.`,
    images: [`${SITE_URL}/og-image.png`],
  },
}

const RELATED = [
  {
    href: '/salary-calculator',
    emoji: '💰',
    label: '연봉 실수령액 계산기',
    description: '연봉 → 실수령액 (순방향)',
  },
  {
    href: '/social-insurance-calculator',
    emoji: '🏥',
    label: '4대보험 계산기',
    description: '4대보험 항목별 상세 계산',
  },
  {
    href: '/payroll-tax-calculator',
    emoji: '🧾',
    label: '급여 세금 간편 계산',
    description: '월급 세금 빠른 확인',
  },
  {
    href: '/severance-pay-calculator',
    emoji: '📦',
    label: '퇴직금 계산기',
    description: '근속기간별 퇴직금 산출',
  },
]

const webAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: `목표 실수령액 역산 계산기`,
  url: `${SITE_URL}${PATH}`,
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
  description: `원하는 월 실수령액을 입력하면 필요한 최소 세전 연봉을 역산하는 ${TAX_YEAR}년 기준 계산기`,
}

export default function Page() {
  return (
    <>
      <Script
        id="reverse-webapp-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-4">목표 실수령액 역산 계산기</h1>

        <p className="text-gray-500 mb-6">
          {TAX_YEAR}년 기준 · 원하는 월 실수령액 → 필요한 최소 연봉
        </p>

        <AdSlot slotId="TOP_HORIZONTAL" format="horizontal" />

        <div className="mt-6">
          <ReverseCalculatorForm />
        </div>

        <div className="mt-10">
          <AdSlot slotId="MID_RECTANGLE" format="rectangle" />
        </div>

        {/* 가이드 (고유 콘텐츠) */}
        <section className="mt-10 card p-6 space-y-5 leading-7 text-slate-700">
          <h2 className="text-xl font-bold text-slate-900">
            목표 실수령액 역산은 어떻게 계산하나요?
          </h2>
          <p>
            일반적인 연봉 계산기는 세전 연봉을 넣으면 세후 실수령액을 알려줍니다. 이
            계산기는 그 반대입니다. 받고 싶은 월 실수령액을 먼저 정하면, 4대보험과
            소득세를 모두 공제한 뒤에도 그 금액이 남으려면 세전 연봉이 최소 얼마여야
            하는지를 역으로 찾아줍니다. 이직·연봉협상에서 &ldquo;세후로 이만큼은
            받아야 한다&rdquo;는 기준이 먼저 있을 때 유용합니다.
          </p>

          <div>
            <h3 className="font-bold text-slate-900">왜 &lsquo;최소&rsquo; 연봉인가요?</h3>
            <p className="mt-2">
              같은 실수령액을 만드는 연봉은 하나의 점이 아니라 좁은 구간입니다.
              공제액이 원 단위로 절사(내림)되고 소득세가 간이세액표의 구간 단위로
              적용되기 때문에, 서로 다른 연봉이 같은 실수령액으로 떨어지는 경우가
              있습니다. 그래서 이 계산기는 목표 실수령액 &ldquo;이상&rdquo;을 만족하는
              가장 낮은 연봉을 찾습니다. 협상 기준으로 삼기에 가장 안전한 값입니다.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900">
              결과 연봉은 어떻게 정해지나요?
            </h3>
            <p className="mt-2">
              이 계산기는 목표 실수령액 이상을 만족하는 연봉을 만원 단위에서 직접
              찾습니다. 실제 연봉 협상에서 주로 쓰는 만원 단위 중 목표를 충족하는 가장
              낮은 금액을 결과로 표시하고, 그 연봉을 다시 순방향으로 계산해 월 세전·
              실수령액·공제 내역을 산출합니다. 그래서 화면에 표시되는 모든 금액은 하나의
              연봉에서 나온 값으로 서로 어긋나지 않으며, 결과 실수령액이 입력한 목표보다
              조금 높게 나오는 경우 그 여유분도 함께 표시됩니다.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900">비과세·부양가족은 어떻게 반영되나요?</h3>
            <p className="mt-2">
              순방향 연봉 계산기와 동일한 기준을 사용합니다. 월 비과세 금액(식대 등)은
              4대보험과 소득세 산정에서 제외되어 같은 세전 연봉이라도 실수령액을
              높이고, 부양가족 수는 소득세 공제에 반영됩니다. 두 값을 함께 입력하면
              더 현실적인 필요 연봉을 얻을 수 있습니다.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-10 card p-6">
          <h2 className="text-xl font-bold text-slate-900">자주 묻는 질문</h2>
          <div className="mt-5 space-y-5">
            <div>
              <h3 className="font-bold text-slate-900">
                Q. 결과 실수령액이 입력한 목표보다 조금 많은데 정상인가요?
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                네. 만원 단위 중 목표를 충족하는 가장 낮은 연봉을 선택하기 때문에 실제
                실수령액은 목표를 약간
                넘습니다. 결과에는 목표보다 얼마나 여유가 있는지도 함께 표시됩니다.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900">
                Q. 이 연봉이면 실제로 그 실수령을 받게 되나요?
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                간이세액표({TAX_YEAR}년 기준)와 4대보험 요율을 적용한 예상값입니다. 회사의
                급여 규정, 상여금 지급 방식, 실제 비과세 항목, 연말정산 결과에 따라
                차이가 날 수 있습니다.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900">
                Q. 연봉을 먼저 알고 실수령을 확인하고 싶어요.
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                그 경우에는{' '}
                <Link href="/salary-calculator" className="text-brand-600 hover:underline">
                  연봉 실수령액 계산기
                </Link>
                를 사용하세요. 세전 연봉을 입력하면 세후 실수령액과 공제 내역을 계산합니다.
              </p>
            </div>
          </div>
        </section>

        <RelatedCalculators items={RELATED} title="함께 사용하면 좋은 계산기" />

        <div className="mt-10">
          <AdSlot slotId="BOTTOM_HORIZONTAL" format="horizontal" />
        </div>
      </main>
    </>
  )
}
