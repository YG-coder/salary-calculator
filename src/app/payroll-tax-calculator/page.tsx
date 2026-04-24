/**
 * src/app/payroll-tax-calculator/page.tsx
 * 급여 세금 간편 계산기
 */
'use client'

import { useState, useCallback } from 'react'
import type { Metadata } from 'next'
import { calculatePayrollTax, type PayrollTaxResult } from '@/lib/calculators'
import { formatKRW } from '@/lib/salary'
import { TAX_YEAR } from '@/lib/constants'
import { InputCard, ResultHighlight, BreakdownCard, Disclaimer } from '@/components/calculator/CalcCard'
import RelatedCalculators from '@/components/calculator/RelatedCalculators'
import AdSlot from '@/components/ui/AdSlot'

// metadata는 Server Component에서만 export 가능하므로 별도 파일 또는 제거
// 여기서는 'use client'이므로 page metadata는 layout이나 별도 처리

function formatNum(v: string) {
  const n = v.replace(/[^0-9]/g, '')
  if (!n) return ''
  return Number(n).toLocaleString('ko-KR')
}
function parseNum(v: string) { return Number(v.replace(/[^0-9]/g, '')) || 0 }

const RELATED = [
  { href: '/salary-calculator', emoji: '💰', label: '실수령액 계산기', description: '연봉 기준 월 실수령액 계산' },
  { href: '/social-insurance-calculator', emoji: '🏥', label: '4대보험 계산기', description: '4대보험 항목별 상세 계산' },
  { href: '/severance-pay-calculator', emoji: '📦', label: '퇴직금 계산기', description: '근속기간별 퇴직금 산출' },
]

export default function PayrollTaxCalculatorPage() {
  const [monthlyGross, setMonthlyGross] = useState('')
  const [nonTaxable, setNonTaxable] = useState('')
  const [dependents, setDependents] = useState('1')
  const [result, setResult] = useState<PayrollTaxResult | null>(null)

  const handleCalc = useCallback(() => {
    const gross = parseNum(monthlyGross)
    if (!gross || gross < 100_000) return
    setResult(calculatePayrollTax({
      monthlyGross: gross,
      nonTaxable: parseNum(nonTaxable),
      dependents: Math.max(1, Number(dependents) || 1),
    }))
  }, [monthlyGross, nonTaxable, dependents])

  const grossNum = parseNum(monthlyGross)
  const isValid = grossNum >= 100_000

  return (
    <main className="flex-1 max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">급여 세금 간편 계산</h1>
      <p className="text-gray-500 mb-6">{TAX_YEAR}년 기준 · 월급여 기준 공제세금 빠른 확인</p>

      <AdSlot slotId="TOP_HORIZONTAL" format="horizontal" />

      <div className="mt-6 space-y-6">
        <InputCard title="월급여 정보 입력">
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
            <p className="hint">월 세전 급여를 입력하세요 (최소 10만원)</p>
          </div>

          <div>
            <label className="label">월 비과세 금액 <span className="text-xs font-normal text-slate-400">(선택)</span></label>
            <div className="relative">
              <input
                type="text" inputMode="numeric"
                placeholder="예: 200,000"
                value={nonTaxable}
                onChange={(e) => setNonTaxable(formatNum(e.target.value))}
                onKeyDown={(e) => e.key === 'Enter' && handleCalc()}
                className="input-field pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">원/월</span>
            </div>
            <p className="hint">식대 등 비과세 항목 (4대보험·소득세 계산에서 제외)</p>
          </div>

          <div>
            <label className="label">부양가족 수 (본인 포함)</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n} type="button"
                  onClick={() => setDependents(String(n))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150 ${
                    dependents === String(n)
                      ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600'
                  }`}
                >
                  {n}명
                </button>
              ))}
            </div>
          </div>

          <button
            type="button" onClick={handleCalc} disabled={!isValid}
            className="btn-primary w-full py-3.5 text-base"
          >
            세금 계산하기
          </button>
        </InputCard>

        {result && (
          <div className="space-y-4 animate-slide-up">
            <ResultHighlight
              label="월 실수령액"
              value={formatKRW(result.monthlyNet)}
              subtitle={`월 세전 ${formatKRW(grossNum)} → 공제 ${formatKRW(result.totalDeduction)}`}
            />

            <BreakdownCard
              title="월 공제 내역"
              items={[
                { label: '국민연금 (4.75%)', value: formatKRW(result.nationalPension) },
                { label: '건강보험 (3.595%)', value: formatKRW(result.healthInsurance) },
                { label: '장기요양 (건보료×12.95%)', value: formatKRW(result.longTermCare) },
                { label: '고용보험 (0.9%)', value: formatKRW(result.employment) },
                { label: '소득세', value: formatKRW(result.incomeTax) },
                { label: '지방소득세 (소득세×10%)', value: formatKRW(result.localTax) },
                { label: '월 총 공제', value: `-${formatKRW(result.totalDeduction)}`, highlight: true, color: 'text-red-500' },
              ]}
            />

            <Disclaimer year={TAX_YEAR} />
          </div>
        )}

        <RelatedCalculators items={RELATED} />

        <AdSlot slotId="BOTTOM_HORIZONTAL" format="horizontal" />
      </div>
    </main>
  )
}
