/**
 * src/app/weekly-holiday-pay-calculator/page.tsx
 * 주휴수당 계산기
 */
'use client'

import { useState, useCallback } from 'react'
import { calculateWeeklyHolidayPay, type WeeklyHolidayPayResult } from '@/lib/calculators'
import { formatKRW } from '@/lib/salary'
import { TAX_YEAR, MIN_HOURLY_WAGE_2026 } from '@/lib/constants'
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

// 2026년 최저시급 (상수 모듈 사용)
const MIN_HOURLY_WAGE = MIN_HOURLY_WAGE_2026

const RELATED = [
  { href: '/annual-leave-pay-calculator', emoji: '🏖️', label: '연차수당 계산기', description: '미사용 연차수당 계산' },
  { href: '/salary-calculator', emoji: '💰', label: '실수령액 계산기', description: '연봉 기준 월 실수령액' },
  { href: '/payroll-tax-calculator', emoji: '🧾', label: '급여 세금 간편 계산', description: '월급 세금 빠른 확인' },
]

export default function WeeklyHolidayPayCalculatorPage() {
  const [weeklyHours, setWeeklyHours] = useState('')
  const [hourlyWage, setHourlyWage] = useState('')
  const [result, setResult] = useState<WeeklyHolidayPayResult | null>(null)

  const handleCalc = useCallback(() => {
    const wh = parseNum(weeklyHours)
    const hw = parseNum(hourlyWage) || MIN_HOURLY_WAGE
    if (!wh) return
    setResult(calculateWeeklyHolidayPay({ weeklyHours: wh, hourlyWage: hw }))
  }, [weeklyHours, hourlyWage])

  const wh = parseNum(weeklyHours)
  const hw = parseNum(hourlyWage) || MIN_HOURLY_WAGE
  const isValid = wh > 0

  // 월 주휴수당 예상 (주 4.345주)
  const monthlyEstimate = result?.weeklyHolidayPay
    ? Math.floor(result.weeklyHolidayPay * 4.345)
    : null

  return (
    <main className="flex-1 max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">주휴수당 계산기</h1>
      <p className="text-gray-500 mb-6">{TAX_YEAR}년 기준 · 주 15시간 이상 근무 시 주휴수당 계산</p>

      <AdSlot slotId="TOP_HORIZONTAL" format="horizontal" />

      <div className="mt-6 space-y-6">
        <InputCard title="근무 정보 입력">
          <div>
            <label className="label">주 소정근로시간 <span className="text-red-400">*</span></label>
            <div className="relative">
              <input
                type="text" inputMode="numeric"
                placeholder="예: 20"
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(formatNum(e.target.value))}
                onKeyDown={(e) => e.key === 'Enter' && handleCalc()}
                className="input-field pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">시간</span>
            </div>
            <p className="hint">
              주 15시간 이상 근무 시 주휴수당 발생
              {wh > 0 && (
                <span className={wh >= 15 ? ' text-emerald-600 font-semibold' : ' text-red-500 font-semibold'}>
                  {' '}· {wh >= 15 ? '✓ 주휴수당 발생' : '✗ 주휴수당 미발생'}
                </span>
              )}
            </p>
          </div>

          <div>
            <label className="label">
              시간당 임금{' '}
              <span className="text-xs font-normal text-slate-400">
                (선택, 기본: 최저시급 {MIN_HOURLY_WAGE.toLocaleString()}원)
              </span>
            </label>
            <div className="relative">
              <input
                type="text" inputMode="numeric"
                placeholder={`최저시급: ${MIN_HOURLY_WAGE.toLocaleString()}`}
                value={hourlyWage}
                onChange={(e) => setHourlyWage(formatNum(e.target.value))}
                onKeyDown={(e) => e.key === 'Enter' && handleCalc()}
                className="input-field pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">원</span>
            </div>
            <p className="hint">{TAX_YEAR}년 최저시급 {MIN_HOURLY_WAGE.toLocaleString()}원 적용 중</p>
          </div>

          <button
            type="button" onClick={handleCalc} disabled={!isValid}
            className="btn-primary w-full py-3.5 text-base"
          >
            주휴수당 계산하기
          </button>
        </InputCard>

        {result && (
          <div className="space-y-4 animate-slide-up">
            {result.isEligible ? (
              <ResultHighlight
                label="주 주휴수당"
                value={formatKRW(result.weeklyHolidayPay)}
                subtitle={`월 예상 주휴수당: ${monthlyEstimate ? formatKRW(monthlyEstimate) : '-'}`}
                color="#0284c7"
              />
            ) : (
              <div className="card p-6 bg-red-50 border-red-100">
                <p className="text-base font-bold text-red-700 mb-1">주휴수당 미발생</p>
                <p className="text-sm text-red-600">
                  주 {wh}시간 근무 → 주 15시간 미만으로 주휴수당이 발생하지 않습니다.
                </p>
              </div>
            )}

            {result.isEligible && (
              <BreakdownCard
                title="계산 내역"
                items={[
                  { label: '주 소정근로시간', value: `${wh}시간` },
                  { label: '시간당 임금', value: formatKRW(hw) },
                  { label: '주휴시간 (주 소정근로 ÷ 5)', value: `${result.weeklyHolidayHours}시간` },
                  { label: '주 주휴수당', value: formatKRW(result.weeklyHolidayPay), highlight: true, color: 'text-brand-700' },
                  { label: '월 예상 주휴수당 (×4.345주)', value: formatKRW(monthlyEstimate ?? 0) },
                ]}
              />
            )}

            <div className="card p-5 bg-sky-50 border-sky-100">
              <h3 className="text-sm font-bold text-sky-800 mb-2">주휴수당 계산 기준</h3>
              <ul className="text-xs text-sky-700 space-y-1 leading-relaxed">
                <li>• 1주 소정근로시간이 15시간 이상인 근로자에게 주 1일의 유급휴일 부여</li>
                <li>• 주휴수당 = 1일 소정근로시간 × 시간당 통상임금</li>
                <li>• 1일 소정근로시간 = 주 소정근로시간 ÷ 5 (최대 8시간)</li>
                <li>• 주 40시간 이상 근로자: 8시간 × 시급</li>
                <li>• 근로기준법 제55조 기준 (2024년 개정 포함)</li>
              </ul>
            </div>

            <Disclaimer year={TAX_YEAR} />
          </div>
        )}

        <div className="mt-10">
          <AdSlot slotId="MID_RECTANGLE" format="rectangle" />
        </div>

        {/* ── 가이드 콘텐츠 ─────────────────────────────────── */}
        <GuideSection
          title="주휴수당이란?"
          intro={
            <p>
              주휴수당은 1주 동안 소정의 근로일을 모두 개근한 근로자에게 사용자가
              유급으로 부여해야 하는 주 1일의 휴일에 대한 임금입니다. 「근로기준법」
              제55조에 따라 정규직·계약직·아르바이트 등 고용 형태와 무관하게 4주 평균
              주 15시간 이상 근무하는 모든 근로자에게 적용됩니다. 시간제 근로자도 주
              15시간 이상이면 비례하여 주휴수당을 받을 수 있으며, 미지급 시 임금체불로
              신고할 수 있습니다.
            </p>
          }
          sections={[
            {
              heading: '주휴수당 발생 요건',
              body: (
                <>
                  <p>
                    주휴수당을 받으려면 다음 두 가지 요건을 모두 충족해야 합니다.
                    첫째, 1주 소정근로시간이 <strong>15시간 이상</strong>이어야 합니다.
                    소정근로시간은 근로계약서에 정한 근무시간을 말하며, 실제 근무시간이
                    아닙니다. 둘째, 해당 주의 소정근로일을 <strong>모두 개근</strong>
                    해야 합니다. 결근이 1일이라도 있으면 그 주의 주휴수당은 발생하지
                    않습니다.
                  </p>
                  <p>
                    지각·조퇴는 결근으로 보지 않으므로 주휴수당 발생에 영향을 주지
                    않습니다. 또한 연차·병가 등 유급휴가 사용일은 출근한 것으로
                    간주됩니다.
                  </p>
                </>
              ),
            },
            {
              heading: '주휴수당 계산 방법',
              body: (
                <>
                  <p>
                    주휴수당은 1일 소정근로시간만큼의 통상임금으로 지급됩니다. 1일
                    소정근로시간은 주 소정근로시간 ÷ 5로 계산하되, 1일 8시간을 초과하지
                    않습니다. 예를 들어 주 40시간 근무자는 8시간분, 주 25시간 근무자는
                    5시간분, 주 15시간 근무자는 3시간분의 주휴수당을 받습니다.
                  </p>
                  <p>
                    {TAX_YEAR}년 최저시급은 {MIN_HOURLY_WAGE_2026.toLocaleString()}원이며,
                    주 40시간 근무자의 주휴수당은 약 {(MIN_HOURLY_WAGE_2026 * 8).toLocaleString()}원,
                    월 환산 시 약 {Math.floor(MIN_HOURLY_WAGE_2026 * 8 * 4.345).toLocaleString()}원
                    수준입니다.
                  </p>
                </>
              ),
            },
            {
              heading: '월급제와 주휴수당',
              body: (
                <p>
                  월급제 근로자의 경우 일반적으로 월급에 주휴수당이 이미 포함되어
                  있습니다. 법정 최저임금 계산 시 월 209시간 기준이 사용되는데, 이는 주
                  40시간 근로(주 5일 × 8시간) + 주휴 8시간 = 주 48시간을 월로 환산한
                  값(48시간 × 4.345주 ≒ 209시간)입니다. 따라서 월급이 209시간 ×
                  최저시급 이상이라면 별도 주휴수당 청구 사유가 없습니다.
                </p>
              ),
            },
            {
              heading: '아르바이트·시간제 주휴수당',
              body: (
                <>
                  <p>
                    시급제 또는 일급제로 일하는 아르바이트·시간제 근로자는 주휴수당을
                    별도로 받아야 합니다. 회사가 “시급에 주휴수당 포함”이라고 주장하더라도,
                    이는 시급이 (최저시급 × 1.2) 이상이어야 적법합니다. 예를 들어 {TAX_YEAR}년
                    최저시급 {MIN_HOURLY_WAGE_2026.toLocaleString()}원 기준, 주휴 포함
                    시급은 약 {Math.floor(MIN_HOURLY_WAGE_2026 * 1.2).toLocaleString()}원
                    이상이어야 합니다.
                  </p>
                  <p>
                    또한 “주휴수당 포함”이라는 사실이 근로계약서에 명시되어 있어야 하며,
                    구두 약속만으로는 인정되지 않습니다. 이 조건을 충족하지 못하면 주휴
                    포함을 주장하더라도 별도 청구가 가능합니다.
                  </p>
                </>
              ),
            },
          ]}
          formula={{
            title: '주휴수당 계산 공식',
            description:
              '근로기준법 제55조 및 동법 시행령 제30조에 따른 산식입니다. 주 소정근로시간을 5로 나눠 1일분 시간을 산출한 뒤, 시간당 통상임금을 곱합니다.',
            items: [
              { label: '주휴수당', value: '1일 소정근로시간 × 시간당 통상임금' },
              { label: '1일 소정근로시간', value: 'min(주 소정근로시간 ÷ 5, 8시간)' },
              { label: '월 주휴수당 (참고)', value: '주 주휴수당 × 4.345주' },
              { label: '월 소정근로 209시간', value: '(주 40시간 + 주휴 8시간) × 4.345주' },
            ],
          }}
          referenceTable={{
            caption: `${TAX_YEAR}년 최저시급 기준 주별·월별 주휴수당`,
            footnote: `시간당 임금 ${MIN_HOURLY_WAGE_2026.toLocaleString()}원 기준 (${TAX_YEAR}년 법정 최저시급). 월 환산은 4.345주를 적용합니다.`,
            headers: ['1일 주휴시간', '주 주휴수당', '월 주휴수당'],
            rows: [
              { label: '주 15시간', values: ['3시간', `${(MIN_HOURLY_WAGE_2026 * 3).toLocaleString()}원`, `약 ${Math.floor(MIN_HOURLY_WAGE_2026 * 3 * 4.345 / 1000).toLocaleString()}천원`] },
              { label: '주 20시간', values: ['4시간', `${(MIN_HOURLY_WAGE_2026 * 4).toLocaleString()}원`, `약 ${Math.floor(MIN_HOURLY_WAGE_2026 * 4 * 4.345 / 1000).toLocaleString()}천원`] },
              { label: '주 25시간', values: ['5시간', `${(MIN_HOURLY_WAGE_2026 * 5).toLocaleString()}원`, `약 ${Math.floor(MIN_HOURLY_WAGE_2026 * 5 * 4.345 / 1000).toLocaleString()}천원`] },
              { label: '주 30시간', values: ['6시간', `${(MIN_HOURLY_WAGE_2026 * 6).toLocaleString()}원`, `약 ${Math.floor(MIN_HOURLY_WAGE_2026 * 6 * 4.345 / 1000).toLocaleString()}천원`] },
              { label: '주 40시간', values: ['8시간 (상한)', `${(MIN_HOURLY_WAGE_2026 * 8).toLocaleString()}원`, `약 ${Math.floor(MIN_HOURLY_WAGE_2026 * 8 * 4.345 / 1000).toLocaleString()}천원`] },
            ],
          }}
          legalBasis={[
            { label: '근로기준법 제55조 (휴일)' },
            { label: '근로기준법 시행령 제30조 (주 휴일)' },
            { label: '최저임금법 제5조 (최저임금액)' },
            {
              label: '고용노동부 임금체불 신고',
              href: 'https://www.moel.go.kr',
            },
          ]}
          disclaimer={
            <>
              본 계산기는 {TAX_YEAR}년 최저시급 {MIN_HOURLY_WAGE_2026.toLocaleString()}원 기준
              법정 산식에 따른 근사값을 제공합니다. 실제 주휴수당은 통상임금 산정 항목,
              근로계약 형태(월급제·시급제), 회사 취업규칙에 따라 달라질 수 있습니다.
              미지급 분쟁은 고용노동부 또는 노무사를 통해 상담하세요.
            </>
          }
        />

        <FaqAccordion
          items={[
            {
              q: '주 15시간 미만 근무자도 주휴수당을 받을 수 있나요?',
              a: '근로기준법상 주휴수당은 4주 평균 주 15시간 이상 근무하는 근로자에게만 적용됩니다. 주 15시간 미만 단시간 근로자는 주휴수당이 발생하지 않으며, 연차·퇴직금도 마찬가지로 적용되지 않습니다. 따라서 “15시간의 벽”을 넘는 것이 단시간 근로자에게 매우 중요한 기준입니다.',
            },
            {
              q: '지각이나 조퇴가 있어도 주휴수당이 발생하나요?',
              a: '네. 지각·조퇴는 결근이 아니므로 주휴수당 발생에 영향을 주지 않습니다. 다만 회사가 지각·조퇴 시간만큼 임금을 감액하는 것은 별도의 문제로 가능합니다. 진정한 결근(소정 근로일에 출근하지 않은 경우)이 있어야만 그 주의 주휴수당이 발생하지 않습니다.',
            },
            {
              q: '시급에 주휴수당이 포함된다는 회사 말이 맞나요?',
              a: `시급에 주휴수당을 포함하려면 ① 근로계약서에 명시되어야 하고 ② 시급이 (최저시급 × 1.2) 이상이어야 합니다. ${TAX_YEAR}년 기준 최저시급은 ${MIN_HOURLY_WAGE_2026.toLocaleString()}원이므로 주휴 포함 시급은 약 ${Math.floor(MIN_HOURLY_WAGE_2026 * 1.2).toLocaleString()}원 이상이어야 합니다. 이 조건을 충족하지 못하면 별도로 주휴수당을 청구할 수 있습니다.`,
            },
            {
              q: '주말에만 일하는 알바도 주휴수당을 받나요?',
              a: '주 2일만 근무하더라도 1주 소정근로시간이 15시간 이상이면 주휴수당이 발생합니다. 예를 들어 토·일 각 8시간씩 주 16시간 근무하면 발생합니다. 다만 주중에 결근하는 경우와 마찬가지로, 약속한 근무일에 출근하지 않으면 주휴수당이 그 주에는 발생하지 않습니다.',
            },
            {
              q: '월급제인데 주휴수당을 따로 받을 수 있나요?',
              a: '월급제 근로자의 월급에는 일반적으로 주휴수당이 포함되어 있습니다. 월 209시간(주 48시간 × 4.345주) 기준으로 임금이 책정되었기 때문입니다. 따라서 별도 청구는 불가능하지만, 월급이 209시간 × 최저시급에 미치지 못하면 차액을 청구할 수 있습니다.',
            },
            {
              q: '결근이 있어도 그 주의 다른 날 일한 시간은 임금을 받나요?',
              a: '네. 결근으로 그 주의 주휴수당은 발생하지 않더라도, 실제 근무한 날의 임금은 정상적으로 받을 수 있습니다. 결근은 그 주의 주휴수당 지급에만 영향을 미치며, 그 외 임금에는 영향을 주지 않습니다.',
            },
            {
              q: '주휴수당도 4대보험과 세금이 부과되나요?',
              a: '네. 주휴수당은 임금에 해당하므로 일반 급여와 동일하게 국민연금·건강보험·고용보험·소득세가 부과됩니다. 시급제 근로자라면 월 급여 계산 시 (근무시간 + 주휴시간) × 시급 전체 금액에 보험료가 적용됩니다.',
            },
            {
              q: '주휴수당 미지급 시 어떻게 대응하나요?',
              a: '먼저 회사에 서면(이메일·문자 등)으로 지급을 요청해 증거를 남기세요. 그래도 지급되지 않으면 사업장 관할 고용노동지청에 임금체불 진정을 제기할 수 있습니다. 임금채권은 3년 시효이므로 그 기간 내에 청구해야 합니다. 청구 시 근로계약서, 출근부, 급여명세서 등을 증빙으로 준비하면 좋습니다.',
            },
          ]}
        />

        <RelatedCalculators items={RELATED} />

        <AdSlot slotId="BOTTOM_HORIZONTAL" format="horizontal" />
      </div>
    </main>
  )
}
