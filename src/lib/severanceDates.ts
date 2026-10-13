const DAY_MS = 24 * 60 * 60 * 1000

/** Parse calendar dates in UTC so daylight-saving changes do not affect service days. */
function parseCalendarDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
    ? date
    : null
}

/** 고용노동부 계산기 기준: 퇴직일은 마지막 근무일의 다음 날(재직기간에 미포함). */
export function getRetirementDate(lastWorkingDate: string): string | null {
  const date = parseCalendarDate(lastWorkingDate)
  if (date === null) return null
  date.setUTCDate(date.getUTCDate() + 1)
  const retirementDate = date.toISOString().slice(0, 10)
  return parseCalendarDate(retirementDate) === null ? null : retirementDate
}

/**
 * 입사일은 포함하고 퇴직일은 제외한다. 지급 요건의 1년은 민법 제160조에 따라
 * 달력으로 판정한다. 금액 산식의 재직일수/365와 지급 요건은 별개다.
 * 2월 29일 입사 시 다음 해 2월 말일까지 근로한 뒤 3월 1일부터 1년을 충족한다.
 */
export function getSeveranceTenure(startDate: string, retirementDate: string) {
  const start = parseCalendarDate(startDate)
  const end = parseCalendarDate(retirementDate)
  if (start === null || end === null || end <= start) {
    return { workingDays: 0, hasCompletedOneYear: false }
  }

  const anniversary = new Date(start)
  anniversary.setUTCFullYear(start.getUTCFullYear() + 1)

  return {
    workingDays: Math.round((end.getTime() - start.getTime()) / DAY_MS),
    hasCompletedOneYear: end >= anniversary,
  }
}
