/**
 * src/app/salary/[amount]/page.tsx
 * 연봉별 실수령액 정적 페이지
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { calculateSalary, formatKRW } from '@/lib/salary'
import { SITE_NAME, TAX_YEAR } from '@/lib/constants'

export async function generateStaticParams() {
  const list = []
  for (let i = 2000; i <= 15000; i += 500) {
    list.push({ amount: String(i) })
  }
  return list
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ amount: string }>
}): Promise<Metadata> {
  const { amount } = await params
  const parsed = parseInt(amount, 10)
  if (isNaN(parsed)) return {}
  return {
    title: `연봉 ${parsed}만원 실수령액 ${TAX_YEAR} | ${SITE_NAME}`,
    description: `연봉 ${parsed}만원 월 실수령액 및 4대보험·소득세 공제 내역. ${TAX_YEAR}년 기준.`,
  }
}

export default async function SalaryDetailPage({
  params,
}: {
  params: Promise<{ amount: string }>
}) {
  const { amount } = await params
  const parsed = parseInt(amount, 10)

  if (isNaN(parsed)) {
    return <div className="p-10">잘못된 접근입니다.</div>
  }

  const annual = parsed * 10_000

  const result = calculateSalary({
    annualSalary: annual,
    nonTaxable: 0,
    dependents: 1,
  })

  const deductionRate = ((result.annualDeduction / annual) * 100).toFixed(1)

  const breakdownRows = [
    { label: '국민연금 (4.75%)', value: formatKRW(result.breakdown.nationalPension) },
    { label: '건강보험 (3.595%)', value: formatKRW(result.breakdown.healthInsurance) },
    { label: '장기요양 (건보료×12.95%)', value: formatKRW(result.breakdown.longTermCare) },
    { label: '고용보험 (0.9%)', value: formatKRW(result.breakdown.employment) },
    { label: '소득세', value: formatKRW(result.breakdown.incomeTax) },
    { label: '지방소득세', value: formatKRW(result.breakdown.localTax) },
  ]

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <nav className="text-sm text-slate-400 mb-6">
        <Link href="/" className="hover:text-brand-600 transition-colors">홈</Link>
        <span className="mx-2">›</span>
        <Link href="/salary-calculator" className="hover:text-brand-600 transition-colors">실수령액 계산기</Link>
        <span className="mx-2">›</span>
        <span className="text-slate-600">연봉 {parsed}만원</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold mb-2">
        연봉 {parsed.toLocaleString()}만원 실수령액
      </h1>
      <p className="text-slate-500 mb-6">{TAX_YEAR}년 기준 · 부양가족 1명(본인) · 비과세 없음</p>

      {/* 메인 결과 */}
      <div
        className="rounded-2xl p-6 text-white mb-6"
        style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}
      >
        <p className="text-sky-200 text-xs font-semibold uppercase tracking-widest mb-1">월 실수령액</p>
        <p className="text-4xl sm:text-5xl font-black tracking-tight tabular-nums leading-none">
          {formatKRW(result.monthlyNet)}
        </p>
        <div className="mt-4 pt-4 border-t border-white/20 flex flex-wrap gap-x-4 gap-y-1 text-sm text-sky-100">
          <span>월 세전 {formatKRW(result.monthlyGross)}</span>
          <span>실효세율 {deductionRate}%</span>
          <span>월 공제 {formatKRW(result.breakdown.totalDeduction)}</span>
        </div>
      </div>

      {/* 연간 요약 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card p-4">
          <p className="text-xs font-semibold text-slate-400 mb-1">연 실수령액</p>
          <p className="text-xl font-bold text-slate-900 tabular-nums">{formatKRW(result.annualNet)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-slate-400 mb-1">연 총 공제액</p>
          <p className="text-xl font-bold text-red-500 tabular-nums">-{formatKRW(result.annualDeduction)}</p>
        </div>
      </div>

      {/* 월 공제 내역 */}
      <div className="card p-5 mb-6">
        <h2 className="text-sm font-bold text-slate-700 mb-4">월 공제 내역</h2>
        <ul className="space-y-2.5">
          {breakdownRows.map((row) => (
            <li key={row.label} className="flex items-center justify-between">
              <span className="text-sm text-slate-600">{row.label}</span>
              <span className="text-sm font-bold text-slate-700 tabular-nums">{row.value}</span>
            </li>
          ))}
          <li className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-sm font-bold text-slate-800">월 합계</span>
            <span className="text-sm font-bold text-red-500 tabular-nums">
              -{formatKRW(result.breakdown.totalDeduction)}
            </span>
          </li>
        </ul>
      </div>

      {/* 설명 */}
      <section className="card p-5 mb-6 space-y-3">
        <h2 className="text-base font-bold text-slate-800">연봉 {parsed}만원 실수령액 안내</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          연봉 {parsed.toLocaleString()}만원 기준 월 실수령액은 <strong>{formatKRW(result.monthlyNet)}</strong>입니다.
          국민연금, 건강보험, 장기요양보험, 고용보험과 소득세·지방소득세를 합산한 월 공제액은{' '}
          {formatKRW(result.breakdown.totalDeduction)}로, 실효 공제율은 {deductionRate}%입니다.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          비과세 식대(월 20만원)를 적용하면 실수령액이 더 높아집니다.
          부양가족 추가 시 소득세 기본공제가 적용되어 세금이 줄어듭니다.
          정확한 금액은 아래 계산기에서 직접 확인하세요.
        </p>
        <p className="text-xs text-slate-400">
          * 본 계산 결과는 {TAX_YEAR}년 기준 근사값으로, 실제 급여와 다를 수 있습니다.
        </p>
      </section>

      {/* CTA */}
      <div className="rounded-2xl border bg-brand-50 p-5 mb-8">
        <p className="text-sm font-semibold text-brand-800 mb-3">
          비과세, 부양가족 등 조건을 반영한 정확한 계산이 필요하신가요?
        </p>
        <Link
          href="/salary-calculator"
          className="inline-flex rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          실수령액 계산기로 직접 계산하기 →
        </Link>
      </div>

      {/* 다른 연봉 */}
      <div className="border-t pt-6">
        <h2 className="text-base font-bold mb-3 text-slate-800">다른 연봉 실수령액</h2>
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Array.from({ length: 20 }, (_, i) => {
            const val = 2000 + i * 500
            return (
              <li key={val}>
                <Link
                  href={`/salary/${val}`}
                  className={`text-sm transition-colors ${
                    val === parsed ? 'font-bold text-brand-700' : 'text-brand-600 hover:underline'
                  }`}
                >
                  연봉 {val}만원
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="mt-6">
        <Link href="/salary-calculator" className="text-sm text-brand-600 hover:underline">
          ← 실수령액 계산기로 돌아가기
        </Link>
      </div>
    </main>
  )
}
