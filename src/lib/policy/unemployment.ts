/** 일반 근로자 구직급여. 확정·검증한 이직일 구간만 계산한다. */
export const UNEMPLOYMENT_PERIODS = [
  { start: '2026-01-01', endExclusive: '2027-01-01', hourlyMinimum: 10320, dailyMaximum: 68100 },
] as const

// 근거와 미확인 범위: docs/unemployment-policy.md
export function getUnemploymentPolicy(separationDate: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(separationDate)) {
    throw new RangeError('이직확인서의 이직일을 입력해 주세요.')
  }
  const date = new Date(`${separationDate}T00:00:00Z`)
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== separationDate) {
    throw new RangeError('올바른 이직일을 입력해 주세요.')
  }
  const period = UNEMPLOYMENT_PERIODS.find(p => separationDate >= p.start && separationDate < p.endExclusive)
  if (!period) {
    throw new RangeError(separationDate.startsWith('2027-')
      ? '2027년 상한 확정 여부 미확인으로 계산을 보류합니다. 공식 기준 확인 후 제공하겠습니다.'
      : '해당 이직일의 실업급여 기준은 아직 지원하지 않습니다.')
  }
  return period
}

export function getUnemploymentLimits(separationDate: string, dailyHours: number) {
  const policy = getUnemploymentPolicy(separationDate)
  if (!Number.isFinite(dailyHours) || dailyHours <= 0 || dailyHours > 24) {
    throw new RangeError('이직 전 1일 평균 소정근로시간을 0 초과 24 이하로 입력해 주세요.')
  }
  // 예규 제221호 제3조: 소수 시간 올림, 최대 8시간. 과거 4시간 하한은 적용하지 않는다.
  const appliedHours = Math.min(Math.ceil(dailyHours), 8)
  const minDailyBenefit = policy.hourlyMinimum * appliedHours * 4 / 5
  if (minDailyBenefit > policy.dailyMaximum) {
    throw new RangeError('실업급여 상·하한 기준을 다시 확인해야 하므로 계산을 보류합니다.')
  }
  return { minDailyBenefit, maxDailyBenefit: policy.dailyMaximum, appliedHours, hourlyMinimum: policy.hourlyMinimum }
}

/** TAX_YEAR만 올리고 실업급여 기준을 빠뜨리는 배포를 차단한다. */
export function assertUnemploymentPolicyYear(year: number): void {
  for (const date of [`${year}-01-01`, `${year}-12-31`]) getUnemploymentLimits(date, 8)
}
