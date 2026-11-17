/**
 * src/app/salary-table/page.tsx
 * 연봉 실수령액 표 — 연봉별 상세 페이지(/salary/[amount])와 같은 조건·같은 계산 결과를
 * 한 화면에서 비교하는 참고표. 입력폼·필터는 두지 않는다.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { withPageMetadata } from '@/lib/metadata'
import { ROUTES } from '@/lib/routes'
import { SITE_NAME, TAX_YEAR, TAX_YEAR_AS_OF_LABEL } from '@/lib/constants'
import {
  SALARY_TABLE_CONDITION_ITEMS,
  buildSalaryTableRows,
  salaryTableLabel,
} from '@/lib/salaryTable'
import { SALARY_MAX_MAN, SALARY_MIN_MAN, SALARY_STEP_MAN } from '@/lib/salaryPageData'

const RANGE_TEXT = `연봉 ${salaryTableLabel(SALARY_MIN_MAN)}부터 ${salaryTableLabel(SALARY_MAX_MAN)}까지 ${salaryTableLabel(SALARY_STEP_MAN)} 간격`

export const metadata: Metadata = withPageMetadata({
  title: `${TAX_YEAR}년 연봉 실수령액 표 | ${SITE_NAME}`,
  description: `${RANGE_TEXT}으로 월 세전 급여, 월 총 공제액, 월 실수령액을 한눈에 비교하는 ${TAX_YEAR}년 기준 참고표입니다.`,
}, ROUTES.SALARY_TABLE)

const won = (value: number) => value.toLocaleString('ko-KR')

export default function SalaryTablePage() {
  const rows = buildSalaryTableRows()

  return (
    <main className="flex-1 max-w-3xl mx-auto px-4 py-10">
      <nav aria-label="현재 위치" className="mb-6 text-sm text-slate-500">
        <Link href={ROUTES.HOME} className="hover:text-brand-800">홈</Link>
        <span className="mx-2" aria-hidden="true">›</span>
        <Link href={ROUTES.SALARY_CALCULATOR} className="hover:text-brand-800">연봉 실수령액 계산기</Link>
        <span className="mx-2" aria-hidden="true">›</span>
        <span className="text-slate-600">연봉 실수령액 표</span>
      </nav>

      <h1 className="text-3xl font-bold mb-2">연봉 실수령액 표</h1>
      <p className="text-gray-500">{TAX_YEAR_AS_OF_LABEL} · {RANGE_TEXT}</p>

      <section aria-labelledby="salary-table-conditions" className="mt-6 card p-5">
        <h2 id="salary-table-conditions" className="text-base font-bold text-slate-900">계산 조건</h2>
        <ul className="mt-3 grid gap-1.5 text-sm text-slate-700 sm:grid-cols-2">
          {SALARY_TABLE_CONDITION_ITEMS.map((item) => (
            <li key={item}>· {item}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          모든 연봉에 위 조건을 똑같이 적용한 참고표입니다. 비과세 수당, 가족 수, 자녀 수가
          다르면 실수령액이 달라집니다. 내 조건으로 계산하려면 실수령액 계산기를 이용하세요.
        </p>
        <Link href={ROUTES.SALARY_CALCULATOR}
          className="mt-4 inline-flex rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition-colors">
          내 조건으로 실수령액 계산하기 →
        </Link>
      </section>

      <section aria-labelledby="salary-table-heading" className="mt-8">
        <h2 id="salary-table-heading" className="text-xl font-black text-slate-900">연봉별 월 실수령액</h2>
        <p className="mt-1 text-sm text-slate-500">
          연봉을 누르면 같은 조건으로 계산한 공제 항목별 상세 내역을 볼 수 있습니다. 금액 단위는 원입니다.
        </p>
        {/* 표 안에서만 가로로 스크롤한다. 페이지 전체가 넘치지 않게 래퍼에 가둔다. */}
        <div className="mt-4 card p-0 overflow-x-auto" tabIndex={0} role="region" aria-labelledby="salary-table-heading">
          <table className="w-full text-sm">
            <caption className="sr-only">
              {TAX_YEAR_AS_OF_LABEL} 연봉별 월 실수령액, 월 세전 급여, 월 총 공제액 (단위: 원)
            </caption>
            <thead>
              <tr className="border-b bg-slate-50 text-left text-slate-500">
                <th scope="col" className="py-3 px-3 sm:px-4 font-medium whitespace-nowrap">연봉</th>
                {/* 좁은 화면에서도 가장 중요한 월 실수령액이 스크롤 없이 보이도록 연봉 바로 옆에 둔다. */}
                <th scope="col" className="py-3 px-3 sm:px-4 font-medium text-right whitespace-nowrap">월 실수령액</th>
                <th scope="col" className="py-3 px-3 sm:px-4 font-medium text-right whitespace-nowrap">월 세전 급여</th>
                <th scope="col" className="py-3 px-3 sm:px-4 font-medium text-right whitespace-nowrap">월 총 공제액</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.amountMan} className="border-b last:border-0 hover:bg-brand-50/40 transition-colors">
                  <th scope="row" className="p-0 text-left font-semibold text-slate-800">
                    <Link href={row.href}
                      aria-label={`연봉 ${row.label} 실수령액 상세 보기`}
                      className="block py-3 px-3 sm:px-4 whitespace-nowrap underline decoration-slate-300 underline-offset-4 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                      {row.label}
                    </Link>
                  </th>
                  <td className="py-3 px-3 sm:px-4 text-right tabular-nums font-bold text-brand-700 whitespace-nowrap">
                    {won(row.monthlyNet)}
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-right tabular-nums text-slate-600 whitespace-nowrap">
                    {won(row.monthlyGross)}
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-right tabular-nums text-slate-500 whitespace-nowrap">
                    {won(row.monthlyDeduction)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500 sm:hidden">
          표가 화면보다 넓으면 표 안에서 옆으로 밀어 나머지 열을 볼 수 있습니다.
        </p>
      </section>

      <section aria-labelledby="salary-table-notes" className="mt-8 text-sm leading-relaxed text-slate-600">
        <h2 id="salary-table-notes" className="text-base font-bold text-slate-900">이 표를 볼 때 알아둘 점</h2>
        <ul className="mt-3 space-y-1.5">
          <li>· 월 세전 급여는 연봉을 12로 나눈 금액입니다. 상여금·성과급을 따로 받는 경우는 반영하지 않습니다.</li>
          <li>· 월 총 공제액은 국민연금, 건강보험, 장기요양보험, 고용보험, 소득세, 지방소득세의 합계입니다.</li>
          <li>· 소득세는 근로소득 간이세액표 기준의 매월 원천징수 예상액이며, 연말정산으로 확정되는 세금과 다를 수 있습니다.</li>
          <li>· 실제 급여는 회사의 급여 규정과 개인별 조건에 따라 달라집니다.</li>
        </ul>
      </section>
    </main>
  )
}
