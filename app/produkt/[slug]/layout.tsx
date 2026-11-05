import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PRODUCTS } from '@/lib/products'

// Metadata-only segment layout: page.tsx is a client component and cannot
// export metadata. Gives every product page a self-referencing canonical
// instead of inheriting the shop homepage canonical from the parent layout.
const base = 'https://shop.pan21.com'

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const product = PRODUCTS.find(p => p.slug === params.slug)
  if (!product) return {}
  const de = `${base}/produkt/${product.slug}`
  const en = `${base}/en/produkt/${product.slug}`
  return {
    title: product.card?.name ?? product.name,
    description: product.card?.lead ?? product.shortDesc,
    openGraph: { url: de, title: product.card?.name ?? product.name, description: product.shortDesc },
    alternates: {
      canonical: de,
      languages: { de, en, 'x-default': de },
    },
  }
}

export default function ProduktLayout({ children, params }: { children: React.ReactNode; params: { slug: string } }) {
  // These products have no checkout here (price null); the page would offer "Order — €undefined".
  const externalUrl = PRODUCTS.find(p => p.slug === params.slug)?.externalUrl
  if (externalUrl) redirect(externalUrl)
  return children
}
