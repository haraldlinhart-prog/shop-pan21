import { NextRequest, NextResponse } from 'next/server'
import { PRODUCTS } from '@/lib/products'
import { verifyToken } from '@/app/api/checkout-token/route'

// Anti-Missbrauch: Dieser Endpoint hatte bisher KEINERLEI Schutz -- jeder
// konnte per direktem POST beliebig viele Stripe-Checkout-Sessions ohne
// Rate-Limit, E-Mail-Validierung oder Origin-Check erzeugen. Live beobachtet
// (20.-21.08.26): Card-Testing-Bot erzeugte über den Tag verteilt Sessions
// für die teuersten SKUs (EUROPAN-*-001, bis 3.490 €) mit Dot-Trick-Gmail-
// Adressen (z.B. "jim.and.l.ee.sab.a.c.o.n@gmail.com" -- Gmail ignoriert
// Punkte, klassisches Bot-Merkmal). Bisher ging nichts durch (alle Sessions
// blieben unpaid/open), aber der Endpoint war komplett offen.
//
// Fix 22.08.26 (Runde 2): Der Origin/Referer-Check allein reicht nicht --
// eine Session ging 72 Min. NACH dem Origin-Fix trotzdem durch. Ein direkter
// Server-zu-Server-Call kann jeden Origin-Header frei setzen; das ist keine
// echte Browser-Beschraenkung. Ergaenzt um: (a) Challenge-Token, das nur die
// echte Produktseite ausstellen kann (siehe checkout-token/route.ts), inkl.
// erzwungener Mindest-Verweildauer; (b) Heuristik gegen Punkt-verschleierte
// Gmail-Adressen (Gmail ignoriert Punkte -- alle bisher beobachteten
// Bot-Versuche nutzten 3+ kuenstliche Punkte, um aus einem Postfach beliebig
// viele "einzigartige" Adressen zu erzeugen); (c) zusaetzliches Rate-Limit
// pro normalisierter E-Mail (nicht nur pro IP, da der Bot vermutlich IPs
// rotiert).

// Persistentes Rate-Limit über Nobles bestehende interne API (bereits via
// NOBLE_API_KEY authentifiziert, siehe EUROPAN-Abrechnung weiter unten im
// Webhook). Ersetzt eine reine In-Memory-Lösung, die bei Vercel-Serverless-
// Functions nicht zuverlässig greift, weil Instanzen nicht garantiert warm
// gehalten oder geteilt werden.
async function isRateLimited(bucketKey: string, maxCount: number, windowSeconds: number): Promise<boolean> {
  try {
    const res = await fetch(`${process.env.NOBLE_API_URL}/rate-limit-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NOBLE_API_KEY}`,
      },
      body: JSON.stringify({
        bucket_key: bucketKey,
        max_count: maxCount,
        window_seconds: windowSeconds,
      }),
      // Kurzes Timeout -- ein langsamer/ausgefallener Rate-Limit-Check darf
      // den Checkout nicht spürbar verzögern oder blockieren.
      signal: AbortSignal.timeout(2500),
    })
    if (!res.ok) return false // fail-open bei Infrastrukturfehler
    const data = await res.json()
    return data.allowed === false
  } catch (e) {
    console.error('Rate-limit check failed (fail-open):', e)
    return false // fail-open: Checkout darf nicht an einer Rate-Limit-Störung scheitern
  }
}

// Normalisiert E-Mail-Adressen wie Gmail es tut (Punkte im Local-Part
// werden ignoriert, alles nach "+" wird abgeschnitten), damit Rate-Limit
// und Verdachtspruefung nicht durch Alias-Varianten umgangen werden.
function normalizeEmail(email: string): string {
  const [local, domain] = email.toLowerCase().split('@')
  if (!domain) return email.toLowerCase()
  const isGmail = domain === 'gmail.com' || domain === 'googlemail.com'
  const localNoPlus = local.split('+')[0]
  const localNormalized = isGmail ? localNoPlus.replace(/\./g, '') : localNoPlus
  return `${localNormalized}@${domain}`
}

// Erkennt kuenstlich mit Punkten zerstueckelte Gmail-Adressen. Ein einzelner
// Punkt (z.B. "vorname.nachname@gmail.com") ist normales, haeufiges Muster
// und wird NICHT geblockt. Ab 3 Punkten im Local-Part -- wie bei allen bisher
// beobachteten Bot-Versuchen ("b.bl.an.cha.r.d6.7", "g..l.a.co.l.l.a.09") --
// gilt es als starkes Verdachtssignal.
function looksLikeDotObfuscatedGmail(email: string): boolean {
  const [local, domain] = email.toLowerCase().split('@')
  if (!domain || (domain !== 'gmail.com' && domain !== 'googlemail.com')) return false
  const dotCount = (local.match(/\./g) || []).length
  return dotCount >= 3
}

