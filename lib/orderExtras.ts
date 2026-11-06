// Zusatzleistungen der UG-/GmbH-Bestellstrecke, die direkt mit der Bestellung
// bezahlt werden. Einzige Preisquelle fuer Browser, Stripe-Checkout und
// EUROPAN-Zahlung: Der Server rechnet immer selbst nach, der Browser schickt
// nur die Auswahl (Indizes der addons und die Domain-Endung).
//
// Laufende Leistungen (Webhosting, Telefon, Domain) werden mit dem ersten
// Zeitraum bezahlt: erster Monat bzw. erstes Jahr. Die Folgezeitraeume werden
// gesondert abgerechnet. Stand Harald 06.11.2026.
import { FORMATION_SLUGS, HOSTING_ADDON_START, HOSTING_DOMAIN_PRICES, PHONE_ADDON_START } from '@/lib/orderFlow'

export const ADDRESS_ADVICE_FEE = 14.9
export const HOSTING_MONTHLY = 9.9
export const PHONE_PLANS = [
  { monthly: 4.9, setup: 9.9 },
  { monthly: 24.8, setup: 9.9 },
]

export type OrderSelection = { extras?: unknown; domainTld?: unknown }
export type ExtraItem = { key: string; de: string; en: string; amount: number }

const cents = (n: number) => Math.round(n * 100) / 100

export function isFormationSlug(slug: string): boolean {
  return slug === FORMATION_SLUGS.ug || slug === FORMATION_SLUGS.gmbh
}

export function orderExtras(slug: string, selection: OrderSelection | null | undefined): ExtraItem[] {
  if (!isFormationSlug(slug) || !selection) return []
  const raw = Array.isArray(selection.extras) ? selection.extras : []
  const ids = Array.from(new Set(raw.filter((i): i is number => Number.isInteger(i) && i >= 0 && i < PHONE_ADDON_START + PHONE_PLANS.length)))
  const items: ExtraItem[] = []
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
  return items.some(i => i.key !== 'address')
}
