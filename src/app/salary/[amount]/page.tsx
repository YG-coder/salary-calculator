/**
 * src/app/salary/[amount]/page.tsx
 * 연봉별 실수령액 정적 SEO 페이지
 *
 * 차별화 설계(2026-08): 27개 페이지를 인위적 구간이 아니라 각 연봉의 실제 계산
 * 숫자로 차별화합니다. 상한 도달·고소득 산식 진입 등 "그 연봉에서만 실제로
 * 일어난 계산상의 사건"은 buildSalaryPageData()가 이벤트로 생성하며, 숫자가
 * 문장보다 앞섭니다. (src/lib/salaryPageData.ts 참고)
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SalaryAmountLinks from '@/components/calculator/SalaryAmountLinks'
import { formatKRW } from '@/lib/salary'
import {
  buildSalaryPageData,
  isValidSalaryMan,
  SALARY_AMOUNTS_MAN,
  type SalaryEvent,
} from '@/lib/salaryPageData'
import { SITE_URL, SITE_NAME, TAX_YEAR } from '@/lib/constants'

type PageProps = {
  params: Promise<{ amount: string }>
}

function parseAmount(value: string): number | null {
  const parsed = Number(value)
  if (!isValidSalaryMan(parsed)) return null
  return parsed
}

export function generateStaticParams() {
  return SALARY_AMOUNTS_MAN.map((amount) => ({ amount: String(amount) }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { amount } = await params
  const parsed = parseAmount(amount)

  if (!parsed) {
    return { title: `연봉 실수령액 계산기 | ${SITE_NAME}` }
  }

  const { result } = buildSalaryPageData(parsed)

  const title = `연봉 ${parsed.toLocaleString()}만원 실수령액 | ${TAX_YEAR}년 세후 월급`
  const description = `연봉 ${parsed.toLocaleString()}만원 기준 월 실수령액은 약 ${formatKRW(
    result.monthlyNet,
  )}입니다. 4대보험, 소득세, 지방소득세 공제 내역과 세전·세후 차이를 확인하세요.`
  const url = `${SITE_URL}/salary/${parsed}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      locale: 'ko_KR',
      url,
      siteName: SITE_NAME,
      title,
      description,
      images: [
        {
          url: `${SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} 연봉 ${parsed}만원 실수령액`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/og-image.png`],
    },
  }
}

function EventBlock({ event }: { event: SalaryEvent }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
      <h3 className="text-base font-bold text-slate-900">{event.question}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">
        {event.answer}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{event.detail}</p>
    </div>
  )
}

export default async function SalaryDetailPage({ params }: PageProps) {
  const { amount } = await params
  const parsed = parseAmount(amount)

  if (!parsed) {
    notFound()
  }

  const { annualSalary, result, metrics, events, prevAmountMan, nextAmountMan } =
    buildSalaryPageData(parsed)

  const breakdownRows = [
    { label: '국민연금', desc: result.flags.pensionCapped ? '기준소득월액 상한 적용' : '월 과세소득 기준', value: result.breakdown.nationalPension },
    { label: '건강보험', desc: '월 과세소득 기준', value: result.breakdown.healthInsurance },
    { label: '장기요양보험', desc: '건강보험료 기준', value: result.breakdown.longTermCare },
    { label: '고용보험', desc: '월 과세소득 기준', value: result.breakdown.employment },
    { label: '소득세', desc: result.flags.usedHighIncomeTaxFormula ? '별표2 고소득 산식' : '근로소득 간이세액표', value: result.breakdown.incomeTax },
    { label: '지방소득세', desc: '소득세의 10%', value: result.breakdown.localTax },
  ]

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <nav className="mb-6 text-sm text-slate-400">
        <Link href="/" className="hover:text-brand-600">홈</Link>
        <span className="mx-2">›</span>
        <Link href="/salary-calculator" className="hover:text-brand-600">연봉 실수령액 계산기</Link>
        <span className="mx-2">›</span>
        <span className="text-slate-600">연봉 {parsed.toLocaleString()}만원</span>
      </nav>

      <section className="mb-8">
        <p className="mb-3 inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          {TAX_YEAR}년 기준 · 부양가족 1명 · 비과세 없음
        </p>
        <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          연봉 {parsed.toLocaleString()}만원 실수령액
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          연봉 {parsed.toLocaleString()}만원을 기준으로 월 세전 급여, 예상 실수령액,
          4대보험과 소득세 공제 내역을 계산했습니다. 실제 급여는 회사의 급여 규정,
          비과세 항목, 부양가족 수, 상여금 지급 방식에 따라 달라질 수 있습니다.
        </p>
      </section>

      {/* 대표 결과 */}
      <section
        className="mb-6 rounded-3xl p-6 text-white shadow-sm"
        style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}
      >
        <p className="mb-2 text-sm font-semibold text-sky-100">예상 월 실수령액</p>
        <p className="text-4xl font-black tracking-tight tabular-nums sm:text-5xl">
          {formatKRW(result.monthlyNet)}
        </p>
        <div className="mt-5 grid gap-3 border-t border-white/20 pt-5 text-sm text-sky-50 sm:grid-cols-3">
          <div>
            <p className="text-sky-200">월 세전 급여</p>
            <p className="mt-1 font-bold tabular-nums">{formatKRW(result.monthlyGross)}</p>
          </div>
          <div>
            <p className="text-sky-200">월 공제 합계</p>
            <p className="mt-1 font-bold tabular-nums">{formatKRW(result.breakdown.totalDeduction)}</p>
          </div>
          <div>
            <p className="text-sky-200">실효 공제율</p>
            <p className="mt-1 font-bold tabular-nums">{metrics.effectiveDeductionRate}%</p>
          </div>
        </div>
      </section>

      {/* 요약 카드 3종 */}
      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm text-slate-500">연 실수령액</p>
          <p className="mt-2 text-xl font-black text-slate-900 tabular-nums">{formatKRW(result.annualNet)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">연 총 공제액</p>
          <p className="mt-2 text-xl font-black text-red-500 tabular-nums">-{formatKRW(result.annualDeduction)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">월 실수령률</p>
          <p className="mt-2 text-xl font-black text-slate-900 tabular-nums">{metrics.monthlyNetRate}%</p>
        </div>
      </section>

      {/* 월 공제 내역 */}
      <section className="card mb-8 p-6">
        <h2 className="text-xl font-bold text-slate-900">
          연봉 {parsed.toLocaleString()}만원 월 공제 내역
        </h2>
        <ul className="mt-5 divide-y divide-slate-100">
          {breakdownRows.map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="font-semibold text-slate-800">{row.label}</p>
                <p className="mt-1 text-xs text-slate-400">{row.desc}</p>
              </div>
              <p className="font-bold text-slate-800 tabular-nums">{formatKRW(row.value)}</p>
            </li>
          ))}
          <li className="flex items-center justify-between gap-4 pt-4">
            <p className="font-bold text-slate-900">월 공제 합계</p>
            <p className="font-black text-red-500 tabular-nums">-{formatKRW(result.breakdown.totalDeduction)}</p>
          </li>
        </ul>
      </section>

      {/* 이 연봉만의 숫자: 단계 비교 + 한계 실수령 */}
      <section className="card mb-8 space-y-5 p-6 leading-7 text-slate-700">
        <h2 className="text-xl font-bold text-slate-900">
          연봉 {parsed.toLocaleString()}만원에서 한 단계 오르면 실수령은 얼마나 늘까요?
        </h2>

        {metrics.prevMonthlyNetDelta !== null &&
        prevAmountMan !== null &&
        metrics.prevStepMan !== null ? (
          <p>
            직전 단계인 연봉 {prevAmountMan.toLocaleString()}만원과 비교하면, 연봉이{' '}
            {metrics.prevStepMan.toLocaleString()}만원 오를 때 월 실수령액은{' '}
            <strong>{formatKRW(metrics.prevMonthlyNetDelta)}</strong>, 연으로는{' '}
            <strong>{formatKRW(metrics.prevAnnualNetDelta ?? 0)}</strong> 늘어납니다.
            연봉 인상분 {metrics.prevStepMan.toLocaleString()}만원 중 실제 통장에
            남는 비율은 공제가 함께 늘기 때문에 100%가 아닙니다.
          </p>
        ) : (
          <p>
            이 페이지는 계산 범위의 가장 낮은 구간이라 직전 단계 비교는 제공하지 않습니다.
            대신 아래에서 세전 소득이 조금 더 늘 때 실수령이 어떻게 반응하는지 확인할 수 있습니다.
          </p>
        )}

        <p>
          지금 이 연봉에서 세전 급여가 100만원(연 기준) 더 오른다고 가정하면, 실제로
          더 손에 쥐는 연 실수령액은 약{' '}
          <strong>{formatKRW(metrics.marginalNetPerMillion)}</strong>입니다. 즉 추가
          소득 100만원 중 약 <strong>{metrics.marginalRetentionRate}%</strong>가 남고
          나머지는 4대보험과 세금으로 공제됩니다. 같은 세전 인상액이라도 현재
          연봉 구간과 공제 구조에 따라 실제 실수령 증가액은 달라집니다.
        </p>

        <p>
          비과세 식대 월 20만원을 적용하면 같은 연봉이라도 과세 대상 급여가 줄어들어 월
          실수령액이 약 <strong>{formatKRW(metrics.mealAllowanceDelta)}</strong> 증가할
          수 있습니다. 다만 실제 적용 여부는 회사의 급여 항목과 비과세 처리 방식에 따라
          다릅니다.
        </p>
      </section>

      {/* 엔진 임계점 이벤트 (해당 구간에서만 노출) */}
      {events.length > 0 && (
        <section className="mb-8 space-y-4">
          <h2 className="text-xl font-bold text-slate-900">
            이 연봉 구간에서 달라지는 점
          </h2>
          {events.map((event) => (
            <EventBlock key={event.kind} event={event} />
          ))}
        </section>
      )}

      {/* 자주 묻는 질문 (이 연봉의 숫자를 반영) */}
      <section className="card mb-8 p-6">
        <h2 className="text-xl font-bold text-slate-900">자주 묻는 질문</h2>
        <div className="mt-5 space-y-5">
          <div>
            <h3 className="font-bold text-slate-900">
              Q. 연봉 {parsed.toLocaleString()}만원의 월급은 단순히 12로 나누면 되나요?
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              세전 월급은 연봉 {parsed.toLocaleString()}만원을 12로 나눈{' '}
              {formatKRW(result.monthlyGross)}이지만, 실제 입금액은 여기에서 4대보험과
              세금 {formatKRW(result.breakdown.totalDeduction)}이 공제된{' '}
              {formatKRW(result.monthlyNet)}입니다. 그래서 세전 월급과 월 실수령액은
              다릅니다.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-slate-900">
              Q. 이 연봉에서 비과세 식대가 있으면 실수령액이 늘어나나요?
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              연봉 {parsed.toLocaleString()}만원 기준으로 월 20만원 비과세 식대를 적용하면
              과세 대상 급여가 줄어 월 실수령액이 약 {formatKRW(metrics.mealAllowanceDelta)}{' '}
              늘 수 있습니다. 회사에서 실제로 비과세 항목으로 처리하는지가 중요합니다.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-slate-900">
              Q. 계산 결과와 실제 급여명세서가 다를 수 있나요?
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              네. 이 페이지는 부양가족 1명·비과세 없음 조건의 예시입니다. 회사의 급여 지급
              방식, 상여금 포함 여부, 공제 신고 내용, 부양가족 수, 비과세 항목 등에 따라
              실제 급여명세서와 차이가 날 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      <p className="mb-8 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
        본 계산 결과는 {TAX_YEAR}년 기준 요율과 근로소득 간이세액표를 적용한 참고용
        정보입니다. 실제 급여명세서의 공제액과는 차이가 있을 수 있으며, 세무·노무 판단이
        필요한 경우 전문가 상담을 권장합니다.
      </p>

      {/* 내 조건으로 다시 계산 */}
      <section className="mb-8 rounded-3xl border border-brand-100 bg-brand-50 p-6">
        <h2 className="text-lg font-bold text-brand-900">내 조건으로 다시 계산하기</h2>
        <p className="mt-2 text-sm leading-6 text-brand-800">
          비과세 식대, 부양가족 수, 실제 연봉을 반영하면 더 현실적인 세후 월급을 확인할 수
          있습니다.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/salary-calculator" className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700">
            연봉 실수령액 계산기 →
          </Link>
          <Link href="/social-insurance-calculator" className="rounded-xl border border-brand-200 bg-white px-5 py-3 text-sm font-bold text-brand-700 hover:bg-brand-50">
            4대보험 계산기 →
          </Link>
        </div>
      </section>

      <div className="mb-8 border-t border-slate-200 pt-6">
        <SalaryAmountLinks currentAmountMan={parsed} />
      </div>

      {/* 현재 구간에서 바로 이어지는 이전·다음 연봉을 추가로 제공한다. */}
      <section className="mb-8 border-t border-slate-200 pt-6">
        <h2 className="text-sm font-semibold text-slate-500">이전·다음 연봉</h2>
        <div className="mt-3 flex justify-between gap-4 text-sm">
          {prevAmountMan !== null ? (
            <Link
              href={`/salary/${prevAmountMan}`}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-brand-700 hover:border-brand-200 hover:bg-brand-50"
            >
              ← 연봉 {prevAmountMan.toLocaleString()}만원
            </Link>
          ) : (
            <span />
          )}
          {nextAmountMan !== null ? (
            <Link
              href={`/salary/${nextAmountMan}`}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-right font-semibold text-brand-700 hover:border-brand-200 hover:bg-brand-50"
            >
              연봉 {nextAmountMan.toLocaleString()}만원 →
            </Link>
          ) : (
            <span />
          )}
        </div>
      </section>
    </main>
  )
}
