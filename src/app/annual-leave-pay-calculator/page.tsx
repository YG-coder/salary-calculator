/**
 * src/app/annual-leave-pay-calculator/page.tsx
 * 연차수당 계산기
 */
'use client'

import { useState, useCallback } from 'react'
import { calculateAnnualLeavePay, calculateAnnualLeaveDays, type AnnualLeavePayResult } from '@/lib/calculators'
import { formatKRW } from '@/lib/salary'
import { TAX_YEAR } from '@/lib/constants'
import { InputCard, ResultHighlight, BreakdownCard, Disclaimer } from '@/components/calculator/CalcCard'
import RelatedCalculators from '@/components/calculator/RelatedCalculators'
import GuideSection from '@/components/calculator/GuideSection'
import FaqAccordion from '@/components/calculator/FaqAccordion'
import AdSlot from '@/components/ui/AdSlot'

function formatNum(v: string) {
  const n = v.replace(/[^0-9]/g, '')
  if (!n) return ''
  return Number(n).toLocaleString('ko-KR')
}
function parseNum(v: string) { return Number(v.replace(/[^0-9]/g, '')) || 0 }

const RELATED = [
  { href: '/weekly-holiday-pay-calculator', emoji: '📅', label: '주휴수당 계산기', description: '주 15시간 이상 근무 시 주휴수당' },
  { href: '/severance-pay-calculator', emoji: '📦', label: '퇴직금 계산기', description: '근속기간별 퇴직금 산출' },
  { href: '/salary-calculator', emoji: '💰', label: '실수령액 계산기', description: '연봉 기준 월 실수령액' },
]

