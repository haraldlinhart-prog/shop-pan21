import { NextRequest, NextResponse } from 'next/server'
import { PRODUCT_HANDLERS } from '@/lib/plusActivation'

// Wird NICHT von Kunden direkt aufgerufen, sondern von den EUROPAN-Zahlrouten
// der sechs Tool-Websites, nachdem E-Mail+PIN erfolgreich gegen noble-limited.com
// verifiziert und der Betrag abgebucht wurde. Geschützt per Shared Secret,
// damit niemand sich kostenlos eine Aktivierung "erschleichen" kann.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || ''
  if (authHeader !== `Bearer ${process.env.INTERNAL_ACTIVATE_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { product, meta } = body || {}

    const handler = product && PRODUCT_HANDLERS[product]
    if (!handler) {
      return NextResponse.json({ error: 'Unbekanntes Produkt: ' + product }, { status: 400 })
    }
    if (!meta || !meta.email) {
      return NextResponse.json({ error: 'meta.email erforderlich' }, { status: 400 })
    }

    await handler.onActivate({
      meta,
      customerId: null,
      subscriptionId: null,
      paymentMethod: 'europan',
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('activate-plus error:', err)
    return NextResponse.json({ error: err.message || 'Unerwarteter Fehler' }, { status: 500 })
  }
}
