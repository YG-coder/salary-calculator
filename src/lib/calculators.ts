// src/lib/calculators.ts
// 퇴직금, 연차수당, 주휴수당, 실업급여, 4대보험, 급여세금 계산 로직

import { RATES, PENSION_LIMITS, MIN_HOURLY_WAGE_2026 } from './constants'

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

export function calculateSocialInsurance(input: SocialInsuranceInput): SocialInsuranceResult {
  const { monthlyGross } = input

  // 국민연금: 기준소득월액 상·하한 적용
  const pensionBase = Math.min(Math.max(monthlyGross, PENSION_LIMITS.min), PENSION_LIMITS.max)
  const nationalPension = floor10(pensionBase * RATES.nationalPension)

  // 건강보험
  const healthInsurance = floor10(monthlyGross * RATES.healthInsurance)

  // 장기요양 (건강보험료 × 12.95%)
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

// 간이세액표 근사 계산
function simpleIncomeTax(monthlyTaxable: number, dependents: number): number {
  const annual = monthlyTaxable * 12

  // 근로소득공제
  let wageDeduction = 0
  if      (annual <= 5_000_000)   wageDeduction = annual * 0.70
  else if (annual <= 15_000_000)  wageDeduction = 3_500_000  + (annual - 5_000_000)   * 0.40
  else if (annual <= 45_000_000)  wageDeduction = 7_500_000  + (annual - 15_000_000)  * 0.15
  else if (annual <= 100_000_000) wageDeduction = 12_000_000 + (annual - 45_000_000)  * 0.05
  else                            wageDeduction = 14_750_000
  wageDeduction = Math.min(wageDeduction, 14_000_000)

  const basicDeduction = 1_500_000 * Math.max(1, dependents)
  const taxBase = Math.max(0, annual - wageDeduction - basicDeduction)

  let grossTax = 0
  if      (taxBase <= 14_000_000)    grossTax = taxBase * 0.06
  else if (taxBase <= 50_000_000)    grossTax = 840_000    + (taxBase - 14_000_000)  * 0.15
  else if (taxBase <= 88_000_000)    grossTax = 6_240_000  + (taxBase - 50_000_000)  * 0.24
  else if (taxBase <= 150_000_000)   grossTax = 15_360_000 + (taxBase - 88_000_000)  * 0.35
  else if (taxBase <= 300_000_000)   grossTax = 37_060_000 + (taxBase - 150_000_000) * 0.38
  else if (taxBase <= 500_000_000)   grossTax = 94_060_000 + (taxBase - 300_000_000) * 0.40
  else if (taxBase <= 1_000_000_000) grossTax = 174_060_000 + (taxBase - 500_000_000) * 0.42
  else                               grossTax = 384_060_000 + (taxBase - 1_000_000_000) * 0.45

  let credit = grossTax <= 1_300_000
    ? grossTax * 0.55
    : 715_000 + (grossTax - 1_300_000) * 0.30
  credit = Math.min(credit, 740_000)

  const annualTax = Math.max(0, grossTax - credit)
  return floor10(annualTax / 12)
}

export function calculatePayrollTax(input: PayrollTaxInput): PayrollTaxResult {
  const { monthlyGross, nonTaxable = 0, dependents = 1 } = input
  const monthlyTaxable = Math.max(0, monthlyGross - nonTaxable)

  const pensionBase    = Math.min(Math.max(monthlyTaxable, PENSION_LIMITS.min), PENSION_LIMITS.max)
  const nationalPension = floor10(pensionBase    * RATES.nationalPension)
  const healthInsurance = floor10(monthlyTaxable * RATES.healthInsurance)
  const longTermCare    = floor10(healthInsurance * RATES.longTermCare)
  const employment      = floor10(monthlyTaxable * RATES.employment)
  const incomeTax       = simpleIncomeTax(monthlyTaxable, dependents)
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
}

export interface SeverancePayResult {
  averageDailyWage: number  // 1일 평균임금
  workingDays: number       // 총 재직일수
  severancePay: number      // 퇴직금
  isEligible: boolean       // 지급 요건 충족 여부 (1년 이상)
}

function daysBetween(start: string, end: string): number {
  const s = new Date(start)
  const e = new Date(end)
  return Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))
}

