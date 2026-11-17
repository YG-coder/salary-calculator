import { describe, expect, it, vi } from 'vitest'
import { calculateUnemploymentBenefit } from '../calculators'
import { assertUnemploymentPolicyYear, getUnemploymentLimits, getUnemploymentPolicy } from '../policy/unemployment'
import { uiHarness, identifiers, visibleCopy } from '../uiHarness.test-support'
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(), usePathname: () => '/unemployment-benefit-calculator' }))
import Page from '@/app/unemployment-benefit-calculator/page'

const base = { dailyWage: 100000, employmentMonths: 24, age: 40, separationDate: '2026-12-31', dailyHours: 8 }

describe('일반 근로자 구직급여의 이직일과 소정근로시간', () => {
  it('2026년 8시간 하한과 공식 상한을 독립 기대값으로 비교한다', () => {
    // 10,320 × 8 × 4/5 = 66,048, 113,500 × 3/5 = 68,100.
    expect(calculateUnemploymentBenefit(base)).toMatchObject({ dailyBenefit: 66048, totalDays: 150, totalBenefit: 9907200 })
    expect(calculateUnemploymentBenefit({ ...base, dailyWage: 113500 })).toMatchObject({ dailyBenefit: 68100, totalBenefit: 10215000 })
    expect(calculateUnemploymentBenefit({ ...base, dailyWage: Number.MAX_SAFE_INTEGER }).dailyBenefit).toBe(68100)
  })
  it.each([[1,8256], [2,16512], [3,24768], [4,33024], [5,41280], [6,49536], [7,57792], [8,66048]])('%s시간 하한은 %s원', (dailyHours, expected) => {
    expect(calculateUnemploymentBenefit({ ...base, dailyHours, dailyWage: 1 }).dailyBenefit).toBe(expected)
  })
  it.each([[0.1,1], [3,3], [3.01,4], [7,7], [7.5,8], [8,8], [9,8]])('시간 %s는 %s로 올림·상한 적용', (input, appliedHours) => {
    expect(getUnemploymentLimits(base.separationDate, input).appliedHours).toBe(appliedHours)
  })
  it('하한 이후 상한을 적용하며 단시간 근로자 상한을 비례 감액하지 않는다', () => {
    expect(calculateUnemploymentBenefit({ ...base, dailyHours: 4 }).dailyBenefit).toBe(60000)
    expect(calculateUnemploymentBenefit({ ...base, dailyHours: 4, dailyWage: 120000 }).dailyBenefit).toBe(68100)
    expect(calculateUnemploymentBenefit({ ...base, dailyWage: 110079 }).dailyBenefit).toBe(66048)
    expect(calculateUnemploymentBenefit({ ...base, dailyWage: 110082 }).dailyBenefit).toBe(66049)
    expect(calculateUnemploymentBenefit({ ...base, dailyWage: 113499 }).dailyBenefit).toBe(68099)
  })
  it.each(['2027-01-01','2027-12-31'])('상한을 확인하지 않은 %s는 금액을 반환하지 않는다', separationDate => {
    expect(() => calculateUnemploymentBenefit({ ...base, separationDate })).toThrow('상한 확정 여부 미확인')
  })
  it.each(['', '2026-02-29', '2026-13-01', '2026-1-1', '2026-01-01T00:00:00Z', '2025-12-31', '2028-01-01'])('잘못되거나 미지원 날짜 %s', date => {
    expect(() => getUnemploymentPolicy(date)).toThrow(RangeError)
  })
  it('기준연도만 올리는 빌드를 차단한다', () => {
    expect(() => assertUnemploymentPolicyYear(2026)).not.toThrow()
    expect(() => assertUnemploymentPolicyYear(2027)).toThrow('상한 확정 여부 미확인')
  })
  it.each([0,-1,NaN,Infinity,24.1])('유효하지 않은 시간 %s', dailyHours => {
    expect(() => calculateUnemploymentBenefit({ ...base, dailyHours })).toThrow(RangeError)
  })
  it.each([{ dailyWage: 0 }, { dailyWage: NaN }, { dailyWage: 1.5 }, { employmentMonths: -1 }, { employmentMonths: 5 }, { employmentMonths: 6.5 }, { age: NaN }])('잘못된 입력과 추정 불가 기간은 거부한다 %j', patch => {
    expect(() => calculateUnemploymentBenefit({ ...base, ...patch })).toThrow(RangeError)
  })
  it.each([[11,120,120],[12,150,180],[35,150,180],[36,180,210],[59,180,210],[60,210,240],[119,210,240],[120,240,270]])('가입 %s개월 연령 경계', (employmentMonths, young, older) => {
    expect(calculateUnemploymentBenefit({ ...base, employmentMonths, age: 49 }).totalDays).toBe(young)
    expect(calculateUnemploymentBenefit({ ...base, employmentMonths, age: 50 }).totalDays).toBe(older)
    expect(calculateUnemploymentBenefit({ ...base, employmentMonths, age: 49, isDisabled: true }).totalDays).toBe(older)
  })
})

