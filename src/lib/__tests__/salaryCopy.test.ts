import { afterEach, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { uiHarness, identifiers } from '../uiHarness.test-support'
import { buildSalaryCopyText } from '../salaryCopyText'
import { TAX_YEAR_AS_OF_LABEL } from '../policyYear'
import type { SalaryResult } from '../salary'
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(), usePathname: () => '/salary-calculator' }))
import CalculatorForm from '@/components/calculator/CalculatorForm'

afterEach(() => vi.unstubAllGlobals())

type View = ReturnType<typeof uiHarness>
const button = (view: View, label: string) =>
  view.nodes().find(n => n.type === 'button' && String(n.props.children).includes(label))
const calculate = (view: View) => (button(view, '실수령액 계산')!.props.onClick as () => void)()
const copy = (view: View) => (button(view, '결과 복사')!.props.onClick as () => Promise<void>)()
const status = (view: View) => {
  const node = view.nodes().find(n => n.type === 'p' && n.props.role === 'status')
  return node ? (node.props.children as unknown[]).filter(x => typeof x === 'string').join('') : undefined
}
const manualArea = (view: View) => view.nodes().find(n => n.type === 'textarea')
function filled(salary = '40,000,000') {
  const view = uiHarness(CalculatorForm)
  view.change('annualSalary', salary)
  view.change('nonTaxable', '0')
  return view
}
function stubClipboard(writeText: (text: string) => Promise<void>) {
  const spy = vi.fn(writeText)
  vi.stubGlobal('navigator', { clipboard: { writeText: spy } })
  return spy
}

// 계산 결과가 아니라 손으로 적은 고정 값이다. 문구·단위·줄바꿈·순서만 검사한다.
it('고정된 입력과 결과에서 정해진 문구가 나온다', () => {
  const result = {
    monthlyGross: 4_000_000, monthlyNet: 3_300_000, annualNet: 39_600_000, annualDeduction: 6_000_000,
    breakdown: { nationalPension: 180_000, healthInsurance: 140_000, longTermCare: 18_000, employment: 34_000,
      incomeTax: 116_370, localTax: 11_630, totalDeduction: 500_000 },
  } as SalaryResult
  const text = buildSalaryCopyText(
    { annualSalary: 48_000_000, nonTaxable: 200_000, dependents: 3, childCount8to20: 1, withholdingPercentage: 120 },
    result, '2099년 1~6월 기준')
  expect(text).toBe([
    '연봉 실수령액 계산기 (2099년 1~6월 기준)',
    '',
    '[입력 조건]',
    '세전 연봉: 48,000,000원',
    '월 비과세액: 200,000원',
    '공제대상가족 수(본인 포함): 3명',
    '그중 8세 이상 20세 이하 자녀 수: 1명',
    '소득세 원천징수 비율: 120%',
    '',
    '[예상 실수령액]',
    '월 실수령액: 3,300,000원',
    '연 실수령액: 39,600,000원',
    '',
    '[월 공제 내역]',
    '국민연금: 180,000원',
    '건강보험: 140,000원',
    '장기요양: 18,000원',
    '고용보험: 34,000원',
    '소득세: 116,370원',
    '지방소득세: 11,630원',
    '월 총 공제액: 500,000원',
    '',
    '입력한 조건으로 계산한 예상액이며, 실제 급여명세서나 연말정산 결과와 다를 수 있습니다.',
    'https://연봉계산기.kr/salary-calculator',
  ].join('\n'))
  expect(identifiers(text)).toEqual([])
  // 비율을 고르지 않는 계산기는 기본 비율 100%를 적는다.
  expect(buildSalaryCopyText({ annualSalary: 48_000_000, nonTaxable: 0, dependents: 1 }, result, 'x'))
    .toContain('그중 8세 이상 20세 이하 자녀 수: 0명\n소득세 원천징수 비율: 100%')
})

it('버튼을 눌렀을 때만, 화면에 보이는 결과와 같은 스냅샷을 복사하고 성공 뒤에 안내한다', async () => {
  const writeText = stubClipboard(async () => {})
  const view = filled()
  expect(button(view, '결과 복사')).toBeUndefined()
  calculate(view)
  expect(writeText).not.toHaveBeenCalled()
  expect(status(view)).toBe('')
  const shown = view.props('ResultCard')!.result as SalaryResult
  await copy(view)
  expect(writeText).toHaveBeenCalledTimes(1)
  expect(writeText.mock.calls[0][0]).toBe(buildSalaryCopyText(
    { annualSalary: 40_000_000, nonTaxable: 0, dependents: 1, childCount8to20: 0 }, shown, TAX_YEAR_AS_OF_LABEL))
  expect(status(view)).toBe('복사했습니다')
  expect(manualArea(view)).toBeUndefined()
  expect(button(view, '결과 복사')!.type).toBe('button')
  expect(view.html()).toContain('role="status"')
})

