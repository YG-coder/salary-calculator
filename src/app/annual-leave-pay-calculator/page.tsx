/**
 * src/app/annual-leave-pay-calculator/page.tsx
 * 연차수당 계산기
 */
'use client'

import { useState, useCallback } from 'react'
import {
  calculateAnnualLeavePay,
  calculateAnnualLeaveDays,
  calculateSubOneYearLeaveDays,
  getStatutoryLeaveReference,
  type AnnualLeaveTenure,
  type AnnualLeavePayResult,
} from '@/lib/calculators'
import {
  ANNUAL_LEAVE_MAX_DAYS,
  ANNUAL_LEAVE_CAP_YEARS,
  ADDITIONAL_LEAVE_START_YEARS,
  SUB_ONE_YEAR_MAX_DAYS,
  MONTHLY_WORK_HOURS,
  DAILY_WORK_HOURS,
  MIN_WORKING_YEARS,
  MAX_WORKING_YEARS,
  MAX_FULL_ATTENDANCE_MONTHS,
  type AnnualLeaveTenureCategory,
} from '@/lib/policy/annualLeave'
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

// 미사용 연차일수 입력: 반차(0.5일) 등 소수를 허용한다.
// ⚠️ 현행법상 1일 미만 단위 부여를 강제하는 규정이 없으므로 소수 입력을 임의로
//    반올림·절사하지 않는다. 소수점 문자만 1개로 제한한다.
function sanitizeDaysInput(v: string): string {
  const cleaned = v.replace(/[^0-9.]/g, '')
  const [head, ...rest] = cleaned.split('.')
  return rest.length > 0 ? `${head}.${rest.join('')}` : head
}
function parseDays(v: string): number {
  const n = Number(sanitizeDaysInput(v))
  return Number.isFinite(n) && n >= 0 ? n : 0
}

// 근속연수 입력 정규화: 정수 1~50년. NaN·음수·소수·범위초과를 모두 안전하게 클램프한다.
// 소수점 이하는 버리고("3.7" → "3"), 부호·단위 등 숫자가 아닌 문자는 제거한다.
function sanitizeYearsInput(v: string): string {
  return v.split('.')[0].replace(/[^0-9]/g, '')
}
function normalizeWorkingYears(v: string): number {
  const n = Number(sanitizeYearsInput(v))
  if (!Number.isFinite(n)) return MIN_WORKING_YEARS
  const years = Math.floor(n)
  if (years < MIN_WORKING_YEARS) return MIN_WORKING_YEARS
  return Math.min(years, MAX_WORKING_YEARS)
}
function normalizeMonths(v: string): number {
  const n = Number(sanitizeYearsInput(v))
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(Math.floor(n), MAX_FULL_ATTENDANCE_MONTHS)
}

// 참조표 기준 근속연수 (일수는 calculateAnnualLeaveDays()로만 생성 — 하드코딩 금지)
const REFERENCE_YEARS = [1, 3, 5, 10, 15, ANNUAL_LEAVE_CAP_YEARS]

// 가이드 참조표도 계산 함수로만 생성한다 (하드코딩 금지).
const GUIDE_SAMPLE_DAILY_WAGE = 80_000
const GUIDE_YEAR_ROWS: { label: string; years: number }[] = [
  { label: '근속 1~2년', years: 1 },
  { label: '근속 3~4년', years: 3 },
  { label: '근속 5~6년', years: 5 },
  { label: '근속 10년', years: 10 },
  { label: '근속 15년', years: 15 },
  { label: `근속 ${ANNUAL_LEAVE_CAP_YEARS}년 이상`, years: ANNUAL_LEAVE_CAP_YEARS },
]
function guideAmount(days: number) {
  return formatKRW(days * GUIDE_SAMPLE_DAILY_WAGE)
}

