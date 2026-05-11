/**
 * src/app/unemployment-benefit-calculator/page.tsx
 * 실업급여 계산기
 */
'use client'

import { useState, useCallback } from 'react'
import { calculateUnemploymentBenefit, type UnemploymentBenefitResult } from '@/lib/calculators'
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

// 2026년 실업급여 상·하한 (calculators.ts와 동일 로직)
const MIN_DAILY_BENEFIT = Math.floor(MIN_HOURLY_WAGE_2026 * 8 * 0.8)  // 66,048원
const MAX_DAILY_BENEFIT = Math.max(66_000, MIN_DAILY_BENEFIT)           // 66,048원

const RELATED = [
  { href: '/severance-pay-calculator', emoji: '📦', label: '퇴직금 계산기', description: '퇴직금 산출' },
  { href: '/social-insurance-calculator', emoji: '🏥', label: '4대보험 계산기', description: '고용보험 포함 4대보험' },
  { href: '/salary-calculator', emoji: '💰', label: '실수령액 계산기', description: '재직 중 실수령액 계산' },
]

export default function UnemploymentBenefitCalculatorPage() {
  const [dailyWage, setDailyWage]               = useState('')
  const [monthlyWage, setMonthlyWage]           = useState('')
  const [useMonthly, setUseMonthly]             = useState(true)
  const [employmentMonths, setEmploymentMonths] = useState('')
  const [age, setAge]                           = useState('40')
  const [result, setResult]                     = useState<UnemploymentBenefitResult | null>(null)

  const computedDailyWage = useMonthly
    ? Math.floor(parseNum(monthlyWage) / 30)
    : parseNum(dailyWage)

  const handleCalc = useCallback(() => {
    const dw = computedDailyWage
    const em = parseNum(employmentMonths)
    const a  = Number(age) || 40
    if (!dw || !em) return
    setResult(calculateUnemploymentBenefit({ dailyWage: dw, employmentMonths: em, age: a }))
  }, [computedDailyWage, employmentMonths, age])

  const isValid = computedDailyWage > 0 && parseNum(employmentMonths) > 0

  return (
    <main className="flex-1 max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">실업급여 계산기</h1>
      <p className="text-gray-500 mb-6">
        {TAX_YEAR}년 기준 · 최저시급 {MIN_HOURLY_WAGE_2026.toLocaleString()}원 적용
      </p>

      <AdSlot slotId="TOP_HORIZONTAL" format="horizontal" />

      <div className="mt-6 space-y-6">
        <InputCard title="고용 정보 입력">
          {/* 임금 입력 방식 선택 */}
          <div>
            <label className="label">임금 입력 방식</label>
            <div className="flex gap-2">
              {[
                { value: true,  label: '월평균임금으로 입력' },
                { value: false, label: '1일 평균임금 직접 입력' },
              ].map((opt) => (
                <button
                  key={String(opt.value)} type="button"
                  onClick={() => setUseMonthly(opt.value)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    useMonthly === opt.value
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {useMonthly ? (
            <div>
              <label className="label">퇴직 전 월평균임금 <span className="text-red-400">*</span></label>
              <div className="relative">
                <input
                  type="text" inputMode="numeric"
                  placeholder="예: 3,000,000"
                  value={monthlyWage}
                  onChange={(e) => setMonthlyWage(formatNum(e.target.value))}
                  className="input-field pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">원</span>
              </div>
              {parseNum(monthlyWage) > 0 && (
                <p className="hint text-brand-600">
                  계산된 1일 평균임금: {formatKRW(Math.floor(parseNum(monthlyWage) / 30))}
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="label">1일 평균임금 <span className="text-red-400">*</span></label>
              <div className="relative">
                <input
                  type="text" inputMode="numeric"
                  placeholder="예: 100,000"
                  value={dailyWage}
                  onChange={(e) => setDailyWage(formatNum(e.target.value))}
                  className="input-field pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">원</span>
              </div>
            </div>
          )}

          <div>
            <label className="label">고용보험 가입 기간 <span className="text-red-400">*</span></label>
            <div className="relative">
              <input
                type="text" inputMode="numeric"
                placeholder="예: 24"
                value={employmentMonths}
                onChange={(e) => setEmploymentMonths(formatNum(e.target.value))}
                className="input-field pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">개월</span>
            </div>
            <p className="hint">
              이직 전 18개월 내 피보험단위기간 180일(약 6개월) 이상 필요
              {parseNum(employmentMonths) > 0 && (
                <span className={parseNum(employmentMonths) >= 6 ? ' text-emerald-600 font-semibold' : ' text-red-500 font-semibold'}>
                  {' '}· {parseNum(employmentMonths) >= 6 ? '✓ 수급 요건 충족' : '✗ 수급 요건 미충족 (6개월 미만)'}
                </span>
              )}
            </p>
          </div>

          <div>
            <label className="label">나이</label>
            <div className="flex flex-wrap gap-2">
              {['30', '40', '50', '55'].map((a) => (
                <button
                  key={a} type="button"
                  onClick={() => setAge(a)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    age === a
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
                  }`}
                >
                  {a}대
                </button>
              ))}
            </div>
            <p className="hint">50세 이상은 수급 일수가 더 길게 산정됩니다</p>
          </div>

          <button
            type="button" onClick={handleCalc} disabled={!isValid}
            className="btn-primary w-full py-3.5 text-base"
          >
            실업급여 계산하기
          </button>
        </InputCard>

        {result && (
          <div className="space-y-4 animate-slide-up">
            {result.isEligible ? (
              <ResultHighlight
                label="총 예상 실업급여"
                value={formatKRW(result.totalBenefit)}
                subtitle={`1일 ${formatKRW(result.dailyBenefit)} × ${result.totalDays}일`}
                color="#0369a1"
              />
            ) : (
              <div className="card p-6 bg-red-50 border-red-100">
                <p className="text-base font-bold text-red-700 mb-1">수급 요건 미충족</p>
                <p className="text-sm text-red-600">
                  고용보험 가입 기간 {parseNum(employmentMonths)}개월 → 최소 6개월(180일) 이상 필요합니다.
                </p>
              </div>
            )}

            {result.isEligible && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="card p-4">
                    <p className="text-xs font-semibold text-slate-400 mb-1">1일 실업급여</p>
                    <p className="text-xl font-bold text-slate-900 tabular-nums">
                      {formatKRW(result.dailyBenefit)}
                    </p>
                  </div>
                  <div className="card p-4">
                    <p className="text-xs font-semibold text-slate-400 mb-1">수급 일수</p>
                    <p className="text-xl font-bold text-slate-900 tabular-nums">{result.totalDays}일</p>
                  </div>
                </div>

                <BreakdownCard
                  title="계산 내역"
                  items={[
                    { label: '1일 평균임금', value: formatKRW(computedDailyWage) },
                    { label: '1일 실업급여 (평균임금 × 60%)', value: formatKRW(result.dailyBenefit) },
                    {
                      label: `하한 ${formatKRW(result.minDailyBenefit)} (최저시급 ${MIN_HOURLY_WAGE_2026.toLocaleString()}원×8h×80%)`,
                      value: '',
                    },
                    {
                      label: `상한 ${formatKRW(result.maxDailyBenefit)} (고용노동부 고시 기준)`,
                      value: '',
                    },
                    { label: '수급 일수', value: `${result.totalDays}일` },
                    {
                      label: '총 예상 실업급여',
                      value: formatKRW(result.totalBenefit),
                      highlight: true,
                      color: 'text-brand-700',
                    },
                  ]}
                />
              </>
            )}

            <div className="card p-5 bg-sky-50 border-sky-100">
              <h3 className="text-sm font-bold text-sky-800 mb-2">
                {TAX_YEAR}년 실업급여 상·하한액
              </h3>
              <ul className="text-xs text-sky-700 space-y-1 leading-relaxed">
                <li>
                  • 하한액: <strong>{formatKRW(MIN_DAILY_BENEFIT)}/일</strong>
                  {' '}(최저시급 {MIN_HOURLY_WAGE_2026.toLocaleString()}원 × 8시간 × 80%)
                </li>
                <li>
                  • 상한액: <strong>{formatKRW(MAX_DAILY_BENEFIT)}/일</strong>
                  {' '}(고용노동부 고시 기준)
                </li>
                <li>• 1일 실업급여 = 1일 평균임금 × 60% (상·하한 범위 내 적용)</li>
              </ul>
            </div>

            <div className="card p-5 bg-amber-50 border-amber-100">
              <h3 className="text-sm font-bold text-amber-800 mb-2">실업급여 수급 요건</h3>
              <ul className="text-xs text-amber-700 space-y-1 leading-relaxed">
                <li>• 이직일 이전 18개월 내 피보험단위기간 180일 이상</li>
                <li>• 비자발적 이직 (권고사직, 계약만료, 폐업 등)</li>
                <li>• 재취업 의사 및 능력이 있고 구직활동 중일 것</li>
                <li>• 이직 후 12개월 이내 신청 필요</li>
                <li>• 자발적 퇴직의 경우 일부 예외 인정 (임금체불, 직장 내 괴롭힘 등)</li>
              </ul>
            </div>

            <Disclaimer
              year={TAX_YEAR}
              extra="수급 일수·금액은 고용보험 가입 이력·이직 사유 등에 따라 실제와 다를 수 있습니다. 정확한 내용은 고용복지+센터에 문의하세요."
            />
          </div>
        )}

        <RelatedCalculators items={RELATED} />

        <div className="mt-10">
          <AdSlot slotId="MID_RECTANGLE" format="rectangle" />
        </div>

        {/* ── 가이드 콘텐츠 ─────────────────────────────────── */}
        <GuideSection
          title="실업급여란?"
          intro={
            <p>
              실업급여(정식 명칭: 구직급여)는 고용보험에 가입한 근로자가 비자발적으로
              실직한 경우, 재취업 활동을 하는 동안 생활 안정과 구직활동을 지원하기 위해
              지급되는 사회보험 급여입니다. 「고용보험법」 제40조에 근거하며, 모든 4대보험
              가입 사업장에서 일정 기간 근무했다면 수급 자격이 발생할 수 있습니다.
              실업급여는 단순 위로금이 아니라, 적극적인 재취업 활동을 전제로 지급되는
              조건부 급여라는 점이 핵심입니다.
            </p>
          }
          sections={[
            {
              heading: '실업급여 수급 요건',
              body: (
                <>
                  <p>
                    실업급여를 받으려면 다음 네 가지 요건을 모두 충족해야 합니다.
                    첫째, 이직일 이전 <strong>18개월 동안 피보험단위기간이 180일 이상</strong>
                    이어야 합니다(약 6개월). 피보험단위기간은 고용보험에 가입한 상태에서
                    임금을 받은 일수의 합계입니다. 둘째, 근로 의사와 능력이 있음에도
                    실직 상태여야 합니다. 셋째, 적극적으로 구직활동을 해야 합니다.
                  </p>
                  <p>
                    넷째, 이직 사유가 비자발적이어야 합니다. 권고사직, 계약만료, 폐업,
                    구조조정 등은 비자발적 이직에 해당합니다. 반면 단순 자발적 퇴사는
                    원칙적으로 수급 대상이 아니지만, 임금체불, 직장 내 괴롭힘, 통근
                    곤란(왕복 3시간 이상), 질병, 가족 간병 등 정당한 사유가 있다면
                    자발적 퇴사도 수급이 가능합니다.
                  </p>
                </>
              ),
            },
            {
              heading: '실업급여 지급액과 상·하한',
              body: (
                <>
                  <p>
                    1일 실업급여는 <strong>이직 전 1일 평균임금의 60%</strong>로 계산됩니다.
                    다만 상한액과 하한액이 적용됩니다. {TAX_YEAR}년 기준 하한액은
                    최저시급 × 8시간 × 80%로 약 {formatKRW(MIN_DAILY_BENEFIT)}이며,
                    상한액은 고용노동부 고시 기준 약 {formatKRW(MAX_DAILY_BENEFIT)}입니다.
                  </p>
                  <p>
                    평균임금이 매우 낮은 저임금 근로자도 하한액은 보장되며, 고임금
                    근로자라도 상한액 이상은 받을 수 없습니다. 따라서 월급이 매우 높은
                    근로자에게는 상한 제한으로 인해 평균임금의 60%에 못 미치는 금액을
                    받게 됩니다.
                  </p>
                </>
              ),
            },
            {
              heading: '수급 일수 (소정급여일수)',
              body: (
                <>
                  <p>
                    수급 일수는 고용보험 가입기간과 연령에 따라 결정됩니다(고용보험법
                    별표 1). 50세 미만 일반 근로자는 6개월~1년 가입 시 120일, 1~3년
                    150일, 3~5년 180일, 5~10년 210일, 10년 이상 240일을 받습니다. 50세
                    이상 또는 장애인은 가입기간이 같아도 30일씩 더 지급됩니다.
                  </p>
                  <p>
                    수급 일수는 “며칠 동안” 지급되는지를 의미하며, 매주 정해진 실업인정일
                    에 출석해 구직활동을 보고하면 그동안의 실업급여가 지급됩니다.
                  </p>
                </>
              ),
            },
            {
              heading: '신청 절차와 실업인정',
              body: (
                <>
                  <p>
                    실업급여 신청은 이직 후 가능한 빨리 시작해야 합니다.
                    <strong> 이직 후 12개월 이내에 신청</strong>해야 하며, 이 기간을 넘기면
                    남은 일수만큼 받을 수 없게 됩니다. 신청 절차는 ① 워크넷에서 구직 신청 →
                    ② 거주지 관할 고용센터에서 수급자격 신청 교육 수강 →
                    ③ 수급자격 인정 신청 → ④ 매 1~4주마다 실업인정 출석 순으로
                    진행됩니다.
                  </p>
                  <p>
                    실업인정은 단순 출석이 아니라 그 기간 동안 구직활동(입사지원, 면접
                    참석, 직업훈련 수강 등)을 했음을 증명해야 합니다. 1차 실업인정은
                    수급자격 인정일로부터 14일 후이며, 이후 4주마다 정해진 날에 출석해
                    구직활동을 보고합니다.
                  </p>
                </>
              ),
            },
            {
              heading: '실업급여 부정수급 주의사항',
              body: (
                <p>
                  취업 사실을 숨기거나 허위 구직활동을 보고하면 부정수급으로 간주됩니다.
                  부정수급이 적발되면 그 시점부터 실업급여 지급이 중단되고, 이미 받은
                  금액의 최대 5배까지 반환해야 합니다. 또한 형사처벌(1년 이하 징역
                  또는 1천만원 이하 벌금)도 가능합니다. 자진신고하면 처벌이 감경될 수
                  있으므로, 실수가 있었다면 즉시 고용센터에 알리는 것이 좋습니다.
                </p>
              ),
            },
          ]}
          formula={{
            title: '실업급여 계산 공식',
            description:
              '고용보험법 제46조 및 별표 1에 따른 산식입니다. 평균임금의 60%를 기준으로 하되, 법정 상·하한액 범위 내에서 결정됩니다.',
            items: [
              { label: '1일 실업급여', value: '1일 평균임금 × 60% (상·하한 범위 내)' },
              { label: '하한액', value: `최저시급 × 8시간 × 80% = ${formatKRW(MIN_DAILY_BENEFIT)}/일` },
              { label: '상한액', value: `${formatKRW(MAX_DAILY_BENEFIT)}/일 (고용부 고시)` },
              { label: '총 수급액', value: '1일 실업급여 × 소정급여일수' },
              { label: '신청 기한', value: '이직 후 12개월 이내' },
            ],
          }}
          referenceTable={{
            caption: '연령·가입기간별 소정급여일수',
            footnote:
              '고용보험법 별표 1 기준. 50세 이상 또는 장애인은 가입기간이 같아도 30~60일씩 더 지급됩니다.',
            headers: ['50세 미만', '50세 이상 또는 장애인'],
            rows: [
              { label: '6개월~1년 미만', values: ['120일', '120일'] },
              { label: '1년~3년', values: ['150일', '180일'] },
              { label: '3년~5년', values: ['180일', '210일'] },
              { label: '5년~10년', values: ['210일', '240일'] },
              { label: '10년 이상', values: ['240일', '270일'] },
            ],
          }}
          legalBasis={[
            { label: '고용보험법 제40조 (구직급여의 수급 요건)' },
            { label: '고용보험법 제46조 (구직급여일액)' },
            { label: '고용보험법 별표 1 (소정급여일수)' },
            {
              label: '고용보험 홈페이지',
              href: 'https://www.ei.go.kr',
            },
            {
              label: '고용복지+센터 (지방고용노동관서)',
              href: 'https://www.work.go.kr',
            },
          ]}
          disclaimer={
            <>
              본 계산기는 {TAX_YEAR}년 기준 근사값을 제공합니다. 실제 실업급여는 고용보험
              가입 이력, 이직 사유 인정 여부, 구직활동 이행 여부에 따라 달라집니다.
              정확한 수급 자격과 금액은 고용복지+센터(1350)에 문의하거나 가까운
              고용센터에서 상담받으세요.
            </>
          }
        />

        <FaqAccordion
          items={[
            {
              q: '자발적으로 퇴사해도 실업급여를 받을 수 있나요?',
              a: '원칙적으로 자발적 퇴사는 수급 대상이 아닙니다. 다만 정당한 이직 사유가 인정되면 가능합니다. 예: ① 2개월 이상 임금체불, ② 직장 내 괴롭힘·성희롱, ③ 회사 이전·전직 명령으로 통근 왕복 3시간 이상, ④ 본인 또는 가족의 질병으로 인한 간병이 필요한 경우, ⑤ 임신·출산·육아 사유로 회사에서 휴직을 허용하지 않은 경우 등입니다. 이 경우 관련 증빙(진단서·임금명세서·통근거리 증명 등)을 제출해야 합니다.',
            },
            {
              q: '계약직 만료도 실업급여 대상인가요?',
              a: '네. 근로계약기간 만료에 따른 퇴직은 비자발적 이직으로 분류되어 수급 자격이 인정됩니다. 단, 회사가 재계약을 제안했는데 근로자가 거부한 경우는 자발적 이직으로 처리되어 수급이 제한될 수 있으므로 주의가 필요합니다. 재계약 거부 시에는 그 사유가 정당해야 합니다(임금 삭감, 근로조건 악화 등).',
            },
            {
              q: '실업급여를 받는 동안 아르바이트할 수 있나요?',
              a: '제한적으로 가능합니다. 1주 15시간 미만, 1개월 60시간 미만, 일용직 형태로 7일 미만 근로는 가능하지만, 반드시 실업인정 시 신고해야 합니다. 신고하면 그 일수만큼 실업급여가 차감되거나 지급이 보류되지만, 미신고 시 부정수급으로 적발되어 환수 + 처벌 대상이 됩니다.',
            },
            {
              q: '실업급여 신청은 언제까지 해야 하나요?',
              a: '이직일로부터 12개월 이내에 신청해야 하며, 이 기간을 넘기면 남은 소정급여일수만큼 받을 수 없게 됩니다. 예를 들어 240일분 수급 자격자가 11개월 후 신청하면 약 30일분만 받게 됩니다. 따라서 이직 후 가능한 빨리 워크넷 구직신청과 고용센터 방문을 시작하는 것이 좋습니다.',
            },
            {
              q: '실업급여를 받으면 4대보험은 어떻게 되나요?',
              a: '실업급여 수급 중에는 국민연금·건강보험에 자동 가입되지 않습니다. 건강보험은 직장가입자였던 이력에 따라 임의계속가입(최대 36개월)이 가능합니다. 국민연금은 실업크레딧 제도를 통해 최대 12개월간 보험료의 75%를 정부가 지원받으며 가입기간을 인정받을 수 있습니다.',
            },
            {
              q: '취업하면 남은 실업급여는 어떻게 되나요?',
              a: '소정급여일수가 절반 이상 남은 상태에서 재취업하면 “조기재취업수당”을 받을 수 있습니다. 잔여 일수의 1/2에 해당하는 금액이 한꺼번에 지급되어, 빨리 취업할수록 이득이 큽니다. 단, 재취업 후 12개월 이상 고용보험을 유지해야 받을 수 있으며, 단기 알바나 자영업은 제외됩니다.',
            },
            {
              q: '실업급여 신청 후 며칠 만에 첫 지급되나요?',
              a: '신청 후 14일이 지나 1차 실업인정일에 출석하면 그날 기준 7일치(대기기간 제외)가 지급됩니다. 이후 4주마다 실업인정일에 출석해 구직활동을 보고하면 28일치(주말 포함)의 실업급여가 지급되는 방식입니다. 따라서 신청부터 첫 입금까지는 약 2~3주가 소요됩니다.',
            },
            {
              q: '회사가 실업급여를 못 받게 한다고 하는데 진짜인가요?',
              a: '회사가 “실업급여 못 받게 하겠다”고 위협하더라도, 회사가 수급 자격을 막을 수 있는 권한은 없습니다. 다만 회사가 이직확인서를 제출할 때 이직 사유를 자발적 퇴사로 신고하면 수급에 어려움이 생길 수 있으므로, 사직서 작성 시 사유를 명확히 기재하고 가능하면 회사의 사직 권유 문자·이메일을 증거로 보관하는 것이 좋습니다.',
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
