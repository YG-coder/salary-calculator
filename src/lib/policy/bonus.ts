// src/lib/policy/bonus.ts
// ────────────────────────────────────────────────────────────
// 상여금 원천징수 정책 상수 및 메타데이터 (단일 출처)
//
// 근거와 조사 과정은 docs/bonus-tax-policy.md 를 참조하세요.
// ⚠️ 계산에 실제로 쓰이는 법정 값만 둡니다. 화면 문구는 페이지에 둡니다.
// ────────────────────────────────────────────────────────────

export const BONUS_POLICY_META = {
  /** 근거 법령 */
  basis: '소득세법 제136조 · 소득세법 시행령 제195조',
  /** 이 정책값을 확정·검증한 기준일 */
  asOf: '2026-08-29',
  /**
   * 재검토 시점.
   * 근로소득 간이세액표는 소득세법 시행령 별표2로 매년 개정될 수 있고,
   * 자녀세액공제 금액도 2026.3.1을 기준으로 신/구가 나뉜다.
   */
  reviewAt: '2027-01-01',
  reviewTrigger: '근로소득 간이세액표(소득세법 시행령 별표2) 개정 또는 제136조 개정 시',
  reference: 'docs/bonus-tax-policy.md',
} as const

/**
 * 지급대상기간 월수 상한.
 * 소득세법 제136조 제1항 제3호: "지급대상기간이 1년을 초과하는 경우에는 1년으로 보고"
 */
export const MAX_BONUS_PERIOD_MONTHS = 12

/**
 * 지급대상기간 월수 하한.
 * 같은 호: "1개월 미만의 끝수가 있는 경우에는 1개월로 본다"
 */
export const MIN_BONUS_PERIOD_MONTHS = 1

/**
 * 상여 지급 방식 구분.
 *
 * ⚠️ 시행령 제195조 제1항 제1호: "지급대상기간의 마지막 달이 아닌 달에 지급되는
 *    상여등은 지급대상기간이 없는 상여등으로 본다."
 *    따라서 "지급대상기간이 정해져 있다"와 "withPeriod"는 같은 뜻이 아니다.
 *    지급대상기간의 마지막 달에 지급될 때만 withPeriod다.
 */
export type BonusPeriodType =
  /** 지급대상기간이 있고, 그 마지막 달에 지급되는 상여 (제136조①1) */
  | 'withPeriod'
  /** 지급대상기간이 없는 상여, 또는 마지막 달이 아닌 달에 지급되는 상여 (제136조①2) */
  | 'withoutPeriod'

/** UI 입력 허용 범위 (계산 정책이 아닌 입력 가드) */
export const MAX_BONUS_AMOUNT = 10_000_000_000
export const MAX_MONTHLY_PAY = 1_000_000_000
export const MAX_PREPAID_TAX = 10_000_000_000
export const MIN_MONTH = 1
export const MAX_MONTH = 12
