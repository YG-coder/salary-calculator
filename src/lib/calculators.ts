// src/lib/calculators.ts
// 퇴직금, 연차수당, 주휴수당, 실업급여, 4대보험, 급여세금 계산 로직

import { RATES, getPensionLimits, getPensionRate, MIN_HOURLY_WAGE_2026 } from './constants'
import { DEFAULT_EMPLOYER_EMPLOYMENT_RATE } from './policy/socialInsurance'
import {
  ANNUAL_LEAVE_BASE_DAYS,
  ANNUAL_LEAVE_MAX_DAYS,
  ADDITIONAL_LEAVE_INTERVAL_YEARS,
  SUB_ONE_YEAR_MONTHLY_DAYS,
  SUB_ONE_YEAR_MAX_DAYS,
  type AnnualLeaveTenureCategory,
} from './policy/annualLeave'
import { calculateSalary } from './salary'

function floor10(n: number): number {
  return Math.floor(n / 10) * 10
}

// ── 4대보험 계산 ──────────────────────────────────────────────
export interface SocialInsuranceInput {
  monthlyGross: number       // 월 세전 급여 (원)
  nonTaxable?: number        // 월 비과세 급여 (기본 0원)
  isBusinessOwner?: boolean  // 사업주 여부 (기본: 근로자)
  employerEmploymentRate?: number // 실업급여 0.9% + 사업규모별 고용안정·직업능력 요율
  /**
   * 산재보험료율 (사업주 전액 부담).
   *
   * ⚠️ 법정 요율은 사업의 종류별로 고용노동부령으로 정하며(보험료징수법 제14조③),
   *    특정 업종이 전체 평균의 20배까지 갈 수 있다(같은 조 ⑤). 따라서 정확한 계산에는
   *    사업장의 실제 요율을 넘겨야 한다.
   *
   *    생략하면 0으로 계산한다. 업종을 모르는 상태에서 임의 요율을 적용하지 않는다.
   */
  industrialAccidentRate?: number
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
  /** 실제 적용된 산재보험료율 (화면 표시용) */
  industrialAccidentRate: number
}

