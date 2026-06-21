import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.text()

  let event: any
  try { event = JSON.parse(body) } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const { product_name, customer_email, sku } = session.metadata || {}
    const resendKey = process.env.RESEND_API_KEY
    const orderTo = process.env.ORDER_TO || 'bestellungen@pan21.com'
    const amount = (session.amount_total / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 })

    if (resendKey && customer_email) {
      // Confirmation to customer
      const html = `
<div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;padding:40px 32px;background:#F7F8FA;">
  <div style="background:#0B1F3A;padding:24px 32px;margin-bottom:28px;">
    <div style="color:#C9963A;font-size:1.3rem;font-weight:600;letter-spacing:0.02em;">PAN21 Shop</div>
    <div style="color:rgba(255,255,255,0.5);font-size:0.72rem;letter-spacing:0.14em;text-transform:uppercase;margin-top:4px;">Bestellbestätigung</div>
  </div>
  <h2 style="font-size:1.4rem;color:#0B1F3A;margin-bottom:0.5rem;">Vielen Dank für Ihre Bestellung</h2>
  <p style="color:#5C6B7A;line-height:1.8;margin-bottom:20px;">
    Wir haben Ihre Bestellung erhalten und werden uns innerhalb von einem Werktag mit Ihnen in Verbindung setzen, um die weiteren Schritte zu besprechen.
  </p>
  <div style="background:#fff;border:1px solid #DDE2E8;border-left:3px solid #C9963A;padding:20px 24px;margin:24px 0;">
    <div style="font-size:0.65rem;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#C9963A;margin-bottom:12px;">Bestelldetails</div>
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #F0F2F4;font-size:0.85rem;"><span style="color:#5C6B7A;">Produkt</span><strong style="color:#0B1F3A;">${product_name}</strong></div>
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #F0F2F4;font-size:0.85rem;"><span style="color:#5C6B7A;">Betrag</span><strong style="color:#0B1F3A;">€${amount} EUR</strong></div>
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #F0F2F4;font-size:0.85rem;"><span style="color:#5C6B7A;">SKU</span><strong style="color:#0B1F3A;">${sku}</strong></div>
    <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:0.85rem;"><span style="color:#5C6B7A;">Session</span><strong style="color:#0B1F3A;font-size:0.75rem;">${session.id}</strong></div>
  </div>
  <p style="color:#5C6B7A;font-size:0.85rem;line-height:1.75;">
    <strong style="color:#0B1F3A;">Nächste Schritte:</strong> Wir werden uns per E-Mail mit einem strukturierten Fragebogen an Sie wenden, um die erforderlichen Gründungsdaten und Identifikationsnachweise anzufordern.
  </p>
  <p style="color:#9CA3AF;font-size:0.7rem;margin-top:28px;border-top:1px solid #DDE2E8;padding-top:16px;">
    PAN21.COM Corporate Consultants Ltd · shop.pan21.com · pan21.com
  </p>
</div>`

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'PAN21 Shop <noreply@pan21.com>',
          to: customer_email,
          reply_to: orderTo,
          subject: `Bestellbestätigung: ${product_name}`,
          html,
        }),
      })

      // Notification to admin
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'PAN21 Shop <noreply@pan21.com>',
          to: orderTo,
          subject: `Neue Bestellung: ${product_name} — €${amount}`,
          html: `<p><strong>Produkt:</strong> ${product_name}<br><strong>SKU:</strong> ${sku}<br><strong>Betrag:</strong> €${amount}<br><strong>Kunde:</strong> ${customer_email}<br><strong>Session:</strong> ${session.id}</p>`,
        }),
      })
    }
  }

  return NextResponse.json({ received: true })
}
