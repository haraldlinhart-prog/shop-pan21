import type { Metadata } from 'next'
import { LegalShell, ImprintEn } from '@/components/LegalPage'

export const metadata: Metadata = {
  title: { absolute: 'Legal notice | PAN21 Shop' },
  description: 'Legal notice of shop.pan21.com – provider: PAN21.com International LLC.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://shop.pan21.com/en/legal-notice',
    languages: { de: 'https://shop.pan21.com/impressum', en: 'https://shop.pan21.com/en/legal-notice' },
  },
}

export default function Page() {
  return (
    <LegalShell lang="en" kind="imprint">
      <ImprintEn />
    </LegalShell>
  )
}
