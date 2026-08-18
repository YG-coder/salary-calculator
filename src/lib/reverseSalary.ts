// src/lib/reverseSalary.ts
// ────────────────────────────────────────────────────────────
// 목표 실수령액 역산: "이 실수령액을 받으려면 최소 얼마의 연봉이 필요한가"
//
// 목표를 만족하는 최소 연봉을 만원 단위 그리드에서 직접 찾는다. 간이세액표의
// 계단 구조 때문에 실수령액 함수가 일부 구간에서 비단조이므로, 단조성을 전제하는
// 이분탐색은 사용하지 않고 0원부터 선형 스캔하여 최초로 목표 이상이 되는 연봉을
// 반환한다.
//
// 절차:
//   1. 만원 그리드를 0부터 선형 스캔하여 net >= target인 최소 연봉을 찾는다.
//      net(gross)은 만원 그리드에서도 단조 비감소가 아니다(간이세액표 계단 함수
//      때문에 특정 경계에서 연봉이 올라도 실수령이 감소하는 지점이 있다 — 전수
//      스캔으로 확인). 그러나 "최초로 목표 이상이 되는 연봉"은 정의상 최소값이므로
//      비단조성과 무관하게 정확하며, 상한(연 5억, 월 실수령 약 2,400만원)까지도
//      수만 스텝이라 빠르다.
//   2. 그 연봉을 다시 calculateSalary()에 넣어 모든 결과를 재계산한다.
//      (화면의 모든 숫자가 하나의 연봉에서 나오도록 정합성을 맞춘다.)
// ────────────────────────────────────────────────────────────

import { calculateSalary, type SalaryInput, type SalaryResult } from './salary'

export interface ReverseSalaryInput {
  /** 목표 월 실수령액 (원) */
  targetMonthlyNet: number
  /** 월 비과세 금액 (원). SalaryInput과 동일 계약 */
  nonTaxable?: number
  /** 부양가족 수 (본인 포함). SalaryInput과 동일 계약 */
  dependents?: number
  /** 8세~20세 자녀 수 (선택). SalaryInput과 동일 계약 */
  childCount8to20?: number
}

export interface ReverseSalaryResult {
  /** 목표를 만족하는 최소 만원 단위 세전 연봉(원) */
  requiredAnnualSalary: number
  /** requiredAnnualSalary로 재계산한 전체 결과 (ResultCard에 그대로 전달) */
  result: SalaryResult
  /** 재계산된 월 실수령이 목표보다 얼마나 여유 있는지 (>= 0) */
  surplusMonthlyNet: number
  /** 이 연봉에서 세전 100만원(연) 더 받을 때 월 실수령 증가액 */
  marginalMonthlyNet: number
  /** 위와 동일, 연 실수령 증가액 */
  marginalAnnualNet: number
  /** 한계 실수령률 = 세전 증가분 대비 실수령 증가분 % */
  marginalRetentionRate: number
  /** 가장 가까운 /salary/[amount] 페이지의 연봉(만원). 보조 링크용 */
  nearestSalaryPageMan: number
  /** 목표가 계산 범위 안에서 도달 가능한지 */
  reachable: boolean
}

const HI_BOUND = 500_000_000 // 연 5억 (최소 입력 기준 월 실수령 약 2,400만원까지 도달 가능; 선형 스캔 상한)
const NEAREST_PAGE_STEP = 500 // /salary 페이지 간격 (만원)
const NEAREST_PAGE_MIN = 2000
const NEAREST_PAGE_MAX = 15000

function nearestSalaryPage(annualSalary: number): number {
  const man = annualSalary / 10_000
  const snapped = Math.round(man / NEAREST_PAGE_STEP) * NEAREST_PAGE_STEP
  return Math.min(NEAREST_PAGE_MAX, Math.max(NEAREST_PAGE_MIN, snapped))
}

export function calculateReverseSalary(
  input: ReverseSalaryInput,
  asOfDate: Date = new Date(),
): ReverseSalaryResult {
  const nonTaxable = input.nonTaxable ?? 0
  const dependents = input.dependents ?? 1
  const childCount8to20 = input.childCount8to20 ?? 0
  const target = input.targetMonthlyNet

  const baseInput = (annualSalary: number): SalaryInput => ({
    annualSalary,
    nonTaxable,
    dependents,
    childCount8to20,
  })
  const netOf = (annualSalary: number) =>
    calculateSalary(baseInput(annualSalary), asOfDate).monthlyNet

  // 도달 불가 (상한에서도 목표 미달) → reachable=false로 상한 결과 반환
  if (target <= 0 || netOf(HI_BOUND) < target) {
    const capped = calculateSalary(baseInput(HI_BOUND), asOfDate)
    return {
      requiredAnnualSalary: HI_BOUND,
      result: capped,
      surplusMonthlyNet: capped.monthlyNet - target,
      marginalMonthlyNet: 0,
      marginalAnnualNet: 0,
      marginalRetentionRate: 0,
      nearestSalaryPageMan: NEAREST_PAGE_MAX,
      reachable: false,
    }
  }

  // 만원 그리드를 0부터 선형 스캔하여 net >= target인 최소 연봉을 찾는다.
  //
  // ⚠️ net(gross)은 만원 그리드에서도 단조 비감소가 아니다. 간이세액표가 계단
  // 함수라 특정 경계에서 세액이 급증해 연봉이 올라도 실수령이 감소하는 지점이
  // 있다(전수 스캔 확인: 예) 부양 3명 7,008만원에서 net -30,556원). 따라서
  // 단조성을 전제하는 이분탐색은 부적합하며, 선형 스캔으로 "목표 이상을 만족하는
  // 최소 연봉"을 정확히 찾는다(정의상 최소값이므로 비단조성과 무관하게 정확).
  const GRID = 10_000
  let requiredAnnualSalary = -1
  for (let g = 0; g <= HI_BOUND; g += GRID) {
    if (netOf(g) >= target) {
      requiredAnnualSalary = g
      break
    }
  }
  // 상한까지 못 찾으면 도달 불가 (위의 사전 검사로 대부분 걸러지나 방어적으로 유지)
  if (requiredAnnualSalary < 0) {
    const capped = calculateSalary(baseInput(HI_BOUND), asOfDate)
    return {
      requiredAnnualSalary: HI_BOUND,
      result: capped,
      surplusMonthlyNet: capped.monthlyNet - target,
      marginalMonthlyNet: 0,
      marginalAnnualNet: 0,
      marginalRetentionRate: 0,
      nearestSalaryPageMan: NEAREST_PAGE_MAX,
      reachable: false,
    }
  }

  // 표시용 연봉으로 전체 재계산 (모든 화면 숫자의 단일 출처)
  const result = calculateSalary(baseInput(requiredAnnualSalary), asOfDate)

  // 세전 100만원(연) 추가 시 한계 실수령
  const plus = calculateSalary(
    baseInput(requiredAnnualSalary + 1_000_000),
    asOfDate,
  )
  const marginalMonthlyNet = plus.monthlyNet - result.monthlyNet
  const marginalAnnualNet = plus.annualNet - result.annualNet
  const marginalRetentionRate = Number(
    ((marginalAnnualNet / 1_000_000) * 100).toFixed(1),
  )

  return {
    requiredAnnualSalary,
    result,
    surplusMonthlyNet: result.monthlyNet - target,
    marginalMonthlyNet,
    marginalAnnualNet,
    marginalRetentionRate,
    nearestSalaryPageMan: nearestSalaryPage(requiredAnnualSalary),
    reachable: true,
  }
}
