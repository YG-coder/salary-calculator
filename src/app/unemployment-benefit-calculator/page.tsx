/**
 * src/app/unemployment-benefit-calculator/page.tsx
 * 실업급여 계산기
 */
'use client'

import { useState, useCallback } from 'react'
import { calculateUnemploymentBenefit, type UnemploymentBenefitResult } from '@/lib/calculators'
import { formatKRW } from '@/lib/salary'
import { TAX_YEAR, MIN_HOURLY_WAGE_2026 } from '@/lib/constants'
import { InputCard, ResultHighlight, BreakdownCard, Disclaimer } from '@/components/calculator/CalcCard'
import RelatedCalculators from '@/components/calculator/RelatedCalculators'
import AdSlot from '@/components/ui/AdSlot'

function formatNum(v: string) {
  const n = v.replace(/[^0-9]/g, '')
  if (!n) return ''
  return Number(n).toLocaleString('ko-KR')
}
function parseNum(v: string) { return Number(v.replace(/[^0-9]/g, '')) || 0 }

// 2026년 실업급여 상·하한 (calculators.ts와 동일 로직)
const MIN_DAILY_BENEFIT = Math.floor(MIN_HOURLY_WAGE_2026 * 8 * 0.8)  // 66,048원
const MAX_DAILY_BENEFIT = Math.max(66_000, MIN_DAILY_BENEFIT)           // 66,048원

const RELATED = [
  { href: '/severance-pay-calculator', emoji: '📦', label: '퇴직금 계산기', description: '퇴직금 산출' },
  { href: '/social-insurance-calculator', emoji: '🏥', label: '4대보험 계산기', description: '고용보험 포함 4대보험' },
  { href: '/salary-calculator', emoji: '💰', label: '실수령액 계산기', description: '재직 중 실수령액 계산' },
]

