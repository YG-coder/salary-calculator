import { describe, expect, it } from 'vitest'
import { calculateRetirementTax, getRetirementTaxTenure, type RetirementTaxInput } from '../retirementTax'
import { assertRetirementTaxPolicyYear } from '../policy/retirementTax'
import { TAX_YEAR } from '../policyYear'
import { getRetirementDate, getSeveranceTenure } from '../severanceDates'

const base: RetirementTaxInput = {
  grossPay: 50_000_000, nonTaxablePay: 0, startDate: '2017-01-01', lastWorkingDate: '2026-12-31',
  profile: 'ordinary', payment: 'cash',
}
function calculated(overrides: Partial<RetirementTaxInput> = {}) {
  const result = calculateRetirementTax({ ...base, ...overrides })
  if (result.status !== 'calculated') throw new Error(result.reason)
  return result
}

describe('공식 예제·독립 수기 계산 (근거: docs/retirement-income-tax.md)', () => {
  it('5천만원·10년: 680,000 + 68,000 공제, 49,252,000 수령', () => {
    expect(calculated()).toMatchObject({
      serviceYears: 10, serviceDeduction: 15_000_000, annualizedIncome: 42_000_000,
      annualizedDeduction: 28_400_000, taxBase: 13_600_000, annualizedTax: 816_000,
      assessedIncomeTax: 680_000, incomeTax: 680_000, localTax: 68_000, totalTax: 748_000, netPay: 49_252_000,
    })
  })
  it('국세청 1억원·20년 예제: 2023 예제와 같은 근속·금액의 2026 사례', () => {
    expect(calculated({ grossPay: 100_000_000, startDate: '2007-01-01' })).toMatchObject({
      serviceYears: 20, serviceDeduction: 40_000_000, annualizedIncome: 36_000_000,
      annualizedDeduction: 24_800_000, taxBase: 11_200_000, annualizedTax: 672_000,
      incomeTax: 1_120_000, localTax: 112_000, netPay: 98_768_000,
    })
  })
  it('비과세는 공제 전에 제외하고 실수령액에는 포함한다', () => {
    expect(calculated({ grossPay: 55_000_000, nonTaxablePay: 5_000_000 })).toMatchObject({
      taxableIncome: 50_000_000, incomeTax: 680_000, localTax: 68_000, netPay: 54_252_000,
    })
    expect(calculated({ nonTaxablePay: 50_000_000 })).toMatchObject({
      taxableIncome: 0, serviceDeduction: 0, taxBase: 0, incomeTax: 0, localTax: 0, netPay: 50_000_000,
    })
  })
  it('과세소득보다 큰 근속공제를 한도로 제한하며 음수 세액을 만들지 않는다', () => {
    expect(calculated({ grossPay: 1 })).toMatchObject({ serviceDeduction: 1, annualizedIncome: 0, incomeTax: 0, netPay: 1 })
  })
  it('7년·50,000,123원: 단계별 원 절사와 최종 10원 절사를 구분한다', () => {
    // (50,000,123 - 9,000,000) × 12/7 → 70,285,925
    // 공제 45,200,000 + 285,925 × 55% → 45,357,258
    // 과표 24,928,667 × 15% - 1,260,000 → 2,479,300
    // × 7/12 → 1,446,258; 현금 원천징수 1,446,250 / 지방세 144,620
    const input = { grossPay: 50_000_123, startDate: '2020-01-01' }
    expect(calculated(input)).toMatchObject({
      serviceYears: 7, serviceDeduction: 9_000_000, annualizedIncome: 70_285_925,
      annualizedDeduction: 45_357_258, taxBase: 24_928_667, annualizedTax: 2_479_300,
      assessedIncomeTax: 1_446_258, incomeTax: 1_446_250, localTax: 144_620, netPay: 48_409_253,
    })
    const irp = calculated({ ...input, payment: 'irp' })
    expect(irp).toMatchObject({ accountDeposit: 50_000_123, deferredIncomeTax: 1_446_258, deferredLocalTax: 144_625 })
    expect(irp).not.toHaveProperty('netPay')
    expect(irp).not.toHaveProperty('incomeTax')
  })
  it.each([
    [28_041_665, 999, 0, 0, true],
    [28_041_666, 1_000, 1_000, 100, false],
  ])('소액부징수 경계: 12년·%i원', (grossPay, assessedIncomeTax, incomeTax, localTax, smallTaxExemption) => {
    const input = { grossPay, startDate: '2015-01-01' }
    expect(calculated(input)).toMatchObject({ assessedIncomeTax, incomeTax, localTax, smallTaxExemption })
    expect(calculated({ ...input, payment: 'irp' })).toMatchObject({ deferredIncomeTax: assessedIncomeTax })
  })
})

