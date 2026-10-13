/** 계산기·정적 페이지·빌드 검사가 공유하는 정책 기준. */
export const TAX_YEAR = 2026
export const TAX_YEAR_AS_OF = new Date(`${TAX_YEAR}-12-31T12:00:00+09:00`)
export const TAX_YEAR_AS_OF_LABEL = `${TAX_YEAR}년 12월 31일 기준`

const koreanYearFormatter = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Seoul', year: 'numeric' })
const yearStart = new Date(`${TAX_YEAR}-01-01T00:00:00+09:00`).getTime()
const nextYearStart = new Date(`${TAX_YEAR + 1}-01-01T00:00:00+09:00`).getTime()

/** 한국시간 연도 경계를 서버 시간대와 무관하게 판단하며 포맷터를 재사용한다. */
export function getKoreanYear(date: Date): number {
  return Number(koreanYearFormatter.format(date))
}

/** 보험·세액표 전체가 준비된 연도에 한해 급여를 계산한다. */
export function assertCalculationDate(date: Date): void {
  const time = date.getTime()
  if (!(time >= yearStart && time < nextYearStart)) {
    throw new RangeError(`${TAX_YEAR}년 정책 데이터로만 계산할 수 있습니다. 기준일과 정책 데이터를 확인해 주세요.`)
  }
}

/** 오래된 정책으로 새 배포하는 것을 막는다. */
export function assertPolicyFresh(now: Date = new Date()): void {
  if (getKoreanYear(now) > TAX_YEAR) {
    throw new Error(`계산 정책 갱신 필요: 현재 한국시간 연도가 TAX_YEAR(${TAX_YEAR})보다 큽니다. 세액표·보험 요율·상하한을 검토하고 기준연도를 갱신하세요.`)
  }
}
