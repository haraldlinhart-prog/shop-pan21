import { NextResponse } from 'next/server'
import { PRODUCTS } from '@/lib/products'

export async function GET() {
  return NextResponse.json(
    PRODUCTS.map(p => ({
      slug:       p.slug,
      name:       p.name,
      shortDesc:  p.shortDesc,
      price:      p.price,
      priceLabel: p.priceLabel,
      category:   p.category,
      flag:       p.flag,
      image:      p.image,
      inquiry:    p.inquiry || false,
      tags:       p.tags,
      url:        `https://shop.pan21.com/produkt/${p.slug}`,
    })),
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=3600',
      }
    }
  )
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    }
  })
}
