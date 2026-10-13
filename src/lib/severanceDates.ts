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

/**
 * 평균임금의 직전 3개월. 고용노동부 계산기 실행값·공개 코드 대조(2026-10-14).
 * 3개월 전이 2월이고 대응일이 없으면 3월 1일부터 센다.
 * 다른 월은 해당 월 말일로 보정한다(예: 12/31 퇴직 → 9/30 시작).
 * 출처: https://1350.moel.go.kr/home/hp/retirementpaycal/js/retire_cal.js
 * endDate는 재직기간에서 제외되는 퇴직일이다.
 */
export function getAverageWagePeriod(endDate: string) {
  const end = parseCalendarDate(endDate)
  if (end === null) return null

  const start = new Date(end)
  start.setUTCDate(1)
  start.setUTCMonth(start.getUTCMonth() - 3)
  const monthEnd = new Date(start)
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1)
  monthEnd.setUTCDate(0)
  const targetDay = end.getUTCDate()
  if (start.getUTCMonth() === 1 && targetDay > monthEnd.getUTCDate()) {
    start.setUTCMonth(start.getUTCMonth() + 1)
  } else {
    start.setUTCDate(Math.min(targetDay, monthEnd.getUTCDate()))
  }

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate,
    days: Math.round((end.getTime() - start.getTime()) / DAY_MS),
  }
}
