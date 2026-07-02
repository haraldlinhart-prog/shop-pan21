import { NextRequest, NextResponse } from 'next/server'
import { PRODUCTS } from '@/lib/products'

const NOBLE_API_URL = (process.env.NOBLE_API_URL || 'https://www.noble-limited.com').replace(/^https:\/\/noble-limited\.com/, 'https://www.noble-limited.com')
const NOBLE_API_KEY = process.env.NOBLE_API_KEY || ''

const COIN_LABELS: Record<string, string> = {
  europan:    'EUROPAN',
  n_coin:     'N-Coin',
  swissycash: 'SwissyCash',
  cryptocoin: 'CryptoCoin',
}

// POST /api/noble-pay — execute Noble currency payment
// Body: { email, pin, slug, coin_id, affiliate_ref? }
//
// SECURITY: /api/v1/debit at noble-limited.com only checks the internal API key,
// not a PIN — it trusts whoever calls it. That means THIS route is the only place
// verifying the customer actually owns the account before any money moves. Never
// call debit without first confirming the PIN via balance-by-email.
export async function POST(req: NextRequest) {
  const { email, pin, slug, coin_id, affiliate_ref } = await req.json().catch(() => ({}))

  if (!email || !pin || !slug || !coin_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  // Aktuell ist nur EUROPAN als Zahlungswährung im Shop erwünscht — die anderen drei
  // Noble-Währungen funktionieren technisch über die API, sind hier aber bewusst gesperrt.
  if (coin_id !== 'europan') {
    return NextResponse.json({ error: 'Diese Währung ist aktuell nicht als Zahlungsmittel aktiviert.' }, { status: 400 })
  }
  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: 'PIN (4-stellig) erforderlich' }, { status: 400 })
  }

  const product = PRODUCTS.find(p => p.slug === slug)
  if (!product?.price) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  // 0. Verify PIN + fetch authoritative balance before touching anything
  const verifyRes = await fetch(`${NOBLE_API_URL}/api/v1/balance-by-email`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${NOBLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.toLowerCase(), pin, coin_id }),
  })
  if (verifyRes.status === 404) return NextResponse.json({ error: 'Kein Noble-Konto für diese E-Mail gefunden.' }, { status: 404 })
  if (verifyRes.status === 401) return NextResponse.json({ error: 'Falsche PIN.' }, { status: 401 })
  if (verifyRes.status === 429) return NextResponse.json({ error: 'Zu viele falsche Versuche — bitte später erneut versuchen.' }, { status: 429 })
  if (!verifyRes.ok) return NextResponse.json({ error: 'Noble API error' }, { status: verifyRes.status })

  const verifyData = await verifyRes.json()
  if ((verifyData.balance || 0) < product.price) {
    return NextResponse.json({ error: 'Guthaben nicht ausreichend.', balance: verifyData.balance }, { status: 402 })
  }

  const orderRef = `SHOP-${Date.now()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`

  // 1. Debit the Noble currency — PIN already verified above
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
    const err = await debitRes.json().catch(() => ({}))
    return NextResponse.json({ error: err.error || 'Payment failed' }, { status: debitRes.status })
  }

  const debitData = await debitRes.json()

  // 2. Send order notification via Resend
  const resendKey = process.env.RESEND_API_KEY
  const orderTo   = process.env.ORDER_TO || 'bestellungen@pan21.com'
  if (resendKey) {
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
    }).catch(() => {})
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
  }).catch(() => {})

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
