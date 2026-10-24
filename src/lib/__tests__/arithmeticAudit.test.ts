import { describe, expect, it } from 'vitest'
import { calcSimplifiedWithholdingTax } from '../incomeTax'
import { calculateSalary } from '../salary'
import { calculateBonusWithholding } from '../bonusWithholding'
import { calculateSeverancePay, calculateWeeklyHolidayPay } from '../calculators'
import { SIMPLIFIED_TAX_TABLE_2026_AT_10M } from '../data/simplifiedTaxTable2026'

/** 독립 기준: 간이세액표 1천만원 초과 산식을 만분율 정수로 계산해 10원 미만 절사 (공제대상가족 1명) */
function expectedHighIncomeTax(monthlyWon: number): number {
  const base = BigInt(SIMPLIFIED_TAX_TABLE_2026_AT_10M[0])
  const m = BigInt(monthlyWon)
  const k = (won: number) => BigInt(won)
  let scaled: bigint
  if (monthlyWon <= 14_000_000) scaled = (base + k(25_000)) * k(10_000) + (m - k(10_000_000)) * k(98 * 35)
  else if (monthlyWon <= 28_000_000) scaled = (base + k(1_397_000)) * k(10_000) + (m - k(14_000_000)) * k(98 * 38)
  else if (monthlyWon <= 30_000_000) scaled = (base + k(6_610_600)) * k(10_000) + (m - k(28_000_000)) * k(98 * 40)
  else if (monthlyWon <= 45_000_000) scaled = (base + k(7_394_600)) * k(10_000) + (m - k(30_000_000)) * k(4_000)
  else if (monthlyWon <= 87_000_000) scaled = (base + k(13_394_600)) * k(10_000) + (m - k(45_000_000)) * k(4_200)
  else scaled = (base + k(31_034_600)) * k(10_000) + (m - k(87_000_000)) * k(4_500)
  return Number(scaled / k(100_000)) * 10
}

describe('근로소득 간이세액 — 1천만원 초과 산식의 10원 미만 절사 경계', () => {
  it('월 32,781,450원(가족 1명) → 10,014,580원', () => {
    expect(calcSimplifiedWithholdingTax({ monthlyTaxable: 32_781_450, dependents: 1 })).toBe(10_014_580)
  })

  it('1천만원 초과 전 구간 표본(약 9만 개)이 정수 산식과 같다', () => {
    const mismatches: number[] = []
    for (let m = 10_000_001; m <= 100_000_000; m += 997) {
      if (calcSimplifiedWithholdingTax({ monthlyTaxable: m, dependents: 1 }) !== expectedHighIncomeTax(m)) mismatches.push(m)
    }
    for (const m of [32_906_075, 33_030_700, 38_389_575, 38_514_200, 38_638_825, 38_763_450, 38_888_075]) {
      if (calcSimplifiedWithholdingTax({ monthlyTaxable: m, dependents: 1 }) !== expectedHighIncomeTax(m)) mismatches.push(m)
    }
    expect(mismatches).toEqual([])
  })

  it('실수령액 계산도 같은 세액을 쓴다 (소득세 10,014,580원 · 지방소득세 1,001,450원 · 월 실수령 19,824,030원)', () => {
    const r = calculateSalary({ annualSalary: 32_781_450 * 12, nonTaxable: 0, dependents: 1 })
    expect([r.breakdown.incomeTax, r.breakdown.localTax, r.monthlyNet]).toEqual([10_014_580, 1_001_450, 19_824_030])
  })

  it('상여 원천징수도 같은 세액을 쓴다 (월환산 32,781,450원 → 소득세 8,507,180원)', () => {
    const r = calculateBonusWithholding({ periodType: 'withPeriod', periodMonths: 1, bonusAmount: 22_781_450, monthlyPay: 10_000_000, dependents: 1 })
    expect([r.monthlyTaxOnConverted, r.incomeTax, r.localTax]).toEqual([10_014_580, 8_507_180, 850_710])
  })

  it('1천만원 정확히·이하와 구간 경계 정상값은 기존과 같다', () => {
    expect(calcSimplifiedWithholdingTax({ monthlyTaxable: 10_000_000, dependents: 1 })).toBe(SIMPLIFIED_TAX_TABLE_2026_AT_10M[0])
    expect(calcSimplifiedWithholdingTax({ monthlyTaxable: 14_000_000, dependents: 1 })).toBe(expectedHighIncomeTax(14_000_000))
    expect(calcSimplifiedWithholdingTax({ monthlyTaxable: 87_000_001, dependents: 1 })).toBe(expectedHighIncomeTax(87_000_001))
  })
})

