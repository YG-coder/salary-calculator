import { getPensionLimits, getPensionRate, PENSION_RATE_PERIODS, TAX_YEAR_AS_OF } from './constants'
import { createFloor10Rate } from './rateMath'

const contributions = new Map(PENSION_RATE_PERIODS.map(period => [period.employeeRate, createFloor10Rate(period.employeeRate)]))

/** 신고 소득월액의 천원 미만 절사 → 상·하한 → 근로자 보험료 10원 미만 절사. */
export function calculateNationalPension(monthlyTaxable: number, asOfDate: Date = TAX_YEAR_AS_OF) {
  const limits = getPensionLimits(asOfDate)
  const roundedIncome = Math.floor(monthlyTaxable / 1_000) * 1_000
  const base = Math.min(Math.max(roundedIncome, limits.min), limits.max)
  const rate = getPensionRate(asOfDate)
  const contribution = contributions.get(rate)!
  return {
    amount: contribution(base),
    /** 콘텐츠에서 상·하한이 없는 경우와 비교하기 위한 금액. 실제 공제액은 amount이다. */
    uncappedAmount: contribution(roundedIncome),
    capped: roundedIncome > limits.max,
    /** 천원 미만 절사한 소득월액이 기준소득월액 하한에 못 미쳐 하한을 기준으로 계산함(하한과 같으면 false). */
    floored: roundedIncome < limits.min,
  }
}
