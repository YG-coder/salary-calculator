import { getPensionLimits, getPensionRate, TAX_YEAR_AS_OF } from './constants'

/** 신고 소득월액의 천원 미만 절사 → 상·하한 → 근로자 보험료 10원 미만 절사. */
export function calculateNationalPension(monthlyTaxable: number, asOfDate: Date = TAX_YEAR_AS_OF) {
  const limits = getPensionLimits(asOfDate)
  const roundedIncome = Math.floor(monthlyTaxable / 1_000) * 1_000
  const base = Math.min(Math.max(roundedIncome, limits.min), limits.max)
  const rate = getPensionRate(asOfDate)
  return {
    amount: Math.floor(base * rate / 10) * 10,
    /** 콘텐츠에서 상·하한이 없는 경우와 비교하기 위한 금액. 실제 공제액은 amount이다. */
    uncappedAmount: Math.floor(roundedIncome * rate / 10) * 10,
    capped: roundedIncome > limits.max,
  }
}
