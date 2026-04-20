// src/lib/salary.ts
// ────────────────────────────────────────────────────────────
// 수정 이력:
//   v1.0  최초 구현
//   v1.1  비과세 ÷12 버그 수정 (월 단위 그대로 사용)
//         고용보험(0.9%) 추가
//         constants.ts 분리
//   v1.2  WAGE_DEDUCTION_BRACKETS Infinity 구간 버그 수정
//         calcWageDeduction() 함수 분리로 1억 초과 공제 정상화
// ────────────────────────────────────────────────────────────

import {
  RATES,
  PENSION_LIMITS,
  INCOME_TAX_BRACKETS,
  WAGE_DEDUCTION_BRACKETS,
  WAGE_DEDUCTION_OVER_100M,
  WAGE_DEDUCTION_MAX,
  TAX_CREDIT,
  BASIC_DEDUCTION_PER_PERSON,
} from './constants'

// ── 타입 정의 ────────────────────────────────────────────────

export interface SalaryInput {
  annualSalary: number  // 연봉 (원, 세전)
  nonTaxable:   number  // 월 비과세 금액 (원) — 월 단위 입력
  dependents:   number  // 부양가족 수 (본인 포함, 최소 1)
}

export interface SalaryBreakdown {
  nationalPension: number  // 국민연금 (월)
  healthInsurance: number  // 건강보험 (월)
  longTermCare:    number  // 장기요양보험 (월)
  employment:      number  // 고용보험 (월)
  incomeTax:       number  // 소득세 (월)
  localTax:        number  // 지방소득세 (월)
  totalDeduction:  number  // 총 공제 (월)
}

export interface SalaryResult {
  monthlyGross:    number          // 월 세전
  monthlyNet:      number          // 월 실수령
  annualNet:       number          // 연 실수령
  annualDeduction: number          // 연 총 공제
  breakdown:       SalaryBreakdown // 월 공제 내역
}

// ── 유틸: 10원 단위 절사 ──────────────────────────────────────
function floor10(n: number): number {
  return Math.floor(n / 10) * 10
}

// ── 유틸: 누진공제 방식 브라켓 계산 ────────────────────────────
//  brackets: [상한, 세율, 누진공제액][]
//  마지막 구간에 Infinity 없음 → 범위 초과 시 0 반환 (별도 처리 필요)
function applyBracket(
  amount: number,
  brackets: readonly [number, number, number][],
): number {
  for (const [limit, rate, deduction] of brackets) {
    if (amount <= limit) {
      return Math.max(0, amount * rate - deduction)
    }
  }
  return -1  // 구간 초과 신호
}

// ── 근로소득공제 계산 ─────────────────────────────────────────
// BUG FIX: 연 총급여 1억 초과는 고정 14,750,000원, 법정 한도 14,000,000원 적용
function calcWageDeduction(annualTaxable: number): number {
  const raw = applyBracket(annualTaxable, WAGE_DEDUCTION_BRACKETS)
  // 브라켓 범위 초과(1억 초과)이면 고정값 사용
  const deduction = raw === -1 ? WAGE_DEDUCTION_OVER_100M : raw
  return Math.min(deduction, WAGE_DEDUCTION_MAX)
}

// ── 소득세 계산 (간이세액 근사) ───────────────────────────────
function calcIncomeTax(monthlyTaxable: number, dependents: number): number {
  const annualTaxable = monthlyTaxable * 12

  // 1) 근로소득공제 (버그 수정된 함수 사용)
  const wageDeduction = calcWageDeduction(annualTaxable)

  // 2) 기본공제 (1인 150만원)
  const basicDeduction = BASIC_DEDUCTION_PER_PERSON * Math.max(1, dependents)

  // 3) 과세표준
  const taxBase = Math.max(0, annualTaxable - wageDeduction - basicDeduction)

  // 4) 산출세액 (누진공제 방식, INCOME_TAX_BRACKETS 마지막 구간 = Infinity)
  const grossTax = applyBracket(taxBase, INCOME_TAX_BRACKETS)
  if (grossTax < 0) return 0  // 안전 장치

  // 5) 근로소득세액공제
  let taxCredit: number
  if (grossTax <= TAX_CREDIT.threshold) {
    taxCredit = grossTax * TAX_CREDIT.lowerRate
  } else {
    taxCredit =
      TAX_CREDIT.threshold * TAX_CREDIT.lowerRate +
      (grossTax - TAX_CREDIT.threshold) * TAX_CREDIT.upperRate
  }
  taxCredit = Math.min(taxCredit, TAX_CREDIT.max)

  const annualIncomeTax = Math.max(0, grossTax - taxCredit)
  return floor10(annualIncomeTax / 12)
}

// ── 메인 계산 함수 ────────────────────────────────────────────
export function calculateSalary(input: SalaryInput): SalaryResult {
  const { annualSalary, nonTaxable, dependents } = input

  // 월 세전 급여
  const monthlyGross = Math.floor(annualSalary / 12)

  // 월 과세 급여: nonTaxable 은 이미 월 단위 → 그대로 차감
  const monthlyTaxable = Math.max(0, monthlyGross - nonTaxable)

  // ── 국민연금 ─────────────────────────────────────────────
  const pensionBase = Math.min(
    Math.max(monthlyTaxable, PENSION_LIMITS.min),
    PENSION_LIMITS.max,
  )
  const nationalPension = floor10(pensionBase * RATES.nationalPension)

  // ── 건강보험 ─────────────────────────────────────────────
  const healthInsurance = floor10(monthlyTaxable * RATES.healthInsurance)

  // ── 장기요양 ─────────────────────────────────────────────
  const longTermCare = floor10(healthInsurance * RATES.longTermCare)

  // ── 고용보험 ─────────────────────────────────────────────
  const employment = floor10(monthlyTaxable * RATES.employment)

  // ── 소득세 ───────────────────────────────────────────────
  const incomeTax = calcIncomeTax(monthlyTaxable, Math.max(1, dependents))

  // ── 지방소득세 ────────────────────────────────────────────
  const localTax = floor10(incomeTax * RATES.localTax)

  // ── 합산 ─────────────────────────────────────────────────
  const totalDeduction =
    nationalPension + healthInsurance + longTermCare +
    employment + incomeTax + localTax

  return {
    monthlyGross,
    monthlyNet:      monthlyGross - totalDeduction,
    annualNet:       (monthlyGross - totalDeduction) * 12,
    annualDeduction: totalDeduction * 12,
    breakdown: {
      nationalPension,
      healthInsurance,
      longTermCare,
      employment,
      incomeTax,
      localTax,
      totalDeduction,
    },
  }
}

// ── 포맷 유틸 ─────────────────────────────────────────────────

export function formatKRW(value: number): string {
  return value.toLocaleString('ko-KR') + '원'
}

export function formatKRWShort(value: number): string {
  if (value >= 100_000_000) {
    return `${(value / 100_000_000).toFixed(1)}억원`
  }
  if (value >= 10_000) {
    return `${Math.floor(value / 10_000).toLocaleString('ko-KR')}만원`
  }
  return formatKRW(value)
}
