'use client'
import { useState } from 'react'

// Nur EUROPAN ist aktuell als Zahlungswährung im Shop aktiv. Die API kann technisch
// auch N-Coin, SwissyCash und CryptoCoin — das ist aber bewusst (noch) nicht erwünscht.
// Um das später wieder zu öffnen: COINS-Array unten einfach wieder erweitern.
const COINS = [
  { id: 'europan', label: 'EUROPAN', icon: '🇪🇺' },
]

// Standard-Logik für EUROPAN-Bestellungen im gesamten PAN21-Netzwerk (siehe pan-office.de):
// 1) EUROPAN-Bonus (2%) — steht jedem verifizierten Konto zu, Kunde wählt "jetzt einsetzen"
//    oder "auf dem Noble-Konto sparen".
// 2) Doppel-Wums (zusätzlich 3%) — nur wenn der komplette (bereits um den Bonus reduzierte)
//    Betrag durch vorhandenes Guthaben gedeckt ist. Alles-oder-nichts, kein Teileinsatz.
// Layout-Vorbild: shop.europan.group ("Ihr Vorteil"-Leiste rechts, siehe Referenz-Screenshot vom 2026-08-16).
const EUROPAN_BONUS_PCT = 0.02
const DOPPELWUMS_PCT = 0.03

type BalanceWidgetProps = {
  slug: string
  price: number
  productName: string
  affiliateRef?: string
  prefillEmail?: string
  onNoblePayment?: (result: any) => void
}

const navy = '#1A2F5A'
const gold = '#C9963A'
const cream = '#F7F3ED'
const gray = '#6B7280'
const green = '#1B7A3D'
const greenBg = '#E8F5EE'
const greenBorder = '#B7E4CC'

function fmt(n: number) {
  return ')( ' + n.toFixed(2)
}

