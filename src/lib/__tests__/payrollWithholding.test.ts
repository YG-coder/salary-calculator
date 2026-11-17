import { describe, expect, it } from 'vitest'
import { calcSimplifiedWithholdingTax, WITHHOLDING_PERCENTAGES, type WithholdingPercentage } from '../incomeTax'
import { calculatePayrollTax } from '../calculators'
import { calculateSalary } from '../salary'
import official from './fixtures/income-tax-official-2026.json'
import PayrollPage from '@/app/payroll-tax-calculator/page'
import { uiHarness, identifiers, visibleCopy } from '../uiHarness.test-support'

// 국세청 공식 안내의 구 공제액 예제. 구현에서 산출한 기대값이 아니다.
describe('공식 예제 및 독립 수기 계산', () => {
  it.each([[80, 16_140], [100, 20_180], [120, 24_210]] as const)('개정 전 국세청 사례 %i%% = %i원', (withholdingPercentage, expected) => {
    expect(calcSimplifiedWithholdingTax({ monthlyTaxable: 3_500_000, dependents: 4, childCount8to20: 2, withholdingPercentage }, new Date('2026-02-28T00:00:00+09:00'))).toBe(expected)
  })
  // 홈택스 2026-11-17 실제 조회, 2026.3.1 시행 세액표. 49,340 - 45,830 = 3,510.
  it.each([[80, 2_800, 280], [100, 3_510, 350], [120, 4_210, 420]] as const)('현행 자녀공제 후 %i%%', (withholdingPercentage, incomeTax, localTax) => {
    const result = calculatePayrollTax({ monthlyGross: 3_700_000, nonTaxable: 200_000, dependents: 4, childCount8to20: 2, withholdingPercentage })
    expect(result.incomeTax).toBe(incomeTax)
    expect(result.localTax).toBe(localTax)
    // 보험료 합계 340,100원: 기존 공식 고정값. 비율을 보험료에 곱하지 않는다.
    expect(result.totalDeduction).toBe(340_100 + incomeTax + localTax)
    expect(result.monthlyNet).toBe(3_700_000 - 340_100 - incomeTax - localTax)
  })
  // 표 금액(59,370 / 60,230 / 1,507,400)에 4/5 또는 6/5 후 10원 절사.
  // 월 10,000,029원은 고소득 기준세액 1,532,400원으로 먼저 절사된 후 비율 적용.
  // 해당 사례 80/100/120% 및 지방세는 홈택스 화면에서 직접 확인했다.
  it.each([
    [2_839_999, 47_490, 59_370, 71_240],
    [2_840_000, 48_180, 60_230, 72_270],
    [10_000_000, 1_205_920, 1_507_400, 1_808_880],
    [10_000_029, 1_225_920, 1_532_400, 1_838_880],
    [14_000_000, 2_323_520, 2_904_400, 3_485_280],
  ])('월 %i원 구간·절사 경계', (monthlyTaxable, at80, at100, at120) => {
    for (const [withholdingPercentage, expected] of [[80, at80], [100, at100], [120, at120]] as const) {
      expect(calcSimplifiedWithholdingTax({ monthlyTaxable, dependents: 1, withholdingPercentage })).toBe(expected)
    }
  })
  it.each(WITHHOLDING_PERCENTAGES)('%i%%에서 공제 후 0원 하한과 면세 구간 유지', withholdingPercentage => {
    expect(calcSimplifiedWithholdingTax({ monthlyTaxable: 769_999, dependents: 1, withholdingPercentage })).toBe(0)
    expect(calcSimplifiedWithholdingTax({ monthlyTaxable: 3_500_000, dependents: 4, childCount8to20: 3, withholdingPercentage })).toBe(0)
    // 가족 13명: 11명 초과 공제 적용 후 3,900원 → 비율 적용.
    expect(calcSimplifiedWithholdingTax({ monthlyTaxable: 3_500_000, dependents: 13, withholdingPercentage })).toBe(({80:3120,100:3900,120:4680})[withholdingPercentage])
  })
  it.each([0, 79, 81, 101, 121, -80, NaN, Infinity, null, '80'])('비율 %s는 조용히 100%%로 바꾸지 않는다', value => {
    expect(() => calculatePayrollTax({ monthlyGross: 3_500_000, withholdingPercentage: value as WithholdingPercentage })).toThrow('원천징수 비율')
  })
})

