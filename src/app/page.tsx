import type { Metadata } from "next";
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

          {/* 🔥 애드센스 승인용 콘텐츠 */}
          <section className="mt-10 text-gray-700 leading-relaxed space-y-3">
            <h2 className="text-lg font-bold">연봉 실수령액이란?</h2>

            <p>
              연봉 실수령액은 세전 연봉에서 국민연금, 건강보험, 고용보험 및 소득세를 제외한 실제 수령 금액을 의미합니다.
            </p>

            <p>
              동일한 연봉이라도 개인의 부양가족 수, 비과세 항목 등에 따라 실제 수령액은 달라질 수 있습니다.
            </p>

            <p>
              본 계산기는 {TAX_YEAR}년 기준 세율을 반영하여 대략적인 실수령액을 빠르게 확인할 수 있도록 설계되었습니다.
            </p>
          </section>

          <div className="mt-10">
            <AdSlot slotId="BOTTOM_HORIZONTAL" format="horizontal" />
          </div>

          {/* 🔥 SEO 내부 링크 (자동 생성) */}
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-3">
              연봉별 실수령액
            </h2>

            <ul className="grid grid-cols-2 gap-2 text-blue-600">
              {Array.from({ length: 20 }, (_, i) => {
                const val = 2000 + i * 500;
                return (
                    <li key={val}>
                      <a href={`/salary/${val}`}>연봉 {val}만원</a>
                    </li>
                );
              })}
            </ul>
          </div>
        </main>
      </>
  );
}