it('입력을 바꾸면 이전 결과를 복사할 수 없고, 되돌려도 이전 안내가 남지 않으며, 재계산하면 새 결과를 복사한다', async () => {
  const writeText = stubClipboard(async () => {})
  const view = filled()
  calculate(view)
  await copy(view)
  view.change('annualSalary', '50,000,000')
  expect(button(view, '결과 복사')).toBeUndefined()
  expect(view.html()).not.toContain('복사했습니다')
  view.change('annualSalary', '40,000,000')
  expect(view.props('ResultCard')).toBeDefined()
  expect(status(view)).toBe('')
  view.change('annualSalary', '50,000,000')
  calculate(view)
  expect(status(view)).toBe('')
  await copy(view)
  expect(writeText).toHaveBeenCalledTimes(2)
  expect(writeText.mock.calls[1][0]).toContain('세전 연봉: 50,000,000원')
  expect(writeText.mock.calls[1][0]).not.toBe(writeText.mock.calls[0][0])
  calculate(view)
  expect(status(view)).toBe('')
})

it('가족·자녀 선택은 계산에 쓴 값 그대로 복사된다', async () => {
  const writeText = stubClipboard(async () => {})
  const view = filled()
  const pressed = () => view.nodes().filter(n => n.type === 'button' && typeof n.props['aria-pressed'] === 'boolean')
  ;(pressed().find(n => String(n.props.children) === '3,명')!.props.onClick as () => void)()
  ;(pressed().filter(n => String(n.props.children) === '2,명')[1].props.onClick as () => void)()
  calculate(view)
  await copy(view)
  expect(writeText.mock.calls[0][0]).toContain('공제대상가족 수(본인 포함): 3명\n그중 8세 이상 20세 이하 자녀 수: 2명')
})

it.each([
  ['권한 거절', () => stubClipboard(async () => { throw new Error('denied') })],
  ['클립보드 기능 없음', () => vi.stubGlobal('navigator', {})],
  ['브라우저 정보 없음', () => vi.stubGlobal('navigator', undefined)],
])('%s: 성공으로 표시하지 않고 같은 스냅샷의 대체 영역을 보여 준다', async (_name, stub) => {
  stub()
  const view = filled()
  calculate(view)
  const shown = view.props('ResultCard')!.result as SalaryResult
  await copy(view)
  expect(view.html()).not.toContain('복사했습니다')
  expect(status(view)).toContain('직접 선택해 복사')
  const area = manualArea(view)!
  expect(area.props.readOnly).toBe(true)
  expect(area.props.value).toBe(buildSalaryCopyText(
    { annualSalary: 40_000_000, nonTaxable: 0, dependents: 1, childCount8to20: 0 }, shown, TAX_YEAR_AS_OF_LABEL))
  view.change('nonTaxable', '100,000')
  expect(manualArea(view)).toBeUndefined()
  view.change('nonTaxable', '0')
  expect(manualArea(view)).toBeUndefined()
  expect(status(view)).toBe('')
})

it('복사 처리 중 입력 변경·초기화가 있으면 이전 결과의 안내를 남기지 않는다', async () => {
  for (const interrupt of ['change', 'reset'] as const) {
    let finish = () => {}
    stubClipboard(() => new Promise<void>(resolve => { finish = resolve }))
    const view = filled()
    calculate(view)
    const pending = copy(view)
    if (interrupt === 'change') {
      view.change('annualSalary', '50,000,000')
      view.change('annualSalary', '40,000,000')
    } else {
      (button(view, '초기화')!.props.onClick as () => void)()
    }
    finish()
    await pending
    expect(view.html(), interrupt).not.toContain('복사했습니다')
    expect(manualArea(view), interrupt).toBeUndefined()
  }
})

it('다른 계산기와 저장소·분석·콘솔로 번지지 않는다', () => {
  const read = (path: string) => readFileSync(path, 'utf8')
  for (const path of ['src/components/calculator/ResultCard.tsx', 'src/components/calculator/ReverseCalculatorForm.tsx']) {
    expect(read(path), path).not.toMatch(/결과 복사|salaryCopyText|clipboard/)
  }
  const added = read('src/lib/salaryCopyText.ts') + read('src/components/calculator/CalculatorForm.tsx')
  expect(added).not.toMatch(/readText|localStorage|sessionStorage|console\.|gtag|dataLayer|router\.(push|replace)|history\./)
})
