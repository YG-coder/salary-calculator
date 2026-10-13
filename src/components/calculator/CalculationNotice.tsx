export default function CalculationNotice({ isStale }: { isStale: boolean }) {
  return isStale ? (
    <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      입력 조건이 변경되었습니다. 다시 계산해 주세요.
    </p>
  ) : null
}
