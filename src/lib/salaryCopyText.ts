import { DEFAULT_WITHHOLDING_PERCENTAGE } from '@/lib/incomeTax'
import { ROUTES } from '@/lib/routes'
import { formatKRW, type SalaryInput, type SalaryResult } from '@/lib/salary'
import { SITE } from '@/lib/site'

/**
 * 연봉 실수령액 계산기의 '결과 복사' 문구.
 * 계산에 실제로 쓴 입력과 그 결과만 받아서 만든다. 화면의 현재 입력칸을 읽거나 다시 계산하지 않는다.
 */
export function buildSalaryCopyText(input: SalaryInput, result: SalaryResult, periodLabel: string): string {
  const { breakdown } = result
  return [
    `연봉 실수령액 계산기 (${periodLabel})`,
    '',
    '[입력 조건]',
    `세전 연봉: ${formatKRW(input.annualSalary)}`,
    `월 비과세액: ${formatKRW(input.nonTaxable)}`,
    `공제대상가족 수(본인 포함): ${input.dependents}명`,
    `그중 8세 이상 20세 이하 자녀 수: ${input.childCount8to20 ?? 0}명`,
    `소득세 원천징수 비율: ${input.withholdingPercentage ?? DEFAULT_WITHHOLDING_PERCENTAGE}%`,
    '',
    '[예상 실수령액]',
    `월 실수령액: ${formatKRW(result.monthlyNet)}`,
    `연 실수령액: ${formatKRW(result.annualNet)}`,
    '',
    '[월 공제 내역]',
    `국민연금: ${formatKRW(breakdown.nationalPension)}`,
    `건강보험: ${formatKRW(breakdown.healthInsurance)}`,
    `장기요양: ${formatKRW(breakdown.longTermCare)}`,
    `고용보험: ${formatKRW(breakdown.employment)}`,
    `소득세: ${formatKRW(breakdown.incomeTax)}`,
    `지방소득세: ${formatKRW(breakdown.localTax)}`,
    `월 총 공제액: ${formatKRW(breakdown.totalDeduction)}`,
    '',
    '입력한 조건으로 계산한 예상액이며, 실제 급여명세서나 연말정산 결과와 다를 수 있습니다.',
    `${SITE.displayUrl}${ROUTES.SALARY_CALCULATOR}`,
  ].join('\n')
}

/**
 * 사용자가 버튼을 눌렀을 때만 호출한다. 쓰기가 확인된 경우에만 true.
 * 권한 거절·미지원 환경은 false로 돌려 화면이 성공으로 표시하지 않게 한다. 클립보드를 읽지 않는다.
 */
export async function writeTextToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.clipboard?.writeText !== 'function') return false
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
