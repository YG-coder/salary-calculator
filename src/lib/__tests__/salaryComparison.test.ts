// src/lib/__tests__/salaryComparison.test.ts
// 연봉 비교 계산기 회귀 테스트
//
// 핵심 목표 2가지:
//  ① 동일 입력에서 기존 연봉 계산기(calculateSalary)와 결과가 완전히 일치할 것
//  ② 국민연금 상한 등으로 실수령률이 단조 감소하지 않는 구간을 실제로 잡아낼 것

import { describe, it, expect } from 'vitest'
import { calculateSalary } from '@/lib/salary'
import {
  compareSalaries,
  DEDUCTION_ITEMS,
  formatRate,
  formatSignedKRW,
  type SalaryComparisonInput,
} from '@/lib/salaryComparison'
import { getPensionLimits } from '@/lib/constants'

// 계산 시점을 고정한다. 국민연금 상·하한은 매년 7월 1일 자로 바뀌므로
// 고정하지 않으면 7월 전후로 테스트 결과가 달라진다.
const AS_OF = new Date('2026-08-29T00:00:00+09:00')

const BASE: Omit<SalaryComparisonInput, 'annualSalaryA' | 'annualSalaryB'> = {
  nonTaxable: 200_000,
  dependents: 1,
  childCount8to20: 0,
}

function compare(a: number, b: number, over: Partial<SalaryComparisonInput> = {}) {
  return compareSalaries({ ...BASE, annualSalaryA: a, annualSalaryB: b, ...over }, AS_OF)
}

describe('① 기존 연봉 계산기와 결과 일치 (회귀)', () => {
  const cases = [
    { salary: 24_000_000, nonTaxable: 0, dependents: 1, childCount8to20: 0 },
    { salary: 40_000_000, nonTaxable: 200_000, dependents: 1, childCount8to20: 0 },
    { salary: 55_000_000, nonTaxable: 200_000, dependents: 3, childCount8to20: 2 },
    { salary: 80_000_000, nonTaxable: 0, dependents: 2, childCount8to20: 1 },
    { salary: 150_000_000, nonTaxable: 200_000, dependents: 4, childCount8to20: 2 },
  ]

  it.each(cases)('연봉 $salary — A/B 양쪽 모두 calculateSalary()와 동일', (c) => {
    const expected = calculateSalary(
      {
        annualSalary: c.salary,
        nonTaxable: c.nonTaxable,
        dependents: c.dependents,
        childCount8to20: c.childCount8to20,
      },
      AS_OF,
    )
    const r = compareSalaries(
      {
        annualSalaryA: c.salary,
        annualSalaryB: c.salary,
        nonTaxable: c.nonTaxable,
        dependents: c.dependents,
        childCount8to20: c.childCount8to20,
      },
      AS_OF,
    )
    // 객체 전체를 비교한다. 항목 하나라도 어긋나면 실패.
    expect(r.a).toEqual(expected)
    expect(r.b).toEqual(expected)
  })

  it('A와 B가 같으면 모든 차이가 0이고 한계율은 정의되지 않는다', () => {
    const r = compare(40_000_000, 40_000_000)
    expect(r.annualGrossDiff).toBe(0)
    expect(r.monthlyNetDiff).toBe(0)
    expect(r.annualNetDiff).toBe(0)
    expect(r.annualDeductionDiff).toBe(0)
    expect(r.marginalNetRate).toBeNull()
    expect(r.marginalDeductionRate).toBeNull()
    for (const d of r.deductionDeltas) {
      expect(d.monthlyDiff).toBe(0)
      expect(d.annualDiff).toBe(0)
    }
  })

  it('A↔B를 뒤집으면 모든 차이의 부호만 뒤집힌다', () => {
    const fwd = compare(40_000_000, 50_000_000)
    const rev = compare(50_000_000, 40_000_000)
    expect(rev.annualGrossDiff).toBe(-fwd.annualGrossDiff)
    expect(rev.annualNetDiff).toBe(-fwd.annualNetDiff)
    expect(rev.monthlyNetDiff).toBe(-fwd.monthlyNetDiff)
    // 한계 실수령률은 부호가 상쇄되어 동일해야 한다
    expect(rev.marginalNetRate).toBeCloseTo(fwd.marginalNetRate!, 12)
  })
})

