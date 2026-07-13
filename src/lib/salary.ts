// src/lib/salary.ts
// ────────────────────────────────────────────────────────────
// 수정 이력:
//   v1.0  최초 구현
//   v1.1  비과세 ÷12 버그 수정 (월 단위 그대로 사용)
//         고용보험(0.9%) 추가
//         constants.ts 분리
//   v1.2  WAGE_DEDUCTION_BRACKETS Infinity 구간 버그 수정
//         calcWageDeduction() 함수 분리로 1억 초과 공제 정상화
//   v1.3  국민연금 상·하한 2026 상/하반기 분기 (getPensionLimits)
//         소득세 계산을 종합소득세 월할 근사 → 실제 근로소득 간이세액표
//         (소득세법 시행령 별표2) 산식으로 교체 (src/lib/incomeTax.ts)
// ────────────────────────────────────────────────────────────

import { RATES, getPensionLimits } from './constants'
import { calcSimplifiedWithholdingTax } from './incomeTax'

// ── 타입 정의 ────────────────────────────────────────────────

export interface SalaryInput {
  annualSalary: number  // 연봉 (원, 세전)
  nonTaxable:   number  // 월 비과세 금액 (원) — 월 단위 입력
  dependents:   number  // 부양가족 수 (본인 포함, 최소 1)
  /**
   * 공제대상가족 중 8세 이상 20세 이하 자녀 수 (선택, 기본값 0)
   * ⚠️ 조건: 현재 UI(CalculatorForm)는 이 값을 입력받지 않으므로 0으로 가정합니다.
   * 실제로 해당 자녀가 있는 경우 원천징수 세액은 이 계산값보다 낮을 수 있습니다.
   * (근거: 소득세법 시행령 별표2 제3호 — 자녀 1명당 월 세액에서 정액 차감)
   */
  childCount8to20?: number
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

// ── 메인 계산 함수 ────────────────────────────────────────────
// asOfDate: 계산 기준 시점 (기본값: 호출 시점의 현재 날짜)
// ⚠️ 조건: 국민연금 기준소득월액 상·하한은 매년 7월 1일 자로 변경되므로, 이 값에
// 따라 2026년 1~6월과 7월 이후에 서로 다른 상·하한이 적용됩니다.
// (getPensionLimits() 참고 — src/lib/constants.ts)
// ⚠️ 조건: 소득세 자녀세액공제 금액도 2026.3.1 시행일을 기준으로 신/구가 나뉘므로
// asOfDate를 calcSimplifiedWithholdingTax()에도 그대로 전달합니다.
export function calculateSalary(input: SalaryInput, asOfDate: Date = new Date()): SalaryResult {
  const { annualSalary, nonTaxable, dependents, childCount8to20 = 0 } = input

  // 월 세전 급여
  const monthlyGross = Math.floor(annualSalary / 12)

  // 월 과세 급여: nonTaxable 은 이미 월 단위 → 그대로 차감
  const monthlyTaxable = Math.max(0, monthlyGross - nonTaxable)

  // ── 국민연금 ─────────────────────────────────────────────
  // 상·하한은 계산 기준 시점(asOfDate)에 맞는 구간 값을 조회해서 사용합니다.
  const pensionLimits = getPensionLimits(asOfDate)
  const pensionBase = Math.min(
    Math.max(monthlyTaxable, pensionLimits.min),
    pensionLimits.max,
  )
  const nationalPension = floor10(pensionBase * RATES.nationalPension)

  // ── 건강보험 ─────────────────────────────────────────────
  const healthInsurance = floor10(monthlyTaxable * RATES.healthInsurance)

  // ── 장기요양 ─────────────────────────────────────────────
  const longTermCare = floor10(healthInsurance * RATES.longTermCare)

  // ── 고용보험 ─────────────────────────────────────────────
  const employment = floor10(monthlyTaxable * RATES.employment)

  // ── 소득세 (근로소득 간이세액표 기준, src/lib/incomeTax.ts) ───
  // asOfDate를 그대로 전달해 자녀세액공제 신/구 금액을 2026.3.1 기준으로 분기합니다.
  const incomeTax = calcSimplifiedWithholdingTax(
    {
      monthlyTaxable,
      dependents: Math.max(1, dependents),
      childCount8to20,
    },
    asOfDate,
  )

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
