// src/components/ui/Footer.tsx
import Link from 'next/link'
import { OPERATOR_EMAIL, OPERATOR_NAME, SITE_NAME } from '@/lib/constants'

const CALC_LINKS = [
  { href: '/salary-calculator', label: '실수령액 계산기' },
  { href: '/payroll-tax-calculator', label: '급여 세금 계산' },
  { href: '/social-insurance-calculator', label: '4대보험 계산기' },
  { href: '/severance-pay-calculator', label: '퇴직금 계산기' },
  { href: '/annual-leave-pay-calculator', label: '연차수당 계산기' },
  { href: '/weekly-holiday-pay-calculator', label: '주휴수당 계산기' },
  { href: '/unemployment-benefit-calculator', label: '실업급여 계산기' },
]

export default function Footer() {
  return (
    <footer className="mt-16 border-t bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {CALC_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs text-slate-500 hover:text-brand-600 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-700">
              {OPERATOR_NAME} | {OPERATOR_EMAIL}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              © {new Date().getFullYear()} {SITE_NAME}
            </p>
          </div>

          <div className="flex gap-4 text-sm text-slate-500">
            <Link href="/about" className="hover:text-brand-600 transition-colors">소개</Link>
            <Link href="/privacy" className="hover:text-brand-600 transition-colors">개인정보처리방침</Link>
            <Link href="/contact" className="hover:text-brand-600 transition-colors">문의</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
