// src/lib/constants.ts
// ────────────────────────────────────────────────────────────
// 2026년 기준 보험료율 및 세율 상수
// 매년 고시되는 요율이 변경되면 이 파일만 수정하세요.
// ────────────────────────────────────────────────────────────

import { SITE } from '@/lib/site'

export { SITE }

export const TAX_YEAR = 2026

// ── 4대보험 근로자 부담 요율 ────────────────────────────────
export const RATES = {
  /**
   * 국민연금 근로자 부담율
   * 2026년 고시: 4.75% (사업주 4.75%, 합계 9.5%)
   */
  nationalPension: 0.0475,

  /**
   * 건강보험 근로자 부담율
   * 2026년 고시: 3.595% (사업주 동일, 합계 7.19%)
   */
  healthInsurance: 0.03595,

  /**
   * 장기요양보험율 (건강보험료 대비)
   * 2026년 고시: 건강보험료의 13.14% (2025년 12.95% → 2026년 13.14%)
   * 실효 보험료 비율: 3.595% × 13.14% ≒ 0.4724%
   * 출처: 보건복지부 2025.11.4 장기요양위원회 의결
   */
  longTermCare: 0.1314,

  /**
   * 고용보험 근로자 부담율
   * 2026년: 0.9% (전년 동일)
   */
  employment: 0.009,

  /** 지방소득세율 (소득세 대비) */
  localTax: 0.1,
} as const

// ── 국민연금 기준소득월액 상·하한 (기간별) ────────────────────
// ⚠️ 조건: 국민연금 기준소득월액 상·하한은 매년 7월 1일 자로 변경 고시됩니다.
// "연도"만으로 값을 고정하면 안 되며, 반드시 적용 시작일(effectiveFrom)을
// 확인해서 계산 시점이 어느 구간에 속하는지 구분해야 합니다.
//
// 2026년은 상반기와 하반기의 기준소득월액 상·하한이 서로 다릅니다:
//   - 2026년 1~6월  : 2025.7.1~2026.6.30 고시값 적용 → 하한 400,000원 / 상한 6,370,000원
//   - 2026년 7~12월 : 2026.7.1~2027.6.30 고시값 적용 → 하한 410,000원 / 상한 6,590,000원
//
// 출처: 보건복지부 국민연금심의위원회(2026.1.9 의결), 국민연금공단
export interface PensionLimitPeriod {
  /** 이 값의 적용이 시작되는 날짜 (YYYY-MM-DD, 해당일 포함) */
  effectiveFrom: string
  /** 기준소득월액 하한 (원) */
  min: number
  /** 기준소득월액 상한 (원) */
  max: number
  /** 참고용 적용 기간 라벨 */
  label: string
}

/**
 * 국민연금 기준소득월액 상·하한 변경 이력 (적용 시작일 오름차순)
 * 새 고시값이 나오면 배열 끝에 새 구간을 추가하세요. 기존 값은 지우지 마세요
 * (과거 시점 계산 재현 및 상/하반기 비교 안내에 필요합니다).
 */
export const PENSION_LIMIT_PERIODS: readonly PensionLimitPeriod[] = [
  { effectiveFrom: '2025-07-01', min: 400_000, max: 6_370_000, label: '2025.7.1~2026.6.30' },
  { effectiveFrom: '2026-07-01', min: 410_000, max: 6_590_000, label: '2026.7.1~2027.6.30' },
] as const

/**
 * 특정 시점(date)에 적용되는 국민연금 기준소득월액 상·하한을 반환합니다.
 * date를 생략하면 함수 호출 시점(new Date())을 기준으로 판단합니다.
 *
 * ⚠️ 계산 로직에서는 반드시 이 함수를 사용하세요. "2026년이니까 X원" 처럼
 * 연도만으로 판단하면 2026년 1~6월 계산에 7월 이후 값이 잘못 적용됩니다.
 */
export function getPensionLimits(date: Date = new Date()): { min: number; max: number; label: string } {
  let matched: PensionLimitPeriod = PENSION_LIMIT_PERIODS[0]
  for (const period of PENSION_LIMIT_PERIODS) {
    if (date >= new Date(`${period.effectiveFrom}T00:00:00+09:00`)) {
      matched = period
    }
  }
  return { min: matched.min, max: matched.max, label: matched.label }
}

/**
 * @deprecated 값이 적용 시점에 따라 달라지므로 실수령액 계산 로직에서는 이 상수 대신
 * getPensionLimits(date)를 사용하세요. 이 상수는 모듈 로드 시점(빌드/서버 기동 시각)
 * 기준 값으로 고정되므로, 안내 문구 등 "현재 시점 참고용" 정적 표시에만 사용합니다.
 */
export const PENSION_LIMITS = getPensionLimits()

