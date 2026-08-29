// src/lib/policy/annualLeave.ts
// ────────────────────────────────────────────────────────────
// 연차유급휴가 정책 상수 및 메타데이터 (단일 출처)
//
// ⚠️ 이 파일은 "계산에 실제로 쓰이는 법정 정책값"만 담습니다.
//    화면 문구·예시 금액 등 표시 전용 값은 페이지 컴포넌트에 둡니다.
//    조사 근거와 출처는 docs/annual-leave-policy.md 를 참조하세요.
// ────────────────────────────────────────────────────────────

/** 정책 메타데이터: 근거 법령·기준일·재검토 조건 */
export const ANNUAL_LEAVE_POLICY_META = {
  /** 근거 법령 */
  basis: '근로기준법 제60조',
  /** 이 정책값을 확정·검증한 기준일 (YYYY-MM-DD) */
  asOf: '2026-08-29',
  /**
   * 재검토 시점.
   * 근로기준법 일부개정법률(법률 제21784호, 2026.6.9 공포)로 제60조에
   * 시간단위 분할 사용 청구권이 신설되었으며 2027.6.10 시행 예정입니다.
   * 구체적인 "시간단위 및 일수의 범위"는 대통령령에 위임되어 있어
   * 시행령이 제정되면 소수 단위 연차 정책을 다시 확인해야 합니다.
   */
  reviewAt: '2027-06-10',
  /** 재검토를 앞당겨야 하는 조건 */
  reviewTrigger:
    '근로기준법 제60조 시간단위 분할 사용 시행령 제정, 또는 연차 발생·정산 관련 대법원 판례·행정해석 변경 시',
  /** 출처 문서 */
  reference: 'docs/annual-leave-policy.md',
} as const

// ── 근로기준법 제60조 제2항: 1년 미만 / 출근율 80% 미만 ───────
/** 1개월 개근 시 발생하는 유급휴가 일수 */
export const SUB_ONE_YEAR_MONTHLY_DAYS = 1
/** 제60조 제2항으로 발생할 수 있는 최대 일수 (11개월 × 1일) */
export const SUB_ONE_YEAR_MAX_DAYS = 11

// ── 근로기준법 제60조 제1항: 1년간 80% 이상 출근 ─────────────
/** 1년간 80% 이상 출근한 근로자에게 부여되는 기본 연차일수 */
export const ANNUAL_LEAVE_BASE_DAYS = 15
/** 제60조 제1항 적용을 위한 출근율 요건 */
export const ATTENDANCE_RATE_THRESHOLD = 0.8

// ── 근로기준법 제60조 제4항: 가산휴가 ─────────────────────────
/** 가산휴가가 처음 발생하는 계속근로연수 */
export const ADDITIONAL_LEAVE_START_YEARS = 3
/** 가산 주기 (매 2년에 대하여 1일) */
export const ADDITIONAL_LEAVE_INTERVAL_YEARS = 2
/** 가산휴가를 포함한 총 휴가 일수 한도 */
export const ANNUAL_LEAVE_MAX_DAYS = 25
/** 상한(25일)에 도달하는 계속근로연수 — 표시용 안내에 사용 */
export const ANNUAL_LEAVE_CAP_YEARS = 21

// ── 1일 통상임금 환산 ─────────────────────────────────────────
/** 법정 월 소정근로시간 = (주 40시간 + 주휴 8시간) × 4.345주 ≒ 209시간 */
export const MONTHLY_WORK_HOURS = 209
/** 1일 소정근로시간 */
export const DAILY_WORK_HOURS = 8

// ── UI 입력 허용 범위 (계산 정책이 아닌 입력 가드) ─────────────
export const MIN_WORKING_YEARS = 1
export const MAX_WORKING_YEARS = 50
export const MIN_FULL_ATTENDANCE_MONTHS = 0
/** 1년 미만 구간에서 개근할 수 있는 최대 월수 */
export const MAX_FULL_ATTENDANCE_MONTHS = 11

/**
 * 근속 구분.
 * 대법원 2021.10.14. 선고 2021다227100 판결과 이를 반영한 고용노동부
 * 행정해석 변경(2021.12.16)에 따라, 제60조 제1항의 15일은 "1년간의 근로를
 * 마친 다음 날"에 근로관계가 존속해야 발생합니다. 따라서 365일 근무 후
 * 퇴직한 경우와 366일째 근로관계가 유지된 경우를 반드시 구분해야 합니다.
 */
export type AnnualLeaveTenureCategory =
  /** 계속근로기간 1년 미만 (제60조 제2항만 적용) */
  | 'under1'
  /** 365일(1년)을 채우고 그 다음 날 근로관계가 종료된 경우 */
  | 'exact1'
  /** 366일째에도 근로관계가 유지되는 경우 (제60조 제1항·제4항 적용) */
  | 'over1'
