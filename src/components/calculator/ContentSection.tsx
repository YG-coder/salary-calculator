/**
 * src/components/calculator/ContentSection.tsx
 * 역할: 계산기 하단 SEO 콘텐츠 섹션 (Server Component)
 * - 애드센스 승인용 고품질 텍스트 (1,200자+)
 * - 연봉 구간별 실수령 참고 테이블 (SEO 롱테일 키워드 흡수)
 * - 소득세 세율 구간 시각화 카드
 * - 내부 링크: /about, / (체류시간 + 크롤링 구조 강화)
 *
 * BUG FIX: 테이블 "월 세전" 칸에 실제 계산값 monthlyGross 필드 추가
 *   이전: annual.replace() 로 "2,400", "1원" 같은 깨진 값 출력
 *   수정: 데이터 객체에 monthlyGross 직접 포함
 */
import Link from 'next/link'
import { TAX_YEAR, RATES, PENSION_LIMITS } from '@/lib/constants'

const pensionMinMan = Math.floor(PENSION_LIMITS.min / 10_000)
const pensionMaxMan = Math.floor(PENSION_LIMITS.max / 10_000)

/**
 * 연봉 구간별 참고 실수령액 테이블
 * 조건: 부양가족 1명(본인), 비과세 0, 일반 근로자 기준 근사값
 * monthlyGross: 연봉 ÷ 12 (만원 단위)
 */
const REFERENCE_TABLE = [
  { annual: '2,400만원',     monthlyGross: '200만원',   monthlyNet: '약 168만원', rate: '84%' },
  { annual: '3,000만원',     monthlyGross: '250만원',   monthlyNet: '약 207만원', rate: '83%' },
  { annual: '3,600만원',     monthlyGross: '300만원',   monthlyNet: '약 246만원', rate: '82%' },
  { annual: '4,000만원',     monthlyGross: '333만원',   monthlyNet: '약 269만원', rate: '81%' },
  { annual: '4,800만원',     monthlyGross: '400만원',   monthlyNet: '약 318만원', rate: '79%' },
  { annual: '5,000만원',     monthlyGross: '417만원',   monthlyNet: '약 330만원', rate: '79%' },
  { annual: '6,000만원',     monthlyGross: '500만원',   monthlyNet: '약 390만원', rate: '78%' },
  { annual: '7,000만원',     monthlyGross: '583만원',   monthlyNet: '약 437만원', rate: '75%' },
  { annual: '8,000만원',     monthlyGross: '667만원',   monthlyNet: '약 492만원', rate: '74%' },
  { annual: '1억원',         monthlyGross: '833만원',   monthlyNet: '약 597만원', rate: '72%' },
  { annual: '1억 2,000만원', monthlyGross: '1,000만원', monthlyNet: '약 704만원', rate: '70%' },
] as const

