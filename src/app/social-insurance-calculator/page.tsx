/**
 * src/app/social-insurance-calculator/page.tsx
 * 4대보험 계산기
 */
'use client'

import { useState, useCallback } from 'react'
import { calculateSocialInsurance, type SocialInsuranceResult } from '@/lib/calculators'
import { formatKRW } from '@/lib/salary'
import { TAX_YEAR, RATES } from '@/lib/constants'
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
                국민연금은 기준소득월액 상한(617만원)·하한(39만원) 내에서 계산됩니다.
                실제 보험료는 공단 고지서를 기준으로 확인하세요.
              </p>
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
