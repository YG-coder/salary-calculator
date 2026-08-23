// src/lib/calculators.ts
// 퇴직금, 연차수당, 주휴수당, 실업급여, 4대보험, 급여세금 계산 로직

import { RATES, getPensionLimits, MIN_HOURLY_WAGE_2026 } from './constants'
import { calcSimplifiedWithholdingTax } from './incomeTax'

function floor10(n: number): number {
  return Math.floor(n / 10) * 10
}

// ── 4대보험 계산 ──────────────────────────────────────────────
export interface SocialInsuranceInput {
  monthlyGross: number       // 월 세전 급여 (원)
  isBusinessOwner?: boolean  // 사업주 여부 (기본: 근로자)
}

export interface SocialInsuranceResult {
  nationalPension: number      // 국민연금 (근로자)
  healthInsurance: number      // 건강보험 (근로자)
  longTermCare: number         // 장기요양보험
  employment: number           // 고용보험 (근로자)
  industrialAccident: number   // 산재보험 (사업주 부담, 근로자 0)
  totalEmployee: number        // 근로자 총 부담
  totalEmployer: number        // 사업주 총 부담
  // 사업주 항목
  employerPension: number
  employerHealth: number
  employerLongTerm: number
  employerEmployment: number
}

// asOfDate: 계산 기준 시점 (기본값: 호출 시점의 현재 날짜)
// ⚠️ 조건: 국민연금 기준소득월액 상·하한은 매년 7월 1일 자로 변경되므로, 2026년
// 1~6월과 7월 이후에 서로 다른 상·하한이 적용됩니다. (getPensionLimits() 참고)
export function calculateSocialInsurance(
  input: SocialInsuranceInput,
  asOfDate: Date = new Date(),
): SocialInsuranceResult {
  const { monthlyGross } = input

  // 국민연금: 기준소득월액 상·하한 적용 (계산 기준 시점의 구간 값 조회)
  const pensionLimits = getPensionLimits(asOfDate)
  const pensionBase = Math.min(Math.max(monthlyGross, pensionLimits.min), pensionLimits.max)
  const nationalPension = floor10(pensionBase * RATES.nationalPension)

  // 건강보험
  const healthInsurance = floor10(monthlyGross * RATES.healthInsurance)

  // 장기요양 (건강보험료 × 13.14%)
  const longTermCare = floor10(healthInsurance * RATES.longTermCare)

  // 고용보험 (근로자 0.9%)
  const employment = floor10(monthlyGross * RATES.employment)

  // 산재보험 (사업주 전액 부담, 업종별 상이 → 평균값 0.7% 사용)
  const industrialAccident = floor10(monthlyGross * 0.007)

  const totalEmployee = nationalPension + healthInsurance + longTermCare + employment

  // 사업주 부담분
  const employerPension    = nationalPension                           // 동일 요율 (4.75%)
  const employerHealth     = healthInsurance                           // 동일 요율 (3.595%)
  const employerLongTerm   = longTermCare                              // 동일 요율
  const employerEmployment = floor10(monthlyGross * 0.013)             // 사업주 1.3%
  const totalEmployer =
    employerPension + employerHealth + employerLongTerm + employerEmployment + industrialAccident

  return {
    nationalPension,
    healthInsurance,
    longTermCare,
    employment,
    industrialAccident,
    totalEmployee,
    totalEmployer,
    employerPension,
    employerHealth,
    employerLongTerm,
    employerEmployment,
  }
}

// ── 급여 세금 간편 계산 ───────────────────────────────────────
export interface PayrollTaxInput {
  monthlyGross: number   // 월 세전 급여 (원)
  nonTaxable?: number    // 월 비과세 (원)
  dependents?: number    // 부양가족 수
  /**
   * 공제대상가족 중 8세 이상 20세 이하 자녀 수 (선택, 기본값 0)
   * ⚠️ 조건: 현재 UI는 이 값을 입력받지 않으므로 0으로 가정합니다. 실제로 해당
   * 자녀가 있는 경우 원천징수 세액은 이 계산값보다 낮을 수 있습니다.
   */
  childCount8to20?: number
}

export interface PayrollTaxResult {
  nationalPension: number
  healthInsurance: number
  longTermCare: number
  employment: number
  incomeTax: number
  localTax: number
  totalDeduction: number
  monthlyNet: number
}

