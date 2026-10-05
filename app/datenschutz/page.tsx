import type { Metadata } from 'next'
import { LegalShell, PrivacyDe } from '@/components/LegalPage'

export const metadata: Metadata = {
  title: { absolute: 'Datenschutzerklärung | PAN21 Shop' },
  description: 'Datenschutzerklärung von shop.pan21.com.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://shop.pan21.com/datenschutz',
    languages: { de: 'https://shop.pan21.com/datenschutz', en: 'https://shop.pan21.com/en/privacy' },
  },
}

export default function Page() {
  return (
    <LegalShell lang="de" kind="privacy">
      <PrivacyDe />
    </LegalShell>
  )
}
