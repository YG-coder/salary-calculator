import { describe, expect, it } from 'vitest'
import { calculateSalary } from '../salary'
import { calculateSocialInsurance, calculatePayrollTax } from '../calculators'
import { calculateEmployerCost } from '../employerCost'
import { calculateBonusWithholding } from '../bonusWithholding'

describe('근로자 고용보험료 정수 절사', () => {
  // 0.9% = 9/1000. 정확한 10원 경계와 경계 직전/직후를 따로 고정한다.
  it.each([
    [0, 0],
    [3_499_999, 31_490],
    [3_500_000, 31_500],
    [3_500_001, 31_500],
    [7_000_000, 63_000],
  ])('과세 보수 %i원의 근로자 부담은 %i원이다', (amount, expected) => {
    const salaryInput = { annualSalary: (amount + 200_000) * 12, nonTaxable: 200_000, dependents: 1 }
    expect(calculateSalary(salaryInput).breakdown.employment).toBe(expected)
    expect(calculateSocialInsurance({ monthlyGross: amount + 200_000, nonTaxable: 200_000 }).employment).toBe(expected)
    expect(calculatePayrollTax({ monthlyGross: amount + 200_000, nonTaxable: 200_000 }).employment).toBe(expected)
    expect(calculateEmployerCost({ ...salaryInput, employerEmploymentRate: 0.0115, industrialAccidentRate: 0.007 }).employeeDeduction.employment).toBe(expected)
    expect(calculateBonusWithholding({ bonusAmount: amount, monthlyPay: 0, dependents: 1, periodType: 'withPeriod', periodMonths: 1, prepaidTax: 0 }).employmentInsurance).toBe(expected)
  })
})
