import { calculateSalary, formatKRW } from "@/lib/salary";

export default function Page({ params }: { params: { amount: string } }) {
    const amount = params.amount;

    const annual = Number(amount) * 10000;

    if (!amount || isNaN(annual)) {
        return <div>잘못된 접근입니다.</div>;
    }

    const result = calculateSalary({
        annualSalary: annual,
        nonTaxable: 0,
        dependents: 1,
    });

    return (
        <main className="max-w-3xl mx-auto p-8">
            <h1 className="text-2xl font-bold mb-4">
                연봉 {amount}만원 실수령액
            </h1>

            <div className="bg-gray-100 p-6 rounded-xl mb-6">
                <p>월 실수령액: {formatKRW(result.monthlyNet)}</p>
                <p>연 실수령액: {formatKRW(result.annualNet)}</p>
            </div>

            <p className="text-gray-700">
                연봉 {amount}만원 기준 실수령액은 4대보험과 소득세를 제외한 금액입니다.
            </p>
        </main>
    );
}

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