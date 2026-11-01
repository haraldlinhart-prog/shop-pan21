import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Admin-Hilfsroute für die Meldestelle (geschützt mit NOTIFY_SECRET)
// ?action=list&pages=N  -> letzte Mails (from/to/subject) zur Analyse
// ?action=webhooks       -> vorhandene Resend-Webhooks
// ?action=create         -> Webhook email.sent -> /api/notify/resend anlegen
export async function POST(req: NextRequest) {
  if (!process.env.NOTIFY_SECRET || req.headers.get('x-notify-secret') !== process.env.NOTIFY_SECRET)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const key = process.env.RESEND_API_KEY!
  const H = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
  const action = req.nextUrl.searchParams.get('action')
  if (action === 'list') {
    const pages = Number(req.nextUrl.searchParams.get('pages') || 3)
    const out: any[] = []
    let after = ''
    for (let i = 0; i < pages; i++) {
      const r = await fetch(`https://api.resend.com/emails?limit=100${after ? '&after=' + after : ''}`, { headers: H })
      const j: any = await r.json()
      if (!r.ok) return NextResponse.json({ error: j }, { status: 502 })
      const d = j.data || []
      out.push(...d.map((e: any) => ({ id: e.id, at: e.created_at, from: e.from, to: e.to, subject: e.subject })))
      if (!j.has_more || !d.length) break
      after = d[d.length - 1].id
    }
    return NextResponse.json(out)
  }
  if (action === 'webhooks') {
    const r = await fetch('https://api.resend.com/webhooks', { headers: H })
    return NextResponse.json(await r.json(), { status: r.status })
  }
  if (action === 'create') {
    const r = await fetch('https://api.resend.com/webhooks', {
      method: 'POST', headers: H,
      body: JSON.stringify({ endpoint: 'https://shop.pan21.com/api/notify/resend', events: ['email.sent'] }),
    })
    return NextResponse.json(await r.json(), { status: r.status })
  }
  return NextResponse.json({ error: 'action?' }, { status: 400 })
}
