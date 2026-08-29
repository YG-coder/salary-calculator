// src/lib/__tests__/bonusWithholding.test.ts
// 상여금 원천징수 계산 테스트
// 근거: 소득세법 제136조, 시행령 제195조 / 조사 문서 docs/bonus-tax-policy.md

import { describe, it, expect } from 'vitest'
import {
  calculateBonusWithholding,
  normalizeBonusPeriodMonths,
  resolveImplicitPeriod,
} from '@/lib/bonusWithholding'
import { calcSimplifiedWithholdingTax } from '@/lib/incomeTax'
import { RATES } from '@/lib/constants'
import { BONUS_POLICY_META, MAX_BONUS_PERIOD_MONTHS } from '@/lib/policy/bonus'

// 자녀세액공제가 2026.3.1 기준으로 신/구가 나뉘므로 계산 시점을 고정한다.
const AS_OF = new Date('2026-08-29T00:00:00+09:00')

const BASE = {
  bonusAmount: 6_000_000,
  monthlyPay: 3_000_000,
  dependents: 1,
  childCount8to20: 0,
} as const

describe('지급대상기간 월수 보정 (제136조①3)', () => {
  it.each([
    [1, 1], [6, 6], [12, 12],
    [13, 12], [24, 12], [1000, 12],   // 1년 초과는 1년
    [0.1, 1], [0.9, 1], [1.2, 2],     // 1개월 미만 끝수는 1개월
    [0, 1], [-5, 1],
  ])('%s개월 → %s개월', (input, expected) => {
    expect(normalizeBonusPeriodMonths(input)).toBe(expected)
  })

  it.each([['NaN', NaN], ['Infinity', Infinity], ['-Infinity', -Infinity]])(
    '%s → 1개월',
    (_l, v) => { expect(normalizeBonusPeriodMonths(v)).toBe(1) },
  )

  it('상한은 정책 상수와 일치한다', () => {
    expect(normalizeBonusPeriodMonths(99)).toBe(MAX_BONUS_PERIOD_MONTHS)
  })
})

describe('지급대상기간이 없는 상여의 기간 산정 (제136조①2)', () => {
  it('그 해 첫 상여: 1월부터 지급월까지', () => {
    expect(resolveImplicitPeriod(6, undefined).months).toBe(6)
    expect(resolveImplicitPeriod(1, undefined).months).toBe(1)
    expect(resolveImplicitPeriod(12, undefined).months).toBe(12)
  })

  it('두 번째 이후 상여: 직전 지급월의 다음 달부터 이번 지급월까지', () => {
    expect(resolveImplicitPeriod(9, 6).months).toBe(3)   // 7·8·9월
    expect(resolveImplicitPeriod(12, 11).months).toBe(1)
    expect(resolveImplicitPeriod(7, 1).months).toBe(6)
  })

  it('직전 상여가 이번 지급월과 같거나 뒤면 첫 상여로 취급한다', () => {
    expect(resolveImplicitPeriod(6, 6).months).toBe(6)
    expect(resolveImplicitPeriod(6, 9).months).toBe(6)
  })

  it('산정 근거 문구를 함께 돌려준다', () => {
    expect(resolveImplicitPeriod(6, undefined).basis).toContain('첫 상여')
    expect(resolveImplicitPeriod(9, 6).basis).toContain('직전 상여')
  })

  it('지급월이 범위를 벗어나면 1개월로 떨어진다', () => {
    for (const v of [0, 13, NaN, Infinity, undefined]) {
      expect(resolveImplicitPeriod(v as number, undefined).months).toBe(1)
    }
  })
})

describe('제136조①1 산식 — 지급대상기간이 있는 상여', () => {
  it('월환산액 = 상여금÷월수 + 상여 외 월평균 급여', () => {
    const r = calculateBonusWithholding(
      { ...BASE, periodType: 'withPeriod', periodMonths: 6 }, AS_OF,
    )
    expect(r.periodMonths).toBe(6)
    expect(r.monthlyConverted).toBe(6_000_000 / 6 + 3_000_000) // 4,000,000
  })

  it('간이세액표 조회 결과가 기존 공통 엔진과 정확히 일치한다 (회귀)', () => {
    const r = calculateBonusWithholding(
      { ...BASE, periodType: 'withPeriod', periodMonths: 6 }, AS_OF,
    )
    const expected = calcSimplifiedWithholdingTax(
      { monthlyTaxable: 4_000_000, dependents: 1, childCount8to20: 0 }, AS_OF,
    )
    expect(r.monthlyTaxOnConverted).toBe(expected)
    expect(r.grossTaxForPeriod).toBe(expected * 6)
  })

  it('세액 = 월세액 × 월수 − 기납부세액', () => {
    const prepaid = 500_000
    const r = calculateBonusWithholding(
      { ...BASE, periodType: 'withPeriod', periodMonths: 6, prepaidTax: prepaid }, AS_OF,
    )
    expect(r.prepaidTax).toBe(prepaid)
    expect(r.prepaidTaxEstimated).toBe(false)
    expect(r.incomeTax).toBe(Math.max(0, Math.floor((r.grossTaxForPeriod - prepaid) / 10) * 10))
  })

  it('기납부세액이 더 크면 추가 징수 세액은 0 (음수 아님)', () => {
    const r = calculateBonusWithholding(
      { ...BASE, periodType: 'withPeriod', periodMonths: 6, prepaidTax: 99_999_999 }, AS_OF,
    )
    expect(r.incomeTax).toBe(0)
    expect(r.localTax).toBe(0)
  })
})

