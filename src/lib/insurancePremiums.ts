import { RATES, getHealthPremiumLimits, type HealthPremiumLimits } from './constants'
import { TAX_YEAR_AS_OF } from './policyYear'
import { createFloor10Rate } from './rateMath'
import { getLongTermCareRate, LONG_TERM_CARE_RATE_PERIODS } from './policy/annualRates'

// ── 저수준 요율 산술 (제도 상·하한 없음) ──────────────────────────
/**
 * 보수에 건강보험 근로자 요율(3.595%)을 적용해 10원 미만을 버린다.
 * 상·하한을 적용하지 않는 순수 요율 산술이므로 보험료 결정에는 calculateEmployeeHealthInsurance를 쓴다.
 */
export const applyHealthInsuranceRate = createFloor10Rate(RATES.healthInsurance)
export const calculateEmployeeEmploymentInsurance = createFloor10Rate(RATES.employment)
export const calculateLocalTax = createFloor10Rate(RATES.localTax)

const longTermCareCalculators = new Map(LONG_TERM_CARE_RATE_PERIODS.map(period => [
  period.startDate, createFloor10Rate(period.healthPremiumNumerator, period.healthPremiumDenominator),
]))

/** 상·하한 적용 후 건강보험료에 월분별 비율을 적용한다. 2026년 기존 산식 유지, 2027년 건보료 대비 13.90%. */
export function calculateLongTermCare(healthPremium: number, asOfDate: Date = TAX_YEAR_AS_OF): number {
  const period = getLongTermCareRate(asOfDate)
  return longTermCareCalculators.get(period.startDate)!(healthPremium)
}

// ── 도메인 보험료: 직장가입자 보수월액보험료 (근로자 부담분) ─────────
export interface EmployeeHealthInsurance {
  /** 근로자 부담 월 건강보험료 (상·하한 적용 후) */
  amount: number
  /** 요율대로 계산한 금액이 월 상한을 넘어 상한으로 고정됨 */
  capped: boolean
  /** 요율대로 계산한 금액이 월 하한에 못 미쳐 하한으로 올림 */
  floored: boolean
  /** 상·하한을 적용하기 전 요율 산술 금액 (안내용) */
  uncappedAmount: number
  /** 적용한 상·하한 */
  limits: HealthPremiumLimits
}

/**
 * 일반 직장가입자의 월 건강보험료 근로자 부담분.
 * 보수월액(월 과세 급여)에 3.595%를 적용해 10원 미만을 버린 뒤, 보건복지부 고시의
 * 보수월액보험료 상·하한(근로자+사업주 합산)의 50%로 상·하한을 적용한다.
 *
 * 지원 범위: 경감·면제가 없는 일반 직장가입자. 보수가 0원 이하이면 보수월액보험료
 * 대상 보수가 없는 것으로 보아 0원을 돌려주고 하한을 부과하지 않는다. 휴직 등 경감·면제,
 * 가입 제외, 둘 이상 사업장의 합산은 계산하지 않는다.
 */
export function calculateEmployeeHealthInsurance(
  monthlyTaxable: number,
  asOfDate: Date = TAX_YEAR_AS_OF,
): EmployeeHealthInsurance {
  const limits = getHealthPremiumLimits(asOfDate)
  if (!(monthlyTaxable > 0)) {
    return { amount: 0, capped: false, floored: false, uncappedAmount: 0, limits }
  }
  const uncappedAmount = applyHealthInsuranceRate(monthlyTaxable)
  if (uncappedAmount > limits.employeeMax) {
    return { amount: limits.employeeMax, capped: true, floored: false, uncappedAmount, limits }
  }
  if (uncappedAmount < limits.employeeMin) {
    return { amount: limits.employeeMin, capped: false, floored: true, uncappedAmount, limits }
  }
  return { amount: uncappedAmount, capped: false, floored: false, uncappedAmount, limits }
}
