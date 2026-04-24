// src/components/ui/Header.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { SITE_NAME } from '@/lib/constants'

const NAV_ITEMS = [
  { href: '/', label: '홈' },
  { href: '/salary-calculator', label: '실수령액' },
  { href: '/social-insurance-calculator', label: '4대보험' },
  { href: '/severance-pay-calculator', label: '퇴직금' },
]

const MORE_ITEMS = [
  { href: '/payroll-tax-calculator', label: '급여 세금 간편 계산' },
  { href: '/annual-leave-pay-calculator', label: '연차수당 계산기' },
  { href: '/weekly-holiday-pay-calculator', label: '주휴수당 계산기' },
  { href: '/unemployment-benefit-calculator', label: '실업급여 계산기' },
]

export default function Header() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
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

        <nav className="flex items-center gap-0.5" aria-label="주요 메뉴">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:text-brand-600 hover:bg-brand-50',
                ].join(' ')}
              >
                {item.label}
              </Link>
            )
          })}

          <div className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1"
            >
              더보기
              <span className={['text-[10px] transition-transform duration-200', moreOpen ? 'rotate-180' : ''].join(' ')}>▾</span>
            </button>

            {moreOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMoreOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-slate-100 rounded-xl shadow-lg py-1 min-w-[180px]">
                  {MORE_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={[
                        'block px-4 py-2.5 text-sm font-medium transition-colors',
                        pathname === item.href
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-brand-600',
                      ].join(' ')}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
