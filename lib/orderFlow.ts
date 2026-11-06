// Welche Produkte die gefuehrte Bestellstrecke nutzen. Alle anderen Produkte
// behalten vorerst die bisherige Produktseite.
export const FORMATION_SLUGS = { ug: 'deutsche-ug-gruendung', gmbh: 'deutsche-gmbh-gruendung' } as const
export const TRUST_SLUG = 'deutsche-treuhand-mandatsadministration'
// Ab dieser Stelle gehoeren die Zusatzleistungen (addons) von UG und GmbH zur Gruppe Webhosting
export const HOSTING_ADDON_START = 1
// Ab dieser Stelle die Telefon-Varianten von telefon-zentrale.com; es ist nur eine davon waehlbar
export const PHONE_ADDON_START = 2
// Domain-Preise pro Jahr wie auf 1euro-hosting.de (lib/tldPricing.ts dort); die Pruefung liefert den aktuellen Preis
export const HOSTING_URL = 'https://1euro-hosting.de'
export const HOSTING_DOMAIN_PRICES: Record<string, number> = { de: 5.9, eu: 11.9, com: 14.9, org: 15.9, net: 19.9 }
export const HOSTING_DOMAIN_TLDS = Object.keys(HOSTING_DOMAIN_PRICES)
export function cleanDomainName(value: string): string {
  return value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].replace(/\.(de|eu|com|org|net)$/, '')
}
export function isValidDomainName(name: string): boolean {
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(name)
}

export type LegalForm = keyof typeof FORMATION_SLUGS

// UK-Gruendung: eine Strecke, vier Rechtsformen mit je eigenem Produkt (Preis, Checkout)
export const UK_SLUGS = {
  shares: 'englische-limited-gruenden',
  guarantee: 'uk-limited-by-guarantee-gruenden',
  llp: 'uk-llp-gruenden',
  plc: 'uk-plc-gruenden',
} as const
export type UkFormKey = keyof typeof UK_SLUGS
export function isUkSlug(slug: string): boolean {
  return (Object.values(UK_SLUGS) as string[]).includes(slug)
}
export function ukFormOf(slug: string): UkFormKey {
  return (Object.keys(UK_SLUGS) as UkFormKey[]).find(k => UK_SLUGS[k] === slug) || 'shares'
}
// Nominee UK, Stand Harald 06.11.2026: Director mit Wohnsitz in Grossbritannien,
// eroeffnet Bankkonten und haftet mit seinem Namen. Abrechnung gesondert nach Vorpruefung.
export const UK_NOMINEE_MONTHLY = { director: 245, shareholder: 95 }
export const UK_ACCOUNT_FEE = 550

// US-LLC: eine Strecke, je Bundesstaat ein Produkt (Preis inkl. State Fee und Registered Agent 12 Monate)
export const US_SLUGS = {
  wy: 'amerikanische-llc-gruenden',
  de: 'us-llc-delaware-gruenden',
  nm: 'us-llc-new-mexico-gruenden',
  fl: 'us-llc-florida-gruenden',
} as const
export type UsStateKey = keyof typeof US_SLUGS
export function isUsSlug(slug: string): boolean {
  return (Object.values(US_SLUGS) as string[]).includes(slug)
}
export function usStateOf(slug: string): UsStateKey {
  return (Object.keys(US_SLUGS) as UsStateKey[]).find(k => US_SLUGS[k] === slug) || 'wy'
}
// Nominee USA wie im Produkt "Internationale Nominee- und Treuhandadministration"
export const US_NOMINEE_MONTHLY = { manager: 145, member: 42 }
export const US_ACCOUNT_FEE = 550

// Hong Kong Limited: ein Paket inkl. Behoerdengebuehren, Secretary und Registered Office 12 Monate
export const HK_SLUG = 'hong-kong-limited-gruenden'
// Nominee Hong Kong wie im Produkt "Internationale Nominee- und Treuhandadministration"
export const HK_NOMINEE_MONTHLY = { director: 145, shareholder: 42 }
export const HK_ACCOUNT_FEE = 550

