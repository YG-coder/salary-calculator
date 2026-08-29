// src/lib/__tests__/annualLeave.test.ts
// 연차수당·연차일수 계산 회귀 테스트
// 근거: docs/annual-leave-policy.md

import { describe, it, expect } from 'vitest'
import {
  calculateAnnualLeavePay,
  calculateAnnualLeaveDays,
  calculateSubOneYearLeaveDays,
  getStatutoryLeaveReference,
} from '@/lib/calculators'
import {
  ANNUAL_LEAVE_BASE_DAYS,
  ANNUAL_LEAVE_MAX_DAYS,
  SUB_ONE_YEAR_MAX_DAYS,
} from '@/lib/policy/annualLeave'

// 결과가 절대 오염되지 않아야 하는 불변 조건
function expectFiniteResult(r: { annualLeavePay: number; perDayAmount: number }) {
  expect(Number.isFinite(r.annualLeavePay)).toBe(true)
  expect(Number.isNaN(r.annualLeavePay)).toBe(false)
  expect(Number.isFinite(r.perDayAmount)).toBe(true)
  expect(Number.isNaN(r.perDayAmount)).toBe(false)
}

describe('calculateAnnualLeavePay - 정상 입력 (회귀 고정)', () => {
  it('정수 일당 × 정수 연차일수', () => {
    const r = calculateAnnualLeavePay({ dailyWage: 80_000, unusedDays: 10 })
    expect(r.annualLeavePay).toBe(800_000)
    expect(r.perDayAmount).toBe(80_000)
  })

  it('기존 화면 사례: 월 통상임금 2,500,000원 → 1일 통상임금 95,693원 × 15일', () => {
    // 1일 통상임금 = floor(2,500,000 / 209 * 8)
    const daily = Math.floor((2_500_000 / 209) * 8)
    expect(daily).toBe(95_693)
    expect(calculateAnnualLeavePay({ dailyWage: daily, unusedDays: 15 }).annualLeavePay)
      .toBe(1_435_395)
  })

  it('원 단위 절사는 유지된다 (Math.floor)', () => {
    expect(calculateAnnualLeavePay({ dailyWage: 95_693, unusedDays: 0.5 }).annualLeavePay)
      .toBe(47_846) // 47846.5 → 47846
  })
})

describe('calculateAnnualLeavePay - 소수 연차일수', () => {
  it('반차 0.5일을 반올림하지 않고 그대로 계산한다', () => {
    const r = calculateAnnualLeavePay({ dailyWage: 80_000, unusedDays: 10.5 })
    expect(r.annualLeavePay).toBe(840_000)
  })

  it('반반차 0.25일도 그대로 계산한다', () => {
    expect(calculateAnnualLeavePay({ dailyWage: 80_000, unusedDays: 0.25 }).annualLeavePay)
      .toBe(20_000)
  })

  it('소수 일당도 절사 전까지 유지된다', () => {
    const r = calculateAnnualLeavePay({ dailyWage: 80_000.7, unusedDays: 1 })
    expect(r.annualLeavePay).toBe(80_000)
    expect(r.perDayAmount).toBe(80_000.7)
  })
})

describe('calculateAnnualLeavePay - 비정상 입력 방어 (0으로 정규화)', () => {
  const cases: [string, number, number][] = [
    ['0 일당', 0, 10],
    ['0 연차일수', 80_000, 0],
    ['둘 다 0', 0, 0],
    ['음수 일당', -80_000, 10],
    ['음수 연차일수', 80_000, -10],
    ['둘 다 음수', -80_000, -10],
    ['NaN 일당', NaN, 10],
    ['NaN 연차일수', 80_000, NaN],
    ['둘 다 NaN', NaN, NaN],
    ['Infinity 일당', Infinity, 10],
    ['Infinity 연차일수', 80_000, Infinity],
    ['-Infinity 일당', -Infinity, 10],
    ['-Infinity 연차일수', 80_000, -Infinity],
    ['둘 다 Infinity', Infinity, Infinity],
  ]

  it.each(cases)('%s → 0원, 결과는 유한값', (_label, dailyWage, unusedDays) => {
    const r = calculateAnnualLeavePay({ dailyWage, unusedDays })
    expectFiniteResult(r)
    expect(r.annualLeavePay).toBe(0)
    expect(r.annualLeavePay).toBeGreaterThanOrEqual(0)
  })

  it('음수 일당은 perDayAmount도 0으로 정규화된다', () => {
    expect(calculateAnnualLeavePay({ dailyWage: -1, unusedDays: 1 }).perDayAmount).toBe(0)
  })

  it('NaN 일당은 perDayAmount도 0으로 정규화된다', () => {
    expect(calculateAnnualLeavePay({ dailyWage: NaN, unusedDays: 1 }).perDayAmount).toBe(0)
  })
})

