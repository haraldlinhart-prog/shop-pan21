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

export function BalanceWidget({ slug, price, affiliateRef, onNoblePayment }: BalanceWidgetProps) {
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

  // Schritt 1: EUROPAN-Bonus
  const europanBonusTotal = Math.round(price * EUROPAN_BONUS_PCT * 100) / 100
  const europanBonusApplied = bonusChoice === 'now' ? europanBonusTotal : 0
  const afterEuropanBonus = Math.max(0, price - europanBonusApplied)

  // Schritt 2: Doppel-Wums — nur wenn Guthaben den (reduzierten) Betrag komplett deckt
  const fullyCovered = verified && balance >= afterEuropanBonus
  const doppelWumsTotal = fullyCovered ? Math.round(price * DOPPELWUMS_PCT * 100) / 100 : 0
  const afterDoppelWums = Math.max(0, afterEuropanBonus - doppelWumsTotal)

  // Schritt 3: mit Guthaben bezahlter Betrag (alles oder nichts)
  const europanPaid = fullyCovered ? afterDoppelWums : 0
  const finalTotal = Math.max(0, afterDoppelWums - europanPaid)
  const totalSaved = Math.max(0, price - afterDoppelWums)

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

  if (success) return (
    <div style={{ position: 'sticky', top: '88px' }}>
      <div style={card}>
        <h4 style={{ fontFamily: 'Georgia, serif', color: navy, fontSize: '1.05rem', marginBottom: '0.75rem' }}>Zahlung erfolgreich</h4>
        <div style={{ background: '#E8F5EE', border: '1px solid #B7E4CC', borderRadius: '6px', padding: '0.9rem', fontSize: '0.82rem', color: '#1B7A3D', lineHeight: 1.7 }}>
          <div><strong>Referenz:</strong> {success.order_reference}</div>
          <div><strong>Bezahlt:</strong> {success.amount?.toFixed(2)} EUROPAN</div>
          <div><strong>Neues Guthaben:</strong> {success.new_balance?.toFixed(2)} EUROPAN</div>
          {totalSaved > 0.004 && <div style={{ marginTop: '6px', fontWeight: 700 }}>Sie haben heute mit EUROPAN gespart: €{totalSaved.toFixed(2)}</div>}
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ position: 'sticky', top: '88px' }}>
      <div style={card}>
        {/* Status-Badge wie auf pan-office.de */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', background: cream, border: '1px solid #E2DDD8', borderRadius: '6px', padding: '0.5rem 0.7rem', marginBottom: '0.4rem', fontSize: '0.7rem', fontWeight: 600, color: navy }}>
          <span>EUROPAN-optimiert</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.5rem', borderRadius: '100px', background: '#E5F6EC', color: '#1B7A3D', fontSize: '0.68rem' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1B7A3D', display: 'inline-block' }} />
            {verified ? 'Aktiv' : 'Bereit – anmelden'}
          </span>
        </div>
        {verified && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', background: cream, border: '1px solid #E2DDD8', borderRadius: '6px', padding: '0.5rem 0.7rem', marginBottom: '1rem', fontSize: '0.7rem', fontWeight: 600, color: navy }}>
            <span>Doppel-Wums</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.5rem', borderRadius: '100px', background: fullyCovered ? '#E5F6EC' : '#FDE8E8', color: fullyCovered ? '#1B7A3D' : '#C0392B', fontSize: '0.68rem' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: fullyCovered ? '#1B7A3D' : '#C0392B', display: 'inline-block' }} />
              {fullyCovered ? 'Aktiviert' : 'Inaktiv'}
            </span>
          </div>
        )}

        <h4 style={{ fontFamily: 'Georgia, serif', color: navy, fontSize: '1rem', marginBottom: '0.5rem' }}>Mit EUROPAN bezahlen</h4>

        {!verified && (
          <>
            <p style={{ fontSize: '0.76rem', color: gray, lineHeight: 1.6, marginBottom: '0.75rem' }}>
              Haben Sie bereits ein EUROPAN-Konto? E-Mail und PIN eingeben.
            </p>
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <input type="email" placeholder="Noble E-Mail" value={email} onChange={e => setEmail(e.target.value)}
                style={{ flex: 1, minWidth: 0, padding: '0.55rem 0.7rem', border: '1px solid #E2DDD8', borderRadius: '6px', fontSize: '0.8rem', fontFamily: 'inherit' }} />
              <input type="password" inputMode="numeric" maxLength={4} placeholder="PIN" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g,'').slice(0,4))}
                onKeyDown={e => e.key === 'Enter' && checkBalance()}
                style={{ width: '70px', padding: '0.55rem 0.5rem', border: '1px solid #E2DDD8', borderRadius: '6px', fontSize: '0.8rem', textAlign: 'center', fontFamily: 'inherit' }} />
            </div>
            <button onClick={checkBalance} disabled={loading}
              style={{ width: '100%', background: gold, color: '#fff', border: 'none', padding: '0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', marginBottom: '0.75rem' }}>
              {loading ? 'Wird geprüft…' : 'Guthaben prüfen'}
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.7rem', color: gray }}>
              Kein Konto? <a href="https://noble-limited.com/join" target="_blank" rel="noopener" style={{ color: gold }}>Jetzt beitreten →</a>
            </p>
          </>
        )}

        {error && <p style={{ fontSize: '0.75rem', color: '#C0392B', marginBottom: '0.75rem' }}>{error}</p>}

        {verified && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #E2DDD8', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: navy }}>🇪🇺 EUROPAN</span>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem', fontWeight: 700, color: fullyCovered ? '#1B7A3D' : gray }}>{balance.toFixed(2)}{fullyCovered && ' ✓'}</span>
            </div>

            <div style={row}><span style={{ color: gray }}>Produktpreis</span><strong style={{ color: navy }}>€{price.toFixed(2)}</strong></div>

            {europanBonusTotal > 0 && (
              <>
                <div style={{ ...row, color: gold }}>
                  <span>abzüglich EUROPAN-Bonus</span>
                  <strong>{bonusChoice === 'now' ? `-€${europanBonusTotal.toFixed(2)}` : 'wird gespart'}</strong>
                </div>
                <div style={{ marginBottom: '0.4rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: gray, cursor: 'pointer', marginBottom: '2px' }}>
                    <input type="radio" name={`bonus-choice-${slug}`} checked={bonusChoice === 'now'} onChange={() => setBonusChoice('now')} style={{ accentColor: gold }} />
                    Jetzt für diese Bestellung einsetzen
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: gray, cursor: 'pointer' }}>
                    <input type="radio" name={`bonus-choice-${slug}`} checked={bonusChoice === 'save'} onChange={() => setBonusChoice('save')} style={{ accentColor: gold }} />
                    Auf meinem Noble-Konto sparen
                  </label>
                </div>
              </>
            )}

            {fullyCovered ? (
              <div style={{ ...row, color: gold }}>
                <span>abzüglich Doppel-Wums-Bonus</span><strong>-€{doppelWumsTotal.toFixed(2)}</strong>
              </div>
            ) : (
              <div style={{ background: cream, border: '1px solid #E2DDD8', borderRadius: '6px', padding: '0.6rem 0.75rem', margin: '0.4rem 0', fontSize: '0.72rem', color: navy, lineHeight: 1.5 }}>
                💡 Ihnen fehlen noch <strong>€{(afterEuropanBonus - balance).toFixed(2)}</strong> EUROPAN, um diese Bestellung komplett zu decken und den Doppel-Wums-Bonus freizuschalten (zusätzlich <strong>€{(price * DOPPELWUMS_PCT).toFixed(2)}</strong> Ersparnis). <a href="https://europan.group" target="_blank" style={{ color: navy, fontWeight: 700 }}>Auf europan.group aufladen →</a>
              </div>
            )}

            {fullyCovered && (
              <div style={{ ...row, color: gold, fontWeight: 600 }}>
                <span>Wird mit EUROPAN-Guthaben bezahlt</span><strong>-€{europanPaid.toFixed(2)}</strong>
              </div>
            )}

            {totalSaved > 0.004 && (
              <div style={{ borderTop: '1px solid #E2DDD8', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                <div style={{ ...row, color: gold, fontWeight: 700 }}>
                  <span>Sie sparen heute mit EUROPAN:</span><strong>€{totalSaved.toFixed(2)}</strong>
                </div>
              </div>
            )}

            <div style={{ ...row, fontSize: '1rem', marginTop: '0.4rem' }}>
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
      </div>
    </div>
  )
}
