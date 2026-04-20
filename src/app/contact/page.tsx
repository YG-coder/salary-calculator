/**
 * src/app/contact/page.tsx
 * 문의 페이지 (중복 제거 완료)
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
    SITE_NAME,
    SITE_URL,
    OPERATOR_EMAIL,
    OPERATOR_NAME,
} from "@/lib/constants";

export const metadata: Metadata = {
    title: "문의하기",
    description: `${SITE_NAME} 문의 페이지`,
    alternates: { canonical: `${SITE_URL}/contact` },
};

export default function ContactPage() {
    return (
        <main className="max-w-3xl mx-auto px-4 py-10 text-sm text-gray-700 leading-relaxed">

            <h1 className="text-2xl font-bold mb-4">문의하기</h1>

            <p className="mb-6">
                서비스 이용 중 문의사항이 있으시면 아래 이메일로 연락해 주세요.
            </p>

            <div className="bg-gray-100 p-4 rounded-lg mb-6">
                <p className="font-medium">운영자</p>
                <p>{OPERATOR_NAME}</p>

                <p className="font-medium mt-3">이메일</p>
                <a
                    href={`mailto:${OPERATOR_EMAIL}`}
                    className="text-blue-600 hover:underline"
                >
                    {OPERATOR_EMAIL}
                </a>
            </div>

            <section className="mb-6">
                <h2 className="font-bold mb-2">응답 안내</h2>
                <p>
                    문의 내용에 따라 답변까지 일정 시간이 소요될 수 있으며,
                    가능한 빠르게 답변드리겠습니다.
                </p>
            </section>

            <div className="mt-8 flex gap-4">
                <Link href="/" className="text-blue-600">
                    연봉 계산기
                </Link>
                <Link href="/about" className="text-blue-600">
                    서비스 소개
                </Link>
                <Link href="/privacy" className="text-blue-600">
                    개인정보처리방침
                </Link>
            </div>

        </main>
    );
}