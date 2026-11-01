import Stripe from 'stripe'
import { sendNotice } from '@/lib/notify'

export const NOTIFY_TITLES: Record<string, string> = {
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


export async function notifyStripeEvent(eventId: string): Promise<string> {
  const key = process.env.STRIPE_SECRET_KEY!
  const stripe = new Stripe(key, { apiVersion: '2023-10-16' as any })
  const ev = await stripe.events.retrieve(eventId)
  if (!NOTIFY_TITLES[ev.type]) return 'ignored'
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
  const title = NOTIFY_TITLES[ev.type]
  await sendNotice(
    `[Stripe${site ? ' · ' + site : ''}] ${title}${amount ? ' – ' + amount : ''}${email ? ' – ' + email : ''}`,
    `<strong>${title}</strong>${amount ? ` · ${amount}` : ''}${site ? ` · Quelle: ${site}` : ''}`,
    {
      Ereignis: ev.type, Betrag: amount, Kunde: email, Quelle: site, Beschreibung: o.description,
      Status: o.status, Fehler: o.last_payment_error?.message || o.failure_message, Metadaten: o.metadata,
      Objekt: o.id, Dashboard: `https://dashboard.stripe.com/${ev.livemode ? '' : 'test/'}events/${ev.id}`,
    },
  )
  return 'sent'
}
