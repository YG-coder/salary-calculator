/**
 * src/app/annual-leave-pay-calculator/page.tsx
 * 연차수당 계산기
 */
'use client'

import { useState, useCallback } from 'react'
import { calculateAnnualLeavePay, calculateAnnualLeaveDays, type AnnualLeavePayResult } from '@/lib/calculators'
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
  { href: '/weekly-holiday-pay-calculator', emoji: '📅', label: '주휴수당 계산기', description: '주 15시간 이상 근무 시 주휴수당' },
  { href: '/severance-pay-calculator', emoji: '📦', label: '퇴직금 계산기', description: '근속기간별 퇴직금 산출' },
  { href: '/salary-calculator', emoji: '💰', label: '실수령액 계산기', description: '연봉 기준 월 실수령액' },
]

export default function AnnualLeavePayCalculatorPage() {
  const [mode, setMode] = useState<'direct' | 'calc'>('direct')
  const [dailyWage, setDailyWage] = useState('')
  const [unusedDays, setUnusedDays] = useState('')
  // 일당 계산용
  const [monthlyWage, setMonthlyWage] = useState('')
  const [workingYears, setWorkingYears] = useState('1')
  const [result, setResult] = useState<AnnualLeavePayResult | null>(null)
  const [annualDays, setAnnualDays] = useState<number | null>(null)

  const computedDailyWage = mode === 'calc'
    ? Math.floor(parseNum(monthlyWage) / 30 * 12 / 365)
    : parseNum(dailyWage)

  const handleCalc = useCallback(() => {
    const dw = computedDailyWage
    const ud = parseNum(unusedDays)
    if (!dw || !ud) return
    setResult(calculateAnnualLeavePay({ dailyWage: dw, unusedDays: ud }))
    setAnnualDays(calculateAnnualLeaveDays(Number(workingYears)))
  }, [computedDailyWage, unusedDays, workingYears])

  const isValid = computedDailyWage > 0 && parseNum(unusedDays) > 0

  return (
    <main className="flex-1 max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">연차수당 계산기</h1>
      <p className="text-gray-500 mb-6">{TAX_YEAR}년 기준 · 미사용 연차수당 계산</p>

      <AdSlot slotId="TOP_HORIZONTAL" format="horizontal" />

      <div className="mt-6 space-y-6">
        <InputCard title="연차 정보 입력">
          {/* 입력 방식 선택 */}
          <div>
            <label className="label">1일 통상임금 입력 방식</label>
            <div className="flex gap-2">
              {[
                { value: 'direct', label: '직접 입력' },
                { value: 'calc', label: '월급으로 계산' },
              ].map((opt) => (
                <button
                  key={opt.value} type="button"
                  onClick={() => setMode(opt.value as 'direct' | 'calc')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    mode === opt.value
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {mode === 'direct' ? (
            <div>
              <label className="label">1일 통상임금 <span className="text-red-400">*</span></label>
              <div className="relative">
                <input
                  type="text" inputMode="numeric"
                  placeholder="예: 80,000"
                  value={dailyWage}
                  onChange={(e) => setDailyWage(formatNum(e.target.value))}
                  className="input-field pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">원</span>
              </div>
              <p className="hint">급여명세서의 1일 통상임금을 입력하세요</p>
            </div>
          ) : (
            <div>
              <label className="label">월 통상임금 <span className="text-red-400">*</span></label>
              <div className="relative">
                <input
                  type="text" inputMode="numeric"
                  placeholder="예: 2,500,000"
                  value={monthlyWage}
                  onChange={(e) => setMonthlyWage(formatNum(e.target.value))}
                  className="input-field pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">원</span>
              </div>
              {parseNum(monthlyWage) > 0 && (
                <p className="hint text-brand-600">
                  계산된 1일 통상임금: {formatKRW(Math.floor(parseNum(monthlyWage) / 30 * 12 / 365))}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="label">미사용 연차 일수 <span className="text-red-400">*</span></label>
            <div className="relative">
              <input
                type="text" inputMode="numeric"
                placeholder="예: 10"
                value={unusedDays}
                onChange={(e) => setUnusedDays(formatNum(e.target.value))}
                className="input-field pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">일</span>
            </div>
          </div>

          <div>
            <label className="label">근속 기간</label>
            <div className="flex flex-wrap gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '10'].map((y) => (
                <button
                  key={y} type="button"
                  onClick={() => setWorkingYears(y)}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
                    workingYears === y
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
                  }`}
                >
                  {y}년
                </button>
              ))}
            </div>
            <p className="hint">
              근속 {workingYears}년 기준 법정 연차: {calculateAnnualLeaveDays(Number(workingYears))}일
            </p>
          </div>

          <button
            type="button" onClick={handleCalc} disabled={!isValid}
            className="btn-primary w-full py-3.5 text-base"
          >
            연차수당 계산하기
          </button>
        </InputCard>

        {result && (
          <div className="space-y-4 animate-slide-up">
            <ResultHighlight
              label="연차수당"
              value={formatKRW(result.annualLeavePay)}
              subtitle={`미사용 ${unusedDays}일 × 1일 ${formatKRW(result.perDayAmount)}`}
              color="#0284c7"
            />

            <BreakdownCard
              title="계산 내역"
              items={[
                { label: '1일 통상임금', value: formatKRW(result.perDayAmount) },
                { label: '미사용 연차 일수', value: `${parseNum(unusedDays)}일` },
                { label: `법정 연차 (근속 ${workingYears}년)`, value: `${annualDays ?? 0}일` },
                { label: '연차수당 합계', value: formatKRW(result.annualLeavePay), highlight: true, color: 'text-brand-700' },
              ]}
            />

            <div className="card p-5 bg-sky-50 border-sky-100">
              <h3 className="text-sm font-bold text-sky-800 mb-2">연차 일수 기준 (근로기준법)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-sky-700">
                  <thead><tr className="font-semibold"><th className="text-left py-1">근속기간</th><th className="text-right py-1">연차 일수</th></tr></thead>
                  <tbody>
                    {[1,2,3,4,5,6,7,10].map((y) => (
                      <tr key={y} className={workingYears === String(y) ? 'font-bold text-sky-900' : ''}>
                        <td className="py-0.5">{y}년</td>
                        <td className="text-right">{calculateAnnualLeaveDays(y)}일</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Disclaimer year={TAX_YEAR} extra="통상임금 산정 방식, 회사 내규에 따라 실제 금액이 달라질 수 있습니다." />
          </div>
        )}

        <RelatedCalculators items={RELATED} />

        <AdSlot slotId="BOTTOM_HORIZONTAL" format="horizontal" />
      </div>
    </main>
  )
}
