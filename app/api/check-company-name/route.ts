import { NextRequest, NextResponse } from 'next/server'
import { coreName, isValidCoreName, sameAsKey, searchVariant, similarKey, UK_SUFFIXES, type UkForm } from '@/lib/ukCompanyName'

export const dynamic = 'force-dynamic'

// Prueft einen Wunschnamen fuer eine UK-Gruendung gegen das Register von
// Companies House. Der Schluessel bleibt auf dem Server (COMPANIES_HOUSE_API_KEY).
const CH_API = 'https://api.company-information.service.gov.uk'
// Aufgeloeste Firmen blockieren den Namen nicht mehr
const INACTIVE = new Set(['dissolved', 'converted-closed', 'removed', 'closed'])

type Hit = { title: string; number: string; status: string }

async function chGet(path: string, key: string): Promise<any | null> {
  try {
    const res = await fetch(`${CH_API}${path}`, {
      headers: { Authorization: `Basic ${Buffer.from(`${key}:`).toString('base64')}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) { console.error('Companies House', path, res.status); return null }
    return await res.json()
  } catch (e) {
    console.error('Companies House request failed', e)
    return null
  }
}

export async function GET(req: NextRequest) {
  const key = process.env.COMPANIES_HOUSE_API_KEY
  if (!key) return NextResponse.json({ error: 'not_configured' }, { status: 500 })

  const formParam = req.nextUrl.searchParams.get('form') || 'ltd'
  const form: UkForm = formParam === 'llp' || formParam === 'plc' ? formParam : 'ltd'
  const name = coreName(req.nextUrl.searchParams.get('name') || '')
  if (!isValidCoreName(name)) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  // Wie eingegeben und als vereinfachte Variante (ohne Satzzeichen und Domain-Endung) suchen
  const variants = Array.from(new Set([name, searchVariant(name)].filter(Boolean)))
  const results = await Promise.all(variants.flatMap(v => {
    const q = encodeURIComponent(v)
    return [chGet(`/search/companies?q=${q}&items_per_page=50`, key), chGet(`/alphabetical-search/companies?q=${q}&size=20`, key)]
  }))
  if (results.every(r => !r)) return NextResponse.json({ error: 'unavailable' }, { status: 502 })

  const hits = new Map<string, Hit>()
  for (const item of results.flatMap(r => r?.items || [])) {
    const title = item.title || item.company_name
    const number = item.company_number
    if (!title || !number || hits.has(number)) continue
    hits.set(number, { title, number, status: item.company_status || '' })
  }

  const exactKey = sameAsKey(name)
  const looseKey = similarKey(name)
  const active = Array.from(hits.values()).filter(h => !INACTIVE.has(h.status))
  const taken = active.filter(h => sameAsKey(h.title) === exactKey)
  const similar = taken.length ? [] : active.filter(h => similarKey(h.title) === looseKey)
  const dissolved = Array.from(hits.values()).filter(h => INACTIVE.has(h.status) && sameAsKey(h.title) === exactKey)

  const status = taken.length ? 'taken' : similar.length ? 'similar' : 'available'
  return NextResponse.json({
    name,
    form,
    status,
    matches: (taken.length ? taken : similar).slice(0, 5),
    dissolved: dissolved.slice(0, 3),
    suffixes: UK_SUFFIXES[form],
    // Nur zur Fehlersuche: welche Namen die Suche geliefert hat (oeffentliche Registerdaten)
    ...(req.nextUrl.searchParams.get('debug') === '1' ? { variants, candidates: Array.from(hits.values()).slice(0, 30).map(h => `${h.title} (${h.status})`) } : {}),
  })
}
