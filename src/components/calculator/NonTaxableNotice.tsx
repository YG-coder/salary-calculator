import type { NonTaxableValidation } from '@/lib/nonTaxableInput'

export default function NonTaxableNotice({ validation }: { validation: NonTaxableValidation }) {
  return (
    <div id="non-taxable-feedback" aria-live="polite">
      {validation.error && <p className="hint text-red-600" role="alert">{validation.error}</p>}
      {validation.warning && <p className="hint text-amber-700">{validation.warning}</p>}
    </div>
  )
}
