import { TAX_YEAR_AS_OF } from '../policyYear'

export interface LongTermCareRatePeriod {
  startDate: string
  endExclusive: string
  incomeRatePerMillion: number
  healthRatePer10000: number
  healthPremiumNumerator: number
  healthPremiumDenominator: number
  source: string
}

/** 2026년 계산은 기존 비율을 보존한다. 2027년은 복지부 의결 자료의 건보료 대비 13.90%를 사용한다. */
export const LONG_TERM_CARE_RATE_PERIODS: readonly LongTermCareRatePeriod[] = [
  {
    startDate: '2026-01-01T00:00:00+09:00', endExclusive: '2027-01-01T00:00:00+09:00',
    incomeRatePerMillion: 9448, healthRatePer10000: 719,
    healthPremiumNumerator: 9448, healthPremiumDenominator: 71900,
    source: 'https://edi.nhis.or.kr/portal/images/popup/20251204_pop01longdesc.html',
  },
  {
    startDate: '2027-01-01T00:00:00+09:00', endExclusive: '2028-01-01T00:00:00+09:00',
    incomeRatePerMillion: 9994, healthRatePer10000: 719,
    healthPremiumNumerator: 1390, healthPremiumDenominator: 10000,
    // 보건복지부 2026-10-30 의결: 소득 대비 0.9994%, 건강보험료 대비 13.90%.
    source: 'https://www.mohw.go.kr/gallery.es?act=view&bid=0003&list_no=380579&mid=a10505000000',
  },
]

export const MINIMUM_WAGE_PERIODS = [
  {
    startDate: '2026-01-01T00:00:00+09:00', endExclusive: '2027-01-01T00:00:00+09:00',
    hourlyWage: 10320,
    source: 'https://www.minimumwage.go.kr/minWage/policy/decisionMain.do',
  },
  {
    startDate: '2027-01-01T00:00:00+09:00', endExclusive: '2028-01-01T00:00:00+09:00',
    hourlyWage: 10700,
    // 고용노동부고시 제2026-60호(2026-08-05), 2027-01-01~12-31 적용.
    source: 'https://www.minimumwage.go.kr/minWage/policy/decisionMain.do',
  },
] as const

function periodAt<T extends { startDate: string; endExclusive: string }>(periods: readonly T[], date: Date): T {
  const time = date.getTime()
  const period = periods.find(item => time >= Date.parse(item.startDate) && time < Date.parse(item.endExclusive))
  if (!period) throw new RangeError('해당 기준일의 연도별 요율·최저임금 데이터가 없습니다.')
  return period
}

/** 보험료 월분 기준일. 미래 요율 등록은 전체 급여 계산의 지원연도 확대와 별개다. */
export function getLongTermCareRate(date: Date = TAX_YEAR_AS_OF): LongTermCareRatePeriod {
  return periodAt(LONG_TERM_CARE_RATE_PERIODS, date)
}

/** 법정 적용기간의 시간급. 기본값은 사이트 계산 기준연도이며 실제 오늘 날짜가 아니다. */
export function getMinimumHourlyWage(date: Date = TAX_YEAR_AS_OF): number {
  return periodAt(MINIMUM_WAGE_PERIODS, date).hourlyWage
}
