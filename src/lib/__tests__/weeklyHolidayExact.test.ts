import { describe, expect, it } from 'vitest'
import { calculateWeeklyHolidayPay } from '../calculators'

/** 독립 기준(엔진 미사용): floor(min(주 시간, 40) ÷ 5 × 시급)을 십진 문자열의 BigInt 분수로 계산 */
function expectedPay(hours: string, wage: string): number {
  const [hi, hf = ''] = hours.split('.')
  const hoursNum = BigInt(hi + hf)
  const hoursDen = BigInt(10) ** BigInt(hf.length)
  const capped = hoursNum > BigInt(40) * hoursDen ? [BigInt(40), BigInt(1)] : [hoursNum, hoursDen]
  return Number((capped[0] * BigInt(wage)) / (BigInt(5) * capped[1]))
}

const pay = (weeklyHours: number, hourlyWage: number, fullAttendance = true) =>
  calculateWeeklyHolidayPay({ weeklyHours, hourlyWage, fullAttendance })

describe('주휴수당 — 십진 정확 내림(큰 시급에서도 실제 소수부를 올리지 않는다)', () => {
  it('주 15.1시간 · 시급 100,000,000,000,040원: 정확값 302,000,000,000,120.8원 → 302,000,000,000,120원', () => {
    expect(pay(15.1, 100_000_000_000_040).weeklyHolidayPay).toBe(302_000_000_000_120)
  })

  it('기존 회귀: 23시간·10,320원 → 47,472원, 15.7시간·10,000원 → 31,400원', () => {
    expect(pay(23, 10_320).weeklyHolidayPay).toBe(47_472)
    expect(pay(15.7, 10_000).weeklyHolidayPay).toBe(31_400)
  })

  it('15시간 자격 경계·40시간 상한·미개근 처리는 그대로다', () => {
    expect(pay(14.9, 10_320)).toMatchObject({ weeklyHolidayPay: 0, isEligible: false, ineligibleReason: 'UNDER_15_HOURS' })
    expect(pay(15, 10_320)).toMatchObject({ weeklyHolidayPay: 30_960, isEligible: true })
    expect(pay(40, 10_320).weeklyHolidayPay).toBe(82_560)
    expect(pay(40.1, 10_320).weeklyHolidayPay).toBe(82_560)
    expect(pay(60, 10_320)).toMatchObject({ weeklyHolidayPay: 82_560, weeklyHolidayHours: 8 })
    expect(pay(23, 10_320, false)).toMatchObject({ weeklyHolidayPay: 0, isEligible: false, ineligibleReason: 'NOT_FULL_ATTENDANCE' })
  })

  it('정확히 정수인 결과는 그대로, 실제 소수부가 남는 결과는 내린다', () => {
    expect(pay(20, 10_320).weeklyHolidayPay).toBe(41_280) // 4 × 10,320
    expect(pay(15.3, 10_333).weeklyHolidayPay).toBe(31_618) // 3.06 × 10,333 = 31,618.98
    expect(pay(17.3, 99_999_999_999_999).weeklyHolidayPay).toBe(345_999_999_999_996) // …996.5654
  })

  it('큰 시급 표본이 독립 정수 계산과 같다', () => {
    const mismatches: string[] = []
    for (const hours of ['15', '15.1', '15.25', '17.3', '22.7', '33.33', '39.99', '40', '52.5'])
      for (const wage of ['10320', '99999999999999', '100000000000000', '100000000000040', '123456789012345', '999999999999999'])
        if (pay(Number(hours), Number(wage)).weeklyHolidayPay !== expectedPay(hours, wage)) mismatches.push(`${hours}h×${wage}`)
    expect(mismatches).toEqual([])
  })
})
