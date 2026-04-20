import { calculateSalary, formatKRW } from "@/lib/salary";

export default function SalaryDetailPage({ params }: { params: { amount: string } }) {
    const annual = Number(params.amount) * 10000; // 3000 → 3000만원

    const result = calculateSalary({
        annualSalary: annual,
        nonTaxable: 0,
        dependents: 1,
    });

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">
                연봉 {params.amount}만원 실수령액
            </h1>

            <div className="bg-gray-100 p-6 rounded-xl mb-6">
                <p>월 실수령액: {formatKRW(result.monthlyNet)}</p>
                <p>연 실수령액: {formatKRW(result.annualNet)}</p>
            </div>

            {/* SEO용 설명 */}
            <section className="text-gray-700 leading-relaxed">
                <p>
                    연봉 {params.amount}만원 기준 실수령액은 세금과 4대보험을 제외한 금액으로 계산됩니다.
                    국민연금, 건강보험, 고용보험 및 소득세가 공제됩니다.
                </p>
            </section>
        </div>
    );
}

// ✅ 1. 정적 페이지 생성 (SEO 핵심)
export async function generateStaticParams() {
    return [
        { amount: "3000" },
        { amount: "4000" },
        { amount: "5000" },
        { amount: "6000" },
        { amount: "7000" },
        { amount: "8000" },
        { amount: "9000" },
        { amount: "10000" },
    ];
}

// ✅ 2. SEO 메타
import type { Metadata } from "next";

export function generateMetadata({ params }: { params: { amount: string } }): Metadata {
    return {
        title: `연봉 ${params.amount}만원 실수령액 계산`,
        description: `연봉 ${params.amount}만원 기준 월급 실수령액과 세금을 확인하세요.`,
    };
}