export function calculateSeverancePay(input: SeverancePayInput): SeverancePayResult {
  const {
    month1Pay, month2Pay, month3Pay,
    startDate, endDate,
    annualBonus = 0,
    annualLeaveAllowance = 0,
  } = input

  const workingDays = daysBetween(startDate, endDate)
  const isEligible  = workingDays >= 365

  // 3개월 합산 급여 + 상여금 3/12 + 연차수당 3/12
  const threeMonthTotal =
    month1Pay + month2Pay + month3Pay +
    (annualBonus / 12) * 3 +
    (annualLeaveAllowance / 12) * 3

  // 최근 3개월 총 일수: 실무상 92일 기준 사용 (법적으로는 실제 달력 일수 합산)
  const threeMonthDays  = 92
  const averageDailyWage = threeMonthTotal / threeMonthDays

  // 퇴직금 = 1일 평균임금 × 30 × (재직일수 / 365)
  const severancePay = isEligible
    ? Math.floor(averageDailyWage * 30 * (workingDays / 365))
    : 0

  return { averageDailyWage, workingDays, severancePay, isEligible }
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
export function calculateAnnualLeaveDays(workingYears: number): number {
  if (workingYears < 1)  return 0
  if (workingYears === 1) return 15
  const extra = Math.floor((workingYears - 1) / 2)
  return Math.min(15 + extra, 25)
}

// ── 주휴수당 계산 ─────────────────────────────────────────────
export interface WeeklyHolidayPayInput {
  weeklyHours: number  // 주 소정근로시간
  hourlyWage: number   // 시간당 통상임금 (원)
}

export interface WeeklyHolidayPayResult {
  weeklyHolidayPay: number    // 주휴수당
  isEligible: boolean         // 주 15시간 이상 여부
  weeklyHolidayHours: number  // 주휴시간
}

export function calculateWeeklyHolidayPay(input: WeeklyHolidayPayInput): WeeklyHolidayPayResult {
  const { weeklyHours, hourlyWage } = input
  const isEligible = weeklyHours >= 15

  // 주휴시간 = 주 소정근로시간 ÷ 5 (최대 8시간)
  const weeklyHolidayHours = isEligible ? Math.min(weeklyHours / 5, 8) : 0
  const weeklyHolidayPay   = isEligible ? Math.floor(weeklyHolidayHours * hourlyWage) : 0

  return { weeklyHolidayPay, isEligible, weeklyHolidayHours }
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
  const { dailyWage, employmentMonths, age } = input

  /**
   * 2026년 실업급여 상·하한
   *
   * ▸ 상한액: 66,000원/일
   *   - 고용노동부 고시 기준 (2024년부터 동결 중, 2026년 고시 미변경 시 66,000원 적용)
   *
   * ▸ 하한액: 최저임금 × 8시간 × 80%
   *   - 2026년 최저시급 10,320원 기준
   *   - 10,320원 × 8시간 × 80% = 66,048원
   *   - 하한(66,048원)이 상한(66,000원)보다 높아지는 경우
   *     → 실업급여법상 하한이 상한보다 클 수 없으므로
   *       상한도 최소 하한 이상으로 적용 (실무상 고용부 별도 고시로 상한 상향)
   *   - 이 계산기는 min(MAX, max(MIN, raw)) 로직 적용;
   *     하한이 상한보다 클 경우 하한액으로 수렴
   */
  const MIN_DAILY = Math.floor(MIN_HOURLY_WAGE_2026 * 8 * 0.8)  // 66,048원
  const MAX_DAILY = Math.max(66_000, MIN_DAILY)                  // 66,048원 (2026년 기준)

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
    if (age < 50) {
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