export default function AnnualLeavePayCalculatorPage() {
  const [mode, setMode] = useState<'direct' | 'calc'>('direct')
  const [dailyWage, setDailyWage] = useState('')
  const [unusedDays, setUnusedDays] = useState('')
  // 일당 계산용
  const [monthlyWage, setMonthlyWage] = useState('')
  const [workingYears, setWorkingYears] = useState('1')
  const [result, setResult] = useState<AnnualLeavePayResult | null>(null)
  const [annualDays, setAnnualDays] = useState<number | null>(null)

  const computedDailyWage = mode === 'calc'
    ? Math.floor(parseNum(monthlyWage) / 30 * 12 / 365)
    : parseNum(dailyWage)

  const handleCalc = useCallback(() => {
    const dw = computedDailyWage
    const ud = parseNum(unusedDays)
    if (!dw || !ud) return
    setResult(calculateAnnualLeavePay({ dailyWage: dw, unusedDays: ud }))
    setAnnualDays(calculateAnnualLeaveDays(Number(workingYears)))
  }, [computedDailyWage, unusedDays, workingYears])

  const isValid = computedDailyWage > 0 && parseNum(unusedDays) > 0

  return (
    <main className="flex-1 max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">연차수당 계산기</h1>
      <p className="text-gray-500 mb-6">{TAX_YEAR}년 기준 · 미사용 연차수당 계산</p>

      <AdSlot slotId="TOP_HORIZONTAL" format="horizontal" />

      <div className="mt-6 space-y-6">
        <InputCard title="연차 정보 입력">
          {/* 입력 방식 선택 */}
          <div>
            <label className="label">1일 통상임금 입력 방식</label>
            <div className="flex gap-2">
              {[
                { value: 'direct', label: '직접 입력' },
                { value: 'calc', label: '월급으로 계산' },
              ].map((opt) => (
                <button
                  key={opt.value} type="button"
                  onClick={() => setMode(opt.value as 'direct' | 'calc')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    mode === opt.value
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {mode === 'direct' ? (
            <div>
              <label className="label">1일 통상임금 <span className="text-red-400">*</span></label>
              <div className="relative">
                <input
                  type="text" inputMode="numeric"
                  placeholder="예: 80,000"
                  value={dailyWage}
                  onChange={(e) => setDailyWage(formatNum(e.target.value))}
                  className="input-field pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">원</span>
              </div>
              <p className="hint">급여명세서의 1일 통상임금을 입력하세요</p>
            </div>
          ) : (
            <div>
              <label className="label">월 통상임금 <span className="text-red-400">*</span></label>
              <div className="relative">
                <input
                  type="text" inputMode="numeric"
                  placeholder="예: 2,500,000"
                  value={monthlyWage}
                  onChange={(e) => setMonthlyWage(formatNum(e.target.value))}
                  className="input-field pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">원</span>
              </div>
              {parseNum(monthlyWage) > 0 && (
                <p className="hint text-brand-600">
                  계산된 1일 통상임금: {formatKRW(Math.floor(parseNum(monthlyWage) / 30 * 12 / 365))}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="label">미사용 연차 일수 <span className="text-red-400">*</span></label>
            <div className="relative">
              <input
                type="text" inputMode="numeric"
                placeholder="예: 10"
                value={unusedDays}
                onChange={(e) => setUnusedDays(formatNum(e.target.value))}
                className="input-field pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">일</span>
            </div>
          </div>

          <div>
            <label className="label">근속 기간</label>
            <div className="flex flex-wrap gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '10'].map((y) => (
                <button
                  key={y} type="button"
                  onClick={() => setWorkingYears(y)}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
                    workingYears === y
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
                  }`}
                >
                  {y}년
                </button>
              ))}
            </div>
            <p className="hint">
              근속 {workingYears}년 기준 법정 연차: {calculateAnnualLeaveDays(Number(workingYears))}일
            </p>
          </div>

          <button
            type="button" onClick={handleCalc} disabled={!isValid}
            className="btn-primary w-full py-3.5 text-base"
          >
            연차수당 계산하기
          </button>
        </InputCard>

        {result && (
          <div className="space-y-4 animate-slide-up">
            <ResultHighlight
              label="연차수당"
              value={formatKRW(result.annualLeavePay)}
              subtitle={`미사용 ${unusedDays}일 × 1일 ${formatKRW(result.perDayAmount)}`}
              color="#0284c7"
            />

            <BreakdownCard
              title="계산 내역"
              items={[
                { label: '1일 통상임금', value: formatKRW(result.perDayAmount) },
                { label: '미사용 연차 일수', value: `${parseNum(unusedDays)}일` },
                { label: `법정 연차 (근속 ${workingYears}년)`, value: `${annualDays ?? 0}일` },
                { label: '연차수당 합계', value: formatKRW(result.annualLeavePay), highlight: true, color: 'text-brand-700' },
              ]}
            />

            <div className="card p-5 bg-sky-50 border-sky-100">
              <h3 className="text-sm font-bold text-sky-800 mb-2">연차 일수 기준 (근로기준법)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-sky-700">
                  <thead><tr className="font-semibold"><th className="text-left py-1">근속기간</th><th className="text-right py-1">연차 일수</th></tr></thead>
                  <tbody>
                    {[1,2,3,4,5,6,7,10].map((y) => (
                      <tr key={y} className={workingYears === String(y) ? 'font-bold text-sky-900' : ''}>
                        <td className="py-0.5">{y}년</td>
                        <td className="text-right">{calculateAnnualLeaveDays(y)}일</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Disclaimer year={TAX_YEAR} extra="통상임금 산정 방식, 회사 내규에 따라 실제 금액이 달라질 수 있습니다." />
          </div>
        )}

        <div className="mt-10">
          <AdSlot slotId="MID_RECTANGLE" format="rectangle" />
        </div>

        {/* ── 가이드 콘텐츠 ─────────────────────────────────── */}
        <GuideSection
          title="연차수당이란?"
          intro={
            <p>
              연차수당은 근로자가 1년 동안 부여받은 연차유급휴가 중 사용하지 못한 일수에
              대해 사용자가 지급하는 임금입니다. 「근로기준법」 제60조에 따라 1년간 80%
              이상 출근한 근로자에게는 15일의 유급휴가가 부여되며, 사용하지 못한 연차에
              대해서는 통상임금 또는 평균임금을 기준으로 보상받을 권리가 있습니다.
              연차수당은 임금에 해당하므로 임의 포기가 원칙적으로 불가능하며, 미지급 시
              임금체불로 신고할 수 있습니다.
            </p>
          }
          sections={[
            {
              heading: '법정 연차 일수',
              body: (
                <>
                  <p>
                    근로기준법 제60조는 근속연수별 연차 일수를 다음과 같이 정합니다.
                    1년 미만 신규 입사자는 1개월 개근 시 1일씩, 최대 11일까지 발생합니다.
                    1년 이상~2년 차에는 15일, 이후 매 2년마다 1일씩 추가되어 최대 25일까지
                    부여됩니다.
                  </p>
                  <p>
                    예를 들어 근속 3년 차는 16일, 5년 차는 17일, 10년 차는 19일, 21년 차
                    이상은 상한선인 25일을 받습니다. 단, 1년간 출근율이 80% 미만이면
                    개근한 월수만큼만 부여됩니다.
                  </p>
                </>
              ),
            },
            {
              heading: '연차사용촉진제도',
              body: (
                <>
                  <p>
                    근로기준법 제61조의 연차사용촉진제도는 사용자가 적극적으로 연차 사용을
                    독려한 경우 미사용 연차에 대한 수당 지급 의무를 면제하는 제도입니다.
                    사용자가 다음 절차를 모두 이행하면 수당을 지급하지 않아도 됩니다.
                  </p>
                  <p>
                    ① 연차 사용 만료 6개월 전, 근로자별 잔여 연차 일수를 서면으로 통지하고
                    사용 시기 지정을 촉구. ② 근로자가 10일 이내에 사용 시기를 지정하지
                    않으면, 사용자가 2개월 전까지 사용 시기를 지정해 서면 통보.
                    이 절차를 빠뜨리거나 서면이 아닌 구두로만 진행했다면 수당 지급 의무는
                    그대로 유지됩니다.
                  </p>
                </>
              ),
            },
            {
              heading: '통상임금과 평균임금',
              body: (
                <p>
                  연차수당은 원칙적으로 <strong>통상임금</strong>(기본급 + 정기적·일률적
                  수당)을 기준으로 산정합니다. 다만 회사 규정에서 평균임금을 적용한다고
                  명시했거나, 노사 합의가 있는 경우에는 평균임금을 사용할 수 있습니다.
                  통상임금에는 식대·교통비 등 정기적으로 지급되는 수당이 포함되며, 일회성
                  성과급은 제외됩니다. 본 계산기는 입력한 1일 통상임금을 그대로 적용합니다.
                </p>
              ),
            },
            {
              heading: '연차수당의 소멸과 청구권',
              body: (
                <p>
                  연차 사용권은 발생일로부터 1년이 지나면 소멸하지만, 그 시점에 미사용
                  연차에 대한 <strong>수당 청구권</strong>이 새로 발생합니다. 이 수당
                  청구권은 임금채권이므로 발생일로부터 3년 안에 행사하지 않으면 시효로
                  소멸합니다(근기법 제49조). 따라서 퇴직 시 미정산 연차수당이 있다면
                  반드시 3년 이내에 청구해야 합니다.
                </p>
              ),
            },
          ]}
          formula={{
            title: '연차수당 계산 공식',
            description: (
              <>
                연차수당은 1일 통상임금에 미사용 연차 일수를 곱해 산정합니다. 통상임금이
                월급 형태로 지급되는 경우 1일 통상임금은 월 통상임금 ÷ 209시간(법정
                월 소정근로시간) × 8시간으로 환산하는 것이 정확합니다.
              </>
            ),
            items: [
              { label: '연차수당', value: '1일 통상임금 × 미사용 연차 일수' },
              { label: '1일 통상임금', value: '시간당 통상임금 × 8시간' },
              { label: '시간당 통상임금', value: '월 통상임금 ÷ 209시간 (월 소정근로 209시간 기준)' },
              { label: '209시간 근거', value: '(주 40시간 + 주휴 8시간) × 4.345주 ≒ 209시간' },
            ],
          }}
          referenceTable={{
            caption: '근속연수별 법정 연차 일수',
            footnote:
              '근로기준법 제60조 기준. 1년 미만은 1개월 개근당 1일(최대 11일), 21년 차부터는 상한 25일이 적용됩니다.',
            headers: ['연차 일수', '수당 환산 (1일 8만원 가정)'],
            rows: [
              { label: '입사 1년 미만', values: ['최대 11일', '약 88만원'] },
              { label: '근속 1~2년', values: ['15일', '120만원'] },
              { label: '근속 3~4년', values: ['16일', '128만원'] },
              { label: '근속 5~6년', values: ['17일', '136만원'] },
              { label: '근속 10년', values: ['19일', '152만원'] },
              { label: '근속 15년', values: ['22일', '176만원'] },
              { label: '근속 21년 이상', values: ['25일 (상한)', '200만원'] },
            ],
          }}
          legalBasis={[
            { label: '근로기준법 제60조 (연차 유급휴가)' },
            { label: '근로기준법 제61조 (연차 유급휴가의 사용 촉진)' },
            { label: '근로기준법 제49조 (임금의 시효)' },
            {
              label: '고용노동부 근로기준 안내',
              href: 'https://www.moel.go.kr',
            },
          ]}
          disclaimer={
            <>
              본 계산기는 {TAX_YEAR}년 기준 법정 산식에 따른 근사값을 제공합니다. 실제
              연차수당은 통상임금 산정 항목의 범위, 연차사용촉진제도 시행 여부, 회사
              취업규칙에 따라 달라질 수 있습니다. 분쟁이 있다면 노무사 또는 고용노동부에
              상담하세요.
            </>
          }
        />

        <FaqAccordion
          items={[
            {
              q: '입사 1년 미만에도 연차수당을 받을 수 있나요?',
              a: '네. 1년 미만 근로자는 매월 개근하면 1일의 연차가 발생하여 최대 11일까지 부여됩니다. 사용하지 않은 채 퇴사하거나 1년이 경과하면 미사용 연차에 대한 수당을 받을 수 있습니다. 다만 회사가 연차사용촉진을 적법하게 시행한 경우에는 수당 지급 의무가 면제될 수 있습니다.',
            },
            {
              q: '연차사용촉진을 받았는데 수당을 받을 수 없나요?',
              a: '연차사용촉진제도가 모든 절차를 적법하게 거쳤다면 미사용 연차에 대한 수당 지급 의무가 면제됩니다. 다만 서면(이메일·문서) 통지가 아닌 구두 통지였거나, 사용 시기를 지정해주지 않았거나, 휴가 사용을 실질적으로 방해했다면 촉진 절차가 무효이며 수당을 청구할 수 있습니다.',
            },
            {
              q: '퇴사할 때 남은 연차는 모두 수당으로 받을 수 있나요?',
              a: '네. 퇴사 시점까지 사용하지 못한 모든 연차는 통상임금 기준으로 수당화되어 지급됩니다. 회사가 14일 이내에 지급하지 않으면 임금체불에 해당하며, 미지급분에는 연 20%의 지연이자가 가산됩니다. 또한 임금채권 시효는 3년이므로 그 기간 내에 청구해야 합니다.',
            },
            {
              q: '시간제·아르바이트도 연차수당을 받을 수 있나요?',
              a: '4주 평균 주 15시간 이상 근무하는 단시간 근로자는 통상근로자에 비례한 연차가 부여됩니다. 예를 들어 주 30시간 근무자는 통상근로자의 75%(30/40)에 해당하는 연차를 받습니다. 1년 이상 근무했다면 미사용 연차에 대해 수당을 청구할 수 있습니다.',
            },
            {
              q: '연차수당에도 세금이 부과되나요?',
              a: '연차수당은 근로소득에 해당하므로 일반 급여와 동일하게 소득세와 4대보험이 부과됩니다. 다만 퇴직 시 일시에 지급되는 연차수당은 평균임금 산정 기초에 포함되어 퇴직금에도 영향을 줍니다(직전 1년 연차수당의 3/12).',
            },
            {
              q: '연차를 회계연도 기준으로 부여하는 회사는 어떻게 되나요?',
              a: '많은 회사가 입사일 대신 회계연도(1월 1일~12월 31일) 기준으로 연차를 운영합니다. 이 경우 입사 첫해는 입사일부터 연말까지 비례 연차가 부여되고, 다음 해 1월 1일에 일괄 15일이 부여됩니다. 단, 회계연도 운영 시에도 근로자에게 불리한 결과가 생기지 않도록, 입사일 기준 연차 발생일수와 비교해 더 많은 쪽으로 인정해야 합니다.',
            },
            {
              q: '병가나 출산휴가도 출근율 80%에 포함되나요?',
              a: '네. 업무상 부상·질병으로 인한 휴업기간, 출산 전후 휴가, 육아휴직 기간은 출근한 것으로 간주됩니다. 따라서 출산휴가나 육아휴직을 사용해도 80% 출근율 요건을 충족할 수 있으며, 정상적으로 연차가 부여됩니다(근기법 제60조 제6항).',
            },
            {
              q: '연차수당과 통상임금에 식대가 포함되나요?',
              a: '정기적·일률적으로 지급되는 식대(예: 매월 동일 금액의 식대 보조)는 통상임금에 포함됩니다. 따라서 연차수당 계산 시에도 기본급뿐 아니라 식대 등 정기 수당을 합산한 통상임금을 기준으로 해야 합니다. 다만 일회성 식권이나 사내 식당 운영비 형태라면 통상임금에서 제외될 수 있습니다.',
            },
          ]}
        />

        <RelatedCalculators items={RELATED} />

        <AdSlot slotId="BOTTOM_HORIZONTAL" format="horizontal" />
      </div>
    </main>
  )
}
