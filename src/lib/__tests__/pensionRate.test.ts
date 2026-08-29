import { describe, expect, it } from 'vitest'
import { calculateSocialInsurance } from '../calculators'
import { getPensionRate, PENSION_RATE_PERIODS } from '../constants'
import { calculateSalary } from '../salary'

const at = (year: number) => new Date(`${year}-01-01T00:00:00+09:00`)

describe('국민연금 사업장가입자 부담률 법정 스케줄', () => {
  it.each([
    [2025, 0.045],
    [2026, 0.0475],
    [2027, 0.05],
    [2028, 0.0525],
    [2029, 0.055],
    [2030, 0.0575],
    [2031, 0.06],
    [2032, 0.0625],
    [2033, 0.065],
    [2040, 0.065],
  ])('%i년 근로자·사용자 각각 %f', (year, expected) => {
    expect(getPensionRate(at(year))).toBe(expected)
  })

  it('스케줄은 연도 오름차순이며 부담률이 감소하지 않는다', () => {
    for (let i = 1; i < PENSION_RATE_PERIODS.length; i += 1) {
      expect(PENSION_RATE_PERIODS[i].effectiveYear).toBeGreaterThan(
        PENSION_RATE_PERIODS[i - 1].effectiveYear,
      )
      expect(PENSION_RATE_PERIODS[i].employeeRate).toBeGreaterThanOrEqual(
        PENSION_RATE_PERIODS[i - 1].employeeRate,
      )
    }
  })

  it('Vercel의 UTC 환경에서도 한국시간 1월 1일 경계에 새 요율로 전환한다', () => {
    expect(getPensionRate(new Date('2026-12-31T14:59:59Z'))).toBe(0.0475)
    expect(getPensionRate(new Date('2026-12-31T15:00:00Z'))).toBe(0.05)
  })
})

describe('공통 급여 엔진의 국민연금 요율 적용', () => {
  const input = { annualSalary: 36_000_000, nonTaxable: 0, dependents: 1 }

  it('2026년 기존 결과 4.75%를 유지한다', () => {
    expect(calculateSalary(input, at(2026)).breakdown.nationalPension).toBe(142_500)
  })

  it('2027년부터 5.00%를 자동 적용한다', () => {
    expect(calculateSalary(input, at(2027)).breakdown.nationalPension).toBe(150_000)
  })

  it('사회보험 계산기의 근로자·사용자 부담에 같은 연도별 요율을 적용한다', () => {
    const result = calculateSocialInsurance({ monthlyGross: 3_000_000 }, at(2033))
    expect(result.nationalPension).toBe(195_000)
    expect(result.employerPension).toBe(195_000)
  })
})
