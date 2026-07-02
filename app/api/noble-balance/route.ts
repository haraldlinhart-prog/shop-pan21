import { NextRequest, NextResponse } from 'next/server'

// POST /api/noble-balance
// Body: { email, pin, coin_id? }
// Verifies E-Mail+PIN against noble-limited.com (www — apex 308-redirects and strips
// the Authorization header on redirect) and returns the real balance(s).
export async function POST(req: NextRequest) {
  const { email, pin, coin_id } = await req.json().catch(() => ({}))
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })
  if (!pin || !/^\d{4}$/.test(pin)) return NextResponse.json({ error: 'PIN (4-stellig) erforderlich' }, { status: 400 })

  const nobleUrl = (process.env.NOBLE_API_URL || 'https://www.noble-limited.com').replace(/^https:\/\/noble-limited\.com/, 'https://www.noble-limited.com')
  const nobleKey = process.env.NOBLE_API_KEY

  if (!nobleKey) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  try {
    const res = await fetch(`${nobleUrl}/api/v1/balance-by-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${nobleKey}` },
      body: JSON.stringify({ email: email.toLowerCase(), pin, coin_id }),
    })

    if (res.status === 404) return NextResponse.json({ error: 'Kein Noble-Konto für diese E-Mail gefunden.' }, { status: 404 })
    if (res.status === 401) return NextResponse.json({ error: 'Falsche PIN.' }, { status: 401 })
    if (res.status === 429) return NextResponse.json({ error: 'Zu viele falsche Versuche — bitte später erneut versuchen.' }, { status: 429 })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json({ error: err.error || 'Noble API error' }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json({
      email: data.email,
      full_name: data.full_name,
      balances: {
        europan:    data.balances?.europan    || 0,
        n_coin:     data.balances?.n_coin     || 0,
        swissycash: data.balances?.swissycash || 0,
        cryptocoin: data.balances?.cryptocoin || 0,
      },
      timestamp: data.timestamp,
    })
  } catch {
    return NextResponse.json({ error: 'Noble API unreachable' }, { status: 503 })
  }
}
