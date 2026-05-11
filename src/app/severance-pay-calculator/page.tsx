/**
 * src/app/severance-pay-calculator/page.tsx
 * 퇴직금 계산기
 */
'use client'

import { useState, useCallback } from 'react'
import { calculateSeverancePay, type SeverancePayResult } from '@/lib/calculators'
import { formatKRW } from '@/lib/salary'
import { TAX_YEAR } from '@/lib/constants'
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

const RELATED = [
  { href: '/unemployment-benefit-calculator', emoji: '🛡️', label: '실업급여 계산기', description: '퇴직 후 받을 수 있는 실업급여' },
  { href: '/annual-leave-pay-calculator', emoji: '🏖️', label: '연차수당 계산기', description: '미사용 연차수당 계산' },
  { href: '/salary-calculator', emoji: '💰', label: '실수령액 계산기', description: '연봉 기준 월 실수령액' },
]

export default function SeverancePayCalculatorPage() {
  const [month1, setMonth1] = useState('')
  const [month2, setMonth2] = useState('')
  const [month3, setMonth3] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [bonus, setBonus] = useState('')
  const [result, setResult] = useState<SeverancePayResult | null>(null)

  const handleCalc = useCallback(() => {
    const m1 = parseNum(month1)
    const m2 = parseNum(month2)
    const m3 = parseNum(month3)
    if (!m1 || !m2 || !m3 || !startDate || !endDate) return
    if (new Date(endDate) <= new Date(startDate)) return

    setResult(calculateSeverancePay({
      month1Pay: m1,
      month2Pay: m2,
      month3Pay: m3,
      startDate,
      endDate,
      annualBonus: parseNum(bonus),
    }))
  }, [month1, month2, month3, startDate, endDate, bonus])

  const isValid = parseNum(month1) > 0 && parseNum(month2) > 0 && parseNum(month3) > 0 && !!startDate && !!endDate

  return (
    <main className="flex-1 max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">퇴직금 계산기</h1>
      <p className="text-gray-500 mb-6">{TAX_YEAR}년 기준 · 근로자퇴직급여보장법 기준</p>

      <AdSlot slotId="TOP_HORIZONTAL" format="horizontal" />

      <div className="mt-6 space-y-6">
        <InputCard title="퇴직금 정보 입력">
          {/* 재직 기간 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">입사일 <span className="text-red-400">*</span></label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">퇴직일 <span className="text-red-400">*</span></label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {/* 최근 3개월 급여 */}
          <div>
            <p className="label mb-1">최근 3개월 월 급여 (세전)</p>
            <p className="hint mb-2">퇴직 직전 3개월 각각의 급여를 입력하세요</p>
            <div className="space-y-2">
              {[
                { label: '3개월 전 급여', val: month1, set: setMonth1 },
                { label: '2개월 전 급여', val: month2, set: setMonth2 },
                { label: '1개월 전 급여 (최근)', val: month3, set: setMonth3 },
              ].map(({ label, val, set }) => (
                <div key={label} className="relative">
                  <input
                    type="text" inputMode="numeric"
                    placeholder={`${label}`}
                    value={val}
                    onChange={(e) => set(formatNum(e.target.value))}
                    className="input-field pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">원</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="label">연간 상여금 <span className="text-xs font-normal text-slate-400">(선택)</span></label>
            <div className="relative">
              <input
                type="text" inputMode="numeric"
                placeholder="예: 3,000,000"
                value={bonus}
                onChange={(e) => setBonus(formatNum(e.target.value))}
                className="input-field pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">원</span>
            </div>
            <p className="hint">연간 지급된 상여금 총액 (평균임금 산정에 포함)</p>
          </div>

          <button
            type="button" onClick={handleCalc} disabled={!isValid}
            className="btn-primary w-full py-3.5 text-base"
          >
            퇴직금 계산하기
          </button>
        </InputCard>

        {result && (
          <div className="space-y-4 animate-slide-up">
            {result.isEligible ? (
              <ResultHighlight
                label="퇴직금 예상액"
                value={formatKRW(result.severancePay)}
                subtitle={`재직일수 ${result.workingDays.toLocaleString()}일 기준`}
                color="#0369a1"
              />
            ) : (
              <div className="card p-6 bg-red-50 border-red-100">
                <p className="text-base font-bold text-red-700 mb-1">퇴직금 지급 요건 미충족</p>
                <p className="text-sm text-red-600">
                  재직일수 {result.workingDays}일 · 퇴직금은 1년(365일) 이상 재직 시 지급됩니다.
                </p>
              </div>
            )}

            {result.isEligible && (
              <BreakdownCard
                title="계산 내역"
                items={[
                  { label: '재직일수', value: `${result.workingDays.toLocaleString()}일` },
                  { label: '1일 평균임금', value: formatKRW(Math.round(result.averageDailyWage)) },
                  { label: '공식: 1일 평균임금 × 30 × (재직일수/365)', value: '' },
                  { label: '퇴직금', value: formatKRW(result.severancePay), highlight: true, color: 'text-brand-700' },
                ]}
              />
            )}

            <Disclaimer year={TAX_YEAR} extra="상여금·연차수당 포함 여부, 특수 근로형태 등에 따라 실제 금액이 달라질 수 있습니다." />
          </div>
        )}

        <div className="mt-10">
          <AdSlot slotId="MID_RECTANGLE" format="rectangle" />
        </div>

        {/* ── 가이드 콘텐츠 ─────────────────────────────────── */}
        <GuideSection
          title="퇴직금이란?"
          intro={
            <p>
              퇴직금은 근로자가 1년 이상 계속 근무한 후 퇴직할 때 사용자가 지급해야 하는
              법정 후불 임금입니다. 「근로자퇴직급여 보장법」 제8조에 따라 모든 사업장(상시
              근로자 1인 이상)은 근로자에게 퇴직금 또는 퇴직연금을 지급해야 하며, 이는 사용자
              의무사항입니다. 퇴직금은 단순 위로금이 아니라 재직 중 후불로 적립되는 임금의
              성격을 가지므로, 사용자가 임의로 지급을 거절하거나 미루는 경우 임금체불로
              간주됩니다.
            </p>
          }
          sections={[
            {
              heading: '퇴직금 지급 요건',
              body: (
                <>
                  <p>
                    퇴직금을 받으려면 다음 두 가지 요건을 모두 충족해야 합니다.
                    첫째, 계속근로기간이 1년(365일) 이상이어야 합니다. 수습기간, 인턴 기간도
                    실제로 근로를 제공했다면 계속근로기간에 포함됩니다. 둘째, 4주 평균 1주
                    소정근로시간이 15시간 이상이어야 합니다. 따라서 주 15시간 미만 단시간
                    근로자는 1년 이상 근무하더라도 법정 퇴직금 지급 대상이 아닙니다.
                  </p>
                  <p>
                    정규직·계약직·일용직·아르바이트 구분 없이 위 두 요건을 충족하면 모두
                    퇴직금 지급 대상입니다. 5인 미만 사업장도 2010년 12월 이후부터 퇴직금
                    지급이 의무화되어 있으므로, 영세 사업장이라는 이유로 지급을 거부할 수
                    없습니다.
                  </p>
                </>
              ),
            },
            {
              heading: '평균임금 vs 통상임금',
              body: (
                <>
                  <p>
                    퇴직금 계산의 핵심은 <strong>1일 평균임금</strong>입니다. 평균임금은
                    퇴직일 직전 3개월간 지급된 임금 총액을 그 기간의 총 일수(보통 89~92일)로
                    나눠 산정합니다. 여기에는 기본급뿐 아니라 정기적·일률적으로 지급된
                    수당, 연차수당, 상여금(연간 상여금의 3/12)이 모두 포함됩니다.
                  </p>
                  <p>
                    다만 평균임금이 통상임금보다 적은 경우에는 통상임금을 평균임금으로
                    봅니다(근기법 제2조 제2항). 회사가 휴업 등의 사유로 직전 3개월 임금이
                    낮다면 이 보호 규정에 따라 통상임금 기준으로 산정해야 합니다.
                  </p>
                </>
              ),
            },
            {
              heading: '퇴직금 지급기한과 지연이자',
              body: (
                <>
                  <p>
                    사용자는 퇴직일로부터 <strong>14일 이내</strong>에 퇴직금을 지급해야
                    합니다(근로자퇴직급여 보장법 제9조). 다만 특별한 사정이 있는 경우에는
                    당사자 간 합의로 지급기일을 연장할 수 있습니다.
                  </p>
                  <p>
                    14일 이내에 지급하지 않으면 그 다음 날부터 실제 지급일까지 연 20%의
                    지연이자가 발생합니다. 미지급 시 고용노동부에 임금체불 진정을 제기할 수
                    있으며, 사용자에게는 3년 이하 징역 또는 3천만원 이하 벌금이 부과될 수
                    있습니다.
                  </p>
                </>
              ),
            },
            {
              heading: '퇴직소득세',
              body: (
                <p>
                  퇴직금에는 퇴직소득세가 부과됩니다. 다만 일반 근로소득세보다 훨씬 낮은
                  세율이 적용되는데, 이는 퇴직금이 장기간 누적된 임금이기 때문입니다.
                  근속연수에 따른 공제(근속연수공제), 환산급여공제 등이 적용되며, 근속이
                  길수록 실효세율이 낮아지는 구조입니다. IRP(개인형 퇴직연금) 계좌로
                  지급받으면 퇴직소득세 납부를 이연할 수 있어 절세 효과가 큽니다.
                </p>
              ),
            },
          ]}
          formula={{
            title: '퇴직금 계산 공식',
            description: (
              <>
                근로자퇴직급여 보장법 시행령 제3조에 따른 법정 산식입니다. 1일 평균임금에
                30일을 곱하여 1년치 기본 단위를 산출한 뒤, 실제 재직일수를 365로 나눈
                비율을 곱합니다.
              </>
            ),
            items: [
              { label: '1일 평균임금', value: '직전 3개월 임금 총액 ÷ 직전 3개월 총 일수' },
              { label: '평균임금 산정 기초', value: '기본급 + 정기수당 + 연차수당 + 상여금(연간 × 3/12)' },
              { label: '퇴직금', value: '1일 평균임금 × 30일 × (재직일수 ÷ 365)' },
              { label: '지급기한', value: '퇴직일로부터 14일 이내' },
            ],
          }}
          referenceTable={{
            caption: '근속연수·월급별 퇴직금 참고표',
            footnote:
              '월급(평균임금 환산 기준) 단일 구간 가정, 상여금·연차수당 미포함 근사값입니다. 실제 금액은 계산기로 확인하세요.',
            headers: ['월급 300만원', '월급 400만원', '월급 500만원'],
            rows: [
              { label: '근속 1년', values: ['약 300만원', '약 400만원', '약 500만원'] },
              { label: '근속 3년', values: ['약 900만원', '약 1,200만원', '약 1,500만원'] },
              { label: '근속 5년', values: ['약 1,500만원', '약 2,000만원', '약 2,500만원'] },
              { label: '근속 10년', values: ['약 3,000만원', '약 4,000만원', '약 5,000만원'] },
              { label: '근속 20년', values: ['약 6,000만원', '약 8,000만원', '약 1억원'] },
            ],
          }}
          legalBasis={[
            { label: '근로자퇴직급여 보장법 제8조 (퇴직금제도의 설정)' },
            { label: '근로자퇴직급여 보장법 제9조 (퇴직금의 지급)' },
            { label: '근로기준법 제2조 제2항 (평균임금 보호조항)' },
            {
              label: '고용노동부 임금체불 신고센터',
              href: 'https://www.moel.go.kr',
            },
          ]}
          disclaimer={
            <>
              본 계산기는 {TAX_YEAR}년 기준 법정 산식에 따른 근사값을 제공합니다. 실제
              퇴직금은 회사 취업규칙, 단체협약, 평균임금 산정 항목의 범위(특별상여·휴가비
              등), 중간정산 이력 등에 따라 달라질 수 있습니다. 정확한 금액은 회사 인사담당
              부서 또는 노무사와 상담하세요.
            </>
          }
        />

        <FaqAccordion
          items={[
            {
              q: '1년 미만 근무하면 퇴직금이 전혀 없나요?',
              a: '법정 퇴직금은 계속근로기간 1년 이상에만 발생합니다. 단, 회사 취업규칙이나 근로계약서에 1년 미만 근로자에게도 퇴직금 또는 위로금을 지급한다는 별도 조항이 있다면 그 약정에 따라 받을 수 있습니다. 또한 사대보험 가입기간이 6개월 이상이라면 실업급여 수급 자격은 별도로 발생할 수 있습니다.',
            },
            {
              q: '아르바이트·계약직도 퇴직금을 받을 수 있나요?',
              a: '네. 고용 형태와 무관하게 4주 평균 주 15시간 이상, 1년 이상 계속 근무했다면 모두 법정 퇴직금 지급 대상입니다. 계약 갱신을 반복하며 1년 이상 근무한 경우에도 전체 기간을 합산해 산정합니다. 5인 미만 사업장도 2010년 12월부터 퇴직금 지급이 의무화되어 있습니다.',
            },
            {
              q: '평균임금과 통상임금 중 어느 것을 적용하나요?',
              a: '원칙은 평균임금이지만, 평균임금이 통상임금보다 낮으면 통상임금을 평균임금으로 봅니다(근로기준법 제2조 제2항). 예를 들어 퇴직 직전에 휴업이나 무급휴직이 있었다면 평균임금이 일시적으로 낮아지므로, 이 보호 조항에 따라 통상임금이 적용됩니다.',
            },
            {
              q: '퇴직금에 상여금과 연차수당이 포함되나요?',
              a: '정기적·일률적으로 지급된 연간 상여금은 평균임금 산정 시 직전 3개월에 해당하는 부분(연간 상여금 × 3/12)을 포함합니다. 미사용 연차수당도 마찬가지로 직전 1년 동안 지급된 금액의 3/12이 평균임금 산정 기초에 포함됩니다. 일회성 인센티브나 경영성과급은 통상 제외됩니다.',
            },
            {
              q: '퇴직금을 14일 이내에 못 받으면 어떻게 해야 하나요?',
              a: '먼저 회사에 서면(이메일, 내용증명)으로 지급을 요청하세요. 그래도 지급되지 않으면 사업장 관할 고용노동지청에 임금체불 진정을 제기할 수 있습니다. 또한 미지급분에 대해 연 20%의 지연이자가 발생하므로 함께 청구할 수 있습니다. 체불금이 큰 경우 소액체당금 제도(체불 임금 일부를 정부가 우선 지급)도 검토할 수 있습니다.',
            },
            {
              q: '중간정산을 받았는데 다시 퇴직할 때 어떻게 계산하나요?',
              a: '중간정산 이후의 근로기간만 별도로 계산합니다. 즉 중간정산 시점이 새로운 입사일이 되는 셈입니다. 다만 2012년 7월 이후로는 무주택자의 주택 구입, 6개월 이상의 요양, 회생절차 등 법정 사유에 해당해야만 중간정산이 가능합니다. 임의로 중간정산했다면 무효 처리되어 전 기간으로 산정될 수 있습니다.',
            },
            {
              q: '퇴직연금(DC/DB)에 가입되어 있는데 별도로 계산되나요?',
              a: '퇴직연금에 가입되어 있다면 본 계산기 결과는 회사가 적립해야 할 부담금의 참고값으로 활용하세요. 확정급여형(DB)은 본 계산기 산식과 동일한 금액을 받지만, 확정기여형(DC)은 매년 회사가 적립한 금액과 운용 수익의 합계가 됩니다. 정확한 적립금은 가입한 퇴직연금 사업자(은행·증권사) 사이트에서 확인할 수 있습니다.',
            },
            {
              q: '퇴직소득세는 얼마나 떼이나요?',
              a: '퇴직소득세는 일반 근로소득세보다 훨씬 낮은 세율이 적용됩니다. 근속연수공제, 환산급여공제 등이 적용되어 근속이 길수록 실효세율이 낮아지는 구조입니다. 일반적으로 퇴직금의 5~15% 정도가 공제되며, 정확한 금액은 회사가 지급 시 원천징수한 명세서에서 확인할 수 있습니다. IRP 계좌로 받으면 세금 납부를 이연할 수 있어 절세에 유리합니다.',
            },
          ]}
        />

        <RelatedCalculators items={RELATED} />

        <AdSlot slotId="BOTTOM_HORIZONTAL" format="horizontal" />
      </div>
    </main>
  )
}
