import { calculateSalary, formatKRW } from "@/lib/salary";

export default function SalaryDetailPage({
                                             params,
                                         }: {
    params: { amount: string };
}) {
    const amount = parseInt(params.amount, 10);

    // 🚨 잘못된 접근 방어
    if (isNaN(amount)) {
        return <div className="p-10">잘못된 접근입니다.</div>;
    }

    const annual = amount * 10000;

    const result = calculateSalary({
        annualSalary: annual,
        nonTaxable: 0,
        dependents: 1,
    });

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">
                연봉 {amount}만원 실수령액
            </h1>

            <div className="bg-gray-100 p-6 rounded-xl mb-6">
                <p>월 실수령액: {formatKRW(result.monthlyNet)}</p>
                <p>연 실수령액: {formatKRW(result.annualNet)}</p>
            </div>

            <section className="text-gray-700 leading-relaxed">
                <p>
                    연봉 {amount}만원 기준 실수령액은 세금과 4대보험을 제외한 금액입니다.
                </p>
            </section>

            <div className="mt-6">
                <a href="/salary-calculator" className="text-blue-600">
                    ← 계산기로 돌아가기
                </a>
            </div>
        </div>
    );
}