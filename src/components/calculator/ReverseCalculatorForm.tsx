// src/components/calculator/ReverseCalculatorForm.tsx
// 목표 실수령액 → 필요 연봉 역산 계산기 폼.
// 순방향 CalculatorForm의 입력 계약·디자인 시스템을 그대로 재사용하고,
// 결과 상세는 동일한 ResultCard로 렌더한다. (입력 방향만 뒤집음)

'use client'

import Link from 'next/link'
import { useState, useCallback } from 'react'
import { formatKRW } from '@/lib/salary'
import { calculateReverseSalary, type ReverseSalaryResult } from '@/lib/reverseSalary'
import ResultCard from './ResultCard'

function formatNumberInput(value: string): string {
  const num = value.replace(/[^0-9]/g, '')
  if (!num) return ''
  return Number(num).toLocaleString('ko-KR')
}

function parseNumberInput(value: string): number {
  return Number(value.replace(/[^0-9]/g, '')) || 0
}

const MIN_TARGET = 500_000 // 월 50만원
// HI_BOUND(연 5억)에서 가장 보수적 입력(비과세0·부양1·자녀0)의 월 실수령이
// 약 24,358,406원이므로, 그 이하인 2,400만원을 상한으로 두면 어떤 입력 조합에서도
// 도달 가능하다. (검색 상한을 키워 선형 스캔 횟수를 늘리지 않기 위한 정합 상한)
const MAX_TARGET = 24_000_000 // 월 2,400만원

