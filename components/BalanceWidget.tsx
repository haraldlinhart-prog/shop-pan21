'use client'
import { useState } from 'react'
import '../app/produkt/[slug]/produkt.css'

const COINS = [
  { id: 'europan',    label: 'EUROPAN',    icon: '🇪🇺' },
  { id: 'n_coin',     label: 'N-Coin',     icon: '🔵' },
  { id: 'swissycash', label: 'SwissyCash', icon: '🇨🇭' },
  { id: 'cryptocoin', label: 'CryptoCoin', icon: '💎' },
]

type BalanceWidgetProps = {
  slug: string
  price: number
  productName: string
  affiliateRef?: string
  onNoblePayment?: (result: any) => void
}

export function BalanceWidget({ slug, price, productName, affiliateRef, onNoblePayment }: BalanceWidgetProps) {
  const [email, setEmail] = useState('')
  const [balances, setBalances] = useState<Record<string, number> | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedCoin, setSelectedCoin] = useState('europan')
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<any>(null)
  const [emailLoaded, setEmailLoaded] = useState('')

  const BUYER_BONUS = 0.02
  const DOPPEL_WUMS = 0.03

  async function loadBalances() {
    if (!email || !email.includes('@')) return setError('Bitte gültige Noble E-Mail eingeben.')
    setLoading(true); setError(''); setBalances(null)
    try {
      const res = await fetch(`/api/noble-pay?email=${encodeURIComponent(email)}&slug=${slug}&coin_id=europan`)
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Konto nicht gefunden.')
        setLoading(false); return
      }
      // Fetch all balances
      const allRes = await fetch(`/api/noble-balance?email=${encodeURIComponent(email)}`)
      if (allRes.ok) {
        const d = await allRes.json()
        setBalances(d.balances)
        setEmailLoaded(email)
      }
    } catch { setError('Noble API nicht erreichbar.') }
    setLoading(false)
  }

  async function handlePay() {
    if (!balances || !emailLoaded) return
    const bal = balances[selectedCoin] || 0
    if (bal < price) return setError('Guthaben nicht ausreichend.')
    setPaying(true); setError('')
    try {
      const res = await fetch('/api/noble-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailLoaded, slug, coin_id: selectedCoin, affiliate_ref: affiliateRef }),
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
  const buyerBonus = Math.round(price * (BUYER_BONUS + DOPPEL_WUMS) * 100) / 100
  const effectivePrice = price // 1:1 rate for all noble currencies

  if (success) return (
    <div className="balance-widget-wrap">
      <div className="balance-widget">
        <div className="balance-widget-title">Zahlung erfolgreich</div>
        <div className="balance-success">
          <div><strong>Referenz:</strong> {success.order_reference}</div>
          <div><strong>Bezahlt:</strong> {price.toFixed(2)} {COINS.find(c => c.id === selectedCoin)?.label}</div>
          <div><strong>Neues Guthaben:</strong> {success.new_balance?.toFixed(2)} {COINS.find(c => c.id === selectedCoin)?.label}</div>
          <div style={{ marginTop: '6px', color: '#FDE68A', fontWeight: 600 }}>
            🎉 Doppel-Wums: +{buyerBonus.toFixed(2)} EUROPAN gutgeschrieben
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="balance-widget-wrap">
      <div className="balance-widget">
        <div className="balance-widget-title">Mein Noble-Guthaben</div>
        <div className="balance-widget-sub">Zahlen mit virtueller Währung</div>

        {/* Email input */}
        <div className="balance-email-row">
          <input
            type="email"
            placeholder="Noble E-Mail..."
            value={email}
            onChange={e => { setEmail(e.target.value); setBalances(null); setEmailLoaded('') }}
            className="balance-email-input"
            onKeyDown={e => e.key === 'Enter' && loadBalances()}
          />
          <button onClick={loadBalances} disabled={loading} className="balance-check-btn">
            {loading ? '...' : 'Laden'}
          </button>
        </div>

        {error && <div className="balance-error">{error}</div>}

        {/* Coin balances */}
        {balances && (
          <>
            <div className="balance-coins">
              {COINS.map(coin => {
                const bal = balances[coin.id] || 0
                const ok = bal >= price
                return (
                  <div
                    key={coin.id}
                    className={`balance-coin-row${selectedCoin === coin.id ? ' selected' : ''}`}
                    onClick={() => setSelectedCoin(coin.id)}
                  >
                    <div className="balance-coin-label">{coin.icon} {coin.label}</div>
                    <div className={`balance-coin-amount ${ok ? 'sufficient' : 'insufficient'}`}>
                      {bal.toFixed(2)}
                      {ok && <span style={{ fontSize: '0.6rem', marginLeft: '4px', opacity: 0.7 }}>✓</span>}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Savings calculation */}
            <div className="balance-savings-box">
              <div className="savings-title">Ihre Ersparnis</div>
              <div className="savings-row">
                <span>Produktpreis</span>
                <strong>€{price.toFixed(2)}</strong>
              </div>
              <div className="savings-row">
                <span>Zu zahlen in {COINS.find(c => c.id === selectedCoin)?.label}</span>
                <strong>{effectivePrice.toFixed(2)} {COINS.find(c => c.id === selectedCoin)?.label}</strong>
              </div>
              <div className="savings-row highlight">
                <span>Doppel-Wums Bonus</span>
                <strong>+{buyerBonus.toFixed(2)} EUROPAN</strong>
              </div>
              <div className="savings-doppel">
                🎉 Bei Zahlung mit Noble-Währung erhalten Sie <strong>{(BUYER_BONUS + DOPPEL_WUMS) * 100}% EUROPAN-Bonus</strong> zurück gutgeschrieben.
              </div>
            </div>

            {/* Pay button */}
            {sufficient ? (
              <button onClick={handlePay} disabled={paying} className="balance-pay-btn">
                {paying
                  ? 'Verarbeitung...'
                  : `Mit ${COINS.find(c => c.id === selectedCoin)?.label} bezahlen — ${effectivePrice.toFixed(2)}`
                }
              </button>
            ) : (
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '3px', marginBottom: '0.5rem' }}>
                Guthaben in {COINS.find(c => c.id === selectedCoin)?.label} nicht ausreichend.<br />
                Benötigt: {effectivePrice.toFixed(2)} · Verfügbar: {selectedBalance.toFixed(2)}
              </div>
            )}
          </>
        )}

        <span className="balance-noble-link">
          {balances
            ? <><a href="https://noble-limited.com/dashboard" target="_blank" rel="noopener">Dashboard öffnen →</a></>
            : <>Kein Konto? <a href="https://noble-limited.com/join" target="_blank" rel="noopener">Jetzt beitreten →</a></>
          }
        </span>
      </div>
    </div>
  )
}
