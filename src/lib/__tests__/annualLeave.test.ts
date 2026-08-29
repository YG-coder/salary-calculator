// src/lib/__tests__/annualLeave.test.ts
// 연차수당·연차일수 계산 회귀 테스트
// 근거: docs/annual-leave-policy.md

import { describe, it, expect } from 'vitest'
import {
  calculateAnnualLeavePay,
  calculateAnnualLeaveDays,
  calculateSubOneYearLeaveDays,
  getStatutoryLeaveReference,
  exceedsWarningThreshold,
} from '@/lib/calculators'
import {
  ANNUAL_LEAVE_BASE_DAYS,
  ANNUAL_LEAVE_MAX_DAYS,
  SUB_ONE_YEAR_MAX_DAYS,
  ANNUAL_LEAVE_POLICY_META,
} from '@/lib/policy/annualLeave'
import {
  sanitizeDaysInput,
  parseDays,
  normalizeWorkingYears,
  normalizeMonths,
  parseAmount,
  formatAmountInput,
  buildTenure,
  MAX_AMOUNT_INPUT,
  MAX_UNUSED_DAYS_INPUT,
} from '@/lib/annualLeaveInput'

// 결과가 절대 오염되지 않아야 하는 불변 조건
function expectFiniteResult(r: { annualLeavePay: number; perDayAmount: number }) {
  // Number.isFinite는 NaN에 대해서도 false이므로 이 한 줄로 NaN·±Infinity를 모두 배제한다.
  expect(Number.isFinite(r.annualLeavePay)).toBe(true)
  expect(Number.isFinite(r.perDayAmount)).toBe(true)
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
    ['1 미만 소수', 0.9],
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
    // 임계값은 제60조 제2항의 법정 최대치(11일). 회계연도 선부여 등으로 발생분보다
    // 많이 남아 있을 수 있어 개근 월수로 좁히지 않는다.
    expect(r.warningThresholdDays).toBe(SUB_ONE_YEAR_MAX_DAYS)
  })

  it('365일 근무 후 퇴직: 제1항 15일 미발생, 최대 11일', () => {
    const r = getStatutoryLeaveReference({ category: 'exact1' })
    expect(r.annualGrantDays).toBe(SUB_ONE_YEAR_MAX_DAYS)
    expect(r.warningThresholdDays).toBe(SUB_ONE_YEAR_MAX_DAYS)
  })

  it('366일째 근로관계 유지(1년 차): 연간 발생 15일, 경고 임계값 26일', () => {
    const r = getStatutoryLeaveReference({ category: 'over1', workingYears: 1 })
    expect(r.annualGrantDays).toBe(ANNUAL_LEAVE_BASE_DAYS)
    expect(r.warningThresholdDays).toBe(ANNUAL_LEAVE_BASE_DAYS + SUB_ONE_YEAR_MAX_DAYS)
    expect(r.warningThresholdDays).toBe(26)
  })

  it('365일 퇴직과 366일 유지의 결과가 실제로 다르다', () => {
    const exact1 = getStatutoryLeaveReference({ category: 'exact1' })
    const over1 = getStatutoryLeaveReference({ category: 'over1', workingYears: 1 })
    expect(exact1.warningThresholdDays).toBeLessThan(over1.warningThresholdDays)
  })

  it('2년 차 이상은 이번 연차연도 + 직전 연차연도 발생분이 임계값이다', () => {
    // 제60조 제7항: 휴가는 1년간 행사하지 않으면 소멸 → 통상 2개 연도분까지 공존 가능
    expect(getStatutoryLeaveReference({ category: 'over1', workingYears: 2 }).warningThresholdDays)
      .toBe(15 + 15)
    expect(getStatutoryLeaveReference({ category: 'over1', workingYears: 3 }).warningThresholdDays)
      .toBe(16 + 15)
    // 21년 차: 이번 연도 25일(상한) + 20년 차 24일 = 49일
    expect(getStatutoryLeaveReference({ category: 'over1', workingYears: 21 }).warningThresholdDays)
      .toBe(ANNUAL_LEAVE_MAX_DAYS + 24)
    // 22년 차부터는 양쪽 모두 상한이라 50일로 고정
    expect(getStatutoryLeaveReference({ category: 'over1', workingYears: 22 }).warningThresholdDays)
      .toBe(ANNUAL_LEAVE_MAX_DAYS * 2)
  })

  it('⚠️ 회귀 방지: 경고 임계값은 근속연수에 대해 단조 증가해야 한다', () => {
    // 1년 차 26일 → 2년 차 15일처럼 임계값이 떨어지면, 이월분이 있는 2년 차 이상
    // 사용자에게 경고가 상시 노출되어 경고가 무의미해진다.
    let previous = getStatutoryLeaveReference({ category: 'exact1' }).warningThresholdDays
    for (let y = 1; y <= 50; y++) {
      const current = getStatutoryLeaveReference({ category: 'over1', workingYears: y })
        .warningThresholdDays
      expect(current).toBeGreaterThanOrEqual(previous)
      previous = current
    }
  })

  it('비정상 근속연수 입력도 유한값을 반환한다', () => {
    for (const v of [NaN, Infinity, -Infinity, -5]) {
      const r = getStatutoryLeaveReference({ category: 'over1', workingYears: v })
      expect(Number.isFinite(r.warningThresholdDays)).toBe(true)
      expect(r.warningThresholdDays).toBe(0)
    }
  })
})