// Hochpreisige SKUs (>= 1000 EUR) bekommen erzwungenes 3D-Secure statt
// "automatic" -- reduziert die Nützlichkeit dieses Endpoints fürs
// Card-Testing, da eine nicht-3DS-fähige/gestohlene Karte häufiger schon
// am 3DS-Schritt scheitert statt eine "lebende Karte" zu bestätigen.
const HIGH_VALUE_THRESHOLD_EUR = 1000

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    if (await isRateLimited(`shop-checkout:${ip}`, 5, 3600)) {
      return NextResponse.json({ error: 'Zu viele Anfragen. Bitte später erneut versuchen.' }, { status: 429 })
    }

    // Origin/Referer-Check -- weiterhin als zusaetzliche Huerde vorhanden,
    // ist aber bei einem direkten Server-zu-Server-POST spoofbar und daher
    // NICHT die primaere Verteidigung (siehe Kommentare oben). Die
    // eigentliche Pruefung ist jetzt das Challenge-Token weiter unten.
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.pan21.com'
    const siteHost = new URL(siteUrl).host
    const rawOrigin = req.headers.get('origin') || req.headers.get('referer') || ''
    let requestHost = ''
    try {
      requestHost = rawOrigin ? new URL(rawOrigin).host : ''
    } catch {
      requestHost = ''
    }
    if (requestHost !== siteHost) {
      return NextResponse.json({ error: 'Ungültige Anfrage-Herkunft.' }, { status: 403 })
    }

    const { slug, email, affiliate_ref, token } = await req.json()
    if (!slug || !email) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // Challenge-Token -- muss von /api/checkout-token stammen, das nur die
    // echte Produktseite beim Laden aufruft. Erzwingt zusaetzlich eine
    // Mindest-Verweildauer von 3s (siehe checkout-token/route.ts).
    if (!token) {
      return NextResponse.json({ error: 'Ungültige Anfrage (fehlendes Token).' }, { status: 403 })
    }
    const tokenCheck = verifyToken(token, slug)
    if (!tokenCheck.valid) {
      console.warn('Checkout token rejected:', tokenCheck.reason)
      return NextResponse.json({ error: 'Ungültige oder abgelaufene Anfrage. Bitte Seite neu laden.' }, { status: 403 })
    }

    // Basis-E-Mail-Validierung -- fehlte bisher komplett, jeder String wurde
    // unverändert an Stripe als customer_email durchgereicht.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Ungültige E-Mail-Adresse.' }, { status: 400 })
    }

    // Punkt-verschleierte Gmail-Adresse -- starkes Bot-Signal (siehe oben).
    if (looksLikeDotObfuscatedGmail(email)) {
      console.warn('Checkout blocked: dot-obfuscated Gmail address', email)
      return NextResponse.json({ error: 'Ungültige E-Mail-Adresse.' }, { status: 400 })
    }

    // Zusaetzliches Rate-Limit pro normalisierter E-Mail -- faengt Faelle
    // ab, in denen der Bot IPs rotiert, aber (Alias-)Adressen aus einem
    // begrenzten Pool wiederverwendet.
    const normalizedEmail = normalizeEmail(email)
    if (await isRateLimited(`shop-checkout-email:${normalizedEmail}`, 3, 3600)) {
      return NextResponse.json({ error: 'Zu viele Anfragen. Bitte später erneut versuchen.' }, { status: 429 })
    }

    const product = PRODUCTS.find(p => p.slug === slug)
    if (!product || !product.price) return NextResponse.json({ error: 'Product not found' }, { status: 400 })

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) return NextResponse.json({ error: 'Payment not configured' }, { status: 500 })

    const params = new URLSearchParams({
      'payment_method_types[]': 'card',
      'line_items[0][price_data][currency]': 'eur',
      'line_items[0][price_data][unit_amount]': String(Math.round(product.price * 100)),
      'line_items[0][price_data][product_data][name]': product.name,
      'line_items[0][price_data][product_data][description]': product.shortDesc,
      'line_items[0][price_data][product_data][images][0]': product.image.startsWith('http') ? product.image : `${siteUrl}${product.image}`,
      'line_items[0][quantity]': '1',
      'mode': 'payment',
      'customer_email': email,
      'success_url': `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&product=${encodeURIComponent(product.name)}`,
      'cancel_url': `${siteUrl}/produkt/${slug}`,
      'metadata[product_slug]': slug,
      'metadata[product_name]': product.name,
      'metadata[customer_email]': email,
      'metadata[sku]': product.sku,
      'metadata[affiliate_ref]': affiliate_ref || '',
    })

    if (product.price >= HIGH_VALUE_THRESHOLD_EUR) {
      params.set('payment_method_options[card][request_three_d_secure]', 'any')
    }

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    })

    const session = await res.json()
    if (!res.ok) return NextResponse.json({ error: session.error?.message || 'Stripe error' }, { status: 500 })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
