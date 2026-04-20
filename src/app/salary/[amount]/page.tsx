import { calculateSalary, formatKRW } from "@/lib/salary";

export default async function SalaryDetailPage({
                                                   params,
                                               }: {
    params: Promise<{ amount: string }>;
}) {
    const { amount } = await params; // 🔥 이게 핵심

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

            <div className="bg-gray-100 p-6 rounded-xl mb-6">
                <p>월 실수령액: {formatKRW(result.monthlyNet)}</p>
                <p>연 실수령액: {formatKRW(result.annualNet)}</p>
            </div>
        </div>
    );
}