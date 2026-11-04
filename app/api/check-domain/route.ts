import { NextRequest, NextResponse } from 'next/server'
import { HOSTING_DOMAIN_TLDS, HOSTING_URL, cleanDomainName, isValidDomainName } from '@/lib/orderFlow'

export const dynamic = 'force-dynamic'

// Fragt je Endung den Domain-Check von 1euro-hosting.de ab. Der Browser darf dort nicht direkt anfragen.
export async function GET(req: NextRequest) {
  const name = cleanDomainName(req.nextUrl.searchParams.get('name') || '')
  if (!isValidDomainName(name)) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  const results = await Promise.all(HOSTING_DOMAIN_TLDS.map(async tld => {
    try {
      const res = await fetch(`${HOSTING_URL}/api/check-domain?domain=${encodeURIComponent(`${name}.${tld}`)}`, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
      const data = await res.json()
      if (!res.ok) return { tld, available: null, price: null }
      return { tld, available: Boolean(data.available), price: typeof data.price === 'number' ? data.price : null }
    } catch {
      return { tld, available: null, price: null }
    }
  }))
  return NextResponse.json({ name, results })
}
