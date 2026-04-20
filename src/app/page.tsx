// src/app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
      <main className="max-w-3xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">
          연봉 계산기
        </h1>

        <p className="text-gray-600 mb-8">
          연봉 실수령액 계산기를 이용해 세후 금액을 확인하세요.
        </p>

        <Link
            href="/salary-calculator"
            className="block p-4 border rounded-lg hover:bg-gray-50"
        >
          👉 연봉 계산기 바로가기
        </Link>
      </main>
  );
}