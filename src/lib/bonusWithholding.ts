// src/lib/bonusWithholding.ts
// ────────────────────────────────────────────────────────────
// 상여금 원천징수 세액 계산 (소득세법 제136조, 시행령 제195조)
//
// ⚠️ 이 모듈은 간이세액표를 직접 구현하지 않는다. 기존 공통 엔진
//    calcSimplifiedWithholdingTax()(src/lib/incomeTax.ts)를 호출한다.
//    세율·조견표가 바뀌어도 이 파일은 손댈 필요가 없어야 한다.
//
// ⚠️ 4대보험은 계산하지 않는다. 상여금을 받아도 그달 국민연금·건강보험·
//    장기요양 공제액은 늘지 않는다(docs/bonus-tax-policy.md P5). 고용보험만
//    지급 보수에 비례하므로 별도로 제공한다.
// ────────────────────────────────────────────────────────────

import { calcSimplifiedWithholdingTax } from './incomeTax'
import { RATES } from './constants'
import {
  MAX_BONUS_PERIOD_MONTHS,
  MIN_BONUS_PERIOD_MONTHS,
  MAX_BONUS_AMOUNT,
  MAX_MONTHLY_PAY,
  MAX_PREPAID_TAX,
  type BonusPeriodType,
} from './policy/bonus'

export interface BonusWithholdingInput {
  /** 상여금액 (원) */
  bonusAmount: number
  /** 지급 방식 */
  periodType: BonusPeriodType
  /**
   * 지급대상기간 월수 (periodType === 'withPeriod'일 때 사용).
   * 1개월 미만 끝수는 1개월로, 12개월 초과는 12개월로 보정한다 (제136조①3).
   */
  periodMonths?: number
  /** 상여 지급월 (1~12, periodType === 'withoutPeriod'일 때 사용) */
  paymentMonth?: number
  /**
   * 그 과세기간에 직전 상여를 받은 월 (1~12). 없으면 undefined.
   * 있으면 "직전 상여 지급월의 다음 달 ~ 이번 지급월"이 지급대상기간이 된다 (제136조①2 후단).
   */
  previousBonusMonth?: number
  /** 지급대상기간의 상여 외 월평균 급여액 (과세분, 원) */
  monthlyPay: number
  /** 공제대상가족 수 (본인 포함) */
  dependents: number
  /** 8~20세 자녀 수 */
  childCount8to20?: number
  /**
   * 해당 지급대상기간에 이미 원천징수한 세액 (원).
   * 지정하지 않으면 월평균 급여 기준 간이세액표 × 월수로 추정한다.
   * ⚠️ 추정치는 매월 급여가 일정했다고 가정한 값이다.
   */
  prepaidTax?: number
}

export interface BonusWithholdingResult {
  /** 실제 적용된 지급대상기간 월수 */
  periodMonths: number
  /** 지급대상기간 산정 근거 (화면 안내용) */
  periodBasis: string
  /** 월환산액 = 상여금÷월수 + 상여 외 월평균 급여 */
  monthlyConverted: number
  /** 간이세액표(월환산액) 조회 결과 (월 세액) */
  monthlyTaxOnConverted: number
  /** 월 세액 × 월수 */
  grossTaxForPeriod: number
  /** 차감한 기납부세액 */
  prepaidTax: number
  /** 기납부세액이 추정치인지 (사용자 입력이면 false) */
  prepaidTaxEstimated: boolean
  /** 상여금 원천징수 소득세 (음수는 0으로) */
  incomeTax: number
  /** 지방소득세 (소득세의 10%, 10원 절사) */
  localTax: number
  /** 고용보험료 (상여금 × 근로자 요율) */
  employmentInsurance: number
  /** 총 공제액 */
  totalDeduction: number
  /** 실수령 상여금 */
  netBonus: number
  /** 공제액이 상여금을 초과해 상여금 외 급여 등에서 추가로 납부해야 할 수 있는 금액 */
  additionalAmountDue: number
  /** 상여금 대비 실효 공제율 (상여금 0이면 null) */
  effectiveDeductionRate: number | null
}

function floor10(n: number): number {
  return Math.floor(n / 10) * 10
}

/** 유한한 0 이상 값으로 정규화. 프로젝트의 다른 계산 함수와 동일한 방침. */
function toSafeNonNegative(value: number, max = Number.MAX_SAFE_INTEGER): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  return Math.min(value, max)
}

/** 월 번호를 1~12 정수로 정규화. 범위 밖이면 null. */
function toMonth(value: number | undefined): number | null {
  if (value === undefined || !Number.isFinite(value)) return null
  const m = Math.floor(value)
  return m >= 1 && m <= 12 ? m : null
}

/**
 * 지급대상기간 월수를 법정 범위로 보정한다.
 * 소득세법 제136조 제1항 제3호: 1년 초과는 1년, 1개월 미만 끝수는 1개월.
 */
