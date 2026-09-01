import type { Metadata } from 'next'
import Link from 'next/link'
import {
    SITE_NAME,
    SITE_URL,
    OPERATOR_EMAIL,
    OPERATOR_NAME,
} from '@/lib/constants'

export const metadata: Metadata = {
  title: '문의하기',
  description: `${SITE_NAME} 계산 오류 제보, 기능 제안 및 개인정보 관련 문의 안내`,
  alternates: { canonical: `${SITE_URL}/contact` },
}

export default function ContactPage() {
    return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-slate-700">
      <h1 className="mb-2 text-3xl font-bold text-slate-900">문의하기</h1>
      <p className="mb-8 text-sm text-slate-500">계산 오류 제보와 개선 의견을 기다립니다.</p>

      <section className="card mb-6 space-y-5 p-6 text-sm leading-relaxed sm:p-8">
        <div>
          <h2 className="mb-2 text-lg font-bold text-slate-800">문의 가능한 내용</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-slate-600">
            <li>계산 결과가 실제 급여명세서와 다르게 보이는 경우</li>
            <li>요율·법령·출처의 수정이 필요한 경우</li>
            <li>새 계산기 또는 사용성 개선 제안</li>
            <li>개인정보 관련 문의와 삭제 요청</li>
          </ul>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-500">운영자 {OPERATOR_NAME}</p>
          <a href={`mailto:${OPERATOR_EMAIL}`} className="mt-1 inline-block text-base font-bold text-brand-700 hover:underline">
            {OPERATOR_EMAIL}
          </a>
          <p className="mt-2 text-xs text-slate-500">
            버튼을 누르면 사용 중인 이메일 앱이 열립니다. 사이트에는 별도의 문의 입력폼이 없습니다.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-bold text-slate-800">빠른 확인을 위한 작성 방법</h2>
          <p>
            계산기 이름, 입력한 값, 기대한 결과와 실제 결과를 함께 알려주시면 확인이
            빨라집니다. 주민등록번호, 계좌번호, 급여명세서 원본 등 불필요한 개인정보는
            보내지 마세요.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-bold text-slate-800">답변 안내</h2>
          <p>
            문의 내용을 확인한 뒤 가능한 범위에서 회신합니다. 이 서비스는 자동 계산 결과를
            제공하므로 개인별 세무·노무 판단이나 법률 상담을 대신하지 않습니다.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-sm">
        <Link href="/" className="text-brand-600 hover:underline">홈으로</Link>
        <Link href="/about" className="text-brand-600 hover:underline">서비스 소개</Link>
        <Link href="/privacy" className="text-brand-600 hover:underline">개인정보처리방침</Link>
      </div>
    </main>
  )
}
