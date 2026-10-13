import { afterEach, describe, expect, it, vi } from 'vitest'
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from 'next/constants'
import config from '../../../next.config'
import { TAX_YEAR_AS_OF, assertCalculationDate, assertPolicyFresh } from '../policyYear'
import { getPensionLimits, getPensionRate, PENSION_LIMITS } from '../constants'
import { calculateSalary } from '../salary'
import { calculatePayrollTax, calculateSocialInsurance } from '../calculators'
import { calcSimplifiedWithholdingTax } from '../incomeTax'
import { calculateReverseSalary } from '../reverseSalary'
import { compareSalaries } from '../salaryComparison'
import { calculateEmployerCost } from '../employerCost'
import { calculateBonusWithholding } from '../bonusWithholding'
import { buildSalaryPageData } from '../salaryPageData'

afterEach(() => vi.useRealTimers())

const salary = { annualSalary: 50_000_000, nonTaxable: 200_000, dependents: 2, childCount8to20: 1 }
const engines: [string, (date?: Date) => unknown][] = [
  ['실수령액', date => calculateSalary(salary, date)],
  ['급여 세금', date => calculatePayrollTax({ monthlyGross: 4_166_666, nonTaxable: 200_000, dependents: 2, childCount8to20: 1 }, date)],
  ['사회보험', date => calculateSocialInsurance({ monthlyGross: 4_166_666, nonTaxable: 200_000 }, date)],
  ['간이세액표', date => calcSimplifiedWithholdingTax({ monthlyTaxable: 2_830_000, dependents: 2, childCount8to20: 1 }, date)],
  ['역산', date => calculateReverseSalary({ targetMonthlyNet: 3_000_000, nonTaxable: 200_000 }, date)],
  ['연봉 비교', date => compareSalaries({ annualSalaryA: 50_000_000, annualSalaryB: 60_000_000, nonTaxable: 200_000, dependents: 2, childCount8to20: 1 }, date)],
  ['기업 비용', date => calculateEmployerCost({ ...salary, employerEmploymentRate: 0.0115, industrialAccidentRate: 0.007 }, date)],
  ['상여금', date => calculateBonusWithholding({ bonusAmount: 1_000_000, periodType: 'withPeriod', periodMonths: 1, monthlyPay: 2_830_000, dependents: 2, childCount8to20: 1 }, date)],
  ['연봉 정적 페이지', date => buildSalaryPageData(5000, date)],
]

describe('계산 정책 기준일', () => {
  it.each(engines)('%s 기본 계산은 실제 날짜가 바뀌어도 같은 기준일을 사용한다', (_name, calculate) => {
    const expected = calculate(TAX_YEAR_AS_OF)
    vi.useFakeTimers()
    for (const now of ['2026-01-01T00:00:00+09:00', '2027-01-01T00:00:00+09:00', '2027-07-01T00:00:00+09:00']) {
      vi.setSystemTime(new Date(now))
      expect(calculate()).toEqual(expected)
      expect(getPensionRate()).toBe(0.0475)
      expect(getPensionLimits()).toEqual(PENSION_LIMITS)
    }
  })

  it.each(engines)('%s는 명시적으로 다른 연도의 계산을 요청하면 거부한다', (_name, calculate) => {
    expect(() => calculate(new Date('2027-01-01T00:00:00+09:00'))).toThrow('2026년 정책 데이터')
  })

  it('급여 계산 기준연도의 시작·종료는 한국시간이다', () => {
    expect(() => assertCalculationDate(new Date('2025-12-31T15:00:00Z'))).not.toThrow()
    expect(() => assertCalculationDate(new Date('2026-12-31T14:59:59.999Z'))).not.toThrow()
    expect(() => assertCalculationDate(new Date('2025-12-31T14:59:59.999Z'))).toThrow()
    expect(() => assertCalculationDate(new Date('2026-12-31T15:00:00Z'))).toThrow()
    expect(() => assertCalculationDate(new Date('invalid'))).toThrow()
  })

  it('한국시간 새해가 되면 실제 Next 프로덕션 빌드 설정이 실패한다', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-12-31T14:59:59.999Z'))
    expect(() => config(PHASE_PRODUCTION_BUILD)).not.toThrow()
    vi.setSystemTime(new Date('2026-12-31T15:00:00Z'))
    expect(() => config(PHASE_PRODUCTION_BUILD)).toThrow('계산 정책 갱신 필요')
    expect(() => config(PHASE_DEVELOPMENT_SERVER)).not.toThrow()
    expect(() => assertPolicyFresh(new Date('2026-01-01T00:00:00+09:00'))).not.toThrow()
  })

  it('명시한 2026년 날짜의 자녀공제 시행일 경계는 유지한다', () => {
    const input = { monthlyTaxable: 2_830_000, dependents: 2, childCount8to20: 1 }
    expect(calcSimplifiedWithholdingTax(input, new Date('2026-02-28T14:59:59Z'))).toBe(29_370)
    expect(calcSimplifiedWithholdingTax(input, new Date('2026-02-28T15:00:00Z'))).toBe(21_040)
    expect(calcSimplifiedWithholdingTax(input)).toBe(21_040)
  })
})

describe('국민연금 상·하한 데이터 적용기간', () => {
  it.each([
    ['2026-06-30T14:59:59.999Z', 400_000, 6_370_000],
    ['2026-06-30T15:00:00Z', 410_000, 6_590_000],
    ['2027-06-30T14:59:59.999Z', 410_000, 6_590_000],
  ])('%s의 고시값을 조회한다', (date, min, max) => {
    expect(getPensionLimits(new Date(date))).toMatchObject({ min, max })
  })
  it.each(['2025-06-30T14:59:59.999Z', '2027-06-30T15:00:00Z', 'invalid'])('%s에 예전 고시값을 재사용하지 않는다', date => {
    expect(() => getPensionLimits(new Date(date))).toThrow('상·하한 데이터가 없습니다')
  })
})
