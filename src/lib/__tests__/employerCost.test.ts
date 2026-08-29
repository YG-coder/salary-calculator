// src/lib/__tests__/employerCost.test.ts
// 기업 총 인건비 계산 테스트 / 산재요율 입력화 회귀
// 설계 근거: docs/employer-cost-policy.md

import { describe, it, expect } from 'vitest'
import { calculateEmployerCost } from '@/lib/employerCost'
import { calculateSalary } from '@/lib/salary'
import { calculateSocialInsurance } from '@/lib/calculators'
import {
  EMPLOYER_EMPLOYMENT_RATES,
  DEFAULT_EMPLOYER_EMPLOYMENT_RATE,
  EMPLOYER_COST_POLICY_META,
  parseIndustrialAccidentRatePercent,
  sanitizeIndustrialAccidentRateInput,
} from '@/lib/policy/socialInsurance'

const AS_OF = new Date('2026-08-29T00:00:00+09:00')
const BASE = {
  annualSalary: 48_000_000,
  nonTaxable: 200_000,
  dependents: 1,
  childCount8to20: 0,
  employerEmploymentRate: DEFAULT_EMPLOYER_EMPLOYMENT_RATE,
  industrialAccidentRate: 0.007,
}

describe('산재 요율 입력 정책', () => {
  it('요율을 넘기지 않으면 임의 기본값 없이 0으로 계산한다', () => {
    const result = calculateSocialInsurance({ monthlyGross: 3_500_000 }, AS_OF)
    expect(result.industrialAccident).toBe(0)
    expect(result.industrialAccidentRate).toBe(0)
  })

  it('명시한 0.7%만 정확히 반영한다', () => {
    const r = calculateSocialInsurance(
      {
        monthlyGross: 3_500_000,
        employerEmploymentRate: DEFAULT_EMPLOYER_EMPLOYMENT_RATE,
        industrialAccidentRate: 0.007,
      },
      AS_OF,
    )
    expect(r.industrialAccident).toBe(Math.floor(3_500_000 * 0.007 / 10) * 10)
    expect(r.totalEmployer).toBe(
      r.employerPension + r.employerHealth + r.employerLongTerm +
      r.employerEmployment + r.industrialAccident,
    )
  })

  it('두 화면이 공유하는 산재요율 입력 정규화가 소수·상한을 처리한다', () => {
    expect(sanitizeIndustrialAccidentRateInput('1.2.3%')).toBe('1.23')
    expect(sanitizeIndustrialAccidentRateInput('99')).toBe('20')
    expect(parseIndustrialAccidentRatePercent('0.7')).toBe(0.7)
    expect(parseIndustrialAccidentRatePercent('')).toBeNull()
  })

  it('산재 요율 0이면 산재보험료가 0이다 (임의 기본값이 끼어들지 않는다)', () => {
    const r = calculateSocialInsurance(
      { monthlyGross: 3_500_000, industrialAccidentRate: 0 }, AS_OF,
    )
    expect(r.industrialAccident).toBe(0)
    expect(r.industrialAccidentRate).toBe(0)
  })

  it('비정상 요율은 0으로 정규화된다', () => {
    for (const v of [NaN, Infinity, -Infinity, -0.5]) {
      const r = calculateSocialInsurance(
        { monthlyGross: 3_500_000, industrialAccidentRate: v }, AS_OF,
      )
      expect(r.industrialAccident).toBe(0)
      expect(Number.isFinite(r.totalEmployer)).toBe(true)
    }
  })

  it('업종 요율이 20배 차이나면 사업주 총부담도 실제로 벌어진다', () => {
    const low = calculateSocialInsurance({ monthlyGross: 3_500_000, industrialAccidentRate: 0.007 }, AS_OF)
    const high = calculateSocialInsurance({ monthlyGross: 3_500_000, industrialAccidentRate: 0.14 }, AS_OF)
    expect(high.totalEmployer - low.totalEmployer).toBeGreaterThan(400_000)
  })
})

