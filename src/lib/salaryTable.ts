// src/lib/salaryTable.ts
// 연봉 실수령액 표(/salary-table)의 행 데이터.
//
// 연봉 목록·계산 조건·계산 결과는 모두 연봉별 상세 페이지(/salary/[amount])와 같은
// 원본(SALARY_AMOUNTS_MAN, buildSalaryPageData)에서 가져온다. 세금·보험료 산식이나
// 연봉 목록을 여기서 다시 만들지 않는다.

import { TAX_YEAR_AS_OF } from './policyYear'
import {
  SALARY_AMOUNTS_MAN,
  SALARY_PAGE_CONDITIONS,
  buildSalaryPageData,
} from './salaryPageData'

export interface SalaryTableRow {
  /** 연봉 (만원) */
  amountMan: number
  /** 연봉 (원) */
  annualSalary: number
  /** 화면 표시용 연봉 (예: 3,000만원) */
  label: string
  /** 월 세전 급여 (원) */
  monthlyGross: number
  /** 월 총 공제액 (원) */
  monthlyDeduction: number
  /** 월 실수령액 (원) */
  monthlyNet: number
  /** 같은 조건으로 계산한 연봉별 상세 페이지 경로 */
  href: string
}

/** 1억원 이상은 억 단위로 읽기 쉽게 표시한다 (예: 15000 → 1억 5,000만원). */
export function salaryTableLabel(amountMan: number): string {
  const eok = Math.floor(amountMan / 10_000)
  const rest = amountMan % 10_000
  if (eok === 0) return `${rest.toLocaleString('ko-KR')}만원`
  return rest === 0 ? `${eok}억원` : `${eok}억 ${rest.toLocaleString('ko-KR')}만원`
}

export function buildSalaryTableRows(asOfDate: Date = TAX_YEAR_AS_OF): SalaryTableRow[] {
  return SALARY_AMOUNTS_MAN.map((amountMan) => {
    const { annualSalary, result } = buildSalaryPageData(amountMan, asOfDate)
    return {
      amountMan,
      annualSalary,
      label: salaryTableLabel(amountMan),
      monthlyGross: result.monthlyGross,
      monthlyDeduction: result.breakdown.totalDeduction,
      monthlyNet: result.monthlyNet,
      href: `/salary/${amountMan}`,
    }
  })
}

/** 표 위에 표시하는 계산 조건. 계산에 실제로 쓴 값에서 만든다. */
export const SALARY_TABLE_CONDITION_ITEMS: readonly string[] = [
  `월 비과세 ${SALARY_PAGE_CONDITIONS.nonTaxable.toLocaleString('ko-KR')}원`,
  `공제대상가족 ${SALARY_PAGE_CONDITIONS.dependents}명 (본인 포함)`,
  `8세 이상 20세 이하 자녀 ${SALARY_PAGE_CONDITIONS.childCount8to20}명`,
  `소득세 원천징수 비율 ${SALARY_PAGE_CONDITIONS.withholdingPercentage}%`,
]
