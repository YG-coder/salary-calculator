/**
 * src/components/ui/Footer.tsx
 * 역할: 전체 페이지 하단 공통 푸터
 * - 운영자 정보 표시 (애드센스 승인 필수 요소)
 * - 내부 링크: 서비스 소개, 개인정보처리방침
 * - hydration fix: getFullYear()를 suppressHydrationWarning으로 처리
 */
import Link from 'next/link'
import { OPERATOR_EMAIL, OPERATOR_NAME, SITE_NAME } from '@/lib/constants'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-100 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700">
              {OPERATOR_NAME} 운영 |{' '}
              <a
                href={`mailto:${OPERATOR_EMAIL}`}
                className="text-brand-600 hover:underline"
              >
                {OPERATOR_EMAIL}
              </a>
            </p>
            {/* suppressHydrationWarning: new Date()의 서버/클라이언트 불일치 방지 */}
            <p className="text-xs text-slate-400 mt-1" suppressHydrationWarning>
              © {new Date().getFullYear()} {SITE_NAME} · 본 계산 결과는 참고용이며 실제 급여와 다를 수 있습니다.
            </p>
          </div>
          <nav className="flex items-center gap-4" aria-label="하단 메뉴">
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-brand-600 transition-colors"
            >
              연봉계산기
            </Link>
            <Link
              href="/about"
              className="text-xs text-slate-500 hover:text-brand-600 transition-colors"
            >
              서비스 소개
            </Link>
            <Link
              href="/privacy"
              className="text-xs text-slate-500 hover:text-brand-600 transition-colors"
            >
              개인정보처리방침
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
