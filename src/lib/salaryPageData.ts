// src/lib/salaryPageData.ts
// ────────────────────────────────────────────────────────────
// 연봉별 실수령액 페이지(/salary/[amount])의 "그 연봉에서만 참인" 데이터를
// 계산 엔진 출력으로부터 생성합니다.
//
// 설계 원칙 (2026-08 확정):
//   1. 인위적 연봉 구간을 만들지 않는다. 27개 페이지 각각을 그 연봉의 실제
//      계산 숫자로 차별화한다.
//   2. 이벤트(상한 도달, 고소득 산식 진입)는 엔진이 실제로 그 임계점을 넘었을
//      때만, 그리고 "엔진이 실제로 계산한 사실"만 노출한다. 근사(approx) 값은
//      쓰지 않는다 — 계산기의 강점은 정확성이므로 근사 표기는 신뢰를 해친다.
//   3. 문장보다 숫자가 먼저다. 각 이벤트/섹션은 질문 → 원인 → 이 연봉의 숫자
//      순서로 사용자의 궁금증을 계산 결과로 해소한다.
//
// 엔진/표시 모델 분리:
//   엔진(SalaryResult)은 최소 정보 + 판정 플래그만 반환한다. 월 과세소득 등
//   표시용 파생값은 이 모듈에서 다시 계산한다. (이 페이지들은 비과세 0 조건이라
//   월 과세소득 = 월 세전이다.)
// ────────────────────────────────────────────────────────────

import { RATES, getPensionLimits } from './constants'
import { HIGH_INCOME_MONTHLY_THRESHOLD } from './incomeTax'
import { calculateSalary, type SalaryResult } from './salary'

/** 연봉별 정적 페이지가 생성되는 범위 (만원 단위). page.tsx와 공유합니다. */
export const SALARY_MIN_MAN = 2000
export const SALARY_MAX_MAN = 15000
export const SALARY_STEP_MAN = 500

export const SALARY_AMOUNTS_MAN: number[] = Array.from(
  { length: Math.floor((SALARY_MAX_MAN - SALARY_MIN_MAN) / SALARY_STEP_MAN) + 1 },
  (_, i) => SALARY_MIN_MAN + i * SALARY_STEP_MAN,
)

export function isValidSalaryMan(amountMan: number): boolean {
  return (
    Number.isInteger(amountMan) &&
    amountMan >= SALARY_MIN_MAN &&
    amountMan <= SALARY_MAX_MAN &&
    amountMan % SALARY_STEP_MAN === 0
  )
}

function floor10(n: number): number {
  return Math.floor(n / 10) * 10
}

function won(n: number): string {
  return n.toLocaleString('ko-KR') + '원'
}

function manLabel(man: number): string {
  return `${man.toLocaleString('ko-KR')}만원`
}

function pct(part: number, whole: number, digits = 1): number {
  if (whole <= 0) return 0
  return Number(((part / whole) * 100).toFixed(digits))
}

// ── 이벤트 (질문 → 원인 → 이 연봉의 숫자) ─────────────────────────
// 모든 이벤트는 이 계산에서 엔진이 실제로 수행한 사실만 담는다.
export type SalaryEventKind = 'pensionCap' | 'highIncomeFormula'

export interface SalaryEvent {
  kind: SalaryEventKind
  /** 이 연봉에서 처음으로 이 임계점을 넘었는지 (직전 단계 대비 새로 발생) */
  isEntry: boolean
  /** 사용자가 실제로 궁금해하는 질문 */
  question: string
  /** 원인 + 이 연봉의 숫자로 이어지는 답 */
  answer: string
  /** 한 걸음 더 들어간 숫자 설명 */
  detail: string
}

// ── 기본 차별화 지표 ─────────────────────────────────────────────
export interface SalaryMetrics {
  annualSalary: number
  monthlyGross: number
  monthlyTaxable: number
  monthlyNet: number
  annualNet: number
  annualDeduction: number
  /** 실효 공제율 (연 총공제 / 연봉) % */
  effectiveDeductionRate: number
  /** 월 실수령률 (월 실수령 / 월 세전) % */
  monthlyNetRate: number

