import { calculateSalary, formatKRW } from "@/lib/salary";

export async function generateStaticParams() {
    const list = [];
    for (let i = 2000; i <= 15000; i += 500) {
        list.push({ amount: String(i) });
    }
    return list;
}

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

            <section className="text-gray-700 leading-relaxed space-y-3">
                <p>
                    연봉 {parsed}만원 기준 실수령액은 국민연금, 건강보험,
                    고용보험 및 소득세를 제외한 금액입니다.
                </p>
                <p>
                    실제 수령액은 비과세 항목, 부양가족 수,
                    개인 세율에 따라 달라질 수 있습니다.
                </p>
                <p>
                    특히 연봉 구간에 따라 세율이 달라지므로 동일한 상승폭이라도
                    실수령액 증가폭은 다르게 나타날 수 있습니다.
                </p>
                <p>
                    본 계산기는 참고용이며 정확한 세금은 개인 상황에 따라 달라질 수 있습니다.
                </p>
            </section>

            <div className="mt-10 rounded-2xl border bg-blue-50 p-6">
                <h2 className="text-xl font-bold mb-2">
                    세금 상세 계산이 필요하신가요?
                </h2>

                <p className="text-slate-600 mb-4">
                    4대보험, 근로소득세, 원천징수 등 상세 세금을 따로 계산할 수 있습니다.
                </p>

                <Link
                    href="https://taxsim.kr"
                    className="inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                >
                    세금 계산기 바로가기 →
                </Link>
            </div>

            <div className="mt-10 border-t pt-6">
                <h2 className="text-lg font-bold mb-3">다른 연봉 보기</h2>

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

            <div className="mt-6">
                <a href="/" className="text-blue-600">
                    ← 연봉 계산기로 돌아가기
                </a>
            </div>
        </div>
    );
}