// asOfDate: 계산 기준 시점 (기본값: 호출 시점의 현재 날짜)
// ⚠️ 조건: 국민연금 기준소득월액 상·하한은 매년 7월 1일 자로 변경되므로, 2026년
// 1~6월과 7월 이후에 서로 다른 상·하한이 적용됩니다. (getPensionLimits() 참고)
export function calculateSocialInsurance(
  input: SocialInsuranceInput,
  asOfDate: Date = new Date(),
): SocialInsuranceResult {
  const {
    monthlyGross,
    nonTaxable = 0,
    employerEmploymentRate = DEFAULT_EMPLOYER_EMPLOYMENT_RATE,
    industrialAccidentRate = 0,
  } = input
  const monthlyTaxable = Math.max(0, monthlyGross - nonTaxable)

  // 국민연금: 기준소득월액 상·하한 적용 (계산 기준 시점의 구간 값 조회)
  const pensionLimits = getPensionLimits(asOfDate)
  const pensionBase = Math.min(Math.max(monthlyTaxable, pensionLimits.min), pensionLimits.max)
  const nationalPension = floor10(pensionBase * getPensionRate(asOfDate))

  // 건강보험
  const healthInsurance = floor10(monthlyTaxable * RATES.healthInsurance)

  // 장기요양 (건강보험료 × 13.14%)
  const longTermCare = floor10(healthInsurance * RATES.longTermCare)

  // 고용보험 (근로자 0.9%)
  const employment = floor10(monthlyTaxable * RATES.employment)

  // 산재보험 (사업주 전액 부담, 업종별 고용노동부령 — 호출부가 요율을 넘긴다)
  const safeIndustrialRate =
    Number.isFinite(industrialAccidentRate) && industrialAccidentRate > 0
      ? industrialAccidentRate
      : 0
  const industrialAccident = floor10(monthlyTaxable * safeIndustrialRate)

  const totalEmployee = nationalPension + healthInsurance + longTermCare + employment

  // 사업주 부담분
  const employerPension    = nationalPension                           // 법정 동일 요율
  const employerHealth     = healthInsurance                           // 동일 요율 (3.595%)
  const employerLongTerm   = longTermCare                              // 동일 요율
  const employerEmployment = floor10(monthlyTaxable * employerEmploymentRate)
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
    industrialAccidentRate: safeIndustrialRate,
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
  const salaryResult = calculateSalary(
    {
      annualSalary: monthlyGross * 12,
      nonTaxable,
      dependents,
      childCount8to20,
    },
    asOfDate,
  )
  const {
    nationalPension,
    healthInsurance,
    longTermCare,
    employment,
    incomeTax,
    localTax,
    totalDeduction,
  } = salaryResult.breakdown

  return {
    nationalPension,
    healthInsurance,
    longTermCare,
    employment,
    incomeTax,
    localTax,
    totalDeduction,
    monthlyNet: salaryResult.monthlyNet,
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
  unusedDays: number  // 미사용 연차 일수 (반차 등 소수 허용)
}

export interface AnnualLeavePayResult {
  annualLeavePay: number
  perDayAmount: number
}

/**
 * 비정상 입력 정규화 정책.
 *
 * 이 프로젝트의 다른 계산 함수(calculateSocialInsurance의 Math.max(0, ...),
 * calculateAnnualLeaveDays·calculateWeeklyHolidayPay의 Number.isFinite 가드,
 * incomeTax의 Math.max(0, ...))는 모두 "오류 상태를 반환하지 않고 안전한 값으로
 * 정규화"하는 방식을 씁니다. ineligibleReason 같은 상태 필드는 입력 오류가 아니라
 * "법정 지급 요건 미충족"을 나타낼 때만 사용합니다.
 *
 * 따라서 여기서도 동일하게 NaN·±Infinity·음수를 0으로 정규화하며, 반환 타입은
 * 바꾸지 않습니다. 0은 "계산 대상 없음"으로 보아 0원을 반환합니다(오류 아님).
 */
function toSafeNonNegative(value: number): number {
  // `value <= 0`으로 비교해 -0도 +0으로 정규화한다 (formatKRW(-0)이 "-0원"으로 표시되는 것 방지).
  if (!Number.isFinite(value) || value <= 0) return 0
  return Math.min(value, Number.MAX_SAFE_INTEGER)
}

/**
 * 부동소수점 곱셈 오차를 보정한 뒤 내림한다.
 *
 * 미사용 연차일수에 소수를 허용하면서 생긴 문제다. 예를 들어
 * `81_925 * 1.4 === 114_694.99999999999`이므로 그대로 Math.floor()하면
 * 실제 금액보다 1원이 적게 나온다. 이진 분수가 아닌 0.1·0.05 단위 연차를
 * 쓰는 사업장에서 실제로 발생한다.
 *
 * 값이 정수와 사실상 같으면(상대오차 기준) 그 정수로 보고, 그렇지 않을 때만 내림한다.
 */
function floorWithFloatTolerance(value: number): number {
  const nearest = Math.round(value)
  const tolerance = Math.max(1e-6, Math.abs(value) * Number.EPSILON * 8)
  if (Math.abs(value - nearest) <= tolerance) return nearest
  return Math.floor(value)
}

export function calculateAnnualLeavePay(input: AnnualLeavePayInput): AnnualLeavePayResult {
  // 1일 통상임금·미사용 일수 모두 유한한 0 이상 값으로 정규화한다.
  const dailyWage = toSafeNonNegative(input.dailyWage)
  // ⚠️ 소수 연차일수(반차 0.5일 등)는 반올림·절사하지 않고 그대로 사용한다.
  //    현행법상 1일 미만 단위 부여를 강제하는 규정이 없어 임의 정수화의 근거가 없다.
  const unusedDays = toSafeNonNegative(input.unusedDays)

  // 정규화 후에도 두 값의 곱이 표현 범위를 넘지 않도록 최종 결과를 한 번 더 제한한다.
  const rawPay = floorWithFloatTolerance(dailyWage * unusedDays)
  const annualLeavePay = Number.isFinite(rawPay)
    ? Math.min(rawPay, Number.MAX_SAFE_INTEGER)
    : 0

  return {
    annualLeavePay,
    perDayAmount: dailyWage,
  }
}

// ── 연차 발생일수 계산 ────────────────────────────────────────
// 근로기준법 제60조 (정책 상수는 src/lib/policy/annualLeave.ts 단일 출처)
//  ① 1년간 80% 이상 출근 → 15일
//  ② 계속근로 1년 미만 또는 출근율 80% 미만 → 1개월 개근 시 1일
//  ④ 3년 이상 계속근로 시 최초 1년을 초과하는 계속 근로연수 매 2년에 대하여 1일 가산,
//     가산휴가를 포함한 총 휴가 일수는 25일 한도
// 이 두 상수는 정책 파일로 옮기기 전부터 calculators.ts의 공개 API였으므로
// 기존 호출부 호환을 위해 재export를 유지한다. 신규 상수는 정책 파일에서 직접 import할 것.
export { ANNUAL_LEAVE_BASE_DAYS, ANNUAL_LEAVE_MAX_DAYS }

/**
 * 근로기준법 제60조 제2항: 1년 미만 근로자의 연차일수.
 * 1개월 개근 시 1일, 최대 11일.
 */
export function calculateSubOneYearLeaveDays(fullAttendanceMonths: number): number {
  if (!Number.isFinite(fullAttendanceMonths)) return 0
  const months = Math.floor(fullAttendanceMonths)
  if (months < 1) return 0
  return Math.min(months * SUB_ONE_YEAR_MONTHLY_DAYS, SUB_ONE_YEAR_MAX_DAYS)
}

/**
 * 근로기준법 제60조 제1항·제4항: 366일째에도 근로관계가 유지되는 근로자의
 * 해당 연차연도 발생일수.
 *
 * 근속연수를 숫자로 직접 입력받으므로 NaN·Infinity·음수·소수를 함수 진입 시점에서
 * 정규화한다.
 */
export function calculateAnnualLeaveDays(workingYears: number): number {
  if (!Number.isFinite(workingYears)) return 0
  const years = Math.floor(workingYears)
  if (years < 1) return 0
  const extra = Math.floor((years - 1) / ADDITIONAL_LEAVE_INTERVAL_YEARS)
  return Math.min(ANNUAL_LEAVE_BASE_DAYS + extra, ANNUAL_LEAVE_MAX_DAYS)
}

// ── 법정 연차일수 참고값 (수당 계산과 분리된 "참고 기준") ──────
export type AnnualLeaveTenure =
  | { category: Extract<AnnualLeaveTenureCategory, 'under1'>; fullAttendanceMonths: number }
  | { category: Extract<AnnualLeaveTenureCategory, 'exact1'> }
  | { category: Extract<AnnualLeaveTenureCategory, 'over1'>; workingYears: number }

export interface StatutoryLeaveReference {
  /** 해당 연차연도에 발생하는 법정 연차일수 (화면에 "법정 발생일수"로 표시하는 값) */
  annualGrantDays: number
  /**
   * 초과 입력 확인 안내를 띄우는 임계값.
   *
   * ⚠️ 법적 상한이 아니다. 근로기준법에는 정산 대상 연차일수의 상한이 없다
   *    (약정휴가·이월 연차·회계연도 운영으로 얼마든지 초과 가능).
   *    이 값은 "이 정도를 넘으면 입력 실수일 가능성이 높다"는 UI 임계값이며,
   *    수당 계산을 제한하지 않는다.
   *
   * 산정 근거: 제60조 제7항(휴가는 1년간 행사하지 아니하면 소멸)에 따라 통상
   * 동시에 남아 있을 수 있는 최대치는 "이번 연차연도 발생분 + 직전 연차연도 발생분"이다.
   * 1년 차는 직전 연도가 1년 미만 기간이므로 제2항의 최대 11일을 더한다.
   * 임계값은 근속연수에 대해 단조 증가해야 한다(2년 차가 1년 차보다 낮아지면
   * 이월분이 있는 사용자에게 경고가 상시 노출되어 경고가 무의미해진다).
   */
  warningThresholdDays: number
  /** 근거 요약 (화면 안내 문구용) */
  basis: string
}

/**
 * 근속 구분별 법정 연차일수 참고값.
 *
 * 대법원 2021.10.14. 선고 2021다227100 판결 및 고용노동부 행정해석 변경
 * (2021.12.16)에 따라, 제60조 제1항의 15일은 "1년간의 근로를 마친 다음 날"에
 * 근로관계가 존속해야 발생한다. 따라서 365일 근무 후 퇴직(exact1)과
 * 366일째 근로관계 유지(over1)를 분리한다.
 */
export function getStatutoryLeaveReference(tenure: AnnualLeaveTenure): StatutoryLeaveReference {
  switch (tenure.category) {
    case 'under1': {
      const days = calculateSubOneYearLeaveDays(tenure.fullAttendanceMonths)
      return {
        annualGrantDays: days,
        warningThresholdDays: SUB_ONE_YEAR_MAX_DAYS,
        basis: '근로기준법 제60조 제2항 (1개월 개근 시 1일, 최대 11일)',
      }
    }

    case 'exact1':
      // 365일을 채우고 퇴직하면 제60조 제1항의 15일은 발생하지 않는다.
      return {
        annualGrantDays: SUB_ONE_YEAR_MAX_DAYS,
        warningThresholdDays: SUB_ONE_YEAR_MAX_DAYS,
        basis: '근로기준법 제60조 제2항 · 대법원 2021다227100 (1년 근무 후 퇴직 시 최대 11일)',
      }

    case 'over1': {
      const annualGrantDays = calculateAnnualLeaveDays(tenure.workingYears)
      const years = Number.isFinite(tenure.workingYears) ? Math.floor(tenure.workingYears) : 0
      // 직전 연차연도 발생분: 1년 차는 1년 미만 기간(제2항 최대 11일), 그 이후는 전년도 법정일수.
      const previousPeriodDays =
        years <= 1 ? SUB_ONE_YEAR_MAX_DAYS : calculateAnnualLeaveDays(years - 1)
      return {
        annualGrantDays,
        warningThresholdDays: annualGrantDays > 0 ? annualGrantDays + previousPeriodDays : 0,
        basis:
          years === 1
            ? '근로기준법 제60조 제1항 15일 + 제2항 미사용분 최대 11일'
            : '근로기준법 제60조 제1항·제4항 (15일 + 매 2년 1일 가산, 25일 한도) + 직전 연차연도 미사용분',
      }
    }

    default: {
      // 근속 구분이 추가되면 컴파일 단계에서 잡히도록 한다.
      const exhaustive: never = tenure
      return exhaustive
    }
  }
}

/**
 * 입력한 미사용 연차일수가 확인 안내 임계값을 넘는지.
 * ⚠️ 이 판정은 계산을 막지 않는다. 화면에 확인 안내를 띄울지만 결정한다.
 */
export function exceedsWarningThreshold(
  unusedDays: number,
  reference: StatutoryLeaveReference,
): boolean {
  if (!Number.isFinite(unusedDays) || unusedDays <= 0) return false
  return unusedDays > reference.warningThresholdDays
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
