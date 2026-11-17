'use client'

import { useState } from 'react'
import { useCalculationResult } from '@/hooks/useCalculationResult'
import { formatAmountInput, parseAmountInput } from '@/lib/amountInput'
import { calculateRetirementTax, type RetirementTaxResult, type RetirementProfile, type RetirementPayment } from '@/lib/retirementTax'
import { RETIREMENT_TAX_YEAR } from '@/lib/policy/retirementTax'
import { formatKRW } from '@/lib/salary'
import { InputCard, ResultHighlight, BreakdownCard } from './CalcCard'
import CalculationNotice from './CalculationNotice'

interface Props { grossPay: number; startDate: string; lastWorkingDate: string }

export default function RetirementTaxForm({ grossPay, startDate, lastWorkingDate }: Props) {
  const [profile, setProfile] = useState<RetirementProfile>('')
  const [payment, setPayment] = useState<RetirementPayment>('')
  const [nonTaxablePay, setNonTaxablePay] = useState('')
  const inputs = { grossPay, startDate, lastWorkingDate, profile, payment, nonTaxablePay }
  const { result, setResult, isStale } = useCalculationResult<RetirementTaxResult, typeof inputs>(inputs)
  const current = calculateRetirementTax({ ...inputs, nonTaxablePay: parseAmountInput(nonTaxablePay) })
  const buttonClass = (selected: boolean) => `rounded-lg border px-3 py-2 text-sm ${selected ? 'border-brand-600 bg-brand-50 font-bold text-brand-700' : 'border-slate-200 text-slate-600'}`

  return (
    <section aria-label="퇴직소득세와 실수령액" className="space-y-4">
      <InputCard title="세금·실수령액 계산 (선택)">
        <p className="hint">위에서 계산한 세전 퇴직금과 근무 기간을 사용합니다. {RETIREMENT_TAX_YEAR}년 일반 근로자의 단일 퇴직만 지원합니다.</p>
        <fieldset className="space-y-2">
          <legend className="label">대상 조건 확인</legend>
          <p id="retirement-profile-hint" className="hint">거주자 일반 근로자이며 중간정산·이전 퇴직소득 합산·근속기간 제외나 가산·세액공제나 감면이 없는 경우만 계산합니다. 임원·비거주자·공적연금·명예퇴직 등 특례는 지원하지 않습니다.</p>
          <div className="flex flex-wrap gap-2" aria-describedby="retirement-profile-hint">
            {([
              ['ordinary', '일반 근로자 · 특례 없음'],
              ['special', '특례 있음 / 잘 모르겠음'],
            ] as const).map(([value, label]) => (
              <button key={value} type="button" aria-pressed={profile === value} onClick={() => setProfile(value)} className={buttonClass(profile === value)}>{label}</button>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="retirementNonTaxable" className="label">비과세 퇴직소득 (없으면 0 입력)</label>
          <input id="retirementNonTaxable" type="text" inputMode="numeric" value={nonTaxablePay}
            placeholder="예: 0" className="input-field" aria-describedby="retirement-nontaxable-hint"
            onChange={e => setNonTaxablePay(formatAmountInput(e.target.value))} />
          <p id="retirement-nontaxable-hint" className="hint">단위: 원. 월급의 식대 등 비과세 수당이 아닙니다. 이번 퇴직금 중 회사가 비과세로 확인한 퇴직소득만 입력하세요.</p>
        </div>
        <fieldset className="space-y-2">
          <legend className="label">수령 방식</legend>
          <div className="flex flex-wrap gap-2">
            {([
              ['cash', '현금 일시금'], ['irp', 'IRP 전액 직접 이전'], ['other', '일부 이전 / 그 밖의 방식'],
            ] as const).map(([value, label]) => (
              <button key={value} type="button" aria-pressed={payment === value} onClick={() => setPayment(value)} className={buttonClass(payment === value)}>{label}</button>
            ))}
          </div>
          <p className="hint">현금 지급이 가능한 경우의 예상액이며 수령 자격은 판정하지 않습니다. IRP는 퇴직 시 전액 직접 이전만 지원합니다. 수령 후 재입금과 이후 인출 세금은 계산하지 않습니다.</p>
        </fieldset>
        {current.status === 'held' && <p role="status" className="text-sm text-slate-600">세금 계산 보류: {current.reason}</p>}
        <button type="button" disabled={current.status === 'held'} className="btn-primary w-full py-3"
          onClick={() => { if (current.status === 'calculated') setResult(current) }}>세금·실수령액 계산하기</button>
      </InputCard>
      <CalculationNotice isStale={isStale} />
      {result?.status === 'calculated' && (
        <div className="space-y-4" aria-live="polite">
          {result.payment === 'cash' ? (
            <>
              <ResultHighlight label="퇴직금 실수령 예상액" value={formatKRW(result.netPay)} subtitle="현금 일시금 · 소득세와 지방소득세 차감 후" />
              <BreakdownCard title="예상 공제 내역" items={[
                { label: '세전 퇴직금', value: formatKRW(result.grossPay) },
                { label: '퇴직소득세', value: formatKRW(result.incomeTax) },
                { label: '지방소득세', value: formatKRW(result.localTax) },
                { label: '총 공제액', value: formatKRW(result.totalTax), highlight: true },
              ]} />
              {result.smallTaxExemption && <p className="hint">원천징수세액이 1천원 미만이므로 소액부징수를 적용했습니다.</p>}
            </>
          ) : (
            <>
              <ResultHighlight label="IRP 계좌 입금 예상액" value={formatKRW(result.accountDeposit)} subtitle="현금 실수령액이 아닌 연금계좌 이전액" />
              <BreakdownCard title="이연 세액 (지금 차감하지 않음)" items={[
                { label: '이연 퇴직소득세', value: formatKRW(result.deferredIncomeTax) },
                { label: '이연 지방소득세', value: formatKRW(result.deferredLocalTax) },
              ]} />
              <p className="hint">세금 면제가 아니라 납부 이연입니다. 이후 연금 또는 일시금으로 인출할 때의 세금은 수령 조건에 따라 달라지며 여기서 계산하지 않습니다.</p>
            </>
          )}
          <details className="card p-5">
            <summary className="cursor-pointer font-semibold text-sm">세금 산정 과정 보기</summary>
            <div className="mt-4">
              <BreakdownCard title="공제·환산 내역" items={[
                { label: '세법상 근속연수', value: `${result.serviceYears}년` },
                { label: '비과세 퇴직소득', value: formatKRW(result.nonTaxablePay) },
                { label: '퇴직소득금액', value: formatKRW(result.taxableIncome) },
                { label: '근속연수공제', value: formatKRW(result.serviceDeduction) },
                { label: '환산급여', value: formatKRW(result.annualizedIncome) },
                { label: '환산급여공제', value: formatKRW(result.annualizedDeduction) },
                { label: '환산 과세표준', value: formatKRW(result.taxBase) },
                { label: '환산산출세액', value: formatKRW(result.annualizedTax) },
                { label: '퇴직소득 산출세액', value: formatKRW(result.assessedIncomeTax) },
              ]} />
            </div>
          </details>
          <p className="hint">기존 누적 0원 가정: 이전 퇴직급여와 기납부세액이 없는 단건 계산입니다. 세법상 근속연수는 입사일부터 마지막 근무일까지 계산하며, 세전 퇴직금의 재직일수 ÷ 365와 다릅니다.</p>
          <p className="hint">실제 세액과 이전액은 회사의 퇴직소득 원천징수영수증에서 확인하세요. <a className="underline" href="https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7880&mi=6600" target="_blank" rel="noopener noreferrer">국세청 계산 안내</a></p>
        </div>
      )}
    </section>
  )
}
