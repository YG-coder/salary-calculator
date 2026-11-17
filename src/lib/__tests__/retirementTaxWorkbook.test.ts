import { describe, expect, it } from 'vitest'
import { calculateRetirementTax, getRetirementTaxTenure, type RetirementTaxInput } from '../retirementTax'
import fixture from './fixtures/retirementTaxD260813.json'

describe('사용자 제공 D260813 원문 수식 재계산과 대조', () => {
  it.each(fixture.cases)('$name', ({ input, workbook, tenureOnly }) => {
    if (tenureOnly) {
      // 하반기 파일의 적용기간 밖 사례는 날짜 산식만 비교한다.
      expect(getRetirementTaxTenure(input.startDate, input.lastWorkingDate)).toEqual(workbook)
      return
    }
    const result = calculateRetirementTax(input as RetirementTaxInput)
    expect(result.status).toBe('calculated')
    if (result.status !== 'calculated') throw new Error(result.reason)
    const { incomeTax, localTax, deferredIncomeTax, deferredLocalTax, ...steps } = workbook
    expect(result).toMatchObject(steps)
    if (result.payment === 'irp') {
      expect(result).toMatchObject({ deferredIncomeTax, deferredLocalTax, accountDeposit: input.grossPay })
      expect(incomeTax).toBe(0)
      expect(localTax).toBe(0)
    } else if (workbook.assessedIncomeTax === 999) {
      // 원문 값을 0으로 바꾸지 않는다. 법 제86조 적용은 엑셀과 구분한다.
      expect({ incomeTax, localTax }).toEqual({ incomeTax: 990, localTax: 90 })
      expect(result).toMatchObject({ incomeTax: 0, localTax: 0, smallTaxExemption: true, netPay: input.grossPay })
    } else {
      expect(result).toMatchObject({ incomeTax, localTax, netPay: input.grossPay - incomeTax! - localTax! })
    }
  })
})
