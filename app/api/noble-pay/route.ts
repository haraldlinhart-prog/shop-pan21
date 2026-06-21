import { NextRequest, NextResponse } from 'next/server'
import { PRODUCTS } from '@/lib/products'

const NOBLE_API_URL = process.env.NOBLE_API_URL || 'https://noble-limited.com'
const NOBLE_API_KEY = process.env.NOBLE_API_KEY || ''

const COIN_LABELS: Record<string, string> = {
  europan:    'EUROPAN',
  n_coin:     'N-Coin',
  swissycash: 'SwissyCash',
  cryptocoin: 'CryptoCoin',
}

// GET /api/noble-pay?email=...&slug=...&coin_id=...
// Returns balance and whether sufficient for this product
export async function GET(req: NextRequest) {
  const email  = req.nextUrl.searchParams.get('email')
  const slug   = req.nextUrl.searchParams.get('slug')
  const coinId = req.nextUrl.searchParams.get('coin_id')

  if (!email || !slug || !coinId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const product = PRODUCTS.find(p => p.slug === slug)
  if (!product?.price) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  try {
    const res = await fetch(
      `${NOBLE_API_URL}/api/v1/balance-by-email?email=${encodeURIComponent(email)}&coin_id=${coinId}`,
      { headers: { 'Authorization': `Bearer ${NOBLE_API_KEY}` } }
    )
    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err.error || 'Noble API error' }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json({
      email,
      coin_id: coinId,
      coin_label: COIN_LABELS[coinId] || coinId,
      balance: data.balance,
      required: product.price,
      sufficient: data.balance >= product.price,
      product_name: product.name,
    })
  } catch {
    return NextResponse.json({ error: 'Noble API unreachable' }, { status: 503 })
  }
}

// POST /api/noble-pay — execute Noble currency payment
export async function POST(req: NextRequest) {
  const { email, slug, coin_id, affiliate_ref } = await req.json()

  if (!email || !slug || !coin_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const product = PRODUCTS.find(p => p.slug === slug)
  if (!product?.price) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const orderRef = `SHOP-${Date.now()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`

  // 1. Debit the Noble currency
  const debitRes = await fetch(`${NOBLE_API_URL}/api/v1/debit`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${NOBLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      coin_id,
      amount: product.price,
      description: `Kauf: ${product.name} auf shop.pan21.com`,
      reference: orderRef,
    }),
  })

  if (!debitRes.ok) {
    const err = await debitRes.json()
    return NextResponse.json({ error: err.error || 'Payment failed' }, { status: debitRes.status })
  }

  const debitData = await debitRes.json()

  // 2. Send order notification via Resend
  const resendKey = process.env.RESEND_API_KEY
  const orderTo   = process.env.ORDER_TO || 'bestellungen@pan21.com'
  if (resendKey) {
    const COIN_LABELS: Record<string,string> = { europan:'EUROPAN', n_coin:'N-Coin', swissycash:'SwissyCash', cryptocoin:'CryptoCoin' }
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'PAN21 Shop <noreply@pan21.com>',
        to: [email, orderTo],
        reply_to: orderTo,
        subject: `Bestellbestätigung: ${product.name} (${COIN_LABELS[coin_id] || coin_id})`,
        html: `<p><strong>Produkt:</strong> ${product.name}<br>
<strong>Bezahlt mit:</strong> ${product.price} ${COIN_LABELS[coin_id] || coin_id}<br>
<strong>Referenz:</strong> ${orderRef}<br>
<strong>Neues Guthaben:</strong> ${debitData.new_balance} ${COIN_LABELS[coin_id] || coin_id}</p>
<p>Wir melden uns innerhalb eines Werktags mit den nächsten Schritten.</p>`,
      }),
    })
  }

  // 3. Credit affiliate + buyer bonus (doppel_wums = true since paid in Noble)
  await fetch(`${NOBLE_API_URL}/api/v1/affiliate-credit`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${NOBLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buyer_email: email,
      affiliate_ref: affiliate_ref || null,
      order_amount_eur: product.price,
      coin_id_used: coin_id,
      doppel_wums: true,
      order_reference: orderRef,
    }),
  }).catch(() => {}) // non-blocking

  return NextResponse.json({
    success: true,
    order_reference: orderRef,
    product: product.name,
    paid_with: coin_id,
    amount: product.price,
    new_balance: debitData.new_balance,
    doppel_wums: true,
  })
}