// asOfDate: 계산 기준 시점 (기본값: 호출 시점의 현재 날짜)
// ⚠️ 조건: 국민연금 기준소득월액 상·하한은 매년 7월 1일 자로 변경되므로, 2026년
// 1~6월과 7월 이후에 서로 다른 상·하한이 적용됩니다. (getPensionLimits() 참고)
// ⚠️ 조건: 소득세는 종합소득세 누진세율 월할 근사가 아니라, 근로소득 간이세액표
// (소득세법 시행령 별표2) 산식을 구현한 calcSimplifiedWithholdingTax()를 사용합니다.
// (src/lib/incomeTax.ts 참고 — 남아있는 근사 요소는 해당 파일 상단 주석 참고)
export function calculatePayrollTax(
  input: PayrollTaxInput,
  asOfDate: Date = new Date(),
): PayrollTaxResult {
  const { monthlyGross, nonTaxable = 0, dependents = 1, childCount8to20 = 0 } = input
  const monthlyTaxable = Math.max(0, monthlyGross - nonTaxable)

  const pensionLimits   = getPensionLimits(asOfDate)
  const pensionBase     = Math.min(Math.max(monthlyTaxable, pensionLimits.min), pensionLimits.max)
  const nationalPension = floor10(pensionBase    * RATES.nationalPension)
  const healthInsurance = floor10(monthlyTaxable * RATES.healthInsurance)
  const longTermCare    = floor10(healthInsurance * RATES.longTermCare)
  const employment      = floor10(monthlyTaxable * RATES.employment)
  const incomeTax       = calcSimplifiedWithholdingTax(
    {
      monthlyTaxable,
      dependents: Math.max(1, dependents),
      childCount8to20,
    },
    asOfDate,
  )
  const localTax        = floor10(incomeTax * 0.1)

  const totalDeduction  = nationalPension + healthInsurance + longTermCare + employment + incomeTax + localTax

  return {
    nationalPension,
    healthInsurance,
    longTermCare,
    employment,
    incomeTax,
    localTax,
    totalDeduction,
    monthlyNet: monthlyGross - totalDeduction,
  }
}

// ── 퇴직금 계산 ───────────────────────────────────────────────
export interface SeverancePayInput {
  month1Pay: number     // 3개월 전 월 급여 (원)
  month2Pay: number     // 2개월 전
  month3Pay: number     // 1개월 전 (최근)
  startDate: string     // 입사일 (YYYY-MM-DD)
  endDate: string       // 퇴직일 (YYYY-MM-DD)
  annualBonus?: number           // 연간 상여금 (원, 선택)
  annualLeaveAllowance?: number  // 연차수당 (원, 선택)
  ordinaryDailyWage?: number     // 1일 통상임금 (평균임금 하한 비교용, 선택)
  weeklyHours?: number           // 4주 평균 주 소정근로시간 (기본 40시간)
}

export interface SeverancePayResult {
  averageDailyWage: number  // 1일 평균임금
  calculatedAverageDailyWage: number // 통상임금 하한 적용 전 평균임금
  averageWagePeriodDays: number // 퇴직 전 3개월 실제 총일수
  workingDays: number       // 총 재직일수
  severancePay: number      // 퇴직금
  isEligible: boolean       // 지급 요건 충족 여부 (1년 이상)
  ineligibleReason: 'UNDER_ONE_YEAR' | 'UNDER_15_HOURS' | null
  usedOrdinaryWage: boolean
}

function daysBetween(start: string, end: string): number {
  const s = new Date(start)
  const e = new Date(end)
  return Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))
}

