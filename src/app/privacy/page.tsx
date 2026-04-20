/**
 * src/app/privacy/page.tsx
 * 역할: 개인정보처리방침 페이지 (애드센스 승인 필수)
 * - robots: index: true (심사 시 전 페이지 색인 권장)
 * - 내부 링크: 계산기(홈), 서비스 소개
 * - OPERATOR_EMAIL, OPERATOR_NAME constants 연동
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/ui/Header'
import Footer from '@/components/ui/Footer'
import { SITE_URL, SITE_NAME, OPERATOR_EMAIL, OPERATOR_NAME } from '@/lib/constants'

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description:
    `${SITE_NAME} 개인정보처리방침입니다. 수집 항목, 이용 목적, 보유 기간, 이용자 권리 등을 안내합니다.`,
  alternates: { canonical: `${SITE_URL}/privacy` },
  robots: { index: true, follow: true },
}

const EFFECTIVE_DATE = '2026년 01월 01일'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* 브레드크럼 내부 링크 */}
        <nav className="flex items-center gap-2 text-xs text-slate-400 mb-6" aria-label="breadcrumb">
          <Link href="/" className="hover:text-brand-600 transition-colors">홈</Link>
          <span>›</span>
          <span className="text-slate-600">개인정보처리방침</span>
        </nav>

        <h1 className="text-2xl font-black text-slate-900 mb-2">개인정보처리방침</h1>
        <p className="text-sm text-slate-400 mb-8">시행일: {EFFECTIVE_DATE}</p>

        <div className="card p-6 sm:p-8 space-y-8 text-sm text-slate-600 leading-relaxed">

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-2">제1조 (개인정보 수집 항목)</h2>
            <p>
              {SITE_NAME}(이하 &quot;서비스&quot;)은 별도의 회원가입이나 로그인 없이 이용 가능하며,
              계산기 이용 시 입력하신 연봉·비과세·부양가족 수 등의 수치 정보는
              서버에 저장되지 않고 브라우저 내에서만 처리됩니다.
            </p>
            <p className="mt-2">서비스 운영 과정에서 아래의 정보가 자동으로 수집될 수 있습니다:</p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li>접속 IP 주소 (웹 서버 로그)</li>
              <li>방문 일시, 브라우저 종류 및 운영체제</li>
              <li>방문 페이지 URL</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-2">제2조 (개인정보 수집·이용 목적)</h2>
            <ul className="space-y-1 list-disc pl-5">
              <li>서비스 제공 및 운영 (계산기 기능 제공)</li>
              <li>서비스 품질 개선 및 이용 현황 파악</li>
              <li>불법·부정 이용 방지</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-2">제3조 (개인정보 보유 및 이용 기간)</h2>
            <p>
              자동 수집되는 서버 로그는 최대 30일간 보관 후 자동 삭제됩니다.
              관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-2">제4조 (쿠키 및 광고)</h2>
            <p>
              서비스는 Google AdSense 등 광고 서비스를 사용할 수 있으며, 해당 광고
              플랫폼은 맞춤형 광고 제공을 위해 쿠키 또는 유사 기술을 사용할 수 있습니다.
              광고 쿠키 설정은 브라우저 쿠키 설정 또는{' '}
              <a
                href="https://adssettings.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 hover:underline"
              >
                Google 광고 설정
              </a>
              을 통해 관리하실 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-2">제5조 (제3자 제공)</h2>
            <p>
              수집한 개인정보는 원칙적으로 제3자에게 제공하지 않습니다.
              다만, 법령에 의거하거나 수사기관의 요청이 있는 경우에는 예외적으로 제공될 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-2">제6조 (이용자의 권리)</h2>
            <p>
              이용자는 언제든지 본인의 개인정보 처리에 관한 문의·열람·정정·삭제 요청을
              아래 연락처로 할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-2">제7조 (개인정보 보호 책임자)</h2>
            <table className="w-full border-collapse mt-1">
              <tbody>
                {([
                  ['운영 주체', OPERATOR_NAME],
                  ['이메일',    OPERATOR_EMAIL],
                ] as [string, string][]).map(([k, v]) => (
                  <tr key={k} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-medium text-slate-700 w-32">{k}</td>
                    <td className="py-2">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-2">제8조 (방침 변경)</h2>
            <p>
              본 방침은 시행일부터 적용되며, 변경 시 서비스 내 공지사항을 통해 안내합니다.
            </p>
            <p className="mt-2 font-medium text-slate-700">시행일: {EFFECTIVE_DATE}</p>
          </section>
        </div>

        {/* 내부 링크 */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn-primary text-sm">
            연봉계산기 바로 가기
          </Link>
          <Link
            href="/about"
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            서비스 소개
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
