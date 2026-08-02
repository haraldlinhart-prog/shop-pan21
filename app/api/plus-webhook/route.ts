import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' })

// Alle sechs Plus-Tools teilen sich dasselbe Supabase-Projekt ("PAN21 Counter").
// Eigene Env-Var-Namen (statt der Shop-eigenen), um keine Kollision mit
// künftigen shop.pan21.com-eigenen Supabase-Anbindungen zu riskieren.
const SUPABASE_URL = process.env.TOOLS_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.TOOLS_SUPABASE_SERVICE_KEY!
const RESEND_API_KEY = process.env.RESEND_API_KEY!

async function sb(path: string, options: RequestInit = {}) {
  const headers = {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers })
}

async function sendEmail(from: string, to: string, subject: string, html: string) {
  if (!RESEND_API_KEY || !to) return
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    })
  } catch (e) {
    console.error('Mail send error:', e)
  }
}

// Zentrale Cross-Promotion-Liste — einzige Pflegestelle ist /api/webmaster-tools
// in diesem selben Projekt. Neues Tool = nur dort ergänzen, wirkt hier automatisch.
async function buildToolsFooterHtml(excludeSlug: string): Promise<string> {
  try {
    const res = await fetch('https://shop.pan21.com/api/webmaster-tools', { signal: AbortSignal.timeout(4000) })
    const data = await res.json()
    const tools = (data.tools || []).filter((t: any) => t.slug !== excludeSlug)
    if (tools.length === 0) return ''
    const rows = tools.map((t: any) =>
      `<tr><td style="padding:4px 8px 4px 0;">${t.emoji}</td><td style="padding:4px 8px 4px 0;"><a href="${t.url}" style="color:#0d1f3c;font-weight:600;text-decoration:none;">${t.name}</a></td><td style="padding:4px 0;color:#6b7ca0;">${t.description}</td></tr>`
    ).join('')
    return `<div style="margin-top:24px;padding-top:20px;border-top:1px solid #e8ecf2;">
      <p style="font-size:.85rem;color:#1a1a2e;font-weight:700;margin-bottom:10px;">Kennen Sie schon unsere anderen kostenlosen Webmaster-Tools?</p>
      <table style="font-size:.82rem;border-collapse:collapse;">${rows}</table>
    </div>`
  } catch (e) {
    return ''
  }
}

type Handlers = {
  onActivate: (meta: Record<string, string>, session: Stripe.Checkout.Session) => Promise<void>
  onCancel: (subscriptionId: string) => Promise<void>
}