const TENURE_OPTIONS: { value: AnnualLeaveTenureCategory; label: string; hint: string }[] = [
  { value: 'under1', label: '1년 미만', hint: '계속근로기간이 아직 1년이 되지 않은 경우' },
  { value: 'exact1', label: '1년 근무 후 퇴직', hint: '365일을 채우고 그 다음 날 근로관계가 끝난 경우' },
  { value: 'over1', label: '1년 초과 재직', hint: '366일째에도 근로관계가 유지되는 경우' },
]

function buildTenure(
  category: AnnualLeaveTenureCategory,
  workingYears: number,
  fullAttendanceMonths: number,
): AnnualLeaveTenure {
  if (category === 'under1') return { category: 'under1', fullAttendanceMonths }
  if (category === 'exact1') return { category: 'exact1' }
  return { category: 'over1', workingYears }
}

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
  const [tenureCategory, setTenureCategory] = useState<AnnualLeaveTenureCategory>('over1')
  const [workingYears, setWorkingYears] = useState('1')
  const [attendanceMonths, setAttendanceMonths] = useState('6')
  const [result, setResult] = useState<AnnualLeavePayResult | null>(null)
  const [submittedDays, setSubmittedDays] = useState(0)
  const [submittedReference, setSubmittedReference] = useState<ReturnType<typeof getStatutoryLeaveReference> | null>(null)

  // 1일 통상임금 = 월 통상임금 ÷ 209시간(법정 월 소정근로시간) × 8시간
  const computedDailyWage = mode === 'calc'
    ? Math.floor((parseNum(monthlyWage) / MONTHLY_WORK_HOURS) * DAILY_WORK_HOURS)
    : parseNum(dailyWage)

  // 근속 구분 파생값
  const normalizedYears = normalizeWorkingYears(workingYears)
  const normalizedMonths = normalizeMonths(attendanceMonths)
  const tenure = buildTenure(tenureCategory, normalizedYears, normalizedMonths)

  // ⚠️ 법정 발생일수는 "참고 기준"일 뿐, 수당 계산을 제한하지 않는다.
  const statutory = getStatutoryLeaveReference(tenure)
  const unusedDaysNum = parseDays(unusedDays)
  const exceedsStatutory = unusedDaysNum > 0 && unusedDaysNum > statutory.settlementReferenceDays

  // 참조표: 기준 연수 + 사용자가 입력한 연수를 합쳐 오름차순 정렬
  const referenceYears = Array.from(
    new Set([...REFERENCE_YEARS, ...(tenureCategory === 'over1' ? [normalizedYears] : [])]),
  ).sort((a, b) => a - b)

  const handleCalc = useCallback(() => {
    const dw = computedDailyWage
    const ud = parseDays(unusedDays)
    if (!dw || !ud) return
    setResult(calculateAnnualLeavePay({ dailyWage: dw, unusedDays: ud }))
    setSubmittedDays(ud)
    // ⚠️ React Compiler가 수동 메모이제이션을 보존할 수 있도록 원시값만 의존성으로 둔다.
    setSubmittedReference(
      getStatutoryLeaveReference(
        buildTenure(
          tenureCategory,
          normalizeWorkingYears(workingYears),
          normalizeMonths(attendanceMonths),
        ),
      ),
    )
  }, [computedDailyWage, unusedDays, tenureCategory, workingYears, attendanceMonths])

  const isValid = computedDailyWage > 0 && parseDays(unusedDays) > 0
  const submittedExceeds =
    submittedReference !== null && submittedDays > submittedReference.settlementReferenceDays

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
                  계산된 1일 통상임금: {formatKRW(computedDailyWage)}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="label">미사용 연차 일수 <span className="text-red-400">*</span></label>
            <div className="relative">
              <input
                type="text" inputMode="decimal"
                placeholder="예: 10 (반차는 0.5)"
                value={unusedDays}
                onChange={(e) => setUnusedDays(sanitizeDaysInput(e.target.value))}
                className="input-field pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">일</span>
            </div>
            <p className="hint">반차·반반차가 남았다면 0.5, 0.25처럼 소수로 입력할 수 있습니다</p>
            {exceedsStatutory && (
              <p className="hint text-amber-600">
                입력한 미사용 연차일수({unusedDaysNum}일)가 선택한 근속 구분의 법정 발생일수
                ({statutory.settlementReferenceDays}일)보다 많습니다. 회사의 약정휴가·추가휴가,
                이월 연차, 회계연도 운영 기준이 있는 경우 정상적인 값일 수 있으므로 입력값
                그대로 계산합니다. 입력 내용만 한 번 확인해 주세요.
              </p>
            )}
          </div>

          <div>
            <label className="label">근속 구분</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {TENURE_OPTIONS.map((opt) => (
                <button
                  key={opt.value} type="button"
                  onClick={() => setTenureCategory(opt.value)}
                  className={`py-2.5 px-2 rounded-xl text-sm font-semibold border transition-all ${
                    tenureCategory === opt.value
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="hint">
              {TENURE_OPTIONS.find((o) => o.value === tenureCategory)?.hint}
            </p>
          </div>

          {tenureCategory === 'under1' && (
            <div>
              <label className="label">개근한 개월 수</label>
              <div className="relative">
                <input
                  type="text" inputMode="numeric"
                  placeholder="예: 6"
                  value={attendanceMonths}
                  onChange={(e) => setAttendanceMonths(sanitizeYearsInput(e.target.value))}
                  onBlur={() => setAttendanceMonths(String(normalizeMonths(attendanceMonths)))}
                  className="input-field pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">개월</span>
              </div>
              <p className="hint">
                개근 {normalizedMonths}개월 기준 법정 연차: {statutory.annualGrantDays}일
                <span className="text-slate-400"> · 입력 범위 0~{MAX_FULL_ATTENDANCE_MONTHS}개월</span>
              </p>
            </div>
          )}

          {tenureCategory === 'exact1' && (
            <p className="hint text-amber-600">
              365일을 채우고 그 다음 날 근로관계가 끝난 경우, 근로기준법 제60조 제1항의 15일은
              발생하지 않습니다. 제60조 제2항에 따른 최대 {SUB_ONE_YEAR_MAX_DAYS}일만 정산
              대상입니다(대법원 2021다227100, 고용노동부 행정해석 변경 2021.12.16).
            </p>
          )}

          {tenureCategory === 'over1' && (
            <div>
              <label className="label">근속 기간</label>
              <div className="relative">
                <input
                  type="text" inputMode="numeric"
                  placeholder="예: 12"
                  value={workingYears}
                  onChange={(e) => setWorkingYears(sanitizeYearsInput(e.target.value))}
                  onBlur={() => setWorkingYears(String(normalizeWorkingYears(workingYears)))}
                  className="input-field pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">년</span>
              </div>
              <p className="hint">
                근속 {normalizedYears}년 기준 법정 연차: {statutory.annualGrantDays}일
                <span className="text-slate-400"> · 입력 범위 {MIN_WORKING_YEARS}~{MAX_WORKING_YEARS}년</span>
              </p>
              {normalizedYears === 1 && (
                <p className="hint text-brand-600">
                  1년 미만 기간에 발생한 최대 {SUB_ONE_YEAR_MAX_DAYS}일이 남아 있다면 합쳐서
                  최대 {statutory.settlementReferenceDays}일까지 정산 대상이 될 수 있습니다.
                </p>
              )}
              {normalizedYears >= ANNUAL_LEAVE_CAP_YEARS && (
                <p className="hint text-brand-600">
                  {ANNUAL_LEAVE_CAP_YEARS}년 이상 근속자는 가산 연차를 포함해 법정 연차가 최대 {ANNUAL_LEAVE_MAX_DAYS}일입니다.
                </p>
              )}
            </div>
          )}

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
              subtitle={`미사용 ${submittedDays}일 × 1일 ${formatKRW(result.perDayAmount)}`}
              color="#0284c7"
            />

            {submittedExceeds && submittedReference && (
              <div className="card p-4 bg-amber-50 border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>확인해 주세요.</strong> 계산에 사용한 미사용 연차 {submittedDays}일은
                  선택한 근속 구분의 법정 발생일수 {submittedReference.settlementReferenceDays}일을
                  초과합니다. 회사의 약정휴가·추가휴가, 이월 연차, 회계연도 기준 운영 등으로
                  초과할 수 있어 <strong>입력값 그대로 계산했습니다.</strong> 오류가 아니라 확인
                  안내입니다.
                </p>
                <p className="mt-1 text-[11px] text-amber-700">기준: {submittedReference.basis}</p>
              </div>
            )}

            <BreakdownCard
              title="계산 내역"
              items={[
                { label: '1일 통상임금', value: formatKRW(result.perDayAmount) },
                { label: '미사용 연차 일수 (입력값)', value: `${submittedDays}일` },
                { label: '법정 발생일수 (참고)', value: `${submittedReference?.settlementReferenceDays ?? 0}일` },
                { label: '연차수당 합계', value: formatKRW(result.annualLeavePay), highlight: true, color: 'text-brand-700' },
              ]}
            />

            <div className="card p-5 bg-sky-50 border-sky-100">
              <h3 className="text-sm font-bold text-sky-800 mb-2">연차 일수 기준 (근로기준법)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-sky-700">
                  <thead><tr className="font-semibold"><th className="text-left py-1">근속기간</th><th className="text-right py-1">연차 일수</th></tr></thead>
                  <tbody>
                    <tr className={tenureCategory === 'under1' ? 'font-bold text-sky-900' : ''}>
                      <td className="py-0.5">1년 미만 (1개월 개근당 1일)</td>
                      <td className="text-right">최대 {SUB_ONE_YEAR_MAX_DAYS}일</td>
                    </tr>
                    <tr className={tenureCategory === 'exact1' ? 'font-bold text-sky-900' : ''}>
                      <td className="py-0.5">365일 근무 후 퇴직</td>
                      <td className="text-right">최대 {SUB_ONE_YEAR_MAX_DAYS}일</td>
                    </tr>
                    {referenceYears.map((y) => (
                      <tr key={y} className={tenureCategory === 'over1' && normalizedYears === y ? 'font-bold text-sky-900' : ''}>
                        <td className="py-0.5">{y}년 (366일째 이후 계속근로)</td>
                        <td className="text-right">{calculateAnnualLeaveDays(y)}일</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[11px] text-sky-600">
                근로기준법 제60조 기준. {ADDITIONAL_LEAVE_START_YEARS}년 차부터 매 2년마다 1일씩 가산되며,
                {' '}{ANNUAL_LEAVE_CAP_YEARS}년 이상 근속 시 가산 연차를 포함해 최대 {ANNUAL_LEAVE_MAX_DAYS}일이 적용됩니다.
              </p>
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
                    1년 미만 신규 입사자는 1개월 개근 시 1일씩, 최대 {SUB_ONE_YEAR_MAX_DAYS}일까지 발생합니다
                    (제2항). 1년간 80% 이상 출근하면 15일이 부여되며(제1항),
                    {' '}{ADDITIONAL_LEAVE_START_YEARS}년 차부터 매 2년마다 1일씩 가산됩니다(제4항).
                    가산 연차를 포함한 총 연차일수는 최대 {ANNUAL_LEAVE_MAX_DAYS}일입니다.
                  </p>
                  <p>
                    예를 들어 근속 3년 차는 {calculateAnnualLeaveDays(3)}일, 5년 차는 {calculateAnnualLeaveDays(5)}일,
                    10년 차는 {calculateAnnualLeaveDays(10)}일, {ANNUAL_LEAVE_CAP_YEARS}년 차
                    이상은 상한선인 {ANNUAL_LEAVE_MAX_DAYS}일을 받습니다. 단, 1년간 출근율이 80% 미만이면
                    개근한 월수만큼만 부여됩니다.
                  </p>
                </>
              ),
            },
            {
              heading: '1년 근무 후 퇴직 — 365일과 366일의 차이',
              body: (
                <>
                  <p>
                    실무에서 가장 많이 어긋나는 지점입니다. 근로기준법 제60조 제1항의 15일은
                    <strong> 1년간의 근로를 마친 다음 날에 근로관계가 존속해야 </strong>
                    발생합니다. 따라서 정확히 365일을 근무하고 퇴직하면 제1항의 15일은
                    발생하지 않고, 제2항에 따라 1년 미만 기간에 쌓인 최대 {SUB_ONE_YEAR_MAX_DAYS}일만
                    정산 대상이 됩니다.
                  </p>
                  <p>
                    반대로 366일째에도 근로관계가 유지되면 제2항의 최대 {SUB_ONE_YEAR_MAX_DAYS}일과
                    제1항의 15일이 함께 인정되어 최대 26일이 될 수 있습니다. 이는 대법원
                    2021. 10. 14. 선고 2021다227100 판결과 이를 반영한 고용노동부 행정해석
                    변경(2021. 12. 16.)에 따른 기준입니다. 가산휴가 역시 해당 근속연수를
                    채운 다음 날에 발생합니다.
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
              heading: '법정 발생일수와 실제 정산일수는 다릅니다',
              body: (
                <p>
                  본 계산기는 <strong>사용자가 입력한 미사용 연차일수</strong>로 수당을
                  계산하며, 법정 발생일수가 그 값을 강제로 제한하지 않습니다. 회사가
                  법정 기준을 넘는 약정휴가를 두거나, 이월 연차·회계연도 기준 운영이
                  있으면 실제 정산일수가 법정 발생일수보다 많을 수 있기 때문입니다.
                  입력값이 법정 발생일수를 넘으면 계산은 그대로 하되 확인 안내를 표시합니다.
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
                월급 형태로 지급되는 경우 1일 통상임금은 월 통상임금 ÷ {MONTHLY_WORK_HOURS}시간(법정
                월 소정근로시간) × {DAILY_WORK_HOURS}시간으로 환산하는 것이 정확합니다.
              </>
            ),
            items: [
              { label: '연차수당', value: '1일 통상임금 × 미사용 연차 일수' },
              { label: '1일 통상임금', value: `시간당 통상임금 × ${DAILY_WORK_HOURS}시간` },
              { label: '시간당 통상임금', value: `월 통상임금 ÷ ${MONTHLY_WORK_HOURS}시간 (월 소정근로 ${MONTHLY_WORK_HOURS}시간 기준)` },
              { label: `${MONTHLY_WORK_HOURS}시간 근거`, value: '(주 40시간 + 주휴 8시간) × 4.345주 ≒ 209시간' },
            ],
          }}
          referenceTable={{
            caption: '근속연수별 법정 연차 일수',
            footnote:
              `근로기준법 제60조 기준. 일수는 계산 함수에서 생성됩니다. 1년 미만은 1개월 개근당 1일(최대 ${SUB_ONE_YEAR_MAX_DAYS}일), 365일 근무 후 퇴직도 최대 ${SUB_ONE_YEAR_MAX_DAYS}일이며, ${ANNUAL_LEAVE_CAP_YEARS}년 차부터는 상한 ${ANNUAL_LEAVE_MAX_DAYS}일이 적용됩니다.`,
            headers: ['연차 일수', `수당 환산 (1일 ${GUIDE_SAMPLE_DAILY_WAGE.toLocaleString('ko-KR')}원 가정)`],
            rows: [
              {
                label: '입사 1년 미만',
                values: [`최대 ${calculateSubOneYearLeaveDays(MAX_FULL_ATTENDANCE_MONTHS)}일`, `약 ${guideAmount(calculateSubOneYearLeaveDays(MAX_FULL_ATTENDANCE_MONTHS))}`],
              },
              {
                label: '365일 근무 후 퇴직',
                values: [`최대 ${SUB_ONE_YEAR_MAX_DAYS}일`, `약 ${guideAmount(SUB_ONE_YEAR_MAX_DAYS)}`],
              },
              ...GUIDE_YEAR_ROWS.map(({ label, years }) => ({
                label,
                values: [
                  years >= ANNUAL_LEAVE_CAP_YEARS
                    ? `${calculateAnnualLeaveDays(years)}일 (상한)`
                    : `${calculateAnnualLeaveDays(years)}일`,
                  guideAmount(calculateAnnualLeaveDays(years)),
                ],
              })),
            ],
          }}
          legalBasis={[
            { label: '근로기준법 제60조 (연차 유급휴가)' },
            { label: '근로기준법 제61조 (연차 유급휴가의 사용 촉진)' },
            { label: '근로기준법 제49조 (임금의 시효)' },
            { label: '대법원 2021. 10. 14. 선고 2021다227100 판결' },
            {
              label: '고용노동부 연차유급휴가 행정해석 변경 (2021.12.16)',
              href: 'https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=13052',
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
              q: '1년(365일)만 채우고 퇴사하면 연차가 26일인가요, 11일인가요?',
              a: '최대 11일입니다. 근로기준법 제60조 제1항의 15일은 1년간의 근로를 마친 "다음 날"에 근로관계가 존속해야 발생하기 때문입니다(대법원 2021. 10. 14. 선고 2021다227100 판결, 고용노동부 행정해석 변경 2021. 12. 16.). 365일째까지만 근무하고 퇴직하면 제2항에 따른 최대 11일만 정산 대상입니다. 반대로 366일째에도 근로관계가 유지되면 11일과 15일이 함께 인정되어 최대 26일이 될 수 있습니다. 3년 이상 근속자의 가산휴가도 같은 원리로 해당 연수를 채운 다음 날에 발생합니다.',
            },
            {
              q: '입사 1년 미만에도 연차수당을 받을 수 있나요?',
              a: '네. 1년 미만 근로자는 매월 개근하면 1일의 연차가 발생하여 최대 11일까지 부여됩니다. 사용하지 않은 채 퇴사하거나 1년이 경과하면 미사용 연차에 대한 수당을 받을 수 있습니다. 다만 회사가 연차사용촉진을 적법하게 시행한 경우에는 수당 지급 의무가 면제될 수 있습니다.',
            },
            {
              q: '반차(0.5일)로 남은 연차도 계산할 수 있나요?',
              a: '네. 본 계산기는 0.5일, 0.25일 같은 소수 입력을 그대로 계산하며 임의로 반올림하지 않습니다. 현행 근로기준법에는 연차를 1일 미만 단위로 부여하도록 강제하는 규정이 없어 반차 운영은 취업규칙이나 노사 합의에 따릅니다. 다만 2026년 6월 9일 공포된 개정 근로기준법(법률 제21784호)으로 시간단위 분할 사용 청구권이 신설되어 2027년 6월 10일부터 시행되며, 구체적인 시간 단위와 일수 범위는 대통령령으로 정해질 예정입니다.',
            },
            {
              q: '연차사용촉진을 받았는데 수당을 받을 수 없나요?',
              a: '연차사용촉진제도가 모든 절차를 적법하게 거쳤다면 미사용 연차에 대한 수당 지급 의무가 면제됩니다. 다만 서면(이메일·문서) 통지가 아닌 구두 통지였거나, 사용 시기를 지정해주지 않았거나, 휴가 사용을 실질적으로 방해했다면 촉진 절차가 무효이며 수당을 청구할 수 있습니다.',
            },
            {
              q: '퇴사할 때 남은 연차는 모두 수당으로 받을 수 있나요?',
              a: '퇴사 시점까지 이미 발생한 연차 중 사용하지 못한 일수는 통상임금 기준으로 수당화되어 지급됩니다. 다만 "발생하지 않은" 연차는 대상이 아닙니다. 예를 들어 정확히 1년을 채우고 퇴직하면 15일은 아직 발생하지 않았으므로 제외됩니다. 회사가 14일 이내에 지급하지 않으면 임금체불에 해당하며, 임금채권 시효는 3년이므로 그 기간 내에 청구해야 합니다.',
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