// 퇴직일 이전 3개월의 실제 달력 일수. 월말은 대상 월의 마지막 날로 보정한다.
function averageWagePeriodDays(endDate: string): number {
  const end = new Date(`${endDate}T00:00:00Z`)
  if (!Number.isFinite(end.getTime())) return 0
  const targetMonth = end.getUTCMonth() - 3
  const targetYear = end.getUTCFullYear() + Math.floor(targetMonth / 12)
  const normalizedMonth = ((targetMonth % 12) + 12) % 12
  const lastDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate()
  const start = new Date(Date.UTC(targetYear, normalizedMonth, Math.min(end.getUTCDate(), lastDay)))
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

export function calculateSeverancePay(input: SeverancePayInput): SeverancePayResult {
  const {
    month1Pay, month2Pay, month3Pay,
    startDate, endDate,
    annualBonus = 0,
    annualLeaveAllowance = 0,
    ordinaryDailyWage = 0,
    weeklyHours = 40,
  } = input

  const workingDays = daysBetween(startDate, endDate)
  const ineligibleReason = workingDays < 365
    ? 'UNDER_ONE_YEAR' as const
    : weeklyHours < 15
      ? 'UNDER_15_HOURS' as const
      : null
  const isEligible = ineligibleReason === null

  // 3개월 합산 급여 + 상여금 3/12 + 연차수당 3/12
  const threeMonthTotal =
    month1Pay + month2Pay + month3Pay +
    (annualBonus / 12) * 3 +
    (annualLeaveAllowance / 12) * 3

  const threeMonthDays = averageWagePeriodDays(endDate)
  const calculatedAverageDailyWage = threeMonthDays > 0 ? threeMonthTotal / threeMonthDays : 0
  const averageDailyWage = Math.max(calculatedAverageDailyWage, ordinaryDailyWage)
  const usedOrdinaryWage = ordinaryDailyWage > calculatedAverageDailyWage

  // 퇴직금 = 1일 평균임금 × 30 × (재직일수 / 365)
  const severancePay = isEligible
    ? Math.floor(averageDailyWage * 30 * (workingDays / 365))
    : 0

  return {
    averageDailyWage,
    calculatedAverageDailyWage,
    averageWagePeriodDays: threeMonthDays,
    workingDays,
    severancePay,
    isEligible,
    ineligibleReason,
    usedOrdinaryWage,
  }
}

// ── 연차수당 계산 ─────────────────────────────────────────────
export interface AnnualLeavePayInput {
  dailyWage: number   // 1일 통상임금 (원)
  unusedDays: number  // 미사용 연차 일수
}

export interface AnnualLeavePayResult {
  annualLeavePay: number
  perDayAmount: number
}

export function calculateAnnualLeavePay(input: AnnualLeavePayInput): AnnualLeavePayResult {
  const { dailyWage, unusedDays } = input
  return {
    annualLeavePay: Math.floor(dailyWage * unusedDays),
    perDayAmount: dailyWage,
  }
}

// ── 연차 일수 계산 (입사 후 경과 연수 기준) ──────────────────
// 근로기준법 제60조
//  ① 1년간 80% 이상 출근 → 15일
//  ④ 3년 이상 계속근로 시 최초 1년을 초과하는 계속 근로연수 매 2년에 대하여 1일 가산,
//     가산휴가를 포함한 총 휴가 일수는 25일 한도
export const ANNUAL_LEAVE_BASE_DAYS = 15
export const ANNUAL_LEAVE_MAX_DAYS = 25

// 근속연수를 숫자로 직접 입력받으므로 NaN·Infinity·음수·소수를 함수 진입 시점에서 정규화한다.
export function calculateAnnualLeaveDays(workingYears: number): number {
  if (!Number.isFinite(workingYears)) return 0
  const years = Math.floor(workingYears)
  if (years < 1) return 0
  const extra = Math.floor((years - 1) / 2)
  return Math.min(ANNUAL_LEAVE_BASE_DAYS + extra, ANNUAL_LEAVE_MAX_DAYS)
}

// ── 주휴수당 계산 ─────────────────────────────────────────────
export interface WeeklyHolidayPayInput {
  weeklyHours: number  // 주 소정근로시간
  hourlyWage: number   // 시간당 통상임금 (원)
  fullAttendance?: boolean  // 해당 주 소정근로일 개근 여부 (기본: true, 기존 호출 호환)
}

export type WeeklyHolidayPayIneligibleReason =
  | 'UNDER_15_HOURS'
  | 'NOT_FULL_ATTENDANCE'
  | null

export interface WeeklyHolidayPayResult {
  weeklyHolidayPay: number    // 주휴수당
  isEligible: boolean         // 주 15시간 이상 및 개근 여부
  ineligibleReason: WeeklyHolidayPayIneligibleReason
  weeklyHolidayHours: number  // 주휴시간
}

export function calculateWeeklyHolidayPay(input: WeeklyHolidayPayInput): WeeklyHolidayPayResult {
  const { weeklyHours, hourlyWage, fullAttendance = true } = input
  const hasMinimumHours = Number.isFinite(weeklyHours) && weeklyHours >= 15
  const ineligibleReason: WeeklyHolidayPayIneligibleReason = !hasMinimumHours
    ? 'UNDER_15_HOURS'
    : !fullAttendance
      ? 'NOT_FULL_ATTENDANCE'
      : null
  const isEligible = ineligibleReason === null

  // 주휴시간 = 주 소정근로시간 ÷ 5 (최대 8시간)
  const weeklyHolidayHours = isEligible ? Math.min(weeklyHours / 5, 8) : 0
  const weeklyHolidayPay   = isEligible ? Math.floor(weeklyHolidayHours * hourlyWage) : 0

  return { weeklyHolidayPay, isEligible, ineligibleReason, weeklyHolidayHours }
}

// ── 실업급여 계산 ─────────────────────────────────────────────
export interface UnemploymentBenefitInput {
  dailyWage: number            // 퇴직 전 1일 평균임금 (원)
  employmentMonths: number     // 고용보험 가입 기간 (개월)
  age: number                  // 나이
  isDisabled?: boolean         // 장애인 여부
}

export interface UnemploymentBenefitResult {
  dailyBenefit: number      // 1일 실업급여
  totalDays: number         // 수급 일수
  totalBenefit: number      // 총 예상 수급액
  isEligible: boolean       // 수급 요건 충족 여부 (6개월 이상)
  minDailyBenefit: number   // 하한액
  maxDailyBenefit: number   // 상한액
}

export function calculateUnemploymentBenefit(input: UnemploymentBenefitInput): UnemploymentBenefitResult {
  const { dailyWage, employmentMonths, age, isDisabled = false } = input

  /**
   * 2026년 실업급여(구직급여) 상·하한 (1일 기준)
   *
   * ▸ 상한액: 68,100원/일
   *   - 2019년 이후 66,000원으로 동결되어 있었으나, 2026년 최저임금 인상으로
   *     하한액(66,048원)이 기존 상한액(66,000원)을 넘는 역전현상이 발생하여
   *     고용노동부가 상한액을 68,100원으로 인상 (2026.1.1 이후 이직자부터 적용)
   *
   * ▸ 하한액: 최저임금 × 8시간 × 80%
   *   - 2026년 최저시급 10,320원 기준
   *   - 10,320원 × 8시간 × 80% = 66,048원
   *
   * 적용 로직: min(상한, max(하한, 평균임금×60%))
   */
  const MIN_DAILY = Math.floor(MIN_HOURLY_WAGE_2026 * 8 * 0.8)  // 66,048원
  const MAX_DAILY = Math.max(68_100, MIN_DAILY)                  // 68,100원 (2026년 고시)

  // 수급 요건: 이직 전 18개월 내 피보험단위기간 180일(약 6개월) 이상
  const isEligible = employmentMonths >= 6

  // 1일 실업급여 = 1일 평균임금 × 60%, 상·하한 적용
  const rawDaily   = Math.floor(dailyWage * 0.6)
  const dailyBenefit = Math.min(Math.max(rawDaily, MIN_DAILY), MAX_DAILY)

  // 수급 일수: 고용보험법 [별표 1] 기준 (연령·가입기간별)
  // ─────────────────────────────────────────────────────
  // 50세 미만 / 장애인 아님
  //   6개월 미만   → 수급 불가
  //   6개월~1년    → 120일
  //   1년~3년      → 150일
  //   3년~5년      → 180일
  //   5년~10년     → 210일
  //   10년 이상    → 240일
  // 50세 이상 또는 장애인
  //   6개월~1년    → 120일
  //   1년~3년      → 180일
  //   3년~5년      → 210일
  //   5년~10년     → 240일
  //   10년 이상    → 270일
  // ─────────────────────────────────────────────────────
  let totalDays = 0
  if (isEligible) {
    if (age < 50 && !isDisabled) {
      if      (employmentMonths <  12) totalDays = 120
      else if (employmentMonths <  36) totalDays = 150
      else if (employmentMonths <  60) totalDays = 180
      else if (employmentMonths < 120) totalDays = 210
      else                             totalDays = 240
    } else {
      if      (employmentMonths <  12) totalDays = 120
      else if (employmentMonths <  36) totalDays = 180
      else if (employmentMonths <  60) totalDays = 210
      else if (employmentMonths < 120) totalDays = 240
      else                             totalDays = 270
    }
  }

  return {
    dailyBenefit,
    totalDays,
    totalBenefit: dailyBenefit * totalDays,
    isEligible,
    minDailyBenefit: MIN_DAILY,
    maxDailyBenefit: MAX_DAILY,
  }
}
