/**
 * src/components/ui/Footer.tsx
 * 애드센스 승인 최적화 버전
 */

import Link from 'next/link'
import { OPERATOR_EMAIL, OPERATOR_NAME, SITE_NAME } from '@/lib/constants'

export default function Footer() {
  return (
      <footer className="mt-16 border-t border-slate-100 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

            {/* 운영자 정보 */}
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

              <p className="text-xs text-slate-400 mt-1" suppressHydrationWarning>
                © {new Date().getFullYear()} {SITE_NAME} · 본 사이트는 정보 제공 목적이며 실제 결과와 차이가 있을 수 있습니다.
              </p>
            </div>

            {/* 🔥 하단 메뉴 (중요) */}
            <nav className="flex items-center gap-4" aria-label="하단 메뉴">
              <Link href="/" className="text-xs text-slate-500 hover:text-brand-600">
                연봉계산기
              </Link>
              <Link href="/about" className="text-xs text-slate-500 hover:text-brand-600">
                서비스 소개
              </Link>
              <Link href="/privacy" className="text-xs text-slate-500 hover:text-brand-600">
                개인정보처리방침
              </Link>

              {/* 🔥 이거 추가 (핵심) */}
              <Link href="/contact" className="text-xs text-slate-500 hover:text-brand-600">
                문의
              </Link>
            </nav>

          </div>
        </div>
      </footer>
  )
}