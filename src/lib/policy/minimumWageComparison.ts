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

/**
 * 최저임금 비교를 지원하는 적용 연도. 최저시급은 기간별 정책 자료(annualRates)에서만 가져온다.
 * 2027년은 최종 고시(고용노동부고시 제2026-60호, 2026-08-05)의 금액·적용기간·월 209시간
 * 기준을 확인한 뒤 추가했다. 근거와 남은 미확인 범위: docs/wage-converter.md
 */
export const MINIMUM_WAGE_COMPARISON_YEARS = [2026, 2027] as const
/** 화면에서 고를 수는 있지만 비교는 보류하는 연도. 현재 없음. */
export const MINIMUM_WAGE_HELD_YEARS: readonly number[] = []

/**
 * 고시에 적힌 월 환산액(주 소정근로 40시간·월 209시간 기준). 최저시급을 정하는 값이 아니라,
 * 정책 자료의 시급 × 209시간이 고시 금액과 맞는지 대조하는 검사용이다.
 * 출처: 최저임금위원회 연도별 최저임금 결정현황.
 */
export const OFFICIAL_MONTHLY_EQUIVALENT: Record<typeof MINIMUM_WAGE_COMPARISON_YEARS[number], number> = {
  2026: 2_156_880,
  2027: 2_236_300,
}

export type MinimumWageYearChoice = typeof MINIMUM_WAGE_COMPARISON_YEARS[number]

export function isSupportedComparisonYear(year: number): year is typeof MINIMUM_WAGE_COMPARISON_YEARS[number] {
  return (MINIMUM_WAGE_COMPARISON_YEARS as readonly number[]).includes(year)
}

/** 지원 연도의 시간급 최저임금. 고시가 1월 1일~12월 31일 연 단위이므로 그 해 7월 1일로 조회한다. */
export function getComparisonMinimumWage(year: number): number {
  if (!isSupportedComparisonYear(year)) {
    throw new RangeError('해당 연도의 최저임금 비교는 지원하지 않습니다.')
  }
  return getMinimumHourlyWage(new Date(`${year}-07-01T00:00:00+09:00`))
}

/** 지원 연도의 최저임금 자료가 빠진 채 배포되는 것을 막는다. */
export function assertMinimumWageComparisonPolicy(): void {
  for (const year of MINIMUM_WAGE_COMPARISON_YEARS) {
    // 정책 자료가 없으면 여기서 RangeError가 난다.
    const wage = getComparisonMinimumWage(year)
    if (!Number.isSafeInteger(wage) || wage <= 0) {
      throw new RangeError(`${year}년 최저임금 자료를 확인하세요.`)
    }
    // 연초·연말에도 같은 금액이어야 하고, 시급 × 209시간이 고시의 월 환산액과 맞아야 한다.
    const first = getMinimumHourlyWage(new Date(`${year}-01-01T00:00:00+09:00`))
    const last = getMinimumHourlyWage(new Date(`${year}-12-31T23:59:59+09:00`))
    if (first !== wage || last !== wage || wage * STANDARD_MONTHLY_HOURS !== OFFICIAL_MONTHLY_EQUIVALENT[year]) {
      throw new RangeError(`${year}년 최저임금 자료가 고시의 적용기간·월 환산액과 맞지 않습니다.`)
    }
  }
}
