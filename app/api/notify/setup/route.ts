import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

// Einmalig: legt den Stripe-Webhook für die Meldestelle an (idempotent)
const URL_ = 'https://shop.pan21.com/api/notify/stripe'
const EVENTS = ['payment_intent.succeeded', 'payment_intent.payment_failed', 'customer.subscription.created',
  'customer.subscription.deleted', 'invoice.payment_failed', 'charge.refunded', 'charge.dispute.created']

export async function POST(req: NextRequest) {
  if (req.headers.get('x-notify-secret') !== process.env.NOTIFY_SECRET || !process.env.NOTIFY_SECRET)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' as any })
  const list = await stripe.webhookEndpoints.list({ limit: 100 })
  if (req.nextUrl.searchParams.get('list')) return NextResponse.json(list.data.map(w => ({ id: w.id, url: w.url, status: w.status, created: new Date(w.created * 1000).toISOString().slice(0, 10), desc: w.description, events: w.enabled_events })))
  const existing = list.data.find(w => w.url === URL_)
  const ep = existing
    ? await stripe.webhookEndpoints.update(existing.id, { enabled_events: EVENTS as any, disabled: false })
    : await stripe.webhookEndpoints.create({ url: URL_, enabled_events: EVENTS as any, description: 'PAN21 Meldestelle -> nachrichten@pan21.com' })
  const acct = await stripe.accounts.retrieve().catch(() => null as any)
  return NextResponse.json({
    ok: true, id: ep.id, status: ep.status, account: acct?.settings?.dashboard?.display_name || acct?.id,
    all_webhooks: list.data.map(w => ({ url: w.url, status: w.status, events: w.enabled_events.length })),
  })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message, type: e?.type, code: e?.code }, { status: 500 })
  }
}
