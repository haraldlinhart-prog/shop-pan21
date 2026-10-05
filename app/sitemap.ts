import { MetadataRoute } from 'next'
import { PRODUCTS } from '@/lib/products'

// Dynamic sitemap (served at /sitemap.xml, already referenced from
// public/robots.txt). Lists both the German site and its English mirror
// under /en, with reciprocal hreflang alternates on every entry pair.
// Products with an externalUrl are left out: their canonical home is the
// other PAN21-network site they link to, not this internal detail page.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://shop.pan21.com'
  const indexable = PRODUCTS.filter(p => !p.externalUrl)

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      changeFrequency: 'weekly',
      priority: 1,
      alternates: { languages: { de: `${base}/`, en: `${base}/en` } },
    },
    {
      url: `${base}/en`,
      changeFrequency: 'weekly',
      priority: 1,
      alternates: { languages: { de: `${base}/`, en: `${base}/en` } },
    },
  ]

  for (const p of indexable) {
    entries.push({
      url: `${base}/produkt/${p.slug}`,
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: {
        languages: {
          de: `${base}/produkt/${p.slug}`,
          en: `${base}/en/produkt/${p.slug}`,
        },
      },
    })
    entries.push({
      url: `${base}/en/produkt/${p.slug}`,
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: {
        languages: {
          de: `${base}/produkt/${p.slug}`,
          en: `${base}/en/produkt/${p.slug}`,
        },
      },
    })
  }

  // Rechtsseiten (DE + EN)
  const legalPairs: [string, string][] = [
    ['/impressum', '/en/legal-notice'],
    ['/datenschutz', '/en/privacy'],
  ]
  for (const [dePath, enPath] of legalPairs) {
    for (const path of [dePath, enPath]) {
      entries.push({
        url: `${base}${path}`,
        changeFrequency: 'yearly',
        priority: 0.2,
        alternates: { languages: { de: `${base}${dePath}`, en: `${base}${enPath}` } },
      })
    }
  }

  return entries
}
