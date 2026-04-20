import { calculateSalary, formatKRW } from "@/lib/salary";

interface PageProps {
    params: {
        amount: string;
    };
}

export default function SalaryDetailPage({ params }: PageProps) {
    const annual = Number(params.amount) * 10000;

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

            <section className="text-gray-700 leading-relaxed">
                <p>
                    연봉 {params.amount}만원 기준 실수령액은 세금과 4대보험을 제외한 금액으로 계산됩니다.
                </p>
            </section>
        </div>
    );
}

// ✅ 정적 페이지 생성
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