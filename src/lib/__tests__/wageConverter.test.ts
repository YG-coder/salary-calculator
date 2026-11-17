// 시급·월급·연봉 환산과 최저임금 비교 (/wage-converter)
//
// 기대값은 구현 출력을 복사하지 않고 손으로 계산했다 (docs/wage-converter.md의 표).
// 2026년 최저시급 10,320원 × 월 209시간 = 2,156,880원.

import { describe, expect, it, vi } from 'vitest'
import {
  calculateWageConversion,
  parseMonthlyHours,
  type WageConverterInput,
} from '../wageConverter'
import {
  MINIMUM_WAGE_COMPARISON_YEARS,
  MINIMUM_WAGE_HELD_YEARS,
  OFFICIAL_MONTHLY_EQUIVALENT,
  STANDARD_MONTHLY_HOURS,
  assertMinimumWageComparisonPolicy,
  getComparisonMinimumWage,
} from '../policy/minimumWageComparison'
import { getMinimumHourlyWage } from '../policy/annualRates'
import { calculateWeeklyHolidayPay } from '../calculators'
import { CALCULATOR_ROUTES, ROUTES } from '../routes'
import { PAGE_META, buildMetadata } from '../metadata'
import { SITE } from '../site'
import sitemap from '@/app/sitemap'
import { identifiers, uiHarness, visibleCopy } from '../uiHarness.test-support'
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(), usePathname: () => '/wage-converter' }))
import Page from '@/app/wage-converter/page'

const base: WageConverterInput = {
  basis: 'monthly', amount: 2_156_880, hoursMode: 'standard', customHours: '', annualComposition: '',
  compare: 'no', compareYear: null, profile: '', includedAmount: Number.NaN,
}
const run = (patch: Partial<WageConverterInput> = {}) => calculateWageConversion({ ...base, ...patch })
const conversion = (patch: Partial<WageConverterInput> = {}) => run(patch).conversion
const comparison = (patch: Partial<WageConverterInput> = {}) =>
  run({ compare: 'yes', compareYear: 2026, profile: 'ordinary', ...patch }).comparison

