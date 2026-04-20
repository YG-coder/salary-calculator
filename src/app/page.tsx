/**
 * src/app/page.tsx
 * 역할: 메인 페이지 (계산기 직접 노출)
 */

import type { Metadata } from "next";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import AdSlot from "@/components/ui/AdSlot";
import CalculatorForm from "@/components/calculator/CalculatorForm";
import ContentSection from "@/components/calculator/ContentSection";
import FaqSection from "@/components/calculator/FaqSection";
import { SITE_NAME, TAX_YEAR } from "@/lib/constants";
import { buildWebAppJsonLd, buildFaqJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: `연봉 실수령액 계산기 ${TAX_YEAR} | ${SITE_NAME}`,
  description: `${TAX_YEAR}년 기준 연봉 실수령액을 바로 계산하세요.`,
};

export default function Home() {
  const webAppJsonLd = buildWebAppJsonLd();
  const faqJsonLd = buildFaqJsonLd();

  return (
      <>
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
        />
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />

        <div className="min-h-screen flex flex-col">
          <Header />

          <main className="flex-1 max-w-3xl mx-auto px-4 py-10">
            <h1 className="text-3xl font-bold mb-4">
              연봉 실수령액 계산기
            </h1>

            <p className="text-gray-500 mb-6">
              {TAX_YEAR}년 기준 · 4대보험 + 소득세 자동 계산
            </p>

            <AdSlot slotId="TOP_HORIZONTAL" format="horizontal" />

            <div className="mt-6">
              <CalculatorForm />
            </div>

            <div className="mt-10">
              <AdSlot slotId="MID_RECTANGLE" format="rectangle" />
            </div>

            <div className="mt-10">
              <ContentSection />
            </div>

            <div className="mt-10">
              <FaqSection />
            </div>

            <div className="mt-10">
              <AdSlot slotId="BOTTOM_HORIZONTAL" format="horizontal" />
            </div>

            {/* SEO 내부 링크 */}
            <div className="mt-12">
              <h2 className="text-xl font-bold mb-3">
                연봉별 실수령액
              </h2>

              <ul className="space-y-2 text-blue-600">
                <li><a href="/salary/3000">연봉 3000만원</a></li>
                <li><a href="/salary/4000">연봉 4000만원</a></li>
                <li><a href="/salary/5000">연봉 5000만원</a></li>
                <li><a href="/salary/6000">연봉 6000만원</a></li>
                <li><a href="/salary/7000">연봉 7000만원</a></li>
                <li><a href="/salary/8000">연봉 8000만원</a></li>
                <li><a href="/salary/9000">연봉 9000만원</a></li>
                <li><a href="/salary/10000">연봉 1억</a></li>
              </ul>
            </div>
          </main>

          <Footer />
        </div>
      </>
  );
}