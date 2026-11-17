'use client'

/**
 * src/app/wage-converter/page.tsx
 * 시급·월급·연봉 세전 환산 + 사용자가 확인한 조건에 한정한 최저임금 비교.
 * 근거와 지원·보류 조건: docs/wage-converter.md
 */
import { useCallback, useState } from 'react'
import { useCalculationResult } from '@/hooks/useCalculationResult'
import { formatAmountInput, parseAmountInput } from '@/lib/amountInput'
import { formatKRW } from '@/lib/salary'
import {
  calculateWageConversion,
  type AnnualComposition,
  type CompareChoice,
  type HoursMode,
  type WageBasis,
  type WageConverterResult,
  type WorkerProfile,
} from '@/lib/wageConverter'
import {
  MINIMUM_WAGE_COMPARISON_YEARS,
  MINIMUM_WAGE_HELD_YEARS,
  STANDARD_MONTHLY_HOURS,
  STANDARD_WEEKLY_PAID_HOLIDAY_HOURS,
  STANDARD_WEEKLY_WORK_HOURS,
} from '@/lib/policy/minimumWageComparison'
import { InputCard, ResultHighlight, BreakdownCard } from '@/components/calculator/CalcCard'
import CalculationNotice from '@/components/calculator/CalculationNotice'
import RelatedCalculators from '@/components/calculator/RelatedCalculators'

const RELATED = [
  { href: '/weekly-holiday-pay-calculator', emoji: '📅', label: '주휴수당 계산기', description: '주 소정근로시간과 시급으로 주휴수당 계산' },
  { href: '/salary-calculator', emoji: '💰', label: '실수령액 계산기', description: '세전 연봉에서 4대보험·소득세를 뺀 월 실수령액' },
  { href: '/salary-table', emoji: '📋', label: '연봉 실수령액 표', description: '연봉별 월 실수령액 참고표' },
]

const BASIS_OPTIONS: readonly (readonly [Exclude<WageBasis, ''>, string])[] = [
  ['hourly', '시급'], ['monthly', '월급'], ['annual', '연봉'],
]
const BASIS_LABEL: Record<Exclude<WageBasis, ''>, string> = { hourly: '시급', monthly: '월급', annual: '연봉' }
const YEAR_OPTIONS = [...MINIMUM_WAGE_COMPARISON_YEARS, ...MINIMUM_WAGE_HELD_YEARS]

const toggleClass = (selected: boolean) =>
  `rounded-xl border px-4 py-2.5 text-sm font-semibold text-left transition-colors ${selected
    ? 'bg-brand-700 border-brand-600 text-white'
    : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-800'}`

