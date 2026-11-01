import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { notifyStripeEvent } from '@/lib/stripe-notify'

export const dynamic = 'force-dynamic'

// Einmalig: legt den Stripe-Webhook für die Meldestelle an (idempotent)
const URL_ = 'https://shop.pan21.com/api/webhook'
const EVENTS = ['payment_intent.succeeded', 'payment_intent.payment_failed', 'customer.subscription.created',
  'customer.subscription.deleted', 'invoice.payment_failed', 'charge.refunded', 'charge.dispute.created']

export async function POST(req: NextRequest) {
  if (req.headers.get('x-notify-secret') !== process.env.NOTIFY_SECRET || !process.env.NOTIFY_SECRET)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' as any })
  if (req.nextUrl.searchParams.get('test')) {
    const evs = await stripe.events.list({ type: 'payment_intent.succeeded', limit: 1 })
    if (!evs.data[0]) return NextResponse.json({ error: 'kein Event' })
    return NextResponse.json({ test: evs.data[0].id, result: await notifyStripeEvent(evs.data[0].id) })
  }
  const list = await stripe.webhookEndpoints.list({ limit: 100 })
  if (req.nextUrl.searchParams.get('list')) return NextResponse.json(list.data.map(w => ({ id: w.id, url: w.url, status: w.status, created: new Date(w.created * 1000).toISOString().slice(0, 10), desc: w.description, events: w.enabled_events })))
  if (req.nextUrl.searchParams.get('enable_plus')) {
    const plus = list.data.find(w => w.url === 'https://shop.pan21.com/api/plus-webhook')
    if (!plus) return NextResponse.json({ error: 'plus-webhook nicht gefunden' })
    const up = await stripe.webhookEndpoints.update(plus.id, { disabled: false })
    // Verpasste PLUS-Käufe der letzten 30 Tage (älter hält Stripe nicht vor)
    const missed: any[] = []
    for await (const ev of stripe.events.list({ type: 'checkout.session.completed', limit: 100 })) {
      const m: any = (ev.data.object as any).metadata || {}
      if (m.product) missed.push({ event: ev.id, product: m.product, email: m.email, site: m.site_id, date: new Date(ev.created * 1000).toISOString().slice(0, 10) })
    }
    return NextResponse.json({ plus: up.id, status: up.status, plus_checkouts_last_30d: missed })
  }
  const existing = list.data.find(w => w.url === URL_)
  if (!existing) return NextResponse.json({ error: 'Shop-Webhook nicht gefunden' }, { status: 404 })
  const events = Array.from(new Set([...existing.enabled_events, ...EVENTS]))
  const ep = await stripe.webhookEndpoints.update(existing.id, { enabled_events: events as any })
  const acct = await stripe.accounts.retrieve().catch(() => null as any)
  return NextResponse.json({
    ok: true, id: ep.id, status: ep.status, account: acct?.settings?.dashboard?.display_name || acct?.id,
    all_webhooks: list.data.map(w => ({ url: w.url, status: w.status, events: w.enabled_events.length })),
  })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message, type: e?.type, code: e?.code }, { status: 500 })
  }
}
