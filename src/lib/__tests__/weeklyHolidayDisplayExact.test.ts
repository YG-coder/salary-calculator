import { describe, expect, it } from 'vitest'
import {
  calculateWeeklyHolidayPay,
  estimateWeeklyHolidayMonthlyPayExact,
  formatWeeklyHolidayKRW,
} from '../calculators'
import { formatKRW } from '../salary'

// 독립 기준(앱 계산 도우미 미사용): 시간·시급을 십진 문자열로 읽어 BigInt 정수 산술로 계산한다.
// 주 금액 = floor(min(주 시간, 40) ÷ 5 × 시급), 월 환산 = floor(주 금액 × 4345 ÷ 1000)
const ZERO = BigInt(0)
function expectedWeekly(hours: string, wage: string): bigint {
  const [hi, hf = ''] = hours.split('.')
  let num = BigInt(hi + hf)
  let den = BigInt(10) ** BigInt(hf.length)
  if (num > BigInt(40) * den) { num = BigInt(40); den = BigInt(1) }
  return (num * BigInt(wage)) / (BigInt(5) * den)
}
const expectedMonthly = (weekly: bigint) => (weekly * BigInt(4345)) / BigInt(1000)
/** 오른쪽부터 세 자리씩 끊어 쉼표로 잇는다(앱의 정규식 방식과 다른 구현). */
function expectedText(value: bigint): string {
  const digits = value.toString()
  const groups: string[] = []
  for (let end = digits.length; end > 0; end -= 3) groups.unshift(digits.slice(Math.max(0, end - 3), end))
  return groups.join(',') + '원'
}

/** 화면 경로와 같은 순서: 계산 결과의 정확 정수 → 월 환산 → 원 표기 */
function shown(hours: string, wage: string) {
  const result = calculateWeeklyHolidayPay({ weeklyHours: Number(hours), hourlyWage: Number(wage), fullAttendance: true })
  const exact = result.weeklyHolidayPayExact
  if (exact === null) throw new Error('정확 정수 없음')
  const monthly = estimateWeeklyHolidayMonthlyPayExact(exact)
  return { result, exact, weekly: formatWeeklyHolidayKRW(exact), monthly: monthly === null ? null : formatWeeklyHolidayKRW(monthly) }
}
function mismatches(pairs: Array<[string, string]>) {
  const out: string[] = []
  for (const [hours, wage] of pairs) {
    const w = expectedWeekly(hours, wage)
    const s = shown(hours, wage)
    if (s.exact !== w.toString() || s.weekly !== expectedText(w) || s.monthly !== expectedText(expectedMonthly(w)))
      out.push(`${hours}h×${wage}: ${s.weekly} / ${s.monthly}`)
  }
  return out
}

const MAX = '9007199254740991'

