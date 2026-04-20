// src/lib/constants.ts
// ────────────────────────────────────────────────────────────
// 2026년 기준 보험료율 및 세율 상수
// 매년 고시되는 요율이 변경되면 이 파일만 수정하세요.
// ────────────────────────────────────────────────────────────

export const TAX_YEAR = 2026

// ── 4대보험 근로자 부담 요율 ────────────────────────────────
export const RATES = {
  /** 국민연금 근로자 부담율 */
  nationalPension: 0.045,
  /** 건강보험 근로자 부담율 */
  healthInsurance: 0.03545,
  /** 장기요양보험율 (건강보험료 대비) */
  longTermCare: 0.1281,
  /** 고용보험 근로자 부담율 */
  employment: 0.009,
  /** 지방소득세율 (소득세 대비) */
  localTax: 0.10,
} as const

// ── 국민연금 기준소득월액 상·하한 ────────────────────────────
export const PENSION_LIMITS = {
  /** 기준소득월액 하한 (원) */
  min: 390_000,
  /** 기준소득월액 상한 (원) */
  max: 6_170_000,
} as const

// ── 소득세 누진세율 구간 [과세표준 상한, 세율, 누진공제액] ─────
export const INCOME_TAX_BRACKETS: readonly [number, number, number][] = [
  [14_000_000,    0.06,          0],
  [50_000_000,    0.15,  1_260_000],
  [88_000_000,    0.24,  5_760_000],
  [150_000_000,   0.35, 15_440_000],
  [300_000_000,   0.38, 19_940_000],
  [500_000_000,   0.40, 25_940_000],
  [1_000_000_000, 0.42, 35_940_000],
  [Infinity,      0.45, 65_940_000],
] as const

// ── 근로소득공제 구간 [총급여 상한, 공제율, 누진공제액] ──────────
// BUG FIX: 마지막 구간을 "고정 공제액 반환" 방식으로 처리
// 이전 코드: [Infinity, 0.00, 14_000_000] → amount*0 - 14_000_000 → Math.max(0,…) = 0 (버그!)
// 수정: salary.ts의 calcWageDeduction() 함수에서 직접 처리
export const WAGE_DEDUCTION_BRACKETS: readonly [number, number, number][] = [
  [5_000_000,   0.70,          0],
  [15_000_000,  0.40,  1_500_000],
  [45_000_000,  0.15,  4_500_000],
  [100_000_000, 0.05,  9_000_000],
  // 1억 초과: 고정 14,750,000원 (별도 상한 적용)
] as const

/** 연 총급여 1억 초과 시 근로소득공제 고정액 */
export const WAGE_DEDUCTION_OVER_100M = 14_750_000

/** 근로소득공제 법정 최대 한도 */
export const WAGE_DEDUCTION_MAX = 14_000_000

// ── 근로소득세액공제 ─────────────────────────────────────────
export const TAX_CREDIT = {
  threshold: 1_300_000,
  lowerRate: 0.55,
  upperRate: 0.30,
  max:       740_000,
} as const

// ── 기본공제 1인당 금액 ───────────────────────────────────────
export const BASIC_DEDUCTION_PER_PERSON = 1_500_000

// ── 사이트 정보 ───────────────────────────────────────────────
export const SITE_URL      = 'https://연봉계산기.kr'
export const SITE_NAME     = '연봉계산기.kr'
export const OPERATOR_EMAIL = 'help@연봉계산기.kr'
export const OPERATOR_NAME  = 'Incomelab'
