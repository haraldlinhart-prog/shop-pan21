// Kundendaten aus der Bestellstrecke. Sie laufen als Stripe-Metadaten mit
// (Stripe erlaubt je Wert max. 500 Zeichen) und landen so in der Bestellmail
// an bestellungen@pan21.com. Eine eigene Datenbank ist dafuer nicht noetig.
const FIELDS: [string, string][] = [
  ['firstName', 'Vorname'],
  ['lastName', 'Nachname'],
  ['contactEmail', 'E-Mail'],
  ['phone', 'Telefon'],
  ['company', 'Firma (Rechnung)'],
  ['street', 'Straße und Hausnummer'],
  ['postalCode', 'Postleitzahl'],
  ['city', 'Ort'],
  ['country', 'Land'],
  ['desiredName', 'Wunsch-Firmenname'],
  ['extras', 'Gewünschte Zusatzleistungen'],
]

export type OrderCustomer = Record<string, string>

export function sanitizeCustomer(input: unknown): OrderCustomer {
  const out: OrderCustomer = {}
  if (!input || typeof input !== 'object') return out
  for (const [key] of FIELDS) {
    const value = (input as Record<string, unknown>)[key]
    if (typeof value === 'string' && value.trim()) out[key] = value.trim().slice(0, 450)
  }
  return out
}

export function customerToMetadata(customer: OrderCustomer): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(customer)) out[`metadata[c_${key}]`] = value
  return out
}

export function customerFromMetadata(metadata: Record<string, string> | null | undefined): OrderCustomer {
  const out: OrderCustomer = {}
  if (!metadata) return out
  for (const [key] of FIELDS) {
    const value = metadata[`c_${key}`]
    if (value) out[key] = value
  }
  return out
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}

export function customerHtml(customer: OrderCustomer): string {
  const rows = FIELDS.filter(([key]) => customer[key]).map(([key, label]) => `<strong>${label}:</strong> ${escapeHtml(customer[key])}`)
  return rows.length ? `<p>${rows.join('<br>')}</p>` : ''
}
