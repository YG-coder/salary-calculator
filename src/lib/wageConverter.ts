// src/lib/wageConverter.ts
// ────────────────────────────────────────────────────────────
// 시급·월급·연봉 세전 환산과, 사용자가 확인한 조건에 한정한 최저임금 비교.
//
// 원칙 (근거·미확인 범위: docs/wage-converter.md)
//  - 환산과 최저임금 비교는 서로 다른 결과다. 환산이 되어도 비교는 보류될 수 있다.
//  - 월 기준시간을 추정하지 않는다. 표준 조건(209시간)은 사용자가 고른 경우에만 쓰고,
//    그 밖에는 사용자가 입력한 시간만 쓴다.
//  - 최저임금 비교에는 사용자가 "산입 대상"이라고 확인해 입력한 금액만 쓴다.
//    입력한 급여 전체를 자동으로 비교하지 않는다.
//  - 미선택·빈칸을 0이나 "해당 없음"으로 바꾸지 않는다. 보류는 금액 없는 결과다.
//  - 금액 계산은 BigInt 정수로 하고, 표시 금액은 원 미만을 버린다.
//    기준 이상/미만 판정은 버림 전의 정확한 값으로 한다.
// ────────────────────────────────────────────────────────────

import {
  MAX_MONTHLY_HOURS,
  STANDARD_MONTHLY_HOURS,
  getComparisonMinimumWage,
  isSupportedComparisonYear,
} from './policy/minimumWageComparison'

export type WageBasis = '' | 'hourly' | 'monthly' | 'annual'
/** standard: 주 40시간·유급 주휴 8시간(월 209시간) / custom: 직접 입력 / none: 시급 환산 안 함 */
export type HoursMode = '' | 'standard' | 'custom' | 'none'
/** equal12: 매월 같은 금액 12회 / mixed: 상여금·성과급·퇴직금 포함 또는 모름 */
export type AnnualComposition = '' | 'equal12' | 'mixed'
export type CompareChoice = '' | 'yes' | 'no'
export type WorkerProfile = '' | 'ordinary' | 'special'

export interface WageConverterInput {
  basis: WageBasis
  /** 세전 금액 (원). 빈칸·잘못된 입력은 NaN */
  amount: number
  hoursMode: HoursMode
  /** 직접 입력한 월 기준시간 문자열 (소수 둘째 자리까지) */
  customHours: string
  annualComposition: AnnualComposition
  compare: CompareChoice
  /** 비교 적용 연도. 미선택은 null */
  compareYear: number | null
  profile: WorkerProfile
  /** 최저임금 산입 대상으로 확인한 금액 (원). 시급 기준이면 시급, 그 외에는 월 금액. 빈칸은 NaN */
  includedAmount: number
}

export interface WageConversion {
  status: 'calculated'
  basis: Exclude<WageBasis, ''>
  amount: number
  /** 적용한 월 기준시간 표시 (예: "209", "174.5"). 시급 환산을 하지 않으면 null */
  monthlyHoursText: string | null
  /** 원 미만 버림. 시급 환산을 하지 않으면 null */
  hourly: number | null
  monthly: number
  annual: number
  /** 표시 금액에서 원 미만을 버린 항목이 있는지 */
  truncated: boolean
}

export interface MinimumWageComparison {
  status: 'calculated'
  year: number
  minimumHourly: number
  includedAmount: number
  includedUnit: 'hourly' | 'monthly'
  /** 비교 시급 (원 미만 버림) */
  comparedHourly: number
  /** 버림 전의 정확한 값으로 판정 */
  meetsMinimum: boolean
  /** 시간당 차액의 크기 (원 미만 버림) */
  hourlyGap: number
  /** 차액이 0은 아니지만 1원 미만인 경우 */
  gapUnderOneWon: boolean
}

export type Held = { status: 'held'; reason: string }
export type Skipped = { status: 'skipped' }

export interface WageConverterResult {
  conversion: WageConversion | Held
  comparison: MinimumWageComparison | Held | Skipped
}

const ZERO = BigInt(0)
const HUNDRED = BigInt(100)
const TWELVE = BigInt(12)
const MAX_OUTPUT = BigInt(Number.MAX_SAFE_INTEGER)
const MAX_AMOUNT = Math.floor(Number.MAX_SAFE_INTEGER / 12)

