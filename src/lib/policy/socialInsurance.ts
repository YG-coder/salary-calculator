// src/lib/policy/socialInsurance.ts
// ────────────────────────────────────────────────────────────
// 사업주 부담 4대보험 정책 상수 (단일 출처)
//
// 근거와 조사 과정은 docs/employer-cost-policy.md 를 참조하세요.
// ────────────────────────────────────────────────────────────

export const EMPLOYER_COST_POLICY_META = {
  basis:
    '국민연금법 제88조③ · 국민건강보험법 제76조① · ' +
    '고용보험 및 산업재해보상보험의 보험료징수 등에 관한 법률 제13조·제14조',
  asOf: '2026-08-29',
  /** 고용보험료율은 대통령령으로 매년 바뀔 수 있다 (보험료징수법 제14조①) */
  reviewAt: '2027-01-01',
  reviewTrigger: '고용보험료율 대통령령 개정 또는 산재보험료율 고용노동부령 고시 변경 시',
  reference: 'docs/employer-cost-policy.md',
} as const

/**
 * 사업장 규모별 사업주 고용보험료율.
 *
 * 보험료징수법 제13조 제4항에 따라 사업주 고용보험료는
 *   ① 고용안정·직업능력개발사업 보험료율 (사업주 전액)
 *   ② 실업급여 보험료율의 1/2 (0.9%)
 * 를 합한 값이다. ①이 사업장 규모에 따라 달라져 아래 4단계가 생긴다.
 *
 * ⚠️ 이 값은 4대보험 계산기와 기업 총 인건비 계산기가 함께 쓴다.
 *    페이지 컴포넌트에 두면 화면마다 값이 갈라지므로 여기서만 정의한다.
 */
export interface EmployerEmploymentRateOption {
  /** 사업주 고용보험료율 (실업급여 1/2 + 고용안정·직업능력개발) */
  rate: number
  /** 사업장 규모 라벨 */
  label: string
  /** 화면 표시용 요율 문자열 */
  rateLabel: string
}

export const EMPLOYER_EMPLOYMENT_RATES: readonly EmployerEmploymentRateOption[] = [
  { rate: 0.0115, label: '150인 미만', rateLabel: '1.15%' },
  { rate: 0.0135, label: '150인 이상 우선지원대상', rateLabel: '1.35%' },
  { rate: 0.0155, label: '150~999인', rateLabel: '1.55%' },
  { rate: 0.0175, label: '1,000인 이상·국가/지자체', rateLabel: '1.75%' },
] as const

/** 기본값 — 가장 흔한 사업장 규모 */
export const DEFAULT_EMPLOYER_EMPLOYMENT_RATE = EMPLOYER_EMPLOYMENT_RATES[0].rate

/** 산재보험료율 입력 허용 범위 (%) — 법정 상한이 아니라 입력 실수 방지 가드 */
export const MIN_INDUSTRIAL_ACCIDENT_RATE_PERCENT = 0
export const MAX_INDUSTRIAL_ACCIDENT_RATE_PERCENT = 20

/** 산재보험료율 입력 문자열을 소수 한 개와 허용 상한 범위로 정규화합니다. */
export function sanitizeIndustrialAccidentRateInput(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, '')
  const dot = cleaned.indexOf('.')
  const normalized =
    dot === -1 ? cleaned : `${cleaned.slice(0, dot)}.${cleaned.slice(dot + 1).replace(/\./g, '')}`
  const rate = Number(normalized)
  if (Number.isFinite(rate) && rate > MAX_INDUSTRIAL_ACCIDENT_RATE_PERCENT) {
    return String(MAX_INDUSTRIAL_ACCIDENT_RATE_PERCENT)
  }
  return normalized
}

/** 사용자 입력 산재보험료율(%)을 검증합니다. 빈 문자열·비정상 값은 null입니다. */
export function parseIndustrialAccidentRatePercent(value: string): number | null {
  if (value.trim() === '') return null
  const rate = Number(sanitizeIndustrialAccidentRateInput(value))
  if (!Number.isFinite(rate) || rate < MIN_INDUSTRIAL_ACCIDENT_RATE_PERCENT) return null
  return rate
}