describe('calculateAnnualLeavePay - 매우 큰 유한값', () => {
  it('MAX_SAFE_INTEGER 일당 × 25일도 유한값으로 제한된다', () => {
    const r = calculateAnnualLeavePay({
      dailyWage: Number.MAX_SAFE_INTEGER,
      unusedDays: ANNUAL_LEAVE_MAX_DAYS,
    })
    expectFiniteResult(r)
    expect(r.annualLeavePay).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('MAX_VALUE 입력도 Infinity를 반환하지 않는다', () => {
    const r = calculateAnnualLeavePay({
      dailyWage: Number.MAX_VALUE,
      unusedDays: Number.MAX_VALUE,
    })
    expectFiniteResult(r)
    expect(r.annualLeavePay).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('현실적으로 큰 값(1일 1,000만원 × 25일)은 정확히 계산된다', () => {
    expect(calculateAnnualLeavePay({ dailyWage: 10_000_000, unusedDays: 25 }).annualLeavePay)
      .toBe(250_000_000)
  })
})

describe('calculateAnnualLeaveDays - 근속연수별 발생일수 (회귀 고정)', () => {
  const table: [number, number][] = [
    [1, 15], [2, 15], [3, 16], [4, 16], [5, 17], [6, 17],
    [7, 18], [8, 18], [9, 19], [10, 19], [11, 20], [15, 22],
    [19, 24], [20, 24], [21, 25], [22, 25], [30, 25], [50, 25],
  ]
  it.each(table)('근속 %i년 → %i일', (years, expected) => {
    expect(calculateAnnualLeaveDays(years)).toBe(expected)
  })

  it('기본 15일 상수와 1년 차 결과가 일치한다', () => {
    expect(calculateAnnualLeaveDays(1)).toBe(ANNUAL_LEAVE_BASE_DAYS)
  })

  it('상한 도달 경계: 20년은 24일, 21년부터 25일 고정', () => {
    expect(calculateAnnualLeaveDays(20)).toBe(24)
    expect(calculateAnnualLeaveDays(21)).toBe(ANNUAL_LEAVE_MAX_DAYS)
    expect(calculateAnnualLeaveDays(22)).toBe(ANNUAL_LEAVE_MAX_DAYS)
  })
})

describe('calculateAnnualLeaveDays - 비정상 입력 방어', () => {
  it.each([
    ['NaN', NaN],
    ['Infinity', Infinity],
    ['-Infinity', -Infinity],
    ['음수', -1],
    ['0', 0],
    ['0 미만 소수', 0.9],
  ])('%s → 0', (_label, input) => {
    expect(calculateAnnualLeaveDays(input)).toBe(0)
  })

  it('소수 근속연수는 내림 처리한다 (현재 정책)', () => {
    expect(calculateAnnualLeaveDays(1.5)).toBe(15)
    expect(calculateAnnualLeaveDays(2.99)).toBe(15)
    expect(calculateAnnualLeaveDays(3.01)).toBe(16)
  })

  it('모든 입력에서 결과는 유한한 0 이상 값이다', () => {
    for (const v of [NaN, Infinity, -Infinity, -1e9, 0, 1e9]) {
      const d = calculateAnnualLeaveDays(v)
      expect(Number.isFinite(d)).toBe(true)
      expect(d).toBeGreaterThanOrEqual(0)
      expect(d).toBeLessThanOrEqual(ANNUAL_LEAVE_MAX_DAYS)
    }
  })
})

describe('calculateSubOneYearLeaveDays - 근기법 제60조 제2항', () => {
  it.each([
    [0, 0], [1, 1], [6, 6], [11, 11], [12, 11], [24, 11],
  ])('개근 %i개월 → %i일', (months, expected) => {
    expect(calculateSubOneYearLeaveDays(months)).toBe(expected)
  })

  it.each([['NaN', NaN], ['Infinity', Infinity], ['-Infinity', -Infinity], ['음수', -3]])(
    '%s → 0',
    (_label, input) => {
      expect(calculateSubOneYearLeaveDays(input)).toBe(0)
    },
  )

  it('11일 상한을 넘지 않는다', () => {
    expect(calculateSubOneYearLeaveDays(1000)).toBe(SUB_ONE_YEAR_MAX_DAYS)
  })
})

describe('getStatutoryLeaveReference - 365일·366일 분기', () => {
  it('1년 미만: 개근 월수만큼', () => {
    const r = getStatutoryLeaveReference({ category: 'under1', fullAttendanceMonths: 6 })
    expect(r.annualGrantDays).toBe(6)
    expect(r.settlementReferenceDays).toBe(6)
  })

  it('365일 근무 후 퇴직: 제1항 15일 미발생, 최대 11일', () => {
    const r = getStatutoryLeaveReference({ category: 'exact1' })
    expect(r.annualGrantDays).toBe(SUB_ONE_YEAR_MAX_DAYS)
    expect(r.settlementReferenceDays).toBe(SUB_ONE_YEAR_MAX_DAYS)
    expect(r.settlementReferenceDays).not.toBe(ANNUAL_LEAVE_BASE_DAYS)
  })

  it('366일째 근로관계 유지(1년 차): 연간 발생 15일, 정산 참고 상한 26일', () => {
    const r = getStatutoryLeaveReference({ category: 'over1', workingYears: 1 })
    expect(r.annualGrantDays).toBe(ANNUAL_LEAVE_BASE_DAYS)
    expect(r.settlementReferenceDays).toBe(ANNUAL_LEAVE_BASE_DAYS + SUB_ONE_YEAR_MAX_DAYS)
    expect(r.settlementReferenceDays).toBe(26)
  })

  it('365일 퇴직과 366일 유지의 결과가 실제로 다르다', () => {
    const exact1 = getStatutoryLeaveReference({ category: 'exact1' })
    const over1 = getStatutoryLeaveReference({ category: 'over1', workingYears: 1 })
    expect(exact1.settlementReferenceDays).toBeLessThan(over1.settlementReferenceDays)
  })

  it('2년 차 이상은 해당 연차연도 발생일수를 그대로 참고 상한으로 쓴다', () => {
    expect(getStatutoryLeaveReference({ category: 'over1', workingYears: 3 }).settlementReferenceDays)
      .toBe(16)
    expect(getStatutoryLeaveReference({ category: 'over1', workingYears: 21 }).settlementReferenceDays)
      .toBe(ANNUAL_LEAVE_MAX_DAYS)
  })

  it('비정상 근속연수 입력도 유한값을 반환한다', () => {
    for (const v of [NaN, Infinity, -Infinity, -5]) {
      const r = getStatutoryLeaveReference({ category: 'over1', workingYears: v })
      expect(Number.isFinite(r.settlementReferenceDays)).toBe(true)
      expect(r.settlementReferenceDays).toBe(0)
    }
  })
})

describe('법정 발생일수는 수당 계산을 제한하지 않는다', () => {
  it('법정 발생일수 이하 입력: 경고 조건이 성립하지 않는다', () => {
    const ref = getStatutoryLeaveReference({ category: 'over1', workingYears: 5 }) // 17일
    const input = 15
    expect(input > ref.settlementReferenceDays).toBe(false)
    expect(calculateAnnualLeavePay({ dailyWage: 80_000, unusedDays: input }).annualLeavePay)
      .toBe(1_200_000)
  })

  it('법정 발생일수 초과 입력: 경고 조건이 성립하되 입력값 그대로 계산한다', () => {
    const ref = getStatutoryLeaveReference({ category: 'over1', workingYears: 5 }) // 17일
    const input = 30 // 약정휴가·이월 연차로 초과 가능
    expect(input > ref.settlementReferenceDays).toBe(true)
    // 17일로 잘리지 않는다
    expect(calculateAnnualLeavePay({ dailyWage: 80_000, unusedDays: input }).annualLeavePay)
      .toBe(2_400_000)
  })

  it('365일 퇴직자가 15일을 입력하면 경고 조건이 성립한다', () => {
    const ref = getStatutoryLeaveReference({ category: 'exact1' })
    expect(15 > ref.settlementReferenceDays).toBe(true)
    expect(calculateAnnualLeavePay({ dailyWage: 80_000, unusedDays: 15 }).annualLeavePay)
      .toBe(1_200_000)
  })

  it('법정 상한 25일을 넘는 40일 입력도 절사 없이 계산된다', () => {
    expect(calculateAnnualLeavePay({ dailyWage: 100_000, unusedDays: 40 }).annualLeavePay)
      .toBe(4_000_000)
  })
})