export function normalizeBonusPeriodMonths(months: number): number {
  if (!Number.isFinite(months) || months <= 0) return MIN_BONUS_PERIOD_MONTHS
  // 끝수는 올림이 아니라 "1개월로 본다" — 0 초과 1 미만은 1개월.
  const ceiled = Math.ceil(months)
  return Math.min(Math.max(ceiled, MIN_BONUS_PERIOD_MONTHS), MAX_BONUS_PERIOD_MONTHS)
}

/**
 * 지급대상기간이 없는 상여의 지급대상기간을 산정한다 (소득세법 제136조 제1항 제2호).
 *
 * - 그 해 첫 상여: 1월 1일 ~ 지급월 → 지급월 수
 * - 두 번째 이후: 직전 상여 지급월의 다음 달 ~ 이번 지급월
 */
export function resolveImplicitPeriod(
  paymentMonth: number | undefined,
  previousBonusMonth: number | undefined,
): { months: number; basis: string } {
  const pay = toMonth(paymentMonth)
  if (pay === null) {
    return { months: MIN_BONUS_PERIOD_MONTHS, basis: '지급월이 입력되지 않아 1개월로 계산' }
  }
  const prev = toMonth(previousBonusMonth)
  if (prev === null || prev >= pay) {
    return { months: pay, basis: `1월부터 ${pay}월까지 ${pay}개월 (그 해 첫 상여)` }
  }
  const months = pay - prev
  return {
    months,
    basis: `직전 상여(${prev}월) 다음 달부터 ${pay}월까지 ${months}개월`,
  }
}

export function calculateBonusWithholding(
  input: BonusWithholdingInput,
  asOfDate: Date = new Date(),
): BonusWithholdingResult {
  const bonusAmount = toSafeNonNegative(input.bonusAmount, MAX_BONUS_AMOUNT)
  const monthlyPay = toSafeNonNegative(input.monthlyPay, MAX_MONTHLY_PAY)
  const dependents = Math.max(1, Math.floor(toSafeNonNegative(input.dependents)) || 1)
  const childCount8to20 = Math.floor(toSafeNonNegative(input.childCount8to20 ?? 0))

  // ── 지급대상기간 월수 확정
  let periodMonths: number
  let periodBasis: string
  if (input.periodType === 'withPeriod') {
    periodMonths = normalizeBonusPeriodMonths(input.periodMonths ?? MIN_BONUS_PERIOD_MONTHS)
    periodBasis = `입력한 지급대상기간 ${periodMonths}개월`
  } else {
    const resolved = resolveImplicitPeriod(input.paymentMonth, input.previousBonusMonth)
    periodMonths = normalizeBonusPeriodMonths(resolved.months)
    periodBasis = resolved.basis
  }

  // ── 제136조 제1항 제1호 산식
  const monthlyConverted = Math.floor(bonusAmount / periodMonths) + monthlyPay
  const monthlyTaxOnConverted = calcSimplifiedWithholdingTax(
    { monthlyTaxable: monthlyConverted, dependents, childCount8to20 },
    asOfDate,
  )
  const grossTaxForPeriod = monthlyTaxOnConverted * periodMonths

  // ── 기납부세액: 미지정 시 월평균 급여 기준으로 추정
  const prepaidTaxEstimated = input.prepaidTax === undefined
  const prepaidTax = prepaidTaxEstimated
    ? calcSimplifiedWithholdingTax(
        { monthlyTaxable: monthlyPay, dependents, childCount8to20 },
        asOfDate,
      ) * periodMonths
    : toSafeNonNegative(input.prepaidTax ?? 0, MAX_PREPAID_TAX)

  // 기납부세액이 더 크면 추가 징수 세액은 0 (환급은 연말정산에서 처리)
  const incomeTax = Math.max(0, floor10(grossTaxForPeriod - prepaidTax))
  const localTax = floor10(incomeTax * RATES.localTax)

  // ⚠️ 4대보험 중 고용보험만 상여금에 비례해 그달에 부과된다 (보험료징수법 제2조③·제13조②)
  const employmentInsurance = floor10(bonusAmount * RATES.employment)

  const totalDeduction = incomeTax + localTax + employmentInsurance
  const netBonus = Math.max(0, bonusAmount - totalDeduction)
  const additionalAmountDue = Math.max(0, totalDeduction - bonusAmount)

  return {
    periodMonths,
    periodBasis,
    monthlyConverted,
    monthlyTaxOnConverted,
    grossTaxForPeriod,
    prepaidTax,
    prepaidTaxEstimated,
    incomeTax,
    localTax,
    employmentInsurance,
    totalDeduction,
    netBonus,
    additionalAmountDue,
    effectiveDeductionRate: bonusAmount > 0 ? totalDeduction / bonusAmount : null,
  }
}
