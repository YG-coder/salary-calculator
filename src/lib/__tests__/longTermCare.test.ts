import { describe, expect, it } from 'vitest'
import { calculateLongTermCare } from '../insurancePremiums'
import { calculateSalary } from '../salary'
import { calculateSocialInsurance, calculatePayrollTax } from '../calculators'
import { calculateEmployerCost } from '../employerCost'

// 공단 2026 EDI 안내: 건강보험료 × 0.9448% / 7.19%.
// https://edi.nhis.or.kr/portal/images/popup/20251204_pop01longdesc.html
// 2026-10-14 공단 직장 모의계산 공개 조회의 실행 결과도 아래 4건과 일치했다.
// https://www.nhis.or.kr/nhis/minwon/retrieveJobCalcView.do
describe('장기요양보험 법정 비율과 10원 절사', () => {
  it.each([
    [1_391_000, 50_000, 6_570],
    [2_781_700, 100_000, 13_140],
    [5_563_300, 200_000, 26_280],
    [1_401_500, 50_380, 6_620],
  ])('과세 월급 %i원의 건강보험 %i원·장기요양 %i원은 모든 경로에서 같다', (monthlyGross, expectedHealth, expectedLongTerm) => {
    const salary = calculateSalary({ annualSalary: monthlyGross * 12, nonTaxable: 0, dependents: 1 })
    const social = calculateSocialInsurance({ monthlyGross })
    const payroll = calculatePayrollTax({ monthlyGross })
    const employer = calculateEmployerCost({ annualSalary: monthlyGross * 12, employerEmploymentRate: 0.0115, industrialAccidentRate: 0.007 })
    expect(salary.breakdown.healthInsurance).toBe(expectedHealth)
    expect(salary.breakdown.longTermCare).toBe(expectedLongTerm)
    expect(social.longTermCare).toBe(expectedLongTerm)
    expect(social.employerLongTerm).toBe(expectedLongTerm)
    expect(payroll.longTermCare).toBe(expectedLongTerm)
    expect(employer.employeeDeduction.longTermCare).toBe(expectedLongTerm)
    expect(employer.employerBurden.longTermCare).toBe(expectedLongTerm)
  })

  it('13.14%로 반올림하면 6,610원이지만 법정 비율로는 6,620원이다', () => {
    expect(calculateLongTermCare(50_380)).toBe(6_620)
  })

  it.each([[49_990, 6_560], [50_000, 6_570], [50_010, 6_570]])('건강보험 %i원은 장기요양 %i원으로 정상 절사한다', (health, expected) => {
    expect(calculateLongTermCare(health)).toBe(expected)
  })
})
