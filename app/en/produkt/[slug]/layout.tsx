import type { Metadata } from 'next'
import { PRODUCTS_EN } from '@/lib/products.en'

// Metadata-only segment layout: page.tsx is a client component and cannot
// export metadata. Gives every product page a self-referencing canonical
// instead of inheriting the shop homepage canonical from the parent layout.
const base = 'https://shop.pan21.com'

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const product = PRODUCTS_EN.find(p => p.slug === params.slug)
  if (!product) return {}
  const de = `${base}/produkt/${product.slug}`
  const en = `${base}/en/produkt/${product.slug}`
  return {
    title: { absolute: `${product.name} | PAN21 Shop` },
    description: product.shortDesc,
    openGraph: { url: en, title: product.name, description: product.shortDesc },
    alternates: {
      canonical: en,
      languages: { de, en, 'x-default': de },
    },
  }
}

export default function ProduktLayout({ children }: { children: React.ReactNode }) {
  return children
}
