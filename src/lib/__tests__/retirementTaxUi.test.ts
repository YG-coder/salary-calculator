import { expect, it } from 'vitest'
import RetirementTaxForm from '@/components/calculator/RetirementTaxForm'
import SeverancePage from '@/app/severance-pay-calculator/page'
import { uiHarness, identifiers, visibleCopy } from '../uiHarness.test-support'

const props = { grossPay: 50_000_000, startDate: '2017-01-01', lastWorkingDate: '2026-12-31' }
type View = ReturnType<typeof uiHarness>
function click(view: View, label: string) {
  const node = view.nodes().find(n => n.type === 'button' && n.props.children === label)
  expect(node, label).toBeDefined()
  ;(node!.props.onClick as () => void)()
}
const calculate = (view: View) => click(view, '세금·실수령액 계산하기')
function prepare(view: View, payment = '현금 일시금') {
  click(view, '일반 근로자 · 특례 없음')
  view.change('retirementNonTaxable', '0')
  click(view, payment)
}
const copy = (view: View) => visibleCopy(view.html())

it('금액은 빈칸, 필수 선택은 미선택; 미입력을 0으로 계산하지 않는다', () => {
  const view = uiHarness(() => RetirementTaxForm(props))
  expect(view.nodes().filter(n => n.type === 'input').map(n => n.props.value)).toEqual([''])
  expect(view.nodes().filter(n => n.type === 'button' && n.props['aria-pressed'])).toHaveLength(0)
  calculate(view)
  expect(view.props('ResultHighlight')).toBeUndefined()
  click(view, '일반 근로자 · 특례 없음')
  click(view, '현금 일시금')
  calculate(view)
  expect(copy(view)).toContain('없으면 0을 직접 입력')
  expect(view.props('ResultHighlight')).toBeUndefined()
  view.change('retirementNonTaxable', '0')
  calculate(view)
  expect(view.props('ResultHighlight')).toMatchObject({ label:'퇴직금 실수령 예상액', value:'49,252,000원' })
  expect(copy(view)).toContain('기존 누적 0원 가정')
})

it('각 선택군에서 선택한 버튼만 aria-pressed=true, 수령 방식 변경은 이전 결과를 숨긴다', () => {
  const view = uiHarness(() => RetirementTaxForm(props))
  prepare(view)
  calculate(view)
  for (const label of ['IRP 전액 직접 이전','일부 이전 / 그 밖의 방식','현금 일시금']) {
    click(view,label)
    expect(view.props('ResultHighlight')).toBeUndefined()
    const buttons = view.nodes().filter(n => n.type==='button' && typeof n.props['aria-pressed']==='boolean')
    expect(buttons.map(n => n.props['aria-pressed'])).toEqual([true,false,...['현금 일시금','IRP 전액 직접 이전','일부 이전 / 그 밖의 방식'].map(x => x===label)])
    expect(view.html().match(/aria-pressed="true"/g)).toHaveLength(2)
    calculate(view)
    if (label === 'IRP 전액 직접 이전') {
      expect(view.props('ResultHighlight')).toMatchObject({label:'IRP 계좌 입금 예상액',value:'50,000,000원'})
      expect(copy(view)).toContain('이연 세액')
      expect(copy(view)).toContain('세금 면제가 아니라 납부 이연')
      expect(copy(view)).not.toContain('퇴직금 실수령 예상액')
    } else if (label === '일부 이전 / 그 밖의 방식') {
      expect(view.props('ResultHighlight')).toBeUndefined()
      expect(view.props('BreakdownCard')).toBeUndefined()
      expect(copy(view)).toContain('계산을 보류')
    }
  }
  click(view,'특례 있음 / 잘 모르겠음')
  calculate(view)
  expect(view.props('ResultHighlight')).toBeUndefined()
  const profileButtons=view.nodes().filter(n=>n.type==='button'&&typeof n.props['aria-pressed']==='boolean').slice(0,2)
  expect(profileButtons.map(n=>n.props['aria-pressed'])).toEqual([false,true])
})

it('비과세 변경·부모의 금액과 날짜 변경은 이전 세금 결과를 숨긴다', () => {
  const input = {...props}
  const view = uiHarness(() => RetirementTaxForm(input))
  prepare(view); calculate(view)
  view.change('retirementNonTaxable','1000000')
  expect(view.props('ResultHighlight')).toBeUndefined()
  calculate(view)
  input.grossPay = 60_000_000
  expect(view.props('ResultHighlight')).toBeUndefined()
  calculate(view)
  input.startDate = '2018-01-01'
  expect(view.props('ResultHighlight')).toBeUndefined()
  calculate(view)
  input.lastWorkingDate = '2026-12-30'
  expect(view.props('ResultHighlight')).toBeUndefined()
})