export default function ContentSection() {
  return (
    <section className="mt-10 space-y-6" aria-label="연봉 계산 안내">

      {/* ── 본문 설명 카드 ───────────────────────────────────── */}
      <div className="card p-6 sm:p-8 space-y-7">

        <div>
          <h2 className="text-base font-bold text-slate-800 mb-2">
            연봉 실수령액이란?
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            연봉 실수령액이란 세전 연봉에서 4대보험(국민연금, 건강보험, 장기요양보험, 고용보험)과
            소득세·지방소득세를 공제한 후 실제로 통장에 입금되는 금액입니다. 동일한 연봉이라도
            비과세 항목, 부양가족 수, 회사 규모(두루누리 사회보험 지원 여부)에 따라 실수령액이
            크게 달라질 수 있습니다. 일반적으로 연봉의 72~85% 수준이 실수령액이며,
            연봉이 높을수록 누진세율 적용으로 실효세율이 높아집니다.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-800 mb-3">
            4대보험 계산 방법 ({TAX_YEAR}년 기준)
          </h2>
          <ul className="text-sm text-slate-600 leading-relaxed space-y-3 list-none pl-0">
            {[
              {
                name: '국민연금',
                desc: `월 과세 급여의 ${(RATES.nationalPension * 100).toFixed(1)}%를 근로자가 부담합니다. 기준소득월액 상한은 ${pensionMaxMan}만원, 하한은 ${pensionMinMan}만원으로 이 범위 내에서만 계산됩니다. 월 급여가 617만원을 초과해도 617만원 기준으로 계산되어 최대 277,650원이 공제됩니다.`,
              },
              {
                name: '건강보험',
                desc: `월 과세 급여의 ${(RATES.healthInsurance * 100).toFixed(3)}%를 근로자가 부담합니다. 회사도 동일 금액을 부담하며, 이 계산기는 근로자 부담분만 표시합니다. 연봉 5,000만원 기준 월 약 14만원 수준입니다.`,
              },
              {
                name: '장기요양보험',
                desc: `건강보험료의 ${(RATES.longTermCare * 100).toFixed(2)}%입니다. 노인 장기요양 서비스 재원 마련을 위해 건강보험료와 함께 납부하며, 건강보험료가 결정되면 자동으로 산출됩니다.`,
              },
              {
                name: '고용보험',
                desc: `월 과세 급여의 ${(RATES.employment * 100).toFixed(1)}%를 근로자가 부담합니다. 실직 시 실업급여, 육아휴직급여, 직업훈련비 지원 등에 활용됩니다. 월 급여 400만원 기준 약 36,000원 수준입니다.`,
              },
            ].map(({ name, desc }) => (
              <li key={name} className="flex gap-2.5">
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-brand-400 mt-[7px]" />
                <span>
                  <strong className="font-semibold text-slate-700">{name}: </strong>
                  {desc}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-800 mb-2">
            소득세 계산 방법 — 누진세율 구조
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            소득세는 누진세율 구조로, 과세표준이 높을수록 더 높은 세율이 적용됩니다.
            연 과세 급여에서 근로소득공제(최대 1,400만원)와 인적공제(부양가족 1인당 150만원)를
            차감한 과세표준에 아래 세율을 적용합니다.
          </p>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { range: '1,400만원 이하', rate: '6%' },
              { range: '5,000만원 이하', rate: '15%' },
              { range: '8,800만원 이하', rate: '24%' },
              { range: '1.5억원 이하',   rate: '35%' },
              { range: '3억원 이하',     rate: '38%' },
              { range: '5억원 이하',     rate: '40%' },
              { range: '10억원 이하',    rate: '42%' },
              { range: '10억원 초과',    rate: '45%' },
            ].map(({ range, rate }) => (
              <div key={range} className="bg-slate-50 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-slate-500">{range}</p>
                <p className="text-sm font-bold text-brand-600">{rate}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            * 지방소득세는 소득세의 10%가 추가 부과됩니다.
            근로소득세액공제(최대 74만원) 적용 후 실납부액이 결정됩니다.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-800 mb-2">
            비과세 항목이란? — 절세의 시작
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            비과세 급여는 소득세·4대보험 산정에서 제외되는 항목으로, 잘 활용할수록 실수령액이
            늘어납니다. 대표적 비과세 항목으로는 월 20만원 한도 식대 보조금, 차량 유지비(월 20만원
            한도), 육아수당(월 10만원 한도), 생산직 근로자 초과근무수당, 국외근로소득(월 100만원
            한도) 등이 있습니다. 연봉 협상 시 비과세 항목을 최대한 활용하면 실수령액을 유지하면서
            세금 부담을 줄일 수 있습니다.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-800 mb-2">
            실수령액을 높이는 절세 방법
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            연말정산과 비과세 항목을 적극 활용하면 세후 소득을 크게 높일 수 있습니다.
            첫째, 개인형 퇴직연금(IRP)에 연 700만원을 납입하면 최대 115.5만원(세율 16.5%)의
            세액공제를 받을 수 있습니다. 둘째, 연금저축(최대 400만원)을 IRP와 합산해 700만원까지
            세액공제를 받을 수 있습니다. 셋째, 의료비·교육비·기부금·신용카드 사용액은 연말정산 시
            공제 항목으로 환급받을 수 있습니다. 넷째, 무주택자의 월세 납부액은 연 750만원 한도로
            15~17%의 세액공제가 가능합니다.
          </p>
        </div>

        {/* 주의사항 + 내부링크 */}
        <div className="bg-brand-50 rounded-xl p-4 border border-brand-100">
          <p className="text-xs text-brand-700 leading-relaxed">
            <strong className="font-semibold">📌 주의사항:</strong>{' '}
            본 계산기는 {TAX_YEAR}년 기준 근사값을 제공하며, 실제 급여는 회사 규정·
            두루누리 사회보험 지원·특수 공제 항목 등에 따라 달라질 수 있습니다.
            정확한 세금 신고 및 급여 계산은 반드시 담당 세무사 또는{' '}
            <a
              href="https://www.hometax.go.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-brand-900"
            >
              국세청 홈택스
            </a>
            를 통해 확인하세요.{' '}
            <Link href="/about" className="underline hover:text-brand-900">
              서비스 소개
            </Link>
            에서 이 계산기에 대해 더 알아볼 수 있습니다.
          </p>
        </div>
      </div>

      {/* ── 연봉 구간별 실수령 참고 테이블 ──────────────────── */}
      <div className="card p-6 sm:p-8">
        <h2 className="text-base font-bold text-slate-800 mb-1">
          연봉별 월 실수령액 참고표 ({TAX_YEAR}년 기준)
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          부양가족 1명(본인), 비과세 없음, 일반 근로자 기준 근사값입니다.
          정확한 금액은 위 계산기에 직접 입력해 확인하세요.
        </p>

        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm border-collapse min-w-[400px]">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-3 py-2.5 text-left   text-xs font-semibold text-slate-600 rounded-tl-lg">연봉</th>
                <th className="px-3 py-2.5 text-right  text-xs font-semibold text-slate-600">월 세전</th>
                <th className="px-3 py-2.5 text-right  text-xs font-semibold text-slate-600">월 실수령 (참고)</th>
                <th className="px-3 py-2.5 text-right  text-xs font-semibold text-slate-600 rounded-tr-lg">실수령률</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {REFERENCE_TABLE.map(({ annual, monthlyGross, monthlyNet, rate }, i) => (
                <tr key={annual} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="px-3 py-2.5 font-semibold text-slate-800">{annual}</td>
                  <td className="px-3 py-2.5 text-right text-slate-500">{monthlyGross}</td>
                  <td className="px-3 py-2.5 text-right font-bold text-brand-700">{monthlyNet}</td>
                  <td className="px-3 py-2.5 text-right text-slate-500">{rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-400 mt-3">
          * 위 표는 참고용 근사값입니다.{' '}
          <Link href="/" className="text-brand-600 hover:underline font-medium">
            계산기
          </Link>
          에 정확한 연봉을 입력하면 실제 공제 내역을 항목별로 확인할 수 있습니다.
        </p>
      </div>

    </section>
  )
}