  /** 직전 단계 대비 연봉 증분 (만원). 최저 구간이면 null */
  prevStepMan: number | null
  /** 직전 단계 대비 월 실수령 증가액. 최저 구간이면 null */
  prevMonthlyNetDelta: number | null
  /** 직전 단계 대비 연 실수령 증가액. 최저 구간이면 null */
  prevAnnualNetDelta: number | null

  /** 세전 100만원(연) 추가 시 실제 늘어나는 연 실수령액 (한계 실수령) */
  marginalNetPerMillion: number
  /** 한계 실수령률 = marginalNetPerMillion / 1,000,000 % */
  marginalRetentionRate: number

  /** 비과세 식대 월 20만원 적용 시 월 실수령 증가액 */
  mealAllowanceDelta: number
}

export interface SalaryPageData {
  amountMan: number
  annualSalary: number
  result: SalaryResult
  metrics: SalaryMetrics
  events: SalaryEvent[]
  prevAmountMan: number | null
  nextAmountMan: number | null
}

/**
 * 연봉(만원)에 대한 페이지 데이터를 생성합니다.
 * @param amountMan 연봉 (만원)
 * @param asOfDate 계산 기준일 (국민연금 상·하한/자녀세액공제 시행일 분기에 사용)
 */
export function buildSalaryPageData(
  amountMan: number,
  asOfDate: Date = new Date(),
): SalaryPageData {
  const annualSalary = amountMan * 10_000

  const result = calculateSalary({ annualSalary, nonTaxable: 0, dependents: 1 }, asOfDate)

  // 표시용 월 과세소득: 이 페이지들은 비과세 0이므로 월 세전과 같다.
  const monthlyTaxable = result.monthlyGross

  // 직전/다음 단계
  const prevAmountMan = isValidSalaryMan(amountMan - SALARY_STEP_MAN)
    ? amountMan - SALARY_STEP_MAN
    : null
  const nextAmountMan = isValidSalaryMan(amountMan + SALARY_STEP_MAN)
    ? amountMan + SALARY_STEP_MAN
    : null

  const prevResult =
    prevAmountMan !== null
      ? calculateSalary(
          { annualSalary: prevAmountMan * 10_000, nonTaxable: 0, dependents: 1 },
          asOfDate,
        )
      : null

  // 세전 100만원(연) 추가 시 한계 실수령
  const plusResult = calculateSalary(
    { annualSalary: annualSalary + 1_000_000, nonTaxable: 0, dependents: 1 },
    asOfDate,
  )
  const marginalNetPerMillion = plusResult.annualNet - result.annualNet

  // 비과세 식대 월 20만원 효과
  const mealResult = calculateSalary(
    { annualSalary, nonTaxable: 200_000, dependents: 1 },
    asOfDate,
  )
  const mealAllowanceDelta = mealResult.monthlyNet - result.monthlyNet

  // 직전 단계 증분은 실제 두 페이지의 차이로 계산 (스텝 값 하드코딩 없음)
  const prevStepMan = prevAmountMan !== null ? amountMan - prevAmountMan : null

  const metrics: SalaryMetrics = {
    annualSalary,
    monthlyGross: result.monthlyGross,
    monthlyTaxable,
    monthlyNet: result.monthlyNet,
    annualNet: result.annualNet,
    annualDeduction: result.annualDeduction,
    effectiveDeductionRate: pct(result.annualDeduction, annualSalary),
    monthlyNetRate: pct(result.monthlyNet, result.monthlyGross),
    prevStepMan,
    prevMonthlyNetDelta:
      prevResult !== null ? result.monthlyNet - prevResult.monthlyNet : null,
    prevAnnualNetDelta:
      prevResult !== null ? result.annualNet - prevResult.annualNet : null,
    marginalNetPerMillion,
    marginalRetentionRate: pct(marginalNetPerMillion, 1_000_000),
    mealAllowanceDelta,
  }

  const events: SalaryEvent[] = []

  // ── 이벤트 1: 국민연금 상한 도달 ─────────────────────────────────
  if (result.flags.pensionCapped) {
    const pensionMax = getPensionLimits(asOfDate).max
    const cappedPension = result.breakdown.nationalPension
    const uncappedPension = floor10(monthlyTaxable * RATES.nationalPension)
    const monthlyDifference = uncappedPension - cappedPension
    const isEntry = prevResult !== null && !prevResult.flags.pensionCapped

    events.push({
      kind: 'pensionCap',
      isEntry,
      question: isEntry
        ? '이 연봉부터 국민연금이 왜 더 늘지 않나요?'
        : '연봉이 올라도 국민연금은 왜 그대로인가요?',
      answer: isEntry
        ? `국민연금에 기준소득월액 상한이 있기 때문입니다. 이 연봉의 월 과세소득 ${won(
            monthlyTaxable,
          )}은 상한 ${won(
            pensionMax,
          )}을 넘어서, 국민연금 본인부담이 상한 기준 월 ${won(
            cappedPension,
          )}으로 고정됩니다. 직전 단계(연봉 ${manLabel(
            prevAmountMan ?? 0,
          )})까지는 소득에 비례해 늘었지만, 이 연봉부터는 늘지 않습니다.`
        : `기준소득월액 상한 때문입니다. 이 연봉의 월 과세소득 ${won(
            monthlyTaxable,
          )}은 상한 ${won(
            pensionMax,
          )}을 넘어, 국민연금은 상한 기준 월 ${won(
            cappedPension,
          )}으로 고정됩니다. 연봉이 더 올라도 이 금액은 늘지 않습니다.`,
      detail: `월 과세소득 전체에 국민연금 요율(${+(RATES.nationalPension * 100).toFixed(3)}%)을 그대로 적용하면 월 ${won(
        uncappedPension,
      )}이지만, 기준소득월액 상한이 적용되어 실제 국민연금 본인부담은 월 ${won(
        cappedPension,
      )}입니다. 두 금액의 차이는 월 ${won(monthlyDifference)}입니다.`,
    })
  }

  // ── 이벤트 2: 고소득 간이세액 산식 진입 ──────────────────────────
  if (result.flags.usedHighIncomeTaxFormula) {
    const isEntry =
      prevResult !== null && !prevResult.flags.usedHighIncomeTaxFormula

    events.push({
      kind: 'highIncomeFormula',
      isEntry,
      question: isEntry
        ? '이 연봉의 소득세는 왜 간이세액표에 안 나오나요?'
        : '이 연봉의 소득세는 어떻게 계산되나요?',
      answer: isEntry
        ? `월 과세소득이 조견표 상한을 넘기 때문입니다. 이 연봉의 월 과세소득 ${won(
            monthlyTaxable,
          )}은 국세청 간이세액표 조견표 상한(월 ${won(
            HIGH_INCOME_MONTHLY_THRESHOLD,
          )})을 초과해, 이 구간의 월 소득세 ${won(
            result.breakdown.incomeTax,
          )}은 소득세법 시행령 별표2 원문의 고소득자 전용 산식으로 계산됩니다.`
        : `월 과세소득 ${won(
            monthlyTaxable,
          )}이 간이세액표 조견표 상한(월 ${won(
            HIGH_INCOME_MONTHLY_THRESHOLD,
          )})을 넘으므로, 월 소득세 ${won(
            result.breakdown.incomeTax,
          )}은 별표2 원문의 고소득자 전용 산식으로 계산됩니다.`,
      detail: isEntry
        ? '직전 단계까지는 조견표에서 세액을 그대로 조회했지만, 이 연봉부터는 별도 산식이 적용됩니다. 임의 외삽이 아니라 별표2에 명시된 계산식입니다.'
        : '조견표는 월급여 1천만원까지만 제공되므로, 이를 넘는 구간은 별표2에 명시된 고소득 산식을 그대로 적용합니다.',
    })
  }

  return {
    amountMan,
    annualSalary,
    result,
    metrics,
    events,
    prevAmountMan,
    nextAmountMan,
  }
}