describe('기납부세액 자동 추정', () => {
  it('미지정 시 월평균 급여 기준 간이세액표 × 월수로 추정한다', () => {
    const r = calculateBonusWithholding(
      { ...BASE, periodType: 'withPeriod', periodMonths: 6 }, AS_OF,
    )
    const expected = calcSimplifiedWithholdingTax(
      { monthlyTaxable: 3_000_000, dependents: 1, childCount8to20: 0 }, AS_OF,
    ) * 6
    expect(r.prepaidTaxEstimated).toBe(true)
    expect(r.prepaidTax).toBe(expected)
  })

  it('추정치를 쓰면 상여금분만 남는다 — 월급이 같을 때 상여 없는 달과 대조', () => {
    const r = calculateBonusWithholding(
      { ...BASE, periodType: 'withPeriod', periodMonths: 6 }, AS_OF,
    )
    // 상여금 0이면 월환산액 = 월급이므로 추가 세액이 0이어야 한다
    const zero = calculateBonusWithholding(
      { ...BASE, bonusAmount: 0, periodType: 'withPeriod', periodMonths: 6 }, AS_OF,
    )
    expect(zero.incomeTax).toBe(0)
    expect(r.incomeTax).toBeGreaterThan(0)
  })

  it('사용자 입력 0원과 미지정은 다르게 동작한다', () => {
    const explicit = calculateBonusWithholding(
      { ...BASE, periodType: 'withPeriod', periodMonths: 6, prepaidTax: 0 }, AS_OF,
    )
    const estimated = calculateBonusWithholding(
      { ...BASE, periodType: 'withPeriod', periodMonths: 6 }, AS_OF,
    )
    expect(explicit.prepaidTaxEstimated).toBe(false)
    expect(explicit.prepaidTax).toBe(0)
    expect(explicit.incomeTax).toBeGreaterThan(estimated.incomeTax)
  })
})

describe('4대보험 — 고용보험만 계산한다 (조사 결론 P5)', () => {
  it('고용보험료 = 상여금 × 근로자 요율', () => {
    const r = calculateBonusWithholding(
      { ...BASE, periodType: 'withPeriod', periodMonths: 6 }, AS_OF,
    )
    expect(r.employmentInsurance).toBe(Math.floor(6_000_000 * RATES.employment / 10) * 10)
  })

  it('⚠️ 결과에 국민연금·건강보험·장기요양 항목이 없다', () => {
    const r = calculateBonusWithholding(
      { ...BASE, periodType: 'withPeriod', periodMonths: 6 }, AS_OF,
    ) as unknown as Record<string, unknown>
    for (const key of ['nationalPension', 'healthInsurance', 'longTermCare']) {
      expect(r[key]).toBeUndefined()
    }
  })

  it('총 공제 = 소득세 + 지방소득세 + 고용보험, 실수령 = 상여금 − 총 공제', () => {
    const r = calculateBonusWithholding(
      { ...BASE, periodType: 'withPeriod', periodMonths: 6 }, AS_OF,
    )
    expect(r.totalDeduction).toBe(r.incomeTax + r.localTax + r.employmentInsurance)
    expect(r.netBonus).toBe(6_000_000 - r.totalDeduction)
    expect(r.additionalAmountDue).toBe(0)
  })

  it('지방소득세는 소득세의 10% (10원 절사)', () => {
    const r = calculateBonusWithholding(
      { ...BASE, periodType: 'withPeriod', periodMonths: 6, prepaidTax: 0 }, AS_OF,
    )
    expect(r.localTax).toBe(Math.floor(r.incomeTax * RATES.localTax / 10) * 10)
  })
})

