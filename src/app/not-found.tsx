/**
 * src/app/not-found.tsx
 * 역할: 404 페이지 (중복 제거 완전 수정)
 */

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '페이지를 찾을 수 없습니다 (404)',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
      <main className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">

        <p className="text-7xl font-black text-brand-100 mb-2 select-none">404</p>

        <h1 className="text-xl font-bold text-slate-800 mb-2">
          페이지를 찾을 수 없어요
        </h1>

        <p className="text-sm text-slate-500 mb-8 max-w-xs leading-relaxed">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
          아래 링크를 이용해 주세요.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link href="/" className="btn-primary">
            연봉계산기 바로 가기
          </Link>

          <Link
              href="/about"
              className="px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            서비스 소개
          </Link>

          <Link
              href="/privacy"
              className="px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            개인정보처리방침
          </Link>
        </div>

      </main>
  )
}