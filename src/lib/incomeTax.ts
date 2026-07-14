// src/lib/incomeTax.ts
// ────────────────────────────────────────────────────────────
// 근로소득 간이세액표 (소득세법 시행령 별표2, 제189조제1항 관련) 구현
//
// v2: 월급여 770천원~10,000천원 구간은 공식 별표2 조견표(구간별 세액표)를
// src/lib/data/simplifiedTaxTable2026.ts에서 그대로 조회합니다. 연속 공식으로
// 근사하던 v1은 실제 표와 최대 1,500원 이상 차이가 나는 것으로 확인되어 (예:
// 월급여 2,830~2,840천원 구간 실제값 59,370원 vs 공식 근사치 57,850원) 폐기했습니다.
// 월급여 10,000천원(1천만원) 초과 구간은 별표2 원문에 명시된 고소득자 전용
// 계산식(아래 calcHighIncomeTax)을 그대로 구현했습니다 — 임의 외삽이 아닙니다.
//
// 전체 계산 흐름:
//   1) 월급여 ≤ 770천원: 0원 (표의 최저 구간보다 낮음)
//   2) 770천원 < 월급여 ≤ 10,000천원: SIMPLIFIED_TAX_TABLE_2026에서 구간·가족수로 조회
//   3) 월급여 > 10,000천원: calcHighIncomeTax()로 계산 (별표2 원문 고소득 산식)
//   4) 공제대상가족의 수가 11명 초과: 별표2 제4호 산식으로 외삽
//      (11명 세액 - (10명 세액-11명 세액) × 11명 초과 인원)
//   5) 8세 이상 20세 이하 자녀 세액공제: 월 세액에서 직접 차감. 시행일(2026.3.1)
//      기준으로 신/구 금액을 구분 적용 (별표2 제3호)
//
// 신구 별표 비교: 2024.2.29 개정본과 2026.2.27 개정본을 대조한 결과, 조견표
// 자체(항목 1·2·6)는 두 버전이 동일하고 항목 3(자녀세액공제 금액)만 개정되었습니다.
// 따라서 조견표 데이터는 하나만 두고, 자녀세액공제 금액만 시행일 기준으로 분기합니다.
//
// 출처: 소득세법 시행령 [별표 2] <개정 2026. 2. 27., 시행 2026. 3. 1.> /
//       <개정 2024. 2. 29.> (국가법령정보센터 원문 대조 완료)
//
// 남아있는 근사·미반영 요소:
//   - 원천징수의무자가 선택 가능한 80%/100%/120% 옵션 중 100%만 반영합니다.
//   - 학자금(별표2 제5호)은 별도 처리하지 않습니다(비과세 제외 후 금액을 그대로 사용).
//   - 연말정산 시 추가 반영되는 보험료·의료비·신용카드 등 실제 소득·세액공제는
//     반영하지 않습니다 (간이세액표 자체가 원천징수 단계용 근사이기 때문).
// ────────────────────────────────────────────────────────────

import {
  SIMPLIFIED_TAX_TABLE_2026,
  SIMPLIFIED_TAX_TABLE_2026_AT_10M,
} from './data/simplifiedTaxTable2026'

function floor10(n: number): number {
  return Math.floor(n / 10) * 10
}

// 별표2 제3호: 8세 이상 20세 이하 자녀 세액공제 금액 (시행일 기준 신/구 구분)
// 신(2026.3.1 이후 지급분 원천징수): 소득세법 시행령 [별표 2] <개정 2026. 2. 27.>
// 구(2026.2.28까지 지급분 원천징수): 소득세법 시행령 [별표 2] <개정 2024. 2. 29.>
const CHILD_CREDIT_SCHEDULE_CUTOVER = new Date('2026-03-01T00:00:00+09:00')
const CHILD_CREDIT_NEW = { one: 20_830, two: 45_830, perExtra: 33_330 }
const CHILD_CREDIT_OLD = { one: 12_500, two: 29_160, perExtra: 25_000 }

// ── 공제대상가족의 수가 11명을 초과하는 경우 (별표2 제4호) ─────────
// 가목(11명 세액) - 나목((10명 세액 - 11명 세액) × 11명을 초과하는 가족의 수)
function extrapolateOver11(values: readonly number[], familyCount: number): number {
  const v10 = values[9]
  const v11 = values[10]
  return Math.max(0, v11 - (v10 - v11) * (familyCount - 11))
}

function valuesForFamily(values: readonly number[], familyCount: number): number {
  const fc = Math.max(1, Math.floor(familyCount))
  if (fc <= 11) return values[fc - 1]
  return extrapolateOver11(values, fc)
}

