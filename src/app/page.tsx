/**
 * src/app/page.tsx
 * 메인 페이지 (애드센스 승인 + SEO 최적화 최종 버전)
 */

import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";

import AdSlot from "@/components/ui/AdSlot";
import CalculatorForm from "@/components/calculator/CalculatorForm";
import ContentSection from "@/components/calculator/ContentSection";
import FaqSection from "@/components/calculator/FaqSection";

import { SITE_NAME, TAX_YEAR } from "@/lib/constants";
import { buildWebAppJsonLd, buildFaqJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: `연봉 실수령액 계산기 ${TAX_YEAR} | ${SITE_NAME}`,
  description: `${TAX_YEAR}년 기준 연봉 실수령액을 빠르게 계산하세요. 4대보험 및 소득세 자동 반영.`,
};

export default function Home() {
  const webAppJsonLd = buildWebAppJsonLd();
  const faqJsonLd = buildFaqJsonLd();

  return (
      <>
        {/* 🔥 구조화 데이터 (SEO 핵심) */}
        <Script
            id="webapp-jsonld"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
        />
        <Script
            id="faq-jsonld"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />

        <main className="flex-1 max-w-3xl mx-auto px-4 py-10">

          {/* 타이틀 */}
          <h1 className="text-3xl font-bold mb-4">
            연봉 실수령액 계산기
          </h1>

          <p className="text-gray-500 mb-6">
            {TAX_YEAR}년 기준 · 4대보험 + 소득세 자동 계산
          </p>

          {/* 광고 영역 */}
          <AdSlot slotId="TOP_HORIZONTAL" format="horizontal" />

          {/* 계산기 */}
          <div className="mt-6">
            <CalculatorForm />
          </div>

          {/* 광고 */}
          <div className="mt-10">
            <AdSlot slotId="MID_RECTANGLE" format="rectangle" />
          </div>

          {/* 설명 콘텐츠 */}
          <div className="mt-10">
            <ContentSection />
          </div>

          {/* FAQ */}
          <div className="mt-10">
            <FaqSection />
          </div>

          {/* 🔥 애드센스 승인용 텍스트 (중요) */}
          <section className="mt-10 text-gray-700 leading-relaxed space-y-3">
            <h2 className="text-lg font-bold">연봉 실수령액이란?</h2>

            <p>
              연봉 실수령액은 세전 연봉에서 국민연금, 건강보험,
              고용보험 및 소득세를 제외한 실제 수령 금액을 의미합니다.
            </p>

            <p>
              동일한 연봉이라도 개인의 부양가족 수, 비과세 항목 등에 따라
              실제 수령액은 달라질 수 있습니다.
            </p>

            <p>
              본 계산기는 {TAX_YEAR}년 기준 세율을 반영하여
              대략적인 실수령액을 빠르게 확인할 수 있도록 설계되었습니다.
            </p>

            <p>
              본 서비스는 로그인 없이 무료로 이용 가능하며,
              입력된 데이터는 서버에 저장되지 않습니다.
            </p>

            <p>
              계산 결과는 참고용이며 실제 급여 명세와 차이가 있을 수 있습니다.
            </p>
          </section>

          {/* 광고 */}
          <div className="mt-10">
            <AdSlot slotId="BOTTOM_HORIZONTAL" format="horizontal" />
          </div>

          {/* 🔥 내부 링크 (SEO 핵심) */}
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-3">
              연봉별 실수령액
            </h2>

            <ul className="grid grid-cols-2 gap-2 text-blue-600">
              {Array.from({ length: 20 }, (_, i) => {
                const val = 2000 + i * 500;
                return (
                    <li key={val}>
                      <Link href={`/salary/${val}`}>
                        연봉 {val}만원
                      </Link>
                    </li>
                );
              })}
            </ul>
          </div>

        </main>
      </>
  );
}