/**
 * src/app/payroll-tax-calculator/page.tsx
 * 급여 세금 간편 계산기
 */
'use client'

import { useState, useCallback } from 'react'
import { calculatePayrollTax, type PayrollTaxResult } from '@/lib/calculators'
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
  { href: '/salary-calculator', emoji: '💰', label: '실수령액 계산기', description: '연봉 기준 월 실수령액 계산' },
  { href: '/social-insurance-calculator', emoji: '🏥', label: '4대보험 계산기', description: '4대보험 항목별 상세 계산' },
  { href: '/severance-pay-calculator', emoji: '📦', label: '퇴직금 계산기', description: '근속기간별 퇴직금 산출' },
]

export default function PayrollTaxCalculatorPage() {
  const [monthlyGross, setMonthlyGross] = useState('')
  const [nonTaxable, setNonTaxable] = useState('')
  const [dependents, setDependents] = useState('1')
  const [result, setResult] = useState<PayrollTaxResult | null>(null)

  const handleCalc = useCallback(() => {
    const gross = parseNum(monthlyGross)
    if (!gross || gross < 100_000) return
    setResult(calculatePayrollTax({
      monthlyGross: gross,
      nonTaxable: parseNum(nonTaxable),
      dependents: Math.max(1, Number(dependents) || 1),
    }))
  }, [monthlyGross, nonTaxable, dependents])

  const grossNum = parseNum(monthlyGross)
  const isValid = grossNum >= 100_000

  return (
    <main className="flex-1 max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">급여 세금 간편 계산</h1>
      <p className="text-gray-500 mb-6">{TAX_YEAR}년 기준 · 월급여 기준 공제세금 빠른 확인</p>

      <AdSlot slotId="TOP_HORIZONTAL" format="horizontal" />

      <div className="mt-6 space-y-6">
        <InputCard title="월급여 정보 입력">
          <div>
            <label className="label">월 세전 급여 <span className="text-red-400">*</span></label>
            <div className="relative">
              <input
                type="text" inputMode="numeric"
                placeholder="예: 3,500,000"
                value={monthlyGross}
                onChange={(e) => setMonthlyGross(formatNum(e.target.value))}
                onKeyDown={(e) => e.key === 'Enter' && handleCalc()}
                className="input-field pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">원</span>
            </div>
            <p className="hint">월 세전 급여를 입력하세요 (최소 10만원)</p>
          </div>

          <div>
            <label className="label">월 비과세 금액 <span className="text-xs font-normal text-slate-400">(선택)</span></label>
            <div className="relative">
              <input
                type="text" inputMode="numeric"
                placeholder="예: 200,000"
                value={nonTaxable}
                onChange={(e) => setNonTaxable(formatNum(e.target.value))}
                onKeyDown={(e) => e.key === 'Enter' && handleCalc()}
                className="input-field pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">원/월</span>
            </div>
            <p className="hint">식대 등 비과세 항목 (4대보험·소득세 계산에서 제외)</p>
          </div>

          <div>
            <label className="label">부양가족 수 (본인 포함)</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n} type="button"
                  onClick={() => setDependents(String(n))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150 ${
                    dependents === String(n)
                      ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600'
                  }`}
                >
                  {n}명
                </button>
              ))}
            </div>
          </div>

          <button
            type="button" onClick={handleCalc} disabled={!isValid}
            className="btn-primary w-full py-3.5 text-base"
          >
            세금 계산하기
          </button>
        </InputCard>

        {result && (
          <div className="space-y-4 animate-slide-up">
            <ResultHighlight
              label="월 실수령액"
              value={formatKRW(result.monthlyNet)}
              subtitle={`월 세전 ${formatKRW(grossNum)} → 공제 ${formatKRW(result.totalDeduction)}`}
            />

            <BreakdownCard
              title="월 공제 내역"
              items={[
                { label: '국민연금 (4.75%)', value: formatKRW(result.nationalPension) },
                { label: '건강보험 (3.595%)', value: formatKRW(result.healthInsurance) },
                { label: '장기요양 (건보료×12.95%)', value: formatKRW(result.longTermCare) },
                { label: '고용보험 (0.9%)', value: formatKRW(result.employment) },
                { label: '소득세', value: formatKRW(result.incomeTax) },
                { label: '지방소득세 (소득세×10%)', value: formatKRW(result.localTax) },
                { label: '월 총 공제', value: `-${formatKRW(result.totalDeduction)}`, highlight: true, color: 'text-red-500' },
              ]}
            />

            <Disclaimer year={TAX_YEAR} />
          </div>
        )}

        <RelatedCalculators items={RELATED} />

        <div className="mt-10">
          <AdSlot slotId="MID_RECTANGLE" format="rectangle" />
        </div>

        {/* ── 가이드 콘텐츠 ─────────────────────────────────── */}
        <GuideSection
          title="월급에서 빠지는 세금, 어떻게 정해질까?"
          intro={
            <p>
              직장인 월급에서 공제되는 항목은 크게 <strong>4대보험</strong>과
              <strong> 소득세·지방소득세</strong> 두 묶음으로 나뉩니다. 4대보험은
              월급에 일정 비율로 부과되는 정률세 성격이고, 소득세는 연 소득을 기준으로
              누진세율이 적용되는 정률·정액 혼합 구조입니다. 회사는 매월 “간이세액표”
              또는 본 계산기와 같은 근사 산식을 적용해 세금을 미리 떼고(원천징수), 연말에
              실제 1년치 세금을 정산하는 연말정산 절차를 거칩니다.
            </p>
          }
          sections={[
            {
              heading: '원천징수와 연말정산의 관계',
              body: (
                <>
                  <p>
                    매월 떼는 소득세는 정확한 1년치 세금을 미리 알 수 없기 때문에
                    국세청이 정한 <strong>간이세액표</strong>를 기반으로 한 추정치입니다.
                    이를 “원천징수”라고 부르며, 그 해 12월까지의 모든 소득과 공제 항목을
                    합산해 다음 해 1~2월에 다시 계산하는 것이 “연말정산”입니다.
                  </p>
                  <p>
                    매월 떼인 세금이 실제 세금보다 많았다면 환급(13월의 월급)을 받고,
                    적었다면 추가 납부해야 합니다. 매월 공제액은 부양가족 수·간이세액
                    선택(80%·100%·120% 중) 등에 따라 달라지므로, 본 계산기는 평균치 기준
                    근사값입니다.
                  </p>
                </>
              ),
            },
            {
              heading: '비과세 항목 활용법',
              body: (
                <>
                  <p>
                    비과세 항목은 4대보험·소득세 계산 기준에서 제외되는 급여 항목입니다.
                    대표적으로 ① 월 20만원 한도 식대, ② 월 20만원 한도 차량유지비(본인
                    명의 차량으로 출퇴근), ③ 월 20만원 한도 육아수당(6세 이하 자녀),
                    ④ 생산직 근로자의 야간·휴일 수당(연 240만원 한도)이 있습니다.
                  </p>
                  <p>
                    예를 들어 월 식대 20만원이 비과세 처리되면 연 240만원의 과세표준이
                    줄어들어, 소득세율 15% 구간 근로자의 경우 약 36만원의 세금 절감
                    효과가 발생합니다. 또한 4대보험료도 함께 줄어 연간 약 25만원 추가
                    절감됩니다.
                  </p>
                </>
              ),
            },
            {
              heading: '부양가족 공제',
              body: (
                <p>
                  부양가족 1인당 연 150만원의 기본공제가 적용됩니다. 본인을 포함해
                  배우자, 직계존비속(부모·자녀), 형제자매 중 일정 요건을 충족하는
                  사람이 대상입니다. 부양가족 수가 늘어날수록 과세표준이 줄어 세금
                  부담이 낮아지는 효과가 큽니다. 다만 부양가족이 연 100만원 이상 소득이
                  있다면 공제 대상에서 제외되니, 가족의 아르바이트 소득 등을 미리
                  확인해야 합니다.
                </p>
              ),
            },
            {
              heading: '월 공제액과 연 실수령 차이',
              body: (
                <p>
                  본 계산기는 월별 평균 공제액을 보여주지만, 실제로는 매월 공제액이
                  조금씩 다를 수 있습니다. 회사가 100%가 아닌 80% 또는 120% 간이세액표를
                  적용하는 경우, 분기별 보너스가 있는 경우, 연말정산 결과를 매년 2월
                  급여에 반영하는 경우 등 다양한 변동 요인이 있습니다. 연 단위로 봤을
                  때의 실수령률(약 72~85%)은 본 계산기 결과와 일치합니다.
                </p>
              ),
            },
          ]}
          formula={{
            title: '월 공제 계산 흐름',
            description:
              '본 계산기는 월 세전 급여에서 비과세를 차감한 “월 과세급여”를 기준으로 각 보험료와 세금을 계산합니다.',
            items: [
              { label: '① 월 과세급여', value: '월 세전 급여 - 월 비과세 금액' },
              { label: '② 4대보험', value: '월 과세급여 × 각 보험 요율 (국민연금만 상·하한 적용)' },
              { label: '③ 소득세', value: '연 환산 과세급여 - 근로소득공제 - 기본공제 → 누진세율 적용 → 12로 나눔' },
              { label: '④ 지방소득세', value: '소득세 × 10%' },
              { label: '⑤ 월 실수령액', value: '월 세전 - (4대보험 + 소득세 + 지방소득세)' },
            ],
          }}
          referenceTable={{
            caption: '월급별 공제 합계 참고표',
            footnote:
              `${TAX_YEAR}년 요율 기준, 부양가족 1명·비과세 없음 가정. 실수령액은 회사 정책에 따라 다를 수 있습니다.`,
            headers: ['4대보험', '소득세+지방세', '월 실수령'],
            rows: [
              { label: '월 200만원', values: ['약 194,000원', '약 28,000원', '약 178만원'] },
              { label: '월 300만원', values: ['약 291,000원', '약 84,000원', '약 263만원'] },
              { label: '월 400만원', values: ['약 388,000원', '약 200,000원', '약 341만원'] },
              { label: '월 500만원', values: ['약 485,000원', '약 320,000원', '약 419만원'] },
              { label: '월 700만원', values: ['약 671,000원', '약 590,000원', '약 574만원'] },
              { label: '월 1,000만원', values: ['약 904,000원', '약 1,100,000원', '약 800만원'] },
            ],
          }}
          legalBasis={[
            { label: '소득세법 (근로소득공제, 세액공제 등)' },
            { label: '국민연금법, 국민건강보험법, 고용보험법' },
            { label: '지방세법 제103조 (지방소득세)' },
            {
              label: '국세청 홈택스 (간이세액표 조회)',
              href: 'https://www.hometax.go.kr',
            },
            {
              label: '국세청 연말정산 안내',
              href: 'https://www.nts.go.kr',
            },
          ]}
          disclaimer={
            <>
              본 계산기는 {TAX_YEAR}년 기준 간이 산식을 사용한 근사값입니다. 회사가
              적용하는 간이세액표 비율(80%·100%·120%), 추가 공제 신고(주택자금·기부금
              등), 회사 규정에 따라 실제 공제액과 차이가 발생할 수 있습니다. 정확한
              세액은 국세청 홈택스의 간이세액표 조회 또는 회사 인사담당부서에 문의하세요.
            </>
          }
        />

        <FaqAccordion
          items={[
            {
              q: '왜 매월 공제액이 조금씩 달라지나요?',
              a: '회사가 적용하는 간이세액표 비율, 분기별 보너스 지급, 연말정산 환급·추가납부 분할 반영, 비과세 항목 적용 시점 변동 등 여러 이유로 매월 공제액이 달라질 수 있습니다. 본 계산기는 “평균 월 공제액”을 보여주며, 1년치 기준으로는 실제와 거의 일치합니다.',
            },
            {
              q: '간이세액표 80%·100%·120% 중 어느 게 좋나요?',
              a: '입사 시 회사에 신고할 수 있는 옵션입니다. 80%를 선택하면 매월 떼이는 세금이 적어 월 실수령액이 많아지지만, 연말정산 시 추가 납부할 가능성이 커집니다. 120%는 반대로 매월 많이 떼이지만 환급액이 커집니다. “13월의 월급”을 원하면 120%, 매월 현금흐름이 중요하면 80%를 선택하는 것이 일반적입니다. 별도 신고하지 않으면 기본값은 100%입니다.',
            },
            {
              q: '비과세 식대 20만원은 어디서 적용되나요?',
              a: '회사가 급여명세서에 “식대 200,000원(비과세)”로 별도 명시해야 적용됩니다. 단순히 기본급에 식대가 포함되어 있다면 비과세 처리가 되지 않습니다. 새로 입사한 경우 인사담당자에게 식대 비과세 처리 가능 여부를 확인하고, 가능하다면 별도 항목으로 분리 요청하면 좋습니다.',
            },
            {
              q: '부양가족은 어떤 사람이 대상인가요?',
              a: '본인을 포함해 ① 배우자(소득 없는 경우), ② 60세 이상 직계존속(부모·조부모), ③ 20세 이하 직계비속(자녀), ④ 만 20세 이하 또는 60세 이상 형제자매 등이 대상입니다. 다만 부양가족이 연 100만원 이상의 소득이 있다면 공제 대상에서 제외되니, 자녀 아르바이트 소득 등을 미리 확인해야 합니다.',
            },
            {
              q: '연말정산 환급금은 언제 받나요?',
              a: '대부분 회사가 매년 2월 또는 3월 급여에 환급금을 함께 지급합니다. 회사마다 다를 수 있으니 인사담당부서에 확인하세요. 만약 연말정산 결과 추가 납부해야 한다면 같은 시기에 차감되며, 금액이 큰 경우 분할 납부가 가능합니다.',
            },
            {
              q: '4대보험과 소득세 중 어느 게 더 많이 떼나요?',
              a: '연봉 5,000만원 미만 구간에서는 4대보험 부담이 소득세보다 큽니다. 4대보험은 월급의 약 9%로 정률 부과되는 반면, 소득세는 누진세율이 적용되어 연봉 4,000만원 미만은 실효세율 3% 내외에 불과합니다. 연봉이 7,000만원을 넘으면 소득세 부담이 4대보험을 추월하기 시작하며, 1억원 이상에서는 소득세가 훨씬 큽니다.',
            },
            {
              q: '실수령액을 늘리는 방법이 있나요?',
              a: '① 비과세 항목 최대 활용(식대 20만원·차량유지비 20만원), ② 부양가족 등록 확인(소득 없는 부모·자녀), ③ IRP/연금저축으로 세액공제(연 700만원 한도, 최대 115.5만원 환급), ④ 의료비·교육비·기부금 영수증 챙기기, ⑤ 무주택자라면 월세·전세 자금 대출 공제 활용 등이 효과적입니다.',
            },
            {
              q: '회사가 임의로 공제 항목을 늘려도 되나요?',
              a: '아니요. 회사는 법정 항목(4대보험·소득세·지방소득세) 외에는 근로자의 동의 없이 임의로 임금을 공제할 수 없습니다(근기법 제43조). 회사 부담분 보험료를 근로자에게 떠넘기거나, 회사 잘못으로 인한 손해를 임의 공제하는 것은 위법입니다. 부당 공제는 고용노동부에 진정할 수 있습니다.',
            },
          ]}
        />

        <div className="mt-10">
          <AdSlot slotId="BOTTOM_HORIZONTAL" format="horizontal" />
        </div>
      </div>
    </main>
  )
}
