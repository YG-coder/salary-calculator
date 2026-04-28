/**
 * src/app/salary/[amount]/page.tsx
 * 연봉별 실수령액 정적 SEO 페이지
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { calculateSalary, formatKRW } from '@/lib/salary'
import { SITE_URL, SITE_NAME, TAX_YEAR } from '@/lib/constants'

type PageProps = {
  params: Promise<{
    amount: string
  }>
}

const SALARY_AMOUNTS = Array.from(
    { length: Math.floor((15000 - 2000) / 500) + 1 },
    (_, i) => 2000 + i * 500,
)

function parseAmount(value: string) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed)) return null
  if (parsed < 2000 || parsed > 15000) return null
  if (parsed % 500 !== 0) return null

  return parsed
}

export async function generateStaticParams() {
  return SALARY_AMOUNTS.map((amount) => ({
    amount: String(amount),
  }))
}

export async function generateMetadata({
                                         params,
                                       }: PageProps): Promise<Metadata> {
  const { amount } = await params
  const parsed = parseAmount(amount)

  if (!parsed) {
    return {
      title: `연봉 실수령액 계산기 | ${SITE_NAME}`,
    }
  }

  const annual = parsed * 10_000
  const result = calculateSalary({
    annualSalary: annual,
    nonTaxable: 0,
    dependents: 1,
  })

  const title = `연봉 ${parsed.toLocaleString()}만원 실수령액 | ${TAX_YEAR}년 세후 월급`
  const description = `연봉 ${parsed.toLocaleString()}만원 기준 월 실수령액은 약 ${formatKRW(
      result.monthlyNet,
  )}입니다. 4대보험, 소득세, 지방소득세 공제 내역과 세전·세후 차이를 확인하세요.`

  const url = `${SITE_URL}/salary/${parsed}`

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
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

export default async function SalaryDetailPage({ params }: PageProps) {
  const { amount } = await params
  const parsed = parseAmount(amount)

  if (!parsed) {
    notFound()
  }

  const annual = parsed * 10_000

  const result = calculateSalary({
    annualSalary: annual,
    nonTaxable: 0,
    dependents: 1,
  })

  const deductionRate = ((result.annualDeduction / annual) * 100).toFixed(1)
  const monthlyDeductionRate = (
      (result.breakdown.totalDeduction / result.monthlyGross) *
      100
  ).toFixed(1)

  const withMealAllowance = calculateSalary({
    annualSalary: annual,
    nonTaxable: 200_000,
    dependents: 1,
  })

  const mealAllowanceDiff = withMealAllowance.monthlyNet - result.monthlyNet

  const prevAmount = SALARY_AMOUNTS.includes(parsed - 500)
      ? parsed - 500
      : null

  const nextAmount = SALARY_AMOUNTS.includes(parsed + 500)
      ? parsed + 500
      : null

  const breakdownRows = [
    {
      label: '국민연금',
      desc: '월 과세급여 기준',
      value: result.breakdown.nationalPension,
    },
    {
      label: '건강보험',
      desc: '월 과세급여 기준',
      value: result.breakdown.healthInsurance,
    },
    {
      label: '장기요양보험',
      desc: '건강보험료 기준',
      value: result.breakdown.longTermCare,
    },
    {
      label: '고용보험',
      desc: '월 과세급여 기준',
      value: result.breakdown.employment,
    },
    {
      label: '소득세',
      desc: '근로소득세 근사 계산',
      value: result.breakdown.incomeTax,
    },
    {
      label: '지방소득세',
      desc: '소득세의 10%',
      value: result.breakdown.localTax,
    },
  ]

  const relatedAmounts = [3000, 3500, 4000, 4500, 5000, 6000, 7000, 8000].filter(
      (value) => value !== parsed,
  )

  return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <nav className="mb-6 text-sm text-slate-400">
          <Link href="/" className="hover:text-brand-600">
            홈
          </Link>
          <span className="mx-2">›</span>
          <Link href="/salary-calculator" className="hover:text-brand-600">
            연봉 실수령액 계산기
          </Link>
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
            연봉 {parsed.toLocaleString()}만원을 기준으로 월 세전 급여, 예상
            실수령액, 4대보험과 소득세 공제 내역을 계산했습니다. 실제 급여는
            회사의 급여 규정, 비과세 항목, 부양가족 수, 상여금 지급 방식에 따라
            달라질 수 있습니다.
          </p>
        </section>

        <section
            className="mb-6 rounded-3xl p-6 text-white shadow-sm"
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            }}
        >
          <p className="mb-2 text-sm font-semibold text-sky-100">예상 월 실수령액</p>
          <p className="text-4xl font-black tracking-tight tabular-nums sm:text-5xl">
            {formatKRW(result.monthlyNet)}
          </p>

          <div className="mt-5 grid gap-3 border-t border-white/20 pt-5 text-sm text-sky-50 sm:grid-cols-3">
            <div>
              <p className="text-sky-200">월 세전 급여</p>
              <p className="mt-1 font-bold tabular-nums">
                {formatKRW(result.monthlyGross)}
              </p>
            </div>
            <div>
              <p className="text-sky-200">월 공제 합계</p>
              <p className="mt-1 font-bold tabular-nums">
                {formatKRW(result.breakdown.totalDeduction)}
              </p>
            </div>
            <div>
              <p className="text-sky-200">실효 공제율</p>
              <p className="mt-1 font-bold tabular-nums">{deductionRate}%</p>
            </div>
          </div>
        </section>

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="card p-5">
            <p className="text-sm text-slate-500">연 실수령액</p>
            <p className="mt-2 text-xl font-black text-slate-900 tabular-nums">
              {formatKRW(result.annualNet)}
            </p>
          </div>

          <div className="card p-5">
            <p className="text-sm text-slate-500">연 총 공제액</p>
            <p className="mt-2 text-xl font-black text-red-500 tabular-nums">
              -{formatKRW(result.annualDeduction)}
            </p>
          </div>

          <div className="card p-5">
            <p className="text-sm text-slate-500">월 공제 비율</p>
            <p className="mt-2 text-xl font-black text-slate-900 tabular-nums">
              {monthlyDeductionRate}%
            </p>
          </div>
        </section>

        <section className="card mb-8 p-6">
          <h2 className="text-xl font-bold text-slate-900">
            연봉 {parsed.toLocaleString()}만원 월 공제 내역
          </h2>

          <ul className="mt-5 divide-y divide-slate-100">
            {breakdownRows.map((row) => (
                <li
                    key={row.label}
                    className="flex items-center justify-between gap-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{row.label}</p>
                    <p className="mt-1 text-xs text-slate-400">{row.desc}</p>
                  </div>
                  <p className="font-bold text-slate-800 tabular-nums">
                    {formatKRW(row.value)}
                  </p>
                </li>
            ))}

            <li className="flex items-center justify-between gap-4 pt-4">
              <p className="font-bold text-slate-900">월 공제 합계</p>
              <p className="font-black text-red-500 tabular-nums">
                -{formatKRW(result.breakdown.totalDeduction)}
              </p>
            </li>
          </ul>
        </section>

        <section className="card mb-8 space-y-5 p-6 leading-7 text-slate-700">
          <h2 className="text-xl font-bold text-slate-900">
            연봉 {parsed.toLocaleString()}만원이면 실제 월급은 얼마인가요?
          </h2>

          <p>
            연봉 {parsed.toLocaleString()}만원은 세전 기준으로 월{' '}
            <strong>{formatKRW(result.monthlyGross)}</strong> 수준입니다. 여기에서
            국민연금, 건강보험, 장기요양보험, 고용보험, 소득세, 지방소득세가
            차감되면 예상 월 실수령액은{' '}
            <strong>{formatKRW(result.monthlyNet)}</strong>입니다.
          </p>

          <p>
            월 공제액은 약{' '}
            <strong>{formatKRW(result.breakdown.totalDeduction)}</strong>이며,
            연간으로 보면 약 <strong>{formatKRW(result.annualDeduction)}</strong>이
            공제됩니다. 따라서 연봉과 실제 통장에 입금되는 금액은 차이가 있으며,
            연봉 협상이나 이직 판단을 할 때는 세전 금액뿐 아니라 세후 월급을 함께
            확인하는 것이 좋습니다.
          </p>

          <p>
            비과세 식대 월 20만원을 적용하면 같은 연봉이라도 과세 대상 급여가
            줄어들어 월 실수령액이 약{' '}
            <strong>{formatKRW(mealAllowanceDiff)}</strong> 증가할 수 있습니다.
            다만 실제 적용 여부는 회사의 급여 항목과 비과세 처리 방식에 따라
            다릅니다.
          </p>
        </section>

        <section className="card mb-8 space-y-5 p-6 leading-7 text-slate-700">
          <h2 className="text-xl font-bold text-slate-900">
            연봉 실수령액 계산 시 주의할 점
          </h2>

          <p>
            연봉 실수령액은 단순히 연봉을 12개월로 나눈 금액이 아닙니다. 세전
            월급에서 4대보험과 세금이 차감되며, 상여금이 연봉에 포함되어 있는지,
            식대나 차량유지비 같은 비과세 항목이 있는지에 따라 결과가 달라집니다.
          </p>

          <p>
            특히 부양가족 수가 달라지면 소득세 계산에 영향을 줄 수 있습니다.
            본 페이지는 부양가족 1명, 비과세 없음 조건의 기본 예시이므로, 본인의
            실제 조건을 반영하려면 연봉 실수령액 계산기에서 비과세 금액과
            부양가족 수를 직접 입력해 계산하는 것이 정확합니다.
          </p>

          <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
            본 계산 결과는 {TAX_YEAR}년 기준 요율과 근사 계산식을 바탕으로 한
            참고용 정보입니다. 실제 급여명세서의 공제액과는 차이가 있을 수 있으며,
            세무·노무 판단이 필요한 경우 전문가 상담을 권장합니다.
          </p>
        </section>

        <section className="mb-8 rounded-3xl border border-brand-100 bg-brand-50 p-6">
          <h2 className="text-lg font-bold text-brand-900">
            내 조건으로 다시 계산하기
          </h2>
          <p className="mt-2 text-sm leading-6 text-brand-800">
            비과세 식대, 부양가족 수, 실제 연봉을 반영하면 더 현실적인 세후 월급을
            확인할 수 있습니다.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
                href="/salary-calculator"
                className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700"
            >
              연봉 실수령액 계산기 →
            </Link>

            <Link
                href="/social-insurance-calculator"
                className="rounded-xl border border-brand-200 bg-white px-5 py-3 text-sm font-bold text-brand-700 hover:bg-brand-50"
            >
              4대보험 계산기 →
            </Link>
          </div>
        </section>

        <section className="card mb-8 p-6">
          <h2 className="text-xl font-bold text-slate-900">자주 묻는 질문</h2>

          <div className="mt-5 space-y-5">
            <div>
              <h3 className="font-bold text-slate-900">
                Q. 연봉 {parsed.toLocaleString()}만원의 월급은 단순히 12로 나누면 되나요?
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                세전 월급은 연봉을 12로 나누어 볼 수 있지만, 실제 입금액은
                4대보험과 세금을 공제한 금액입니다. 그래서 세전 월급과 월
                실수령액은 다릅니다.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900">
                Q. 비과세 식대가 있으면 실수령액이 늘어나나요?
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                일반적으로 비과세 금액이 있으면 과세 대상 급여가 줄어들어
                소득세와 일부 보험료 부담이 낮아질 수 있습니다. 회사에서 실제로
                비과세 항목으로 처리하는지가 중요합니다.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900">
                Q. 계산 결과와 실제 급여명세서가 다를 수 있나요?
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                네. 회사의 급여 지급 방식, 상여금 포함 여부, 공제 신고 내용,
                부양가족 수, 비과세 항목 등에 따라 실제 급여명세서와 차이가 날 수
                있습니다.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8 border-t border-slate-200 pt-6">
          <h2 className="text-lg font-bold text-slate-900">다른 연봉 실수령액 보기</h2>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {relatedAmounts.map((value) => (
                <Link
                    key={value}
                    href={`/salary/${value}`}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                >
                  연봉 {value.toLocaleString()}만원
                </Link>
            ))}
          </div>

          <div className="mt-5 flex justify-between text-sm">
            {prevAmount ? (
                <Link href={`/salary/${prevAmount}`} className="text-brand-600 hover:underline">
                  ← 연봉 {prevAmount.toLocaleString()}만원
                </Link>
            ) : (
                <span />
            )}

            {nextAmount ? (
                <Link href={`/salary/${nextAmount}`} className="text-brand-600 hover:underline">
                  연봉 {nextAmount.toLocaleString()}만원 →
                </Link>
            ) : (
                <span />
            )}
          </div>
        </section>
      </main>
  )
}