/**
 * src/app/social-insurance-calculator/page.tsx
 * 4대보험 계산기
 */
'use client'

import { useState, useCallback } from 'react'
import { calculateSocialInsurance, type SocialInsuranceResult } from '@/lib/calculators'
import { formatKRW } from '@/lib/salary'
import { TAX_YEAR, RATES, PENSION_LIMITS } from '@/lib/constants'
import { InputCard, ResultHighlight, BreakdownCard, Disclaimer } from '@/components/calculator/CalcCard'
import RelatedCalculators from '@/components/calculator/RelatedCalculators'
import GuideSection from '@/components/calculator/GuideSection'
import FaqAccordion from '@/components/calculator/FaqAccordion'
import AdSlot from '@/components/ui/AdSlot'

function formatNum(v: string) {
  const n = v.replace(/[^0-9]/g, '')
  if (!n) return ''
  return Number(n).toLocaleString('ko-KR')
}
function parseNum(v: string) { return Number(v.replace(/[^0-9]/g, '')) || 0 }

const pensionMinMan = Math.floor(PENSION_LIMITS.min / 10_000)
const pensionMaxMan = Math.floor(PENSION_LIMITS.max / 10_000)

const RELATED = [
  { href: '/salary-calculator', emoji: '💰', label: '실수령액 계산기', description: '4대보험 포함 월 실수령액 계산' },
  { href: '/payroll-tax-calculator', emoji: '🧾', label: '급여 세금 간편 계산', description: '월급 세금 빠른 확인' },
  { href: '/unemployment-benefit-calculator', emoji: '🛡️', label: '실업급여 계산기', description: '고용보험 기반 실업급여 계산' },
]