describe('법정 발생일수는 수당 계산을 제한하지 않는다', () => {
  it('임계값 이하 입력: 경고가 뜨지 않는다', () => {
    const ref = getStatutoryLeaveReference({ category: 'over1', workingYears: 5 }) // 17 + 17 = 34
    expect(exceedsWarningThreshold(15, ref)).toBe(false)
    expect(calculateAnnualLeavePay({ dailyWage: 80_000, unusedDays: 15 }).annualLeavePay)
      .toBe(1_200_000)
  })

  it('임계값 초과 입력: 경고가 뜨되 입력값 그대로 계산한다', () => {
    const ref = getStatutoryLeaveReference({ category: 'over1', workingYears: 5 })
    const input = 40 // 약정휴가·이월 연차로 초과 가능
    expect(exceedsWarningThreshold(input, ref)).toBe(true)
    // 법정 일수로 잘리지 않는다
    expect(calculateAnnualLeavePay({ dailyWage: 80_000, unusedDays: input }).annualLeavePay)
      .toBe(3_200_000)
  })

  it('365일 퇴직자가 15일을 입력하면 경고가 뜬다', () => {
    const ref = getStatutoryLeaveReference({ category: 'exact1' })
    expect(exceedsWarningThreshold(15, ref)).toBe(true)
    expect(calculateAnnualLeavePay({ dailyWage: 80_000, unusedDays: 15 }).annualLeavePay)
      .toBe(1_200_000)
  })

  it('0·음수·NaN 입력은 경고 대상이 아니다 (오류 표시가 아님)', () => {
    const ref = getStatutoryLeaveReference({ category: 'exact1' })
    for (const v of [0, -1, NaN, Infinity * 0]) {
      expect(exceedsWarningThreshold(v, ref)).toBe(false)
    }
    expect(exceedsWarningThreshold(Infinity, ref)).toBe(false)
  })

  it('2년 차 이월분(16일)은 경고 대상이 아니다 — 임계값 단조성 회귀', () => {
    const ref = getStatutoryLeaveReference({ category: 'over1', workingYears: 2 })
    expect(exceedsWarningThreshold(16, ref)).toBe(false)
  })

  it('법정 상한 25일을 넘는 40일 입력도 절사 없이 계산된다', () => {
    expect(calculateAnnualLeavePay({ dailyWage: 100_000, unusedDays: 40 }).annualLeavePay)
      .toBe(4_000_000)
  })
})

