'use client'
import { useState } from 'react'

const COINS = [
  { id: 'europan',    label: 'EUROPAN',    icon: '🇪🇺' },
  { id: 'n_coin',     label: 'N-Coin',     icon: '🔵' },
  { id: 'swissycash', label: 'SwissyCash', icon: '🇨🇭' },
  { id: 'cryptocoin', label: 'CryptoCoin', icon: '💎' },
]

const BUYER_BONUS_PCT = 0.02
const DOPPELWUMS_PCT = 0.03

type BalanceWidgetProps = {
  slug: string
  price: number
  productName: string
  affiliateRef?: string
  prefillEmail?: string
  onNoblePayment?: (result: any) => void
}

// Farben angelehnt an pan-office.de: helle Karte statt dunkler Box, cream/gold/navy.
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
  const [selectedCoin, setSelectedCoin] = useState('europan')
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<any>(null)

  const doppelBonus = Math.round(price * DOPPELWUMS_PCT * 100) / 100
  const buyerBonus = Math.round(price * BUYER_BONUS_PCT * 100) / 100
  const totalBonus = Math.round((doppelBonus + buyerBonus) * 100) / 100

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

  async function handlePay() {
    if (!verified) return
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

  const selectedBalance = balances ? (balances[selectedCoin] || 0) : 0
  const sufficient = selectedBalance >= price
  const coinLabel = COINS.find(c => c.id === selectedCoin)?.label || selectedCoin

  const card: React.CSSProperties = { background: '#fff', border: '1px solid #E2DDD8', borderRadius: '8px', padding: '1.5rem', fontFamily: 'Jost, system-ui, sans-serif' }

  if (success) return (
    <div style={{ position: 'sticky', top: '88px' }}>
      <div style={card}>
        <h4 style={{ fontFamily: 'Georgia, serif', color: navy, fontSize: '1.05rem', marginBottom: '0.75rem' }}>Zahlung erfolgreich</h4>
        <div style={{ background: '#E8F5EE', border: '1px solid #B7E4CC', borderRadius: '6px', padding: '0.9rem', fontSize: '0.82rem', color: '#1B7A3D', lineHeight: 1.7 }}>
          <div><strong>Referenz:</strong> {success.order_reference}</div>
          <div><strong>Bezahlt:</strong> {price.toFixed(2)} {coinLabel}</div>
          <div><strong>Neues Guthaben:</strong> {success.new_balance?.toFixed(2)} {coinLabel}</div>
          <div style={{ marginTop: '6px', fontWeight: 700 }}>🎉 Doppel-Wums: +{doppelBonus.toFixed(2)} EUROPAN gutgeschrieben</div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ position: 'sticky', top: '88px' }}>
      <div style={card}>
        {/* Status-Badge wie auf pan-office.de */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', background: cream, border: '1px solid #E2DDD8', borderRadius: '6px', padding: '0.5rem 0.7rem', marginBottom: '1rem', fontSize: '0.7rem', fontWeight: 600, color: navy }}>
          <span>EUROPAN-optimiert</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.5rem', borderRadius: '100px', background: verified ? '#E5F6EC' : '#E5F6EC', color: '#1B7A3D', fontSize: '0.68rem' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1B7A3D', display: 'inline-block' }} />
            {verified ? 'Aktiv' : 'Bereit – anmelden'}
          </span>
        </div>

        <h4 style={{ fontFamily: 'Georgia, serif', color: navy, fontSize: '1rem', marginBottom: '0.5rem' }}>Mit Noble-Guthaben bezahlen</h4>
        <p style={{ fontSize: '0.76rem', color: gray, lineHeight: 1.6, marginBottom: '1rem' }}>
          Zahlen Sie komplett mit EUROPAN oder einer anderen Noble-Währung und aktivieren Sie den Doppel-Wums-Bonus (+3% zusätzlich).
        </p>

        {!verified && (
          <>
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
          </>
        )}

        {error && <p style={{ fontSize: '0.75rem', color: '#C0392B', marginBottom: '0.75rem' }}>{error}</p>}

        {balances && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
              {COINS.map(coin => {
                const bal = balances[coin.id] || 0
                const ok = bal >= price
                return (
                  <div key={coin.id} onClick={() => setSelectedCoin(coin.id)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.75rem', borderRadius: '6px', cursor: 'pointer', border: selectedCoin === coin.id ? `1.5px solid ${gold}` : '1px solid #E2DDD8', background: selectedCoin === coin.id ? 'rgba(201,150,58,0.08)' : '#fff' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: navy }}>{coin.icon} {coin.label}</span>
                    <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem', fontWeight: 700, color: ok ? '#1B7A3D' : gray }}>{bal.toFixed(2)}{ok && ' ✓'}</span>
                  </div>
                )
              })}
            </div>

            <div style={{ background: cream, border: '1px solid #E2DDD8', borderRadius: '6px', padding: '0.85rem 1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: gray, padding: '2px 0' }}>
                <span>Produktpreis</span><strong style={{ color: navy }}>€{price.toFixed(2)}</strong>
              </div>
              <div style={{ height: '1px', background: '#E2DDD8', margin: '6px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
                <span style={{ color: gold }}>Sie sparen mit EUROPAN</span>
                <strong style={{ color: gold }}>+{totalBonus.toFixed(2)} EP</strong>
              </div>
              <p style={{ fontSize: '0.68rem', color: gray, marginTop: '0.4rem', lineHeight: 1.5 }}>
                2% Käufer-Bonus + 3% Doppel-Wums bei vollständiger Zahlung mit Noble-Guthaben.
              </p>
            </div>

            {sufficient ? (
              <button onClick={handlePay} disabled={paying}
                style={{ width: '100%', background: '#0D5C33', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                {paying ? 'Verarbeitung…' : `Mit ${coinLabel} bezahlen — ${price.toFixed(2)}`}
              </button>
            ) : (
              <div style={{ background: cream, border: '1px solid #E2DDD8', borderRadius: '6px', padding: '0.7rem', textAlign: 'center', fontSize: '0.78rem', color: gray }}>
                {coinLabel}-Guthaben nicht ausreichend<br />
                <span style={{ fontSize: '0.72rem' }}>Verfügbar: {selectedBalance.toFixed(2)} · Benötigt: {price.toFixed(2)}</span>
              </div>
            )}
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: '0.85rem', fontSize: '0.7rem', color: gray }}>
          {verified
            ? <a href="https://noble-limited.com/dashboard" target="_blank" rel="noopener" style={{ color: gold }}>Dashboard öffnen →</a>
            : <>Kein Konto? <a href="https://noble-limited.com/join" target="_blank" rel="noopener" style={{ color: gold }}>Jetzt beitreten →</a></>
          }
        </div>
      </div>
    </div>
  )
}
