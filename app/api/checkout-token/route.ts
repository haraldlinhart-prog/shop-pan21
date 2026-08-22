import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Ersetzt/ergaenzt den reinen Origin/Referer-Check im Checkout-Endpoint.
// Ein Origin-Header ist bei einem direkten Server-zu-Server-POST (kein
// echter Browser) frei waehlbar -- ein Bot kann "Origin: https://shop.pan21.com"
// einfach mitschicken und den bisherigen Schutz umgehen (beobachtet 22.08.26,
// Session ging trotz Origin-Fix durch).
//
// Dieses Token wird stattdessen nur ausgegeben, wenn die Produktseite selbst
// diesen Endpoint aufruft (beim Laden der Seite). Es ist an das Produkt
// gebunden, signiert (HMAC, faelschungssicher ohne Server-Secret) und nur
// fuer ein kurzes Zeitfenster gueltig. Der Checkout-Endpoint verlangt jetzt
// dieses Token UND erzwingt serverseitig eine Mindest-Verweildauer von 3s
// zwischen Token-Ausgabe und Checkout-Versuch (Standard-Anti-Bot-Muster,
// das im PAN21-Netzwerk bereits bei allen Kontaktformularen genutzt wird).
//
// Wichtig: das ist kein vollstaendiger Bot-Schutz (ein ausreichend
// angepasster Bot kann auch diesen Endpoint zuerst aufrufen), aber es
// erzwingt einen zusaetzlichen Request + eine Mindestwartezeit pro Versuch,
// was die Kosten fuer automatisiertes Card-Testing spuerbar erhoeht. Die
// eigentliche, zuverlaessige Verteidigung gegen Card-Testing ist Stripe
// Radar (siehe dortige "Block if card testing is likely"-Regel).
function getSecret(): string {
  return (
    process.env.CHECKOUT_TOKEN_SECRET ||
    process.env.NOBLE_API_KEY ||
    process.env.STRIPE_SECRET_KEY ||
    'fallback-secret-should-not-be-used-in-prod'
  )
}

export function issueToken(slug: string): string {
  const iat = Date.now()
  const payload = `${slug}.${iat}`
  const sig = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex')
  return Buffer.from(`${payload}.${sig}`).toString('base64url')
}

export function verifyToken(token: string, slug: string): { valid: boolean; reason?: string } {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    const parts = decoded.split('.')
    if (parts.length !== 3) return { valid: false, reason: 'malformed' }
    const [tokenSlug, iatStr, sig] = parts
    const iat = Number(iatStr)
    if (!Number.isFinite(iat)) return { valid: false, reason: 'bad-timestamp' }

    const expectedSig = crypto.createHmac('sha256', getSecret()).update(`${tokenSlug}.${iatStr}`).digest('hex')
    const sigBuf = Buffer.from(sig)
    const expectedBuf = Buffer.from(expectedSig)
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return { valid: false, reason: 'bad-signature' }
    }
    if (tokenSlug !== slug) return { valid: false, reason: 'slug-mismatch' }

    const age = Date.now() - iat
    if (age < 3000) return { valid: false, reason: 'too-fast' } // Mindest-Verweildauer 3s
    if (age > 15 * 60 * 1000) return { valid: false, reason: 'expired' } // max. 15 Min. gueltig

    return { valid: true }
  } catch {
    return { valid: false, reason: 'malformed' }
  }
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
  return NextResponse.json({ token: issueToken(slug) })
}
