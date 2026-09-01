// src/components/calculator/CalculatorForm.tsx
// 변경사항:
//   1. 비과세 입력 라벨: "월 비과세" 명시 (이미 월 단위임을 강조)
//   2. 계산 summary 패널 추가 (입력값 요약 표시)
//   3. 부양가족 선택 5명+ 처리 개선

'use client'

import { useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { calculateSalary, formatKRW, type SalaryInput, type SalaryResult } from '@/lib/salary'
import ResultCard from './ResultCard'
import { resolvePrefill, PREFILL_FALLBACK } from '@/lib/homeData'

function formatNumberInput(value: string): string {
  const num = value.replace(/[^0-9]/g, '')
  if (!num) return ''
  return Number(num).toLocaleString('ko-KR')
}

function parseNumberInput(value: string): number {
  return Number(value.replace(/[^0-9]/g, '')) || 0
}

/**
 * 홈의 연봉별 실수령액 표에서 넘어온 조건을 읽는다.
 *
 * ⚠️ 연봉만 채우면 비과세·부양가족이 폼 기본값으로 남아 홈에서 본 숫자와 달라진다.
 *    표의 전제 전체를 함께 받아야 결과가 일치한다.
 * ⚠️ effect가 아니라 초기 상태로 읽는다. effect에서 setState하면 렌더가 한 번 더 돈다.
 *    값 검증은 resolvePrefill()이 담당한다 (테스트 대상).
 */
function usePrefill() {
  const searchParams = useSearchParams()
  return resolvePrefill((key) => searchParams.get(key))
}

export default function CalculatorForm() {
  const prefill = usePrefill()
  const [annualSalary, setAnnualSalary] = useState(prefill?.annualSalary ?? PREFILL_FALLBACK.annualSalary)
  const [nonTaxable, setNonTaxable] = useState(prefill?.nonTaxable ?? PREFILL_FALLBACK.nonTaxable)
  const [dependents, setDependents] = useState(prefill?.dependents ?? PREFILL_FALLBACK.dependents)
  const [children, setChildren] = useState(prefill?.children ?? PREFILL_FALLBACK.children)
  const [result, setResult] = useState<SalaryResult | null>(null)
  const [hasCalculated, setHasCalculated] = useState(false)

  const handleCalculate = useCallback(() => {
    const salary = parseNumberInput(annualSalary)
    if (!salary || salary < 1_000_000) return

    const input: SalaryInput = {
      annualSalary: salary,
      // nonTaxable 은 월 단위 금액 그대로 전달 (salary.ts 내부에서 ÷12 하지 않음)
      nonTaxable: parseNumberInput(nonTaxable),
      dependents: Math.max(1, Number(dependents) || 1),
      childCount8to20: Math.min(Number(children) || 0, Math.max(0, (Number(dependents) || 1) - 1)),
    }

    setResult(calculateSalary(input))
    setHasCalculated(true)
  }, [annualSalary, nonTaxable, dependents, children])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCalculate()
  }

  const handleReset = () => {
    setAnnualSalary('')
    setNonTaxable('')
    setDependents('1')
    setChildren('0')
    setResult(null)
    setHasCalculated(false)
  }

  const salaryNum     = parseNumberInput(annualSalary)
  const nonTaxableNum = parseNumberInput(nonTaxable)
  const isValid       = salaryNum >= 1_000_000

  return (
    <div className="space-y-6">
      {/* 입력 카드 */}
      <div className="card p-6 space-y-5">
        <h2 className="text-base font-bold text-slate-800">급여 정보 입력</h2>

        {/* 연봉 */}
        <div>
          <label htmlFor="annualSalary" className="label">
            연봉 <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              id="annualSalary"
              type="text"
              inputMode="numeric"
              placeholder="예: 40,000,000"
              value={annualSalary}
              onChange={(e) => setAnnualSalary(formatNumberInput(e.target.value))}
              onKeyDown={handleKeyDown}
              className="input-field pr-8"
              autoComplete="off"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
              원
            </span>
          </div>
          <p className="hint">세전 연봉을 입력하세요 (최소 100만원)</p>
        </div>

        {/* 월 비과세 금액 — 라벨에 "월" 강조 */}
        <div>
          <label htmlFor="nonTaxable" className="label">
            월 비과세 금액{' '}
            <span className="text-xs font-normal text-slate-400">(선택)</span>
          </label>
          <div className="relative">
            <input
              id="nonTaxable"
              type="text"
              inputMode="numeric"
              placeholder="예: 200,000"
              value={nonTaxable}
              onChange={(e) => setNonTaxable(formatNumberInput(e.target.value))}
              onKeyDown={handleKeyDown}
              className="input-field pr-8"
              autoComplete="off"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
              원/월
            </span>
          </div>
          <p className="hint">
            식대 등 월 비과세 금액 — 4대보험·소득세 산정에서 제외됩니다
          </p>
        </div>

        {/* 공제대상가족 수 */}
        <div>
          <label className="label">공제대상가족 수 (본인 포함)</label>
          <div className="flex flex-wrap items-center gap-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setDependents(String(n))
                  setChildren((current) => String(Math.min(Number(current) || 0, n - 1)))
                }}
                className={`flex-1 min-w-12 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150 ${
                  dependents === String(n)
                    ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600'
                }`}
              >
                {n}명
              </button>
            ))}
          </div>
          <p className="hint">본인 포함 인원으로 국세청 근로소득 간이세액표를 조회합니다</p>
        </div>

        <div>
          <label className="label">공제대상가족 중 8세 이상 20세 이하 자녀 수</label>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: Math.max(1, Number(dependents) || 1) }, (_, i) => i).map((n) => (
              <button key={n} type="button" onClick={() => setChildren(String(n))}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold border ${children === String(n) ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-slate-200 text-slate-600'}`}>
                {n}명
              </button>
            ))}
          </div>
          <p className="hint">배우자·부모 등은 가족 수에만 포함하고, 여기에는 해당 연령의 자녀만 입력하세요</p>
        </div>

        {/* 입력값 요약 (계산 전 미리보기) */}
        {isValid && (
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-600 mb-1.5">입력 요약</p>
            <div className="flex justify-between">
              <span>연봉</span>
              <span className="font-medium text-slate-700">{formatKRW(salaryNum)}</span>
            </div>
            <div className="flex justify-between">
              <span>월 세전</span>
              <span className="font-medium text-slate-700">
                {formatKRW(Math.floor(salaryNum / 12))}
              </span>
            </div>
            {nonTaxableNum > 0 && (
              <div className="flex justify-between">
                <span>월 비과세</span>
                <span className="font-medium text-emerald-600">
                  -{formatKRW(nonTaxableNum)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>부양가족</span>
              <span className="font-medium text-slate-700">{dependents}명</span>
            </div>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={handleCalculate}
            disabled={!isValid}
            className="btn-primary flex-1 py-3.5 text-base"
          >
            실수령액 계산하기
          </button>
          {hasCalculated && (
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* 결과 카드 */}
      {result && (
        <div className="animate-slide-up">
          <ResultCard result={result} annualSalary={salaryNum} />
        </div>
      )}
    </div>
  )
}
