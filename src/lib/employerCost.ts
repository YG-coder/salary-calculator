// src/lib/employerCost.ts
// ────────────────────────────────────────────────────────────
// 기업 총 인건비 계산 (근로자 실수령액과 사업주 총비용의 분리)
//
// ⚠️ 이 모듈은 세금·보험 산식을 담지 않는다. 기존 공통 엔진
//    calculateSalary()(근로자)와 calculateSocialInsurance()(사업주)를 호출해
//    결과를 3단으로 재구성할 뿐이다.
//
// ⚠️ 산재보험료율은 기본값을 두지 않는다. 사업의 종류별로 고용노동부령으로 정하며
//    (보험료징수법 제14조③) 특정 업종이 전체 평균의 20배까지 갈 수 있어(같은 조 ⑤),
//    임의값으로 계산하면 총 인건비가 크게 틀어진다.
//    설계 근거: docs/employer-cost-policy.md
// ────────────────────────────────────────────────────────────

import { calculateSalary, type SalaryBreakdown } from './salary'
import { calculateSocialInsurance } from './calculators'

export interface EmployerCostInput {
  /** 연봉 (원, 세전) */
  annualSalary: number
  /** 월 비과세 금액 (원) */
  nonTaxable?: number
  /** 공제대상가족 수 (본인 포함) */
  dependents?: number
  /** 8~20세 자녀 수 */
  childCount8to20?: number
  /** 사업주 고용보험료율 (실업급여 1/2 + 고용안정·직업능력개발) */
  employerEmploymentRate: number
  /** 산재보험료율 — 필수. 사업장의 실제 요율을 넘겨야 한다. */
  industrialAccidentRate: number
}

/** 사업주 부담 항목 (월 기준) */
export interface EmployerBurden {
  nationalPension: number
  healthInsurance: number
  longTermCare: number
  /** 고용보험 (실업급여 1/2 + 고용안정·직업능력개발사업 전액) */
  employment: number
  /** 산재보험 (사업주 전액) */
  industrialAccident: number
  total: number
}

export interface EmployerCostResult {
  // ── ① 근로자가 받는 돈
  /** 월 실수령액 */
  monthlyNet: number
  /** 연 실수령액 */
  annualNet: number
  /** 근로자 부담 공제 (월) — ⚠️ 사업주 비용이 아니다 */
  employeeDeduction: SalaryBreakdown

  // ── ② 계약상 급여
  /** 월 세전 급여 */
  monthlyGross: number
  /** 연 세전 급여 */
  annualGross: number

  // ── ③ 회사가 쓰는 돈
  /** 사업주 부담분 (월) */
  employerBurden: EmployerBurden
  /** 월 총 인건비 = 월 세전 급여 + 사업주 부담분 */
  monthlyTotalCost: number
  /** 연 총 인건비 */
  annualTotalCost: number

  /** 계약 연봉 대비 총 인건비 배수 (연봉 0이면 null) */
  costMultiplier: number | null
  /** 계약 연봉 대비 사업주 추가 부담률 (연봉 0이면 null) */
  employerBurdenRate: number | null
  /** 총 인건비 대비 근로자 실수령 비율 (총 인건비 0이면 null) */
  netToCostRate: number | null

  /** 실제 적용된 산재보험료율 */
  industrialAccidentRate: number
}

function toSafeNonNegative(value: number, max = Number.MAX_SAFE_INTEGER): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  return Math.min(value, max)
}

export function calculateEmployerCost(
  input: EmployerCostInput,
  asOfDate: Date = new Date(),
): EmployerCostResult {
  const annualSalary = toSafeNonNegative(input.annualSalary)
  const nonTaxable = toSafeNonNegative(input.nonTaxable ?? 0)
  const dependents = Math.max(1, Math.floor(toSafeNonNegative(input.dependents ?? 1)) || 1)
  const childCount8to20 = Math.floor(toSafeNonNegative(input.childCount8to20 ?? 0))
  const employerEmploymentRate = toSafeNonNegative(input.employerEmploymentRate)
  const industrialAccidentRate = toSafeNonNegative(input.industrialAccidentRate)

  // 근로자 측: 기존 공통 엔진 그대로
  const salary = calculateSalary(
    { annualSalary, nonTaxable, dependents, childCount8to20 },
    asOfDate,
  )

  // 사업주 측: 기존 4대보험 엔진에 사업장별 요율을 넘긴다
  const insurance = calculateSocialInsurance(
    {
      monthlyGross: salary.monthlyGross,
      nonTaxable,
      employerEmploymentRate,
      industrialAccidentRate,
    },
    asOfDate,
  )

  const employerBurden: EmployerBurden = {
    nationalPension: insurance.employerPension,
    healthInsurance: insurance.employerHealth,
    longTermCare: insurance.employerLongTerm,
    employment: insurance.employerEmployment,
    industrialAccident: insurance.industrialAccident,
    total: insurance.totalEmployer,
  }

  const monthlyTotalCost = salary.monthlyGross + employerBurden.total
  const annualTotalCost = monthlyTotalCost * 12

  return {
    monthlyNet: salary.monthlyNet,
    annualNet: salary.annualNet,
    employeeDeduction: salary.breakdown,

    monthlyGross: salary.monthlyGross,
    annualGross: salary.monthlyGross * 12,

    employerBurden,
    monthlyTotalCost,
    annualTotalCost,

    costMultiplier: annualSalary > 0 ? annualTotalCost / annualSalary : null,
    employerBurdenRate: annualSalary > 0 ? (employerBurden.total * 12) / annualSalary : null,
    netToCostRate: annualTotalCost > 0 ? salary.annualNet / annualTotalCost : null,

    industrialAccidentRate,
  }
}
