/**
 * src/app/weekly-holiday-pay-calculator/page.tsx
 * 주휴수당 계산기
 */
'use client'

import { useState, useCallback } from 'react'
import { calculateWeeklyHolidayPay, type WeeklyHolidayPayResult } from '@/lib/calculators'
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

// 2026년 최저시급
const MIN_HOURLY_WAGE = 10_030

const RELATED = [
  { href: '/annual-leave-pay-calculator', emoji: '🏖️', label: '연차수당 계산기', description: '미사용 연차수당 계산' },
  { href: '/salary-calculator', emoji: '💰', label: '실수령액 계산기', description: '연봉 기준 월 실수령액' },
  { href: '/payroll-tax-calculator', emoji: '🧾', label: '급여 세금 간편 계산', description: '월급 세금 빠른 확인' },
]

export default function WeeklyHolidayPayCalculatorPage() {
  const [weeklyHours, setWeeklyHours] = useState('')
  const [hourlyWage, setHourlyWage] = useState('')
  const [result, setResult] = useState<WeeklyHolidayPayResult | null>(null)

  const handleCalc = useCallback(() => {
    const wh = parseNum(weeklyHours)
    const hw = parseNum(hourlyWage) || MIN_HOURLY_WAGE
    if (!wh) return
    setResult(calculateWeeklyHolidayPay({ weeklyHours: wh, hourlyWage: hw }))
  }, [weeklyHours, hourlyWage])

  const wh = parseNum(weeklyHours)
  const hw = parseNum(hourlyWage) || MIN_HOURLY_WAGE
  const isValid = wh > 0

  // 월 주휴수당 예상 (주 4.345주)
  const monthlyEstimate = result?.weeklyHolidayPay
    ? Math.floor(result.weeklyHolidayPay * 4.345)
    : null

  return (
    <main className="flex-1 max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">주휴수당 계산기</h1>
      <p className="text-gray-500 mb-6">{TAX_YEAR}년 기준 · 주 15시간 이상 근무 시 주휴수당 계산</p>

      <AdSlot slotId="TOP_HORIZONTAL" format="horizontal" />

      <div className="mt-6 space-y-6">
        <InputCard title="근무 정보 입력">
          <div>
            <label className="label">주 소정근로시간 <span className="text-red-400">*</span></label>
            <div className="relative">
              <input
                type="text" inputMode="numeric"
                placeholder="예: 20"
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(formatNum(e.target.value))}
                onKeyDown={(e) => e.key === 'Enter' && handleCalc()}
                className="input-field pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">시간</span>
            </div>
            <p className="hint">
              주 15시간 이상 근무 시 주휴수당 발생
              {wh > 0 && (
                <span className={wh >= 15 ? ' text-emerald-600 font-semibold' : ' text-red-500 font-semibold'}>
                  {' '}· {wh >= 15 ? '✓ 주휴수당 발생' : '✗ 주휴수당 미발생'}
                </span>
              )}
            </p>
          </div>

          <div>
            <label className="label">
              시간당 임금{' '}
              <span className="text-xs font-normal text-slate-400">
                (선택, 기본: 최저시급 {MIN_HOURLY_WAGE.toLocaleString()}원)
              </span>
            </label>
            <div className="relative">
              <input
                type="text" inputMode="numeric"
                placeholder={`최저시급: ${MIN_HOURLY_WAGE.toLocaleString()}`}
                value={hourlyWage}
                onChange={(e) => setHourlyWage(formatNum(e.target.value))}
                onKeyDown={(e) => e.key === 'Enter' && handleCalc()}
                className="input-field pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">원</span>
            </div>
            <p className="hint">{TAX_YEAR}년 최저시급 {MIN_HOURLY_WAGE.toLocaleString()}원 적용 중</p>
          </div>

          <button
            type="button" onClick={handleCalc} disabled={!isValid}
            className="btn-primary w-full py-3.5 text-base"
          >
            주휴수당 계산하기
          </button>
        </InputCard>

        {result && (
          <div className="space-y-4 animate-slide-up">
            {result.isEligible ? (
              <ResultHighlight
                label="주 주휴수당"
                value={formatKRW(result.weeklyHolidayPay)}
                subtitle={`월 예상 주휴수당: ${monthlyEstimate ? formatKRW(monthlyEstimate) : '-'}`}
                color="#0284c7"
              />
            ) : (
              <div className="card p-6 bg-red-50 border-red-100">
                <p className="text-base font-bold text-red-700 mb-1">주휴수당 미발생</p>
                <p className="text-sm text-red-600">
                  주 {wh}시간 근무 → 주 15시간 미만으로 주휴수당이 발생하지 않습니다.
                </p>
              </div>
            )}

            {result.isEligible && (
              <BreakdownCard
                title="계산 내역"
                items={[
                  { label: '주 소정근로시간', value: `${wh}시간` },
                  { label: '시간당 임금', value: formatKRW(hw) },
                  { label: '주휴시간 (주 소정근로 ÷ 5)', value: `${result.weeklyHolidayHours}시간` },
                  { label: '주 주휴수당', value: formatKRW(result.weeklyHolidayPay), highlight: true, color: 'text-brand-700' },
                  { label: '월 예상 주휴수당 (×4.345주)', value: formatKRW(monthlyEstimate ?? 0) },
                ]}
              />
            )}

            <div className="card p-5 bg-sky-50 border-sky-100">
              <h3 className="text-sm font-bold text-sky-800 mb-2">주휴수당 계산 기준</h3>
              <ul className="text-xs text-sky-700 space-y-1 leading-relaxed">
                <li>• 1주 소정근로시간이 15시간 이상인 근로자에게 주 1일의 유급휴일 부여</li>
                <li>• 주휴수당 = 1일 소정근로시간 × 시간당 통상임금</li>
                <li>• 1일 소정근로시간 = 주 소정근로시간 ÷ 5 (최대 8시간)</li>
                <li>• 주 40시간 이상 근로자: 8시간 × 시급</li>
                <li>• 근로기준법 제55조 기준 (2024년 개정 포함)</li>
              </ul>
            </div>

            <Disclaimer year={TAX_YEAR} />
          </div>
        )}

        <RelatedCalculators items={RELATED} />

        <AdSlot slotId="BOTTOM_HORIZONTAL" format="horizontal" />
      </div>
    </main>
  )
}
