import type { Metadata } from 'next'
import { SetHtmlLang } from '@/components/SetHtmlLang'

// Nested layout for everything under /en/*. The root layout (app/layout.tsx)
// still owns the single <html>/<body> tag pair for the whole app — this
// layout only supplies English-language metadata defaults for this segment
// and corrects <html lang> client-side via SetHtmlLang (see that file for
// why root layout itself is left untouched).
export const metadata: Metadata = {
  title: { absolute: 'PAN21 Shop — International Company Formation & Corporate Administration' },
  description:
    'International company formation: German GmbH, UG, UK Limited, US LLC, Hong Kong Limited, Irish Limited, New Zealand Limited, Nevis LLC, plus nominee and trustee structures. PAN21 Corporate Services — reputable, documented, compliance-oriented.',
  openGraph: {
    type: 'website',
    url: 'https://shop.pan21.com/en',
    siteName: 'PAN21 Shop',
    title: 'PAN21 Shop — International Company Formation & Corporate Administration',
    description: 'German GmbH, UK Limited, US LLC, Hong Kong Limited and more — reputable, documented, compliance-oriented.',
    locale: 'en_US',
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://shop.pan21.com/en',
    languages: {
      de: 'https://shop.pan21.com',
      en: 'https://shop.pan21.com/en',
    },
  },
}

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SetHtmlLang lang="en" />
      {children}
    </>
  )
}
