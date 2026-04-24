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

            <div className="card p-5 bg-sky-50 border-sky-100">
              <h3 className="text-sm font-bold text-sky-800 mb-2">퇴직금 지급 기준</h3>
              <ul className="text-xs text-sky-700 space-y-1 leading-relaxed">
                <li>• 계속근로기간 1년 이상, 4주 평균 주 15시간 이상 근무 시 지급</li>
                <li>• 1일 평균임금 = 퇴직 전 3개월 임금 합계 ÷ 해당 기간 총 일수</li>
                <li>• 퇴직금 = 1일 평균임금 × 30일 × (재직일수 ÷ 365)</li>
                <li>• 퇴직급여는 퇴직일로부터 14일 이내 지급이 원칙</li>
              </ul>
            </div>

            <Disclaimer year={TAX_YEAR} extra="상여금·연차수당 포함 여부, 특수 근로형태 등에 따라 실제 금액이 달라질 수 있습니다." />
          </div>
        )}

        <RelatedCalculators items={RELATED} />

        <AdSlot slotId="BOTTOM_HORIZONTAL" format="horizontal" />
      </div>
    </main>
  )
}