export function BalanceWidget({ slug, price, affiliateRef, onNoblePayment }: BalanceWidgetProps) {
  const [showLogin, setShowLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [balances, setBalances] = useState<Record<string, number> | null>(null)
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(false)
  const [bonusChoice, setBonusChoice] = useState<'now' | 'save'>('now')
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<any>(null)

  const selectedCoin = 'europan'

  async function checkBalance() {
    setError('')
    if (!email || !email.includes('@')) return setError('Bitte gültige Noble-E-Mail eingeben.')
    if (!/^\d{4}$/.test(pin)) return setError('Bitte 4-stellige PIN eingeben.')
    setLoading(true); setBalances(null); setVerified(false)
    try {
      const res = await fetch('/api/noble-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin }),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error || 'Fehler bei der Prüfung.'); setLoading(false); return }
      setBalances(d.balances)
      setVerified(true)
    } catch { setError('Netzwerkfehler.') }
    setLoading(false)
  }

  const balance = balances ? (balances[selectedCoin] || 0) : 0

  // Schritt 1: EUROPAN-Bonus (2%) — Vorschau gilt bereits vor Login als Kaufanreiz
  const europanBonusTotal = Math.round(price * EUROPAN_BONUS_PCT * 100) / 100
  const europanBonusApplied = bonusChoice === 'now' ? europanBonusTotal : 0
  const afterEuropanBonus = Math.max(0, price - europanBonusApplied)
  const priceAsMember = Math.max(0, price - europanBonusTotal)

  // Schritt 2: Doppel-Wums — nur wenn Guthaben den (reduzierten) Betrag komplett deckt
  const doppelWumsTotal = Math.round(price * DOPPELWUMS_PCT * 100) / 100
  const fullyCovered = verified && balance >= afterEuropanBonus
  const afterDoppelWums = Math.max(0, afterEuropanBonus - (fullyCovered ? doppelWumsTotal : 0))

  // Schritt 3: mit Guthaben bezahlter Betrag (alles oder nichts)
  const europanPaid = fullyCovered ? afterDoppelWums : 0
  const finalTotal = Math.max(0, afterDoppelWums - europanPaid)
  const totalSaved = Math.max(0, price - afterDoppelWums)

  // Restzahlungs-Vorschau (auch vor Login relevant, analog europan.group-Referenz):
  const missingForFullCoverage = verified ? Math.max(0, afterEuropanBonus - balance) : afterEuropanBonus

  async function handlePay() {
    if (!verified || !fullyCovered) return
    setPaying(true); setError('')
    try {
      const res = await fetch('/api/noble-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin, slug, coin_id: selectedCoin, affiliate_ref: affiliateRef }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Zahlung fehlgeschlagen.'); setPaying(false); return }
      setSuccess(data)
      if (onNoblePayment) onNoblePayment(data)
    } catch { setError('Netzwerkfehler.') }
    setPaying(false)
  }

  const card: React.CSSProperties = { background: '#fff', border: '1px solid #E2DDD8', borderRadius: '8px', padding: '1.5rem', fontFamily: 'Jost, system-ui, sans-serif' }
  const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.8rem', padding: '4px 0' }
  const statBox: React.CSSProperties = { border: '1px solid #E2DDD8', borderRadius: '6px', padding: '0.75rem 0.85rem', marginBottom: '0.6rem' }
  const statLabel: React.CSSProperties = { fontSize: '0.7rem', color: gray, marginBottom: '0.25rem' }
  const statValue: React.CSSProperties = { fontFamily: 'Georgia, serif', fontSize: '1.15rem', fontWeight: 700, color: navy }

  if (success) return (
    <div style={{ position: 'sticky', top: '88px' }}>
      <div style={card}>
        <h4 style={{ fontFamily: 'Georgia, serif', color: navy, fontSize: '1.05rem', marginBottom: '0.75rem' }}>Zahlung erfolgreich</h4>
        <div style={{ background: greenBg, border: `1px solid ${greenBorder}`, borderRadius: '6px', padding: '0.9rem', fontSize: '0.82rem', color: green, lineHeight: 1.7 }}>
          <div><strong>Referenz:</strong> {success.order_reference}</div>
          <div><strong>Bezahlt:</strong> {fmt(success.amount || 0)}</div>
          <div><strong>Neues Guthaben:</strong> {fmt(success.new_balance || 0)}</div>
          {totalSaved > 0.004 && <div style={{ marginTop: '6px', fontWeight: 700 }}>Sie haben heute mit EUROPAN gespart: €{totalSaved.toFixed(2)}</div>}
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ position: 'sticky', top: '88px' }}>
      <div style={card}>
        <h4 style={{ fontFamily: 'Georgia, serif', color: navy, fontSize: '1.05rem', marginBottom: '0.9rem' }}>Ihr Vorteil</h4>

        {/* Bestellwert ohne EUROPAN-Vorteil */}
        <div style={statBox}>
          <div style={statLabel}>Bestellwert ohne EUROPAN-Vorteil</div>
          <div style={statValue}>€{price.toFixed(2)}</div>
        </div>

        {/* Als angemeldeter EUROPAN-Nutzer */}
        <div style={{ ...statBox, background: cream, border: '1px solid #E2DDD8' }}>
          <div style={statLabel}>Als angemeldeter EUROPAN-Nutzer</div>
          <div style={{ ...statValue, color: gold }}>€{priceAsMember.toFixed(2)}</div>
          <div style={{ fontSize: '0.68rem', color: gold, marginTop: '2px' }}>Vorteil: {fmt(europanBonusTotal)}</div>
        </div>

        {/* Konto */}
        {!verified && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', padding: '0.6rem 0', borderTop: '1px solid #E2DDD8', borderBottom: '1px solid #E2DDD8', marginBottom: '0.75rem', fontSize: '0.75rem' }}>
            <div style={{ color: navy, fontWeight: 600 }}>Konto</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ marginBottom: '0.3rem' }}>
                <span style={{ color: gray }}>Bereits EUROPAN-Kunde? </span>
                <a onClick={() => setShowLogin(true)} style={{ color: gold, fontWeight: 700, cursor: 'pointer' }}>Mit EUROPAN anmelden</a>
              </div>
              <div>
                <span style={{ color: gray }}>Noch kein Konto? </span>
                <a href="https://noble-limited.com/join" target="_blank" rel="noopener" style={{ color: gold, fontWeight: 700 }}>Kostenloses Konto eröffnen</a>
              </div>
            </div>
          </div>
        )}

        {showLogin && !verified && (
          <div style={{ marginBottom: '0.9rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <input type="email" placeholder="Noble E-Mail" value={email} onChange={e => setEmail(e.target.value)}
                style={{ flex: 1, minWidth: 0, padding: '0.55rem 0.7rem', border: '1px solid #E2DDD8', borderRadius: '6px', fontSize: '0.8rem', fontFamily: 'inherit' }} />
              <input type="password" inputMode="numeric" maxLength={4} placeholder="PIN" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g,'').slice(0,4))}
                onKeyDown={e => e.key === 'Enter' && checkBalance()}
                style={{ width: '70px', padding: '0.55rem 0.5rem', border: '1px solid #E2DDD8', borderRadius: '6px', fontSize: '0.8rem', textAlign: 'center', fontFamily: 'inherit' }} />
            </div>
            <button onClick={checkBalance} disabled={loading}
              style={{ width: '100%', background: gold, color: '#fff', border: 'none', padding: '0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
              {loading ? 'Wird geprüft…' : 'Guthaben prüfen'}
            </button>
          </div>
        )}

        {error && <p style={{ fontSize: '0.75rem', color: '#C0392B', marginBottom: '0.75rem' }}>{error}</p>}

        {/* Doppel-Wums */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.6rem 0', borderBottom: '1px solid #E2DDD8', marginBottom: '0.6rem', fontSize: '0.75rem' }}>
          <div style={{ color: navy, fontWeight: 600 }}>Doppel-Wums</div>
          <div style={{ textAlign: 'right', maxWidth: '62%' }}>
            <div style={{ color: gold, fontWeight: 700 }}>{fmt(doppelWumsTotal)}</div>
            <div style={{ color: gray, fontSize: '0.68rem', marginTop: '2px' }}>
              zusätzlich bei Komplett-Zahlung des Bestellwerts in EUROPAN
            </div>
          </div>
        </div>

        {/* Restzahlung nötig */}
        {verified && fullyCovered ? (
          <div style={{ background: greenBg, border: `1px solid ${greenBorder}`, borderRadius: '6px', padding: '0.6rem 0.75rem', marginBottom: '0.9rem', fontSize: '0.78rem', color: green, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Für €0 {fmt(europanPaid)}</span>
            <span style={{ fontWeight: 700 }}>vollständig gedeckt</span>
          </div>
        ) : (
          <div style={{ background: cream, border: '1px solid #E2DDD8', borderRadius: '6px', padding: '0.6rem 0.75rem', marginBottom: '0.9rem', fontSize: '0.78rem', color: navy, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Für €{afterEuropanBonus.toFixed(2)} {fmt(missingForFullCoverage)}</span>
            <span style={{ fontWeight: 700 }}>Restzahlung nötig</span>
          </div>
        )}

        {/* Bonuswahl + Zahlungsdetails, sobald verifiziert */}
        {verified && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #E2DDD8', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: navy }}>Ihr aktuelles EUROPAN-Guthaben beträgt</span>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem', fontWeight: 700, color: fullyCovered ? green : gray, whiteSpace: 'nowrap' }}>{fmt(balance)}{fullyCovered && ' ✓'}</span>
            </div>

            {europanBonusTotal > 0 && (
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: gray, cursor: 'pointer', marginBottom: '2px' }}>
                  <input type="radio" name={`bonus-choice-${slug}`} checked={bonusChoice === 'now'} onChange={() => setBonusChoice('now')} style={{ accentColor: gold }} />
                  EUROPAN-Bonus jetzt für diese Bestellung einsetzen
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: gray, cursor: 'pointer' }}>
                  <input type="radio" name={`bonus-choice-${slug}`} checked={bonusChoice === 'save'} onChange={() => setBonusChoice('save')} style={{ accentColor: gold }} />
                  Auf meinem Noble-Konto sparen
                </label>
              </div>
            )}

            <div style={{ ...row, fontSize: '1rem', marginTop: '0.2rem', borderTop: '1px solid #E2DDD8', paddingTop: '0.5rem' }}>
              <span><strong style={{ color: navy }}>Gesamt</strong></span>
              <strong style={{ color: gold, fontFamily: 'Georgia, serif', fontSize: '1.2rem' }}>€{finalTotal.toFixed(2)}</strong>
            </div>

            {fullyCovered ? (
              <button onClick={handlePay} disabled={paying}
                style={{ width: '100%', background: '#0D5C33', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.75rem' }}>
                {paying ? 'Verarbeitung…' : 'Jetzt mit EUROPAN bezahlen →'}
              </button>
            ) : (
              <div style={{ background: cream, border: '1px solid #E2DDD8', borderRadius: '6px', padding: '0.7rem', textAlign: 'center', fontSize: '0.78rem', color: gray, marginTop: '0.75rem' }}>
                Guthaben deckt die Bestellung noch nicht komplett — bitte per Kreditkarte links bezahlen oder EUROPAN aufladen.
              </div>
            )}

            <p style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.7rem' }}>
              <a href="https://noble-limited.com/dashboard" target="_blank" rel="noopener" style={{ color: gold }}>Dashboard öffnen →</a>
            </p>
          </>
        )}

        {/* CTA + Erklärungen für Nicht-verifizierte Besucher, analog europan.group-Referenz */}
        {!verified && (
          <>
            <a href="https://noble-limited.com/join" target="_blank" rel="noopener"
              style={{ display: 'block', textAlign: 'center', width: '100%', background: navy, color: gold, border: 'none', padding: '0.8rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', marginBottom: '0.3rem', textDecoration: 'none' }}>
              EUROPAN-Konto erstellen und<br />passenden Betrag vorbereiten
            </a>
            <p style={{ fontSize: '0.66rem', color: gray, textAlign: 'center', marginBottom: '0.9rem' }}>
              Oben klicken: kostenloses EUROPAN-Konto eröffnen und passenden Aufladebetrag vorbereiten.
            </p>

            <div style={{ background: '#FDF2F2', border: '1px solid #F5D0D0', borderRadius: '6px', padding: '0.65rem 0.75rem', marginBottom: '0.75rem', fontSize: '0.7rem', color: '#B03A3A', lineHeight: 1.55 }}>
              <strong>Kostenloses EUROPAN-Konto:</strong> Vorteile sichern, EUROPAN durch Anmeldung, Empfehlungen und Aktionen verdienen. Ihr Guthaben ist auf EUROPAN-Partnerseiten sichtbar und nutzbar.
            </div>

            <p style={{ fontSize: '0.68rem', color: gray, lineHeight: 1.6, marginBottom: '0.4rem' }}>
              Doppel-Wums: zusätzlicher Vorteil bei vollständiger Zahlung in EUROPAN.
            </p>
            <p style={{ fontSize: '0.68rem', color: gray, lineHeight: 1.6 }}>
              Der Doppel-Wums entsteht als zusätzlicher Vorteil, wenn der komplette Bestellwert in EUROPAN gezahlt wird.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
