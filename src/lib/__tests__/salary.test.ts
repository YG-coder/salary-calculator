import { describe, expect, it } from 'vitest'
import { calculateSalary } from '../salary'
import { calculateSocialInsurance, calculatePayrollTax } from '../calculators'
import { calculateEmployerCost } from '../employerCost'
import { calculateNationalPension } from '../pension'

describe('국민연금 천원 미만 절사 고정값', () => {
  it('상한 없는 설명용 금액도 같은 천원·10원 절사 규칙을 적용한다', () => {
    expect(calculateNationalPension(6_591_999)).toEqual({ amount: 313_020, uncappedAmount: 313_070, capped: true, floored: false })
  })
  it.each([
    [0, 19_470],
    [410_999, 19_470],
    [3_000_999, 142_500],
    [3_966_666, 188_380],
    [6_590_999, 313_020],
    [6_591_000, 313_020],
  ])('월 과세 급여 %i원은 근로자·사업주 각각 %i원이다', (monthlyTaxable, expected) => {
    const annualSalary = (monthlyTaxable + 200_000) * 12
    const salary = calculateSalary({ annualSalary, nonTaxable: 200_000, dependents: 1 })
    const social = calculateSocialInsurance({ monthlyGross: monthlyTaxable + 200_000, nonTaxable: 200_000 })
    const payroll = calculatePayrollTax({ monthlyGross: monthlyTaxable + 200_000, nonTaxable: 200_000, dependents: 1 })
    const employer = calculateEmployerCost({ annualSalary, nonTaxable: 200_000, employerEmploymentRate: 0.0115, industrialAccidentRate: 0.007 })
    expect(salary.breakdown.nationalPension).toBe(expected)
    expect(social.nationalPension).toBe(expected)
    expect(social.employerPension).toBe(expected)
    expect(payroll.nationalPension).toBe(expected)
    expect(employer.employeeDeduction.nationalPension).toBe(expected)
    expect(employer.employerBurden.nationalPension).toBe(expected)
  })

  it('연봉을 월 환산한 뒤 비과세를 빼고 천원 미만을 버린다', () => {
    const result = calculateSalary({ annualSalary: 50_000_000, nonTaxable: 200_000, dependents: 1 })
    expect(result.monthlyGross).toBe(4_166_666)
    expect(result.breakdown.nationalPension).toBe(188_380)
    expect(result.breakdown.healthInsurance).toBe(142_600)
    // 3,966,666 × 0.009 = 35,699.994 → 10원 미만 절사.
    expect(result.breakdown.employment).toBe(35_690)
    const { totalDeduction, ...items } = result.breakdown
    expect(totalDeduction).toBe(Object.values(items).reduce((sum, value) => sum + value, 0))
    expect(result.monthlyNet + totalDeduction).toBe(result.monthlyGross)
    expect(result.annualNet).toBe(result.monthlyNet * 12)
    expect(result.annualDeduction).toBe(totalDeduction * 12)
  })

  it('상반기·하반기 상한 변경은 명시한 기준일대로 적용한다', () => {
    const input = { annualSalary: 120_000_000, nonTaxable: 0, dependents: 1 }
    expect(calculateSalary(input, new Date('2026-06-30T14:59:59Z')).breakdown.nationalPension).toBe(302_570)
    expect(calculateSalary(input, new Date('2026-06-30T15:00:00Z')).breakdown.nationalPension).toBe(313_020)
  })

  it('천원 절사 후에 상한을 넘을 때만 상한 초과 플래그가 켜진다', () => {
    const input = { annualSalary: 6_590_999 * 12, nonTaxable: 0, dependents: 1 }
    expect(calculateSalary(input).flags.pensionCapped).toBe(false)
    expect(calculateSalary({ ...input, annualSalary: 6_591_000 * 12 }).flags.pensionCapped).toBe(true)
  })
})
