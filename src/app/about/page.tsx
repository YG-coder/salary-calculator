/**
 * src/app/about/page.tsx
 * 서비스 소개 페이지 (신뢰성 강화 버전)
 * - E-E-A-T 신호: 운영자 정보, 데이터 출처, 업데이트 정책, 면책 조항
 * - 애드센스 승인 시 평가 항목인 "사이트 정보" 가시성 강화
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import {
  SITE_URL,
  SITE_NAME,
  OPERATOR_NAME,
  OPERATOR_EMAIL,
  TAX_YEAR,
  RATES,
  PENSION_LIMITS,
  MIN_HOURLY_WAGE_2026,
} from '@/lib/constants'

export const metadata: Metadata = {
  title: '서비스 소개',
  description: `${SITE_NAME}은 ${TAX_YEAR}년 기준 한국 직장인을 위한 무료 급여 계산기 서비스입니다. 실수령액·4대보험·퇴직금·연차수당·주휴수당·실업급여를 한 곳에서 계산할 수 있습니다.`,
  alternates: { canonical: `${SITE_URL}/about` },
  robots: { index: true, follow: true },
}

const pensionMinMan = Math.floor(PENSION_LIMITS.min / 10_000)
const pensionMaxMan = Math.floor(PENSION_LIMITS.max / 10_000)

const CALCULATORS = [
  { href: '/salary-calculator', label: '연봉 실수령액 계산기' },
  { href: '/payroll-tax-calculator', label: '급여 세금 간편 계산기' },
  { href: '/social-insurance-calculator', label: '4대보험 계산기' },
  { href: '/severance-pay-calculator', label: '퇴직금 계산기' },
  { href: '/annual-leave-pay-calculator', label: '연차수당 계산기' },
  { href: '/weekly-holiday-pay-calculator', label: '주휴수당 계산기' },
  { href: '/unemployment-benefit-calculator', label: '실업급여 계산기' },
]

const DATA_SOURCES = [
  {
    label: '국세청 (소득세 누진세율, 근로소득공제, 간이세액표)',
    href: 'https://www.nts.go.kr',
  },
  {
    label: '국민연금공단 (국민연금 요율, 기준소득월액 상·하한)',
    href: 'https://www.nps.or.kr',
  },
  {
    label: '국민건강보험공단 (건강보험료, 장기요양보험료)',
    href: 'https://www.nhis.or.kr',
  },
  {
    label: '근로복지공단 (고용보험·산재보험)',
    href: 'https://www.comwel.or.kr',
  },
  {
    label: '고용노동부 (실업급여 상·하한, 최저임금, 근로기준법)',
    href: 'https://www.moel.go.kr',
  },
  {
    label: '4대 사회보험 정보연계센터',
    href: 'https://www.4insure.or.kr',
  },
]

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 text-slate-700">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">서비스 소개</h1>
      <p className="text-sm text-slate-500 mb-8">
        {SITE_NAME} · {TAX_YEAR}년 기준 한국 직장인 급여 계산기
      </p>

      {/* ── 서비스 개요 ──────────────────────────────────── */}
      <section className="card p-6 sm:p-8 mb-6 space-y-4 leading-relaxed">
        <h2 className="text-lg font-bold text-slate-800">
          어떤 서비스인가요?
        </h2>
        <p className="text-sm">
          {SITE_NAME}은 한국 직장인이 자신의 연봉·월급에서 얼마가 공제되고 실제로 통장에
          얼마가 들어오는지를 빠르게 확인할 수 있도록 만든 무료 온라인 계산기 서비스입니다.
          별도의 회원가입, 개인정보 입력, 광고 시청 없이 바로 사용할 수 있으며, 입력한
          금액은 서버로 전송되지 않고 사용자의 브라우저에서만 계산됩니다.
        </p>
        <p className="text-sm">
          연봉 실수령액 계산을 중심으로, 직장인이 자주 필요로 하는 4대보험·퇴직금·연차
          수당·주휴수당·실업급여까지 7가지 계산기를 제공합니다. 각 계산기는 {TAX_YEAR}년
          최신 법령과 고시 요율을 반영해 갱신되며, 결과 화면에 계산 근거가 되는 공식과
          요율을 함께 표시합니다.
        </p>
      </section>

      {/* ── 제공 계산기 ──────────────────────────────────── */}
      <section className="card p-6 sm:p-8 mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">제공 계산기</h2>
        <ul className="grid sm:grid-cols-2 gap-2">
          {CALCULATORS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="text-sm text-brand-600 hover:text-brand-800 hover:underline"
              >
                · {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ── 계산 기준 ────────────────────────────────────── */}
      <section className="card p-6 sm:p-8 mb-6 space-y-4 leading-relaxed">
        <h2 className="text-lg font-bold text-slate-800">
          계산 기준 ({TAX_YEAR}년)
        </h2>
        <p className="text-sm">
          본 서비스의 모든 계산은 공식 정부 기관이 고시한 {TAX_YEAR}년 요율과 법령을
          따릅니다. 주요 기준값은 다음과 같습니다.
        </p>

        <div className="bg-slate-50 rounded-xl p-4 sm:p-5 text-sm space-y-2">
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">국민연금 (근로자)</span>
            <span className="font-semibold text-slate-800">
              {(RATES.nationalPension * 100).toFixed(2)}% (상한 {pensionMaxMan}만원
              / 하한 {pensionMinMan}만원)
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">건강보험 (근로자)</span>
            <span className="font-semibold text-slate-800">
              {(RATES.healthInsurance * 100).toFixed(3)}%
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">장기요양보험</span>
            <span className="font-semibold text-slate-800">
              건강보험료의 {(RATES.longTermCare * 100).toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">고용보험 (근로자)</span>
            <span className="font-semibold text-slate-800">
              {(RATES.employment * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">소득세</span>
            <span className="font-semibold text-slate-800">
              6% ~ 45% 누진세율 (8단계 구간)
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">지방소득세</span>
            <span className="font-semibold text-slate-800">소득세의 10%</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">최저시급</span>
            <span className="font-semibold text-slate-800">
              {MIN_HOURLY_WAGE_2026.toLocaleString()}원
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          요율이나 법령이 개정되면 그 시점부터 새로 적용된 값으로 계산기를 즉시
          갱신합니다. 갱신 이력은 사이트맵과 각 페이지 메타데이터의 lastmod 값에서 확인할
          수 있습니다.
        </p>
      </section>

      {/* ── 데이터 출처 ──────────────────────────────────── */}
      <section className="card p-6 sm:p-8 mb-6 space-y-3 leading-relaxed">
        <h2 className="text-lg font-bold text-slate-800">데이터 출처</h2>
        <p className="text-sm">
          모든 계산식과 요율은 다음의 공식 정부·공공기관 자료를 1차 출처로 합니다.
          각 페이지 하단의 “법적 근거” 섹션에서 해당 계산에 적용된 구체적인 법조항을
          확인할 수 있습니다.
        </p>
        <ul className="space-y-1.5 text-sm">
          {DATA_SOURCES.map(({ label, href }) => (
            <li key={label} className="flex gap-2.5">
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-brand-400 mt-[7px]" />
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 hover:underline"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* ── 정확성과 면책 ─────────────────────────────────── */}
      <section className="card p-6 sm:p-8 mb-6 space-y-4 leading-relaxed">
        <h2 className="text-lg font-bold text-slate-800">정확성과 한계</h2>
        <p className="text-sm">
          본 서비스가 제공하는 계산 결과는 공식 산식에 따른 <strong>근사값</strong>입니다.
          실제 급여명세서·세금·보험료와 다음 사유로 차이가 발생할 수 있습니다.
        </p>
        <ul className="list-disc pl-5 text-sm space-y-1.5 text-slate-600">
          <li>
            국세청 간이세액표 적용 비율(80%·100%·120%) 회사 정책에 따른 매월 원천징수
            금액 차이
          </li>
          <li>
            두루누리 사회보험료 지원, 청년 일자리 지원금 등 정부 지원에 따른 보험료
            감면
          </li>
          <li>
            회사별 취업규칙·단체협약, 비과세 항목 처리 방식, 연봉에 상여금 포함 여부
          </li>
          <li>
            산재보험 업종별 요율 차이(0.7%~18%), 사업장 규모별 고용보험 분담분 차등
          </li>
          <li>
            연말정산 시 적용되는 의료비·교육비·기부금·신용카드 등 추가 공제 항목
          </li>
        </ul>
        <p className="text-sm">
          따라서 본 계산기 결과는 <strong>의사결정의 참고용</strong>으로만 활용하시고,
          정확한 세무 처리나 임금체불 분쟁 시에는 반드시 국세청, 4대 사회보험 정보연계
          센터, 또는 노무사·세무사 등 전문가의 상담을 받으시기 바랍니다.
        </p>
      </section>

      {/* ── 운영자 정보 ──────────────────────────────────── */}
      <section className="card p-6 sm:p-8 mb-6 space-y-3 leading-relaxed">
        <h2 className="text-lg font-bold text-slate-800">운영자 정보</h2>
        <p className="text-sm">
          본 사이트는 <strong>{OPERATOR_NAME}</strong>이 직접 개발·운영합니다.
          서비스에 대한 문의, 계산 오류 제보, 개선 제안 등은 아래 이메일로 보내주시면
          확인 후 회신드립니다.
        </p>
        <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-1.5">
          <p>
            <span className="text-slate-500">운영자: </span>
            <span className="font-semibold text-slate-800">{OPERATOR_NAME}</span>
          </p>
          <p>
            <span className="text-slate-500">이메일: </span>
            <a
              href={`mailto:${OPERATOR_EMAIL}`}
              className="font-semibold text-brand-700 hover:underline"
            >
              {OPERATOR_EMAIL}
            </a>
          </p>
          <p>
            <span className="text-slate-500">사이트 URL: </span>
            <a
              href={SITE_URL}
              className="font-semibold text-brand-700 hover:underline"
            >
              {SITE_URL}
            </a>
          </p>
        </div>
      </section>

      {/* ── 개인정보 처리 방침 안내 ────────────────────────── */}
      <section className="card p-6 sm:p-8 mb-6 space-y-3 leading-relaxed">
        <h2 className="text-lg font-bold text-slate-800">개인정보 처리</h2>
        <p className="text-sm">
          본 서비스는 사용자의 개인정보를 수집하지 않습니다. 입력한 연봉·월급 등의
          금액은 사용자의 브라우저에서만 계산되며 외부 서버로 전송되지 않습니다.
          접속 통계 수집을 위해 일부 익명 분석 도구(Google Analytics 등)가 적용될 수
          있으며, 자세한 내용은{' '}
          <Link href="/privacy" className="text-brand-600 hover:underline">
            개인정보 처리방침
          </Link>
          을 참고하세요.
        </p>
      </section>

      {/* ── 하단 네비게이션 ──────────────────────────────── */}
      <div className="flex flex-wrap gap-4 text-sm pt-4 border-t border-slate-100">
        <Link href="/" className="text-brand-600 hover:underline">
          홈으로
        </Link>
        <Link href="/salary-calculator" className="text-brand-600 hover:underline">
          연봉 실수령액 계산기
        </Link>
        <Link href="/privacy" className="text-brand-600 hover:underline">
          개인정보처리방침
        </Link>
        <Link href="/contact" className="text-brand-600 hover:underline">
          문의하기
        </Link>
      </div>
    </main>
  )
}