describe('주휴수당 화면 금액 — 안전 정수 상한을 넘어도 원 단위 그대로', () => {
  it('최대 시급·40시간: 72,057,594,037,927,928원(…930원이 아님), 월 313,090,246,094,796,847원', () => {
    const s = shown('40', MAX)
    expect(s.exact).toBe('72057594037927928')
    expect(s.weekly).toBe('72,057,594,037,927,928원')
    expect(s.monthly).toBe('313,090,246,094,796,847원')
  })

  it('최대 시급과 바로 아래 시급(40시간)', () => {
    const pairs: Array<[string, string]> = []
    for (let d = 0; d < 10; d++) pairs.push(['40', (BigInt(MAX) - BigInt(d)).toString()])
    expect(mismatches(pairs)).toEqual([])
  })

  it('주 금액이 안전 정수 경계를 넘기 직전·직후', () => {
    expect(mismatches([
      ['15', '3002399751580330'], ['15', '3002399751580331'], ['15', '3002399751580332'],
      ['15.1', '2982516309516884'], ['15.1', '2982516309516885'], ['15.1', '2982516309516886'],
      ['23', '1958086794508911'], ['23', '1958086794508912'], ['23', '1958086794508913'],
      ['40', '1125899906842623'], ['40', '1125899906842624'], ['40', '1125899906842625'],
    ])).toEqual([])
    // 경계 직후는 Number로 나타낼 수 없는 값이다(15시간 × 3,002,399,751,580,331원 = 9,007,199,254,740,993원)
    expect(shown('15', '3002399751580331').weekly).toBe('9,007,199,254,740,993원')
  })

  it('월 환산이 안전 정수 경계를 넘기 직전·직후', () => {
    expect(mismatches([
      ['15', '691001093574299'], ['15', '691001093574300'], ['15', '691001093574301'],
      ['15.1', '686424927391688'], ['15.1', '686424927391689'], ['15.1', '686424927391690'],
      ['23', '450652887113673'], ['23', '450652887113674'], ['23', '450652887113675'],
      ['40', '259125410090362'], ['40', '259125410090363'], ['40', '259125410090364'],
    ])).toEqual([])
    expect(shown('40', '259125410090363').monthly).toBe('9,007,199,254,741,017원')
  })

  it('15·15.1·23·40·45시간 × 큰 시급', () => {
    const pairs: Array<[string, string]> = []
    for (const hours of ['15', '15.1', '23', '40', '45'])
      for (const wage of ['99999999999999', '100000000000000', '123456789012345', '999999999999999', '1000000000000000', '4503599627370497', MAX])
        pairs.push([hours, wage])
    expect(mismatches(pairs)).toEqual([])
  })

  it('정확 정수와 소수부 내림', () => {
    expect(shown('20', '10320')).toMatchObject({ exact: '41280', weekly: '41,280원', monthly: '179,361원' })
    expect(shown('15.3', '10333')).toMatchObject({ exact: '31618', weekly: '31,618원' }) // 31,618.98원
    expect(shown('15.1', MAX).weekly).toBe('27,201,741,749,317,792원') // …792.82원
    expect(mismatches([['17.3', '99999999999999'], ['23', '9007199254740990'], ['40', '1125899906842624']])).toEqual([])
  })

  it('일반값과 기존 모바일 극단값은 그대로', () => {
    expect(shown('23', '10320')).toMatchObject({ weekly: '47,472원', monthly: '206,265원' })
    expect(shown('15.1', '100000000000040')).toMatchObject({ weekly: '302,000,000,000,120원', monthly: '1,312,190,000,000,521원' })
  })

  it('안전 정수 범위에서는 기존 formatKRW 표기와 같고, Number 값도 그대로다', () => {
    for (const [hours, wage] of [['23', '10320'], ['15', '10320'], ['40', '10320'], ['15.1', '100000000000040'], ['17.3', '99999999999999'], ['40', '1125899906842623']]) {
      const s = shown(hours, wage)
      expect(Number.isSafeInteger(s.result.weeklyHolidayPay)).toBe(true)
      expect(s.weekly).toBe(formatKRW(s.result.weeklyHolidayPay))
      expect(s.result.weeklyHolidayPay).toBe(Number(expectedWeekly(hours, wage)))
    }
    for (const n of [0, 7, 999, 1000, 12345, 1000000, 9007199254740991]) expect(formatWeeklyHolidayKRW(String(n))).toBe(formatKRW(n))
  })

  it('미발생은 정확 정수 0, 월 환산 없음(화면 "-")', () => {
    const under = calculateWeeklyHolidayPay({ weeklyHours: 14.9, hourlyWage: 10_320 })
    const absent = calculateWeeklyHolidayPay({ weeklyHours: 40, hourlyWage: 10_320, fullAttendance: false })
    for (const r of [under, absent]) {
      expect(r).toMatchObject({ weeklyHolidayPay: 0, weeklyHolidayPayExact: '0', isEligible: false })
      expect(estimateWeeklyHolidayMonthlyPayExact(r.weeklyHolidayPayExact ?? '')).toBeNull()
    }
    expect(expectedWeekly('14.9', '10320') > ZERO).toBe(true) // 미발생 판정은 금액이 아니라 시간·개근 기준
  })
})
