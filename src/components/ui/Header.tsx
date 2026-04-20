// src/components/ui/Header.tsx
import Link from 'next/link'
import { SITE_NAME } from '@/lib/constants'

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* 로고: 루트(/)로 링크 — 홈 = 계산기 */}
        <Link
          href="/"
          className="flex items-center gap-2 group"
          aria-label={`${SITE_NAME} 홈`}
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600 text-white text-sm font-bold select-none">
            ₩
          </span>
          <span className="font-bold text-slate-900 text-[15px] tracking-tight group-hover:text-brand-600 transition-colors">
            연봉계산기<span className="text-brand-500">.kr</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="주요 메뉴">
          <Link
            href="/"
            className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
          >
            계산기
          </Link>
          <Link
            href="/about"
            className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
          >
            소개
          </Link>
        </nav>
      </div>
    </header>
  )
}
