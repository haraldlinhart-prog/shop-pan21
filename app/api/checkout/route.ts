import { NextRequest, NextResponse } from 'next/server'
import { PRODUCTS } from '@/lib/products'

export async function POST(req: NextRequest) {
  try {
    const { slug, email, affiliate_ref } = await req.json()
    if (!slug || !email) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const product = PRODUCTS.find(p => p.slug === slug)
    if (!product || !product.price) return NextResponse.json({ error: 'Product not found' }, { status: 400 })

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) return NextResponse.json({ error: 'Payment not configured' }, { status: 500 })

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.pan21.com'

    const params = new URLSearchParams({
      'payment_method_types[]': 'card',
      'line_items[0][price_data][currency]': 'eur',
      'line_items[0][price_data][unit_amount]': String(Math.round(product.price * 100)),
      'line_items[0][price_data][product_data][name]': product.name,
      'line_items[0][price_data][product_data][description]': product.shortDesc,
      'line_items[0][price_data][product_data][images][0]': product.image.startsWith('http') ? product.image : `${siteUrl}${product.image}`,
      'line_items[0][quantity]': '1',
      'mode': 'payment',
      'customer_email': email,
      'success_url': `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&product=${encodeURIComponent(product.name)}`,
      'cancel_url': `${siteUrl}/produkt/${slug}`,
      'metadata[product_slug]': slug,
      'metadata[product_name]': product.name,
      'metadata[customer_email]': email,
      'metadata[sku]': product.sku,
      'metadata[affiliate_ref]': affiliate_ref || '',
    })

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    })

    const session = await res.json()
    if (!res.ok) return NextResponse.json({ error: session.error?.message || 'Stripe error' }, { status: 500 })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
