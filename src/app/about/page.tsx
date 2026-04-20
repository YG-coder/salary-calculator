/**
 * src/app/about/page.tsx
 * 애드센스 승인 최적화 최종 버전
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import {
    SITE_URL, SITE_NAME, OPERATOR_NAME, OPERATOR_EMAIL, TAX_YEAR, RATES,
} from '@/lib/constants'

export const metadata: Metadata = {
    title: '서비스 소개',
    description:
        `${SITE_NAME}은 ${TAX_YEAR}년 기준 연봉 실수령액을 계산할 수 있는 무료 서비스입니다.`,
    alternates: { canonical: `${SITE_URL}/about` },
    robots: { index: true, follow: true },
}

const features = [
    `연봉 기반 실수령액 계산`,
    `국민연금(${(RATES.nationalPension * 100).toFixed(1)}%) 자동 계산`,
    `건강보험 및 고용보험 계산`,
    `소득세 및 지방세 자동 계산`,
    `모바일 최적화`,
]

export default function AboutPage() {
    return (
        <main className="max-w-3xl mx-auto px-4 py-10 text-sm text-gray-700 leading-relaxed">

            <h1 className="text-2xl font-bold mb-6">서비스 소개</h1>

            {/* 🔥 도입부 강화 */}
            <p className="mb-4">
                {SITE_NAME}은 누구나 쉽게 연봉 실수령액을 계산할 수 있도록 제공되는
                무료 온라인 계산기 서비스입니다.
            </p>

            <p className="mb-6">
                사용자는 별도의 회원가입 없이 연봉 정보를 입력하면 국민연금, 건강보험,
                고용보험 및 소득세를 반영한 실수령액을 즉시 확인할 수 있습니다.
            </p>

            {/* 기능 */}
            <section className="mb-6">
                <h2 className="font-bold mb-2">제공 기능</h2>
                <ul className="list-disc pl-5 space-y-1">
                    {features.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
            </section>

            {/* 운영자 */}
            <section className="mb-6">
                <h2 className="font-bold mb-2">운영자 정보</h2>
                <p>운영자: {OPERATOR_NAME}</p>
                <p>이메일: {OPERATOR_EMAIL}</p>
            </section>

            {/* 🔥 면책 강화 */}
            <section className="mb-6">
                <h2 className="font-bold mb-2">면책 안내</h2>
                <p>
                    본 서비스에서 제공되는 계산 결과는 참고용이며,
                    실제 급여 및 세금과 차이가 발생할 수 있습니다.
                </p>
                <p className="mt-2">
                    정확한 세무 처리는 국세청 또는 전문가 상담을 통해 확인하시기 바랍니다.
                </p>
            </section>

            {/* 🔥 내부 링크 강화 */}
            <div className="mt-8 flex gap-4">
                <Link href="/" className="text-blue-600">
                    연봉 계산기
                </Link>
                <Link href="/privacy" className="text-blue-600">
                    개인정보처리방침
                </Link>
                <Link href="/contact" className="text-blue-600">
                    문의하기
                </Link>
            </div>

        </main>
    )
}