const held = (reason: string): Held => ({ status: 'held', reason })

/** 월 기준시간을 1/100시간 단위 정수로 읽는다. 잘못된 형식·범위는 null. */
export function parseMonthlyHours(raw: string): bigint | null {
  const text = raw.trim()
  if (!/^\d{1,3}(?:\.\d{1,2})?$/.test(text)) return null
  const [whole, fraction = ''] = text.split('.')
  const hundredths = BigInt(whole) * HUNDRED + BigInt(fraction.padEnd(2, '0'))
  if (hundredths <= ZERO || hundredths > BigInt(MAX_MONTHLY_HOURS) * HUNDRED) return null
  return hundredths
}

function hoursText(hundredths: bigint): string {
  const whole = hundredths / HUNDRED
  const fraction = (hundredths % HUNDRED).toString().padStart(2, '0').replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : `${whole}`
}

function validAmount(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0 && value <= MAX_AMOUNT
}

type Hours = { hundredths: bigint } | { none: true } | Held

function resolveHours(input: WageConverterInput): Hours {
  if (input.hoursMode === '') return held('월 기준시간을 어떻게 정할지 선택해 주세요.')
  if (input.hoursMode === 'none') return { none: true }
  if (input.hoursMode === 'standard') return { hundredths: BigInt(STANDARD_MONTHLY_HOURS) * HUNDRED }
  const parsed = parseMonthlyHours(input.customHours)
  if (parsed === null) {
    return held(`월 기준시간을 0보다 크고 ${MAX_MONTHLY_HOURS} 이하인 숫자로 입력해 주세요. 소수는 둘째 자리까지 입력할 수 있습니다.`)
  }
  return { hundredths: parsed }
}

function convert(input: WageConverterInput, hours: Hours): WageConversion | Held {
  if (input.basis === '') return held('입력할 금액이 시급·월급·연봉 중 무엇인지 선택해 주세요.')
  if (!validAmount(input.amount)) return held('세전 금액을 원 단위 숫자로 입력해 주세요.')
  if (input.basis === 'annual') {
    if (input.annualComposition === '') return held('연봉이 매월 같은 금액으로 지급되는지 선택해 주세요.')
    if (input.annualComposition === 'mixed') {
      return held('상여금·성과급·퇴직금이 포함됐거나 구성이 확인되지 않은 연봉은 월 정기급여를 나눌 수 없어 환산을 보류합니다. 매월 받는 정기급여를 월급으로 입력해 주세요.')
    }
  }
  if ('status' in hours) return hours
  const amount = BigInt(input.amount)

  if ('none' in hours) {
    if (input.basis === 'hourly') {
      return held('시급을 월급·연봉으로 환산하려면 월 기준시간이 필요합니다. 표준 조건을 선택하거나 직접 입력해 주세요.')
    }
    // 월급 ↔ 연봉만 환산한다 (같은 월 정기급여가 12개월 지급되는 조건).
    const annual = input.basis === 'monthly' ? amount * TWELVE : amount
    return {
      status: 'calculated', basis: input.basis, amount: input.amount, monthlyHoursText: null, hourly: null,
      monthly: Number(annual / TWELVE), annual: Number(annual), truncated: annual % TWELVE !== ZERO,
    }
  }

  const h = hours.hundredths
  if (input.basis === 'hourly') {
    // 월급 = 시급 × 월 기준시간, 연봉 = 월급 × 12. 각각 정확한 값에서 원 미만만 버린다.
    const monthlyTimes100 = amount * h
    const annualTimes100 = monthlyTimes100 * TWELVE
    if (annualTimes100 / HUNDRED > MAX_OUTPUT) return held('환산 금액이 정확하게 표시할 수 있는 범위를 넘습니다. 금액과 월 기준시간을 확인해 주세요.')
    return {
      status: 'calculated', basis: input.basis, amount: input.amount, monthlyHoursText: hoursText(h),
      hourly: input.amount, monthly: Number(monthlyTimes100 / HUNDRED), annual: Number(annualTimes100 / HUNDRED),
      truncated: monthlyTimes100 % HUNDRED !== ZERO || annualTimes100 % HUNDRED !== ZERO,
    }
  }

  const annual = input.basis === 'monthly' ? amount * TWELVE : amount
  // 시급 = 연봉 ÷ 12 ÷ 월 기준시간 = 연봉 × 100 ÷ (12 × h)
  const hourlyNumerator = annual * HUNDRED
  const hourlyDenominator = TWELVE * h
  if (hourlyNumerator / hourlyDenominator > MAX_OUTPUT) return held('환산 시급이 정확하게 표시할 수 있는 범위를 넘습니다. 금액과 월 기준시간을 확인해 주세요.')
  return {
    status: 'calculated', basis: input.basis, amount: input.amount, monthlyHoursText: hoursText(h),
    hourly: Number(hourlyNumerator / hourlyDenominator), monthly: Number(annual / TWELVE), annual: Number(annual),
    truncated: annual % TWELVE !== ZERO || hourlyNumerator % hourlyDenominator !== ZERO,
  }
}

