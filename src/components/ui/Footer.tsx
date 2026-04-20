import Link from 'next/link'
import { OPERATOR_EMAIL, OPERATOR_NAME, SITE_NAME } from '@/lib/constants'

export default function Footer() {
  return (
      <footer className="mt-16 border-t bg-white">
        <div className="max-w-3xl mx-auto px-4 py-8">

          <p className="text-sm font-semibold">
            {OPERATOR_NAME} | {OPERATOR_EMAIL}
          </p>

          <p className="text-xs text-gray-400 mt-1">
            © {new Date().getFullYear()} {SITE_NAME}
          </p>

          <div className="mt-4 flex gap-4 text-sm">
            <Link href="/">계산기</Link>
            <Link href="/about">소개</Link>
            <Link href="/privacy">개인정보처리방침</Link>
            <Link href="/contact">문의</Link>
          </div>

        </div>
      </footer>
  )
}