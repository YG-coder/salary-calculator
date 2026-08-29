// src/components/calculator/BonusForm.tsx
// 상여금 원천징수 입력 폼.
// ⚠️ 4대보험 전체를 계산하지 않는다. 근거: docs/bonus-tax-policy.md P5

'use client'

import { useState, useCallback } from 'react'
import {
  calculateBonusWithholding,
  type BonusWithholdingResult,
} from '@/lib/bonusWithholding'
import {
  MAX_BONUS_AMOUNT, MAX_MONTHLY_PAY, MAX_PREPAID_TAX,
  MAX_BONUS_PERIOD_MONTHS, MIN_BONUS_PERIOD_MONTHS,
  type BonusPeriodType,
} from '@/lib/policy/bonus'
import { formatKRW } from '@/lib/salary'

function formatAmount(v: string, max: number): string {
  const digits = v.replace(/[^0-9]/g, '')
  if (!digits) return ''
  const n = Number(digits)
  if (!Number.isFinite(n)) return String(max)
  return Math.min(n, max).toLocaleString('ko-KR')
}
function parseAmount(v: string, max: number): number {
  const n = Number(v.replace(/[^0-9]/g, ''))
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.min(n, max)
}
function formatRate(r: number | null) {
  return r === null || !Number.isFinite(r) ? '—' : `${(r * 100).toFixed(1)}%`
}

const PERIOD_OPTIONS: { value: BonusPeriodType; label: string; hint: string }[] = [
  {
    value: 'withPeriod',
    label: '지급대상기간 있음',
    hint: '"상반기 실적 상여"처럼 대상 기간이 정해져 있고, 그 기간의 마지막 달에 받는 경우',
  },
  {
    value: 'withoutPeriod',
    label: '지급대상기간 없음',
    hint: '명절 상여처럼 대상 기간이 없거나, 대상 기간의 마지막 달이 아닌 달에 받는 경우',
  },
]

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

