import { calculateSalary, formatKRW } from "@/lib/salary";

export default function Page({ params }: { params: { amount: string } }) {
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
        </div>
    );
}

// SEO용
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