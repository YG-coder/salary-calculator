/**
 * src/app/salary-comparison-calculator/page.tsx
 * 연봉 비교 계산기 — 두 연봉의 실수령액 차이와 한계 실수령률
 *
 * 계산은 전부 공통 급여 엔진(src/lib/salary.ts)을 재사용하는
 * src/lib/salaryComparison.ts 에서 처리합니다. 이 페이지에는 세금·보험 산식이 없습니다.
 */

import type { Metadata } from 'next'
import AdSlot from '@/components/ui/AdSlot'
import ComparisonForm from '@/components/calculator/ComparisonForm'
import GuideSection from '@/components/calculator/GuideSection'
import FaqAccordion from '@/components/calculator/FaqAccordion'
import RelatedCalculators from '@/components/calculator/RelatedCalculators'
import { SITE_URL, SITE_NAME, TAX_YEAR } from '@/lib/constants'

const PATH = '/salary-comparison-calculator'

export const metadata: Metadata = {
  // ⚠️ layout.tsx의 title.template(`%s | 연봉계산기.kr`)이 사이트명을 자동으로 붙인다.
  //    여기서 SITE_NAME을 또 넣으면 제목에 사이트명이 두 번 들어간다.
  title: `연봉 비교 계산기 ${TAX_YEAR} | 두 연봉의 실수령액 차이`,
  description: `두 연봉을 나란히 비교해 월·연 실수령액 차이와 4대보험·소득세 항목별 차이를 확인하세요. ${TAX_YEAR}년 기준으로 늘어난 연봉 중 실제로 손에 남는 한계 실수령률까지 계산합니다.`,
  alternates: { canonical: `${SITE_URL}${PATH}` },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: `${SITE_URL}${PATH}`,
    siteName: SITE_NAME,
    title: `연봉 비교 계산기 ${TAX_YEAR}`,
    description: '두 연봉의 실수령액 차이와 한계 실수령률을 한 번에 비교하세요.',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `연봉 비교 계산기 ${TAX_YEAR}`,
    description: '두 연봉의 실수령액 차이와 한계 실수령률을 한 번에 비교하세요.',
    images: [`${SITE_URL}/og-image.png`],
  },
}

const RELATED = [
  { href: '/salary-calculator', emoji: '💰', label: '연봉 실수령액 계산기', description: '연봉 하나의 월 실수령액' },
  { href: '/target-salary-calculator', emoji: '🎯', label: '목표 실수령액 역산 계산기', description: '원하는 실수령액 → 필요 연봉' },
  { href: '/social-insurance-calculator', emoji: '🏥', label: '4대보험 계산기', description: '4대보험 항목별 상세 계산' },
  { href: '/severance-pay-calculator', emoji: '📦', label: '퇴직금 계산기', description: '근속기간별 퇴직금 산출' },
]

