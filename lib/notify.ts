// Zentrale Meldestelle: jede Kundenaktion im PAN21-Netzwerk -> Mail an nachrichten@pan21.com
const HIDE = /pass|token|secret|key|hash|otp|signature|card|iban|cvc|confirmation/i

export function esc(v: unknown): string {
  const s = typeof v === 'string' ? v : JSON.stringify(v)
  return (s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))
}

export function rowsHtml(obj: Record<string, unknown>): string {
  return Object.entries(obj || {})
    .filter(([k, v]) => v !== null && v !== '' && !HIDE.test(k))
    .slice(0, 40)
    .map(([k, v]) => {
      let s = typeof v === 'object' ? JSON.stringify(v) : String(v)
      if (s.length > 400) s = s.slice(0, 400) + ' …'
      return `<tr><td style="padding:4px 10px 4px 0;color:#5C6B7A;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:4px 0">${esc(s)}</td></tr>`
    }).join('')
}

export async function sendNotice(subject: string, intro: string, data: Record<string, unknown>, replyTo?: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY fehlt')
  const to = process.env.NOTIFY_TO || 'nachrichten@pan21.com'
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;max-width:680px">
<p style="margin:0 0 12px">${intro}</p>
<table style="border-collapse:collapse;font-size:13px">${rowsHtml(data)}</table>
<p style="color:#999;font-size:11px;margin-top:16px">PAN21 Meldestelle · ${new Date().toISOString()}</p></div>`
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'PAN21 Meldestelle <noreply@pan21.com>', to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  })
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`)
}
