import type { Metadata } from 'next'
import { LegalShell, ImprintDe } from '@/components/LegalPage'

export const metadata: Metadata = {
  title: { absolute: 'Impressum | PAN21 Shop' },
  description: 'Impressum von shop.pan21.com – Anbieter: PAN21.com International LLC.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://shop.pan21.com/impressum',
    languages: { de: 'https://shop.pan21.com/impressum', en: 'https://shop.pan21.com/en/legal-notice' },
  },
}

export default function Page() {
  return (
    <LegalShell lang="de" kind="imprint">
      <ImprintDe />
    </LegalShell>
  )
}
