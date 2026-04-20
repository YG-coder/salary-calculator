// src/components/calculator/CalculatorForm.tsx
// 변경사항:
//   1. 비과세 입력 라벨: "월 비과세" 명시 (이미 월 단위임을 강조)
//   2. 계산 summary 패널 추가 (입력값 요약 표시)
//   3. 부양가족 선택 5명+ 처리 개선

'use client'

import { useState, useCallback } from 'react'
import { calculateSalary, formatKRW, type SalaryInput, type SalaryResult } from '@/lib/salary'
import ResultCard from './ResultCard'

function formatNumberInput(value: string): string {
  const num = value.replace(/[^0-9]/g, '')
  if (!num) return ''
  return Number(num).toLocaleString('ko-KR')
}

function parseNumberInput(value: string): number {
  return Number(value.replace(/[^0-9]/g, '')) || 0
}

export default function CalculatorForm() {
  const [annualSalary, setAnnualSalary] = useState('')
  const [nonTaxable, setNonTaxable] = useState('')
  const [dependents, setDependents] = useState('1')
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
    }

    setResult(calculateSalary(input))
    setHasCalculated(true)
  }, [annualSalary, nonTaxable, dependents])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCalculate()
  }

  const handleReset = () => {
    setAnnualSalary('')
    setNonTaxable('')
    setDependents('1')
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

        {/* 부양가족 수 */}
        <div>
          <label className="label">부양가족 수 (본인 포함)</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
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
          <p className="hint">본인 1명 포함. 1인당 연 150만원 기본공제 적용</p>
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