describe('세전 환산', () => {
  it('월급 → 시급·연봉 (표준 209시간)', () => {
    expect(conversion()).toMatchObject({ status: 'calculated', hourly: 10_320, monthly: 2_156_880, annual: 25_882_560, monthlyHoursText: '209', truncated: false })
  })
  it('시급 → 월급·연봉 (표준 209시간)', () => {
    expect(conversion({ basis: 'hourly', amount: 10_320 })).toMatchObject({ hourly: 10_320, monthly: 2_156_880, annual: 25_882_560, truncated: false })
  })
  it('연봉 → 월급·시급: 나누어떨어지지 않으면 원 미만을 버리고 그 사실을 알린다', () => {
    // 30,000,000 ÷ 12 = 2,500,000 / 2,500,000 ÷ 209 = 11,961.72…
    expect(conversion({ basis: 'annual', amount: 30_000_000, annualComposition: 'equal12' })).toMatchObject({ hourly: 11_961, monthly: 2_500_000, annual: 30_000_000, truncated: true })
    // 30,000,001 ÷ 12 = 2,500,000.08…
    expect(conversion({ basis: 'annual', amount: 30_000_001, annualComposition: 'equal12' })).toMatchObject({ monthly: 2_500_000, annual: 30_000_001, truncated: true })
  })
  it('직접 입력한 소수 시간: 0.5·0.25 단위와 원 미만 버림', () => {
    // 10,000 × 174.5 = 1,745,000 / × 12 = 20,940,000
    expect(conversion({ basis: 'hourly', amount: 10_000, hoursMode: 'custom', customHours: '174.5' })).toMatchObject({ monthly: 1_745_000, annual: 20_940_000, monthlyHoursText: '174.5', truncated: false })
    // 10,001 × 174.25 = 1,742,674.25 → 1,742,674 / 연봉 = 1,742,674.25 × 12 = 20,912,091 (월급 표시액 × 12가 아님)
    expect(conversion({ basis: 'hourly', amount: 10_001, hoursMode: 'custom', customHours: '174.25' })).toMatchObject({ monthly: 1_742_674, annual: 20_912_091, truncated: true })
    // 0.1 단위: 10,000 × 160.1 = 1,601,000
    expect(conversion({ basis: 'hourly', amount: 10_000, hoursMode: 'custom', customHours: '160.1' })).toMatchObject({ monthly: 1_601_000, annual: 19_212_000, truncated: false })
  })
  it('월급 ↔ 연봉만 환산하면 근로시간을 요구하지 않고 시급은 비워 둔다', () => {
    expect(conversion({ amount: 3_000_000, hoursMode: 'none' })).toMatchObject({ status: 'calculated', hourly: null, monthly: 3_000_000, annual: 36_000_000, monthlyHoursText: null, truncated: false })
    expect(conversion({ basis: 'annual', amount: 36_000_000, annualComposition: 'equal12', hoursMode: 'none' })).toMatchObject({ hourly: null, monthly: 3_000_000, annual: 36_000_000 })
  })
  it.each<Partial<WageConverterInput>>([
    { basis: 'hourly', amount: 750_599_937_895_081, hoursMode: 'custom', customHours: '744' },
    { amount: 100_000_000_000_000, hoursMode: 'custom', customHours: '0.01' },
  ])('입력은 안전한 정수여도 환산 결과가 표시 범위를 넘으면 금액 없이 보류한다', (patch) => {
    expect(conversion(patch)).toEqual({ status: 'held', reason: expect.any(String) })
  })
  it('안전한 출력 경계 바로 아래는 계산한다', () => {
    // 90,071,992,547,409 ÷ 0.01 = 9,007,199,254,740,900 < 2^53 - 1
    expect(conversion({ amount: 90_071_992_547_409, hoursMode: 'custom', customHours: '0.01' }))
      .toMatchObject({ status: 'calculated', hourly: 9_007_199_254_740_900 })
  })
  it.each<[string, Partial<WageConverterInput>]>([
    ['기준 미선택', { basis: '' }],
    ['빈 금액', { amount: Number.NaN }],
    ['0원', { amount: 0 }],
    ['음수', { amount: -1 }],
    ['소수 금액', { amount: 1.5 }],
    ['계산 범위 초과', { amount: Number.MAX_SAFE_INTEGER }],
    ['월 기준시간 방식 미선택', { hoursMode: '' }],
    ['시급인데 시간 없음', { basis: 'hourly', amount: 10_320, hoursMode: 'none' }],
    ['직접 입력 빈칸', { hoursMode: 'custom', customHours: '' }],
    ['연봉 구성 미선택', { basis: 'annual', amount: 30_000_000 }],
    ['상여금 등 포함 연봉', { basis: 'annual', amount: 30_000_000, annualComposition: 'mixed' }],
  ])('환산 보류: %s', (_label, patch) => {
    const result = conversion(patch)
    expect(result.status).toBe('held')
    expect(result).not.toHaveProperty('monthly')
  })
  it.each([
    ['209', '20900'], ['174.5', '17450'], ['174.25', '17425'], ['744', '74400'], [' 40 ', '4000'],
  ])('월 기준시간 %s 인식', (raw, hundredths) => {
    expect(String(parseMonthlyHours(raw))).toBe(hundredths)
  })
  it.each(['', '0', '0.00', '744.01', '1e2', '-1', '17.123', '1,000', '시간'])('월 기준시간 %s 거부', (raw) => {
    expect(parseMonthlyHours(raw)).toBeNull()
  })
})

