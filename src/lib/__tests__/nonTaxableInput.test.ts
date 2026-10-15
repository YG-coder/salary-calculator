import { describe, expect, it } from 'vitest'
import { NON_TAXABLE_EXCEEDS_GROSS, validateNonTaxableInput } from '@/lib/nonTaxableInput'

describe('월 비과세 입력 검증', () => {
  it('빈칸은 0으로 추정하지 않는다', () => { expect(validateNonTaxableInput('', 3000000).error).toContain('0을 직접 입력') })
  it('월급 입력 전에는 초과 오류를 표시하지 않는다', () => {
    expect(validateNonTaxableInput('200,000', null)).toEqual({ error: null, warning: null })
  })

  it('월급 입력 전에도 형식 오류와 다른 비과세 안내를 유지한다', () => {
    expect(validateNonTaxableInput('-1', null).error).not.toBeNull()
    expect(validateNonTaxableInput('400,000', null).warning).toContain('다른 비과세 항목')
  })

  it('최소 월급 입력 이후에는 실제 초과 금액을 차단한다', () => {
    expect(validateNonTaxableInput('200,000', 100_000).error).toBe(NON_TAXABLE_EXCEEDS_GROSS)
  })
  it.each(['0', '200,000', '200000'])('정상 입력 %s를 허용한다', (raw) => {
    expect(validateNonTaxableInput(raw, 3_000_000)).toEqual({ error: null, warning: null })
  })

  it.each(['200001', '400,000', '3,000,000'])('20만원 초과 %s도 월급 이하이면 안내만 표시한다', (raw) => {
    const validation = validateNonTaxableInput(raw, 3_000_000)
    expect(validation.error).toBeNull()
    expect(validation.warning).toContain('다른 비과세 항목')
  })

  it.each(['3,000,001', '5,000,000'])('월급보다 큰 %s는 차단한다', (raw) => {
    expect(validateNonTaxableInput(raw, 3_000_000)).toEqual({ error: NON_TAXABLE_EXCEEDS_GROSS, warning: null })
  })

  it('연봉을 12로 나누어 내림한 월급의 원 단위 경계를 적용한다', () => {
    const gross = Math.floor(40_000_000 / 12)
    expect(validateNonTaxableInput('3,333,333', gross).error).toBeNull()
    expect(validateNonTaxableInput('3,333,334', gross).error).toBe(NON_TAXABLE_EXCEEDS_GROSS)
  })

  it.each(['-1', '1.5', '1e6', 'NaN', 'Infinity', '∞', '9007199254740992', ','])('비정상 입력 %s로 계산을 허용하지 않는다', (raw) => {
    expect(validateNonTaxableInput(raw, 3_000_000).error).not.toBeNull()
  })

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1, Number.MAX_SAFE_INTEGER + 1])('비정상 월 세전 %s로 계산을 허용하지 않는다', (gross) => {
    expect(validateNonTaxableInput('0', gross).error).not.toBeNull()
  })

  it('역산 계산 범위의 상한은 별도 메시지를 사용할 수 있다', () => {
    expect(validateNonTaxableInput('41,666,667', Math.floor(500_000_000 / 12), '역산 계산 범위를 초과합니다.').error).toBe('역산 계산 범위를 초과합니다.')
  })
})
