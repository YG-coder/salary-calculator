/**
 * src/app/not-found.tsx
 * 404 페이지
 * - layout.tsx에서 Header/Footer를 이미 렌더링하므로 여기서는 중복 렌더링하지 않음
 */

import Link from 'next/link'

export default function NotFound() {
    return (
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center">
            <div className="text-7xl font-black text-brand-100">404</div>

            <h1 className="mt-4 text-2xl font-black text-slate-900">
                페이지를 찾을 수 없어요
            </h1>

            <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">
                요청하신 페이지가 존재하지 않거나 이동되었습니다. 아래 링크를 이용해 주세요.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                    href="/salary-calculator"
                    className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700"
                >
                    연봉계산기 바로 가기
                </Link>

                <Link
                    href="/about"
                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                    서비스 소개
                </Link>

                <Link
                    href="/privacy"
                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                    개인정보처리방침
                </Link>
            </div>
        </main>
    )
}