describe('② 항목별 차이가 엔진 결과와 일치한다', () => {
  it('각 항목의 a·b가 calculateSalary breakdown과 같고 차액이 b-a이다', () => {
    const r = compare(40_000_000, 60_000_000)
    const ea = calculateSalary({ annualSalary: 40_000_000, ...BASE }, AS_OF)
    const eb = calculateSalary({ annualSalary: 60_000_000, ...BASE }, AS_OF)
    for (const d of r.deductionDeltas) {
      expect(d.a).toBe(ea.breakdown[d.key])
      expect(d.b).toBe(eb.breakdown[d.key])
      expect(d.monthlyDiff).toBe(d.b - d.a)
      expect(d.annualDiff).toBe(d.monthlyDiff * 12)
    }
  })

  it('표시 항목은 6개이며 순서가 고정되어 있다', () => {
    expect(DEDUCTION_ITEMS.map((i) => i.key)).toEqual([
      'nationalPension', 'healthInsurance', 'longTermCare',
      'employment', 'incomeTax', 'localTax',
    ])
    expect(compare(30_000_000, 40_000_000).deductionDeltas).toHaveLength(6)
  })

  it('항목별 월 차액 합계 + 실수령 월 차액 = 세전 월급 차액', () => {
    const r = compare(40_000_000, 60_000_000)
    const deductionSum = r.deductionDeltas.reduce((s, d) => s + d.monthlyDiff, 0)
    const grossMonthlyDiff = r.b.monthlyGross - r.a.monthlyGross
    expect(deductionSum + r.monthlyNetDiff).toBe(grossMonthlyDiff)
  })
})

describe('③ 한계 실수령률', () => {
  it('연 실수령 차이 ÷ 세전 연봉 차이', () => {
    const r = compare(40_000_000, 50_000_000)
    expect(r.marginalNetRate).toBeCloseTo(r.annualNetDiff / r.annualGrossDiff, 12)
    expect(r.marginalDeductionRate).toBeCloseTo(1 - r.marginalNetRate!, 12)
  })

  it('한계 실수령률은 평균 실수령률보다 낮다 (누진 구간)', () => {
    const r = compare(40_000_000, 50_000_000)
    expect(r.marginalNetRate!).toBeLessThan(r.averageNetRateA!)
  })

  it('평균 실수령률은 연 실수령 ÷ 세전 연봉이다', () => {
    const r = compare(40_000_000, 50_000_000)
    expect(r.averageNetRateA).toBeCloseTo(r.a.annualNet / 40_000_000, 12)
    expect(r.averageNetRateB).toBeCloseTo(r.b.annualNet / 50_000_000, 12)
  })

  it('연봉 0이면 평균 실수령률은 null이다', () => {
    const r = compare(0, 40_000_000)
    expect(r.averageNetRateA).toBeNull()
    expect(r.averageNetRateB).not.toBeNull()
  })
})

describe('④ ⚠️ 국민연금 상한 — 실수령률이 단조 감소하지 않는 구간', () => {
  const { max } = getPensionLimits(AS_OF)
  // 상한을 사이에 두는 연봉 구간을 만든다 (월 과세소득 기준 상한 → 연봉 환산)
  const capAnnual = (max + BASE.nonTaxable) * 12

  it('테스트 전제: 상한 아래/위 연봉이 실제로 상한 플래그를 가른다', () => {
    const below = compare(capAnnual - 12_000_000, capAnnual - 12_000_000)
    const above = compare(capAnnual + 12_000_000, capAnnual + 12_000_000)
    expect(below.a.flags.pensionCapped).toBe(false)
    expect(above.a.flags.pensionCapped).toBe(true)
  })

  it('한쪽만 상한에 걸리면 crossesPensionCap이 켜진다', () => {
    const r = compare(capAnnual - 12_000_000, capAnnual + 12_000_000)
    expect(r.crossesPensionCap).toBe(true)
  })

  it('양쪽 다 상한 위이거나 양쪽 다 아래면 꺼진다', () => {
    expect(compare(capAnnual + 6_000_000, capAnnual + 24_000_000).crossesPensionCap).toBe(false)
    expect(compare(24_000_000, 36_000_000).crossesPensionCap).toBe(false)
  })

  it('상한 위에서는 국민연금 월 차액이 0이다 (더 내지 않는다)', () => {
    const r = compare(capAnnual + 12_000_000, capAnnual + 60_000_000)
    const pension = r.deductionDeltas.find((d) => d.key === 'nationalPension')!
    expect(pension.monthlyDiff).toBe(0)
    expect(pension.annualDiff).toBe(0)
  })

  it('⚠️ 상한을 지나면 한계 실수령률이 오른다 — 단조 감소가 아니다 (실측 고정)', () => {
    // 2026-08-29 기준 국민연금 상한은 연봉 약 8,148만원에서 걸린다.
    // 상한 직전 구간과 상한 직후 구간의 한계 실수령률을 비교하면 "연봉이 오르면
    // 실수령률은 항상 떨어진다"는 통념과 반대 방향이 실제로 나타난다.
    const step = 1_000_000
    const below = compare(80_000_000, 80_000_000 + step) // 상한 아래
    const above = compare(84_000_000, 84_000_000 + step) // 상한 위

    expect(below.crossesPensionCap).toBe(false)
    expect(above.crossesPensionCap).toBe(false)

    // 국민연금은 상한 위에서 더 이상 늘지 않는다
    const belowPension = below.deductionDeltas.find((d) => d.key === 'nationalPension')!
    const abovePension = above.deductionDeltas.find((d) => d.key === 'nationalPension')!
    expect(belowPension.monthlyDiff).toBeGreaterThan(0)
    expect(abovePension.monthlyDiff).toBe(0)

    // 그 결과 위 구간의 한계 실수령률이 더 높다 (약 66.3% → 71.1%)
    expect(above.marginalNetRate!).toBeGreaterThan(below.marginalNetRate!)
    expect(below.marginalNetRate!).toBeCloseTo(0.663, 2)
    expect(above.marginalNetRate!).toBeCloseTo(0.711, 2)
  })

  it('⚠️ 한계 실수령률은 연봉 구간 전체에서 단조 감소하지 않는다', () => {
    // 3,000만~1억 3,000만원을 100만원 단위로 훑으면 한계 실수령률이 올라가는 구간이
    // 여러 번 나타난다(국민연금 상한 + 간이세액표 조견표의 계단 구조).
    // "연봉이 오르면 실수령률은 항상 떨어진다"고 안내하면 안 되는 근거다.
    const step = 1_000_000
    const rates: number[] = []
    for (let s = 30_000_000; s <= 130_000_000; s += step) {
      rates.push(compare(s, s + step).marginalNetRate!)
    }
    const rises = rates.filter((r, i) => i > 0 && r > rates[i - 1] + 1e-9).length
    expect(rises).toBeGreaterThan(0)
    // 모든 값이 유한해야 한다
    expect(rates.every((r) => Number.isFinite(r))).toBe(true)
  })

  it('상한을 걸치는 구간에서도 계산이 성립한다 (실수령은 늘어난다)', () => {
    const r = compare(capAnnual - 12_000_000, capAnnual + 12_000_000)
    expect(r.annualNetDiff).toBeGreaterThan(0)
    expect(r.marginalNetRate!).toBeGreaterThan(0)
    expect(r.marginalNetRate!).toBeLessThan(1)
  })
})

