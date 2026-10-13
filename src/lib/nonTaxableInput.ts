export const MEAL_ALLOWANCE_NOTICE_THRESHOLD = 200_000
export const NON_TAXABLE_EXCEEDS_GROSS = '월 비과세 금액은 월 세전 급여를 초과할 수 없습니다.'

export interface NonTaxableValidation {
  error: string | null
  warning: string | null
}

/** 월급 입력이 준비되지 않은 경우(null)는 금액 형식만 검증한다. */
export function validateNonTaxableInput(
  raw: string,
  monthlyGross: number | null,
  exceedsGrossMessage = NON_TAXABLE_EXCEEDS_GROSS,
): NonTaxableValidation {
  const digits = raw.trim().replace(/,/g, '')
  const amount = digits === '' && raw.trim() === '' ? 0 : /^\d+$/.test(digits) ? Number(digits) : Number.NaN
  if (!Number.isSafeInteger(amount) || amount < 0) {
    return { error: '월 비과세 금액을 유효한 원 단위 금액으로 입력해 주세요.', warning: null }
  }
  if (monthlyGross !== null && (!Number.isSafeInteger(monthlyGross) || monthlyGross < 0)) {
    return { error: '월 세전 급여를 올바른 금액으로 입력해 주세요.', warning: null }
  }
  if (monthlyGross !== null && amount > monthlyGross) return { error: exceedsGrossMessage, warning: null }

  return {
    error: null,
    warning: amount > MEAL_ALLOWANCE_NOTICE_THRESHOLD
      ? '식대 비과세는 월 20만원 한도입니다. 추가 금액은 다른 비과세 항목의 적용 요건을 확인해 주세요.'
      : null,
  }
}
