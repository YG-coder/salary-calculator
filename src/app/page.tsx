/**
 * src/app/page.tsx
 * 연봉계산기 허브 홈 페이지
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_NAME, TAX_YEAR } from '@/lib/constants'
import {
  buildSalaryQuickRows,
  buildKeyFigures,
  HOME_SALARY_ASSUMPTION_TEXT,
  buildQuickRowHref,
  SITUATION_GROUPS,
  HOME_GUIDES,
} from '@/lib/homeData'
import { ROUTES } from '@/lib/routes'

/** 히어로 아래 함께 노출할 대표 계산기 (실수령액 다음으로 많이 찾는 것) */
const FEATURED_HREFS: string[] = [
  ROUTES.SALARY_COMPARISON_CALCULATOR,
  ROUTES.SEVERANCE_PAY_CALCULATOR,
  ROUTES.ANNUAL_LEAVE_PAY_CALCULATOR,
]

/** 연봉 표기 — 표 셀과 aria-label이 같은 문자열을 쓰도록 한 곳에서 만든다 */
function quickRowLabel(annualMan: number): string {
  return annualMan >= 10_000
    ? `${(annualMan / 10_000).toLocaleString('ko-KR')}억원`
    : `${annualMan.toLocaleString('ko-KR')}만원`
}

/** 정책 최근 검토일 — 조사 문서 갱신일과 맞춘다 */
const POLICY_REVIEWED_AT = '2026년 8월 29일'

export const metadata: Metadata = {
  title: `${TAX_YEAR}년 연봉 실수령액 계산기 | ${SITE_NAME}`,
  description: `연봉을 입력하면 4대보험과 소득세를 반영한 월 실수령액을 계산합니다. ${TAX_YEAR}년 기준 연봉별 실수령액 표와 퇴직금·연차수당·상여금·기업 총 인건비 계산기를 함께 제공합니다.`,
}