export default function BonusForm() {
  const [bonus, setBonus] = useState('')
  const [monthlyPay, setMonthlyPay] = useState('')
  const [periodType, setPeriodType] = useState<BonusPeriodType>('withPeriod')
  const [periodMonths, setPeriodMonths] = useState('6')
  const [paymentMonth, setPaymentMonth] = useState('6')
  const [hasPrevBonus, setHasPrevBonus] = useState(false)
  const [prevBonusMonth, setPrevBonusMonth] = useState('3')
  const [dependents, setDependents] = useState('1')
  const [children, setChildren] = useState('0')
  const [usePrepaidInput, setUsePrepaidInput] = useState(false)
  const [prepaidTax, setPrepaidTax] = useState('')
  const [result, setResult] = useState<BonusWithholdingResult | null>(null)
  const [submittedBonus, setSubmittedBonus] = useState(0)

  const bonusNum = parseAmount(bonus, MAX_BONUS_AMOUNT)
  const payNum = parseAmount(monthlyPay, MAX_MONTHLY_PAY)
  const isValid = bonusNum > 0
  const paymentMonthNum = Number(paymentMonth) || 1
  const previousMonthOptions = MONTHS.filter((month) => month < paymentMonthNum)

  const handleCalc = useCallback(() => {
    const b = parseAmount(bonus, MAX_BONUS_AMOUNT)
    if (b <= 0) return
    const dep = Math.max(1, Number(dependents) || 1)
    setResult(
      calculateBonusWithholding({
        bonusAmount: b,
        monthlyPay: parseAmount(monthlyPay, MAX_MONTHLY_PAY),
        periodType,
        periodMonths: Number(periodMonths) || MIN_BONUS_PERIOD_MONTHS,
        paymentMonth: Number(paymentMonth) || 1,
        previousBonusMonth:
          hasPrevBonus && Number(prevBonusMonth) < (Number(paymentMonth) || 1)
            ? Number(prevBonusMonth) || undefined
            : undefined,
        dependents: dep,
        childCount8to20: Math.min(Number(children) || 0, Math.max(0, dep - 1)),
        prepaidTax: usePrepaidInput ? parseAmount(prepaidTax, MAX_PREPAID_TAX) : undefined,
      }),
    )
    setSubmittedBonus(b)
  }, [bonus, monthlyPay, periodType, periodMonths, paymentMonth, hasPrevBonus,
      prevBonusMonth, dependents, children, usePrepaidInput, prepaidTax])

  return (
    <div className="space-y-6">
      <div className="card p-6 space-y-5">
        <h2 className="text-base font-bold text-slate-800">상여금 정보 입력</h2>

        <div>
          <label htmlFor="bonus" className="label">상여금액 <span className="text-red-400">*</span></label>
          <div className="relative">
            <input id="bonus" type="text" inputMode="numeric" autoComplete="off"
              placeholder="예: 6,000,000" value={bonus}
              onChange={(e) => setBonus(formatAmount(e.target.value, MAX_BONUS_AMOUNT))}
              onKeyDown={(e) => e.key === 'Enter' && handleCalc()}
              className="input-field pr-8" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">원</span>
          </div>
          <p className="hint">세전 상여금액을 입력하세요</p>
        </div>

        <div>
          <label htmlFor="monthlyPay" className="label">상여 외 월평균 급여 (과세분)</label>
          <div className="relative">
            <input id="monthlyPay" type="text" inputMode="numeric" autoComplete="off"
              placeholder="예: 3,000,000" value={monthlyPay}
              onChange={(e) => setMonthlyPay(formatAmount(e.target.value, MAX_MONTHLY_PAY))}
              onKeyDown={(e) => e.key === 'Enter' && handleCalc()}
              className="input-field pr-8" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">원</span>
          </div>
          <p className="hint">
            지급대상기간의 월평균 급여에서 비과세를 뺀 금액. 법정 산식이 상여금과 합산해
            세율을 정하므로 입력해야 정확합니다
          </p>
        </div>

        <div>
          <label className="label">지급대상기간</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PERIOD_OPTIONS.map((o) => (
              <button key={o.value} type="button"
                onClick={() => { setPeriodType(o.value); setResult(null) }}
                className={`py-2.5 px-2 rounded-xl text-sm font-semibold border transition-all ${
                  periodType === o.value
                    ? 'bg-brand-600 border-brand-600 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
                }`}>
                {o.label}
              </button>
            ))}
          </div>
          <p className="hint">{PERIOD_OPTIONS.find((o) => o.value === periodType)?.hint}</p>
        </div>

        {periodType === 'withPeriod' ? (
          <div>
            <label htmlFor="periodMonths" className="label">지급대상기간 월수</label>
            <select id="periodMonths" value={periodMonths}
              onChange={(e) => { setPeriodMonths(e.target.value); setResult(null) }}
              className="input-field">
              {MONTHS.map((m) => <option key={m} value={m}>{m}개월</option>)}
            </select>
            <p className="hint">
              1년을 넘으면 {MAX_BONUS_PERIOD_MONTHS}개월로, 1개월 미만 끝수는 1개월로 봅니다
              (소득세법 제136조 제1항 제3호)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="paymentMonth" className="label">상여 지급월</label>
              <select id="paymentMonth" value={paymentMonth}
                onChange={(e) => {
                  const next = Number(e.target.value)
                  setPaymentMonth(e.target.value)
                  if (next <= 1) setHasPrevBonus(false)
                  if (Number(prevBonusMonth) >= next) setPrevBonusMonth(String(Math.max(1, next - 1)))
                  setResult(null)
                }}
                className="input-field">
                {MONTHS.map((m) => <option key={m} value={m}>{m}월</option>)}
              </select>
              <p className="hint">그 해 1월 1일부터 지급월까지를 지급대상기간으로 봅니다</p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={hasPrevBonus} disabled={paymentMonthNum <= 1}
                  onChange={(e) => { setHasPrevBonus(e.target.checked); setResult(null) }}
                  className="h-4 w-4 rounded border-slate-300" />
                올해 이미 받은 상여가 있습니다
              </label>
              {hasPrevBonus && (
                <div className="mt-2">
                  <select value={prevBonusMonth}
                    onChange={(e) => { setPrevBonusMonth(e.target.value); setResult(null) }}
                    className="input-field">
                    {previousMonthOptions.map((m) => (
                      <option key={m} value={m}>직전 상여 {m}월 수령</option>
                    ))}
                  </select>
                  <p className="hint">
                    직전 상여 지급월의 다음 달부터 이번 지급월까지가 지급대상기간이 됩니다
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
          <p className="text-sm font-semibold text-slate-700">공제 조건</p>
          <div>
            <label className="label">공제대상가족 수 (본인 포함)</label>
            <div className="flex flex-wrap items-center gap-2">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button"
                  onClick={() => {
                    setDependents(String(n))
                    setChildren((c) => String(Math.min(Number(c) || 0, n - 1)))
                    setResult(null)
                  }}
                  className={`flex-1 min-w-12 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    dependents === String(n)
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
                  }`}>{n}명</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">그중 8~20세 자녀 수 <span className="text-xs font-normal text-slate-400">(선택)</span></label>
            <div className="flex flex-wrap items-center gap-2">
              {Array.from({ length: Math.max(1, Number(dependents) || 1) }, (_, i) => i).map((n) => (
                <button key={n} type="button"
                  onClick={() => { setChildren(String(n)); setResult(null) }}
                  className={`flex-1 min-w-12 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    children === String(n)
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
                  }`}>{n}명</button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={usePrepaidInput}
              onChange={(e) => { setUsePrepaidInput(e.target.checked); setResult(null) }}
              className="h-4 w-4 rounded border-slate-300" />
            기납부세액을 직접 입력합니다
          </label>
          <p className="hint">
            체크하지 않으면 월평균 급여 기준으로 <strong>추정</strong>합니다. 급여명세서의
            실제 원천징수 소득세 합계를 넣으면 더 정확합니다
          </p>
          {usePrepaidInput && (
            <div className="relative mt-2">
              <input type="text" inputMode="numeric" autoComplete="off"
                placeholder="지급대상기간 소득세 합계" value={prepaidTax}
                onChange={(e) => setPrepaidTax(formatAmount(e.target.value, MAX_PREPAID_TAX))}
                className="input-field pr-8" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">원</span>
            </div>
          )}
        </div>

        <button type="button" onClick={handleCalc} disabled={!isValid}
          className="btn-primary w-full py-3.5 text-base">
          상여금 원천징수 계산하기
        </button>
        {bonusNum > 0 && payNum === 0 && (
          <p className="hint text-amber-600">
            상여 외 월평균 급여를 입력하지 않으면 상여금만으로 세율이 정해져 실제보다
            낮게 계산됩니다.
          </p>
        )}
      </div>

      {result && <BonusResult r={result} bonus={submittedBonus} />}
    </div>
  )
}

function BonusResult({ r, bonus }: { r: BonusWithholdingResult; bonus: number }) {
  return (
    <div className="space-y-4 animate-slide-up">
      <div className="card p-6 bg-brand-600 text-white">
        <p className="text-sm opacity-90">{r.additionalAmountDue > 0 ? '상여금에서 지급 가능한 금액' : '실수령 상여금'}</p>
        <p className="text-3xl font-bold mt-1">{formatKRW(r.netBonus)}</p>
        <p className="text-sm opacity-90 mt-2">
          세전 {formatKRW(bonus)} · 총 공제 {formatKRW(r.totalDeduction)}
          {r.effectiveDeductionRate !== null && <> ({formatRate(r.effectiveDeductionRate)})</>}
        </p>
        {r.additionalAmountDue > 0 && (
          <p className="mt-2 text-sm font-semibold">
            공제액이 상여금을 {formatKRW(r.additionalAmountDue)} 초과합니다. 회사 급여 담당자에게
            추가 납부·다른 급여 공제 방식을 확인하세요.
          </p>
        )}
      </div>

      <div className="card p-4 bg-amber-50 border-amber-200">
        <p className="text-sm text-amber-800">
          <strong>국민연금·건강보험·장기요양보험은 이 달에 늘지 않습니다.</strong>
        </p>
        <p className="mt-1 text-sm text-amber-800">
          국민연금은 미리 정해진 기준소득월액으로 부과되고(국민연금법 제3조), 건강보험은
          보수월액 기준으로 부과한 뒤 나중에 정산합니다(국민건강보험법 제70조). 그래서
          상여금을 받아도 그달 공제액이 상여금에 비례해 늘지 않습니다.
          <strong> 4대보험 중 고용보험만</strong> 지급한 보수에 비례해 부과됩니다.
        </p>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-3">공제 내역</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b">
                <td className="py-2 text-slate-600">소득세</td>
                <td className="py-2 text-right">{formatKRW(r.incomeTax)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-slate-600">지방소득세 (소득세의 10%)</td>
                <td className="py-2 text-right">{formatKRW(r.localTax)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-slate-600">고용보험</td>
                <td className="py-2 text-right">{formatKRW(r.employmentInsurance)}</td>
              </tr>
              <tr className="font-semibold text-slate-900">
                <td className="py-2">총 공제</td>
                <td className="py-2 text-right">{formatKRW(r.totalDeduction)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-5 bg-sky-50 border-sky-100">
        <h3 className="text-sm font-bold text-sky-800 mb-3">계산 과정 (소득세법 제136조)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-sky-800">
            <tbody>
              <tr className="border-b border-sky-200">
                <td className="py-1.5">지급대상기간</td>
                <td className="py-1.5 text-right">{r.periodMonths}개월</td>
              </tr>
              <tr className="border-b border-sky-200">
                <td className="py-1.5">월환산액 (상여금÷월수 + 월평균 급여)</td>
                <td className="py-1.5 text-right">{formatKRW(r.monthlyConverted)}</td>
              </tr>
              <tr className="border-b border-sky-200">
                <td className="py-1.5">간이세액표 월 세액</td>
                <td className="py-1.5 text-right">{formatKRW(r.monthlyTaxOnConverted)}</td>
              </tr>
              <tr className="border-b border-sky-200">
                <td className="py-1.5">× {r.periodMonths}개월</td>
                <td className="py-1.5 text-right">{formatKRW(r.grossTaxForPeriod)}</td>
              </tr>
              <tr className="border-b border-sky-200">
                <td className="py-1.5">
                  − 기납부세액
                  {r.prepaidTaxEstimated && <span className="ml-1 text-[11px] text-amber-700">추정치</span>}
                </td>
                <td className="py-1.5 text-right">− {formatKRW(r.prepaidTax)}</td>
              </tr>
              <tr className="font-bold text-sky-900">
                <td className="py-1.5">= 상여금 소득세</td>
                <td className="py-1.5 text-right">{formatKRW(r.incomeTax)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-sky-700">기간 산정: {r.periodBasis}</p>
        {r.prepaidTaxEstimated && (
          <p className="mt-1 text-[11px] text-amber-700">
            기납부세액은 매월 급여가 일정했다고 가정한 추정치입니다. 급여명세서의 실제
            소득세 합계를 입력하면 더 정확합니다.
          </p>
        )}
      </div>
    </div>
  )
}
