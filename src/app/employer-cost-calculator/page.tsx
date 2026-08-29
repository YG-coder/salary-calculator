/**
 * src/app/employer-cost-calculator/page.tsx
 * 기업 총 인건비 계산기
 *
 * 설계 근거: docs/employer-cost-policy.md
 * ⚠️ 근로자 공제액을 사업주 비용으로 오인하지 않도록 결과를 3단으로 분리한다.
 *    산재보험료율은 기본값 없이 사용자 입력을 강제한다.
 */

import type { Metadata } from 'next'
import AdSlot from '@/components/ui/AdSlot'
import EmployerCostForm from '@/components/calculator/EmployerCostForm'
import GuideSection from '@/components/calculator/GuideSection'
import FaqAccordion from '@/components/calculator/FaqAccordion'
import RelatedCalculators from '@/components/calculator/RelatedCalculators'
import { SITE_URL, SITE_NAME, TAX_YEAR } from '@/lib/constants'

const PATH = '/employer-cost-calculator'

export const metadata: Metadata = {
  title: `기업 총 인건비 계산기 ${TAX_YEAR} | 연봉 외 사업주 부담 4대보험`,
  description: `연봉 외에 회사가 추가로 부담하는 4대보험을 계산합니다. 국민연금·건강보험·장기요양·고용보험 사업주 부담분과 산재보험을 항목별로 나누고, 근로자 실수령액과 총 인건비를 분리해 보여줍니다.`,
  alternates: { canonical: `${SITE_URL}${PATH}` },
  openGraph: {
    type: 'website', locale: 'ko_KR', url: `${SITE_URL}${PATH}`, siteName: SITE_NAME,
    title: `기업 총 인건비 계산기 ${TAX_YEAR}`,
    description: '연봉 외에 회사가 추가로 부담하는 4대보험을 계산합니다.',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `기업 총 인건비 계산기 ${TAX_YEAR}`,
    description: '연봉 외에 회사가 추가로 부담하는 4대보험을 계산합니다.',
    images: [`${SITE_URL}/og-image.png`],
  },
}

const RELATED = [
  { href: '/social-insurance-calculator', emoji: '🏥', label: '4대보험 계산기', description: '4대보험 항목별 상세 계산' },
  { href: '/salary-calculator', emoji: '💰', label: '연봉 실수령액 계산기', description: '근로자 기준 월 실수령액' },
  { href: '/salary-comparison-calculator', emoji: '📊', label: '연봉 비교 계산기', description: '두 연봉의 실수령액 차이' },
  { href: '/severance-pay-calculator', emoji: '📦', label: '퇴직금 계산기', description: '근속기간별 퇴직금 산출' },
]