export default function ReverseCalculatorForm() {
  const [targetNet, setTargetNet] = useState('')
  const [nonTaxable, setNonTaxable] = useState('')
  const [dependents, setDependents] = useState('1')
  const [children, setChildren] = useState('0')
  const [reverse, setReverse] = useState<ReverseSalaryResult | null>(null)
  const [hasCalculated, setHasCalculated] = useState(false)

  const dependentsNum = Number(dependents) || 1
  // 자녀 수는 본인을 제외한 부양가족 수(부양가족 - 1) 이하로 제한
  const maxChildren = Math.max(0, dependentsNum - 1)

  const selectDependents = (n: number) => {
    setDependents(String(n))
    // 부양가족이 줄면 자녀 수를 상한에 맞춰 클램프
    setChildren((prev) => String(Math.min(Number(prev) || 0, Math.max(0, n - 1))))
  }

  const targetNum = parseNumberInput(targetNet)
  const nonTaxableNum = parseNumberInput(nonTaxable)
  const isValid = targetNum >= MIN_TARGET && targetNum <= MAX_TARGET

  const handleCalculate = useCallback(() => {
    if (targetNum < MIN_TARGET || targetNum > MAX_TARGET) return
    setReverse(
      calculateReverseSalary({
        targetMonthlyNet: targetNum,
        nonTaxable: nonTaxableNum,
        dependents: Math.max(1, Number(dependents) || 1),
        childCount8to20: Math.min(Number(children) || 0, Math.max(0, (Number(dependents) || 1) - 1)),
      }),
    )
    setHasCalculated(true)
  }, [targetNum, nonTaxableNum, dependents, children])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCalculate()
  }

  const handleReset = () => {
    setTargetNet('')
    setNonTaxable('')
    setDependents('1')
    setChildren('0')
    setReverse(null)
    setHasCalculated(false)
  }

  return (
    <div className="space-y-6">
      {/* 입력 카드 */}
      <div className="card p-6 space-y-5">
        <h2 className="text-base font-bold text-slate-800">목표 실수령액 입력</h2>

        {/* 목표 월 실수령 */}
        <div>
          <label htmlFor="targetNet" className="label">
            목표 월 실수령액 <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              id="targetNet"
              type="text"
              inputMode="numeric"
              placeholder="예: 3,000,000"
              value={targetNet}
              onChange={(e) => setTargetNet(formatNumberInput(e.target.value))}
              onKeyDown={handleKeyDown}
              className="input-field pr-8"
              autoComplete="off"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
              원/월
            </span>
          </div>
          <p className="hint">받고 싶은 세후 월급을 입력하세요 (월 50만원 ~ 2,400만원)</p>
        </div>

        {/* 월 비과세 금액 */}
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
                onClick={() => selectDependents(n)}
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
          <p className="hint">본인 포함 인원으로 국세청 근로소득 간이세액표를 조회합니다</p>
        </div>

        {/* 8~20세 자녀 수 (자녀세액공제) — 순방향 입력 계약과 동일 */}
        <div>
          <label className="label">
            8~20세 자녀 수{' '}
            <span className="text-xs font-normal text-slate-400">(선택)</span>
          </label>
          <div className="flex items-center gap-2">
            {Array.from({ length: maxChildren + 1 }, (_, i) => i).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setChildren(String(n))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150 ${
                  children === String(n)
                    ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600'
                }`}
              >
                {n}명
              </button>
            ))}
          </div>
          <p className="hint">
            부양가족 중 8세 이상 20세 이하 자녀 수 — 자녀세액공제로 소득세가 낮아집니다
            {maxChildren === 0 && ' (부양가족을 2명 이상으로 설정하면 입력 가능)'}
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={handleCalculate}
            disabled={!isValid}
            className="btn-primary flex-1 py-3.5 text-base"
          >
            필요 연봉 역산하기
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

      {/* 결과 */}
      {reverse && (
        <div className="animate-slide-up space-y-4">
          {/* 필요 연봉 하이라이트 */}
          <div
            className="rounded-2xl p-6 text-white"
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              boxShadow: '0 10px 24px -4px rgb(14 165 233 / 0.25)',
            }}
          >
            <p className="text-sky-200 text-xs font-semibold uppercase tracking-widest mb-1">
              필요한 연봉 (최소)
            </p>
            <p className="text-4xl sm:text-5xl font-black tracking-tight tabular-nums leading-none">
              {formatKRW(reverse.requiredAnnualSalary)}
            </p>
            <div className="mt-4 pt-4 border-t border-white/20 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-sky-100">
              <span>월 세전 {formatKRW(reverse.result.monthlyGross)}</span>
              <span className="hidden sm:inline w-px h-3 bg-sky-400/60" />
              <span>예상 월 실수령 {formatKRW(reverse.result.monthlyNet)}</span>
            </div>
          </div>

          {reverse.reachable ? (
            <div className="card p-5 text-sm leading-6 text-slate-600">
              목표 월 실수령 {formatKRW(targetNum)}을 받으려면 세전 연봉이 최소{' '}
              <strong className="text-slate-900">
                {formatKRW(reverse.requiredAnnualSalary)}
              </strong>{' '}
              필요합니다. 이 연봉의 실제 예상 월 실수령은{' '}
              <strong className="text-slate-900">
                {formatKRW(reverse.result.monthlyNet)}
              </strong>
              으로, 목표보다{' '}
              <strong className="text-emerald-600">
                {formatKRW(reverse.surplusMonthlyNet)}
              </strong>{' '}
              여유가 있습니다. (목표를 충족하는 최소 연봉을 만원 단위에서 찾았으며,
              표시된 모든 금액은 이 연봉을 다시 계산한 값입니다.)
            </div>
          ) : (
            <div className="card p-5 text-sm leading-6 text-amber-700 bg-amber-50 border-amber-200">
              입력하신 목표 실수령액은 이 계산기의 지원 범위를 벗어납니다. 목표 금액을
              다시 확인해 주세요.
            </div>
          )}

          {/* 순방향과 동일한 상세 결과 카드 재사용 */}
          <ResultCard
            result={reverse.result}
            annualSalary={reverse.requiredAnnualSalary}
          />

          {/* 보너스: +100만원 시 실수령 증가액 (엔진 계산값) */}
          {reverse.reachable && (
            <div className="card p-5">
              <h3 className="text-sm font-bold text-slate-700">
                이 연봉에서 100만원 더 받으면 실수령은?
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                필요 연봉 {formatKRW(reverse.requiredAnnualSalary)}에서 세전 연봉을
                100만원 더 올리면 월 실수령은{' '}
                <strong className="text-slate-900">
                  {formatKRW(reverse.marginalMonthlyNet)}
                </strong>
                , 연으로는{' '}
                <strong className="text-slate-900">
                  {formatKRW(reverse.marginalAnnualNet)}
                </strong>{' '}
                늘어납니다. 세전 인상분 100만원 중 실제 남는 비율은 약{' '}
                <strong className="text-slate-900">
                  {reverse.marginalRetentionRate}%
                </strong>
                이며, 나머지는 4대보험과 세금으로 공제됩니다.
              </p>
            </div>
          )}

          {/* 보조 링크: 가까운 연봉 구간 상세 */}
          {reverse.reachable && (
            <Link
              href={`/salary/${reverse.nearestSalaryPageMan}`}
              className="block rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
            >
              비슷한 연봉 구간 자세히 보기 — 연봉{' '}
              {reverse.nearestSalaryPageMan.toLocaleString()}만원 →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