export default function SocialInsuranceCalculatorPage() {
  const [monthlyGross, setMonthlyGross] = useState('')
  const [result, setResult] = useState<SocialInsuranceResult | null>(null)

  const handleCalc = useCallback(() => {
    const gross = parseNum(monthlyGross)
    if (!gross || gross < 100_000) return
    setResult(calculateSocialInsurance({ monthlyGross: gross }))
  }, [monthlyGross])

  const isValid = parseNum(monthlyGross) >= 100_000

  return (
    <main className="flex-1 max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">4대보험 계산기</h1>
      <p className="text-gray-500 mb-6">{TAX_YEAR}년 기준 · 국민연금·건강보험·고용보험·산재보험 계산</p>

      <AdSlot slotId="TOP_HORIZONTAL" format="horizontal" />

      <div className="mt-6 space-y-6">
        <InputCard title="급여 정보 입력">
          <div>
            <label className="label">월 세전 급여 <span className="text-red-400">*</span></label>
            <div className="relative">
              <input
                type="text" inputMode="numeric"
                placeholder="예: 3,500,000"
                value={monthlyGross}
                onChange={(e) => setMonthlyGross(formatNum(e.target.value))}
                onKeyDown={(e) => e.key === 'Enter' && handleCalc()}
                className="input-field pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">원</span>
            </div>
            <p className="hint">월 세전 급여를 입력하세요</p>
          </div>

          <button
            type="button" onClick={handleCalc} disabled={!isValid}
            className="btn-primary w-full py-3.5 text-base"
          >
            4대보험 계산하기
          </button>
        </InputCard>

        {result && (
          <div className="space-y-4 animate-slide-up">
            <ResultHighlight
              label="근로자 4대보험 합계 (월)"
              value={formatKRW(result.totalEmployee)}
              subtitle={`사업주 부담 합계: ${formatKRW(result.totalEmployer)}`}
              color="#0369a1"
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="card p-4">
                <p className="text-xs font-semibold text-slate-400 mb-1">근로자 부담</p>
                <p className="text-xl font-bold text-slate-900 tabular-nums">{formatKRW(result.totalEmployee)}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs font-semibold text-slate-400 mb-1">사업주 부담</p>
                <p className="text-xl font-bold text-orange-600 tabular-nums">{formatKRW(result.totalEmployer)}</p>
              </div>
            </div>

            <BreakdownCard
              title="근로자 부담 내역"
              items={[
                { label: `국민연금 (${(RATES.nationalPension * 100).toFixed(2)}%)`, value: formatKRW(result.nationalPension) },
                { label: `건강보험 (${(RATES.healthInsurance * 100).toFixed(3)}%)`, value: formatKRW(result.healthInsurance) },
                { label: `장기요양 (건보료×${(RATES.longTermCare * 100).toFixed(2)}%)`, value: formatKRW(result.longTermCare) },
                { label: `고용보험 (${(RATES.employment * 100).toFixed(1)}%)`, value: formatKRW(result.employment) },
                { label: '근로자 합계', value: formatKRW(result.totalEmployee), highlight: true, color: 'text-brand-700' },
              ]}
            />

            <BreakdownCard
              title="사업주 부담 내역"
              items={[
                { label: `국민연금 (${(RATES.nationalPension * 100).toFixed(2)}%)`, value: formatKRW(result.employerPension) },
                { label: `건강보험 (${(RATES.healthInsurance * 100).toFixed(3)}%)`, value: formatKRW(result.employerHealth) },
                { label: `장기요양`, value: formatKRW(result.employerLongTerm) },
                { label: '고용보험 (1.3%, 사업주)', value: formatKRW(result.employerEmployment) },
                { label: '산재보험 (약 0.7%)', value: formatKRW(result.industrialAccident) },
                { label: '사업주 합계', value: formatKRW(result.totalEmployer), highlight: true, color: 'text-orange-600' },
              ]}
            />

            <div className="card p-5 bg-amber-50 border-amber-100">
              <p className="text-xs text-amber-700 leading-relaxed">
                <strong className="font-semibold">📌 안내:</strong> 산재보험료는 업종별로 상이하며, 여기서는 평균값(0.7%)을 사용합니다.
                국민연금은 기준소득월액 상한({pensionMaxMan}만원)·하한({pensionMinMan}만원) 내에서 계산됩니다.
                실제 보험료는 공단 고지서를 기준으로 확인하세요.
              </p>
            </div>

            <Disclaimer year={TAX_YEAR} />
          </div>
        )}

        <div className="mt-10">
          <AdSlot slotId="MID_RECTANGLE" format="rectangle" />
        </div>

        {/* ── 가이드 콘텐츠 ─────────────────────────────────── */}
        <GuideSection
          title="4대보험이란?"
          intro={
            <p>
              4대보험은 국민연금·건강보험·고용보험·산재보험을 통칭하는 사회보험 제도로,
              근로자의 노후·질병·실업·산재 위험을 국가가 사회 전체적으로 분담하는 안전망입니다.
              상시 근로자 1명 이상을 사용하는 사업장은 4대보험에 의무 가입해야 하며, 보험료는
              근로자와 사업주가 분담합니다. {TAX_YEAR}년 기준 근로자가 부담하는 4대보험은
              월 과세급여의 약 9% 수준이며, 사업주는 산재보험까지 포함해 약 10% 내외를
              부담합니다.
            </p>
          }
          sections={[
            {
              heading: '국민연금',
              body: (
                <>
                  <p>
                    국민연금은 노후 소득 보장을 위한 공적연금입니다. 최소 가입기간 10년(120개월)을
                    채우면 만 65세부터 노령연금을 평생 수령할 수 있습니다(출생연도별로 수급
                    개시 연령이 60~65세로 다름).
                  </p>
                  <p>
                    근로자 부담률은 월 과세급여의 {(RATES.nationalPension * 100).toFixed(2)}%이며,
                    사업주가 동일 금액을 추가 부담해 총 9.0%가 적립됩니다. 단,
                    기준소득월액에는 상한({pensionMaxMan}만원)과 하한({pensionMinMan}만원)이
                    있어 월 급여가 상한을 초과해도 그 이상은 보험료가 늘어나지 않습니다.
                    {pensionMaxMan}만원 기준 근로자 부담은 최대 약 28만원 수준입니다.
                  </p>
                </>
              ),
            },
            {
              heading: '건강보험 및 장기요양보험',
              body: (
                <>
                  <p>
                    건강보험은 질병·부상 시 진료비 부담을 사회가 분담하는 의료보험입니다.
                    근로자 부담률은 {(RATES.healthInsurance * 100).toFixed(3)}%로, 사업주도
                    동일하게 부담합니다. 가입 즉시 본인뿐 아니라 피부양자(배우자·자녀·부모
                    등)도 의료 혜택을 받을 수 있습니다.
                  </p>
                  <p>
                    장기요양보험은 노인 장기요양 서비스 재원 마련을 위해 건강보험료에 부가
                    부과되는 보험으로, 건강보험료의 {(RATES.longTermCare * 100).toFixed(2)}%가
                    추가됩니다. 만 65세 이상이거나 노인성 질병이 있는 64세 이하 가입자가
                    요양 등급을 받으면 방문요양·요양원 입소 등의 서비스를 이용할 수 있습니다.
                  </p>
                </>
              ),
            },
            {
              heading: '고용보험',
              body: (
                <p>
                  고용보험은 실직 시 생활 안정과 재취업을 지원하는 사회보험입니다. 근로자
                  부담률은 {(RATES.employment * 100).toFixed(1)}%이며, 사업주는 1.15~1.75%
                  (사업 규모별 차등)를 부담합니다. 비자발적 사유로 퇴직하고 가입기간이
                  180일(약 6개월) 이상이면 실업급여를 받을 수 있고, 육아휴직급여·직업훈련비
                  지원 등도 이 보험에서 지급됩니다.
                </p>
              ),
            },
            {
              heading: '산재보험',
              body: (
                <p>
                  산재보험은 업무상 재해·질병 시 의료비와 휴업급여, 장해·유족급여를 지급하는
                  보험입니다. <strong>전액 사업주가 부담</strong>하며 근로자 부담은 없습니다.
                  업종별로 위험도가 달라 0.7%(평균)부터 18%대까지 요율이 천차만별이며, 본
                  계산기에서는 평균값 0.7%를 사용합니다.
                </p>
              ),
            },
            {
              heading: '두루누리 사회보험료 지원',
              body: (
                <p>
                  10인 미만 사업장의 월 보수 270만원 미만 근로자와 그 사업주는 국민연금·
                  고용보험료의 일부(최대 80%)를 정부로부터 지원받을 수 있습니다. 신규 가입자
                  중심으로 지원되며, 신청은 사업주가 근로복지공단에 합니다. 본 계산기는
                  지원금을 반영하지 않은 전액 부담 기준 결과를 제공합니다.
                </p>
              ),
            },
          ]}
          formula={{
            title: `4대보험 요율 (${TAX_YEAR}년 기준)`,
            description:
              '각 보험의 근로자·사업주 부담 요율과 부과 기준입니다. 국민연금만 기준소득월액 상·하한이 적용되며, 나머지는 월 과세급여 전액에 비례합니다.',
            items: [
              { label: '국민연금', value: `근로자 ${(RATES.nationalPension * 100).toFixed(2)}% + 사업주 ${(RATES.nationalPension * 100).toFixed(2)}% = 합계 9.0%` },
              { label: '건강보험', value: `근로자 ${(RATES.healthInsurance * 100).toFixed(3)}% + 사업주 동일 = 합계 7.19%` },
              { label: '장기요양', value: `건강보험료 × ${(RATES.longTermCare * 100).toFixed(2)}% (근로자·사업주 절반씩)` },
              { label: '고용보험(실업급여)', value: `근로자 ${(RATES.employment * 100).toFixed(1)}% + 사업주 0.9%` },
              { label: '고용안정·직업능력', value: '사업주 0.25~0.85% (규모별)' },
              { label: '산재보험', value: '사업주 전액 부담 (업종별 0.7%~18%)' },
            ],
          }}
          referenceTable={{
            caption: '월급별 근로자 4대보험 합계 참고표',
            footnote:
              `${TAX_YEAR}년 요율 기준, 비과세 항목 제외 근로자 부담 합계입니다. 실제 금액은 회사 급여명세서를 확인하세요.`,
            headers: ['국민연금', '건강+장기요양', '고용보험'],
            rows: [
              { label: '월 200만원', values: ['95,000원', '약 81,000원', '18,000원'] },
              { label: '월 300만원', values: ['142,500원', '약 122,000원', '27,000원'] },
              { label: '월 400만원', values: ['190,000원', '약 162,000원', '36,000원'] },
              { label: '월 500만원', values: ['237,500원', '약 203,000원', '45,000원'] },
              { label: '월 617만원 이상', values: ['293,000원 (상한)', '비례 증가', '비례 증가'] },
            ],
          }}
          legalBasis={[
            { label: '국민연금법, 국민건강보험법, 고용보험법, 산업재해보상보험법' },
            {
              label: '국민연금공단',
              href: 'https://www.nps.or.kr',
            },
            {
              label: '국민건강보험공단',
              href: 'https://www.nhis.or.kr',
            },
            {
              label: '근로복지공단 (산재·고용보험)',
              href: 'https://www.comwel.or.kr',
            },
          ]}
          disclaimer={
            <>
              본 계산기는 {TAX_YEAR}년 고시 요율 기준 근사값입니다. 두루누리 지원, 산재보험
              업종별 차등, 사업장 규모에 따른 고용안정·직업능력 분담분 등에 따라 실제 금액과
              차이가 있을 수 있습니다. 정확한 부과액은 각 공단의 EDI 또는 4대 사회보험
              정보연계센터(www.4insure.or.kr)에서 확인하세요.
            </>
          }
        />

        <FaqAccordion
          items={[
            {
              q: '아르바이트도 4대보험에 가입해야 하나요?',
              a: '4주 평균 주 15시간 이상, 1개월 이상 계속 근무하는 단시간 근로자는 4대보험 전체 가입 대상입니다. 주 15시간 미만이거나 일용직(1개월 미만 단기 근로)의 경우 산재보험과 일부 고용보험만 적용되고 국민연금·건강보험은 제외될 수 있습니다. 다만 일용근로자도 8일 이상 또는 60시간 이상 근로하면 국민연금·건강보험 가입 대상입니다.',
            },
            {
              q: '국민연금에 상한액이 있다는데 무슨 뜻인가요?',
              a: `국민연금은 기준소득월액 상한(${pensionMaxMan}만원)을 두고 있어, 월 급여가 이를 초과해도 ${pensionMaxMan}만원을 기준으로만 보험료가 산정됩니다. 따라서 월 급여 700만원이든 1,000만원이든 국민연금 근로자 부담은 최대 약 28만원 수준에서 고정됩니다. 하한액은 ${pensionMinMan}만원으로, 월 급여가 이보다 낮아도 ${pensionMinMan}만원 기준으로 부과됩니다.`,
            },
            {
              q: '두루누리 사회보험 지원은 어떻게 받나요?',
              a: '10인 미만 사업장의 월 보수 270만원 미만 신규 가입 근로자가 대상입니다. 사업주가 근로복지공단(고용·산재토탈서비스 또는 4대 사회보험 정보연계센터)에서 신청하며, 승인되면 국민연금·고용보험료의 최대 80%까지 정부가 지원합니다. 최대 36개월 지원되며, 본 계산기는 지원금을 반영하지 않은 전액 부담 기준 결과입니다.',
            },
            {
              q: '건강보험 피부양자 등록 조건은 무엇인가요?',
              a: '직장가입자의 배우자, 직계존비속(부모·자녀·손자녀), 형제자매(만 30세 미만 또는 65세 이상) 등이 피부양자가 될 수 있습니다. 단, 연간 소득 합계 2,000만원 이하, 재산세 과세표준 5.4억원 이하 등의 요건을 충족해야 하며, 금융소득·연금소득·근로소득·사업소득의 합이 일정 기준을 넘으면 자격이 박탈됩니다. 자격 박탈 시 지역가입자로 전환되어 별도 보험료가 부과됩니다.',
            },
            {
              q: '4대보험 가입을 거부하는 회사에는 어떻게 대응하나요?',
              a: '4대보험은 사용자가 임의로 가입을 거부할 수 없는 법정 의무사항입니다. 회사가 가입을 회피하면 국민연금공단(1355), 건강보험공단(1577-1000), 근로복지공단(1588-0075)에 직접 신고할 수 있으며, 신고 시점부터 소급 적용이 가능합니다. 다만 근로자 부담분은 소급분도 본인이 납부해야 하므로, 회사와 미리 협의하는 것이 좋습니다.',
            },
            {
              q: '회사가 부담하는 보험료도 내 임금에서 빠지나요?',
              a: '아니요. 사업주 부담분은 회사가 별도로 납부하는 것이며, 근로자의 월급에서 공제되는 것은 근로자 부담분뿐입니다. 다만 회사 입장에서는 인건비 부담이 늘어나기 때문에, 연봉 협상 시 회사가 “4대보험 회사 부담분까지 포함한 총 인건비”를 기준으로 제시하는 경우가 있습니다.',
            },
            {
              q: '여러 직장에서 동시에 일하면 어떻게 되나요?',
              a: '국민연금은 각 사업장에서 별도 가입되어 모두 보험료가 부과되며, 합산 기준소득월액이 상한을 넘으면 비례 배분됩니다. 건강보험은 주된 사업장 1곳만 직장가입자로 등록되고 나머지는 지역가입자 또는 추가 부담으로 처리됩니다. 고용보험은 1개 사업장만 가입되며, 자발적으로 주 사업장을 선택할 수 있습니다.',
            },
            {
              q: '연말정산에서 4대보험료를 공제받을 수 있나요?',
              a: '국민연금 근로자 부담분은 전액 소득공제됩니다. 건강보험료와 고용보험료는 특별소득공제 항목에 포함되어 역시 전액 공제 가능합니다. 회사가 연말정산 시 자동으로 반영하므로 별도 서류 제출은 필요 없습니다. 단, 지역가입자로 납부한 보험료는 본인이 직접 증빙(국민건강보험공단 사이트에서 발급)을 첨부해야 할 수 있습니다.',
            },
          ]}
        />

        <RelatedCalculators items={RELATED} />

        <AdSlot slotId="BOTTOM_HORIZONTAL" format="horizontal" />
      </div>
    </main>
  )
}
