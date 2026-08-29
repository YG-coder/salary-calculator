/**
 * src/app/bonus-withholding-calculator/page.tsx
 * 상여금 원천징수 계산기
 *
 * ⚠️ 이름을 "상여금 계산기"가 아니라 "상여금 원천징수 계산기"로 한정한 이유는
 *    docs/bonus-tax-policy.md P5를 참조. 상여금을 받아도 국민연금·건강보험·
 *    장기요양 공제액은 그달에 늘지 않으므로, 4대보험 전체를 계산하면 틀린 값이 된다.
 */

import type { Metadata } from 'next'
import AdSlot from '@/components/ui/AdSlot'
import BonusForm from '@/components/calculator/BonusForm'
import GuideSection from '@/components/calculator/GuideSection'
import FaqAccordion from '@/components/calculator/FaqAccordion'
import RelatedCalculators from '@/components/calculator/RelatedCalculators'
import { SITE_URL, SITE_NAME, TAX_YEAR } from '@/lib/constants'
import { MAX_BONUS_PERIOD_MONTHS } from '@/lib/policy/bonus'

const PATH = '/bonus-withholding-calculator'

export const metadata: Metadata = {
  // layout.tsx의 title.template이 사이트명을 붙이므로 여기서는 넣지 않는다.
  title: `상여금 원천징수 계산기 ${TAX_YEAR} | 성과급·명절상여 실수령액`,
  description: `상여금에서 얼마가 떼이는지 계산합니다. 소득세법 제136조 지급대상기간 산식을 그대로 적용하며, 상여금을 받아도 국민연금·건강보험이 그달에 늘지 않는 이유도 함께 안내합니다.`,
  alternates: { canonical: `${SITE_URL}${PATH}` },
  openGraph: {
    type: 'website', locale: 'ko_KR', url: `${SITE_URL}${PATH}`, siteName: SITE_NAME,
    title: `상여금 원천징수 계산기 ${TAX_YEAR}`,
    description: '성과급·명절상여의 실수령액과 원천징수 세액을 계산합니다.',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `상여금 원천징수 계산기 ${TAX_YEAR}`,
    description: '성과급·명절상여의 실수령액과 원천징수 세액을 계산합니다.',
    images: [`${SITE_URL}/og-image.png`],
  },
}

const RELATED = [
  { href: '/salary-calculator', emoji: '💰', label: '연봉 실수령액 계산기', description: '연봉 기준 월 실수령액' },
  { href: '/payroll-tax-calculator', emoji: '🧾', label: '급여 세금 간편 계산', description: '월급 세금 빠른 확인' },
  { href: '/social-insurance-calculator', emoji: '🏥', label: '4대보험 계산기', description: '4대보험 항목별 상세 계산' },
  { href: '/salary-comparison-calculator', emoji: '📊', label: '연봉 비교 계산기', description: '두 연봉의 실수령액 차이' },
]

