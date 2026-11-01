import Stripe from 'stripe'

// Verifiziert einen eingehenden Stripe-Webhook, indem das Event anhand seiner ID
// direkt bei Stripe abgerufen wird. Damit ist der Inhalt garantiert echt –
// unabhängig davon, welches Webhook-Signing-Secret zu welchem Endpoint gehört
// (mehrere Endpoints in diesem Projekt teilen sich sonst ein falsches Secret).
export async function verifiedStripeEvent(rawBody: string): Promise<Stripe.Event | null> {
  let id: string | undefined
  try { id = JSON.parse(rawBody)?.id } catch { return null }
  if (!id || !id.startsWith('evt_')) return null
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' as any })
  try { return await stripe.events.retrieve(id) } catch { return null }
}
