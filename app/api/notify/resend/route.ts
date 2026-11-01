import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Resend-Webhook (email.sent): Kopie jeder Formular-/Bestell-Mail des Netzwerks an nachrichten@pan21.com.
// Echtheit: Mail wird per ID direkt bei Resend abgerufen (Body wird nicht vertraut).
const SKIP_FROM = /Meldestelle/i
const SKIP_SUBJECT = /neue Link-Vorschläge|ist angekommen|Ihre Anfrage bei|Confirm your email|Bestätigen Sie Ihre|Reset your password|Magic Link|Your enquiry has been received/i

const esc = (s: string) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

export async function POST(req: NextRequest) {
  let b: any
  try { b = await req.json() } catch { return NextResponse.json({ error: 'bad json' }, { status: 400 }) }
  const id = b?.data?.email_id
  if (b?.type !== 'email.sent' || !id) return NextResponse.json({ ignored: true })
  const key = process.env.RESEND_API_KEY!
  const to = process.env.NOTIFY_TO || 'nachrichten@pan21.com'
  const r = await fetch(`https://api.resend.com/emails/${id}`, { headers: { Authorization: `Bearer ${key}` } })
  if (!r.ok) return NextResponse.json({ error: 'unknown email' }, { status: 400 })
  const m: any = await r.json()
  const recips: string[] = [].concat(m.to || [])
  if (SKIP_FROM.test(m.from || '') || recips.includes(to) || SKIP_SUBJECT.test(m.subject || '')) {
    return NextResponse.json({ skipped: true })
  }
  const replyTo = [].concat(m.reply_to || []).filter(Boolean)
  const head = `<div style="font-family:Arial,sans-serif;font-size:12px;background:#f3f5f8;border:1px solid #dde2e8;padding:10px 14px;margin-bottom:14px">
<b>Kopie (PAN21 Meldestelle)</b><br>Von: ${esc(m.from)}<br>An: ${esc(recips.join(', '))}${replyTo.length ? `<br>Antwort an: ${esc(replyTo.join(', '))}` : ''}<br>Zeit: ${esc(m.created_at)}</div>`
  const body = m.html || (m.text ? `<pre style="white-space:pre-wrap;font-family:inherit">${esc(m.text)}</pre>` : '<i>(kein Inhalt)</i>')
  const s = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'PAN21 Meldestelle <noreply@pan21.com>', to,
      subject: `[Kopie → ${recips[0] || '?'}] ${m.subject || '(ohne Betreff)'}`.slice(0, 240),
      html: head + body,
      ...(replyTo.length ? { reply_to: replyTo } : {}),
    }),
  })
  if (!s.ok) return NextResponse.json({ error: await s.text() }, { status: 502 })
  return NextResponse.json({ ok: true })
}
