// src/components/calculator/ComparisonForm.tsx
// 연봉 A / B 비교 입력 폼.
// 연봉만 A·B로 나누고 비과세·공제대상가족·자녀는 공통 조건으로 받는다.

'use client'

import { useState, useCallback } from 'react'
import {
  compareSalaries,
  formatRate,
  formatSignedKRW,
  type SalaryComparisonResult,
} from '@/lib/salaryComparison'
import { formatKRW } from '@/lib/salary'

const MIN_SALARY = 1_000_000
/** 입력 길이 가드 — 표시값과 계산값이 어긋나지 않도록 상한을 둔다 (법정 기준 아님) */
const MAX_SALARY = 10_000_000_000
const MAX_NON_TAXABLE = 100_000_000

function formatNumberInput(value: string, max: number): string {
  const digits = value.replace(/[^0-9]/g, '')
  if (!digits) return ''
  const n = Number(digits)
  if (!Number.isFinite(n)) return String(max)
  return Math.min(n, max).toLocaleString('ko-KR')
}
function parseNumberInput(value: string, max: number): number {
  const n = Number(value.replace(/[^0-9]/g, ''))
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.min(n, max)
}

export default function ComparisonForm() {
  const [salaryA, setSalaryA] = useState('')
  const [salaryB, setSalaryB] = useState('')
  const [nonTaxable, setNonTaxable] = useState('')
  const [dependents, setDependents] = useState('1')
  const [children, setChildren] = useState('0')
  const [result, setResult] = useState<SalaryComparisonResult | null>(null)

  const a = parseNumberInput(salaryA, MAX_SALARY)
  const b = parseNumberInput(salaryB, MAX_SALARY)
  const isValid = a >= MIN_SALARY && b >= MIN_SALARY

  const handleCalculate = useCallback(() => {
    const sa = parseNumberInput(salaryA, MAX_SALARY)
    const sb = parseNumberInput(salaryB, MAX_SALARY)
    if (sa < MIN_SALARY || sb < MIN_SALARY) return
    const dep = Math.max(1, Number(dependents) || 1)
    setResult(
      compareSalaries({
        annualSalaryA: sa,
        annualSalaryB: sb,
        nonTaxable: parseNumberInput(nonTaxable, MAX_NON_TAXABLE),
        dependents: dep,
        childCount8to20: Math.min(Number(children) || 0, Math.max(0, dep - 1)),
      }),
    )
  }, [salaryA, salaryB, nonTaxable, dependents, children])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCalculate()
  }

  const handleReset = () => {
    setSalaryA(''); setSalaryB(''); setNonTaxable('')
    setDependents('1'); setChildren('0'); setResult(null)
  }

  const swap = () => {
    setSalaryA(salaryB); setSalaryB(salaryA); setResult(null)
  }

  return (
    <div className="space-y-6">
      <div className="card p-6 space-y-5">
        <h2 className="text-base font-bold text-slate-800">비교할 연봉 입력</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { id: 'salaryA', label: '연봉 A', value: salaryA, set: setSalaryA, ph: '예: 50,000,000' },
            { id: 'salaryB', label: '연봉 B', value: salaryB, set: setSalaryB, ph: '예: 55,000,000' },
          ].map((f) => (
            <div key={f.id}>
              <label htmlFor={f.id} className="label">
                {f.label} <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  id={f.id} type="text" inputMode="numeric" autoComplete="off"
                  placeholder={f.ph}
                  value={f.value}
                  onChange={(e) => f.set(formatNumberInput(e.target.value, MAX_SALARY))}
                  onKeyDown={handleKeyDown}
                  className="input-field pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">원</span>
              </div>
            </div>
          ))}
        </div>
        <p className="hint">
          세전 연봉을 입력하세요 (각 최소 {MIN_SALARY.toLocaleString('ko-KR')}원).
          아래 조건은 <strong>A·B에 똑같이</strong> 적용됩니다.
        </p>

        {/* 공통 조건 */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
          <p className="text-sm font-semibold text-slate-700">공통 조건</p>

          <div>
            <label htmlFor="nonTaxable" className="label">
              월 비과세 금액 <span className="text-xs font-normal text-slate-400">(선택)</span>
            </label>
            <div className="relative">
              <input
                id="nonTaxable" type="text" inputMode="numeric" autoComplete="off"
                placeholder="예: 200,000"
                value={nonTaxable}
                onChange={(e) => setNonTaxable(formatNumberInput(e.target.value, MAX_NON_TAXABLE))}
                onKeyDown={handleKeyDown}
                className="input-field pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">원/월</span>
            </div>
            <p className="hint">식대 등 월 비과세 금액 — 4대보험·소득세 산정에서 제외됩니다</p>
          </div>

          <div>
            <label className="label">공제대상가족 수 (본인 포함)</label>
            <div className="flex flex-wrap items-center gap-2">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n} type="button"
                  onClick={() => {
                    setDependents(String(n))
                    setChildren((c) => String(Math.min(Number(c) || 0, n - 1)))
                  }}
                  className={`flex-1 min-w-12 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
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

          <div>
            <label className="label">
              그중 8~20세 자녀 수 <span className="text-xs font-normal text-slate-400">(선택)</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {Array.from({ length: Math.max(1, Number(dependents) || 1) }, (_, i) => i).map((n) => (
                <button
                  key={n} type="button"
                  onClick={() => setChildren(String(n))}
                  className={`flex-1 min-w-12 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    children === String(n)
                      ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600'
                  }`}
                >
                  {n}명
                </button>
              ))}
            </div>
            <p className="hint">자녀세액공제가 적용되어 소득세가 낮아집니다</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button" onClick={handleCalculate} disabled={!isValid}
            className="btn-primary flex-1 py-3.5 text-base"
          >
            비교하기
          </button>
          <button
            type="button" onClick={swap}
            className="px-4 py-3.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:border-brand-300"
          >
            A↔B
          </button>
          <button
            type="button" onClick={handleReset}
            className="px-4 py-3.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:border-brand-300"
          >
            초기화
          </button>
        </div>
      </div>

      {result && <ComparisonResult result={result} />}
    </div>
  )
}

function ComparisonResult({ result: r }: { result: SalaryComparisonResult }) {
  const same = r.annualGrossDiff === 0
  const higher = r.annualGrossDiff > 0 ? 'B' : 'A'

  return (
    <div className="space-y-4 animate-slide-up">
      {/* 핵심 차이 */}
      <div className="card p-6 bg-brand-600 text-white">
        <p className="text-sm opacity-90">월 실수령액 차이 (B − A)</p>
        <p className="text-3xl font-bold mt-1">{formatSignedKRW(r.monthlyNetDiff)}</p>
        <p className="text-sm opacity-90 mt-2">
          연 {formatSignedKRW(r.annualNetDiff)}
          {!same && <> · 세전 연봉 차이 {formatSignedKRW(r.annualGrossDiff)}</>}
        </p>
      </div>

      {/* 한계 실수령률 */}
      {!same && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3">한계 실수령률</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">늘어난 연봉 중 손에 남는 비율</p>
              <p className="text-2xl font-bold text-brand-700">{formatRate(r.marginalNetRate)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">공제로 빠지는 비율</p>
              <p className="text-2xl font-bold text-slate-700">{formatRate(r.marginalDeductionRate)}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            세전 연봉이 {formatKRW(Math.abs(r.annualGrossDiff))} 늘 때 실수령은{' '}
            {formatKRW(Math.abs(r.annualNetDiff))} 늘어납니다. 평균 실수령률
            (A {formatRate(r.averageNetRateA)} · B {formatRate(r.averageNetRateB)})과 다른
            값이며, <strong>추가된 연봉 구간에만</strong> 적용되는 비율입니다.
          </p>
        </div>
      )}

      {/* 비단조 구간 안내 */}
      {(r.crossesPensionCap || r.crossesHighIncomeTaxFormula) && (
        <div className="card p-4 bg-amber-50 border-amber-200">
          <p className="text-sm text-amber-800">
            <strong>이 구간은 실수령률이 단조롭게 움직이지 않습니다.</strong>
          </p>
          <ul className="mt-2 space-y-1 text-sm text-amber-800 list-disc pl-5">
            {r.crossesPensionCap && (
              <li>
                두 조건 사이에 <strong>국민연금 기준소득월액 상한</strong>이 있습니다. 상한을
                넘으면 국민연금이 더 늘지 않아, 연봉이 올라가는데도 한계 실수령률이{' '}
                <strong>오히려 높아집니다.</strong>
              </li>
            )}
            {r.crossesHighIncomeTaxFormula && (
              <li>
                두 조건 사이에 <strong>근로소득 간이세액표 조견표 상한</strong>(월 과세소득
                1천만원)이 있습니다. 이 위로는 고소득 전용 산식으로 소득세를 계산합니다.
              </li>
            )}
          </ul>
        </div>
      )}

      {/* 나란히 비교 */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-3">나란히 비교</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="py-2 font-medium">항목</th>
                <th className="py-2 font-medium text-right">A</th>
                <th className="py-2 font-medium text-right">B</th>
                <th className="py-2 font-medium text-right">차이 (B−A)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 text-slate-600">세전 연봉</td>
                <td className="py-2 text-right">{formatKRW(r.a.monthlyGross * 12)}</td>
                <td className="py-2 text-right">{formatKRW(r.b.monthlyGross * 12)}</td>
                <td className="py-2 text-right">{formatSignedKRW(r.annualGrossDiff)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-slate-600">월 세전</td>
                <td className="py-2 text-right">{formatKRW(r.a.monthlyGross)}</td>
                <td className="py-2 text-right">{formatKRW(r.b.monthlyGross)}</td>
                <td className="py-2 text-right">{formatSignedKRW(r.b.monthlyGross - r.a.monthlyGross)}</td>
              </tr>
              <tr className="border-b font-semibold text-slate-900">
                <td className="py-2">월 실수령액</td>
                <td className="py-2 text-right">{formatKRW(r.a.monthlyNet)}</td>
                <td className="py-2 text-right">{formatKRW(r.b.monthlyNet)}</td>
                <td className="py-2 text-right text-brand-700">{formatSignedKRW(r.monthlyNetDiff)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-slate-600">연 실수령액</td>
                <td className="py-2 text-right">{formatKRW(r.a.annualNet)}</td>
                <td className="py-2 text-right">{formatKRW(r.b.annualNet)}</td>
                <td className="py-2 text-right">{formatSignedKRW(r.annualNetDiff)}</td>
              </tr>
              <tr>
                <td className="py-2 text-slate-600">평균 실수령률</td>
                <td className="py-2 text-right">{formatRate(r.averageNetRateA)}</td>
                <td className="py-2 text-right">{formatRate(r.averageNetRateB)}</td>
                <td className="py-2 text-right text-slate-400">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 공제 항목별 차이 */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-3">공제 항목별 차이 (월 기준)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="py-2 font-medium">항목</th>
                <th className="py-2 font-medium text-right">A</th>
                <th className="py-2 font-medium text-right">B</th>
                <th className="py-2 font-medium text-right">월 차이</th>
                <th className="py-2 font-medium text-right">연 차이</th>
              </tr>
            </thead>
            <tbody>
              {r.deductionDeltas.map((d) => (
                <tr key={d.key} className="border-b last:border-0">
                  <td className="py-2 text-slate-600">
                    {d.label}
                    {d.key === 'nationalPension' && d.monthlyDiff === 0 && r.annualGrossDiff !== 0 && (
                      <span className="ml-1 text-[11px] text-amber-600">상한 도달</span>
                    )}
                  </td>
                  <td className="py-2 text-right">{formatKRW(d.a)}</td>
                  <td className="py-2 text-right">{formatKRW(d.b)}</td>
                  <td className="py-2 text-right">{formatSignedKRW(d.monthlyDiff)}</td>
                  <td className="py-2 text-right text-slate-500">{formatSignedKRW(d.annualDiff)}</td>
                </tr>
              ))}
              <tr className="font-semibold text-slate-900">
                <td className="py-2">총 공제</td>
                <td className="py-2 text-right">{formatKRW(r.a.breakdown.totalDeduction)}</td>
                <td className="py-2 text-right">{formatKRW(r.b.breakdown.totalDeduction)}</td>
                <td className="py-2 text-right">
                  {formatSignedKRW(r.b.breakdown.totalDeduction - r.a.breakdown.totalDeduction)}
                </td>
                <td className="py-2 text-right">{formatSignedKRW(r.annualDeductionDiff)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {!same && (
          <p className="mt-3 text-xs text-slate-500">
            연봉이 높은 쪽은 <strong>{higher}</strong>입니다. 항목별 월 차이의 합과 월 실수령
            차이를 더하면 월 세전 차이와 정확히 일치합니다.
          </p>
        )}
      </div>
    </div>
  )
}
