import { describe, expect, it } from 'vitest'
import { calculateReverseSalary } from '@/lib/reverseSalary'
import { calculateSalary } from '@/lib/salary'

const AS_OF = new Date('2026-10-14T12:00:00+09:00')

describe('비과세 조건이 성립하는 연봉만 역산한다', () => {
  it('고액 목표도 정확한 장기요양 비율을 적용한 뒤 목표를 충족한다', () => {
    const input = { targetMonthlyNet: 24_000_000, nonTaxable: 200_000, dependents: 1 }
    const reverse = calculateReverseSalary(input, AS_OF)
    expect(reverse.requiredAnnualSalary).toBe(489_280_000)
    expect(reverse.result.monthlyNet).toBe(24_000_433)
    const previous = calculateSalary({ annualSalary: 489_270_000, nonTaxable: 200_000, dependents: 1 }, AS_OF)
    expect(previous.monthlyNet).toBe(23_999_990)
    expect(reverse.result.monthlyNet).toBeGreaterThanOrEqual(input.targetMonthlyNet)
  })
  it('기존 정상 조건의 최소 연봉은 유지한다', () => {
    const reverse = calculateReverseSalary({ targetMonthlyNet: 3_000_000, nonTaxable: 200_000, dependents: 1 }, AS_OF)
    expect(reverse.requiredAnnualSalary).toBe(40_960_000)
    // 기준소득월액 3,213,333 → 3,213,000 절사로 국민연금 20원 감소.
    expect(reverse.result.monthlyNet).toBe(3_000_533)
  })

  it('비과세가 목표보다 커도 허용하되 월 세전 급여는 비과세 이상이어야 한다', () => {
    const reverse = calculateReverseSalary({ targetMonthlyNet: 3_000_000, nonTaxable: 5_000_000 }, AS_OF)
    expect(reverse.reachable).toBe(true)
    expect(reverse.requiredAnnualSalary).toBe(60_000_000)
    expect(reverse.result.monthlyGross).toBe(5_000_000)
    expect(reverse.result.monthlyNet).toBe(4_980_530)
  })

  it('월 비과세의 원 단위 끝수를 만원 연봉 그리드에 맞춰 올린다', () => {
    const reverse = calculateReverseSalary({ targetMonthlyNet: 3_000_000, nonTaxable: 5_000_001 }, AS_OF)
    expect(reverse.requiredAnnualSalary).toBe(60_010_000)
    expect(reverse.result.monthlyGross).toBeGreaterThanOrEqual(5_000_001)
    expect(Math.floor((reverse.requiredAnnualSalary - 10_000) / 12)).toBeLessThan(5_000_001)
  })

  it.each([0, 200_000, 990_000, 1_000_000, 5_000_000])('비과세 %i원의 결과가 정방향 계산과 일치하며 유효하다', (nonTaxable) => {
    const target = 980_000
    const reverse = calculateReverseSalary({ targetMonthlyNet: target, nonTaxable }, AS_OF)
    expect(reverse.reachable).toBe(true)
    expect(reverse.result.monthlyGross).toBeGreaterThanOrEqual(nonTaxable)
    expect(reverse.result.monthlyNet).toBeGreaterThanOrEqual(target)
    expect(reverse.result).toEqual(calculateSalary({ annualSalary: reverse.requiredAnnualSalary, nonTaxable, dependents: 1 }, AS_OF))
    const previousSalary = reverse.requiredAnnualSalary - 10_000
    if (Math.floor(previousSalary / 12) >= nonTaxable) {
      expect(calculateSalary({ annualSalary: previousSalary, nonTaxable, dependents: 1 }, AS_OF).monthlyNet).toBeLessThan(target)
    }
  })
})
