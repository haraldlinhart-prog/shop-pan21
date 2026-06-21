import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://shop.pan21.com'),
  title: {
    default: 'PAN21 Shop — Firmengründung & Gesellschaftsverwaltung International',
    template: '%s | PAN21 Shop',
  },
  description:
    'Internationale Firmengründungen: Deutsche GmbH, UG, UK Limited, US LLC, Hong Kong Limited, Irische Limited, Neuseeländische Limited, Nevis LLC sowie Nominee- und Treuhandstrukturen. PAN21 Corporate Services — seriös, dokumentiert, compliance-orientiert.',
  keywords: [
    'Firmengründung', 'GmbH gründen', 'UG gründen', 'UK Limited gründen', 'US LLC gründen',
    'Hong Kong Limited', 'Irische Limited', 'Neuseeländische Limited', 'Nevis LLC',
    'internationale Firmengründung', 'Gesellschaft gründen', 'Kapitalgesellschaft gründen',
    'Offshore Gesellschaft', 'Asset Protection', 'Holding gründen', 'Nominee Shareholder',
    'Treuhandverwaltung', 'Gesellschaftsverwaltung', 'PAN21', 'EUROPAN',
    'company formation', 'incorporate', 'Limited Company', 'LLC formation',
    'GmbH formation', 'company registration', 'offshore company', 'holding structure',
    'Firmengründung international', 'Gesellschaft im Ausland gründen',
  ],
  openGraph: {
    type: 'website',
    url: 'https://shop.pan21.com',
    siteName: 'PAN21 Shop',
    title: 'PAN21 Shop — Internationale Firmengründung & Gesellschaftsverwaltung',
    description: 'Deutsche GmbH, UK Limited, US LLC, Hong Kong Limited und mehr — seriös, dokumentiert, compliance-orientiert.',
    locale: 'de_DE',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://shop.pan21.com' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Jost:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* Matomo 93 */}
        <script dangerouslySetInnerHTML={{ __html: `var _paq=window._paq=window._paq||[];_paq.push(['requireConsent']);_paq.push(['trackPageView']);_paq.push(['enableLinkTracking']);(function(){var u="//counter.ixan.org/";_paq.push(['setTrackerUrl',u+'matomo.php']);_paq.push(['setSiteId','93']);var d=document,g=d.createElement('script'),s=d.getElementsByTagName('script')[0];g.async=true;g.src=u+'matomo.js';s.parentNode.insertBefore(g,s);})();` }} />
        {/* Schema.org */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Store",
          "name": "PAN21 Shop",
          "url": "https://shop.pan21.com",
          "description": "Internationale Firmengründungen und Gesellschaftsverwaltung — Deutsche GmbH, UK Limited, US LLC, Hong Kong Limited und mehr.",
          "currenciesAccepted": "EUR",
          "paymentAccepted": "Credit Card, Bank Transfer",
          "areaServed": "Worldwide",
          "hasMap": "https://pan21.com",
        })}} />
        <meta name="ai-crawlers" content="allowed" />
      </head>
      <body>{children}</body>
    </html>
  )
}
