import type { ReactNode } from 'react'
import { buildMetadata, PAGE_META } from '@/lib/metadata'
export const metadata = buildMetadata(PAGE_META.payrollTaxCalculator)
export default function Layout({ children }: { children: ReactNode }) { return children }
