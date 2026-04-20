/**
 * src/app/salary-calculator/page.tsx
 * 역할: SEO용 경로 → 홈으로 리다이렉트
 */

import { redirect } from "next/navigation";

export default function Page() {
  redirect("/");
}