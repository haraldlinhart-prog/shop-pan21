// Zusatzleistungen der UG-/GmbH-Bestellstrecke, die direkt mit der Bestellung
// bezahlt werden. Einzige Preisquelle fuer Browser, Stripe-Checkout und
// EUROPAN-Zahlung: Der Server rechnet immer selbst nach, der Browser schickt
// nur die Auswahl (Indizes der addons und die Domain-Endung).
//
// Laufende Leistungen (Webhosting, Telefon, Domain) werden mit dem ersten
// Zeitraum bezahlt: erster Monat bzw. erstes Jahr. Die Folgezeitraeume werden
// gesondert abgerechnet. Stand Harald 06.11.2026.
import { FORMATION_SLUGS, HOSTING_ADDON_START, HOSTING_DOMAIN_PRICES, PHONE_ADDON_START, UK_SLUGS, isUkSlug } from '@/lib/orderFlow'

export const ADDRESS_ADVICE_FEE = 14.9
// Amerikanische Series LLC als (alleiniger) Gesellschafter, Gruendung einmalig. Stand Harald 06.11.2026.
export const SERIES_LLC_FEE = 49
export const HOSTING_MONTHLY = 9.9
export const PHONE_PLANS = [
  { monthly: 4.9, setup: 9.9 },
  { monthly: 24.8, setup: 9.9 },
]

export type OrderSelection = { extras?: unknown; domainTld?: unknown; seriesLlc?: unknown; ukExtras?: unknown }

// UK-Zusatzleistungen, erstes Jahr bzw. erster Monat mit der Bestellung. Stand Harald 06.11.2026.
export const UK_EXTRA_PRICES = { office: 89, service: 59, secretary: 490 }
export const UK_EXTRA_KEYS = ['office', 'service', 'secretary', 'hosting', 'phone0', 'phone1'] as const
export type UkExtraKey = typeof UK_EXTRA_KEYS[number]
export type ExtraItem = { key: string; de: string; en: string; amount: number }

const cents = (n: number) => Math.round(n * 100) / 100

export function isFormationSlug(slug: string): boolean {
  return slug === FORMATION_SLUGS.ug || slug === FORMATION_SLUGS.gmbh
}

function ukOrderExtras(slug: string, selection: OrderSelection): ExtraItem[] {
  const raw = Array.isArray(selection.ukExtras) ? selection.ukExtras : []
  const keys = new Set(raw.filter((k): k is UkExtraKey => (UK_EXTRA_KEYS as readonly string[]).includes(k as string)))
  const items: ExtraItem[] = []
  if (keys.has('office')) items.push({ key: 'office', de: 'Registered Office in London, 12 Monate', en: 'Registered office in London, 12 months', amount: UK_EXTRA_PRICES.office })
  if (keys.has('service')) items.push({ key: 'service', de: 'Service Address für Directors, 12 Monate', en: 'Service address for directors, 12 months', amount: UK_EXTRA_PRICES.service })
  // Company Secretary nur bei der PLC
  if (keys.has('secretary') && slug === UK_SLUGS.plc) items.push({ key: 'secretary', de: 'Company Secretary, erstes Jahr', en: 'Company secretary, first year', amount: UK_EXTRA_PRICES.secretary })
  if (keys.has('hosting')) items.push({ key: 'hosting', de: 'Webhosting Paket Pro, erster Monat', en: 'Pro web hosting package, first month', amount: HOSTING_MONTHLY })
  const tld = typeof selection.domainTld === 'string' ? selection.domainTld : ''
  if (keys.has('hosting') && tld && HOSTING_DOMAIN_PRICES[tld] !== undefined) items.push({ key: 'domain', de: `Domain .${tld}, erstes Jahr`, en: `Domain .${tld}, first year`, amount: HOSTING_DOMAIN_PRICES[tld] })
  const phone = keys.has('phone0') ? 0 : keys.has('phone1') ? 1 : -1
  if (phone >= 0) {
    const plan = PHONE_PLANS[phone]
    const name = phone === 0 ? ['Telefonanlage Standard', 'Standard phone system'] : ['Telefonzentrale mit KI', 'Phone exchange with AI']
    items.push({ key: 'phone', de: `${name[0]}, erster Monat und Einrichtung`, en: `${name[1]}, first month and setup`, amount: cents(plan.monthly + plan.setup) })
  }
  return items
}

export function orderExtras(slug: string, selection: OrderSelection | null | undefined): ExtraItem[] {
  if (selection && isUkSlug(slug)) return ukOrderExtras(slug, selection)
  if (!isFormationSlug(slug) || !selection) return []
  const raw = Array.isArray(selection.extras) ? selection.extras : []
  const ids = Array.from(new Set(raw.filter((i): i is number => Number.isInteger(i) && i >= 0 && i < PHONE_ADDON_START + PHONE_PLANS.length)))
  const items: ExtraItem[] = []
  if (selection.seriesLlc === true) items.push({ key: 'series', de: 'Amerikanische Series LLC als Gesellschafter (einmalig)', en: 'US Series LLC as shareholder (one-time)', amount: SERIES_LLC_FEE })
  if (ids.includes(0)) items.push({ key: 'address', de: 'Beratung zur Geschäftsadresse (einmalig)', en: 'Advice on the business address (one-time)', amount: ADDRESS_ADVICE_FEE })
  const hosting = ids.includes(HOSTING_ADDON_START)
  if (hosting) items.push({ key: 'hosting', de: 'Webhosting Paket Pro, erster Monat', en: 'Pro web hosting package, first month', amount: HOSTING_MONTHLY })
  const tld = typeof selection.domainTld === 'string' ? selection.domainTld : ''
  if (hosting && tld && HOSTING_DOMAIN_PRICES[tld] !== undefined) items.push({ key: 'domain', de: `Domain .${tld}, erstes Jahr`, en: `Domain .${tld}, first year`, amount: HOSTING_DOMAIN_PRICES[tld] })
  // Nur eine Telefon-Variante: die erste gewaehlte zaehlt
  const phone = ids.filter(i => i >= PHONE_ADDON_START).sort((a, b) => a - b)[0]
  if (phone !== undefined) {
    const plan = PHONE_PLANS[phone - PHONE_ADDON_START]
    const name = phone === PHONE_ADDON_START ? ['Telefonanlage Standard', 'Standard phone system'] : ['Telefonzentrale mit KI', 'Phone exchange with AI']
    items.push({ key: 'phone', de: `${name[0]}, erster Monat und Einrichtung`, en: `${name[1]}, first month and setup`, amount: cents(plan.monthly + plan.setup) })
  }
  return items
}

export function extrasTotal(items: ExtraItem[]): number {
  return cents(items.reduce((sum, i) => sum + i.amount, 0))
}

// Gibt es Leistungen, die nach dem ersten Zeitraum weiterlaufen?
export function hasRecurring(items: ExtraItem[]): boolean {
  return items.some(i => ['hosting', 'domain', 'phone', 'office', 'service', 'secretary'].includes(i.key))
}
