import { expect, it, vi } from 'vitest'
import { uiHarness, identifiers, visibleCopy } from '../uiHarness.test-support'
import { parseAmountInput, formatAmountInput } from '../amountInput'
import { withParticle } from '../korean'
import { readdirSync } from 'node:fs'
vi.mock('next/navigation',()=>({useSearchParams:()=>new URLSearchParams(),usePathname:()=>'/salary-calculator'}))
import CalculatorForm from '@/components/calculator/CalculatorForm'
import BonusForm from '@/components/calculator/BonusForm'
it('blank and malformed amounts cannot become zero or a different amount',()=>{
 for(const value of ['', '-1000','1.5','1e5','abc123','9007199254740992'])expect(parseAmountInput(value)).toBeNaN()
 expect(parseAmountInput('0')).toBe(0);expect(parseAmountInput('1,000')).toBe(1000)
 expect(formatAmountInput('-1000')).toBe('-1000');expect(formatAmountInput('1.5')).toBe('1.5')
})
it('salary requires explicit non-taxable amount; changing inputs hides result',()=>{
 const view=uiHarness(CalculatorForm);view.change('annualSalary','40000000')
 const calculate=()=>{const n=view.nodes().find(n=>n.type==='button'&&String(n.props.children).includes('실수령액 계산'));expect(n).toBeDefined();(n!.props.onClick as ()=>void)()}
 calculate();expect(view.props('ResultCard')).toBeUndefined()
 view.change('nonTaxable','0');calculate();expect(view.props('ResultCard')).toBeDefined()
 view.change('annualSalary','50000000');expect(view.props('ResultCard')).toBeUndefined()
})
it('selected family toggles expose their state',()=>{
 const view=uiHarness(CalculatorForm)
 const buttons=()=>view.nodes().filter(n=>n.type==='button'&&typeof n.props['aria-pressed']==='boolean')
 expect(buttons().filter(n=>n.props['aria-pressed'])).toHaveLength(2)
 const third=buttons()[2];(third.props.onClick as ()=>void)()
 expect(buttons()[2].props['aria-pressed']).toBe(true);expect(buttons()[0].props['aria-pressed']).toBe(false)
})
it('form and calculator initial text does not leak internal identifiers',async()=>{
 const paths=['CalculatorForm','ReverseCalculatorForm','ComparisonForm','EmployerCostForm','BonusForm']
 for(const name of paths){const {default:C}=await import(`../../components/calculator/${name}.tsx`);expect(identifiers(visibleCopy(uiHarness(C).html())),name).toEqual([])}
 for(const dir of readdirSync('src/app').filter(x=>['severance-pay-calculator','annual-leave-pay-calculator','social-insurance-calculator','payroll-tax-calculator','weekly-holiday-pay-calculator','unemployment-benefit-calculator'].includes(x))){const {default:C}=await import(`../../app/${dir}/page.tsx`);expect(identifiers(visibleCopy(uiHarness(C).html())),dir).toEqual([])}
 expect(uiHarness(BonusForm).html()).not.toContain('value="6,000,000"')
})
it('particles follow consonants',()=>{expect(withParticle('급여','을/를')).toBe('급여를');expect(withParticle('금액','을/를')).toBe('금액을')})
