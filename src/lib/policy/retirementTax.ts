/** 일반 근로자·단일 퇴직만 검증. 근거/제외 조건: docs/retirement-income-tax.md */
export const RETIREMENT_TAX_YEAR = 2026

export function assertRetirementTaxPolicyYear(year: number): void {
  if (year !== RETIREMENT_TAX_YEAR) {
    throw new RangeError('퇴직소득세 정책과 공식 예제를 갱신한 뒤 기준연도를 변경하세요.')
  }
}

// [구간 상한, 세율(%), 누진공제(원)]. Number 연산으로 세액을 계산하지 않는다.
export const RETIREMENT_BASIC_TAX_BRACKETS = [
  [14_000_000, 6, 0],
  [50_000_000, 15, 1_260_000],
  [88_000_000, 24, 5_760_000],
  [150_000_000, 35, 15_440_000],
  [300_000_000, 38, 19_940_000],
  [500_000_000, 40, 25_940_000],
  [1_000_000_000, 42, 35_940_000],
  [Number.MAX_SAFE_INTEGER, 45, 65_940_000],
] as const
