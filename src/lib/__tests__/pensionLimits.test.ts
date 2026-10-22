import { describe, expect, it } from 'vitest'
import { calculateNationalPension } from '../pension'
import { calculateSalary } from '../salary'
import { getPensionLimits, getPensionRate, TAX_YEAR_AS_OF } from '../constants'

/**
 * 국민연금 기준소득월액 하한·상한 경계 (8차).
 * 기대값은 구현을 호출하지 않고 손으로 적는다: 2026.7.1~2027.6.30 하한 410,000원·상한 6,590,000원(국민연금법 시행령·보건복지부 고시),
 * 근로자 요율 4.75%, 소득월액 천원 미만 절사 → 상·하한 → 보험료 10원 미만 절사.
 *   410,000 × 4.75% = 19,475 → 19,470 / 6,590,000 × 4.75% = 313,025 → 313,020.
 */
describe('국민연금 기준소득월액 하한 경계', () => {
  it('기준일의 하한·상한·요율은 2026.7.1~2027.6.30 값이다', () => {
    expect(getPensionLimits(TAX_YEAR_AS_OF)).toEqual({ min: 410_000, max: 6_590_000, label: '2026.7.1~2027.6.30' })
    expect(getPensionRate(TAX_YEAR_AS_OF)).toBe(0.0475)
  })

  it.each([
    // [월 과세소득, 기대 보험료, floored, capped]
    [0, 19_470, true, false],            // 과세 0원도 하한 기준으로 계산(기존 동작)
    [1, 19_470, true, false],
    [409_999, 19_470, true, false],      // 천원 절사 409,000 < 하한
    [410_000, 19_470, false, false],     // 하한과 같음 → 요율 그대로, 하한 '적용' 아님
    [410_999, 19_470, false, false],     // 천원 절사 410,000 = 하한
    [411_000, 19_520, false, false],     // 411,000 × 4.75% = 19,522.5 → 19,520
    [6_590_999, 313_020, false, false],  // 천원 절사 6,590,000 = 상한
    [6_591_000, 313_020, false, true],   // 상한 초과
  ])('월 과세소득 %i원 → %i원 (하한 %s · 상한 %s)', (monthly, expected, floored, capped) => {
    const r = calculateNationalPension(monthly, TAX_YEAR_AS_OF)
    expect(r.amount).toBe(expected)
    expect(r.floored).toBe(floored)
    expect(r.capped).toBe(capped)
    expect(r.floored && r.capped).toBe(false)
  })

  it('calculateSalary 플래그: 하한 미달·같음·초과', () => {
    // 비과세 0 → 월 과세소득 = floor(연봉/12)
    const below = calculateSalary({ annualSalary: 409_999 * 12, nonTaxable: 0, dependents: 1 })
    expect(below.flags.pensionFloored).toBe(true)
    expect(below.flags.pensionCapped).toBe(false)
    expect(below.breakdown.nationalPension).toBe(19_470)

    const equal = calculateSalary({ annualSalary: 410_000 * 12, nonTaxable: 0, dependents: 1 })
    expect(equal.flags.pensionFloored).toBe(false)
    expect(equal.breakdown.nationalPension).toBe(19_470)

    const above = calculateSalary({ annualSalary: 411_000 * 12, nonTaxable: 0, dependents: 1 })
    expect(above.flags.pensionFloored).toBe(false)
    expect(above.breakdown.nationalPension).toBe(19_520)

    // 비과세가 급여 전체를 덮어 과세 0원 → 하한 기준(기존 동작 유지)
    const zero = calculateSalary({ annualSalary: 2_400_000, nonTaxable: 200_000, dependents: 1 })
    expect(zero.flags.pensionFloored).toBe(true)
    expect(zero.breakdown.nationalPension).toBe(19_470)
  })
})
