import { describe, expect, it } from 'vitest'
import { calculateSeverancePay, type SeverancePayInput } from '@/lib/calculators'
import { getAverageWagePeriod, getRetirementDate, getSeveranceTenure } from '@/lib/severanceDates'

const BASE: SeverancePayInput = {
  month1Pay: 3_000_000,
  month2Pay: 3_000_000,
  month3Pay: 3_000_000,
  startDate: '2025-10-14',
  endDate: '2026-10-14',
}

describe('마지막 근무일에서 계산용 퇴직일로 변환', () => {
  it.each([
    ['2026-10-13', '2026-10-14'],
    ['2026-01-31', '2026-02-01'],
    ['2026-12-31', '2027-01-01'],
    ['2024-02-28', '2024-02-29'],
    ['2024-02-29', '2024-03-01'],
    ['2025-02-28', '2025-03-01'],
    ['2000-02-28', '2000-02-29'],
  ])('%s의 다음 날은 %s', (lastDay, retirementDate) => {
    expect(getRetirementDate(lastDay)).toBe(retirementDate)
  })

  it.each(['', 'invalid', '2023-02-29', '1900-02-29', '2026-04-31', '2026-13-01', '2026-10-13T12:00:00Z'])('%s는 날짜로 받아들이지 않는다', (value) => {
    expect(getRetirementDate(value)).toBeNull()
  })
})

describe('퇴직금 지급 자격의 달력 기준 1년', () => {
  it.each([
    ['2025-10-14', '2026-10-12', 364, false],
    ['2025-10-14', '2026-10-13', 365, true],
    ['2025-10-14', '2026-10-14', 366, true],
    // 퇴직일이 아닌 마지막 근무일을 입력한다.
    ['2023-03-01', '2024-02-28', 365, false],
    ['2023-03-01', '2024-02-29', 366, true],
    ['2024-02-28', '2025-02-26', 365, false],
    ['2024-02-28', '2025-02-27', 366, true],
    // 다음 해에 2월 29일이 없으면 2월 말일까지 근로한 뒤 1년을 충족한다.
    ['2024-02-29', '2025-02-27', 365, false],
    ['2024-02-29', '2025-02-28', 366, true],
    ['2025-12-31', '2026-12-30', 365, true],
    ['2025-10-14', '2025-10-14', 1, false],
  ])('입사 %s · 마지막 근무 %s → %i일, 자격 %s', (start, last, workingDays, eligible) => {
    const end = getRetirementDate(last)!
    const tenure = getSeveranceTenure(start, end)
    expect(tenure).toEqual({ workingDays, hasCompletedOneYear: eligible })
    const result = calculateSeverancePay({ ...BASE, startDate: start, endDate: end })
    expect(result.workingDays).toBe(workingDays)
    expect(result.isEligible).toBe(eligible)
    expect(result.ineligibleReason).toBe(eligible ? null : 'UNDER_ONE_YEAR')
    expect(result.severancePay > 0).toBe(eligible)
  })

  it.each([
    ['invalid', '2026-10-14'],
    ['2025-10-14', 'invalid'],
    ['2025-10-14', '2026-02-30'],
    ['2025-10-14', '2025-10-14'],
    ['2025-10-14', '2025-10-13'],
  ])('잘못된 기간 %s ~ %s에서 지급 자격을 만들지 않는다', (start, end) => {
    expect(getSeveranceTenure(start, end)).toEqual({ workingDays: 0, hasCompletedOneYear: false })
    const result = calculateSeverancePay({ ...BASE, startDate: start, endDate: end })
    expect(result.isEligible).toBe(false)
    expect(result.severancePay).toBe(0)
    expect(result.workingDays).toBe(0)
  })
})

describe('퇴직금 금액 및 평균임금 회귀', () => {
  it('평년의 정확히 1년 근무 금액을 고정한다', () => {
    const result = calculateSeverancePay(BASE)
    expect(result.workingDays).toBe(365)
    expect(result.averageWagePeriodDays).toBe(92)
    expect(result.severancePay).toBe(2_934_782)
  })

  it('지급 자격은 달력으로 판단하고 금액 산식의 재직일수/365는 유지한다', () => {
    const result = calculateSeverancePay({ ...BASE, startDate: '2023-03-01', endDate: '2024-03-01' })
    expect(result.workingDays).toBe(366)
    expect(result.averageWagePeriodDays).toBe(91)
    expect(result.severancePay).toBe(2_975_161)
  })

  it.each([
    ['2025-05-01', 89],
    ['2024-05-01', 90],
    ['2025-05-31', 91],
    ['2024-05-31', 91],
  ])('퇴직일 %s의 직전 3개월은 %i일', (endDate, days) => {
    const result = calculateSeverancePay({ ...BASE, startDate: '2020-01-01', endDate })
    expect(result.averageWagePeriodDays).toBe(days)
  })

  it('통상임금 하한과 상여·연차수당을 기존대로 반영한다', () => {
    const result = calculateSeverancePay({ ...BASE, annualBonus: 4_000_000, annualLeaveAllowance: 2_000_000, ordinaryDailyWage: 120_000 })
    expect(result.calculatedAverageDailyWage).toBeCloseTo(10_500_000 / 92)
    expect(result.usedOrdinaryWage).toBe(true)
    expect(result.averageDailyWage).toBe(120_000)
    expect(result.severancePay).toBe(3_600_000)
  })

  it.each([[14, false], [15, true]])('주 %i시간인 근로자의 자격은 %s', (weeklyHours, eligible) => {
    const result = calculateSeverancePay({ ...BASE, weeklyHours })
    expect(result.isEligible).toBe(eligible)
    expect(result.ineligibleReason).toBe(eligible ? null : 'UNDER_15_HOURS')
  })
})

describe('고용노동부 계산기의 산정 기간과 대조', () => {
  // 2026-10-14 공식 화면에서 평균임금계산 기간보기로 확인한 독립 기준값.
  // https://1350.moel.go.kr/home/hp/retirementpaycal/retirementpaycal.jsp
  // 공개 코드에서도 평년 5/29~31, 윤년 5/30~31의 2월 제외 분기를 확인했다.
  it.each([
    ['2025-05-28', '2025-02-28', 89],
    ['2025-05-29', '2025-03-01', 89],
    ['2025-05-30', '2025-03-01', 90],
    ['2025-05-31', '2025-03-01', 91],
    ['2025-12-31', '2025-09-30', 92],
    ['2024-05-29', '2024-02-29', 90],
    ['2024-05-30', '2024-03-01', 90],
    ['2024-05-31', '2024-03-01', 91],
  ])('퇴직일 %s → 시작일 %s, %i일', (endDate, startDate, days) => {
    expect(getAverageWagePeriod(endDate)).toEqual({ startDate, endDate, days })
    expect(calculateSeverancePay({ ...BASE, startDate: '2020-01-01', endDate }).averageWagePeriodDays).toBe(days)
  })

  it.each(['', 'invalid', '2025-02-30'])('잘못된 퇴직일 %s로 산정 기간을 만들지 않는다', (value) => {
    expect(getAverageWagePeriod(value)).toBeNull()
  })
})
