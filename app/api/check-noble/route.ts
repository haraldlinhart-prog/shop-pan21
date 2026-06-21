import { NextRequest, NextResponse } from 'next/server'

// GET /api/check-noble?email=... 
// Returns whether email exists as Noble account + all balances if yes
// Called silently when user types email in Stripe form
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email || !email.includes('@') || !email.includes('.')) {
    return NextResponse.json({ exists: false })
  }

  const nobleUrl = process.env.NOBLE_API_URL || 'https://noble-limited.com'
  const nobleKey = process.env.NOBLE_API_KEY

  if (!nobleKey) return NextResponse.json({ exists: false })

  try {
    const res = await fetch(
      `${nobleUrl}/api/v1/balance-by-email?email=${encodeURIComponent(email.toLowerCase())}`,
      { headers: { 'Authorization': `Bearer ${nobleKey}` } }
    )

    if (!res.ok) return NextResponse.json({ exists: false })

    const data = await res.json()
    return NextResponse.json({
      exists: true,
      email: data.email,
      full_name: data.full_name,
      balances: {
        europan:    data.balances?.europan    || 0,
        n_coin:     data.balances?.n_coin     || 0,
        swissycash: data.balances?.swissycash || 0,
        cryptocoin: data.balances?.cryptocoin || 0,
      }
    })
  } catch {
    return NextResponse.json({ exists: false })
  }
}