export const CALCULATORS = [
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
    href: '/salary-comparison-calculator',
    emoji: '📊',
    title: '연봉 비교 계산기',
    description: '두 연봉의 실수령액·공제액 차이를 한눈에 비교',
    badge: null,
    highlight: false,
  },
  {
    href: '/bonus-withholding-calculator',
    emoji: '🎁',
    title: '상여금 원천징수 계산기',
    description: '성과급·명절상여에서 떼는 세금과 실수령액',
    badge: null,
    highlight: false,
  },
  {
    href: '/target-salary-calculator',
    emoji: '🎯',
    title: '목표 실수령액 역산 계산기',
    description: '원하는 실수령액을 받으려면 연봉이 얼마여야 하는지 역산',
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
    href: '/employer-cost-calculator',
    emoji: '🏢',
    title: '기업 총 인건비 계산기',
    description: '연봉 외에 회사가 추가로 부담하는 4대보험',
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
  const quickRows = buildSalaryQuickRows()
  const keyFigures = buildKeyFigures()
  const featured = CALCULATORS.filter((c) => FEATURED_HREFS.includes(c.href))

  return (
    <main className="flex-1 max-w-4xl mx-auto px-4 py-10">
      {/* ── 1. 히어로 ─────────────────────────────────────── */}
      <section className="mb-10">
        <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
          {TAX_YEAR}년 적용 기준
        </span>
        <h1 className="mt-3 text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
          {TAX_YEAR}년 연봉,<br className="sm:hidden" /> 월 실수령액까지 한 번에
        </h1>
        <p className="mt-3 text-slate-600 text-base sm:text-lg leading-relaxed">
          4대보험과 소득세를 반영한 예상 월급을 확인하고,<br className="hidden sm:block" />
          연봉협상·이직·퇴직에 필요한 계산기를 함께 이용하세요.
        </p>
      </section>

      {/* ── 2. 대표 계산기 ───────────────────────────────── */}
      <Link
        href="/salary-calculator"
        className="block card-elevated rounded-2xl p-6 sm:p-8 mb-4 hover:shadow-xl transition-all group"
        style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
              가장 많이 사용
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">
              💰 연봉 실수령액 계산기
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {featured.map((calc) => (
          <Link key={calc.href} href={calc.href}
            className="card p-5 hover:border-brand-200 hover:shadow-md transition-all group">
            <div className="text-2xl mb-2">{calc.emoji}</div>
            <h3 className="text-base font-bold text-slate-800 group-hover:text-brand-700 transition-colors mb-1">
              {calc.title}
            </h3>
            <p className="text-xs text-slate-500">{calc.description}</p>
          </Link>
        ))}
      </div>

      {/* ── 3. 2026년 주요 기준 ──────────────────────────── */}
      <section className="mt-12">
        <h2 className="text-xl font-black text-slate-900">{TAX_YEAR}년 주요 기준</h2>
        <p className="mt-1 text-sm text-slate-500">
          모든 계산기가 아래 기준을 적용합니다. 요율이 바뀌면 계산 결과도 함께 바뀝니다.
        </p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {keyFigures.map((f) => (
            <div key={f.label} className="card p-4">
              <p className="text-xs text-slate-500">{f.label}</p>
              <p className="mt-0.5 text-xl font-black text-slate-900 tabular-nums">{f.value}</p>
              <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">{f.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. 연봉별 실수령액 빠른 표 ───────────────────── */}
      {/* ⚠️ /salary/[amount] 페이지로 링크하지 않는다. sitemap 제외 취지를 우회하게 된다. */}
      <section className="mt-12">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-black text-slate-900">연봉별 예상 월 실수령액</h2>
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-700">
            {TAX_YEAR}년 기준
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
            예상값
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          {HOME_SALARY_ASSUMPTION_TEXT}
        </p>
        <div className="mt-4 card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-slate-500">
                <th className="py-3 px-3 sm:px-4 font-medium whitespace-nowrap">연봉</th>
                <th className="py-3 px-3 sm:px-4 font-medium text-right whitespace-nowrap">월 세전 (원)</th>
                {/* ⚠️ 모바일에서는 연봉·월세전·실수령액 3열만 보인다.
                    가장 중요한 실수령액이 화면 밖으로 밀리면 안 된다. */}
                <th className="hidden sm:table-cell py-3 px-4 font-medium text-right whitespace-nowrap">월 공제 (원)</th>
                <th className="py-3 px-3 sm:px-4 font-medium text-right whitespace-nowrap">월 실수령액 (원)</th>
                <th className="hidden sm:table-cell py-3 px-4 font-medium text-right whitespace-nowrap">실수령률</th>
              </tr>
            </thead>
            <tbody>
              {quickRows.map((r) => (
                <tr key={r.annualMan} className="border-b last:border-0 hover:bg-brand-50/40 transition-colors">
                  <td className="py-0 px-0 font-semibold text-slate-800">
                    {/* ⚠️ /salary/[amount] 가 아니라 계산기로 보낸다. 표의 전제를 함께 넘겨
                        홈에서 본 숫자와 계산기 결과가 일치하게 한다. */}
                    <Link href={buildQuickRowHref(r.annualSalary)}
                      aria-label={`연봉 ${quickRowLabel(r.annualMan)}으로 실수령액 계산하기`}
                      className="block py-3 px-3 sm:px-4 whitespace-nowrap hover:text-brand-700">
                      {quickRowLabel(r.annualMan)}
                    </Link>
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-right tabular-nums text-slate-600 whitespace-nowrap">
                    {r.monthlyGross.toLocaleString('ko-KR')}
                  </td>
                  <td className="hidden sm:table-cell py-3 px-4 text-right tabular-nums text-slate-500 whitespace-nowrap">
                    −{r.monthlyDeduction.toLocaleString('ko-KR')}
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-right tabular-nums font-bold text-brand-700 whitespace-nowrap">
                    {r.monthlyNet.toLocaleString('ko-KR')}
                  </td>
                  <td className="hidden sm:table-cell py-3 px-4 text-right tabular-nums text-slate-500 whitespace-nowrap">
                    {(r.netRate * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          연봉을 누르면 위 조건이 채워진 상태로 계산기가 열립니다.
          <span className="sm:hidden"> 월 공제액과 실수령률은 넓은 화면에서 함께 표시됩니다.</span>
        </p>
        <Link href="/salary-calculator"
          className="mt-3 inline-flex rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">
          내 연봉으로 계산하기 →
        </Link>
      </section>

      {/* ── 5. 상황별 계산기 ─────────────────────────────── */}
      <section className="mt-12">
        <h2 className="text-xl font-black text-slate-900">상황별로 찾기</h2>
        <p className="mt-1 text-sm text-slate-500">지금 필요한 계산이 어느 쪽인지 골라보세요.</p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SITUATION_GROUPS.map((g) => (
            <div key={g.key} className="card p-5">
              <div className="flex items-center gap-2">
                <span aria-hidden className="text-xl">{g.emoji}</span>
                <h3 className="text-base font-bold text-slate-900">{g.title}</h3>
              </div>
              <p className="mt-1 text-xs text-slate-500">&ldquo;{g.question}&rdquo;</p>
              <ul className="mt-3 space-y-1.5">
                {g.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}
                      className="text-sm text-brand-700 hover:underline">
                      {item.label} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── 전체 계산기 ──────────────────────────────────── */}
      <section className="mt-12">
        <h2 className="text-xl font-black text-slate-900">전체 계산기 {CALCULATORS.length}종</h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CALCULATORS.map((calc) => (
            <Link key={calc.href} href={calc.href}
              className="card p-5 hover:border-brand-200 hover:shadow-md transition-all group">
              <div className="text-3xl mb-3">{calc.emoji}</div>
              <h3 className="text-base font-bold text-slate-800 group-hover:text-brand-700 transition-colors mb-1">
                {calc.title}
              </h3>
              <p className="text-xs text-slate-500">{calc.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 6. 가이드 ────────────────────────────────────── */}
      <section className="mt-12">
        <h2 className="text-xl font-black text-slate-900">알아두면 좋은 것</h2>
        <div className="mt-4 space-y-3">
          {HOME_GUIDES.map((g) => (
            <div key={g.q} className="card p-5">
              <h3 className="text-base font-bold text-slate-900">{g.q}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{g.a}</p>
              <Link href={g.href} className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">
                {g.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. 신뢰 영역 ─────────────────────────────────── */}
      <section className="mt-12 card p-6 bg-slate-50">
        <h2 className="text-base font-bold text-slate-900">계산 기준과 출처</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="font-semibold text-slate-700">적용 연도</dt>
            <dd className="text-slate-600">
              {TAX_YEAR}년 고시 요율과 근로소득 간이세액표를 적용합니다.
              국민연금 보험료율은 국민연금법 부칙의 연도별 스케줄에 따라 자동으로 전환됩니다.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-700">공식 출처</dt>
            <dd className="text-slate-600">
              소득세법·시행령(간이세액표), 국민연금법, 국민건강보험법, 노인장기요양보험법,
              고용보험 및 산업재해보상보험의 보험료징수 등에 관한 법률, 근로기준법.
              법령 원문은 국가법령정보센터를 기준으로 확인합니다.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-700">최근 검토일</dt>
            <dd className="text-slate-600">{POLICY_REVIEWED_AT}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-700">계산 방식</dt>
            <dd className="text-slate-600">
              모든 계산은 <strong>이용자의 브라우저 안에서</strong> 이루어집니다.
              입력한 연봉·급여 정보는 서버로 전송되거나 저장되지 않습니다.
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-slate-500">
          계산 결과는 참고용 예상값입니다. 실제 급여와 공제액은 회사 정책, 비과세 항목의
          범위, 연말정산 결과에 따라 달라질 수 있습니다.
        </p>
      </section>

    </main>
  )
}
