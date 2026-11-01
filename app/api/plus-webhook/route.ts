import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { PRODUCT_HANDLERS } from '@/lib/plusActivation'
import { verifiedStripeEvent } from '@/lib/stripe-verify'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  // Früher: constructEvent mit STRIPE_WEBHOOK_SECRET – das ist aber das Secret des
  // Shop-Webhooks, nicht dieses Endpoints -> jede Zustellung 400 -> Stripe hat den
  // Endpoint deaktiviert. Jetzt: Event direkt bei Stripe abrufen.
  const event = await verifiedStripeEvent(rawBody)
  if (!event) return NextResponse.json({ error: 'Invalid or unverified event' }, { status: 400 })

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const meta = (session.metadata || {}) as Record<string, string>
      const product = meta.product
      const handler = product && PRODUCT_HANDLERS[product]
      if (handler) {
        await handler.onActivate({
          meta,
          customerId: session.customer as string | null,
          subscriptionId: session.subscription as string | null,
          paymentMethod: 'stripe',
        })
      } else {
        console.warn('plus-webhook: unbekanntes oder fehlendes product in metadata:', product)
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription
      // Wir wissen bei diesem Event nicht, welches Produkt es betrifft — daher
      // bei allen sechs Tabellen versuchen, die stripe_subscription_id zu matchen
      // (nur die richtige Tabelle hat tatsächlich eine Zeile, der Rest betrifft 0 Zeilen).
      await Promise.all(Object.values(PRODUCT_HANDLERS).map((h) => h.onCancel(sub.id).catch(() => {})))
    }
  } catch (err) {
    console.error('plus-webhook handler error:', err)
    // Trotzdem 200 zurückgeben, damit Stripe nicht endlos retried, sobald das
    // Event grundsätzlich angekommen und die Signatur gültig war.
  }

  return NextResponse.json({ received: true })
}