export default function WageConverterPage() {
  const [basis, setBasis] = useState<WageBasis>('')
  const [amount, setAmount] = useState('')
  const [annualComposition, setAnnualComposition] = useState<AnnualComposition>('')
  const [hoursMode, setHoursMode] = useState<HoursMode>('')
  const [customHours, setCustomHours] = useState('')
  const [compare, setCompare] = useState<CompareChoice>('')
  const [compareYear, setCompareYear] = useState<number | null>(null)
  const [profile, setProfile] = useState<WorkerProfile>('')
  const [includedAmount, setIncludedAmount] = useState('')

  const calculationInputs = { basis, amount, annualComposition, hoursMode, customHours, compare, compareYear, profile, includedAmount }
  const { result, setResult, isStale } =
    useCalculationResult<WageConverterResult, typeof calculationInputs>(calculationInputs)

  const handleCalc = useCallback(() => {
    setResult(calculateWageConversion({
      basis, amount: parseAmountInput(amount), annualComposition, hoursMode, customHours,
      compare, compareYear, profile, includedAmount: parseAmountInput(includedAmount),
    }))
  }, [basis, amount, annualComposition, hoursMode, customHours, compare, compareYear, profile, includedAmount, setResult])

  const includedLabel = basis === 'hourly' ? '최저임금에 산입되는 시급' : '최저임금에 산입되는 월 임금'
  const conversion = result?.conversion
  const comparison = result?.comparison

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">시급·월급·연봉 환산 계산기</h1>
      <p className="text-gray-500 mb-6">세전 금액 환산 · 최저임금 비교는 확인한 조건에 한해 제공</p>

      <div className="mt-6 space-y-6">
        <InputCard title="1. 환산할 급여">
          <fieldset>
            <legend className="label">입력할 금액의 기준 <span className="text-red-400">*</span></legend>
            <div className="flex flex-wrap gap-2">
              {BASIS_OPTIONS.map(([value, label]) => (
                <button key={value} type="button" aria-pressed={basis === value}
                  onClick={() => setBasis(value)} className={toggleClass(basis === value)}>
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="wageAmount" className="label">세전 금액 <span className="text-red-400">*</span></label>
            <div className="relative">
              <input id="wageAmount" type="text" inputMode="numeric" placeholder="예: 2,500,000"
                value={amount} onChange={(e) => setAmount(formatAmountInput(e.target.value))}
                onKeyDown={(e) => e.key === 'Enter' && handleCalc()} className="input-field pr-8" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">원</span>
            </div>
            <p className="hint">세금과 4대보험을 빼기 전 금액입니다. 실수령액이 아닙니다.</p>
          </div>

          {basis === 'annual' && (
            <fieldset aria-describedby="annual-composition-hint">
              <legend className="label">연봉 구성 <span className="text-red-400">*</span></legend>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button type="button" aria-pressed={annualComposition === 'equal12'}
                  onClick={() => setAnnualComposition('equal12')} className={toggleClass(annualComposition === 'equal12')}>
                  매월 같은 금액으로 12번 받음
                </button>
                <button type="button" aria-pressed={annualComposition === 'mixed'}
                  onClick={() => setAnnualComposition('mixed')} className={toggleClass(annualComposition === 'mixed')}>
                  상여금·성과급·퇴직금 포함 또는 모름
                </button>
              </div>
              <p id="annual-composition-hint" className="hint">월급과 연봉은 같은 월 정기급여를 12개월 받는 조건에서만 서로 환산합니다.</p>
            </fieldset>
          )}

          <fieldset aria-describedby="hours-mode-hint">
            <legend className="label">월 기준시간 <span className="text-red-400">*</span></legend>
            <div className="flex flex-col gap-2">
              <button type="button" aria-pressed={hoursMode === 'standard'}
                onClick={() => setHoursMode('standard')} className={toggleClass(hoursMode === 'standard')}>
                주 {STANDARD_WEEKLY_WORK_HOURS}시간 근무 · 유급 주휴 {STANDARD_WEEKLY_PAID_HOLIDAY_HOURS}시간 (월 {STANDARD_MONTHLY_HOURS}시간)
              </button>
              <button type="button" aria-pressed={hoursMode === 'custom'}
                onClick={() => setHoursMode('custom')} className={toggleClass(hoursMode === 'custom')}>
                월 기준시간 직접 입력
              </button>
              <button type="button" aria-pressed={hoursMode === 'none'}
                onClick={() => setHoursMode('none')} className={toggleClass(hoursMode === 'none')}>
                시급 환산 안 함 (월급 ↔ 연봉만)
              </button>
            </div>
            <p id="hours-mode-hint" className="hint">
              월 기준시간은 한 달 소정근로시간에 유급 주휴시간을 더한 시간입니다. 월 {STANDARD_MONTHLY_HOURS}시간은
              주 {STANDARD_WEEKLY_WORK_HOURS}시간 근무에 유급 주휴 {STANDARD_WEEKLY_PAID_HOLIDAY_HOURS}시간을 더한 조건에서 고용노동부가 최저임금 월 환산액에 쓰는 기준입니다.
              근무조건이 다르면 근로계약서나 급여명세서의 시간을 직접 입력하세요.
            </p>
          </fieldset>

          {hoursMode === 'custom' && (
            <div>
              <label htmlFor="monthlyHours" className="label">월 기준시간 (유급 주휴시간 포함) <span className="text-red-400">*</span></label>
              <div className="relative">
                <input id="monthlyHours" type="text" inputMode="decimal" placeholder="예: 174"
                  value={customHours} onChange={(e) => setCustomHours(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCalc()} className="input-field pr-12" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">시간</span>
              </div>
              <p className="hint">주휴시간을 이미 포함한 시간을 넣으세요. 여기에 주휴시간을 다시 더하지 않습니다. 소수는 둘째 자리까지 입력할 수 있습니다.</p>
            </div>
          )}
        </InputCard>

        <InputCard title="2. 최저임금 비교">
          <fieldset>
            <legend className="label">최저임금과 비교 <span className="text-red-400">*</span></legend>
            <div className="flex flex-wrap gap-2">
              <button type="button" aria-pressed={compare === 'yes'} onClick={() => setCompare('yes')} className={toggleClass(compare === 'yes')}>비교함</button>
              <button type="button" aria-pressed={compare === 'no'} onClick={() => setCompare('no')} className={toggleClass(compare === 'no')}>비교 안 함</button>
            </div>
            <p className="hint">비교 결과는 아래에서 직접 확인해 입력한 조건에 따른 참고값이며, 법 위반 여부를 판단하지 않습니다.</p>
          </fieldset>

          {compare === 'yes' && (
            <>
              <fieldset>
                <legend className="label">적용 연도 <span className="text-red-400">*</span></legend>
                <div className="flex flex-wrap gap-2">
                  {YEAR_OPTIONS.map((year) => (
                    <button key={year} type="button" aria-pressed={compareYear === year}
                      onClick={() => setCompareYear(year)} className={toggleClass(compareYear === year)}>
                      {year}년
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset aria-describedby="profile-hint">
                <legend className="label">근무 조건 확인 <span className="text-red-400">*</span></legend>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button type="button" aria-pressed={profile === 'ordinary'} onClick={() => setProfile('ordinary')} className={toggleClass(profile === 'ordinary')}>
                    일반 근로자 · 근무시간 고정
                  </button>
                  <button type="button" aria-pressed={profile === 'special'} onClick={() => setProfile('special')} className={toggleClass(profile === 'special')}>
                    해당 조건이 있거나 모름
                  </button>
                </div>
                <p id="profile-hint" className="hint">수습 기간 감액, 최저임금 적용 제외 인가, 주마다 달라지는 근무시간, 도급제 임금에 해당하면 비교를 보류합니다.</p>
              </fieldset>

              <div>
                <label htmlFor="includedAmount" className="label">{includedLabel} <span className="text-red-400">*</span></label>
                <div className="relative">
                  <input id="includedAmount" type="text" inputMode="numeric" placeholder="예: 2,300,000"
                    value={includedAmount} onChange={(e) => setIncludedAmount(formatAmountInput(e.target.value))}
                    onKeyDown={(e) => e.key === 'Enter' && handleCalc()} className="input-field pr-8" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">원</span>
                </div>
                <p className="hint">
                  위에 입력한 급여 전체를 자동으로 쓰지 않습니다. 매월 정기적으로 받는 임금 중 최저임금에 산입되는 금액만 직접 확인해 입력하세요.
                  연장·야간·휴일근로 수당처럼 소정근로 외에 받는 임금은 넣지 않습니다. 어떤 항목이 산입되는지 모르면 비워 두세요.
                </p>
              </div>
            </>
          )}

          <button type="button" onClick={handleCalc} className="btn-primary w-full py-3.5 text-base">
            환산하기
          </button>
        </InputCard>

        <CalculationNotice isStale={isStale} />

        {conversion && (
          <section aria-label="세전 환산 결과" className="space-y-4 animate-slide-up">
            {conversion.status === 'held' ? (
              <div role="status" className="card p-5 bg-amber-50 text-amber-900">
                <p className="font-semibold">환산 보류</p>
                <p className="mt-1 text-sm">{conversion.reason}</p>
              </div>
            ) : (
              <>
                <ResultHighlight
                  label="세전 환산액"
                  value={conversion.basis === 'monthly' ? `연봉 ${formatKRW(conversion.annual)}` : `월급 ${formatKRW(conversion.monthly)}`}
                  subtitle={`입력: 세전 ${BASIS_LABEL[conversion.basis]} ${formatKRW(conversion.amount)}`}
                />
                <BreakdownCard
                  title="세전 환산 내역"
                  items={[
                    { label: '시급', value: conversion.hourly === null ? '환산 안 함' : formatKRW(conversion.hourly) },
                    { label: '월급', value: formatKRW(conversion.monthly) },
                    { label: '연봉', value: formatKRW(conversion.annual) },
                    { label: '적용한 월 기준시간', value: conversion.monthlyHoursText === null ? '사용 안 함' : `${conversion.monthlyHoursText}시간` },
                  ]}
                />
                <div className="card p-5 text-sm leading-relaxed text-slate-600">
                  <p className="font-semibold text-slate-800">환산식</p>
                  <ul className="mt-2 space-y-1">
                    <li>· 연봉 = 월급 × 12 (같은 월 정기급여를 12개월 받는 조건)</li>
                    {conversion.monthlyHoursText !== null && <li>· 월급 = 시급 × 월 기준시간, 시급 = 월급 ÷ 월 기준시간</li>}
                  </ul>
                  {conversion.truncated && <p className="mt-2">나누어떨어지지 않는 금액은 원 미만을 버리고 표시했습니다.</p>}
                  <p className="mt-2">세금과 4대보험을 빼기 전의 세전 금액입니다.</p>
                </div>
              </>
            )}
          </section>
        )}

        {comparison && comparison.status !== 'skipped' && (
          <section aria-label="최저임금 비교 결과" className="space-y-4">
            {comparison.status === 'held' ? (
              <div role="status" className="card p-5 bg-amber-50 text-amber-900">
                <p className="font-semibold">최저임금 비교 보류</p>
                <p className="mt-1 text-sm">{comparison.reason}</p>
              </div>
            ) : (
              <>
                <div className="card p-5">
                  <p className="text-sm font-semibold text-slate-500">{comparison.year}년 최저임금 비교</p>
                  <p className={`mt-1 text-xl font-black ${comparison.meetsMinimum ? 'text-emerald-700' : 'text-red-700'}`}>
                    {comparison.meetsMinimum ? '입력 조건상 기준 이상' : '입력 조건상 기준 미만'}
                  </p>
                </div>
                <BreakdownCard
                  title="비교 내역"
                  items={[
                    { label: `적용 최저시급 (${comparison.year}년)`, value: formatKRW(comparison.minimumHourly) },
                    { label: comparison.includedUnit === 'hourly' ? '입력한 산입 대상 시급' : '입력한 산입 대상 월 임금', value: formatKRW(comparison.includedAmount) },
                    { label: '비교 시급', value: formatKRW(comparison.comparedHourly) },
                    {
                      label: comparison.meetsMinimum ? '최저시급보다 높은 금액 (시간당)' : '최저시급보다 낮은 금액 (시간당)',
                      value: comparison.gapUnderOneWon ? '1원 미만' : formatKRW(comparison.hourlyGap),
                      highlight: true,
                    },
                  ]}
                />
                <p className="hint">
                  직접 입력한 산입 대상 금액과 월 기준시간으로 비교한 참고값입니다. 실제 판단은 임금 항목별 산입 여부와 근로시간에 따라 달라지므로
                  고용노동부 고객상담센터(1350)나 관할 고용노동청에서 확인하세요.
                </p>
              </>
            )}
          </section>
        )}

        <RelatedCalculators items={RELATED} />

        <section aria-labelledby="wage-converter-notes" className="text-sm leading-relaxed text-slate-600">
          <h2 id="wage-converter-notes" className="text-base font-bold text-slate-900">이 계산기가 다루는 범위</h2>
          <ul className="mt-3 space-y-1.5">
            <li>· 환산은 고정된 근무조건과 정기적인 세전 급여를 기준으로 합니다.</li>
            <li>· 상여금·성과급·퇴직금이 포함됐거나 구성을 모르는 연봉은 환산하지 않습니다.</li>
            <li>· 최저임금 비교는 일반 근로자의 고정 근무조건만 지원하며, 수습 감액·적용 제외·변동 근무는 보류합니다.</li>
            <li>· 주휴수당을 받을 수 있는지(주 15시간 이상 근무와 개근 여부)는 이 계산기가 판단하지 않습니다.</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
