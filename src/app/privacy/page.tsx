/**
 * src/app/privacy/page.tsx
 * 개인정보처리방침 (애드센스 승인용 최적화)
 */

import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, SITE_NAME, OPERATOR_EMAIL, OPERATOR_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: `${SITE_NAME} 개인정보처리방침 안내`,
  alternates: { canonical: `${SITE_URL}/privacy` },
  robots: { index: true, follow: true },
};

const EFFECTIVE_DATE = "2026년 01월 01일";

export default function PrivacyPage() {
  return (
      <main className="max-w-3xl mx-auto px-4 py-10 text-sm text-gray-700 leading-relaxed">

        <h1 className="text-2xl font-bold mb-4">개인정보처리방침</h1>
        <p className="text-gray-400 mb-6">시행일: {EFFECTIVE_DATE}</p>

        {/* 🔥 도입부 (애드센스 중요) */}
        <p className="mb-6">
          본 개인정보처리방침은 {SITE_NAME}에서 제공하는 서비스 이용과 관련하여
          이용자의 개인정보 보호를 위해 어떤 정보를 수집하고 어떻게 사용되는지
          안내하기 위한 것입니다.
        </p>

        <section className="mb-6">
          <h2 className="font-bold mb-2">1. 수집하는 개인정보 항목</h2>
          <p>
            본 사이트는 회원가입 없이 이용 가능하며, 입력된 연봉 및 계산 정보는
            서버에 저장되지 않고 브라우저에서만 처리됩니다.
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>접속 IP 주소</li>
            <li>브라우저 정보</li>
            <li>방문 페이지 기록</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="font-bold mb-2">2. 개인정보 이용 목적</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>서비스 제공 및 기능 개선</li>
            <li>이용 통계 분석</li>
            <li>부정 이용 방지</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="font-bold mb-2">3. 개인정보 보유 기간</h2>
          <p>
            수집된 정보는 일정 기간 보관 후 자동 삭제되며, 법령에 따른 경우에만
            일정 기간 보존됩니다.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="font-bold mb-2">4. 쿠키 및 광고</h2>
          <p>
            본 사이트는 Google AdSense를 사용할 수 있으며, 광고 제공을 위해 쿠키가
            사용될 수 있습니다.
          </p>
          <p className="mt-2">
            쿠키 설정은 브라우저 또는{" "}
            <a
                href="https://adssettings.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
            >
              Google 광고 설정
            </a>
            에서 관리할 수 있습니다.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="font-bold mb-2">5. 개인정보 제3자 제공</h2>
          <p>
            원칙적으로 개인정보를 외부에 제공하지 않으며, 법적 요구가 있는 경우에만
            예외적으로 제공됩니다.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="font-bold mb-2">6. 이용자의 권리</h2>
          <p>
            이용자는 언제든지 개인정보 관련 문의를 할 수 있습니다.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="font-bold mb-2">7. 개인정보 보호 책임자</h2>
          <p>운영자: {OPERATOR_NAME}</p>
          <p>이메일: {OPERATOR_EMAIL}</p>
        </section>

        <section className="mb-6">
          <h2 className="font-bold mb-2">8. 정책 변경</h2>
          <p>
            본 방침은 시행일부터 적용되며, 변경 시 공지사항을 통해 안내합니다.
          </p>
        </section>

        {/* 🔥 내부 링크 (신뢰도 + SEO) */}
        <div className="mt-8 flex gap-4">
          <Link href="/" className="text-blue-600">
            연봉 계산기
          </Link>
          <Link href="/about" className="text-blue-600">
            서비스 소개
          </Link>
        </div>

      </main>
  );
}