describe('공제·세율 경계 (기대값은 구현 호출 없이 분수로 독립 산출)', () => {
  it.each([[4,4_000_000],[5,5_000_000],[6,7_000_000],[9,13_000_000],[10,15_000_000],[11,17_500_000],[19,37_500_000],[20,40_000_000],[21,43_000_000]])('근속 %i년 공제', (years, deduction) => {
    expect(calculated({ grossPay: 100_000_000, startDate: `${2027-years}-01-01` }).serviceDeduction).toBe(deduction)
  })
  // 12년이면 근속공제 2천만원, 환산배율 1. 입력 gross = 2천만원 + 환산급여.
  it.each([
    [7_999_999,7_999_999,0], [8_000_000,8_000_000,0], [8_000_001,8_000_000,1],
    [69_999_999,45_199_999,24_800_000], [70_000_000,45_200_000,24_800_000], [70_000_001,45_200_000,24_800_001],
    [99_999_999,61_699_999,38_300_000], [100_000_000,61_700_000,38_300_000], [100_000_001,61_700_000,38_300_001],
    [299_999_999,151_699_999,148_300_000], [300_000_000,151_700_000,148_300_000], [300_000_001,151_700_000,148_300_001],
  ])('환산급여 %i원 공제 경계', (annualizedIncome, annualizedDeduction, taxBase) => {
    expect(calculated({ startDate: '2015-01-01', grossPay: 20_000_000 + annualizedIncome }))
      .toMatchObject({ annualizedIncome, annualizedDeduction, taxBase })
  })
  // 누진공제식을 복사하지 않고 각 세율의 과세구간 폭 × 세율을 합산한 값.
  it.each([
    [42_999_996,13_999_999,839_999], [42_999_998,14_000_000,840_000], [43_000_001,14_000_001,840_000],
    [121_272_724,49_999_999,6_239_999], [121_272_726,50_000_000,6_240_000], [121_272_728,50_000_001,6_240_000],
    [190_363_633,87_999_999,15_359_999], [190_363_635,88_000_000,15_360_000], [190_363_637,88_000_001,15_360_000],
    [302_615_382,149_999_999,37_059_999], [302_615_384,150_000_000,37_060_000], [302_615_385,150_000_001,37_060_000],
    [533_384_613,299_999_999,94_059_999], [533_384_614,300_000_000,94_060_000], [533_384_616,300_000_001,94_060_000],
    [841_076_921,499_999_999,174_059_999], [841_076_922,500_000_000,174_060_000], [841_076_924,500_000_001,174_060_000],
    [1_610_307_690,999_999_999,384_059_999], [1_610_307_691,1_000_000_000,384_060_000], [1_610_307_693,1_000_000_001,384_060_000],
    // 환산급여 20억원 → 공제 7억4670만원 → 과표 12억5330만원. 최고 세율 구간 내부.
    [2_000_000_000,1_253_300_000,498_045_000],
  ])('환산급여 %i원 세율 경계', (annualizedIncome, taxBase, annualizedTax) => {
    expect(calculated({ startDate: '2015-01-01', grossPay: 20_000_000 + annualizedIncome }))
      .toMatchObject({ taxBase, annualizedTax })
  })
})

describe('세법상 달력 근속기간과 정책 연도', () => {
  it.each([
    ['2026-01-01','2026-01-01',1,1], ['2026-01-31','2026-02-28',1,1],
    ['2025-10-14','2026-10-13',12,1], ['2025-10-14','2026-10-14',13,2],
    ['2016-10-14','2026-10-13',120,10], ['2016-10-14','2026-10-14',121,11],
    ['2023-03-01','2024-02-29',12,1], ['2023-03-01','2024-03-01',13,2],
    ['2024-02-29','2025-02-28',12,1], ['2024-02-29','2025-03-01',13,2],
    ['2025-12-31','2026-12-30',12,1], ['2025-12-31','2026-12-31',13,2],
  ])('%s~%s → %i개월, %i년', (start, end, serviceMonths, serviceYears) => {
    expect(getRetirementTaxTenure(start, end)).toEqual({ serviceMonths, serviceYears })
  })
  it('윤년 재직 366일을 세법상 2년으로 올리지 않는다', () => {
    const end = getRetirementDate('2024-02-29')!
    expect(getSeveranceTenure('2023-03-01', end).workingDays).toBe(366)
    expect(getRetirementTaxTenure('2023-03-01', '2024-02-29')?.serviceYears).toBe(1)
  })
  it('연말 마지막 날을 다음 해로 넘겨 세금 정책을 선택하지 않는다', () => {
    expect(getRetirementDate(base.lastWorkingDate)).toBe('2027-01-01')
    expect(calculated().serviceYears).toBe(10)
    expect(() => assertRetirementTaxPolicyYear(TAX_YEAR)).not.toThrow()
    for (const year of [2025, 2027, NaN]) expect(() => assertRetirementTaxPolicyYear(year)).toThrow('퇴직소득세 정책')
  })
})

describe('보류는 금액 없이 이유만 반환', () => {
  const cases: Partial<RetirementTaxInput>[] = [
    {profile:''}, {profile:'special'}, {payment:''}, {payment:'other'},
    {payment:'irp',nonTaxablePay:1}, {lastWorkingDate:'2027-01-01'}, {lastWorkingDate:'2025-12-31'},
    {lastWorkingDate:''}, {lastWorkingDate:'2026-02-29'}, {startDate:'2027-01-01'},
    {startDate:'2024-02-30'}, {startDate:'invalid'}, {startDate:''},
    ...[NaN,Infinity,-1,0,1.5,Number.MAX_SAFE_INTEGER].map(grossPay => ({grossPay})),
    ...[NaN,Infinity,-1,0.5,50_000_001].map(nonTaxablePay => ({nonTaxablePay})),
  ]
  it.each(cases)('%j', overrides => {
    const result = calculateRetirementTax({...base,...overrides})
    expect(result.status).toBe('held')
    expect(Object.keys(result).sort()).toEqual(['reason','status'])
    if (result.status === 'held') expect(result.reason.length).toBeGreaterThan(0)
  })
  it('큰 정수 입력도 곱셈 오차 없이 계산하거나 범위를 벗어나면 보류한다', () => {
    const result = calculated({ grossPay: 100_000_000_001 })
    expect(result.status).toBe('calculated')
    for (const value of Object.values(result).filter(v => typeof v === 'number')) expect(Number.isSafeInteger(value)).toBe(true)
  })
})