describe('퇴직금 — 정확히 정수인 금액에서 1원이 빠지지 않는다', () => {
  it('3개월 임금 20,762,000원 · 산정기간 90일 · 재직 9,855일 → 186,858,000원', () => {
    const r = calculateSeverancePay({ month1Pay: 6_920_000, month2Pay: 6_920_000, month3Pay: 6_922_000, startDate: '1999-03-08', endDate: '2026-03-01' })
    expect([r.workingDays, r.averageWagePeriodDays, r.severancePay]).toEqual([9_855, 90, 186_858_000])
  })

  it('통상임금 하한을 쓰는 경우도 정확히 계산한다 (1일 100,000원 · 재직 730일 → 6,000,000원)', () => {
    const r = calculateSeverancePay({ month1Pay: 100_000, month2Pay: 100_000, month3Pay: 100_000, startDate: '2024-03-01', endDate: '2026-03-01', ordinaryDailyWage: 100_000 })
    expect(r.usedOrdinaryWage).toBe(true)
    expect(r.severancePay).toBe(6_000_000)
  })

  it('상여·연차수당 3/12 가산 정상값은 기존과 같다', () => {
    const r = calculateSeverancePay({ month1Pay: 3_000_000, month2Pay: 3_000_000, month3Pay: 3_000_000, startDate: '2021-03-01', endDate: '2026-03-01', annualBonus: 4_000_000, annualLeaveAllowance: 400_000 })
    // (9,000,000 + 1,000,000 + 100,000) ÷ 90 × 30 × 1,826 ÷ 365
    expect(r.severancePay).toBe(Math.floor((10_100_000 * 30 * 1_826) / (90 * 365)))
  })
})

describe('주휴수당 — 주휴시간 × 시급이 정확히 정수인 경계', () => {
  it('주 23시간 · 시급 10,320원 → 47,472원', () => {
    expect(calculateWeeklyHolidayPay({ weeklyHours: 23, hourlyWage: 10_320 }).weeklyHolidayPay).toBe(47_472)
  })
  it('주 15.7시간 · 시급 10,000원 → 31,400원', () => {
    expect(calculateWeeklyHolidayPay({ weeklyHours: 15.7, hourlyWage: 10_000 }).weeklyHolidayPay).toBe(31_400)
  })
  it('주 15~40시간 정수 × 시급 10,320~20,000원이 정확한 내림과 같다', () => {
    const mismatches: string[] = []
    for (let h = 15; h <= 40; h += 1) {
      for (let w = 10_320; w <= 20_000; w += 1) {
        const expected = Math.floor((Math.min(h, 40) * w) / 5)
        if (calculateWeeklyHolidayPay({ weeklyHours: h, hourlyWage: w }).weeklyHolidayPay !== expected) mismatches.push(`${h}h×${w}`)
      }
    }
    expect(mismatches.slice(0, 5)).toEqual([])
  })
  it('주 40시간 정상값과 15시간 미만 미지급은 기존과 같다', () => {
    expect(calculateWeeklyHolidayPay({ weeklyHours: 40, hourlyWage: 10_320 }).weeklyHolidayPay).toBe(82_560)
    expect(calculateWeeklyHolidayPay({ weeklyHours: 14.9, hourlyWage: 10_320 }).weeklyHolidayPay).toBe(0)
  })
})
