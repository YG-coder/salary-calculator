import { describe, expect, it } from 'vitest'
import { getLongTermCareRate, getMinimumHourlyWage } from '../policy/annualRates'
import { calculateLongTermCare } from '../insurancePremiums'
import { calculateWeeklyHolidayPay } from '../calculators'
import { calculateSalary } from '../salary'
import { MIN_HOURLY_WAGE_2026, RATES } from '../constants'

const last2026 = new Date('2026-12-31T14:59:59.999Z')
const first2027 = new Date('2026-12-31T15:00:00Z')

describe('2027년 확정 기준 등록', () => {
  it('한국시간 1월 1일에 최저시급과 장기요양 비율이 함께 바뀐다', () => {
    expect(getMinimumHourlyWage(last2026)).toBe(10320)
    expect(getMinimumHourlyWage(first2027)).toBe(10700)
    expect(getLongTermCareRate(last2026).incomeRatePerMillion).toBe(9448)
    expect(getLongTermCareRate(first2027).incomeRatePerMillion).toBe(9994)
    expect(calculateLongTermCare(100000, last2026)).toBe(13140)
    // 복지부 발표의 예시: 건강보험료 10만원 → 장기요양 13,900원.
    expect(calculateLongTermCare(100000, first2027)).toBe(13900)
  })

  it('2027년 말일까지 적용하고 2028년 값은 추정하지 않는다', () => {
    const last = new Date('2027-12-31T14:59:59.999Z')
    expect(getMinimumHourlyWage(last)).toBe(10700)
    expect(calculateLongTermCare(50000, last)).toBe(6950)
    for (const value of ['2027-12-31T15:00:00Z', '2025-12-31T14:59:59.999Z', 'invalid']) {
      expect(() => getMinimumHourlyWage(new Date(value))).toThrow(RangeError)
      expect(() => calculateLongTermCare(50000, new Date(value))).toThrow(RangeError)
    }
  })

  it('최저시급 10,700원은 월 209시간 2,236,300원·주40시간 주휴 85,600원이다', () => {
    const hourlyWage = getMinimumHourlyWage(first2027)
    expect(hourlyWage * 209).toBe(2236300)
    expect(calculateWeeklyHolidayPay({ weeklyHours: 40, hourlyWage }).weeklyHolidayPay).toBe(85600)
    expect(calculateWeeklyHolidayPay({ weeklyHours: 23, hourlyWage }).weeklyHolidayPay).toBe(49220)
    expect(calculateWeeklyHolidayPay({ weeklyHours: 14.9, hourlyWage }).weeklyHolidayPay).toBe(0)
  })

  it('2026년 기본값과 전체 급여 지원연도 제한을 유지한다', () => {
    expect(getMinimumHourlyWage()).toBe(MIN_HOURLY_WAGE_2026)
    expect(getMinimumHourlyWage()).toBe(10320)
    expect(RATES.longTermCareIncome).toBe(0.009448)
    expect(calculateLongTermCare(50380)).toBe(6620)
    expect(() => calculateSalary({ annualSalary: 36000000, nonTaxable: 0, dependents: 1 }, first2027)).toThrow('2026년 정책 데이터')
  })

  it('2026·2027년 보험료 구간을 독립 정수 산술과 대조한다', () => {
    // 0~719,000원 건보료의 10원 단위 전체. 2026년 기존 정확 비율, 2027년 공식 발표 13.90%.
    for (let health = 0; health <= 719000; health += 10) {
      const amount = BigInt(health)
      const before = Number(amount * BigInt(9448) / BigInt(719000) * BigInt(10))
      const after = Number(amount * BigInt(139) / BigInt(10000) * BigInt(10))
      if (calculateLongTermCare(health, last2026) !== before) throw new Error(`2026 건보료 ${health}`)
      if (calculateLongTermCare(health, first2027) !== after) throw new Error(`2027 건보료 ${health}`)
    }
  })

  it('같은 시각은 실행 프로세스 시간대와 관계없이 같은 구간을 선택한다', () => {
    const original = process.env.TZ
    try {
      for (const tz of ['UTC', 'Asia/Seoul', 'America/Los_Angeles', 'Pacific/Kiritimati']) {
        process.env.TZ = tz
        expect(getMinimumHourlyWage(last2026)).toBe(10320)
        expect(getMinimumHourlyWage(first2027)).toBe(10700)
        expect(calculateLongTermCare(100000, first2027)).toBe(13900)
      }
    } finally {
      if (original === undefined) delete process.env.TZ
      else process.env.TZ = original
    }
  })
})