it('기존 공식 고정값은 생략 또는 명시적 100% 모두 유지한다', () => {
  for (const row of official.rows) {
    for (const [index, expected] of row.taxByFamily.entries()) {
      for (const withholdingPercentage of [undefined, 100] as const) {
        expect(calcSimplifiedWithholdingTax({ monthlyTaxable: row.minMonthly, dependents: index + 1, withholdingPercentage })).toBe(expected)
      }
    }
  }
  const input = { monthlyGross: 3_500_000, nonTaxable: 0, dependents: 1 }
  const original = calculatePayrollTax(input)
  expect(calculatePayrollTax({ ...input, withholdingPercentage: 100 })).toEqual(original)
  const salary = calculateSalary({ annualSalary: 42_000_000, nonTaxable: 0, dependents: 1 })
  expect(original.incomeTax).toBe(127_220)
  expect(salary.breakdown.incomeTax).toBe(127_220)
  for (const withholdingPercentage of WITHHOLDING_PERCENTAGES) {
    const selected = calculatePayrollTax({ ...input, withholdingPercentage })
    for (const key of ['nationalPension', 'healthInsurance', 'longTermCare', 'employment'] as const) {
      expect(selected[key]).toBe(original[key])
    }
  }
})

function click(view: ReturnType<typeof uiHarness>, label: string) {
  const button = view.nodes().find(node => node.type === 'button' && (Array.isArray(node.props.children) ? node.props.children.join('') : node.props.children) === label)
  expect(button, label).toBeDefined()
  ;(button!.props.onClick as () => void)()
}

it('빈 금액은 계산 보류, 세 비율 선택·결과 표시·변경 시 숨김', () => {
  const view = uiHarness(PayrollPage)
  expect(view.nodes().filter(n => n.type === 'input').map(n => n.props.value)).toEqual(['', ''])
  click(view, '세금 계산하기')
  expect(view.props('ResultHighlight')).toBeUndefined()
  view.change('monthlyGross', '3500000')
  click(view, '세금 계산하기')
  expect(view.props('ResultHighlight')).toBeUndefined()
  view.change('nonTaxable', '0')
  for (const percentage of [100, 80, 120]) {
    click(view, `${percentage}%`)
    const buttons = view.nodes().filter(n => n.type === 'button' && Array.isArray(n.props.children) && n.props.children[1] === '%')
    expect(buttons.map(n => n.props['aria-pressed'])).toEqual([80, 100, 120].map(p => p === percentage))
    expect(view.html().match(/aria-pressed="true"[^>]*>\d+%/g)).toHaveLength(1)
    if (percentage !== 100) {
      expect(view.props('ResultHighlight')).toBeUndefined()
      expect(view.props('BreakdownCard')).toBeUndefined()
      expect(visibleCopy(view.html())).toContain('다시 계산해 주세요')
    }
    click(view, '세금 계산하기')
    const text = visibleCopy(view.html())
    expect(text).toContain(`원천징수 ${percentage}%`)
    expect(identifiers(text)).toEqual([])
    expect(text).not.toContain('다시 계산해 주세요')
  }
  for (const invalid of ['', '-1', '1.5', 'abc']) {
    view.change('monthlyGross', invalid)
    click(view, '세금 계산하기')
    expect(view.props('ResultHighlight')).toBeUndefined()
  }
})

it('비율 변경은 입력 검증을 우회하지 않으며 현재 오류를 그대로 안내한다', () => {
  const view = uiHarness(PayrollPage)
  view.change('monthlyGross', '3500000')
  view.change('nonTaxable', '4000000')
  for (const percentage of WITHHOLDING_PERCENTAGES) {
    click(view, `${percentage}%`)
    click(view, '세금 계산하기')
    expect(view.props('ResultHighlight')).toBeUndefined()
    expect(identifiers(visibleCopy(view.html()))).toEqual([])
  }
})

it('자녀공제·0원·고소득 결과 문구와 가족 변경 시 초기화를 렌더로 확인한다', () => {
  const view = uiHarness(PayrollPage)
  view.change('monthlyGross', '3500000')
  view.change('nonTaxable', '0')
  click(view, '4명')
  const chooseChild = (count: number) => {
    const matches = view.nodes().filter(n => n.type === 'button' && Array.isArray(n.props.children) && n.props.children.join('') === `${count}명`)
    ;(matches.at(-1)!.props.onClick as () => void)()
  }
  for (const childCount of [2, 3]) {
    chooseChild(childCount)
    for (const percentage of WITHHOLDING_PERCENTAGES) {
      click(view, `${percentage}%`)
      click(view, '세금 계산하기')
      const text = visibleCopy(view.html())
      expect(text).toContain(`원천징수 ${percentage}%`)
      expect(identifiers(text)).toEqual([])
      const income = (view.props('BreakdownCard')!.items as {label:string,value:string}[]).find(i => i.label.startsWith('소득세'))
      expect(income?.value).toBe(childCount === 3 ? '0원' : ({80:'2,800원',100:'3,510원',120:'4,210원'})[percentage])
    }
  }
  click(view, '1명')
  expect(view.props('ResultHighlight')).toBeUndefined()
  view.change('monthlyGross', '10000029')
  click(view, '세금 계산하기')
  expect(identifiers(visibleCopy(view.html()))).toEqual([])
  expect(visibleCopy(view.html())).toContain('1,838,880원')
})
