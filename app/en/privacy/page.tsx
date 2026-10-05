import type { Metadata } from 'next'
import { LegalShell, PrivacyEn } from '@/components/LegalPage'

export const metadata: Metadata = {
  title: { absolute: 'Privacy policy | PAN21 Shop' },
  description: 'Privacy policy of shop.pan21.com.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://shop.pan21.com/en/privacy',
    languages: { de: 'https://shop.pan21.com/datenschutz', en: 'https://shop.pan21.com/en/privacy' },
  },
}

export default function Page() {
  return (
    <LegalShell lang="en" kind="privacy">
      <PrivacyEn />
    </LegalShell>
  )
}