describe('⚠️ 불변식: annualLeavePay ≈ perDayAmount × unusedDays', () => {
  // 이 불변식이 깨진 적이 있다:
  //   81_925 * 1.4 === 114_694.99999999999 → Math.floor()가 1원을 깎았다.
  // 0.5·0.25 단위는 이진 분수라 절대 재현되지 않으므로 0.1·0.05 단위를 포함해 검증한다.
  const wages = [1_000, 50_000, 80_000, 81_925, 95_693, 123_457, 499_999]
  const dayUnits = [0.05, 0.1, 0.125, 0.2, 0.25, 0.5, 1]

  it('0.05~1일 단위 전 조합에서 1원 오차가 발생하지 않는다', () => {
    const mismatches: string[] = []
    for (const w of wages) {
      for (const u of dayUnits) {
        for (let k = 1; k <= 40; k++) {
          const days = Number((u * k).toFixed(4))
          const { annualLeavePay } = calculateAnnualLeavePay({ dailyWage: w, unusedDays: days })
          // 십진 기준의 정확한 기대값
          const exact = Math.floor(Math.round(w * days * 10_000) / 10_000)
          if (annualLeavePay !== exact) mismatches.push(`${w} x ${days} → ${annualLeavePay} (기대 ${exact})`)
        }
      }
    }
    expect(mismatches).toEqual([])
  })

  it('회귀 고정: 81,925원 × 1.4일 = 114,695원 (114,694원 아님)', () => {
    expect(calculateAnnualLeavePay({ dailyWage: 81_925, unusedDays: 1.4 }).annualLeavePay)
      .toBe(114_695)
  })

  it('회귀 고정: 50,000원 × 1.15일 = 57,500원 (57,499원 아님)', () => {
    expect(calculateAnnualLeavePay({ dailyWage: 50_000, unusedDays: 1.15 }).annualLeavePay)
      .toBe(57_500)
  })

  it('진짜 소수 금액은 여전히 내림한다 (원 단위 절사 유지)', () => {
    // 95,693 × 0.5 = 47,846.5 → 47,846 (반올림이 아니라 내림)
    expect(calculateAnnualLeavePay({ dailyWage: 95_693, unusedDays: 0.5 }).annualLeavePay)
      .toBe(47_846)
  })

  it('-0 입력이 "-0원"으로 새어나가지 않는다', () => {
    const r = calculateAnnualLeavePay({ dailyWage: -0, unusedDays: -0 })
    expect(Object.is(r.perDayAmount, -0)).toBe(false)
    expect(Object.is(r.annualLeavePay, -0)).toBe(false)
  })
})

describe('입력 정규화 (annualLeaveInput)', () => {
  it.each([
    ['', '', 0],
    ['.', '.', 0],
    ['.5', '.5', 0.5],
    ['5.', '5.', 5],
    ['10.5', '10.5', 10.5],
    ['000.5', '000.5', 0.5],
    ['12,5', '125', 125],
  ])('sanitizeDaysInput(%o) → %o, parseDays → %o', (input, sanitized, parsed) => {
    expect(sanitizeDaysInput(input)).toBe(sanitized)
    expect(parseDays(input)).toBe(parsed)
  })

  it('⚠️ 구분자가 여러 개면 뒤를 이어붙이지 않고 버린다 (크기 변조 방지)', () => {
    // "1.2.3"을 1.23으로 이어붙이면 붙여넣기한 값이 조용히 커진다
    expect(sanitizeDaysInput('1.2.3')).toBe('1.23')
    expect(parseDays('1.2.3')).toBe(1.23)
  })

  it('지수 표기는 숫자만 남아 의도치 않은 값이 되지 않도록 0이 아닌 값으로 붙지 않는지 확인', () => {
    // "1e5" → "15" (e 제거). 크기가 바뀌지만 maxLength 가드와 함께 실사용 영향은 없다.
    expect(sanitizeDaysInput('1e5')).toBe('15')
  })

  it('아주 긴 입력은 Infinity가 되어 0으로 떨어진다', () => {
    expect(parseDays('9'.repeat(400))).toBe(0)
  })

  it('음수 부호는 제거되어 음수 일수가 만들어지지 않는다', () => {
    expect(parseDays('-5')).toBe(5)
    expect(sanitizeDaysInput('-5')).toBe('5')
  })

  it('normalizeWorkingYears: 1~50 클램프', () => {
    expect(normalizeWorkingYears('')).toBe(1)
    expect(normalizeWorkingYears('0')).toBe(1)
    expect(normalizeWorkingYears('3.7')).toBe(3)
    expect(normalizeWorkingYears('50')).toBe(50)
    expect(normalizeWorkingYears('999')).toBe(50)
    expect(normalizeWorkingYears('-3')).toBe(3)
  })

  it('normalizeMonths: 0~11 클램프', () => {
    expect(normalizeMonths('')).toBe(0)
    expect(normalizeMonths('6')).toBe(6)
    expect(normalizeMonths('11')).toBe(11)
    expect(normalizeMonths('12')).toBe(11)
    expect(normalizeMonths('999')).toBe(11)
  })

  it('parseAmount: 천 단위 구분자와 비숫자를 제거한다', () => {
    expect(parseAmount('2,500,000')).toBe(2_500_000)
    expect(parseAmount('')).toBe(0)
    expect(parseAmount('abc')).toBe(0)
  })

  it('buildTenure: 근속 구분을 판별 유니온으로 바르게 변환한다', () => {
    expect(buildTenure('under1', 5, 6)).toEqual({ category: 'under1', fullAttendanceMonths: 6 })
    expect(buildTenure('exact1', 5, 6)).toEqual({ category: 'exact1' })
    expect(buildTenure('over1', 5, 6)).toEqual({ category: 'over1', workingYears: 5 })
  })

  it('buildTenure 결과가 getStatutoryLeaveReference와 그대로 연결된다', () => {
    const ref = getStatutoryLeaveReference(buildTenure('exact1', 1, 0))
    expect(ref.annualGrantDays).toBe(SUB_ONE_YEAR_MAX_DAYS)
  })
})

