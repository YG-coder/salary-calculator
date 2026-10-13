import { RATES } from './constants'

// 소수 요율을 정수 분수로 한 번만 변환한다. 0.009는 9/1000이며,
// 3,500,000 × 0.009 = 31,499.999999999996 같은 부동소수점 절사 오류를 피한다.
const rateText = String(RATES.employment)
const denominator = 10 ** (rateText.split('.')[1]?.length ?? 0)
const numerator = Number(rateText.replace('.', ''))

/** 원 단위 과세 보수에 근로자 고용보험 요율을 적용하고 10원 미만을 버린다. */
export function calculateEmployeeEmploymentInsurance(amount: number): number {
  return Math.floor(amount * numerator / (denominator * 10)) * 10
}