describe('최저임금 비교 (2026년, 사용자가 확인한 조건에 한정)', () => {
  it('비교 시급이 표시 범위를 넘으면 비교만 금액 없이 보류한다', () => {
    const result = run({ compare: 'yes', compareYear: 2026, profile: 'ordinary',
      hoursMode: 'custom', customHours: '0.01', includedAmount: 100_000_000_000_000 })
    expect(result.conversion.status).toBe('calculated')
    expect(result.comparison).toEqual({ status: 'held', reason: expect.any(String) })
  })
  it('적용 최저시급은 정책 자료에서 가져온다', () => {
    expect(MINIMUM_WAGE_COMPARISON_YEARS).toEqual([2026, 2027])
    expect(getComparisonMinimumWage(2026)).toBe(10_320)
    expect(getComparisonMinimumWage(2026)).toBe(getMinimumHourlyWage(new Date('2026-01-01T00:00:00+09:00')))
    expect(getComparisonMinimumWage(2026)).toBe(getMinimumHourlyWage(new Date('2026-12-31T23:59:59+09:00')))
    expect(getComparisonMinimumWage(2027)).toBe(10_700)
    expect(getComparisonMinimumWage(2027)).toBe(getMinimumHourlyWage(new Date('2027-01-01T00:00:00+09:00')))
    expect(getComparisonMinimumWage(2027)).toBe(getMinimumHourlyWage(new Date('2027-12-31T23:59:59+09:00')))
    expect(() => getComparisonMinimumWage(2028)).toThrow(RangeError)
    expect(() => getComparisonMinimumWage(2025)).toThrow(RangeError)
    expect(() => assertMinimumWageComparisonPolicy()).not.toThrow()
  })
  it('지원 연도마다 정책 자료가 있고 시급 × 209시간이 고시의 월 환산액과 같다', () => {
    // 최저임금위원회 결정현황: 2026년 2,156,880원, 2027년 2,236,300원 (209시간 기준, 고시 기준)
    expect(OFFICIAL_MONTHLY_EQUIVALENT).toEqual({ 2026: 2_156_880, 2027: 2_236_300 })
    for (const year of MINIMUM_WAGE_COMPARISON_YEARS) {
      expect(getComparisonMinimumWage(year) * STANDARD_MONTHLY_HOURS).toBe(OFFICIAL_MONTHLY_EQUIVALENT[year])
    }
    expect(MINIMUM_WAGE_HELD_YEARS).toEqual([])
  })
  it('2027년: 고시 월 환산액과 같은 금액, 그 전후 1원, 시급 직접 비교, 소수 월 기준시간', () => {
    const in2027 = (patch: Partial<WageConverterInput>) => comparison({ compareYear: 2027, ...patch })
    // 10,700 × 209 = 2,236,300 (고시 월 환산액)
    expect(in2027({ includedAmount: 2_236_300 })).toMatchObject({ status: 'calculated', year: 2027, minimumHourly: 10_700, comparedHourly: 10_700, meetsMinimum: true, hourlyGap: 0, gapUnderOneWon: false })
    expect(in2027({ includedAmount: 2_236_299 })).toMatchObject({ comparedHourly: 10_699, meetsMinimum: false, hourlyGap: 0, gapUnderOneWon: true })
    expect(in2027({ includedAmount: 2_236_301 })).toMatchObject({ comparedHourly: 10_700, meetsMinimum: true, hourlyGap: 0, gapUnderOneWon: true })
    // 2026년 기준을 딱 맞춘 2,156,880원은 2027년에는 미만: (2,236,300 − 2,156,880) ÷ 209 = 380
    expect(in2027({ includedAmount: 2_156_880 })).toMatchObject({ comparedHourly: 10_320, meetsMinimum: false, hourlyGap: 380, gapUnderOneWon: false })
    // 2,300,000 ÷ 209 = 11,004.78… / (2,300,000 − 2,236,300) ÷ 209 = 304.78…
    expect(in2027({ includedAmount: 2_300_000 })).toMatchObject({ comparedHourly: 11_004, meetsMinimum: true, hourlyGap: 304 })
    // 시급 직접 비교
    expect(in2027({ basis: 'hourly', amount: 10_700, hoursMode: '', includedAmount: 10_699 })).toMatchObject({ meetsMinimum: false, hourlyGap: 1 })
    expect(in2027({ basis: 'hourly', amount: 10_700, hoursMode: '', includedAmount: 10_700 })).toMatchObject({ meetsMinimum: true, hourlyGap: 0 })
    // 소수 월 기준시간: 10,700 × 174.5 = 1,867,150
    expect(in2027({ hoursMode: 'custom', customHours: '174.5', includedAmount: 1_867_150 })).toMatchObject({ meetsMinimum: true, comparedHourly: 10_700, hourlyGap: 0 })
    expect(in2027({ hoursMode: 'custom', customHours: '174.5', includedAmount: 1_867_149 })).toMatchObject({ meetsMinimum: false, gapUnderOneWon: true })
  })
  it('2027년에도 예외 조건·빈칸은 보류한다', () => {
    expect(comparison({ compareYear: 2027, profile: 'special', includedAmount: 2_300_000 }).status).toBe('held')
    expect(comparison({ compareYear: 2027, includedAmount: Number.NaN }).status).toBe('held')
    expect(comparison({ compareYear: 2027, hoursMode: 'none', includedAmount: 2_300_000 }).status).toBe('held')
  })
  it('정확히 최저임금과 같은 경우와 그 전후 1원', () => {
    // 10,320 × 209 = 2,156,880
    expect(comparison({ includedAmount: 2_156_880 })).toMatchObject({ status: 'calculated', minimumHourly: 10_320, comparedHourly: 10_320, meetsMinimum: true, hourlyGap: 0, gapUnderOneWon: false })
    // 1원 부족: 표시 시급은 10,319원, 차액은 1원 미만이지만 판정은 미만
    expect(comparison({ includedAmount: 2_156_879 })).toMatchObject({ comparedHourly: 10_319, meetsMinimum: false, hourlyGap: 0, gapUnderOneWon: true })
    expect(comparison({ includedAmount: 2_156_881 })).toMatchObject({ comparedHourly: 10_320, meetsMinimum: true, hourlyGap: 0, gapUnderOneWon: true })
  })
  it('차액은 시간당 원 미만 버림', () => {
    // 2,300,000 ÷ 209 = 11,004.78… / 차액 684.78…
    expect(comparison({ includedAmount: 2_300_000 })).toMatchObject({ comparedHourly: 11_004, meetsMinimum: true, hourlyGap: 684 })
  })
  it('직접 입력한 월 기준시간으로 비교한다 (주휴시간을 다시 더하지 않는다)', () => {
    // 10,320 × 174 = 1,795,680
    expect(comparison({ hoursMode: 'custom', customHours: '174', includedAmount: 1_795_680 })).toMatchObject({ meetsMinimum: true, comparedHourly: 10_320 })
    expect(comparison({ hoursMode: 'custom', customHours: '174', includedAmount: 1_795_679 })).toMatchObject({ meetsMinimum: false, gapUnderOneWon: true })
  })
  it('시급 기준은 산입 대상 시급을 그대로 비교하고 월 기준시간을 요구하지 않는다', () => {
    expect(comparison({ basis: 'hourly', amount: 10_320, hoursMode: '', includedAmount: 10_319 })).toMatchObject({ includedUnit: 'hourly', meetsMinimum: false, hourlyGap: 1 })
    expect(comparison({ basis: 'hourly', amount: 10_320, hoursMode: '', includedAmount: 10_320 })).toMatchObject({ meetsMinimum: true, hourlyGap: 0 })
  })
  it('입력한 급여 전체가 아니라 산입 대상 금액으로 비교한다', () => {
    // 월급 300만원 중 산입 대상 215만원 → 215만원 ÷ 209 = 10,287.08… < 10,320
    expect(comparison({ amount: 3_000_000, includedAmount: 2_150_000 })).toMatchObject({ comparedHourly: 10_287, meetsMinimum: false })
  })
  it.each<[string, Partial<WageConverterInput>]>([
    ['비교 여부 미선택', { compare: '' }],
    ['연도 미선택', { compareYear: null }],
    ['미지원 연도 2028', { compareYear: 2028 }],
    ['미지원 연도 2025', { compareYear: 2025 }],
    ['근무 조건 미선택', { profile: '' }],
    ['수습·적용 제외·변동 근무 등', { profile: 'special' }],
    ['산입 대상 금액 빈칸', { includedAmount: Number.NaN }],
    ['산입 대상 금액 0', { includedAmount: 0 }],
    ['월 금액인데 월 기준시간 없음', { hoursMode: 'none' }],
    ['월 기준시간 방식 미선택', { hoursMode: '' }],
  ])('비교 보류: %s', (_label, patch) => {
    const result = comparison({ includedAmount: 2_300_000, ...patch })
    expect(result.status).toBe('held')
    expect(result).not.toHaveProperty('comparedHourly')
  })
  it('비교 안 함은 보류가 아니라 생략이다', () => {
    expect(run().comparison).toEqual({ status: 'skipped' })
  })
  it('환산은 보류지만 비교는 가능한 경우와 그 반대를 구분한다', () => {
    const mixed = run({ basis: 'annual', amount: 40_000_000, annualComposition: 'mixed', compare: 'yes', compareYear: 2026, profile: 'ordinary', includedAmount: 2_300_000 })
    expect(mixed.conversion.status).toBe('held')
    expect(mixed.comparison.status).toBe('calculated')
    const noIncluded = run({ compare: 'yes', compareYear: 2026, profile: 'ordinary' })
    expect(noIncluded.conversion.status).toBe('calculated')
    expect(noIncluded.comparison.status).toBe('held')
  })
})

