import { describe, expect, it } from 'vitest'
import { createFloor10Rate, percentageToRate, applyRateFloor10 } from '../rateMath'
import { RATES, getPensionRate } from '../constants'
import { EMPLOYER_EMPLOYMENT_RATES } from '../policy/socialInsurance'
import { applyHealthInsuranceRate, calculateLongTermCare, calculateLocalTax, calculateEmployeeEmploymentInsurance } from '../insurancePremiums'
import { calculateSocialInsurance } from '../calculators'

describe('요율 적용의 독립 정수 검증', () => {
  it.each([[0.7, 0.007], [20, 0.2], [1e-7, 1e-9]])('퍼센트 %f를 요율 %f로 정확하게 변환한다', (percent, expected) => {
    expect(percentageToRate(percent)).toBe(expected)
  })

  it('산재 0.7% 입력도 350만원에서 24,500원으로 정확히 절사한다', () => {
    const rate = percentageToRate(0.7)
    expect(applyRateFloor10(3_500_000, rate)).toBe(24_500)
    expect(calculateSocialInsurance({ monthlyGross: 3_500_000, industrialAccidentRate: rate }).industrialAccident).toBe(24_500)
  })
  const rates = [
    // 저수준 요율 산술만 검증한다. 제도 상·하한은 healthInsuranceLimits.test.ts에서 따로 검증한다.
    { name: '건강보험 요율 산술', calculate: applyHealthInsuranceRate, numerator: 719, denominator: 200_000 },
    { name: '근로자 고용보험', calculate: calculateEmployeeEmploymentInsurance, numerator: 9, denominator: 10_000 },
    ...EMPLOYER_EMPLOYMENT_RATES.map((option, index) => ({
      name: `사업주 고용보험 ${option.rateLabel}`,
      calculate: createFloor10Rate(option.rate),
      numerator: [23, 27, 31, 35][index], denominator: 20_000,
    })),
    { name: '국민연금', calculate: createFloor10Rate(getPensionRate()), numerator: 19, denominator: 4_000 },
    { name: '지방소득세', calculate: calculateLocalTax, numerator: 1, denominator: 100 },
  ]

  it.each(rates)('$name — 0~1천만원 모든 1원 입력이 정수 나머지 누적값과 같다', ({ calculate, numerator, denominator }) => {
    // 구현의 곱셈/나눗셈을 정답으로 복제하지 않는다. 법정 분수의 분자를
    // 1원마다 누적하고, 정수 분모를 넘을 때만 10원 단위를 증가시킨다.
    let remainder = 0
    let units = 0
    for (let amount = 0; amount <= 10_000_000; amount += 1) {
      const expected = units * 10
      const actual = calculate(amount)
      if (actual !== expected) throw new Error(`${amount}원: 기대 ${expected}, 실제 ${actual}`)
      remainder += numerator
      if (remainder >= denominator) {
        units += 1
        remainder -= denominator
      }
    }
  }, 30_000)

  it('장기요양 — 건강보험 0~200만원의 모든 10원 입력이 법정 정수 비율과 같다', () => {
    // 건강보험료는 이미 10원 단위. H=10k이면 장기요양 10원 단위는
    // k × 9448 / 71900의 정수 몫이다. 13.14%라는 표시값을 사용하지 않는다.
    let remainder = 0
    let units = 0
    for (let health = 0; health <= 2_000_000; health += 10) {
      if (calculateLongTermCare(health) !== units * 10) throw new Error(`건강보험 ${health}원`)
      remainder += 9_448
      if (remainder >= 71_900) { units += 1; remainder -= 71_900 }
    }
    expect(RATES.longTermCareIncome).toBe(0.009448)
  })

  it('큰 금액의 중간 곱이 안전정수를 넘으면 정확한 분수로 계산한다', () => {
    const amount = 90_000_000_000_000
    const calculate = createFloor10Rate(RATES.healthInsurance)
    const reference = Number(BigInt(amount) * BigInt(719) / BigInt(200_000)) * 10
    expect(calculate(amount)).toBe(reference)
  })

  it('지수 요율과 소수 금액도 십진수 값대로 처리한다', () => {
    expect(createFloor10Rate(1e-7)(1_000_000_000)).toBe(100)
    expect(createFloor10Rate(0.1)(299.99)).toBe(20)
    expect(createFloor10Rate(0.1)(300)).toBe(30)
  })

  it('0 요율을 허용하고 잘못된 분모는 거부한다', () => {
    expect(createFloor10Rate(0)(123_456)).toBe(0)
    expect(() => createFloor10Rate(0.009, 0)).toThrow(RangeError)
  })
})
