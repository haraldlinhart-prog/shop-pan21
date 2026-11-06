// Namenspruefung fuer UK-Gruendungen. Companies House hat keine offizielle
// "Name verfuegbar"-Abfrage, deshalb bilden wir die "same as"-Regeln nach
// (Company, LLP and Business (Names and Trading Disclosures) Regulations 2015,
// Schedule 3) und gleichen mit der Firmensuche der Companies-House-API ab.
// Eine endgueltige Freigabe gibt erst Companies House bei der Eintragung.

export type UkForm = 'ltd' | 'llp' | 'plc' | 'ieltd' | 'dac' | 'clg' | 'nz'

// Waehlbare Zusaetze je Rechtsform. Fuer die Pruefung zaehlen alle gleich,
// eingetragen wird die gewaehlte Schreibweise.
export const UK_SUFFIXES: Record<UkForm, string[]> = {
  ltd: ['Ltd', 'Ltd.', 'LTD', 'LTD.', 'Limited', 'LIMITED'],
  llp: ['LLP', 'Limited Liability Partnership'],
  plc: ['PLC', 'plc', 'Public Limited Company'],
  // Irland
  ieltd: ['Limited', 'Ltd', 'Ltd.', 'Teoranta', 'Teo.'],
  dac: ['DAC', 'Designated Activity Company', 'CGA', 'Cuideachta Ghníomhaíochta Ainmnithe'],
  clg: ['CLG', 'Company Limited by Guarantee', 'CTR', 'Cuideachta faoi Theorainn Ráthaíochta'],
  // Neuseeland: Pflichtzusatz Limited oder Tapui (Limited)
  nz: ['Limited', 'Tapui (Limited)'],
}

// Rechtsform-Zusaetze, die bei der Pruefung immer wegfallen
const LEGAL_ENDINGS = [
  'PUBLIC LIMITED COMPANY', 'LIMITED LIABILITY PARTNERSHIP', 'LIMITED PARTNERSHIP', 'COMMUNITY INTEREST COMPANY',
  'CWMNI CYFYNGEDIG CYHOEDDUS', 'PARTNERIAETH ATEBOLRWYDD CYFYNGEDIG', 'CYFYNGEDIG',
  'LIMITED', 'LTD', 'PLC', 'LLP', 'LP', 'CIC', 'CCC', 'CYF', 'CCYF', 'PAC',
  // Irland
  'DESIGNATED ACTIVITY COMPANY', 'COMPANY LIMITED BY GUARANTEE', 'CUIDEACHTA GHNIOMHAIOCHTA AINMNITHE', 'CUIDEACHTA FAOI THEORAINN RATHAIOCHTA',
  'TEORANTA', 'TEO', 'DAC', 'CLG', 'CGA', 'CTR', 'UC', 'ULC',
  // Neuseeland
  'TAPUI LIMITED', 'TAPUI',
]

// Woerter am Ende, die ebenfalls nicht unterscheiden. Ein Treffer nur ueber
// diese Woerter gilt als "zu aehnlich" (Eintragung nur mit Zustimmung der
// bestehenden Firma moeglich), nicht als "vergeben".
const SIMILAR_ENDINGS = [
  'AND COMPANY', 'AND CO', 'COMPANY', 'CO', 'GROUP', 'HOLDINGS', 'HOLDING', 'INTERNATIONAL', 'SERVICES',
  'UNITED KINGDOM', 'GREAT BRITAIN', 'UK', 'GB', 'ENGLAND', 'WALES', 'SCOTLAND', 'NORTHERN IRELAND', 'EUROPE',
]

function basic(name: string): string {
  let s = ` ${name.toUpperCase()} `
  s = s.replace(/&/g, ' AND ').replace(/\+/g, ' PLUS ').replace(/@/g, ' AT ').replace(/%/g, ' PERCENT ')
    .replace(/£/g, ' POUND ').replace(/\$/g, ' DOLLAR ').replace(/€/g, ' EURO ')
  s = s.replace(/\bWWW\./g, ' ').replace(/\.(CO\.UK|COM|NET|ORG|UK|EU|DE)\b/g, ' ')
  s = s.replace(/[^A-Z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()
  s = s.replace(/^THE /, '')
  return s
}

function stripEndings(s: string, endings: string[]): string {
  let changed = true
  while (changed) {
    changed = false
    for (const e of endings) {
      if (s === e) continue
      if (s.endsWith(` ${e}`)) { s = s.slice(0, -(e.length + 1)).trim(); changed = true }
    }
  }
  return s
}

// Zweite Suchvariante fuer die Companies-House-Suche: ohne Satzzeichen und
// Domain-Endungen, weil die Suche z. B. "PAN21.COM" sonst nicht findet
export function searchVariant(name: string): string {
  return stripEndings(basic(name), LEGAL_ENDINGS)
}

// Vergleichsschluessel: ohne Rechtsform-Zusatz, ohne Leerzeichen
export function sameAsKey(name: string): string {
  return stripEndings(basic(name), LEGAL_ENDINGS).replace(/ /g, '')
}

// Lockerer Schluessel: zusaetzlich ohne Woerter wie Group, Holdings, UK
export function similarKey(name: string): string {
  return stripEndings(stripEndings(basic(name), LEGAL_ENDINGS), SIMILAR_ENDINGS).replace(/ /g, '')
}

// Den Kernnamen ohne eingegebenen Rechtsform-Zusatz, so wie der Kunde ihn schreibt
export function coreName(input: string): string {
  let s = input.replace(/\s+/g, ' ').trim()
  const re = /[\s,]+(public limited company|limited liability partnership|designated activity company|company limited by guarantee|tapui \(limited\)|tapui|limited|ltd\.?|plc|llp|teoranta|teo\.?|dac|clg)\s*$/i
  while (re.test(s)) s = s.replace(re, '').trim()
  return s
}

export function isValidCoreName(name: string): boolean {
  // Companies House erlaubt Buchstaben, Ziffern und gaengige Satzzeichen, max. 160 Zeichen inkl. Zusatz
  return name.length >= 2 && name.length <= 140 && /^[A-Za-z0-9 &@£$€%+.,'’()\-!?"/:;=#*[\]]+$/.test(name) && /[A-Za-z0-9]/.test(name)
}