export default function Page() {
  return (
    <main className="flex-1 max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">연봉 비교 계산기</h1>
      <p className="text-gray-500 mb-6">
        {TAX_YEAR}년 기준 · 두 연봉의 실수령액 차이와 한계 실수령률
      </p>

      <AdSlot slotId="TOP_HORIZONTAL" format="horizontal" />

      <div className="mt-6">
        <ComparisonForm />
      </div>

      <div className="mt-10">
        <AdSlot slotId="MID_RECTANGLE" format="rectangle" />
      </div>

      <div className="mt-10">
        <GuideSection
          title="연봉 비교, 세전 차이만 보면 안 되는 이유"
          intro={
            <p>
              연봉 제안을 받았을 때 세전 금액의 차이만 보면 실제 손에 들어오는 돈을
              과대평가하기 쉽습니다. 늘어난 연봉에는 4대보험과 누진 소득세가 함께
              붙기 때문입니다. 이 계산기는 두 연봉을 같은 조건(비과세·공제대상가족·자녀)에서
              계산해 <strong>월·연 실수령액 차이</strong>, <strong>공제 항목별 차이</strong>,
              그리고 <strong>한계 실수령률</strong>을 보여줍니다.
            </p>
          }
          sections={[
            {
              heading: '한계 실수령률이란',
              body: (
                <>
                  <p>
                    한계 실수령률은 <strong>늘어난 연봉 중 실제로 손에 남는 비율</strong>입니다.
                    연 실수령액 차이를 세전 연봉 차이로 나눈 값입니다. 예를 들어 연봉이
                    500만원 오를 때 연 실수령이 350만원 늘었다면 한계 실수령률은 70%입니다.
                  </p>
                  <p>
                    평균 실수령률(연 실수령 ÷ 세전 연봉)과는 다른 값입니다. 평균 실수령률은
                    연봉 전체에 대한 비율이고, 한계 실수령률은 <strong>추가된 구간에만</strong>
                    적용되는 비율입니다. 소득세가 누진 구조라 보통 한계 실수령률이 평균보다
                    낮게 나옵니다. 연봉 협상에서 의미 있는 숫자는 한계 실수령률 쪽입니다.
                  </p>
                </>
              ),
            },
            {
              heading: '실수령률은 항상 떨어지지 않습니다',
              body: (
                <>
                  <p>
                    &ldquo;연봉이 오르면 실수령률은 계속 떨어진다&rdquo;는 설명을 자주 보지만,
                    실제 계산은 그렇지 않습니다. <strong>국민연금은 기준소득월액에 상한이
                    있어</strong> 상한을 넘으면 보험료가 더 늘지 않습니다. 그 지점을 지나면
                    연봉이 올라가는데도 한계 실수령률이 <strong>오히려 높아집니다.</strong>
                  </p>
                  <p>
                    {TAX_YEAR}년 기준으로는 월 비과세 20만원 · 공제대상가족 1명 조건에서
                    연봉 약 8,100만원 부근이 그 경계입니다. 이 계산기는 두 조건 사이에
                    국민연금 상한이나 간이세액표 조견표 상한이 끼어 있으면 결과 화면에
                    별도로 안내합니다.
                  </p>
                </>
              ),
            },
            {
              heading: '같은 조건에서 비교합니다',
              body: (
                <p>
                  비과세 금액, 공제대상가족 수, 8~20세 자녀 수는 A와 B에 <strong>똑같이</strong>
                  적용됩니다. 연봉 차이만 놓고 비교해야 한계 실수령률을 해석할 수 있기
                  때문입니다. 이직처럼 비과세 구성이나 부양 조건까지 달라지는 경우라면,
                  각각을 <a href="/salary-calculator" className="text-brand-600 underline">
                  연봉 실수령액 계산기</a>로 따로 계산해 비교하세요.
                </p>
              ),
            },
            {
              heading: '계산 기준',
              body: (
                <p>
                  4대보험과 소득세는 연봉 실수령액 계산기와 <strong>완전히 동일한 계산
                  엔진</strong>을 사용합니다. 같은 값을 입력하면 두 계산기의 결과가 정확히
                  일치하며, 이는 회귀 테스트로 고정되어 있습니다. 소득세는 국세청 근로소득
                  간이세액표를 조회해 계산하며, 국민연금 기준소득월액 상·하한은 매년 7월 1일
                  자로 변경되는 고시값을 계산 시점에 맞춰 적용합니다.
                </p>
              ),
            },
          ]}
          formula={{
            title: '계산 공식',
            description: (
              <>
                두 연봉을 각각 계산한 뒤 차분을 냅니다. 실수령액 계산 자체는 연봉
                실수령액 계산기와 같습니다.
              </>
            ),
            items: [
              { label: '실수령액 차이', value: 'B 실수령액 − A 실수령액' },
              { label: '한계 실수령률', value: '(연 실수령 차이) ÷ (세전 연봉 차이)' },
              { label: '한계 공제율', value: '1 − 한계 실수령률' },
              { label: '평균 실수령률', value: '연 실수령액 ÷ 세전 연봉' },
              { label: '항목별 차이', value: 'B 공제액 − A 공제액 (국민연금·건강·장기요양·고용·소득세·지방소득세)' },
            ],
          }}
          legalBasis={[
            { label: '국민연금법 (기준소득월액 상·하한)' },
            { label: '국민건강보험법 · 노인장기요양보험법' },
            { label: '고용보험법' },
            { label: '소득세법 시행령 별표2 (근로소득 간이세액표)' },
          ]}
          disclaimer={
            <>
              본 계산기는 {TAX_YEAR}년 기준 요율과 근로소득 간이세액표에 따른 예상값을
              제공합니다. 실제 공제액은 회사의 급여 구성, 비과세 항목 인정 범위, 연말정산
              결과에 따라 달라질 수 있습니다.
            </>
          }
        />
      </div>

      <FaqAccordion
        items={[
          {
            q: '연봉이 500만원 오르면 실수령은 얼마나 늘어나나요?',
            a: '연봉 구간에 따라 다릅니다. 늘어난 금액 중 실제로 손에 남는 비율을 한계 실수령률이라고 하는데, 소득세가 누진 구조라 연봉이 높을수록 대체로 낮아집니다. 다만 국민연금 기준소득월액 상한을 넘는 구간에서는 국민연금이 더 늘지 않아 한계 실수령률이 오히려 올라갑니다. 두 연봉을 직접 입력해 확인하는 것이 가장 정확합니다.',
          },
          {
            q: '한계 실수령률과 평균 실수령률은 무엇이 다른가요?',
            a: '평균 실수령률은 연봉 전체에 대한 비율(연 실수령 ÷ 세전 연봉)이고, 한계 실수령률은 늘어난 구간에만 적용되는 비율입니다. 연봉 협상이나 이직 비교에서 중요한 것은 한계 실수령률입니다. 예를 들어 평균 실수령률이 80%여도, 추가된 500만원에 대한 한계 실수령률은 70% 아래로 떨어질 수 있습니다.',
          },
          {
            q: '연봉이 오르는데 실수령률이 올라갈 수도 있나요?',
            a: '네. 국민연금은 기준소득월액에 상한이 있어 상한을 넘으면 보험료가 더 늘지 않습니다. 그 지점을 지나면 늘어난 연봉에 국민연금이 붙지 않으므로 한계 실수령률이 오히려 높아집니다. 이 계산기는 두 조건 사이에 상한이 끼어 있으면 결과 화면에 안내를 표시합니다.',
          },
          {
            q: '연봉 실수령액 계산기와 결과가 다르면 어떻게 하나요?',
            a: '달라지지 않습니다. 두 계산기는 완전히 같은 계산 엔진을 사용하며, 같은 입력에서 결과가 일치하는지 자동 테스트로 확인하고 있습니다. 값이 다르게 보인다면 비과세 금액이나 공제대상가족 수 등 입력 조건이 서로 다른지 확인해 보세요.',
          },
          {
            q: 'A와 B의 비과세나 부양가족을 다르게 넣고 싶습니다.',
            a: '이 계산기는 연봉 차이만 놓고 비교하도록 만들어져 조건은 공통으로 적용됩니다. 조건 자체가 다른 두 제안을 비교하려면 연봉 실수령액 계산기에서 각각 계산한 뒤 결과를 비교하세요.',
          },
          {
            q: '성과급이나 상여금도 반영되나요?',
            a: '입력한 연봉에 이미 포함되어 있다면 반영됩니다. 다만 상여금은 지급 시점에 따라 원천징수 방식이 달라질 수 있어, 매월 균등하게 나누어 받는 급여와 실제 월별 공제액이 다를 수 있습니다.',
          },
          {
            q: '연말정산까지 반영된 금액인가요?',
            a: '아닙니다. 이 계산기는 매월 원천징수되는 금액 기준입니다. 실제 부담 세액은 연말정산에서 각종 소득공제·세액공제를 반영해 정산되므로, 연간 실수령액은 계산 결과보다 늘어날 수도 줄어들 수도 있습니다.',
          },
        ]}
      />

      <RelatedCalculators items={RELATED} title="함께 사용하면 좋은 계산기" />

      <AdSlot slotId="BOTTOM_HORIZONTAL" format="horizontal" />
    </main>
  )
}
