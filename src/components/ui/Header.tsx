// src/components/ui/Header.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SITE_NAME } from '@/lib/constants'

export const NAV_ITEMS = [
  { href: '/', label: '홈' },
  { href: '/salary-calculator', label: '실수령액' },
  { href: '/salary-comparison-calculator', label: '연봉 비교' },
  { href: '/severance-pay-calculator', label: '퇴직금' },
]

export const MENU_GROUPS = [
  {
    title: '급여·공제',
    items: [
      { href: '/salary-calculator', label: '연봉 실수령액' },
      { href: '/payroll-tax-calculator', label: '급여 세금 간편 계산' },
      { href: '/social-insurance-calculator', label: '4대보험' },
    ],
  },
  {
    title: '연봉협상',
    items: [
      { href: '/salary-comparison-calculator', label: '연봉 비교' },
      { href: '/target-salary-calculator', label: '목표 실수령액 역산' },
    ],
  },
  {
    title: '퇴직·수당',
    items: [
      { href: '/severance-pay-calculator', label: '퇴직금' },
      { href: '/annual-leave-pay-calculator', label: '연차수당' },
      { href: '/weekly-holiday-pay-calculator', label: '주휴수당' },
      { href: '/unemployment-benefit-calculator', label: '실업급여' },
    ],
  },
  {
    title: '사업주·인사',
    items: [
      { href: '/bonus-withholding-calculator', label: '상여금 원천징수' },
      { href: '/employer-cost-calculator', label: '기업 총 인건비' },
    ],
  },
]

export const MORE_ITEMS = MENU_GROUPS.flatMap((group) => group.items)

export default function Header() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuIsActive = MORE_ITEMS.some((item) => item.href === pathname)

  useEffect(() => {
    if (!menuOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2" aria-label={`${SITE_NAME} 홈`}>
          <Image
            src="/logo.svg"
            alt=""
            width={32}
            height={32}
            priority
            className="h-8 w-8 rounded-lg"
          />
          <span className="text-[15px] font-bold tracking-tight text-slate-900 transition-colors group-hover:text-brand-600">
            연봉계산기<span className="text-brand-500">.kr</span>
          </span>
        </Link>

        <nav className="flex items-center gap-0.5" aria-label="주요 메뉴">
          <div className="hidden items-center gap-0.5 sm:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-brand-50 hover:text-brand-600',
                  ].join(' ')}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>

          <div className="relative">
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-controls="calculator-menu"
              onClick={() => setMenuOpen((open) => !open)}
              className={[
                'flex min-h-10 items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                menuIsActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-brand-50 hover:text-brand-600',
              ].join(' ')}
            >
              <span className="hidden sm:inline">계산기 전체</span>
              <span className="sm:hidden">계산기</span>
              <span
                aria-hidden="true"
                className={[
                  'text-[10px] transition-transform duration-200',
                  menuOpen ? 'rotate-180' : '',
                ].join(' ')}
              >
                ▾
              </span>
            </button>

            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-label="계산기 메뉴 닫기"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  id="calculator-menu"
                  role="menu"
                  className="absolute right-0 top-full z-20 mt-1 max-h-[calc(100vh-5rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-xl"
                >
                  <div className="grid gap-1 sm:grid-cols-2">
                    {MENU_GROUPS.map((group) => (
                      <section key={group.title} className="rounded-xl p-2" aria-labelledby={`menu-${group.title}`}>
                        <h2 id={`menu-${group.title}`} className="px-2 pb-1.5 text-xs font-bold text-slate-400">
                          {group.title}
                        </h2>
                        <div className="space-y-0.5">
                          {group.items.map((item) => {
                            const isActive = pathname === item.href

                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                role="menuitem"
                                aria-current={isActive ? 'page' : undefined}
                                onClick={() => setMenuOpen(false)}
                                className={[
                                  'block rounded-lg px-2 py-2 text-sm font-medium transition-colors',
                                  isActive
                                    ? 'bg-brand-50 text-brand-700'
                                    : 'text-slate-700 hover:bg-slate-50 hover:text-brand-600',
                                ].join(' ')}
                              >
                                {item.label}
                              </Link>
                            )
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
