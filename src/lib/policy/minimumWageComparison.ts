import { getMinimumHourlyWage } from './annualRates'

/**
 * 임금 환산·최저임금 비교의 지원 범위. 근거와 미확인 범위: docs/wage-converter.md
 *
 * 표준 조건의 월 기준시간 209시간은 고용노동부가 최저임금 월 환산액에 쓰는 기준
 * (주 소정근로 40시간 + 유급 주휴 8시간)이다. 다른 근무조건의 월 기준시간은 이 값에서
 * 추정하지 않고 사용자가 직접 입력한다.
 */
export const STANDARD_MONTHLY_HOURS = 209
export const STANDARD_WEEKLY_WORK_HOURS = 40
export const STANDARD_WEEKLY_PAID_HOLIDAY_HOURS = 8

/** 한 달(31일)의 전체 시간. 법정 한도가 아니라 입력 실수를 걸러내는 범위다. */
export const MAX_MONTHLY_HOURS = 744

/** 최저임금 비교를 지원하는 적용 연도. 최저시급은 기간별 정책 자료에서만 가져온다. */
export const MINIMUM_WAGE_COMPARISON_YEARS = [2026] as const
/** 화면에서 고를 수는 있지만 비교는 보류하는 연도 (환산·산입 규정의 적용 여부 미확인). */
export const MINIMUM_WAGE_HELD_YEARS = [2027] as const

export type MinimumWageYearChoice =
  | typeof MINIMUM_WAGE_COMPARISON_YEARS[number]
  | typeof MINIMUM_WAGE_HELD_YEARS[number]

export function isSupportedComparisonYear(year: number): year is typeof MINIMUM_WAGE_COMPARISON_YEARS[number] {
  return (MINIMUM_WAGE_COMPARISON_YEARS as readonly number[]).includes(year)
}

/** 지원 연도의 시간급 최저임금. 연중 변동이 없는 연 단위 고시이므로 그 해 7월 1일로 조회한다. */
export function getComparisonMinimumWage(year: number): number {
  if (!isSupportedComparisonYear(year)) {
    throw new RangeError('해당 연도의 최저임금 비교는 지원하지 않습니다.')
  }
  return getMinimumHourlyWage(new Date(`${year}-07-01T00:00:00+09:00`))
}

/** 지원 연도의 최저임금 자료가 빠진 채 배포되는 것을 막는다. */
export function assertMinimumWageComparisonPolicy(): void {
  for (const year of MINIMUM_WAGE_COMPARISON_YEARS) {
    const wage = getComparisonMinimumWage(year)
    if (!Number.isSafeInteger(wage) || wage <= 0) {
      throw new RangeError(`${year}년 최저임금 자료를 확인하세요.`)
    }
  }
}
