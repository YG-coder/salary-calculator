/**
 * src/app/about/page.tsx
 * 역할: 서비스 소개 페이지 (애드센스 심사 필수 페이지)
 * - 내부 링크: 계산기(홈), 개인정보처리방침
 * - 브레드크럼 내비게이션
 * - constants에서 모든 동적 값 import
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/ui/Header'
import Footer from '@/components/ui/Footer'
import {
  SITE_URL, SITE_NAME, OPERATOR_NAME, OPERATOR_EMAIL, TAX_YEAR, RATES,
} from '@/lib/constants'

export const metadata: Metadata = {
  title: '서비스 소개',
  description:
    `${SITE_NAME}은 ${TAX_YEAR}년 최신 기준으로 연봉 실수령액을 간편하게 계산할 수 있는 무료 서비스입니다. 국민연금, 건강보험, 고용보험, 소득세를 자동 계산합니다.`,
  alternates: { canonical: `${SITE_URL}/about` },
  robots: { index: true, follow: true },
}

const features = [
  `연봉 기반 월 실수령액·연 실수령액 즉시 계산`,
  `국민연금(${(RATES.nationalPension * 100).toFixed(1)}%), 건강보험(${(RATES.healthInsurance * 100).toFixed(3)}%), 장기요양(건보료×${(RATES.longTermCare * 100).toFixed(2)}%), 고용보험(${(RATES.employment * 100).toFixed(1)}%) 자동 계산`,
  '간이세액표 기반 소득세·지방소득세 누진 계산',
  '월 비과세 금액 반영 (식대, 차량 유지비 등)',
  '부양가족 수에 따른 인적공제 자동 반영',
  '항목별 공제액 비율 바 시각화',
  '모바일 최적화 반응형 UI',
  '서버 저장 없음 — 개인정보 완전 보호',
]

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* 브레드크럼 */}
        <nav className="flex items-center gap-2 text-xs text-slate-400 mb-6" aria-label="breadcrumb">
          <Link href="/" className="hover:text-brand-600 transition-colors">홈</Link>
          <span>›</span>
          <span className="text-slate-600">서비스 소개</span>
        </nav>

        <h1 className="text-2xl font-black text-slate-900 mb-8">서비스 소개</h1>

        <div className="space-y-5">
          {/* 소개 */}
          <div className="card p-6 space-y-3">
            <h2 className="text-base font-bold text-slate-800">{SITE_NAME} 소개</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {SITE_NAME}은 직장인 누구나 손쉽게 연봉 실수령액을 확인할 수 있도록
              만들어진 무료 온라인 계산기 서비스입니다. {TAX_YEAR}년 기준 세율·보험료율을
              반영하여 연봉만 입력하면 즉시 월 실수령액을 확인할 수 있습니다.
              계산 결과는 브라우저 내에서만 처리되며, 서버에 저장되지 않아 개인정보 걱정 없이
              안전하게 사용하실 수 있습니다.
            </p>
          </div>

          {/* 기능 목록 */}
          <div className="card p-6 space-y-3">
            <h2 className="text-base font-bold text-slate-800">제공 기능</h2>
            <ul className="space-y-2 text-sm text-slate-600">
              {features.map((item) => (
                <li key={item} className="flex gap-2 items-start">
                  <span className="mt-[5px] w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* 운영자 정보 */}
          <div className="card p-6">
            <h2 className="text-base font-bold text-slate-800 mb-3">운영자 정보</h2>
            <table className="w-full text-sm border-collapse">
              <tbody>
                {([
                  ['운영 주체', OPERATOR_NAME],
                  ['서비스명',  SITE_NAME],
                  ['이메일',    OPERATOR_EMAIL],
                  ['기준 연도', `${TAX_YEAR}년`],
                  ['목적',      '연봉 실수령액 무료 계산 서비스'],
                ] as [string, string][]).map(([k, v]) => (
                  <tr key={k} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 pr-4 font-semibold text-slate-700 w-28 align-top">{k}</td>
                    <td className="py-2.5 text-slate-600">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 면책 */}
          <div className="card p-5 bg-amber-50 border-amber-100">
            <h2 className="text-sm font-bold text-amber-800 mb-1.5">면책 조항</h2>
            <p className="text-xs text-amber-700 leading-relaxed">
              본 서비스는 정보 제공 목적의 참고용 계산기입니다. 계산 결과는 {TAX_YEAR}년 기준
              근사값으로, 실제 급여·세금과 다를 수 있습니다. 정확한 세무 처리는 반드시
              공인세무사 또는 국세청 홈택스를 통해 확인하시기 바랍니다.
            </p>
          </div>

          {/* 내부 링크 */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/" className="btn-primary">
              연봉계산기 바로 사용하기 →
            </Link>
            <Link
              href="/privacy"
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              개인정보처리방침
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