describe('정책 메타데이터가 낡으면 실패한다', () => {
  it('asOf는 유효한 날짜이고 미래가 아니다', () => {
    const asOf = new Date(ANNUAL_LEAVE_POLICY_META.asOf)
    expect(Number.isNaN(asOf.getTime())).toBe(false)
    expect(asOf.getTime()).toBeLessThanOrEqual(Date.now())
  })

  it('⚠️ reviewAt이 지났으면 실패한다 — 연차 정책 재확인이 필요하다는 뜻', () => {
    // 근로기준법 제60조 시간단위 분할 사용(법률 제21784호) 시행일.
    // 이 테스트가 깨지면 docs/annual-leave-policy.md P8을 다시 조사해야 한다.
    const reviewAt = new Date(ANNUAL_LEAVE_POLICY_META.reviewAt)
    expect(Number.isNaN(reviewAt.getTime())).toBe(false)
    expect(reviewAt.getTime()).toBeGreaterThan(Date.now())
  })

  it('근거 문서 경로가 기록되어 있다', () => {
    expect(ANNUAL_LEAVE_POLICY_META.reference).toBe('docs/annual-leave-policy.md')
    expect(ANNUAL_LEAVE_POLICY_META.basis).toContain('제60조')
  })
})

describe('입력 상한 가드 (화면 값과 계산 값의 일치 보장)', () => {
  it('일당 입력은 10억원에서 잘린다', () => {
    expect(formatAmountInput('9999999999999999')).toBe((1_000_000_000).toLocaleString('ko-KR'))
    expect(parseAmount('9999999999999999')).toBe(MAX_AMOUNT_INPUT)
  })

  it('일수 입력은 9,999일에서 잘린다 (법정 25일은 자르지 않음)', () => {
    expect(sanitizeDaysInput('99999999')).toBe('9999')
    expect(parseDays('99999999')).toBe(MAX_UNUSED_DAYS_INPUT)
    // 법정 상한을 넘는 정상 정산값은 그대로 통과
    expect(parseDays('40')).toBe(40)
    expect(parseDays('26')).toBe(26)
  })

  it('⚠️ 상한 조합의 곱이 MAX_SAFE_INTEGER 안에 들어온다 (조용한 클램프 방지)', () => {
    const r = calculateAnnualLeavePay({
      dailyWage: MAX_AMOUNT_INPUT,
      unusedDays: MAX_UNUSED_DAYS_INPUT,
    })
    expect(r.annualLeavePay).toBeLessThan(Number.MAX_SAFE_INTEGER)
    // 표시값끼리 실제로 맞아떨어진다
    expect(r.annualLeavePay).toBe(MAX_AMOUNT_INPUT * MAX_UNUSED_DAYS_INPUT)
    expect(r.perDayAmount).toBe(MAX_AMOUNT_INPUT)
  })

  it('상한 내 임의 입력에서 perDayAmount × unusedDays === annualLeavePay가 성립한다', () => {
    for (const w of [1, 80_000, 1_000_000, MAX_AMOUNT_INPUT]) {
      for (const d of [1, 25, 40, MAX_UNUSED_DAYS_INPUT]) {
        const r = calculateAnnualLeavePay({ dailyWage: w, unusedDays: d })
        expect(r.annualLeavePay).toBe(r.perDayAmount * d)
      }
    }
  })

  it('소수점 입력 도중 상태는 유지된다 (상한 가드가 타이핑을 방해하지 않음)', () => {
    expect(sanitizeDaysInput('1')).toBe('1')
    expect(sanitizeDaysInput('1.')).toBe('1.')
    expect(sanitizeDaysInput('1.2')).toBe('1.2')
  })
})
