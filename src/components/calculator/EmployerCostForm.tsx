// src/components/calculator/EmployerCostForm.tsx
// 기업 총 인건비 입력 폼.
//
// ⚠️ 산재보험료율은 기본값을 두지 않고 입력을 강제한다. 입력 전에는 계산하지 않는다.
//    근거: docs/employer-cost-policy.md C-3

'use client'

import { useState, useCallback } from 'react'
import { calculateEmployerCost, type EmployerCostResult } from '@/lib/employerCost'
import {
  EMPLOYER_EMPLOYMENT_RATES,
  DEFAULT_EMPLOYER_EMPLOYMENT_RATE,
  sanitizeIndustrialAccidentRateInput,
  parseIndustrialAccidentRatePercent,
} from '@/lib/policy/socialInsurance'
import { formatKRW } from '@/lib/salary'

const MAX_SALARY = 10_000_000_000
const MAX_NON_TAXABLE = 100_000_000

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
function formatRate(r: number | null, digits = 1) {
  return r === null || !Number.isFinite(r) ? '—' : `${(r * 100).toFixed(digits)}%`
}

export default function EmployerCostForm() {
  const [annualSalary, setAnnualSalary] = useState('')
  const [nonTaxable, setNonTaxable] = useState('')
  const [dependents, setDependents] = useState('1')
  const [children, setChildren] = useState('0')
  const [employmentRate, setEmploymentRate] = useState(String(DEFAULT_EMPLOYER_EMPLOYMENT_RATE))
  const [industrialRate, setIndustrialRate] = useState('')
  const [result, setResult] = useState<EmployerCostResult | null>(null)

  const salaryNum = parseAmount(annualSalary, MAX_SALARY)
  const ratePercent = parseIndustrialAccidentRatePercent(industrialRate)
  const hasIndustrialRate = industrialRate.trim() !== '' && ratePercent !== null
  const isValid = salaryNum >= 1_000_000 && hasIndustrialRate

  const handleCalc = useCallback(() => {
    const s = parseAmount(annualSalary, MAX_SALARY)
    const rp = parseIndustrialAccidentRatePercent(industrialRate)
    if (s < 1_000_000 || industrialRate.trim() === '' || rp === null) return
    const dep = Math.max(1, Number(dependents) || 1)
    setResult(
      calculateEmployerCost({
        annualSalary: s,
        nonTaxable: parseAmount(nonTaxable, MAX_NON_TAXABLE),
        dependents: dep,
        childCount8to20: Math.min(Number(children) || 0, Math.max(0, dep - 1)),
        employerEmploymentRate: Number(employmentRate) || DEFAULT_EMPLOYER_EMPLOYMENT_RATE,
        industrialAccidentRate: rp / 100,
      }),
    )
  }, [annualSalary, nonTaxable, dependents, children, employmentRate, industrialRate])

  return (
    <div className="space-y-6">
      <div className="card p-6 space-y-5">
        <h2 className="text-base font-bold text-slate-800">인건비 정보 입력</h2>

        <div>
          <label htmlFor="annualSalary" className="label">계약 연봉 <span className="text-red-400">*</span></label>
          <div className="relative">
            <input id="annualSalary" type="text" inputMode="numeric" autoComplete="off"
              placeholder="예: 48,000,000" value={annualSalary}
              onChange={(e) => setAnnualSalary(formatAmount(e.target.value, MAX_SALARY))}
              onKeyDown={(e) => e.key === 'Enter' && handleCalc()}
              className="input-field pr-8" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">원</span>
          </div>
          <p className="hint">근로계약서상 세전 연봉 (최소 100만원)</p>
        </div>

        <div>
          <label htmlFor="nonTaxable" className="label">
            월 비과세 금액 <span className="text-xs font-normal text-slate-400">(선택)</span>
          </label>
          <div className="relative">
            <input id="nonTaxable" type="text" inputMode="numeric" autoComplete="off"
              placeholder="예: 200,000" value={nonTaxable}
              onChange={(e) => setNonTaxable(formatAmount(e.target.value, MAX_NON_TAXABLE))}
              onKeyDown={(e) => e.key === 'Enter' && handleCalc()}
              className="input-field pr-12" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">원/월</span>
          </div>
          <p className="hint">식대 등 — 4대보험·소득세 산정에서 제외됩니다</p>
        </div>

        <div>
          <label htmlFor="employmentRate" className="label">사업장 규모 (사업주 고용보험료율)</label>
          <select id="employmentRate" value={employmentRate}
            onChange={(e) => { setEmploymentRate(e.target.value); setResult(null) }}
            className="input-field">
            {EMPLOYER_EMPLOYMENT_RATES.map((o) => (
              <option key={o.rate} value={o.rate}>{o.label} · {o.rateLabel}</option>
            ))}
          </select>
          <p className="hint">
            실업급여 0.9%의 절반과 고용안정·직업능력개발사업 요율을 합한 값입니다.
            고용안정·직업능력개발분은 사업주가 전액 부담합니다
          </p>
        </div>

        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
          <label htmlFor="industrialRate" className="label">
            산재보험료율 <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input id="industrialRate" type="text" inputMode="decimal" autoComplete="off"
              placeholder="예: 0.7"
              value={industrialRate}
              onChange={(e) => {
                setIndustrialRate(sanitizeIndustrialAccidentRateInput(e.target.value))
                setResult(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleCalc()}
              className="input-field pr-8" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">%</span>
          </div>
          <p className="mt-2 text-xs text-amber-800">
            <strong>업종별로 최대 20배까지 차이가 납니다.</strong> 임의로 평균값을 넣으면
            총 인건비가 크게 틀어지므로 기본값을 두지 않았습니다. 사업장의 실제 요율을
            입력하세요. 요율은{' '}
            <a href="https://total.comwel.or.kr" target="_blank" rel="noopener noreferrer"
              className="underline font-semibold">근로복지공단 고용·산재보험 토탈서비스</a>
            에서 확인할 수 있습니다.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
          <p className="text-sm font-semibold text-slate-700">소득세 계산 조건</p>
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

        <button type="button" onClick={handleCalc} disabled={!isValid}
          className="btn-primary w-full py-3.5 text-base">
          총 인건비 계산하기
        </button>
        {salaryNum >= 1_000_000 && !hasIndustrialRate && (
          <p className="hint text-amber-700">
            산재보험료율을 입력해야 총 인건비를 계산할 수 있습니다.
          </p>
        )}
      </div>

      {result && <EmployerCostResultView r={result} />}
    </div>
  )
}

function EmployerCostResultView({ r }: { r: EmployerCostResult }) {
  return (
    <div className="space-y-4 animate-slide-up">
      {/* ③ 회사가 쓰는 돈 */}
      <div className="card p-6 bg-slate-800 text-white">
        <p className="text-sm opacity-80">③ 회사가 쓰는 돈 · 월 총 인건비</p>
        <p className="text-3xl font-bold mt-1">{formatKRW(r.monthlyTotalCost)}</p>
        <p className="text-sm opacity-80 mt-2">
          연 {formatKRW(r.annualTotalCost)} · 계약 연봉의 {formatRate(r.costMultiplier, 1)}
        </p>
        <p className="mt-3 text-xs opacity-70">
          계약 연봉에 <strong>추가로</strong> 회사가 부담하는 금액이 포함된 값입니다.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="text-xs text-slate-500">① 근로자가 받는 돈 · 월 실수령액</p>
          <p className="text-2xl font-bold text-brand-700 mt-1">{formatKRW(r.monthlyNet)}</p>
          <p className="text-xs text-slate-500 mt-1">연 {formatKRW(r.annualNet)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-slate-500">② 계약상 급여 · 월 세전</p>
          <p className="text-2xl font-bold text-slate-700 mt-1">{formatKRW(r.monthlyGross)}</p>
          <p className="text-xs text-slate-500 mt-1">연 {formatKRW(r.annualGross)}</p>
        </div>
      </div>

      {/* 근로자 부담 */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-slate-800">근로자 부담 공제 (월)</h3>
        <p className="mt-1 text-xs text-amber-700">
          근로자가 부담하는 공제액입니다. <strong>회사 비용이 아닙니다.</strong>
          ② 계약상 급여에서 빠져 ① 실수령액이 됩니다.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {[
                ['국민연금', r.employeeDeduction.nationalPension],
                ['건강보험', r.employeeDeduction.healthInsurance],
                ['장기요양보험', r.employeeDeduction.longTermCare],
                ['고용보험', r.employeeDeduction.employment],
                ['소득세', r.employeeDeduction.incomeTax],
                ['지방소득세', r.employeeDeduction.localTax],
              ].map(([label, value]) => (
                <tr key={label as string} className="border-b">
                  <td className="py-2 text-slate-600">{label}</td>
                  <td className="py-2 text-right">{formatKRW(value as number)}</td>
                </tr>
              ))}
              <tr className="font-semibold text-slate-900">
                <td className="py-2">근로자 부담 합계</td>
                <td className="py-2 text-right">{formatKRW(r.employeeDeduction.totalDeduction)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 사업주 부담 */}
      <div className="card p-5 border-slate-300">
        <h3 className="text-sm font-bold text-slate-800">사업주 부담분 (월)</h3>
        <p className="mt-1 text-xs text-slate-600">
          계약 연봉에 <strong>추가로</strong> 회사가 부담하는 금액입니다. 근로자 공제액과
          금액이 다릅니다.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b">
                <td className="py-2 text-slate-600">국민연금</td>
                <td className="py-2 text-right">{formatKRW(r.employerBurden.nationalPension)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-slate-600">건강보험</td>
                <td className="py-2 text-right">{formatKRW(r.employerBurden.healthInsurance)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-slate-600">장기요양보험</td>
                <td className="py-2 text-right">{formatKRW(r.employerBurden.longTermCare)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-slate-600">
                  고용보험
                  <span className="ml-1 text-[11px] text-slate-400">고용안정·직업능력개발 포함</span>
                </td>
                <td className="py-2 text-right">{formatKRW(r.employerBurden.employment)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-slate-600">
                  산재보험
                  <span className="ml-1 text-[11px] text-slate-400">
                    {(r.industrialAccidentRate * 100).toFixed(2)}% · 사업주 전액
                  </span>
                </td>
                <td className="py-2 text-right">{formatKRW(r.employerBurden.industrialAccident)}</td>
              </tr>
              <tr className="font-semibold text-slate-900">
                <td className="py-2">사업주 부담 합계</td>
                <td className="py-2 text-right">{formatKRW(r.employerBurden.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          계약 연봉 대비 {formatRate(r.employerBurdenRate, 2)}를 회사가 추가로 부담합니다.
          총 인건비 중 근로자가 실제로 받는 비율은 {formatRate(r.netToCostRate, 1)}입니다.
        </p>
      </div>

      <div className="card p-4 bg-slate-50">
        <p className="text-xs text-slate-600">
          퇴직급여 충당, 4대보험 외 복리후생비, 채용·교육비는 포함하지 않았습니다.
          두루누리 등 보험료 지원금, 장애인 고용부담금, 임금채권보장기금 부담금도
          반영하지 않았습니다.
        </p>
      </div>
    </div>
  )
}
