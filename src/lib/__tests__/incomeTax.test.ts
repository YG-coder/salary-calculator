import { describe, expect, it } from 'vitest'
import { calcSimplifiedWithholdingTax } from '../incomeTax'
import { calculateSalary } from '../salary'
import { calculatePayrollTax } from '../calculators'
import { calculateEmployerCost } from '../employerCost'
import { calculateBonusWithholding } from '../bonusWithholding'
import official from './fixtures/income-tax-official-2026.json'

// 정답은 구현 데이터/계산 함수에서 생성하지 않는다.
// 공식 PDF 2·4·7·13·14·17·27페이지에서 독립적으로 옮긴 원 단위 세액이다.
const tableCases = official.rows.flatMap(row => row.taxByFamily.map((expected, index) => ({
  monthly: row.minMonthly,
  upper: row.maxMonthlyExclusive,
  dependents: index + 1,
  expected,
})))

describe('공식 간이세액표 고정값 (100% 원천징수)', () => {
  it.each(tableCases)('월 $monthly~$upper원 구간·가족 $dependents명은 $expected원', ({ monthly, upper, dependents, expected }) => {
    for (const monthlyTaxable of [monthly, Math.floor((monthly + upper) / 2), upper - 1]) {
      expect(calcSimplifiedWithholdingTax({ monthlyTaxable, dependents })).toBe(expected)
    }
  })

  it.each(official.at10m.taxByFamily.map((expected, index) => ({ dependents: index + 1, expected })))('정확히 월 1천만원·가족 $dependents명은 $expected원', ({ dependents, expected }) => {
    expect(calcSimplifiedWithholdingTax({ monthlyTaxable: 10_000_000, dependents })).toBe(expected)
  })

  it('다음 구간의 시작일 때 이전 구간 값을 재사용하지 않는다', () => {
    expect(calcSimplifiedWithholdingTax({ monthlyTaxable: 2_839_999, dependents: 1 })).toBe(59_370)
    expect(calcSimplifiedWithholdingTax({ monthlyTaxable: 2_840_000, dependents: 1 })).toBe(60_230)
  })

  it('표 최저 구간 미만은 0원이다', () => {
    expect(calcSimplifiedWithholdingTax({ monthlyTaxable: 769_999, dependents: 1 })).toBe(0)
  })
})

describe('월 1천만원 초과 공식 산식의 고정값', () => {
  // 별표 2 PDF 27페이지 산식에 원 단위 Decimal로 대입하고 10원 미만을 버린 값.
  // 런타임 테스트에서는 구현 산식을 복제하거나 정답을 다시 계산하지 않는다.
  it.each([
    [10_000_001, 1_532_400],
    [10_000_029, 1_532_400],
    [13_999_999, 2_904_390],
    [14_000_000, 2_904_400],
    [14_000_001, 2_904_400],
    [14_000_027, 2_904_410],
    [27_999_999, 8_117_990],
    [28_000_000, 8_118_000],
    [28_000_001, 8_118_000],
    [29_999_999, 8_901_990],
    [30_000_000, 8_902_000],
    [30_000_001, 8_902_000],
    [44_999_999, 14_901_990],
    [45_000_000, 14_902_000],
    [45_000_001, 14_902_000],
    [86_999_999, 32_541_990],
    [87_000_000, 32_542_000],
    [87_000_001, 32_542_000],
    [90_000_000, 33_892_000],
  ])('월 %i원·가족 1명은 %i원', (monthlyTaxable, expected) => {
    expect(calcSimplifiedWithholdingTax({ monthlyTaxable, dependents: 1 })).toBe(expected)
  })
})

describe('공식 자녀공제와 가족 수 보정', () => {
  // 공식 PDF 1페이지 공제액. NTS 사례의 3,500천원·4명·자녀 2명은
  // 개정 전 20,180원, 2026.3.1 이후 49,340 - 45,830 = 3,510원이다.
  it.each([
    [3_500_000, 3, 1, 41_630],
    [3_500_000, 4, 2, 3_510],
    [3_500_000, 4, 3, 0],
    [5_000_000, 5, 3, 121_190],
    [5_000_000, 5, 4, 87_860],
    [5_000_000, 1, 1, 335_470],
    [5_000_000, 2, 99, 285_880],
    [5_000_000, 3, 99, 192_020],
  ])('월 %i원·가족 %i명·자녀 %i명은 %i원', (monthlyTaxable, dependents, childCount8to20, expected) => {
    expect(calcSimplifiedWithholdingTax({ monthlyTaxable, dependents, childCount8to20 })).toBe(expected)
  })

  it('NTS 사례의 개정 전 값과 한국시간 시행일의 새 값을 구분한다', () => {
    const input = { monthlyTaxable: 3_500_000, dependents: 4, childCount8to20: 2 }
    expect(calcSimplifiedWithholdingTax(input, new Date('2026-02-28T14:59:59.999Z'))).toBe(20_180)
    expect(calcSimplifiedWithholdingTax(input, new Date('2026-02-28T15:00:00Z'))).toBe(3_510)
  })

  // PDF 2페이지: 11명 세액 - (10명 세액 - 11명 세액) × 초과 인원.
  it.each([
    [3_500_000, 12, 7_270],
    [3_500_000, 13, 3_900],
    [3_500_000, 14, 530],
    [3_500_000, 15, 0],
    [10_000_000, 12, 930_840],
    [14_000_000, 12, 2_327_840],
  ])('월 %i원·가족 %i명에 11명 초과 규칙을 적용해 %i원', (monthlyTaxable, dependents, expected) => {
    expect(calcSimplifiedWithholdingTax({ monthlyTaxable, dependents })).toBe(expected)
  })
})

describe('공식 세액이 급여 계산 결과까지 전달된다', () => {
  it('연봉과 급여 세금은 비과세를 뺀 월급 기준 소득세·지방세를 표시한다', () => {
    const salary = calculateSalary({ annualSalary: 44_400_000, nonTaxable: 200_000, dependents: 4, childCount8to20: 2 })
    const payroll = calculatePayrollTax({ monthlyGross: 3_700_000, nonTaxable: 200_000, dependents: 4, childCount8to20: 2 })
    expect(salary.breakdown.incomeTax).toBe(3_510)
    expect(salary.breakdown.localTax).toBe(350)
    expect(salary.breakdown.employment).toBe(31_500)
    expect(salary.breakdown.totalDeduction).toBe(343_960)
    expect(salary.monthlyNet).toBe(3_356_040)
    expect(payroll.incomeTax).toBe(3_510)
    expect(payroll.localTax).toBe(350)
  })

  it('기업 비용의 근로자 공제에도 같은 공식값을 적용한다', () => {
    const result = calculateEmployerCost({ annualSalary: 44_400_000, nonTaxable: 200_000, dependents: 4, childCount8to20: 2, employerEmploymentRate: 0.0115, industrialAccidentRate: 0.007 })
    expect(result.employeeDeduction.incomeTax).toBe(3_510)
    expect(result.employeeDeduction.localTax).toBe(350)
  })

  it('상여금은 월환산액에 대해 공식 간이세액표를 조회한다', () => {
    const result = calculateBonusWithholding({ bonusAmount: 1_000_000, monthlyPay: 2_500_000, dependents: 4, childCount8to20: 2, periodType: 'withPeriod', periodMonths: 1, prepaidTax: 0 })
    expect(result.monthlyTaxOnConverted).toBe(3_510)
    expect(result.incomeTax).toBe(3_510)
    expect(result.localTax).toBe(350)
  })
})
