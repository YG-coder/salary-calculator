import { RETIREMENT_BASIC_TAX_BRACKETS, RETIREMENT_TAX_YEAR } from './policy/retirementTax'

export type RetirementProfile = '' | 'ordinary' | 'special'
export type RetirementPayment = '' | 'cash' | 'irp' | 'other'
export interface RetirementTaxInput {
  grossPay: number
  nonTaxablePay: number
  startDate: string
  lastWorkingDate: string
  profile: RetirementProfile
  payment: RetirementPayment
}

interface TaxDetails {
  grossPay: number
  nonTaxablePay: number
  taxableIncome: number
  serviceMonths: number
  serviceYears: number
  serviceDeduction: number
  annualizedIncome: number
  annualizedDeduction: number
  taxBase: number
  annualizedTax: number
  assessedIncomeTax: number
}

export type RetirementTaxResult =
  | { status: 'held'; reason: string }
  | (TaxDetails & {
      status: 'calculated'; payment: 'cash'
      incomeTax: number; localTax: number; totalTax: number; netPay: number
      smallTaxExemption: boolean
    })
  | (TaxDetails & {
      status: 'calculated'; payment: 'irp'
      accountDeposit: number; deferredIncomeTax: number; deferredLocalTax: number
    })

function calendarDate(value: string): Date | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null
}

/** 세법상 기간: 국세청 계산 자료의 완료 월 수 + 1, 연수 올림. 재직일수/365와 별개. */
export function getRetirementTaxTenure(startDate: string, lastWorkingDate: string) {
  const start = calendarDate(startDate)
  const end = calendarDate(lastWorkingDate)
  if (!start || !end || end < start) return null
  const completedMonths = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    end.getUTCMonth() - start.getUTCMonth() - (end.getUTCDate() < start.getUTCDate() ? 1 : 0)
  const serviceMonths = completedMonths + 1
  return { serviceMonths, serviceYears: Math.ceil(serviceMonths / 12) }
}

const held = (reason: string): RetirementTaxResult => ({ status: 'held', reason })
const min = (a: bigint, b: bigint) => a < b ? a : b