it('미지원·미입력·잘못된 입력의 모든 조합에 금액 결과나 내부 식별자를 노출하지 않는다', () => {
  for (const profile of [null,'일반 근로자 · 특례 없음','특례 있음 / 잘 모르겠음']) {
    for (const payment of [null,'현금 일시금','IRP 전액 직접 이전','일부 이전 / 그 밖의 방식']) {
      for (const amount of ['', '0', '1', '-1', '1.5', '50000001']) {
        const view=uiHarness(()=>RetirementTaxForm(props))
        if(profile)click(view,profile)
        if(payment)click(view,payment)
        view.change('retirementNonTaxable',amount)
        calculate(view)
        const supported=profile==='일반 근로자 · 특례 없음' &&
          ((payment==='현금 일시금' && ['0','1'].includes(amount)) || (payment==='IRP 전액 직접 이전' && amount==='0'))
        if(!supported){
          expect(view.props('ResultHighlight')).toBeUndefined()
          expect(view.props('BreakdownCard')).toBeUndefined()
          expect(copy(view)).toContain('세금 계산 보류')
        }
        expect(identifiers(copy(view))).toEqual([])
      }
    }
  }
  for (const lastWorkingDate of ['2027-01-01','2026-02-29','']) {
    const view=uiHarness(()=>RetirementTaxForm({...props,lastWorkingDate}))
    prepare(view);calculate(view)
    expect(view.props('ResultHighlight')).toBeUndefined()
    expect(identifiers(copy(view))).toEqual([])
  }
})

it('정당한 0원 세액·소액부징수는 보류와 구분하고 조건 변경 시 과거 안내도 숨긴다', () => {
  const input={...props,startDate:'2015-01-01',grossPay:28_041_665}
  const view=uiHarness(()=>RetirementTaxForm(input))
  prepare(view);calculate(view)
  expect(view.props('ResultHighlight')).toMatchObject({value:'28,041,665원'})
  expect(copy(view)).toContain('소액부징수를 적용')
  expect(identifiers(copy(view))).toEqual([])
  click(view,'특례 있음 / 잘 모르겠음')
  expect(copy(view)).not.toContain('소액부징수를 적용')
  expect(view.props('ResultHighlight')).toBeUndefined()
  click(view,'일반 근로자 · 특례 없음')
  input.grossPay=20_000_000
  calculate(view)
  expect(view.props('ResultHighlight')).toMatchObject({value:'20,000,000원'})
  expect(copy(view)).toContain('0원')
  expect(copy(view)).not.toContain('세금 계산 보류')
  expect(copy(view)).not.toContain('소액부징수를 적용')
})

it('기존 세전 계산은 세금 선택 없이 유지되고 계산 당시 값만 세금 폼에 전달한다', () => {
  const view=uiHarness(SeverancePage)
  expect(view.props('RetirementTaxForm')).toBeUndefined()
  view.change('startDate','2017-01-01')
  view.change('lastWorkingDate','2026-12-31')
  for(const label of ['3개월 전 급여','2개월 전 급여','1개월 전 급여 (최근)']){
    const field=view.nodes().find(n=>n.props['aria-label']===`최근 3개월 월 급여 — ${label}`)!
    ;(field.props.onChange as (e:unknown)=>void)({target:{value:'3000000'}})
  }
  for(const id of ['bonus','annualLeaveAllowance'])view.change(id,'0')
  view.change('ordinaryDailyWage','100000')
  click(view,'퇴직금 계산하기')
  expect(view.props('ResultHighlight')).toMatchObject({label:'세전 퇴직금 예상액',value:'30,016,438원'})
  expect(view.props('RetirementTaxForm')).toEqual({grossPay:30_016_438,startDate:'2017-01-01',lastWorkingDate:'2026-12-31'})
  expect(identifiers(copy(view))).toEqual([])
  view.change('lastWorkingDate','2026-12-30')
  expect(view.props('RetirementTaxForm')).toBeUndefined()
  view.change('startDate','2026-12-01')
  click(view,'퇴직금 계산하기')
  expect(view.props('RetirementTaxForm')).toBeUndefined()
  expect(copy(view)).toContain('퇴직금 지급 요건 미충족')
})