describe('근로자 계산은 기존 엔진과 완전히 같다', () => {
  it('실수령액·공제 내역이 calculateSalary()와 일치한다', () => {
    const r = calculateEmployerCost(BASE, AS_OF)
    const expected = calculateSalary(
      { annualSalary: 48_000_000, nonTaxable: 200_000, dependents: 1, childCount8to20: 0 },
      AS_OF,
    )
    expect(r.monthlyNet).toBe(expected.monthlyNet)
    expect(r.annualNet).toBe(expected.annualNet)
    expect(r.monthlyGross).toBe(expected.monthlyGross)
    expect(r.employeeDeduction).toEqual(expected.breakdown)
  })
})

describe('3단 분리 — 근로자 공제와 사업주 부담은 다른 값이다', () => {
  it('② 계약상 급여 = ① 실수령 + 근로자 부담 공제', () => {
    const r = calculateEmployerCost(BASE, AS_OF)
    expect(r.monthlyGross).toBe(r.monthlyNet + r.employeeDeduction.totalDeduction)
  })

  it('③ 총 인건비 = ② 계약상 급여 + 사업주 부담분', () => {
    const r = calculateEmployerCost(BASE, AS_OF)
    expect(r.monthlyTotalCost).toBe(r.monthlyGross + r.employerBurden.total)
    expect(r.annualTotalCost).toBe(r.monthlyTotalCost * 12)
  })

  it('사업주 부담 합계가 항목 합과 일치한다', () => {
    const b = calculateEmployerCost(BASE, AS_OF).employerBurden
    expect(b.total).toBe(
      b.nationalPension + b.healthInsurance + b.longTermCare + b.employment + b.industrialAccident,
    )
  })

  it('⚠️ 사업주 부담은 근로자 4대보험 공제와 금액이 다르다', () => {
    const r = calculateEmployerCost(BASE, AS_OF)
    const employeeInsurance =
      r.employeeDeduction.nationalPension + r.employeeDeduction.healthInsurance +
      r.employeeDeduction.longTermCare + r.employeeDeduction.employment
    // 고용보험 고용안정분과 산재보험이 더 붙으므로 사업주 쪽이 크다
    expect(r.employerBurden.total).toBeGreaterThan(employeeInsurance)
  })

  it('국민연금·건강보험·장기요양은 노사 부담액이 같다 (법정 동일 비율)', () => {
    const r = calculateEmployerCost(BASE, AS_OF)
    expect(r.employerBurden.nationalPension).toBe(r.employeeDeduction.nationalPension)
    expect(r.employerBurden.healthInsurance).toBe(r.employeeDeduction.healthInsurance)
    expect(r.employerBurden.longTermCare).toBe(r.employeeDeduction.longTermCare)
  })

  it('고용보험은 사업주 부담이 더 크다 (고용안정·직업능력개발분 전액 부담)', () => {
    const r = calculateEmployerCost(BASE, AS_OF)
    expect(r.employerBurden.employment).toBeGreaterThan(r.employeeDeduction.employment)
  })
})

describe('비율 지표', () => {
  it('총 인건비 배수 = 연 총 인건비 ÷ 연봉', () => {
    const r = calculateEmployerCost(BASE, AS_OF)
    expect(r.costMultiplier).toBeCloseTo(r.annualTotalCost / 48_000_000, 12)
    expect(r.costMultiplier!).toBeGreaterThan(1)
  })

  it('사업주 추가 부담률 = 연 사업주 부담 ÷ 연봉', () => {
    const r = calculateEmployerCost(BASE, AS_OF)
    expect(r.employerBurdenRate).toBeCloseTo((r.employerBurden.total * 12) / 48_000_000, 12)
  })

  it('총 인건비 대비 실수령 비율은 1보다 작다', () => {
    const r = calculateEmployerCost(BASE, AS_OF)
    expect(r.netToCostRate!).toBeLessThan(1)
    expect(r.netToCostRate!).toBeGreaterThan(0)
  })

  it('연봉 0이면 비율 지표는 null', () => {
    const r = calculateEmployerCost({ ...BASE, annualSalary: 0 }, AS_OF)
    expect(r.costMultiplier).toBeNull()
    expect(r.employerBurdenRate).toBeNull()
  })

  it('산재 요율이 높을수록 총 인건비 배수가 커진다', () => {
    const low = calculateEmployerCost({ ...BASE, industrialAccidentRate: 0.007 }, AS_OF)
    const high = calculateEmployerCost({ ...BASE, industrialAccidentRate: 0.14 }, AS_OF)
    expect(high.costMultiplier!).toBeGreaterThan(low.costMultiplier!)
  })
})

