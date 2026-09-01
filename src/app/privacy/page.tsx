import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, SITE_NAME, OPERATOR_EMAIL } from '@/lib/constants'

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: `${SITE_NAME}의 계산 입력값, 접속 정보, 광고 쿠키 및 문의 정보 처리 방침입니다.`,
  alternates: { canonical: `${SITE_URL}/privacy` },
  robots: { index: true, follow: true },
}

const EFFECTIVE_DATE = '2026년 9월 1일'

export default function PrivacyPage() {
    return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-slate-700">
      <h1 className="mb-2 text-3xl font-bold text-slate-900">개인정보처리방침</h1>
      <p className="mb-8 text-sm text-slate-500">시행일: {EFFECTIVE_DATE}</p>

      <div className="card mb-6 space-y-8 p-6 text-sm leading-relaxed sm:p-8">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-800">먼저 알려드립니다</h2>
          <p>
            {SITE_NAME}은 회원가입을 받지 않으며 계산기에 입력한 연봉·월급·가족 수 등의
            값을 운영자 서버로 전송하거나 저장하지 않습니다. 계산은 사용자의 브라우저
            안에서 완료됩니다.
          </p>
          <p>
            다만 웹사이트 접속, Google 광고 표시, 이메일 문의 과정에서는 아래와 같은
            정보가 처리될 수 있어 그 범위와 목적을 투명하게 안내합니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-800">1. 처리되는 정보와 목적</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-3 py-2 font-semibold">구분</th>
                  <th className="px-3 py-2 font-semibold">정보</th>
                  <th className="px-3 py-2 font-semibold">목적</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-3 py-3 font-semibold text-slate-800">계산기 입력값</td>
                  <td className="px-3 py-3">연봉·월급·가족 수 등</td>
                  <td className="px-3 py-3">브라우저 안에서만 계산하며 서버에 저장하지 않음</td>
                </tr>
                <tr>
                  <td className="px-3 py-3 font-semibold text-slate-800">접속 정보</td>
                  <td className="px-3 py-3">IP 주소, 브라우저·기기 정보, 요청 시각과 페이지</td>
                  <td className="px-3 py-3">사이트 제공, 보안, 장애 대응</td>
                </tr>
                <tr>
                  <td className="px-3 py-3 font-semibold text-slate-800">이메일 문의</td>
                  <td className="px-3 py-3">보낸 사람의 이메일 주소와 문의 내용</td>
                  <td className="px-3 py-3">문의 확인과 회신</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-800">2. 보유 및 파기</h2>
          <p>
            계산기 입력값은 운영자가 보유하지 않습니다. 접속 정보는 호스팅·보안 서비스의
            운영 정책에 따라 필요한 기간 동안 처리될 수 있습니다. 이메일 문의 정보는
            답변과 후속 확인이 끝나면 지체 없이 삭제하며, 관계 법령에 따라 보존 의무가
            있는 경우에는 해당 기간만 보관합니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-800">3. Google 광고와 쿠키</h2>
          <p>
            본 사이트는 Google AdSense를 사용합니다. Google과 광고 파트너는 광고 제공,
            빈도 제한, 광고 성과 측정과 부정 이용 방지를 위해 쿠키를 저장하거나 읽고,
            웹 비콘·IP 주소·기타 식별자를 처리할 수 있습니다. 이 정보의 처리 주체와 보유
            기간은 각 제공자의 정책을 따릅니다.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-600 hover:underline">
              Google의 파트너 사이트 데이터 사용 안내 ↗
            </a>
            <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-600 hover:underline">
              Google 광고 설정 ↗
            </a>
          </div>
          <p>
            사용자는 브라우저 설정에서 쿠키를 차단하거나 삭제할 수 있습니다. 일부 지역에서는
            관련 법령과 Google 정책에 따라 별도의 동의 메시지가 표시될 수 있습니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-800">4. 외부 제공 및 처리</h2>
          <p>
            운영자는 이용자 정보를 판매하지 않습니다. 다만 사이트 제공에 필요한 호스팅·보안
            서비스와 Google 광고 서비스가 각자의 정책에 따라 접속 정보 또는 광고 관련
            식별자를 처리할 수 있으며, 법령에 따른 적법한 요청이 있는 경우 정보가 제공될 수
            있습니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-800">5. 이용자의 권리</h2>
          <p>
            이용자는 운영자가 보유한 본인의 문의 정보에 대해 열람·정정·삭제를 요청할 수
            있습니다. 광고 쿠키는 브라우저 또는 Google 광고 설정에서 직접 관리할 수 있습니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-800">6. 개인정보 문의처</h2>
          <p>개인정보 관련 문의와 열람·정정·삭제 요청은 아래 이메일로 보내주세요.</p>
          <div className="rounded-xl bg-slate-50 p-4">
            <a href={`mailto:${OPERATOR_EMAIL}`} className="font-semibold text-brand-600 hover:underline">{OPERATOR_EMAIL}</a>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-800">7. 방침 변경</h2>
          <p>내용이 변경되면 이 페이지에 변경 사항과 새 시행일을 표시합니다.</p>
        </section>
      </div>

      <div className="flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-sm">
        <Link href="/" className="text-brand-600 hover:underline">홈으로</Link>
        <Link href="/about" className="text-brand-600 hover:underline">서비스 소개</Link>
        <Link href="/contact" className="text-brand-600 hover:underline">문의하기</Link>
      </div>
    </main>
  )
}
