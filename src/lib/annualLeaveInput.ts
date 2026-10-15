import { formatAmountInput as formatMoney, parseAmountInput as parseMoney } from './amountInput'
// src/lib/annualLeaveInput.ts
// ────────────────────────────────────────────────────────────
// 연차수당 계산기의 입력 정규화 로직.
//
// 페이지 컴포넌트('use client')에 두면 단위 테스트가 불가능하므로 분리했습니다.
// 화면에서 값이 계산 함수에 닿기 전 거치는 모든 변환이 여기 모여 있습니다.
// ────────────────────────────────────────────────────────────

import type { AnnualLeaveTenure } from './calculators'
import {
  MIN_WORKING_YEARS,
  MAX_WORKING_YEARS,
  MIN_FULL_ATTENDANCE_MONTHS,
  MAX_FULL_ATTENDANCE_MONTHS,
  type AnnualLeaveTenureCategory,
} from './policy/annualLeave'

/**
 * 비현실적 입력 상한.
 *
 * ⚠️ 법정 연차일수와 무관한 "입력 실수 방지" 가드입니다. 법정 상한(25일)이나
 *    약정휴가·이월분을 자르지 않습니다(9,999일까지 허용).
 *
 * 이 상한이 필요한 이유: 상한이 없으면 1일 통상임금 × 미사용일수가
 * Number.MAX_SAFE_INTEGER를 넘어 계산 함수 내부에서 조용히 클램프되고,
 * 그 결과 화면에 표시된 "1일 통상임금 × 일수"와 "합계"가 서로 맞지 않게 됩니다.
 * 두 상한의 곱(1e9 × 9,999 ≒ 1e13)은 MAX_SAFE_INTEGER(약 9e15)보다 훨씬 작습니다.
 */
export const MAX_AMOUNT_INPUT = 1_000_000_000 // 10억원
export const MAX_UNUSED_DAYS_INPUT = 9_999

/**
 * 미사용 연차일수 입력 문자열 정규화.
 *
 * 반차(0.5일)·반반차(0.25일) 등 소수를 허용하되 자릿수는 절사하지 않는다
 * (현행법상 1일 미만 단위를 강제하는 규정이 없어 임의 반올림의 근거가 없음).
 *
 * ⚠️ 구분자가 두 번 이상 나오면 뒤를 이어붙이지 않고 **버린다.**
 *    "1.2.3"을 1.23으로 이어붙이면 붙여넣기한 값의 크기가 조용히 바뀐다.
 */
export function sanitizeDaysInput(v: string): string {
  // 잘못된 부호·구분자·지수 표기를 다른 수로 바꾸지 않고 화면에 남긴다.
  const normalized = v.replace(/,/g, '').trim()
  if (!/^\d*\.?\d*$/.test(normalized)) return v
  const n = Number(normalized)
  return Number.isFinite(n) && n > MAX_UNUSED_DAYS_INPUT ? String(MAX_UNUSED_DAYS_INPUT) : normalized
}

export function parseDays(v: string): number {
  const raw = sanitizeDaysInput(v)
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw)) return 0
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** 정수 입력용: 소수점 이하와 숫자가 아닌 문자를 제거한다. */
export function sanitizeIntegerInput(v: string): string {
  return v.split('.')[0].replace(/[^0-9]/g, '')
}

/** 근속연수: 1~50년 정수로 클램프. */
export function normalizeWorkingYears(v: string): number {
  const n = Number(sanitizeIntegerInput(v))
  if (!Number.isFinite(n)) return MIN_WORKING_YEARS
  const years = Math.floor(n)
  if (years < MIN_WORKING_YEARS) return MIN_WORKING_YEARS
  return Math.min(years, MAX_WORKING_YEARS)
}

/** 개근 월수: 0~11개월 정수로 클램프. */
export function normalizeMonths(v: string): number {
  const n = Number(sanitizeIntegerInput(v))
  if (!Number.isFinite(n) || n < MIN_FULL_ATTENDANCE_MONTHS) return MIN_FULL_ATTENDANCE_MONTHS
  return Math.min(Math.floor(n), MAX_FULL_ATTENDANCE_MONTHS)
}

/** 금액 입력: 숫자만 남기고 천 단위 구분자를 붙인다. */
export function formatAmountInput(v: string): string { return formatMoney(v, MAX_AMOUNT_INPUT) }
export function parseAmount(v: string): number { return parseMoney(v, MAX_AMOUNT_INPUT) }

/** 화면 상태(근속 구분 + 조건별 입력)를 계산 함수용 판별 유니온으로 변환. */
export function buildTenure(
  category: AnnualLeaveTenureCategory,
  workingYears: number,
  fullAttendanceMonths: number,
): AnnualLeaveTenure {
  switch (category) {
    case 'under1':
      return { category: 'under1', fullAttendanceMonths }
    case 'exact1':
      return { category: 'exact1' }
    case 'over1':
      return { category: 'over1', workingYears }
    default: {
      // 근속 구분이 추가되면 컴파일 단계에서 잡히도록 한다.
      const exhaustive: never = category
      return exhaustive
    }
  }
}