const PRODUCT_HANDLERS: Record<string, Handlers> = {
  pan21counter: {
    onActivate: async (meta, session) => {
      await sb(`pc_plus_subscribers?site_id=eq.${meta.site_id}`, {
        method: 'PATCH', headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ status: 'active', stripe_customer_id: session.customer, stripe_subscription_id: session.subscription, activated_at: new Date().toISOString() }),
      })
      await sendEmail('PAN21counter <noreply@pan21.com>', meta.email, 'PAN21counter Plus aktiviert',
        `<div style="font-family:sans-serif;line-height:1.6"><h2>PAN21counter Plus ist aktiv</h2><p>Ihre Website <strong>${meta.site_id}</strong> hat jetzt Zugriff auf 365-Tage-Historie, Wochenreport und Badge ohne Branding.</p></div>${await buildToolsFooterHtml('pan21counter')}`)
    },
    onCancel: async (subId) => {
      await sb(`pc_plus_subscribers?stripe_subscription_id=eq.${subId}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status: 'cancelled' }) })
    },
  },
  'site-ok': {
    onActivate: async (meta, session) => {
      await sb(`so_plus_subscribers?site_id=eq.${meta.site_id}`, {
        method: 'PATCH', headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ status: 'active', stripe_customer_id: session.customer, stripe_subscription_id: session.subscription, activated_at: new Date().toISOString() }),
      })
      await sendEmail('site-ok.de <noreply@pan21.com>', meta.email, 'site-ok.de Plus aktiviert',
        `<div style="font-family:sans-serif;line-height:1.6"><h2>site-ok.de Plus ist aktiv</h2><p>Sie erhalten ab jetzt eine E-Mail, sobald Ihre Website nicht mehr erreichbar ist — und wenn sie wieder online ist.</p></div>${await buildToolsFooterHtml('site-ok')}`)
    },
    onCancel: async (subId) => {
      await sb(`so_plus_subscribers?stripe_subscription_id=eq.${subId}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status: 'cancelled' }) })
    },
  },
  'pagespeed-plus': {
    onActivate: async (meta, session) => {
      await sb(`ps_plus_subscribers?site_id=eq.${meta.site_id}`, {
        method: 'PATCH', headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ status: 'active', stripe_customer_id: session.customer, stripe_subscription_id: session.subscription, activated_at: new Date().toISOString() }),
      })
      await sendEmail('PageSpeed Plus <noreply@pan21.com>', meta.email, 'PageSpeed Plus aktiviert',
        `<div style="font-family:sans-serif;line-height:1.6"><h2>PageSpeed Plus ist aktiv</h2><p>Ihre Website wird ab jetzt täglich geprüft, mit E-Mail-Alarm bei Score-Verschlechterung.</p></div>${await buildToolsFooterHtml('pagespeed-plus')}`)
    },
    onCancel: async (subId) => {
      await sb(`ps_plus_subscribers?stripe_subscription_id=eq.${subId}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status: 'cancelled' }) })
    },
  },
  'spam-abwehr': {
    onActivate: async (meta, session) => {
      await sb(`sa_plus_subscribers?api_key=eq.${meta.api_key}`, {
        method: 'PATCH', headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ status: 'active', stripe_customer_id: session.customer, stripe_subscription_id: session.subscription, activated_at: new Date().toISOString() }),
      })
      await sendEmail('Spam-Abwehr <noreply@pan21.com>', meta.email, 'Spam-Abwehr Plus aktiviert — Ihr API-Key',
        `<div style="font-family:sans-serif;line-height:1.6"><h2>Spam-Abwehr Plus ist aktiv</h2><p>Ihr API-Key:</p><p style="background:#f5f7fa;padding:12px 16px;border-radius:6px;font-family:monospace;">${meta.api_key}</p><p>Verwendung: <code>POST https://spam-abwehr.de/api/check-email</code> mit <code>{"api_key":"${meta.api_key}","email":"..."}</code></p></div>${await buildToolsFooterHtml('spam-abwehr')}`)
    },
    onCancel: async (subId) => {
      await sb(`sa_plus_subscribers?stripe_subscription_id=eq.${subId}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status: 'cancelled' }) })
    },
  },
  'impressum-free': {
    onActivate: async (meta, session) => {
      await sb(`imp_plus_subscribers?email=eq.${encodeURIComponent(meta.email.toLowerCase())}&domain=eq.${encodeURIComponent(meta.domain)}`, {
        method: 'PATCH', headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ status: 'active', stripe_customer_id: session.customer, stripe_subscription_id: session.subscription, activated_at: new Date().toISOString() }),
      })
      await sendEmail('Impressum-Free <noreply@pan21.com>', meta.email, 'Impressum-Free Plus aktiviert',
        `<div style="font-family:sans-serif;line-height:1.6"><h2>Impressum-Free Plus ist aktiv</h2><p>Für <strong>${meta.domain}</strong> erhalten Sie ab jetzt eine jährliche Erinnerung zur Impressum-Prüfung.</p></div>${await buildToolsFooterHtml('impressum-free')}`)
    },
    onCancel: async (subId) => {
      await sb(`imp_plus_subscribers?stripe_subscription_id=eq.${subId}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status: 'cancelled' }) })
    },
  },
  'linkcheck-plus': {
    onActivate: async (meta, session) => {
      await sb(`lc_plus_subscribers?site_id=eq.${meta.site_id}`, {
        method: 'PATCH', headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ status: 'active', stripe_customer_id: session.customer, stripe_subscription_id: session.subscription, activated_at: new Date().toISOString() }),
      })
      await sendEmail('LinkCheck Plus <noreply@pan21.com>', meta.email, 'LinkCheck Plus aktiviert',
        `<div style="font-family:sans-serif;line-height:1.6"><h2>LinkCheck Plus ist aktiv</h2><p>Ihre Website wird ab jetzt wöchentlich automatisch durchsucht (bis 150 Seiten), mit E-Mail-Alarm bei neuen defekten Links.</p></div>${await buildToolsFooterHtml('linkcheck-plus')}`)
    },
    onCancel: async (subId) => {
      await sb(`lc_plus_subscribers?stripe_subscription_id=eq.${subId}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status: 'cancelled' }) })
    },
  },
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature') || ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const meta = (session.metadata || {}) as Record<string, string>
      const product = meta.product
      const handler = product && PRODUCT_HANDLERS[product]
      if (handler) {
        await handler.onActivate(meta, session)
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
