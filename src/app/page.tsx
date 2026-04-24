/**
 * src/app/page.tsx
 * 연봉계산기 허브 홈 페이지
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_NAME, TAX_YEAR } from '@/lib/constants'

export const metadata: Metadata = {
  title: `직장인 급여 계산기 모음 ${TAX_YEAR} | ${SITE_NAME}`,
  description: `실수령액, 4대보험, 퇴직금, 연차수당, 주휴수당, 실업급여까지 직장인 필수 급여 계산기 모음. ${TAX_YEAR}년 최신 기준 반영.`,
}

const CALCULATORS = [
  {
    href: '/salary-calculator',
    emoji: '💰',
    title: '실수령액 계산기',
    description: '연봉 입력만으로 4대보험·소득세 자동 계산',
    badge: '가장 많이 사용',
    highlight: true,
  },
  {
    href: '/payroll-tax-calculator',
    emoji: '🧾',
    title: '급여 세금 간편 계산',
    description: '월급에서 공제되는 세금을 빠르게 확인',
    badge: null,
    highlight: false,
  },
  {
    href: '/social-insurance-calculator',
    emoji: '🏥',
    title: '4대보험 계산기',
    description: '국민연금·건강보험·고용보험·산재보험 계산',
    badge: null,
    highlight: false,
  },
  {
    href: '/severance-pay-calculator',
    emoji: '📦',
    title: '퇴직금 계산기',
    description: '근속기간과 평균임금으로 퇴직금 산출',
    badge: null,
    highlight: false,
  },
  {
    href: '/annual-leave-pay-calculator',
    emoji: '🏖️',
    title: '연차수당 계산기',
    description: '미사용 연차 일수에 따른 수당 계산',
    badge: null,
    highlight: false,
  },
  {
    href: '/weekly-holiday-pay-calculator',
    emoji: '📅',
    title: '주휴수당 계산기',
    description: '주 15시간 이상 근무 시 주휴수당 계산',
    badge: null,
    highlight: false,
  },
  {
    href: '/unemployment-benefit-calculator',
    emoji: '🛡️',
    title: '실업급여 계산기',
    description: '퇴직 후 받을 수 있는 실업급여 예상액 확인',
    badge: null,
    highlight: false,
  },
]

export default function Home() {
  return (
    <main className="flex-1 max-w-4xl mx-auto px-4 py-10">
      {/* 히어로 섹션 */}
      <section className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3 leading-tight">
          직장인 급여 계산기 모음
        </h1>
        <p className="text-slate-500 text-base sm:text-lg">
          {TAX_YEAR}년 기준 · 실수령액부터 퇴직금까지 한 곳에서
        </p>
      </section>

      {/* 메인 CTA - 실수령액 계산기 */}
      <Link
        href="/salary-calculator"
        className="block card-elevated rounded-2xl p-6 sm:p-8 mb-6 hover:shadow-xl transition-all group"
        style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
              가장 많이 사용
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">
              💰 실수령액 계산기
            </h2>
            <p className="text-sky-200 text-sm sm:text-base">
              연봉 입력만으로 4대보험·소득세 자동 계산 → 월 실수령액 즉시 확인
            </p>
          </div>
          <span className="text-white/60 text-3xl group-hover:translate-x-1 transition-transform flex-shrink-0">
            →
          </span>
        </div>
        <div className="mt-4 pt-4 border-t border-white/20 flex flex-wrap gap-3 text-xs text-sky-200">
          <span>✓ 4대보험 자동 계산</span>
          <span>✓ 소득세·지방소득세 포함</span>
          <span>✓ 부양가족 공제 반영</span>
          <span>✓ {TAX_YEAR}년 최신 요율</span>
        </div>
      </Link>

      {/* 나머지 계산기 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CALCULATORS.filter((c) => !c.highlight).map((calc) => (
          <Link
            key={calc.href}
            href={calc.href}
            className="card p-5 hover:border-brand-200 hover:shadow-md transition-all group"
          >
            <div className="text-3xl mb-3">{calc.emoji}</div>
            <h2 className="text-base font-bold text-slate-800 group-hover:text-brand-700 transition-colors mb-1">
              {calc.title}
            </h2>
            <p className="text-xs text-slate-500">{calc.description}</p>
          </Link>
        ))}
      </div>

      {/* 연봉별 실수령액 빠른 링크 */}
      <section className="mt-12">
        <h2 className="text-lg font-bold text-slate-800 mb-3">연봉별 실수령액 바로가기</h2>
        <div className="card p-5">
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Array.from({ length: 20 }, (_, i) => {
              const val = 2000 + i * 500
              return (
                <li key={val}>
                  <Link
                    href={`/salary/${val}`}
                    className="text-sm text-brand-600 hover:text-brand-800 hover:underline"
                  >
                    연봉 {val}만원
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* 세금계산기 외부 CTA */}
      <section className="mt-8 rounded-2xl border bg-blue-50 p-6">
        <h2 className="text-base font-bold mb-1 text-slate-900">
          세금 상세 계산이 필요하신가요?
        </h2>
        <p className="text-slate-600 text-sm mb-4">
          부가세, 종합소득세, 양도세 등 더 자세한 세금 계산은 세금계산기에서 확인하세요.
        </p>
        <Link
          href="https://taxsim.kr"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          세금 계산기 바로가기 →
        </Link>
      </section>
    </main>
  )
}