// Irland: eine Strecke, drei Rechtsformen mit je eigenem Produkt
export const IE_SLUGS = {
  ltd: 'irische-limited-gruenden',
  dac: 'irland-dac-gruenden',
  clg: 'irland-clg-gruenden',
} as const
export type IeFormKey = keyof typeof IE_SLUGS
export function isIeSlug(slug: string): boolean {
  return (Object.values(IE_SLUGS) as string[]).includes(slug)
}
export function ieFormOf(slug: string): IeFormKey {
  return (Object.keys(IE_SLUGS) as IeFormKey[]).find(k => IE_SLUGS[k] === slug) || 'ltd'
}
// Nominee Irland: Director mit Wohnsitz im EWR (ersetzt den Section-137-Bond). Stand Harald 06.11.2026.
export const IE_NOMINEE_MONTHLY = { director: 245, shareholder: 95 }
export const IE_ACCOUNT_FEE = 550

// Neuseeland: ein Paket inkl. Behoerdengebuehren, Registered Office und Address for Service 12 Monate
export const NZ_SLUG = 'neuseelaendische-limited-gruenden'
// Resident Director in Neuseeland (Pflicht) und Nominee Shareholder. Stand Harald 06.11.2026.
export const NZ_NOMINEE_MONTHLY = { director: 245, shareholder: 95 }
export const NZ_ACCOUNT_FEE = 550

// Australien: ein Paket inkl. ASIC-Gebuehr und Registered Office 12 Monate
export const AU_SLUG = 'australische-pty-ltd-gruenden'
// Resident Director in Australien (Pflicht) und Nominee Shareholder. Stand Harald 06.11.2026.
export const AU_NOMINEE_MONTHLY = { director: 245, shareholder: 95 }
export const AU_ACCOUNT_FEE = 550

// Nevis LLC: ein Paket inkl. Regierungsgebuehr und Registered Agent 12 Monate, nur nach Due Diligence
export const NEVIS_SLUG = 'nevis-llc-gruenden'
// Nominee Manager/Member Nevis. Stand Harald 06.11.2026.
export const NEVIS_NOMINEE_MONTHLY = { manager: 245, member: 95 }
export const NEVIS_ACCOUNT_FEE = 550

// Belize LLC: gleiche Strecke wie Nevis (Due Diligence), eigenes Produkt
export const BELIZE_SLUG = 'belize-llc-gruenden'

export function hasOrderFlow(slug: string): boolean {
  return slug === FORMATION_SLUGS.ug || slug === FORMATION_SLUGS.gmbh || slug === TRUST_SLUG || isUkSlug(slug) || isUsSlug(slug) || slug === HK_SLUG || isIeSlug(slug) || slug === NZ_SLUG || slug === AU_SLUG || slug === NEVIS_SLUG || slug === BELIZE_SLUG
}

// Treuhand Deutschland, Stand Harald 04.11.2026. Keine Paketpreise: Wer beide
// Rollen bucht, zahlt beide Preise. Muss mit den Texten in lib/products.ts
// uebereinstimmen, dort stehen dieselben Betraege als Fliesstext.
export const TRUST_MONTHLY = { managingDirector: 285, shareholder: 155 }
export const TRUST_ACCOUNT_FEE = { digital: 350, branch: 550 }
// Bei jaehrlicher Zahlung ist ein Monat kostenlos: 12 Monate zum Preis von 11.
export const TRUST_PAID_MONTHS_PER_YEAR = 11

// Sobald AGB und Widerrufsbelehrung vorliegen, hier die Adressen eintragen.
// Dann erscheint im letzten Schritt automatisch das Pflicht-Haekchen.
export const LEGAL_LINKS: { terms: string | null; withdrawal: string | null } = { terms: null, withdrawal: null }
