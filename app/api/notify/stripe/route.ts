import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { sendNotice } from '@/lib/notify'

export const dynamic = 'force-dynamic'

const TITLES: Record<string, string> = {
  'payment_intent.succeeded': '💶 Zahlung eingegangen',
  'payment_intent.payment_failed': '⚠️ Zahlung fehlgeschlagen',
  'checkout.session.expired': 'Checkout abgebrochen',
  'customer.subscription.created': 'Neues Abo',
  'customer.subscription.deleted': 'Abo gekündigt',
  'invoice.payment_failed': '⚠️ Abo-Zahlung fehlgeschlagen',
  'charge.refunded': '↩️ Erstattung',
  'charge.dispute.created': '🚨 Rückbuchung / Dispute',
  'customer.created': 'Neuer Stripe-Kunde',
}

export async function POST(req: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return NextResponse.json({ error: 'no key' }, { status: 500 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad json' }, { status: 400 }) }
  if (!body?.id) return NextResponse.json({ error: 'no id' }, { status: 400 })
  const stripe = new Stripe(key, { apiVersion: '2023-10-16' as any })
  // Echtheit: Event direkt bei Stripe nachladen statt dem Body zu vertrauen
  let ev: Stripe.Event
  try { ev = await stripe.events.retrieve(body.id) } catch { return NextResponse.json({ error: 'unknown event' }, { status: 400 }) }
  if (!TITLES[ev.type]) return NextResponse.json({ ignored: ev.type })

  const o: any = ev.data.object
  const cur = String(o.currency || '').toUpperCase()
  const amt = o.amount_received ?? o.amount ?? o.amount_refunded ?? o.amount_due ?? o.plan?.amount ?? null
  const amount = amt != null ? `${(amt / (['JPY', 'KRW'].includes(cur) ? 1 : 100)).toLocaleString('de-DE', { minimumFractionDigits: 2 })} ${cur}` : ''
  let email = o.receipt_email || o.customer_email || o.email || o.billing_details?.email || o.last_payment_error?.payment_method?.billing_details?.email || ''
  let site = o.metadata?.site || o.metadata?.source || ''
  if (!site && o.description) site = o.description
  if ((!email || !site) && ev.type.startsWith('payment_intent')) {
    try {
      const s = await stripe.checkout.sessions.list({ payment_intent: o.id, limit: 1 })
      const cs: any = s.data[0]
      if (cs) {
        email ||= cs.customer_details?.email || ''
        site ||= cs.metadata?.site || cs.success_url?.split('/')[2] || ''
      }
    } catch {}
  }
  if (!email && typeof o.customer === 'string') {
    try { const c: any = await stripe.customers.retrieve(o.customer); email = c.email || '' } catch {}
  }
  const title = TITLES[ev.type]
  await sendNotice(
    `[Stripe${site ? ' · ' + site : ''}] ${title}${amount ? ' – ' + amount : ''}${email ? ' – ' + email : ''}`,
    `<strong>${title}</strong>${amount ? ` · ${amount}` : ''}${site ? ` · Quelle: ${site}` : ''}`,
    {
      Ereignis: ev.type, Betrag: amount, Kunde: email, Quelle: site, Beschreibung: o.description,
      Status: o.status, Fehler: o.last_payment_error?.message || o.failure_message, Metadaten: o.metadata,
      Objekt: o.id, Dashboard: `https://dashboard.stripe.com/${ev.livemode ? '' : 'test/'}events/${ev.id}`,
    },
  )
  return NextResponse.json({ ok: true })
}
