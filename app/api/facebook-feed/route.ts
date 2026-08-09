import { NextResponse } from 'next/server'
import { PRODUCTS } from '@/lib/products'

// Meta (Facebook/Instagram) Commerce Manager Produkt-Feed.
// Wird von Meta periodisch abgerufen (als "Geplanter Feed" im Commerce Manager
// hinterlegen: https://shop.pan21.com/api/facebook-feed).
//
// Spezifikation: https://www.facebook.com/business/help/120325381656392
// Nur Produkte mit echtem Festpreis UND eigenem Checkout (kein externalUrl,
// kein reines Anfrage-Produkt) werden aufgenommen — Meta verlangt einen festen
// Preis pro Angebot, und der Link muss zur tatsächlichen Kaufseite führen.

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const eligible = PRODUCTS.filter(
    (p) => p.price !== null && !p.externalUrl && !p.inquiry
  )

  const items = eligible
    .map((p) => {
      const link = `https://shop.pan21.com/produkt/${p.slug}`
      const imageLink = `https://shop.pan21.com${p.heroImage || p.image}`
      const priceStr = `${p.price!.toFixed(2)} EUR`

      return `  <item>
    <g:id>${escapeXml(p.sku)}</g:id>
    <g:title>${escapeXml(p.name)}</g:title>
    <g:description>${escapeXml(p.shortDesc)}</g:description>
    <g:link>${link}</g:link>
    <g:image_link>${imageLink}</g:image_link>
    <g:availability>in stock</g:availability>
    <g:condition>new</g:condition>
    <g:price>${priceStr}</g:price>
    <g:brand>PAN21</g:brand>
    <g:google_product_category>Business &amp; Industrial &gt; Business Services</g:google_product_category>
    <g:product_type>${escapeXml(p.category)}</g:product_type>
  </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>PAN21 Shop — Produktkatalog</title>
  <link>https://shop.pan21.com</link>
  <description>PAN21 Firmengründung &amp; Business-Services Produktkatalog für Meta Commerce Manager</description>
${items}
</channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400',
    },
  })
}
