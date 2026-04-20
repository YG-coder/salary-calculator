export const dynamic = "force-dynamic";

import { calculateSalary, formatKRW } from "@/lib/salary";

export default async function SalaryDetailPage({
                                                   params,
                                               }: {
    params: Promise<{ amount: string }>;
}) {
    const { amount } = await params;
    const parsed = parseInt(amount, 10);

    if (isNaN(parsed)) {
        return <div className="p-10">잘못된 접근입니다.</div>;
    }

    const annual = parsed * 10000;

    const result = calculateSalary({
        annualSalary: annual,
        nonTaxable: 0,
        dependents: 1,
    });

    return (
        <div className="max-w-2xl mx-auto p-6">

            <h1 className="text-2xl font-bold mb-4">
                연봉 {parsed}만원 실수령액
            </h1>

            {/* 결과 */}
            <div className="bg-gray-100 p-6 rounded-xl mb-6">
                <p>월 실수령액: {formatKRW(result.monthlyNet)}</p>
                <p>연 실수령액: {formatKRW(result.annualNet)}</p>
            </div>

            {/* 🔥 SEO 핵심 텍스트 */}
            <section className="text-gray-700 leading-relaxed space-y-3">
                <p>
                    연봉 {parsed}만원 기준 실수령액은 국민연금, 건강보험, 고용보험 및
                    소득세를 제외한 금액입니다.
                </p>

                <p>
                    실제 수령액은 개인의 비과세 항목, 부양가족 수에 따라 달라질 수 있으며,
                    본 계산기는 일반적인 기준을 기반으로 산출됩니다.
                </p>

                <p>
                    정확한 세금 계산을 위해서는 최신 세법 기준과 개인 상황을 반영해야 합니다.
                </p>
            </section>

            {/* 🔥 내부 링크 (SEO 핵심) */}
            <div className="mt-6">
                <h2 className="font-semibold mb-2">다른 연봉 확인</h2>
                <ul className="text-blue-600 space-y-1">
                    <li><a href="/salary/3000">연봉 3000</a></li>
                    <li><a href="/salary/5000">연봉 5000</a></li>
                    <li><a href="/salary/10000">연봉 1억</a></li>
                </ul>
            </div>

            {/* 🔥 CTA */}
            <div className="mt-6">
                <a href="/salary-calculator" className="text-blue-600">
                    ← 연봉 계산기 다시 하기
                </a>
            </div>

        </div>
    );
}