// ── 월급여 770천원~10,000천원: 공식 조견표 조회 ──────────────────
function lookupTable(monthlyGrossWon: number, familyCount: number): number {
  const gThousand = monthlyGrossWon / 1000
  if (gThousand < 770) return 0

  // 646개 행 선형 탐색 (구간 폭이 5/10/20천원으로 일정하지 않아 이분탐색 대신 단순 탐색)
  for (const [min, max, values] of SIMPLIFIED_TAX_TABLE_2026) {
    if (gThousand >= min && gThousand < max) {
      return valuesForFamily(values, familyCount)
    }
  }
  // gThousand가 정확히 10,000(표의 마지막 미만 경계) 이상인 경우 10,000천원 행 사용
  return valuesForFamily(SIMPLIFIED_TAX_TABLE_2026_AT_10M, familyCount)
}

// ── 월급여 10,000천원(1천만원) 초과: 별표2 원문 고소득 산식 ────────
// (10,000천원인 경우의 해당세액) + 구간별 가산액 + 초과분×세율 (일부 구간은 ×98% 적용)
function calcHighIncomeTax(monthlyGrossWon: number, familyCount: number): number {
  const gThousand = monthlyGrossWon / 1000
  const base = valuesForFamily(SIMPLIFIED_TAX_TABLE_2026_AT_10M, familyCount)
  const excessWon = (gThousand - 10_000) * 1000 // 초과분 (원 단위)

  let tax: number
  if (gThousand <= 14_000) {
    tax = base + excessWon * 0.98 * 0.35 + 25_000
  } else if (gThousand <= 28_000) {
    tax = base + 1_397_000 + (gThousand - 14_000) * 1000 * 0.98 * 0.38
  } else if (gThousand <= 30_000) {
    tax = base + 6_610_600 + (gThousand - 28_000) * 1000 * 0.98 * 0.4
  } else if (gThousand <= 45_000) {
    tax = base + 7_394_600 + (gThousand - 30_000) * 1000 * 0.4
  } else if (gThousand <= 87_000) {
    tax = base + 13_394_600 + (gThousand - 45_000) * 1000 * 0.42
  } else {
    tax = base + 31_034_600 + (gThousand - 87_000) * 1000 * 0.45
  }
  return Math.max(0, floor10(tax))
}

// ── 8세 이상 20세 이하 자녀 세액공제 (시행일 기준 신/구 분기) ──────
function calcChildTaxCredit(childCount8to20: number, asOfDate: Date): number {
  const n = Math.max(0, Math.floor(childCount8to20))
  if (n <= 0) return 0
  const c = asOfDate >= CHILD_CREDIT_SCHEDULE_CUTOVER ? CHILD_CREDIT_NEW : CHILD_CREDIT_OLD
  if (n === 1) return c.one
  if (n === 2) return c.two
  return c.two + (n - 2) * c.perExtra
}

export interface SimplifiedWithholdingInput {
  /** 월 과세 급여 (비과세 제외, 원) */
  monthlyTaxable: number
  /** 공제대상가족 수 (본인 포함, 배우자도 1명으로 산정, 최소 1) */
  dependents: number
  /**
   * 공제대상가족 중 8세 이상 20세 이하 자녀 수 (기본값 0)
   * ⚠️ 부양가족 수(dependents)에는 본인이 포함되므로(별표2 제2호), 자녀 수는
   * 최대 dependents-1명입니다. 초과 입력 시 dependents-1로 클램프됩니다.
   */
  childCount8to20?: number
}

/**
 * 근로소득 간이세액표(소득세법 시행령 별표2) 조견표/고소득 산식을 그대로 적용한
 * 월 원천징수 소득세를 계산합니다. 반환값은 10원 단위로 절사된 월 세액(원)입니다.
 *
 * @param input 계산 입력값
 * @param asOfDate 원천징수 시점 (기본값: 호출 시점의 현재 날짜). 2026.3.1을 기준으로
 *   자녀세액공제 금액이 신/구로 나뉩니다. 조견표 자체는 신구 버전이 동일하여
 *   시점과 무관하게 SIMPLIFIED_TAX_TABLE_2026 하나만 사용합니다.
 */
export function calcSimplifiedWithholdingTax(
  input: SimplifiedWithholdingInput,
  asOfDate: Date = new Date(),
): number {
  const dependents = Math.max(1, Math.floor(input.dependents))
  // 부양가족 수(dependents)에는 본인이 포함되므로(별표2 제2호: 본인·배우자도 각각
  // 1명으로 산정), 자녀가 될 수 있는 인원은 최대 dependents-1명입니다.
  const maxEligibleChildren = Math.max(0, dependents - 1)
  const childCount8to20 = Math.min(
    Math.max(0, Math.floor(input.childCount8to20 ?? 0)),
    maxEligibleChildren,
  )
  const monthlyGrossWon = Math.max(0, input.monthlyTaxable)

  const beforeChildCredit =
    monthlyGrossWon / 1000 > 10_000
      ? calcHighIncomeTax(monthlyGrossWon, dependents)
      : lookupTable(monthlyGrossWon, dependents)

  const childCredit = calcChildTaxCredit(childCount8to20, asOfDate)
  return Math.max(0, beforeChildCredit - childCredit)
}