// ── 소득세 누진세율 구간 [과세표준 상한, 세율, 누진공제액] ─────
// ℹ️ 참고: 매월 원천징수 소득세 계산(src/lib/incomeTax.ts)은 이 브라켓을 직접
// 적용하지 않고, 국세청 근로소득 간이세액표 조견표(src/lib/data/simplifiedTaxTable2026.ts)를
// 조회합니다. 이 상수는 콘텐츠 페이지의 세율 안내 표시용 및 종합소득세 설명용으로 유지합니다.
export const INCOME_TAX_BRACKETS: readonly [number, number, number][] = [
  [14_000_000, 0.06, 0],
  [50_000_000, 0.15, 1_260_000],
  [88_000_000, 0.24, 5_760_000],
  [150_000_000, 0.35, 15_440_000],
  [300_000_000, 0.38, 19_940_000],
  [500_000_000, 0.4, 25_940_000],
  [1_000_000_000, 0.42, 35_940_000],
  [Infinity, 0.45, 65_940_000],
] as const

// ── 근로소득공제 구간 (소득세법 제47조) ──────────────────────────
// 🐛 심각한 버그 발견 및 수정 (이번 간이세액표 구현 작업 중 발견):
//   이전 WAGE_DEDUCTION_BRACKETS는 INCOME_TAX_BRACKETS와 같은 "amount×rate - 누진공제액"
//   방식(세율이 커질수록 커지는 소득세 누진공제 방식)을 그대로 재사용했습니다. 그러나
//   근로소득공제는 반대로 소득이 커질수록 공제율이 "낮아지는"(70%→40%→15%→5%) 구조라
//   같은 계산식을 쓰면 부호가 반대로 적용되어, 총급여 1,500만원~1억원 구간에서
//   근로소득공제액이 실제보다 최대 수백만원~1천만원 이상 적게 계산되는 오류가 있었습니다
//   (예: 총급여 4,000만원 → 정상 8,850,000원인데 구버전은 1,500,000원으로 계산됨).
//   또한 상한 상수도 실제 법정 상한(2,000만원, 소득세법 제47조제1항 단서)이 아닌
//   1,400만원으로 잘못 설정되어 있었습니다. 아래 값은 소득세법 제47조 및 시행령
//   별표에 따라 재검증한 정상값입니다.
//
// 산식: base + (총급여액 - threshold) × rate, upTo 구간까지 순서대로 적용
// 마지막 구간(4,500만원 초과)의 5% 요율은 상한(2,000만원)에 도달할 때까지 계속 적용됩니다.
// ℹ️ 참고: 실제 월 원천징수 계산은 이 공식을 직접 쓰지 않고 간이세액표 조견표를
// 조회합니다(위 INCOME_TAX_BRACKETS 참고). 이 상수는 콘텐츠 페이지 안내용으로 유지합니다.
export const WAGE_DEDUCTION_STEPS: readonly {
  upTo: number
  threshold: number
  base: number
  rate: number
}[] = [
  { upTo: 5_000_000, threshold: 0, base: 0, rate: 0.7 },
  { upTo: 15_000_000, threshold: 5_000_000, base: 3_500_000, rate: 0.4 },
  { upTo: 45_000_000, threshold: 15_000_000, base: 7_500_000, rate: 0.15 },
  { upTo: Infinity, threshold: 45_000_000, base: 12_000_000, rate: 0.05 },
] as const

/** 근로소득공제 법정 최대 한도 (소득세법 제47조제1항 단서: 2천만원) */
export const WAGE_DEDUCTION_CAP = 20_000_000

// ── 근로소득세액공제 ─────────────────────────────────────────
/**
 * @deprecated 실제 월 원천징수 계산은 이 공식을 쓰지 않고 간이세액표 조견표를
 * 조회합니다(조견표 값 자체에 근로소득세액공제 구간별 한도가 이미 반영되어 있음,
 * src/lib/data/simplifiedTaxTable2026.ts). 이 상수는 콘텐츠 페이지 안내용으로만 유지합니다.
 * max(74만원 고정)는 총급여 3,300만원 이하에서만 유효하며, 실제로는 소득에 따라
 * 74만/66만/50만/20만원으로 단계적으로 축소됩니다(소득세법 제59조).
 */
export const TAX_CREDIT = {
  threshold: 1_300_000,
  lowerRate: 0.55,
  upperRate: 0.3,
  max: 740_000,
} as const

// ── 기본공제 1인당 금액 ───────────────────────────────────────
export const BASIC_DEDUCTION_PER_PERSON = 1_500_000

// ── 2026년 최저임금 ───────────────────────────────────────────
/** 2026년 시간당 최저임금 (원) */
export const MIN_HOURLY_WAGE_2026 = 10_320

// ── 사이트 정보 ───────────────────────────────────────────────
// 사이트 정보의 원본은 src/lib/site.ts에서 중앙 관리합니다.
export const SITE_URL = SITE.url
export const SITE_NAME = SITE.name
export const OPERATOR_EMAIL = SITE.operatorEmail
export const OPERATOR_NAME = SITE.operatorName