export default function UnemploymentBenefitCalculatorPage() {
  const [dailyWage, setDailyWage]               = useState('')
  const [monthlyWage, setMonthlyWage]           = useState('')
  const [useMonthly, setUseMonthly]             = useState(true)
  const [employmentMonths, setEmploymentMonths] = useState('')
  const [age, setAge]                           = useState('40')
  const [result, setResult]                     = useState<UnemploymentBenefitResult | null>(null)

  const computedDailyWage = useMonthly
    ? Math.floor(parseNum(monthlyWage) / 30)
    : parseNum(dailyWage)

  const handleCalc = useCallback(() => {
    const dw = computedDailyWage
    const em = parseNum(employmentMonths)
    const a  = Number(age) || 40
    if (!dw || !em) return
    setResult(calculateUnemploymentBenefit({ dailyWage: dw, employmentMonths: em, age: a }))
  }, [computedDailyWage, employmentMonths, age])

  const isValid = computedDailyWage > 0 && parseNum(employmentMonths) > 0

  return (
    <main className="flex-1 max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">실업급여 계산기</h1>
      <p className="text-gray-500 mb-6">
        {TAX_YEAR}년 기준 · 최저시급 {MIN_HOURLY_WAGE_2026.toLocaleString()}원 적용
      </p>

      <AdSlot slotId="TOP_HORIZONTAL" format="horizontal" />

      <div className="mt-6 space-y-6">
        <InputCard title="고용 정보 입력">
          {/* 임금 입력 방식 선택 */}
          <div>
            <label className="label">임금 입력 방식</label>
            <div className="flex gap-2">
              {[
                { value: true,  label: '월평균임금으로 입력' },
                { value: false, label: '1일 평균임금 직접 입력' },
              ].map((opt) => (
                <button
                  key={String(opt.value)} type="button"
                  onClick={() => setUseMonthly(opt.value)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    useMonthly === opt.value
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {useMonthly ? (
            <div>
              <label className="label">퇴직 전 월평균임금 <span className="text-red-400">*</span></label>
              <div className="relative">
                <input
                  type="text" inputMode="numeric"
                  placeholder="예: 3,000,000"
                  value={monthlyWage}
                  onChange={(e) => setMonthlyWage(formatNum(e.target.value))}
                  className="input-field pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">원</span>
              </div>
              {parseNum(monthlyWage) > 0 && (
                <p className="hint text-brand-600">
                  계산된 1일 평균임금: {formatKRW(Math.floor(parseNum(monthlyWage) / 30))}
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="label">1일 평균임금 <span className="text-red-400">*</span></label>
              <div className="relative">
                <input
                  type="text" inputMode="numeric"
                  placeholder="예: 100,000"
                  value={dailyWage}
                  onChange={(e) => setDailyWage(formatNum(e.target.value))}
                  className="input-field pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">원</span>
              </div>
            </div>
          )}

          <div>
            <label className="label">고용보험 가입 기간 <span className="text-red-400">*</span></label>
            <div className="relative">
              <input
                type="text" inputMode="numeric"
                placeholder="예: 24"
                value={employmentMonths}
                onChange={(e) => setEmploymentMonths(formatNum(e.target.value))}
                className="input-field pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">개월</span>
            </div>
            <p className="hint">
              이직 전 18개월 내 피보험단위기간 180일(약 6개월) 이상 필요
              {parseNum(employmentMonths) > 0 && (
                <span className={parseNum(employmentMonths) >= 6 ? ' text-emerald-600 font-semibold' : ' text-red-500 font-semibold'}>
                  {' '}· {parseNum(employmentMonths) >= 6 ? '✓ 수급 요건 충족' : '✗ 수급 요건 미충족 (6개월 미만)'}
                </span>
              )}
            </p>
          </div>

          <div>
            <label className="label">나이</label>
            <div className="flex flex-wrap gap-2">
              {['30', '40', '50', '55'].map((a) => (
                <button
                  key={a} type="button"
                  onClick={() => setAge(a)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    age === a
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
                  }`}
                >
                  {a}대
                </button>
              ))}
            </div>
            <p className="hint">50세 이상은 수급 일수가 더 길게 산정됩니다</p>
          </div>

          <button
            type="button" onClick={handleCalc} disabled={!isValid}
            className="btn-primary w-full py-3.5 text-base"
          >
            실업급여 계산하기
          </button>
        </InputCard>

        {result && (
          <div className="space-y-4 animate-slide-up">
            {result.isEligible ? (
              <ResultHighlight
                label="총 예상 실업급여"
                value={formatKRW(result.totalBenefit)}
                subtitle={`1일 ${formatKRW(result.dailyBenefit)} × ${result.totalDays}일`}
                color="#0369a1"
              />
            ) : (
              <div className="card p-6 bg-red-50 border-red-100">
                <p className="text-base font-bold text-red-700 mb-1">수급 요건 미충족</p>
                <p className="text-sm text-red-600">
                  고용보험 가입 기간 {parseNum(employmentMonths)}개월 → 최소 6개월(180일) 이상 필요합니다.
                </p>
              </div>
            )}

            {result.isEligible && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="card p-4">
                    <p className="text-xs font-semibold text-slate-400 mb-1">1일 실업급여</p>
                    <p className="text-xl font-bold text-slate-900 tabular-nums">
                      {formatKRW(result.dailyBenefit)}
                    </p>
                  </div>
                  <div className="card p-4">
                    <p className="text-xs font-semibold text-slate-400 mb-1">수급 일수</p>
                    <p className="text-xl font-bold text-slate-900 tabular-nums">{result.totalDays}일</p>
                  </div>
                </div>

                <BreakdownCard
                  title="계산 내역"
                  items={[
                    { label: '1일 평균임금', value: formatKRW(computedDailyWage) },
                    { label: '1일 실업급여 (평균임금 × 60%)', value: formatKRW(result.dailyBenefit) },
                    {
                      label: `하한 ${formatKRW(result.minDailyBenefit)} (최저시급 ${MIN_HOURLY_WAGE_2026.toLocaleString()}원×8h×80%)`,
                      value: '',
                    },
                    {
                      label: `상한 ${formatKRW(result.maxDailyBenefit)} (고용노동부 고시 기준)`,
                      value: '',
                    },
                    { label: '수급 일수', value: `${result.totalDays}일` },
                    {
                      label: '총 예상 실업급여',
                      value: formatKRW(result.totalBenefit),
                      highlight: true,
                      color: 'text-brand-700',
                    },
                  ]}
                />
              </>
            )}

            <div className="card p-5 bg-sky-50 border-sky-100">
              <h3 className="text-sm font-bold text-sky-800 mb-2">
                {TAX_YEAR}년 실업급여 상·하한액
              </h3>
              <ul className="text-xs text-sky-700 space-y-1 leading-relaxed">
                <li>
                  • 하한액: <strong>{formatKRW(MIN_DAILY_BENEFIT)}/일</strong>
                  {' '}(최저시급 {MIN_HOURLY_WAGE_2026.toLocaleString()}원 × 8시간 × 80%)
                </li>
                <li>
                  • 상한액: <strong>{formatKRW(MAX_DAILY_BENEFIT)}/일</strong>
                  {' '}(고용노동부 고시 기준)
                </li>
                <li>• 1일 실업급여 = 1일 평균임금 × 60% (상·하한 범위 내 적용)</li>
              </ul>
            </div>

            <div className="card p-5 bg-amber-50 border-amber-100">
              <h3 className="text-sm font-bold text-amber-800 mb-2">실업급여 수급 요건</h3>
              <ul className="text-xs text-amber-700 space-y-1 leading-relaxed">
                <li>• 이직일 이전 18개월 내 피보험단위기간 180일 이상</li>
                <li>• 비자발적 이직 (권고사직, 계약만료, 폐업 등)</li>
                <li>• 재취업 의사 및 능력이 있고 구직활동 중일 것</li>
                <li>• 이직 후 12개월 이내 신청 필요</li>
                <li>• 자발적 퇴직의 경우 일부 예외 인정 (임금체불, 직장 내 괴롭힘 등)</li>
              </ul>
            </div>

            <Disclaimer
              year={TAX_YEAR}
              extra="수급 일수·금액은 고용보험 가입 이력·이직 사유 등에 따라 실제와 다를 수 있습니다. 정확한 내용은 고용복지+센터에 문의하세요."
            />
          </div>
        )}

        <RelatedCalculators items={RELATED} />

        <AdSlot slotId="BOTTOM_HORIZONTAL" format="horizontal" />
      </div>
    </main>
  )
}
