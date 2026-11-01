import { NextRequest, NextResponse } from 'next/server'
import { sendNotice, esc } from '@/lib/notify'

export const dynamic = 'force-dynamic'

// Aufruf aus Supabase-Triggern (pg_net) und Website-Formularen/Tools.
// Body: { source, table?, event?, op?, record? }
const LABEL: Record<string, string> = {
  'auth.users': 'Neue Registrierung',
}

export async function POST(req: NextRequest) {
  if (!process.env.NOTIFY_SECRET || req.headers.get('x-notify-secret') !== process.env.NOTIFY_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  let b: any
  try { b = await req.json() } catch { return NextResponse.json({ error: 'bad json' }, { status: 400 }) }
  const source = String(b.source || 'unbekannt')
  const table = String(b.table || '')
  const what = b.event || LABEL[table] || (table ? `Neuer Eintrag: ${table}` : 'Aktivität')
  const rec = b.record || {}
  const who = rec.email || rec.customer_email || rec.contact_email || rec.domain || rec.url || rec.name || rec.customer_name || ''
  try {
    await sendNotice(
      `[${source}] ${what}${who ? ' – ' + String(who).slice(0, 80) : ''}`,
      `<strong>${esc(what)}</strong> auf <strong>${esc(source)}</strong>${table ? ` (Tabelle ${esc(table)})` : ''}`,
      rec,
    )
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