describe('기존 정책·계산과의 관계', () => {
  it('표준 월 기준시간 209시간과 기존 주휴수당 계산이 달라지지 않았다', () => {
    expect(STANDARD_MONTHLY_HOURS).toBe(209)
    expect(calculateWeeklyHolidayPay({ weeklyHours: 40, hourlyWage: 10_320 }).weeklyHolidayPay).toBe(82_560)
  })
})

describe('화면', () => {
  type View = ReturnType<typeof uiHarness>
  const text = (children: unknown): string => Array.isArray(children) ? children.map(text).join('') : children == null || typeof children === 'boolean' ? '' : String(children)
  const button = (view: View, label: string) => {
    const node = view.nodes().find((n) => n.type === 'button' && text(n.props.children).trim() === label)
    if (!node) throw Error(`button missing: ${label}`)
    return node
  }
  const click = (view: View, label: string) => (button(view, label).props.onClick as () => void)()
  const pressed = (view: View) => view.nodes().filter((n) => n.type === 'button' && n.props['aria-pressed'] === true).map((n) => text(n.props.children).trim())

  it('처음에는 금액이 빈칸이고 아무것도 선택돼 있지 않으며 결과가 없다', () => {
    const view = uiHarness(Page)
    expect(view.nodes().filter((n) => n.type === 'input').map((n) => n.props.value)).toEqual([''])
    expect(pressed(view)).toEqual([])
    expect(view.props('ResultHighlight')).toBeUndefined()
    expect(identifiers(visibleCopy(view.html()))).toEqual([])
    expect(view.html()).not.toContain('<main')
  })

  it('선택한 버튼만 선택 상태가 된다', () => {
    const view = uiHarness(Page)
    click(view, '월급')
    expect(pressed(view)).toEqual(['월급'])
    click(view, '연봉')
    expect(pressed(view)).toEqual(['연봉'])
    click(view, '매월 같은 금액으로 12번 받음')
    click(view, '월 기준시간 직접 입력')
    click(view, '비교함')
    click(view, '2026년')
    click(view, '일반 근로자 · 근무시간 고정')
    expect(pressed(view)).toEqual(['연봉', '매월 같은 금액으로 12번 받음', '월 기준시간 직접 입력', '비교함', '2026년', '일반 근로자 · 근무시간 고정'])
  })

  it('환산 결과를 세전 환산액으로 표시하고, 입력을 바꾸면 이전 결과와 비교 내역을 숨긴다', () => {
    const view = uiHarness(Page)
    click(view, '월급'); view.change('wageAmount', '2156880')
    click(view, `주 40시간 근무 · 유급 주휴 8시간 (월 209시간)`)
    click(view, '비교함'); click(view, '2026년'); click(view, '일반 근로자 · 근무시간 고정')
    view.change('includedAmount', '2156880')
    click(view, '환산하기')
    expect(view.props('ResultHighlight')).toMatchObject({ label: '세전 환산액', value: '연봉 25,882,560원' })
    const html = view.html()
    expect(html).toContain('입력 조건상 기준 이상')
    expect(html).toContain('10,320원')
    expect(identifiers(visibleCopy(html))).toEqual([])

    view.change('includedAmount', '2156879')
    expect(view.props('ResultHighlight')).toBeUndefined()
    expect(view.html()).not.toContain('입력 조건상 기준')
    click(view, '환산하기')
    expect(view.html()).toContain('입력 조건상 기준 미만')
    expect(view.html()).toContain('1원 미만')

    // 연도를 바꾸면 이전 결과와 비교 내역이 사라지고, 다시 계산하면 그 연도의 최저시급으로 비교한다.
    click(view, '2027년')
    expect(view.props('ResultHighlight')).toBeUndefined()
    expect(view.html()).not.toContain('입력 조건상 기준')
    expect(view.nodes().filter((n) => n.type === 'button' && n.props['aria-pressed'] === true).map((n) => text(n.props.children).trim())).toContain('2027년')
    expect(view.nodes().filter((n) => n.type === 'button' && n.props['aria-pressed'] === true).map((n) => text(n.props.children).trim())).not.toContain('2026년')
    view.change('includedAmount', '2156880')
    click(view, '환산하기')
    expect(view.props('ResultHighlight')).toMatchObject({ value: '연봉 25,882,560원' })
    expect(view.html()).toContain('입력 조건상 기준 미만')
    expect(view.html()).toContain('10,700원')
    expect(view.html()).toContain('380원')
    expect(view.html()).not.toContain('최저임금 비교 보류')
    view.change('includedAmount', '2236300')
    click(view, '환산하기')
    expect(view.html()).toContain('입력 조건상 기준 이상')
    expect(identifiers(visibleCopy(view.html()))).toEqual([])
  })

  it('급여 단위를 바꾸면 의미가 달라지는 금액만 비우고 같은 단위는 유지한다', () => {
    const view = uiHarness(Page)
    click(view, '월급'); view.change('wageAmount', '2156880')
    click(view, '비교함'); view.change('includedAmount', '2100000')
    const inputValue = (id: string) => view.nodes().find((n) => n.props.id === id)?.props.value
    click(view, '월급')
    expect(inputValue('wageAmount')).toBe('2,156,880')
    click(view, '연봉')
    expect(inputValue('wageAmount')).toBe('')
    expect(inputValue('includedAmount')).toBe('2,100,000') // 월 산입 임금은 단위가 같다.
    click(view, '시급')
    expect(inputValue('includedAmount')).toBe('')
  })
  it('보류는 0원 결과가 아니라 이유만 표시한다', () => {
    const view = uiHarness(Page)
    click(view, '연봉'); view.change('wageAmount', '40000000')
    click(view, '상여금·성과급·퇴직금 포함 또는 모름')
    click(view, '시급 환산 안 함 (월급 ↔ 연봉만)')
    click(view, '비교 안 함')
    click(view, '환산하기')
    expect(view.props('ResultHighlight')).toBeUndefined()
    const html = view.html()
    expect(html).toContain('환산 보류')
    expect(html).not.toContain('최저임금 비교 보류')
    expect(visibleCopy(html)).not.toMatch(/(?:^|\s)0원/)
  })
})

describe('경로 등록과 공유 메타데이터', () => {
  it('계산기 경로·사이트맵에 한 번 등록된다', () => {
    expect(CALCULATOR_ROUTES).toContain(ROUTES.WAGE_CONVERTER)
    const urls = sitemap().map((entry) => entry.url)
    expect(urls.filter((url) => url === `${SITE.url}${ROUTES.WAGE_CONVERTER}`)).toHaveLength(1)
  })
  it('canonical·공유 주소가 기준 주소이고 공유 이미지와 큰 카드가 있으며 제목에 사이트명을 붙이지 않는다', () => {
    const metadata = buildMetadata(PAGE_META.wageConverter)
    const expected = `${SITE.url}${ROUTES.WAGE_CONVERTER}`
    expect(metadata.alternates?.canonical).toBe(expected)
    const openGraph = metadata.openGraph as { url?: string; images?: unknown[] }
    expect(openGraph.url).toBe(expected)
    expect(openGraph.images?.length).toBeGreaterThan(0)
    const twitter = metadata.twitter as { card?: string; images?: unknown[] }
    expect(twitter.card).toBe('summary_large_image')
    expect(twitter.images?.length).toBeGreaterThan(0)
    expect(String(metadata.title)).not.toContain(SITE.name)
  })
})
