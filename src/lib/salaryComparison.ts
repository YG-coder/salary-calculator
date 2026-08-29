// src/lib/salaryComparison.ts
// ────────────────────────────────────────────────────────────
// 연봉 A / B 비교 계산.
//
// ⚠️ 이 모듈은 세금·4대보험 계산식을 **전혀 담지 않습니다.**
//    공통 급여 엔진 calculateSalary()(src/lib/salary.ts)를 두 번 호출해
//    그 결과의 차분만 만드는 얇은 계층입니다. 요율·상한·간이세액표가
//    바뀌어도 이 파일은 손댈 필요가 없어야 합니다.
// ────────────────────────────────────────────────────────────

import {
  calculateSalary,
  type SalaryInput,
  type SalaryResult,
  type SalaryBreakdown,
} from './salary'

/** A·B가 공유하는 조건 (연봉만 따로 받는다) */
export interface SalaryComparisonInput {
  annualSalaryA: number
  annualSalaryB: number
  /** 월 비과세 금액 (원) — A·B 공통 */
  nonTaxable: number
  /** 공제대상가족 수 (본인 포함) — A·B 공통 */
  dependents: number
  /** 8~20세 자녀 수 — A·B 공통 */
  childCount8to20?: number
}

/** 공제 항목별 차이 (B - A) */
export interface DeductionDelta {
  key: keyof SalaryBreakdown
  label: string
  /** A의 월 공제액 */
  a: number
  /** B의 월 공제액 */
  b: number
  /** 월 차액 (B - A) */
  monthlyDiff: number
  /** 연 차액 (B - A) */
  annualDiff: number
}

export interface SalaryComparisonResult {
  a: SalaryResult
  b: SalaryResult

  /** 세전 연봉 차이 (B - A) */
  annualGrossDiff: number
  /** 월 실수령 차이 (B - A) */
  monthlyNetDiff: number
  /** 연 실수령 차이 (B - A) */
  annualNetDiff: number
  /** 연 총 공제 차이 (B - A) */
  annualDeductionDiff: number

  /** 공제 항목별 차이 (표시 순서 고정) */
  deductionDeltas: DeductionDelta[]

  /**
   * 한계 실수령률 = 늘어난 연봉 중 실제로 손에 남는 비율.
   *   (연 실수령 차이) / (세전 연봉 차이)
   * 세전 연봉이 같으면(차이 0) 정의되지 않으므로 null.
   */
  marginalNetRate: number | null
  /**
   * 한계 공제율 = 1 - 한계 실수령률. 늘어난 연봉 중 공제로 빠지는 비율.
   * 세전 연봉 차이가 0이면 null.
   */
  marginalDeductionRate: number | null

  /** A의 평균 실수령률 (연 실수령 / 세전 연봉). 연봉 0이면 null */
  averageNetRateA: number | null
  /** B의 평균 실수령률. 연봉 0이면 null */
  averageNetRateB: number | null

  /**
   * ⚠️ 실수령률이 단조 감소하지 않는 구간에 걸쳐 있는지.
   *
   * 국민연금은 기준소득월액 상한이 있어 상한을 넘으면 보험료가 더 늘지 않습니다.
   * 그래서 연봉이 오르는데도 한계 실수령률이 **올라가는** 구간이 생깁니다
   * ("연봉이 오르면 실수령률은 항상 떨어진다"는 통념과 어긋나는 지점).
   * 두 조건 중 한쪽만 상한에 걸린 경우 이 플래그가 켜집니다.
   */
  crossesPensionCap: boolean
  /** 두 조건 중 한쪽만 간이세액표 상한(고소득 전용 산식)을 넘은 경우 */
  crossesHighIncomeTaxFormula: boolean
}

/** 공제 항목 표시 순서와 라벨 (단일 출처) */
export const DEDUCTION_ITEMS: { key: keyof SalaryBreakdown; label: string }[] = [
  { key: 'nationalPension', label: '국민연금' },
  { key: 'healthInsurance', label: '건강보험' },
  { key: 'longTermCare', label: '장기요양보험' },
  { key: 'employment', label: '고용보험' },
  { key: 'incomeTax', label: '소득세' },
  { key: 'localTax', label: '지방소득세' },
]

/** 유한한 0 이상 값으로 정규화. 프로젝트의 다른 계산 함수와 동일한 방침. */
function toSafeNonNegative(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  return Math.min(value, Number.MAX_SAFE_INTEGER)
}

function toCommonInput(annualSalary: number, input: SalaryComparisonInput): SalaryInput {
  return {
    annualSalary,
    nonTaxable: toSafeNonNegative(input.nonTaxable),
    dependents: Math.max(1, Math.floor(toSafeNonNegative(input.dependents)) || 1),
    childCount8to20: Math.floor(toSafeNonNegative(input.childCount8to20 ?? 0)),
  }
}

export function compareSalaries(
  input: SalaryComparisonInput,
  asOfDate: Date = new Date(),
): SalaryComparisonResult {
  const salaryA = toSafeNonNegative(input.annualSalaryA)
  const salaryB = toSafeNonNegative(input.annualSalaryB)

  // 공통 엔진을 그대로 호출한다. 동일 입력이면 기존 연봉 계산기와 결과가 같아야 한다.
  const a = calculateSalary(toCommonInput(salaryA, input), asOfDate)
  const b = calculateSalary(toCommonInput(salaryB, input), asOfDate)

  const annualGrossDiff = salaryB - salaryA
  const monthlyNetDiff = b.monthlyNet - a.monthlyNet
  const annualNetDiff = b.annualNet - a.annualNet

  const deductionDeltas: DeductionDelta[] = DEDUCTION_ITEMS.map(({ key, label }) => {
    const av = a.breakdown[key]
    const bv = b.breakdown[key]
    const monthlyDiff = bv - av
    return { key, label, a: av, b: bv, monthlyDiff, annualDiff: monthlyDiff * 12 }
  })

  // 세전 연봉이 같으면 한계율은 정의되지 않는다 (0으로 나누기 방지).
  const hasGrossDiff = annualGrossDiff !== 0
  const marginalNetRate = hasGrossDiff ? annualNetDiff / annualGrossDiff : null

  return {
    a,
    b,
    annualGrossDiff,
    monthlyNetDiff,
    annualNetDiff,
    annualDeductionDiff: b.annualDeduction - a.annualDeduction,
    deductionDeltas,
    marginalNetRate,
    marginalDeductionRate: marginalNetRate === null ? null : 1 - marginalNetRate,
    averageNetRateA: salaryA > 0 ? a.annualNet / salaryA : null,
    averageNetRateB: salaryB > 0 ? b.annualNet / salaryB : null,
    crossesPensionCap: a.flags.pensionCapped !== b.flags.pensionCapped,
    crossesHighIncomeTaxFormula:
      a.flags.usedHighIncomeTaxFormula !== b.flags.usedHighIncomeTaxFormula,
  }
}

/** 비율을 소수 첫째 자리 퍼센트 문자열로. null이면 '—' */
export function formatRate(rate: number | null): string {
  if (rate === null || !Number.isFinite(rate)) return '—'
  return `${(rate * 100).toFixed(1)}%`
}

/** 차액에 부호를 붙여 표기. 0은 부호 없이 */
export function formatSignedKRW(value: number): string {
  if (value === 0) return '0원'
  const sign = value > 0 ? '+' : '−'
  return `${sign}${Math.abs(value).toLocaleString('ko-KR')}원`
}