/** 2026년 일반 단일 퇴직 예상액. 미지원/미입력은 금액 필드 없는 결과로 반환한다. */
export function calculateRetirementTax(input: RetirementTaxInput): RetirementTaxResult {
  if (!input.profile) return held('대상 조건을 확인하고 선택해 주세요.')
  if (input.profile !== 'ordinary') return held('중간정산·합산·근속기간 조정·임원·비거주자 등 특례는 지원하지 않아 세금 계산을 보류합니다.')
  const tenure = getRetirementTaxTenure(input.startDate, input.lastWorkingDate)
  if (!tenure) return held('입사일과 마지막 근무일을 확인해 주세요.')
  if (Number(input.lastWorkingDate.slice(0, 4)) !== RETIREMENT_TAX_YEAR) {
    return held(`${RETIREMENT_TAX_YEAR}년 외 퇴직소득세 기준은 검증하지 않아 계산을 보류합니다.`)
  }
  if (!Number.isSafeInteger(input.grossPay) || input.grossPay <= 0 || input.grossPay > Math.floor(Number.MAX_SAFE_INTEGER / 12)) {
    return held('세전 퇴직금이 계산 가능한 원 단위 금액인지 확인해 주세요.')
  }
  if (!Number.isSafeInteger(input.nonTaxablePay) || input.nonTaxablePay < 0) {
    return held('비과세 퇴직소득을 원 단위로 입력해 주세요. 없으면 0을 직접 입력하세요.')
  }
  if (input.nonTaxablePay > input.grossPay) return held('비과세 퇴직소득은 세전 퇴직금을 초과할 수 없습니다.')
  if (!input.payment) return held('수령 방식을 선택해 주세요.')
  if (input.payment !== 'cash' && input.payment !== 'irp') return held('일부 이전·수령 후 재입금·그 밖의 수령 방식은 지원하지 않아 세금 계산을 보류합니다.')
  if (input.payment === 'irp' && input.nonTaxablePay !== 0) {
    return held('비과세 퇴직소득이 포함된 IRP 이전은 입금 대상과 배분 확인이 필요하여 계산을 보류합니다.')
  }

  const gross = BigInt(input.grossPay)
  const taxable = gross - BigInt(input.nonTaxablePay)
  const years = BigInt(tenure.serviceYears)
  const serviceDeduction = min(taxable, years <= BigInt(5) ? years * BigInt(1_000_000)
    : years <= BigInt(10) ? BigInt(5_000_000) + (years - BigInt(5)) * BigInt(2_000_000)
      : years <= BigInt(20) ? BigInt(15_000_000) + (years - BigInt(10)) * BigInt(2_500_000)
        : BigInt(40_000_000) + (years - BigInt(20)) * BigInt(3_000_000))
  // 양수 정수 나눗셈으로 각 단계의 원 미만 절사. 마지막에 한 번만 절사하지 않는다.
  const annualizedIncome = (taxable - serviceDeduction) * BigInt(12) / years
  const annualizedDeduction = annualizedIncome <= BigInt(8_000_000) ? annualizedIncome
    : annualizedIncome <= BigInt(70_000_000) ? BigInt(8_000_000) + (annualizedIncome - BigInt(8_000_000)) * BigInt(60) / BigInt(100)
      : annualizedIncome <= BigInt(100_000_000) ? BigInt(45_200_000) + (annualizedIncome - BigInt(70_000_000)) * BigInt(55) / BigInt(100)
        : annualizedIncome <= BigInt(300_000_000) ? BigInt(61_700_000) + (annualizedIncome - BigInt(100_000_000)) * BigInt(45) / BigInt(100)
          : BigInt(151_700_000) + (annualizedIncome - BigInt(300_000_000)) * BigInt(35) / BigInt(100)
  const taxBase = annualizedIncome - annualizedDeduction
  const [, rate, deduction] = RETIREMENT_BASIC_TAX_BRACKETS.find(([upper]) => taxBase <= BigInt(upper))!
  const annualizedTax = taxBase * BigInt(rate) / BigInt(100) - BigInt(deduction)
  const assessedIncomeTax = annualizedTax * years / BigInt(12)
  const details: TaxDetails = {
    grossPay: input.grossPay, nonTaxablePay: input.nonTaxablePay, taxableIncome: Number(taxable), ...tenure,
    serviceDeduction: Number(serviceDeduction), annualizedIncome: Number(annualizedIncome),
    annualizedDeduction: Number(annualizedDeduction), taxBase: Number(taxBase),
    annualizedTax: Number(annualizedTax), assessedIncomeTax: Number(assessedIncomeTax),
  }
  if (input.payment === 'irp') {
    // 전액 직접 이전의 이연 세액은 원 단위로 보존. 장래 인출 시 세액은 계산하지 않는다.
    return { status: 'calculated', payment: 'irp', ...details, accountDeposit: input.grossPay,
      deferredIncomeTax: Number(assessedIncomeTax), deferredLocalTax: Number(assessedIncomeTax / BigInt(10)) }
  }
  const smallTaxExemption = assessedIncomeTax > BigInt(0) && assessedIncomeTax < BigInt(1_000)
  const incomeTax = assessedIncomeTax < BigInt(1_000) ? BigInt(0) : assessedIncomeTax / BigInt(10) * BigInt(10)
  const localTax = incomeTax / BigInt(100) * BigInt(10)
  return { status: 'calculated', payment: 'cash', ...details, incomeTax: Number(incomeTax),
    localTax: Number(localTax), totalTax: Number(incomeTax + localTax),
    netPay: Number(gross - incomeTax - localTax), smallTaxExemption }
}
