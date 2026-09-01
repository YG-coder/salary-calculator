// src/components/ui/Footer.tsx
import Link from 'next/link'
import { OPERATOR_EMAIL, OPERATOR_NAME, SITE_NAME } from '@/lib/constants'

export const CALC_LINKS = [
  { href: '/salary-calculator', label: '실수령액 계산기' },
  { href: '/payroll-tax-calculator', label: '급여 세금 계산' },
  { href: '/salary-comparison-calculator', label: '연봉 비교 계산기' },
  { href: '/target-salary-calculator', label: '목표 실수령액 역산 계산기' },
  { href: '/bonus-withholding-calculator', label: '상여금 원천징수 계산기' },
  { href: '/employer-cost-calculator', label: '기업 총 인건비 계산기' },
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

        {/* 인컴랩 계산기 — 급여 밖 세금 계산이 필요한 이용자를 위한 안내.
            홈 CTA 대신 여기 한 번만 둔다. 계산기 페이지의 문맥 링크와는 별개다. */}
        <div className="border-t border-slate-100 pt-4 pb-4">
          <p className="text-xs font-semibold text-slate-500">인컴랩 계산기</p>
          <a
            href="https://taxsim.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-xs text-slate-500 hover:text-brand-600 transition-colors"
          >
            세금계산기 — 부가세·종합소득세·양도세 계산 ↗
          </a>
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