export default function Page() {
  return (
    <main className="flex-1 max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">상여금 원천징수 계산기</h1>
      <p className="text-gray-500 mb-6">
        {TAX_YEAR}년 기준 · 성과급·명절상여에서 떼는 세금과 실수령액
      </p>

      <AdSlot slotId="TOP_HORIZONTAL" format="horizontal" />

      <div className="mt-6">
        <BonusForm />
      </div>

      <div className="mt-10">
        <AdSlot slotId="MID_RECTANGLE" format="rectangle" />
      </div>

      <div className="mt-10">
        <GuideSection
          title="상여금 세금은 월급과 다르게 계산합니다"
          intro={
            <p>
              상여금은 한 달 급여에 그냥 더해서 세금을 매기지 않습니다. 「소득세법」
              제136조는 상여금을 <strong>지급대상기간의 월수로 나누어</strong> 월평균
              급여와 합산한 뒤, 그 금액에 간이세액표를 적용하고 다시 월수를 곱하는
              방식을 정하고 있습니다. 상여금을 한 달에 몰아서 받았다는 이유로 세율이
              과도하게 올라가지 않도록 하는 장치입니다.
            </p>
          }
          sections={[
            {
              heading: '계산 순서',
              body: (
                <>
                  <p>
                    ① 상여금을 지급대상기간 월수로 나눕니다. ② 그 금액에 지급대상기간의
                    상여 외 월평균 급여를 더합니다(월환산액). ③ 월환산액에 근로소득
                    간이세액표를 적용해 월 세액을 구합니다. ④ 월 세액에 지급대상기간
                    월수를 곱합니다. ⑤ 그 기간에 이미 원천징수한 세액을 뺍니다.
                  </p>
                  <p>
                    지급대상기간이 1년을 넘으면 {MAX_BONUS_PERIOD_MONTHS}개월로 보고,
                    1개월 미만의 끝수는 1개월로 봅니다(제136조 제1항 제3호).
                  </p>
                </>
              ),
            },
            {
              heading: '지급대상기간이 없는 상여',
              body: (
                <>
                  <p>
                    명절 상여처럼 대상 기간이 정해지지 않은 상여는 그 해 1월 1일부터
                    지급일이 속하는 달까지를 지급대상기간으로 봅니다. 그 해에 이미 상여를
                    받은 적이 있다면, <strong>직전 상여 지급월의 다음 달부터</strong>
                    이번 지급월까지가 기간이 됩니다(제136조 제1항 제2호).
                  </p>
                  <p>
                    놓치기 쉬운 규정이 하나 있습니다. 대상 기간이 정해져 있더라도
                    <strong> 그 기간의 마지막 달이 아닌 달에 지급되면 &lsquo;지급대상기간이
                    없는 상여&rsquo;로 봅니다</strong>(시행령 제195조 제1항 제1호).
                    예를 들어 1~6월 실적 상여를 8월에 받으면 6개월이 아니라 1~8월
                    기준으로 계산합니다.
                  </p>
                </>
              ),
            },
            {
              heading: '⚠️ 국민연금·건강보험은 상여금 받은 달에 늘지 않습니다',
              body: (
                <>
                  <p>
                    가장 흔한 오해입니다. 상여금에도 4대보험이 비례해서 붙는다고 생각하기
                    쉽지만 그렇지 않습니다. <strong>국민연금</strong>은 미리 정해진
                    기준소득월액을 기준으로 부과하므로(국민연금법 제3조) 상여금을 받은
                    달에 보험료가 바뀌지 않습니다. 기준소득월액에는 상·하한도 있습니다.
                  </p>
                  <p>
                    <strong>건강보험</strong>과 <strong>장기요양보험</strong>은 보수월액을
                    기준으로 부과한 뒤(국민건강보험법 제70조), 실제 보수총액과의 차액을
                    나중에 정산합니다. 그래서 상여금을 받은 달이 아니라 정산 시점에
                    반영됩니다. 정산 금액은 사업장의 신고 상황에 좌우되므로 이 계산기가
                    예측하지 않습니다.
                  </p>
                  <p>
                    4대보험 중 <strong>고용보험만</strong> 지급한 보수에 비례해 그달에
                    부과됩니다(보험료징수법 제2조·제13조). 그래서 이 계산기는 고용보험만
                    계산합니다.
                  </p>
                </>
              ),
            },
            {
              heading: '연말정산에서 정산됩니다',
              body: (
                <p>
                  원천징수는 개산액입니다. 상여금 때문에 그달에 세금을 많이 뗐더라도,
                  연말정산에서 각종 소득공제·세액공제를 반영해 최종 세액이 정해지고
                  차액은 환급되거나 추가 납부됩니다. 이 계산기가 보여주는 금액은
                  &ldquo;최종 세금&rdquo;이 아니라 <strong>그 시점에 떼는 금액</strong>입니다.
                </p>
              ),
            },
          ]}
          formula={{
            title: '상여금 원천징수 계산 공식',
            description: <>소득세법 제136조 제1항의 산식을 그대로 적용합니다.</>,
            items: [
              { label: '월환산액', value: '상여금 ÷ 지급대상기간 월수 + 상여 외 월평균 급여' },
              { label: '기간 세액', value: '간이세액표(월환산액) × 지급대상기간 월수' },
              { label: '상여금 소득세', value: '기간 세액 − 해당 기간 기납부세액' },
              { label: '지방소득세', value: '소득세 × 10%' },
              { label: '고용보험', value: '상여금 × 근로자 고용보험 요율' },
            ],
          }}
          legalBasis={[
            { label: '소득세법 제136조 (상여 등에 대한 징수세액)' },
            { label: '소득세법 시행령 제195조 (상여등에 관한 원천징수)' },
            { label: '소득세법 시행령 별표2 (근로소득 간이세액표)' },
            { label: '국민건강보험법 제70조 (보수월액)' },
            { label: '고용보험 및 산업재해보상보험의 보험료징수 등에 관한 법률 제13조' },
          ]}
          disclaimer={
            <>
              본 계산기는 {TAX_YEAR}년 기준 근로소득 간이세액표에 따른 예상값입니다.
              기납부세액을 직접 입력하지 않으면 매월 급여가 일정했다고 가정한 추정치를
              사용하므로 실제 원천징수액과 차이가 날 수 있습니다. 최종 세액은
              연말정산에서 정산됩니다.
            </>
          }
        />
      </div>

      <FaqAccordion
        items={[
          {
            q: '상여금에도 4대보험이 다 붙나요?',
            a: '아닙니다. 4대보험 중 고용보험만 상여금에 비례해 그달에 부과됩니다. 국민연금은 미리 정해진 기준소득월액으로 부과되어 상여금을 받은 달에 바뀌지 않고, 건강보험·장기요양보험은 보수월액 기준으로 부과한 뒤 나중에 정산합니다. 상여금 명세서에서 국민연금·건강보험 공제액이 평소와 같은 이유가 이것입니다.',
          },
          {
            q: '상여금 세금이 왜 이렇게 많이 떼이나요?',
            a: '상여금을 지급대상기간 월수로 나눈 뒤 월평균 급여와 합산해 세율을 정하기 때문에, 상여금이 클수록 합산액이 높은 세율 구간으로 올라갑니다. 다만 원천징수는 개산액이라 연말정산에서 정산됩니다. 지급대상기간이 길수록 월환산액이 낮아져 세부담이 줄어듭니다.',
          },
          {
            q: '지급대상기간이 있는지 없는지 어떻게 구분하나요?',
            a: '"상반기 실적 상여"처럼 대상 기간이 정해져 있고 그 기간의 마지막 달에 받으면 "있음"입니다. 명절 상여처럼 기간이 없거나, 기간이 정해져 있어도 마지막 달이 아닌 달에 받으면 "없음"으로 봅니다(소득세법 시행령 제195조 제1항 제1호). 예를 들어 1~6월 실적 상여를 8월에 받으면 "없음"입니다.',
          },
          {
            q: '기납부세액을 모르면 어떻게 하나요?',
            a: '체크하지 않으면 입력한 월평균 급여를 기준으로 간이세액표를 조회해 추정합니다. 매월 급여가 일정했다고 가정한 값이라 실제와 차이가 날 수 있습니다. 급여명세서에서 해당 기간의 소득세 합계를 확인해 직접 입력하면 정확해집니다.',
          },
          {
            q: '성과급도 같은 방식으로 계산하나요?',
            a: '근로소득에 해당하는 성과급이라면 같습니다. 다만 주주총회 결의로 잉여금을 처분해 지급하는 상여는 간이세액표가 아니라 기본세율을 적용하므로(소득세법 제136조 제2항) 이 계산기의 대상이 아닙니다.',
          },
          {
            q: '같은 달에 성격이 다른 상여를 여러 건 받으면요?',
            a: '지급대상기간이 서로 다른 상여를 같은 달에 받으면 각 지급대상기간 월수의 산술평균을 적용합니다(소득세법 시행령 제195조 제1항 제2호). 이 계산기는 한 건씩 계산하므로, 평균 월수를 직접 계산해 "지급대상기간 있음"으로 입력하세요.',
          },
          {
            q: '계산 결과가 실제 명세서와 다릅니다.',
            a: '기납부세액 추정치, 비과세 항목의 범위, 회사의 원천징수 실무 차이 때문일 수 있습니다. 상여 외 월평균 급여는 비과세를 뺀 과세분으로 입력해야 하고, 기납부세액은 직접 입력하는 편이 정확합니다. 어느 경우든 최종 세액은 연말정산에서 정산됩니다.',
          },
        ]}
      />

      <RelatedCalculators items={RELATED} title="함께 사용하면 좋은 계산기" />

      <AdSlot slotId="BOTTOM_HORIZONTAL" format="horizontal" />
    </main>
  )
}
