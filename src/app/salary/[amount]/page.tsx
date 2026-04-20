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

            <div className="bg-gray-100 p-6 rounded-xl mb-6">
                <p>월 실수령액: {formatKRW(result.monthlyNet)}</p>
                <p>연 실수령액: {formatKRW(result.annualNet)}</p>
            </div>

            {/* 🔥 연봉 리스트 네비게이션 */}
            <div className="mt-10 border-t pt-6">
                <h2 className="text-lg font-bold mb-3">다른 연봉 보기</h2>

                <ul className="grid grid-cols-2 gap-2 text-blue-600">
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

            {/* 🔁 돌아가기 */}
            <div className="mt-6">
                <a href="/" className="text-blue-600">
                    ← 연봉 계산기로 돌아가기
                </a>
            </div>
        </div>
    );
}