describe('지급대상기간 유무에 따른 분기', () => {
  it('같은 상여금이라도 기간이 길면 월환산액이 낮아져 세부담이 줄어든다', () => {
    const short = calculateBonusWithholding(
      { ...BASE, periodType: 'withPeriod', periodMonths: 1, prepaidTax: 0 }, AS_OF,
    )
    const long = calculateBonusWithholding(
      { ...BASE, periodType: 'withPeriod', periodMonths: 12, prepaidTax: 0 }, AS_OF,
    )
    expect(short.monthlyConverted).toBeGreaterThan(long.monthlyConverted)
  })

  it('지급대상기간 없는 상여도 같은 산식을 탄다', () => {
    const implicit = calculateBonusWithholding(
      { ...BASE, periodType: 'withoutPeriod', paymentMonth: 6 }, AS_OF,
    )
    const explicit = calculateBonusWithholding(
      { ...BASE, periodType: 'withPeriod', periodMonths: 6 }, AS_OF,
    )
    expect(implicit.periodMonths).toBe(explicit.periodMonths)
    expect(implicit.incomeTax).toBe(explicit.incomeTax)
  })

  it('직전 상여가 있으면 기간이 짧아져 월환산액이 올라간다', () => {
    const first = calculateBonusWithholding(
      { ...BASE, periodType: 'withoutPeriod', paymentMonth: 12 }, AS_OF,
    )
    const second = calculateBonusWithholding(
      { ...BASE, periodType: 'withoutPeriod', paymentMonth: 12, previousBonusMonth: 6 }, AS_OF,
    )
    expect(second.periodMonths).toBe(6)
    expect(first.periodMonths).toBe(12)
    expect(second.monthlyConverted).toBeGreaterThan(first.monthlyConverted)
  })
})

describe('비정상 입력 방어', () => {
  it.each([
    ['NaN 상여금', { bonusAmount: NaN }],
    ['Infinity 상여금', { bonusAmount: Infinity }],
    ['음수 상여금', { bonusAmount: -1_000_000 }],
    ['NaN 월급', { monthlyPay: NaN }],
    ['음수 월급', { monthlyPay: -1 }],
    ['음수 부양가족', { dependents: -3 }],
    ['Infinity 자녀', { childCount8to20: Infinity }],
  ])('%s → 유한한 결과', (_l, over) => {
    const r = calculateBonusWithholding(
      { ...BASE, ...over, periodType: 'withPeriod', periodMonths: 6 }, AS_OF,
    )
    for (const v of [r.incomeTax, r.localTax, r.employmentInsurance, r.totalDeduction, r.netBonus]) {
      expect(Number.isFinite(v)).toBe(true)
    }
    expect(r.incomeTax).toBeGreaterThanOrEqual(0)
    expect(r.employmentInsurance).toBeGreaterThanOrEqual(0)
  })

  it('상여금 0이면 실효 공제율은 null', () => {
    const r = calculateBonusWithholding(
      { ...BASE, bonusAmount: 0, periodType: 'withPeriod', periodMonths: 6 }, AS_OF,
    )
    expect(r.effectiveDeductionRate).toBeNull()
  })

  it('매우 큰 유한값도 Infinity가 되지 않는다', () => {
    const r = calculateBonusWithholding(
      {
        ...BASE,
        bonusAmount: Number.MAX_VALUE,
        monthlyPay: Number.MAX_VALUE,
        periodType: 'withPeriod',
        periodMonths: 12,
      },
      AS_OF,
    )
    expect(Number.isFinite(r.incomeTax)).toBe(true)
    expect(Number.isFinite(r.employmentInsurance)).toBe(true)
  })

  it('공개 계산 함수도 UI와 같은 금액 상한을 적용해 안전정수 범위를 지킨다', () => {
    const r = calculateBonusWithholding(
      {
        ...BASE,
        bonusAmount: Number.MAX_VALUE,
        monthlyPay: Number.MAX_VALUE,
        prepaidTax: Number.MAX_VALUE,
        periodType: 'withPeriod',
        periodMonths: 12,
      },
      AS_OF,
    )
    expect(r.monthlyConverted).toBeLessThan(Number.MAX_SAFE_INTEGER)
    expect(Number.isSafeInteger(r.totalDeduction)).toBe(true)
  })

  it('공제액이 상여금을 넘으면 음수 실수령 대신 추가 납부액을 분리한다', () => {
    const r = calculateBonusWithholding(
      {
        bonusAmount: 1_000,
        monthlyPay: 1_000_000_000,
        periodType: 'withPeriod',
        periodMonths: 12,
        dependents: 1,
        prepaidTax: 0,
      },
      AS_OF,
    )
    expect(r.totalDeduction).toBeGreaterThan(r.netBonus)
    expect(r.netBonus).toBe(0)
    expect(r.additionalAmountDue).toBe(r.totalDeduction - 1_000)
  })
})

describe('정책 메타데이터가 낡으면 실패한다', () => {
  it('asOf는 유효한 과거 날짜다', () => {
    const d = new Date(BONUS_POLICY_META.asOf)
    expect(Number.isNaN(d.getTime())).toBe(false)
    expect(d.getTime()).toBeLessThanOrEqual(Date.now())
  })

  it('⚠️ reviewAt이 지났으면 실패한다 — 간이세액표 재확인 필요', () => {
    const d = new Date(BONUS_POLICY_META.reviewAt)
    expect(d.getTime()).toBeGreaterThan(Date.now())
  })

  it('근거 조문과 문서 경로가 기록되어 있다', () => {
    expect(BONUS_POLICY_META.basis).toContain('제136조')
    expect(BONUS_POLICY_META.reference).toBe('docs/bonus-tax-policy.md')
  })
})
