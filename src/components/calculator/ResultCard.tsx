// src/components/calculator/ResultCard.tsx
// 변경사항:
//   1. 고용보험 항목 추가 (breakdown.employment)
//   2. "2024년 기준" 하드코딩 제거 → TAX_YEAR 상수 사용
//   3. 결과 카드 레이아웃 개선: 3-grid (월 실수령 / 연 실수령 / 총 공제)
//   4. 공제 비율 바 시각화 개선

'use client'

import { formatKRW } from '@/lib/salary'
import { TAX_YEAR } from '@/lib/constants'
import type { SalaryResult } from '@/lib/salary'

interface Props {
  result: SalaryResult
  annualSalary: number
}

interface BreakdownRow {
  label: string
  amount: number
  color: string
  barColor: string
  description: string
}

export default function ResultCard({ result, annualSalary }: Props) {
  const { monthlyGross, monthlyNet, annualNet, annualDeduction, breakdown } = result

  const effectiveRate =
    annualSalary > 0
      ? ((annualDeduction / annualSalary) * 100).toFixed(1)
      : '0'

  const rows: BreakdownRow[] = [
    {
      label: '국민연금',
      amount: breakdown.nationalPension,
      color: 'text-violet-600',
      barColor: 'bg-violet-400',
      description: '4.5%',
    },
    {
      label: '건강보험',
      amount: breakdown.healthInsurance,
      color: 'text-blue-600',
      barColor: 'bg-blue-400',
      description: '3.545%',
    },
    {
      label: '장기요양',
      amount: breakdown.longTermCare,
      color: 'text-cyan-600',
      barColor: 'bg-cyan-400',
      description: '건보료×12.81%',
    },
    {
      label: '고용보험',
      amount: breakdown.employment,
      color: 'text-teal-600',
      barColor: 'bg-teal-400',
      description: '0.9%',
    },
    {
      label: '소득세',
      amount: breakdown.incomeTax,
      color: 'text-orange-600',
      barColor: 'bg-orange-400',
      description: '누진세율',
    },
    {
      label: '지방소득세',
      amount: breakdown.localTax,
      color: 'text-amber-600',
      barColor: 'bg-amber-400',
      description: '소득세×10%',
    },
  ]

  return (
    <div className="space-y-4">
      {/* 월 실수령액 메인 카드 */}
      <div
        className="rounded-2xl p-6 text-white"
        style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          boxShadow: '0 10px 24px -4px rgb(14 165 233 / 0.25)',
        }}
      >
        <p className="text-sky-200 text-xs font-semibold uppercase tracking-widest mb-1">
          월 실수령액
        </p>
        <p className="text-4xl sm:text-5xl font-black tracking-tight tabular-nums leading-none">
          {formatKRW(monthlyNet)}
        </p>
        <div className="mt-4 pt-4 border-t border-white/20 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-sky-100">
          <span>월 세전 {formatKRW(monthlyGross)}</span>
          <span className="hidden sm:inline w-px h-3 bg-sky-400/60" />
          <span>실효세율 {effectiveRate}%</span>
          <span className="hidden sm:inline w-px h-3 bg-sky-400/60" />
          <span>월 공제 {formatKRW(breakdown.totalDeduction)}</span>
        </div>
      </div>

      {/* 연 실수령 + 연 공제 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-xs font-semibold text-slate-400 mb-1.5">연 실수령액</p>
          <p className="text-xl font-bold text-slate-900 tabular-nums">
            {formatKRW(annualNet)}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-slate-400 mb-1.5">연 총 공제액</p>
          <p className="text-xl font-bold text-red-500 tabular-nums">
            -{formatKRW(annualDeduction)}
          </p>
        </div>
      </div>

      {/* 월 공제 내역 */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-4">월 공제 내역</h3>

        {/* 비율 바 */}
        <div className="flex h-3 rounded-full overflow-hidden mb-5 gap-[2px]">
          {rows.map((row) => {
            const pct =
              breakdown.totalDeduction > 0
                ? (row.amount / breakdown.totalDeduction) * 100
                : 0
            return (
              <div
                key={row.label}
                className={`${row.barColor} transition-all`}
                style={{ width: `${pct}%`, minWidth: pct > 0 ? '3px' : '0' }}
                title={`${row.label}: ${pct.toFixed(1)}%`}
              />
            )
          })}
        </div>

        <ul className="space-y-2.5">
          {rows.map((row) => (
            <li key={row.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${row.barColor} flex-shrink-0`}
                />
                <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                  {row.label}
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  {row.description}
                </span>
              </div>
              <span className={`text-sm font-bold tabular-nums ${row.color}`}>
                {formatKRW(row.amount)}
              </span>
            </li>
          ))}

          {/* 합계 */}
          <li className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-sm font-bold text-slate-800">월 합계</span>
            <span className="text-sm font-bold text-red-500 tabular-nums">
              -{formatKRW(breakdown.totalDeduction)}
            </span>
          </li>
        </ul>
      </div>

      {/* 면책 안내 */}
      <p className="text-xs text-slate-400 text-center px-2 leading-relaxed">
        본 계산 결과는 {TAX_YEAR}년 기준 근사값으로, 실제 급여와 다를 수 있습니다.
        정확한 내용은 담당 세무사 또는 회사 인사팀에 문의하세요.
      </p>
    </div>
  )
}