function clickCalculate(view: ReturnType<typeof uiHarness>) {
  const button = view.nodes().find(n => n.type === 'button' && n.props.children === '실업급여 계산하기')!
  ;(button.props.onClick as () => void)()
}
function fill(view: ReturnType<typeof uiHarness>) {
  view.change('monthlyWage', '3000000'); view.change('employmentMonths', '24')
  view.change('separationDate', '2026-12-31'); view.change('dailyHours', '4')
}
it('새 입력은 빈칸이며 누락·잘못된 시간·미확정 연도는 결과 금액을 표시하지 않는다', () => {
  const view = uiHarness(Page)
  expect(view.nodes().find(n => n.props.id === 'separationDate')!.props.value).toBe('')
  expect(view.nodes().find(n => n.props.id === 'dailyHours')!.props.value).toBe('')
  fill(view); view.change('dailyHours', ''); clickCalculate(view)
  expect(view.props('ResultHighlight')).toBeUndefined()
  expect(view.html()).toContain('계산 보류')
  view.change('dailyHours','4e0'); clickCalculate(view)
  expect(view.props('ResultHighlight')).toBeUndefined()
  view.change('dailyHours','4'); view.change('separationDate','2027-01-01'); clickCalculate(view)
  expect(view.props('ResultHighlight')).toBeUndefined()
  expect(view.html()).toContain('상한 확정 여부 미확인')
  expect(identifiers(visibleCopy(view.html()))).toEqual([])
  view.change('separationDate','2026-12-31')
  expect(view.html()).not.toContain('상한 확정 여부 미확인으로 계산을 보류')
  clickCalculate(view)
  expect(view.props('ResultHighlight')?.value).toBe('9,000,000원')
  expect(identifiers(visibleCopy(view.html()))).toEqual([])
  view.change('dailyHours','8')
  expect(view.props('ResultHighlight')).toBeUndefined()
})
it('이직일·나이·장애 선택 변경은 결과를 숨기며 선택형 버튼 상태가 일치한다', () => {
  const view = uiHarness(Page); fill(view); clickCalculate(view)
  view.change('separationDate','2026-01-01'); expect(view.props('ResultHighlight')).toBeUndefined()
  clickCalculate(view)
  const age = view.nodes().find(n => n.type === 'button' && Array.isArray(n.props.children) && n.props.children[0] === '50')!
  ;(age.props.onClick as () => void)()
  expect(view.props('ResultHighlight')).toBeUndefined()
  const selectedAge = view.nodes().find(n => n.type === 'button' && Array.isArray(n.props.children) && n.props.children[0] === '50')!
  expect(selectedAge.props['aria-pressed']).toBe(true)
  clickCalculate(view)
  const disabled = view.nodes().find(n => n.type === 'button' && n.props.children === '장애인 해당')!
  ;(disabled.props.onClick as () => void)()
  expect(view.props('ResultHighlight')).toBeUndefined()
})
