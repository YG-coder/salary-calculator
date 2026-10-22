import { describe, expect, it } from 'vitest'
import { calculateEmployeeHealthInsurance, calculateLongTermCare } from '../insurancePremiums'
import { HEALTH_PREMIUM_LIMITS, getHealthPremiumLimits } from '../constants'
import { calculateSalary } from '../salary'
import { calculateSocialInsurance, calculatePayrollTax } from '../calculators'
import { calculateEmployerCost } from '../employerCost'

// 독립 기준값: 보건복지부고시 제2025-222호(2026.1월분~) 직장가입자 보수월액보험료
// 상한 9,183,480원·하한 20,160원(근로자+사업주 합산), 일반 근로자 부담 50%.
// 구현을 호출하지 않고 BigInt 정수 산술로 기대값을 만든다.
const TOTAL_MAX = 9_183_480
const TOTAL_MIN = 20_160
const EMPLOYEE_MAX = TOTAL_MAX / 2 // 4,591,740
const EMPLOYEE_MIN = TOTAL_MIN / 2 // 10,080

function rateOnly(monthly: number): number {
  // 3.595% = 719/20000, 10원 미만 절사
  return Number((BigInt(monthly) * BigInt(719)) / BigInt(200_000)) * 10
}
function expectedHealth(monthly: number): number {
  if (monthly <= 0) return 0
  const byRate = rateOnly(monthly)
  return Math.min(Math.max(byRate, EMPLOYEE_MIN), EMPLOYEE_MAX)
}
function expectedLongTerm(health: number): number {
  // 건강보험료 × 0.9448% / 7.19%, 10원 미만 절사
  return Number((BigInt(health) * BigInt(9_448)) / BigInt(719_000)) * 10
}

