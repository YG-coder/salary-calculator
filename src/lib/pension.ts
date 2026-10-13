import { getPensionLimits, getPensionRate, TAX_YEAR_AS_OF } from './constants'

/** 신고 소득월액의 천원 미만 절사 → 상·하한 → 근로자 보험료 10원 미만 절사. */
export function calculateNationalPension(monthlyTaxable: number, asOfDate: Date = TAX_YEAR_AS_OF) {
  const limits = getPensionLimits(asOfDate)
  const roundedIncome = Math.floor(monthlyTaxable / 1_000) * 1_000
  const base = Math.min(Math.max(roundedIncome, limits.min), limits.max)
  return {
    amount: Math.floor(base * getPensionRate(asOfDate) / 10) * 10,
    capped: roundedIncome > limits.max,
  }
}