describe('사업장 규모별 고용보험 요율 (정책 상수)', () => {
  it('4단계가 정의되어 있고 오름차순이다', () => {
    expect(EMPLOYER_EMPLOYMENT_RATES).toHaveLength(4)
    for (let i = 1; i < EMPLOYER_EMPLOYMENT_RATES.length; i++) {
      expect(EMPLOYER_EMPLOYMENT_RATES[i].rate).toBeGreaterThan(EMPLOYER_EMPLOYMENT_RATES[i - 1].rate)
    }
  })

  it('표시 문자열이 실제 요율과 일치한다', () => {
    for (const o of EMPLOYER_EMPLOYMENT_RATES) {
      expect(o.rateLabel).toBe(`${(o.rate * 100).toFixed(2)}%`)
    }
  })

  it('기본값은 첫 단계(150인 미만)이다', () => {
    expect(DEFAULT_EMPLOYER_EMPLOYMENT_RATE).toBe(EMPLOYER_EMPLOYMENT_RATES[0].rate)
  })

  it('규모가 커지면 사업주 부담이 늘어난다', () => {
    const rates = EMPLOYER_EMPLOYMENT_RATES.map(
      (o) => calculateEmployerCost({ ...BASE, employerEmploymentRate: o.rate }, AS_OF)
        .employerBurden.employment,
    )
    for (let i = 1; i < rates.length; i++) expect(rates[i]).toBeGreaterThan(rates[i - 1])
  })
})

describe('비정상 입력 방어', () => {
  it.each([
    ['NaN 연봉', { annualSalary: NaN }],
    ['Infinity 연봉', { annualSalary: Infinity }],
    ['음수 연봉', { annualSalary: -1 }],
    ['NaN 비과세', { nonTaxable: NaN }],
    ['음수 부양가족', { dependents: -3 }],
    ['NaN 고용보험 요율', { employerEmploymentRate: NaN }],
    ['NaN 산재 요율', { industrialAccidentRate: NaN }],
  ])('%s → 유한한 결과', (_l, over) => {
    const r = calculateEmployerCost({ ...BASE, ...over }, AS_OF)
    for (const v of [r.monthlyTotalCost, r.annualTotalCost, r.employerBurden.total, r.monthlyNet]) {
      expect(Number.isFinite(v)).toBe(true)
    }
    expect(r.employerBurden.total).toBeGreaterThanOrEqual(0)
  })
})

describe('정책 메타데이터가 낡으면 실패한다', () => {
  it('asOf는 과거, reviewAt은 미래다', () => {
    expect(new Date(EMPLOYER_COST_POLICY_META.asOf).getTime()).toBeLessThanOrEqual(Date.now())
    expect(new Date(EMPLOYER_COST_POLICY_META.reviewAt).getTime()).toBeGreaterThan(Date.now())
  })

  it('근거 조문과 문서 경로가 기록되어 있다', () => {
    expect(EMPLOYER_COST_POLICY_META.basis).toContain('제13조')
    expect(EMPLOYER_COST_POLICY_META.reference).toBe('docs/employer-cost-policy.md')
  })
})