describe('⑤ 고소득 간이세액표 산식 경계', () => {
  it('한쪽만 조견표 상한(월 과세 1천만원)을 넘으면 플래그가 켜진다', () => {
    // 월 과세소득 1천만원 ≒ 연봉 1억 2천만 + 비과세
    const r = compare(100_000_000, 200_000_000)
    expect(r.crossesHighIncomeTaxFormula).toBe(true)
  })

  it('양쪽 다 넘으면 꺼진다', () => {
    expect(compare(200_000_000, 300_000_000).crossesHighIncomeTaxFormula).toBe(false)
  })
})

describe('⑥ 비정상 입력 방어', () => {
  it.each([
    ['NaN', NaN],
    ['Infinity', Infinity],
    ['-Infinity', -Infinity],
    ['음수', -50_000_000],
  ])('연봉 A가 %s이면 0으로 정규화되고 결과는 유한값', (_l, v) => {
    const r = compare(v, 40_000_000)
    expect(Number.isFinite(r.annualNetDiff)).toBe(true)
    expect(Number.isFinite(r.annualGrossDiff)).toBe(true)
    expect(r.a.monthlyGross).toBe(0)
    expect(r.averageNetRateA).toBeNull()
  })

  it('비과세·부양가족이 비정상이어도 유한한 결과를 낸다', () => {
    const r = compare(40_000_000, 50_000_000, {
      nonTaxable: NaN,
      dependents: -5,
      childCount8to20: Infinity,
    })
    expect(Number.isFinite(r.annualNetDiff)).toBe(true)
    expect(Number.isFinite(r.marginalNetRate!)).toBe(true)
  })

  it('부양가족은 최소 1명으로 보정된다', () => {
    const withZero = compare(40_000_000, 40_000_000, { dependents: 0 })
    const withOne = compare(40_000_000, 40_000_000, { dependents: 1 })
    expect(withZero.a).toEqual(withOne.a)
  })
})

describe('⑦ 표시 포맷', () => {
  it('formatRate', () => {
    expect(formatRate(0.6543)).toBe('65.4%')
    expect(formatRate(null)).toBe('—')
    expect(formatRate(NaN)).toBe('—')
  })

  it('formatSignedKRW — 0은 부호 없이, 음수는 −(U+2212)', () => {
    expect(formatSignedKRW(0)).toBe('0원')
    expect(formatSignedKRW(1_234_000)).toBe('+1,234,000원')
    expect(formatSignedKRW(-1_234_000)).toBe('−1,234,000원')
  })
})
