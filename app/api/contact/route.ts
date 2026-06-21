import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, interest, message, elapsed, inquiry } = body

    if (body.website) return NextResponse.json({ ok: true })
    if (typeof elapsed === 'number' && elapsed < 2000) return NextResponse.json({ ok: true })
    if (!name || !email) return NextResponse.json({ error: 'Pflichtfelder fehlen' }, { status: 400 })
    if (!email.includes('@')) return NextResponse.json({ error: 'Ungültige E-Mail' }, { status: 400 })
    if (message) {
      const noSpaces = String(message).replace(/\s/g, '')
      if (noSpaces.length > 60 && noSpaces.length === String(message).length) return NextResponse.json({ ok: true })
    }

    const resendKey = process.env.RESEND_API_KEY
    const contactTo = process.env.CONTACT_TO || 'shop@pan21.com'

    if (!resendKey) {
      console.log('Contact (no Resend):', { name, email, interest })
      return NextResponse.json({ ok: true })
    }

    const subject = inquiry
      ? `Anfrage: ${interest || name} — PAN21 Shop`
      : `Kontakt: ${interest || name} — PAN21 Shop`

    const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#F7F8FA;">
  <div style="border-left:3px solid #C9963A;padding-left:16px;margin-bottom:20px;">
    <div style="font-size:0.65rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#C9963A;margin-bottom:4px;">PAN21 Shop — ${inquiry ? 'Produktanfrage' : 'Kontakt'}</div>
    <div style="font-size:1rem;font-weight:700;color:#0B1F3A;">${interest || 'Allgemeine Anfrage'}</div>
  </div>
  <table style="width:100%;font-size:0.875rem;color:#5C6B7A;border-collapse:collapse;">
    <tr><td style="padding:7px 0;font-weight:700;color:#0B1F3A;width:90px;">Name</td><td>${name}</td></tr>
    <tr><td style="padding:7px 0;font-weight:700;color:#0B1F3A;">E-Mail</td><td><a href="mailto:${email}">${email}</a></td></tr>
    ${phone ? `<tr><td style="padding:7px 0;font-weight:700;color:#0B1F3A;">Telefon</td><td>${phone}</td></tr>` : ''}
    ${interest ? `<tr><td style="padding:7px 0;font-weight:700;color:#0B1F3A;">Interesse</td><td>${interest}</td></tr>` : ''}
  </table>
  ${message ? `<div style="background:#fff;border:1px solid #DDE2E8;padding:16px 20px;margin-top:16px;font-size:0.875rem;line-height:1.8;white-space:pre-wrap;">${message}</div>` : ''}
  <p style="font-size:0.68rem;color:#9CA3AF;margin-top:20px;">shop.pan21.com · ${elapsed}ms</p>
</div>`

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'PAN21 Shop <noreply@pan21.com>',
        to: contactTo,
        reply_to: email,
        subject,
        html,
      }),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Contact error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
