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

// Irland: Companies Registration Office (CRO Open Services). Zugang per E-Mail und
// API-Schluessel (CRO_API_EMAIL, CRO_API_KEY). Ohne Zugang meldet die Pruefung
// "not_configured" und die Bestellstrecke laesst weitermachen.
const CRO_API = 'https://services.cro.ie/cws/companies'
// Status-Texte des CRO, die einen Namen nicht mehr blockieren
const IE_INACTIVE = /dissolved|struck|liquidated|deregistered|closed/i

async function croSearch(q: string, email: string, key: string): Promise<any[] | null> {
  try {
    const res = await fetch(`${CRO_API}?company_name=${encodeURIComponent(q)}&format=json`, {
      headers: { Authorization: `Basic ${Buffer.from(`${email}:${key}`).toString('base64')}`, 'Content-Type': 'application/json;charset=UTF-8' },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) { console.error('CRO', res.status); return null }
    const data = await res.json()
    return Array.isArray(data) ? data : Array.isArray(data?.companies) ? data.companies : []
  } catch (e) {
    console.error('CRO request failed', e)
    return null
  }
}

async function checkIreland(req: NextRequest) {
  const email = process.env.CRO_API_EMAIL, key = process.env.CRO_API_KEY
  if (!email || !key) return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  const formParam = req.nextUrl.searchParams.get('form') || 'ieltd'
  const form: UkForm = formParam === 'dac' || formParam === 'clg' ? formParam : 'ieltd'
  const name = coreName(req.nextUrl.searchParams.get('name') || '')
  if (!isValidCoreName(name)) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const variants = Array.from(new Set([name, searchVariant(name)].filter(Boolean)))
  const results = await Promise.all(variants.map(v => croSearch(v, email, key)))
  if (results.every(r => !r)) return NextResponse.json({ error: 'unavailable' }, { status: 502 })
  const hits = new Map<string, Hit>()
  for (const item of results.flatMap(r => r || [])) {
    const title = item.company_name || item.companyName
    const number = String(item.company_num ?? item.companyNum ?? '')
    if (!title || !number || hits.has(number)) continue
    hits.set(number, { title, number, status: String(item.company_status_desc || item.comp_status_desc || item.company_status || '') })
  }
  const exactKey = sameAsKey(name), looseKey = similarKey(name)
  const all = Array.from(hits.values())
  const active = all.filter(h => !IE_INACTIVE.test(h.status))
  const taken = active.filter(h => sameAsKey(h.title) === exactKey)
  const similar = taken.length ? [] : active.filter(h => similarKey(h.title) === looseKey)
  const dissolved = all.filter(h => IE_INACTIVE.test(h.status) && sameAsKey(h.title) === exactKey)
  return NextResponse.json({
    name, form,
    status: taken.length ? 'taken' : similar.length ? 'similar' : 'available',
    matches: (taken.length ? taken : similar).slice(0, 5),
    dissolved: dissolved.slice(0, 3),
    suffixes: UK_SUFFIXES[form],
  })
}

// Neuseeland: NZBN-API des Business.govt.nz-Portals (Abo-Schluessel NZ_API_KEY).
// Ohne Schluessel meldet die Pruefung "not_configured" und die Bestellstrecke laesst weitermachen.
const NZ_API = 'https://api.business.govt.nz/gateway/nzbn/v5/entities'
const NZ_INACTIVE = /removed|closed|struck|dissolved|liquidat|inactive/i

async function nzSearch(q: string, key: string): Promise<any[] | null> {
  try {
    const res = await fetch(`${NZ_API}?search-term=${encodeURIComponent(q)}&page-size=50`, {
      headers: { 'Ocp-Apim-Subscription-Key': key, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) { console.error('NZBN', res.status); return null }
    const data = await res.json()
    return Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []
  } catch (e) {
    console.error('NZBN request failed', e)
    return null
  }
}

async function checkNewZealand(req: NextRequest) {
  const key = process.env.NZ_API_KEY
  if (!key) return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  const name = coreName(req.nextUrl.searchParams.get('name') || '')
  if (!isValidCoreName(name)) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const variants = Array.from(new Set([name, searchVariant(name)].filter(Boolean)))
  const results = await Promise.all(variants.map(v => nzSearch(v, key)))
  if (results.every(r => !r)) return NextResponse.json({ error: 'unavailable' }, { status: 502 })
  const hits = new Map<string, Hit>()
  for (const item of results.flatMap(r => r || [])) {
    const title = item.entityName || item.entity_name
    const number = String(item.nzbn ?? item.sourceRegisterUniqueIdentifier ?? '')
    if (!title || !number || hits.has(number)) continue
    hits.set(number, { title, number, status: String(item.entityStatusDescription || item.entityStatusCode || '') })
  }
  const exactKey = sameAsKey(name), looseKey = similarKey(name)
  const all = Array.from(hits.values())
  const active = all.filter(h => !NZ_INACTIVE.test(h.status))
  const taken = active.filter(h => sameAsKey(h.title) === exactKey)
  const similar = taken.length ? [] : active.filter(h => similarKey(h.title) === looseKey)
  const dissolved = all.filter(h => NZ_INACTIVE.test(h.status) && sameAsKey(h.title) === exactKey)
  return NextResponse.json({
    name, form: 'nz',
    status: taken.length ? 'taken' : similar.length ? 'similar' : 'available',
    matches: (taken.length ? taken : similar).slice(0, 5),
    dissolved: dissolved.slice(0, 3),
    suffixes: UK_SUFFIXES.nz,
  })
}

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('country') === 'nz') return checkNewZealand(req)
  if (req.nextUrl.searchParams.get('country') === 'ie') return checkIreland(req)
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
