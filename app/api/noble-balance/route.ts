import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

  const nobleUrl = process.env.NOBLE_API_URL || 'https://noble-limited.com'
  const nobleKey = process.env.NOBLE_API_KEY

  if (!nobleKey) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  try {
    const res = await fetch(
      `${nobleUrl}/api/v1/balance-by-email?email=${encodeURIComponent(email)}`,
      { headers: { 'Authorization': `Bearer ${nobleKey}` } }
    )
    if (!res.ok) {
      const err = await res.json()
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