export default function Page() {
  return (
    <main className="flex-1 max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">기업 총 인건비 계산기</h1>
      <p className="text-gray-500 mb-6">
        {TAX_YEAR}년 기준 · 연봉 외에 회사가 추가로 부담하는 금액
      </p>

      <AdSlot slotId="TOP_HORIZONTAL" format="horizontal" />

      <div className="mt-6">
        <EmployerCostForm />
      </div>

      <div className="mt-10">
        <AdSlot slotId="MID_RECTANGLE" format="rectangle" />
      </div>

      <div className="mt-10">
        <GuideSection
          title="총 인건비는 연봉보다 큽니다"
          intro={
            <p>
              직원 한 명을 채용할 때 회사가 쓰는 돈은 계약 연봉이 전부가 아닙니다.
              4대보험에는 <strong>사업주가 따로 부담하는 몫</strong>이 있고, 산재보험은
              사업주가 전액 부담합니다. 이 계산기는 근로자가 받는 돈, 계약상 급여,
              회사가 쓰는 돈을 <strong>세 덩어리로 나누어</strong> 보여줍니다.
            </p>
          }
          sections={[
            {
              heading: '가장 흔한 오해 두 가지',
              body: (
                <>
                  <p>
                    <strong>&ldquo;4대보험 회사가 반 내주니까 내 공제액만큼이 회사 비용&rdquo;</strong>
                    — 아닙니다. 국민연금·건강보험·장기요양은 노사 부담액이 같지만,
                    고용보험은 <strong>고용안정·직업능력개발사업분을 사업주가 전액</strong>
                    부담하고(보험료징수법 제13조 제4항), 산재보험은 근로자 부담이 0인
                    대신 사업주가 전액 냅니다. 그래서 사업주 부담이 근로자 공제보다 큽니다.
                  </p>
                  <p>
                    <strong>&ldquo;총 인건비 = 연봉&rdquo;</strong> — 아닙니다. 계약 연봉
                    위에 사업주 부담분이 얹힙니다. 이 계산기는 그 차이를 금액과 비율로
                    함께 보여줍니다.
                  </p>
                </>
              ),
            },
            {
              heading: '⚠️ 산재보험료율은 직접 입력해야 합니다',
              body: (
                <>
                  <p>
                    산재보험료율은 <strong>사업의 종류별로 고용노동부령</strong>으로 정합니다
                    (보험료징수법 제14조 제3항). 같은 법 제14조 제5항은 특정 업종 요율이
                    전체 평균의 <strong>20배</strong>를 넘지 않도록 할 뿐이어서, 업종 간
                    격차가 매우 큽니다.
                  </p>
                  <p>
                    그래서 이 계산기는 평균값 같은 기본값을 넣지 않았습니다. 임의값으로
                    계산하면 총 인건비가 크게 틀어지기 때문입니다. 사업장의 실제 요율은{' '}
                    <a href="https://total.comwel.or.kr" target="_blank" rel="noopener noreferrer"
                      className="text-brand-600 underline">근로복지공단 고용·산재보험 토탈서비스</a>
                    에서 확인할 수 있습니다.
                  </p>
                </>
              ),
            },
            {
              heading: '사업주 부담 구조',
              body: (
                <p>
                  국민연금은 기여금(근로자)과 부담금(사용자)을 각각 같은 금액으로
                  부담하고(국민연금법 제88조 제3항), 건강보험은 노사가 각각
                  50%씩 부담합니다(국민건강보험법 제76조 제1항). 장기요양보험은
                  건강보험료에 연동되므로 부담 비율도 같습니다. 고용보험은 실업급여분만
                  노사가 절반씩 나누고 고용안정·직업능력개발분은 사업주가 전액 부담하며,
                  이 부분이 사업장 규모에 따라 달라집니다.
                </p>
              ),
            },
            {
              heading: '포함하지 않은 비용',
              body: (
                <p>
                  이 계산기는 <strong>법정 4대보험 사업주 부담분만</strong> 계산합니다.
                  퇴직급여 충당(근로자퇴직급여보장법상 제도 유형에 따라 다름), 복리후생비,
                  채용·교육비는 회사 정책이나 회계 처리에 좌우되므로 포함하지 않았습니다.
                  두루누리 등 보험료 지원금, 장애인 고용부담금, 임금채권보장기금 부담금도
                  사업장 상황에 따라 달라져 반영하지 않았습니다.
                </p>
              ),
            },
          ]}
          formula={{
            title: '총 인건비 계산 공식',
            description: <>근로자 실수령액과 사업주 총비용을 분리해 계산합니다.</>,
            items: [
              { label: '① 월 실수령액', value: '월 세전 급여 − 근로자 부담 공제' },
              { label: '② 월 세전 급여', value: '계약 연봉 ÷ 12' },
              { label: '③ 월 총 인건비', value: '② 월 세전 급여 + 사업주 부담분' },
              { label: '사업주 부담분', value: '국민연금 + 건강보험 + 장기요양 + 고용보험(고용안정 포함) + 산재보험' },
              { label: '산재보험', value: '월 과세급여 × 업종별 산재보험료율 (사업주 전액)' },
            ],
          }}
          legalBasis={[
            { label: '국민연금법 제88조 (연금보험료의 부과·징수 등)' },
            { label: '국민건강보험법 제76조 (보험료의 부담)' },
            { label: '보험료징수법 제13조 (보험료)' },
            { label: '보험료징수법 제14조 (보험료율의 결정)' },
            { label: '근로복지공단 고용·산재보험 토탈서비스', href: 'https://total.comwel.or.kr' },
          ]}
          disclaimer={
            <>
              본 계산기는 {TAX_YEAR}년 기준 법정 4대보험 사업주 부담분의 예상값입니다.
              실제 부담액은 사업장 규모, 산재보험료율, 보험료 지원 여부에 따라 달라집니다.
              퇴직급여와 복리후생비는 포함되어 있지 않습니다.
            </>
          }
        />
      </div>

      <FaqAccordion
        items={[
          {
            q: '연봉 5,000만원 직원의 실제 인건비는 얼마인가요?',
            a: '사업장 규모와 업종별 산재보험료율에 따라 달라집니다. 법정 4대보험 사업주 부담분만 해도 연봉의 10% 안팎이 추가되며, 산재보험료율이 높은 업종은 더 커집니다. 여기에 퇴직급여 충당까지 고려하면 차이가 더 벌어집니다. 정확한 값은 사업장의 실제 산재보험료율을 입력해 확인하세요.',
          },
          {
            q: '근로자 공제액과 사업주 부담액이 왜 다른가요?',
            a: '국민연금·건강보험·장기요양은 노사 부담액이 같지만, 고용보험은 고용안정·직업능력개발사업분을 사업주가 전액 부담하고(보험료징수법 제13조 제4항) 산재보험은 사업주가 전액 부담하기 때문입니다. 그래서 사업주 부담이 근로자 공제보다 큽니다. 또한 근로자 공제에는 소득세·지방소득세가 포함되지만 이는 회사 비용이 아닙니다.',
          },
          {
            q: '산재보험료율은 어디서 확인하나요?',
            a: '근로복지공단 고용·산재보험 토탈서비스(total.comwel.or.kr)에서 사업장의 적용 요율을 확인할 수 있습니다. 산재보험료율은 사업의 종류별로 고용노동부령으로 정하며, 특정 업종은 전체 평균의 최대 20배까지 높을 수 있어 임의 평균값으로 계산하면 총 인건비가 크게 틀어집니다.',
          },
          {
            q: '퇴직금도 인건비에 포함해야 하지 않나요?',
            a: '실제 비용으로는 포함해야 하지만 이 계산기는 반영하지 않습니다. 퇴직급여는 보험료가 아니라 회계상 충당 항목이고, 확정급여형(DB)과 확정기여형(DC) 중 어느 제도인지에 따라 회사가 인식하는 비용과 시점이 달라지기 때문입니다. 예상 퇴직금은 퇴직금 계산기에서 별도로 확인하세요.',
          },
          {
            q: '두루누리 지원을 받으면 얼마나 줄어드나요?',
            a: '이 계산기는 지원금을 반영하지 않은 전액 부담 기준입니다. 두루누리 사회보험료 지원은 사업장 규모와 근로자 보수 요건을 충족하고 신청·승인을 받아야 적용되며, 지원 비율과 기간도 정해져 있어 일반화할 수 없습니다.',
          },
          {
            q: '사업장 규모는 어떻게 고르나요?',
            a: '고용보험의 고용안정·직업능력개발사업 요율이 상시근로자 수에 따라 달라집니다. 150인 미만, 150인 이상 우선지원대상기업, 150~999인, 1,000인 이상·국가/지자체의 4단계입니다. 우선지원대상기업 해당 여부는 업종별 기준이 있으므로 근로복지공단에서 확인하세요.',
          },
        ]}
      />

      <RelatedCalculators items={RELATED} title="함께 사용하면 좋은 계산기" />

      <AdSlot slotId="BOTTOM_HORIZONTAL" format="horizontal" />
    </main>
  )
}