function compare(input: WageConverterInput, hours: Hours): MinimumWageComparison | Held | Skipped {
  if (input.compare === '') return held('최저임금과 비교할지 선택해 주세요.')
  if (input.compare === 'no') return { status: 'skipped' }
  if (input.basis === '') return held('입력할 금액이 시급·월급·연봉 중 무엇인지 선택해 주세요.')
  if (input.compareYear === null) return held('적용 연도를 선택해 주세요.')
  if (!isSupportedComparisonYear(input.compareYear)) {
    return held(`${input.compareYear}년은 임금 환산·산입 규정의 적용 여부를 확인하지 못해 최저임금 비교를 보류합니다.`)
  }
  if (input.profile === '') return held('근무 조건을 확인하고 선택해 주세요.')
  if (input.profile !== 'ordinary') {
    return held('수습 감액·적용 제외·주마다 달라지는 근무시간 등은 별도 확인이 필요해 최저임금 비교를 보류합니다.')
  }
  if (!validAmount(input.includedAmount)) {
    return held('최저임금에 산입되는 임금을 확인해 원 단위로 입력해 주세요. 입력한 급여 전체를 자동으로 비교하지 않습니다.')
  }
  const minimumHourly = getComparisonMinimumWage(input.compareYear)
  const minimum = BigInt(minimumHourly)
  const included = BigInt(input.includedAmount)

  if (input.basis === 'hourly') {
    const gap = included >= minimum ? included - minimum : minimum - included
    return {
      status: 'calculated', year: input.compareYear, minimumHourly, includedAmount: input.includedAmount,
      includedUnit: 'hourly', comparedHourly: input.includedAmount, meetsMinimum: included >= minimum,
      hourlyGap: Number(gap), gapUnderOneWon: false,
    }
  }

  if ('status' in hours) return hours
  if ('none' in hours) {
    return held('월 금액을 최저임금과 비교하려면 월 기준시간이 필요합니다. 표준 조건을 선택하거나 직접 입력해 주세요.')
  }
  const h = hours.hundredths
  // 비교 시급 = 산입 월 임금 ÷ (h/100). 판정은 나누기 전의 정수끼리 한다.
  const left = included * HUNDRED // 산입 월 임금 × 100
  const right = minimum * h       // 최저시급 × 월 기준시간 × 100
  const gapNumerator = left >= right ? left - right : right - left
  const hourlyGap = gapNumerator / h
  if (left / h > MAX_OUTPUT || hourlyGap > MAX_OUTPUT) return held('비교 금액이 정확하게 표시할 수 있는 범위를 넘습니다. 산입 임금과 월 기준시간을 확인해 주세요.')
  return {
    status: 'calculated', year: input.compareYear, minimumHourly, includedAmount: input.includedAmount,
    includedUnit: 'monthly', comparedHourly: Number(left / h), meetsMinimum: left >= right,
    hourlyGap: Number(hourlyGap), gapUnderOneWon: gapNumerator !== ZERO && hourlyGap === ZERO,
  }
}

export function calculateWageConversion(input: WageConverterInput): WageConverterResult {
  const hours = resolveHours(input)
  return { conversion: convert(input, hours), comparison: compare(input, hours) }
}
