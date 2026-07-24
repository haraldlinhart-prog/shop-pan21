import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.text()

  let event: any
  try { event = JSON.parse(body) } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const { product_name, customer_email, sku, affiliate_ref } = session.metadata || {}
    const resendKey = process.env.RESEND_API_KEY
    const orderTo   = process.env.ORDER_TO || 'bestellungen@pan21.com'
    const amount    = (session.amount_total / 100)
    const amountStr = amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })
    const orderRef  = session.id

    if (resendKey && customer_email) {
      const html = `
<div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;padding:40px 32px;background:#F7F8FA;">
  <div style="background:#0B1F3A;padding:24px 32px;margin-bottom:28px;">
    <div style="color:#C9963A;font-size:1.3rem;font-weight:600;">PAN21 Shop</div>
    <div style="color:rgba(255,255,255,0.5);font-size:0.72rem;letter-spacing:0.14em;text-transform:uppercase;margin-top:4px;">Bestellbestätigung</div>
  </div>
  <h2 style="font-size:1.4rem;color:#0B1F3A;margin-bottom:0.5rem;">Vielen Dank für Ihre Bestellung</h2>
  <p style="color:#5C6B7A;line-height:1.8;margin-bottom:20px;">Wir melden uns innerhalb eines Werktages mit den nächsten Schritten.</p>
  <div style="background:#fff;border:1px solid #DDE2E8;border-left:3px solid #C9963A;padding:20px 24px;margin:24px 0;">
    <div style="font-size:0.65rem;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#C9963A;margin-bottom:12px;">Bestelldetails</div>
    <div style="padding:6px 0;border-bottom:1px solid #F0F2F4;font-size:0.85rem;display:flex;justify-content:space-between;"><span style="color:#5C6B7A;">Produkt</span><strong>${product_name}</strong></div>
    <div style="padding:6px 0;border-bottom:1px solid #F0F2F4;font-size:0.85rem;display:flex;justify-content:space-between;"><span style="color:#5C6B7A;">Betrag</span><strong>€${amountStr}</strong></div>
    <div style="padding:6px 0;font-size:0.85rem;display:flex;justify-content:space-between;"><span style="color:#5C6B7A;">Referenz</span><strong style="font-size:0.75rem;">${orderRef}</strong></div>
  </div>
</div>`

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'PAN21 Shop <noreply@pan21.com>', to: customer_email, reply_to: orderTo, subject: `Bestellbestätigung: ${product_name}`, html }),
      })

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'PAN21 Shop <noreply@pan21.com>', to: orderTo, subject: `Neue Bestellung: ${product_name} — €${amountStr}`, html: `<p><strong>Produkt:</strong> ${product_name}<br><strong>SKU:</strong> ${sku}<br><strong>Betrag:</strong> €${amountStr}<br><strong>Kunde:</strong> ${customer_email}<br><strong>Affiliate:</strong> ${affiliate_ref || '—'}<br><strong>Session:</strong> ${orderRef}</p>` }),
      })
    }

    // Credit affiliate + buyer EUROPAN bonus (Stripe payment = no Doppel-Wums)
    const nobleKey = process.env.NOBLE_API_KEY
    const nobleUrl = process.env.NOBLE_API_URL || 'https://noble-limited.com'
    if (nobleKey && customer_email) {
      await fetch(`${nobleUrl}/api/v1/affiliate-credit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${nobleKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer_email: customer_email,
          affiliate_ref: affiliate_ref || null,
          order_amount_eur: amount,
          coin_id_used: 'stripe',
          doppel_wums: false,
          order_reference: orderRef,
        }),
      }).catch(() => {})
    }

    // Report to pan-finanzvertrieb.de's affiliate program (separate system from
    // the Noble/EUROPAN one above — non-blocking, never allowed to affect order
    // handling). Only fires when a ref code was actually present; /api/conversion
    // itself simply returns "not found" if the code doesn't belong to a
    // pan-finanzvertrieb.de affiliate, so this is always safe to attempt.
    const panAffiliateSecret = process.env.PAN_AFFILIATE_POSTBACK_SECRET
    const PAN_AFFILIATE_PROGRAM_ID = '9fddd5f3-3e0e-47f4-a116-3c4eb9a848d2' // shop.pan21.com in PAN-Affiliate/programs
    if (panAffiliateSecret && affiliate_ref) {
      const postbackUrl = new URL('https://pan-finanzvertrieb.de/api/conversion')
      postbackUrl.searchParams.set('ref', affiliate_ref)
      postbackUrl.searchParams.set('order_id', orderRef)
      postbackUrl.searchParams.set('amount', String(amount))
      postbackUrl.searchParams.set('program_id', PAN_AFFILIATE_PROGRAM_ID)
      postbackUrl.searchParams.set('secret', panAffiliateSecret)
      fetch(postbackUrl.toString()).catch(() => {})
    }
  }

  return NextResponse.json({ received: true })
}