describe('건강보험 보수월액보험료 상·하한 (보건복지부고시 제2025-222호)', () => {
  it('고시값을 그대로 보유한다', () => {
    expect(HEALTH_PREMIUM_LIMITS.totalMax).toBe(TOTAL_MAX)
    expect(HEALTH_PREMIUM_LIMITS.totalMin).toBe(TOTAL_MIN)
    expect(HEALTH_PREMIUM_LIMITS.employeeMax).toBe(EMPLOYEE_MAX)
    expect(HEALTH_PREMIUM_LIMITS.employeeMin).toBe(EMPLOYEE_MIN)
    expect(getHealthPremiumLimits(new Date('2026-06-30T00:00:00+09:00')).employeeMax).toBe(EMPLOYEE_MAX)
    expect(() => getHealthPremiumLimits(new Date('2027-01-01T00:00:00+09:00'))).toThrow(RangeError)
  })

  it.each([
    // [월 과세 급여, 기대 건강보험(근로자), 기대 장기요양, capped, floored]
    [0,           0,          0,        false, false], // 보수 없음: 하한 미부과
    [1,           10_080,     1_320,    false, true],
    [100_000,     10_080,     1_320,    false, true],
    [280_000,     10_080,     1_320,    false, true],  // 요율 10,060 → 하한
    [280_389,     10_080,     1_320,    false, true],  // 요율 10,070 → 하한
    [280_668,     10_090,     1_320,    false, false], // 요율 10,090 ≥ 하한
    [5_000_000,   179_750,    23_620,   false, false],
    [127_725_000, 4_591_710,  603_370,  false, false], // 상한 직전
    [127_726_000, 4_591_740,  603_370,  false, false], // 요율 = 상한 (정확한 경계)
    [127_726_100, 4_591_740,  603_370,  true,  false], // 요율 4,591,750 → 상한
    [200_000_000, 4_591_740,  603_370,  true,  false],
  ])('월 과세 급여 %i원 → 건강보험 %i원 / 장기요양 %i원', (monthly, health, longTerm, capped, floored) => {
    expect(expectedHealth(monthly)).toBe(health)
    expect(expectedLongTerm(health)).toBe(longTerm)
    const result = calculateEmployeeHealthInsurance(monthly)
    expect(result.amount).toBe(health)
    expect(result.capped).toBe(capped)
    expect(result.floored).toBe(floored)
    expect(calculateLongTermCare(result.amount)).toBe(longTerm)
  })

  it('0~1억 3천만원 구간의 997원 간격 표본에서 상·하한 적용 결과가 독립 기준과 같다', () => {
    for (let monthly = 0; monthly <= 130_000_000; monthly += 997) {
      const actual = calculateEmployeeHealthInsurance(monthly).amount
      const expected = expectedHealth(monthly)
      if (actual !== expected) throw new Error(`${monthly}원: 기대 ${expected}, 실제 ${actual}`)
    }
  }, 30_000)

  it('연봉 24억원·비과세 0원의 실수령액 계산에 상한이 반영된다 (건강 4,591,740 / 요양 603,370)', () => {
    const r = calculateSalary({ annualSalary: 2_400_000_000, nonTaxable: 0, dependents: 1 })
    expect(r.breakdown.healthInsurance).toBe(4_591_740)
    expect(r.breakdown.longTermCare).toBe(603_370)
    expect(r.flags.healthInsuranceCapped).toBe(true)
    expect(r.flags.healthInsuranceFloored).toBe(false)
    expect(r.breakdown.totalDeduction).toBe(
      r.breakdown.nationalPension + 4_591_740 + 603_370 + r.breakdown.employment + r.breakdown.incomeTax + r.breakdown.localTax,
    )
  })

  it('연봉 120만원(월 10만원)은 하한 10,080원으로 계산되고 플래그가 켜진다', () => {
    const r = calculateSalary({ annualSalary: 1_200_000, nonTaxable: 0, dependents: 1 })
    expect(r.breakdown.healthInsurance).toBe(10_080)
    expect(r.breakdown.longTermCare).toBe(1_320)
    expect(r.flags.healthInsuranceFloored).toBe(true)
  })

  it('비과세가 급여 전액이면 과세 보수 0원으로 건강보험 0원·하한 미부과', () => {
    const r = calculateSalary({ annualSalary: 2_400_000, nonTaxable: 200_000, dependents: 1 })
    expect(r.breakdown.healthInsurance).toBe(0)
    expect(r.breakdown.longTermCare).toBe(0)
    expect(r.flags.healthInsuranceFloored).toBe(false)
  })

  it('4대보험 계산기: 사업주 부담분도 같은 상한이 적용되고 합산이 고시 상한과 같다', () => {
    const r = calculateSocialInsurance({ monthlyGross: 200_000_000 })
    expect(r.healthInsurance).toBe(EMPLOYEE_MAX)
    expect(r.employerHealth).toBe(EMPLOYEE_MAX)
    expect(r.healthInsurance + r.employerHealth).toBe(TOTAL_MAX)
    expect(r.longTermCare).toBe(603_370)
    expect(r.employerLongTerm).toBe(603_370)
    expect(r.healthInsuranceCapped).toBe(true)
    const low = calculateSocialInsurance({ monthlyGross: 100_000 })
    expect(low.healthInsurance).toBe(EMPLOYEE_MIN)
    expect(low.employerHealth).toBe(EMPLOYEE_MIN)
    expect(low.healthInsuranceFloored).toBe(true)
  })

  it('급여 세금 계산기와 사업주 비용 계산기도 상한이 적용된 금액을 쓴다', () => {
    const payroll = calculatePayrollTax({ monthlyGross: 200_000_000, nonTaxable: 0, dependents: 1 })
    expect(payroll.healthInsurance).toBe(EMPLOYEE_MAX)
    const employer = calculateEmployerCost({
      annualSalary: 2_400_000_000,
      employerEmploymentRate: 0.0115,
      industrialAccidentRate: 0.007,
    })
    expect(employer.employerBurden.healthInsurance).toBe(EMPLOYEE_MAX)
    expect(employer.employerBurden.longTermCare).toBe(603_370)
  })
})
