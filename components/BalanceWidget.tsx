'use client'
import { useState, useEffect } from 'react'

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
  prefillEmail?: string
  onNoblePayment?: (result: any) => void
}

const S = {
  wrap: { position: 'sticky' as const, top: '88px' },
  box: { background: '#0B1F3A', border: '1px solid rgba(201,150,58,0.2)', borderTop: '3px solid #C9963A', padding: '1.5rem', color: '#fff' },
  title: { fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1rem', fontWeight: 600, color: '#DDB055', marginBottom: '0.25rem' },
  sub: { fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '1.25rem' },
  emailRow: { display: 'flex', gap: '0.4rem', marginBottom: '1rem' },
  emailInput: { flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '0.6rem 0.75rem', borderRadius: '3px', fontSize: '0.8rem', fontFamily: 'Jost, system-ui, sans-serif', outline: 'none' },
  checkBtn: { background: '#C9963A', color: '#fff', border: 'none', padding: '0.6rem 0.85rem', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const, fontFamily: 'Jost, system-ui, sans-serif' },
  coins: { display: 'flex', flexDirection: 'column' as const, gap: '0.4rem', marginBottom: '1rem' },
  coinRow: (selected: boolean) => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem', borderRadius: '3px', cursor: 'pointer', border: selected ? '1px solid #C9963A' : '1px solid transparent', background: selected ? 'rgba(201,150,58,0.1)' : 'rgba(255,255,255,0.03)', transition: 'all 0.15s' }),
  coinLabel: { fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' },
  coinAmountOk: { fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.05rem', fontWeight: 600, color: '#DDB055' },
  coinAmountNo: { fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.05rem', fontWeight: 600, color: 'rgba(255,255,255,0.25)' },
  savingsBox: { background: 'rgba(201,150,58,0.1)', border: '1px solid rgba(201,150,58,0.25)', padding: '0.9rem', borderRadius: '3px', marginBottom: '1rem' },
  savingsTitle: { fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#DDB055', marginBottom: '0.5rem' },
  savingsRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '3px 0' },
  savingsRowHL: { display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', padding: '4px 0', fontWeight: 700 },
  doppelBox: { background: 'rgba(26,82,118,0.35)', border: '1px solid rgba(26,82,118,0.5)', padding: '0.5rem 0.75rem', borderRadius: '3px', fontSize: '0.73rem', color: '#93C5FD', marginTop: '0.5rem', lineHeight: 1.6 },
  payBtn: { width: '100%', background: '#C9963A', color: '#fff', border: 'none', padding: '0.85rem', borderRadius: '3px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Jost, system-ui, sans-serif', marginBottom: '0.5rem', display: 'block' },
  payBtnDisabled: { width: '100%', background: 'rgba(201,150,58,0.3)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(201,150,58,0.2)', padding: '0.85rem', borderRadius: '3px', fontSize: '0.82rem', textAlign: 'center' as const, marginBottom: '0.5rem' },
  nobleLink: { fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center' as const, display: 'block', marginTop: '0.5rem' },
  error: { fontSize: '0.75rem', color: '#FCA5A5', marginTop: '0.4rem' },
  success: { background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.3)', padding: '0.75rem', borderRadius: '3px', fontSize: '0.78rem', color: '#86EFAC', lineHeight: 1.65 },
}

export function BalanceWidget({ slug, price, productName, affiliateRef, prefillEmail, onNoblePayment }: BalanceWidgetProps) {
  const [email, setEmail] = useState('')
  const [balances, setBalances] = useState<Record<string, number> | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedCoin, setSelectedCoin] = useState('europan')
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<any>(null)
  const [emailLoaded, setEmailLoaded] = useState('')

  // Auto-load balances when parent passes a verified Noble email
  useEffect(() => {
    if (prefillEmail && prefillEmail !== email) {
      setEmail(prefillEmail)
      setBalances(null)
      setEmailLoaded('')
      // Small delay so state settles
      setTimeout(() => {
        loadBalancesForEmail(prefillEmail)
      }, 100)
    }
  }, [prefillEmail])

  const BONUS_PCT = 0.05 // 2% base + 3% Doppel-Wums

  async function loadBalancesForEmail(emailToLoad: string) {
    if (!emailToLoad || !emailToLoad.includes('@')) return
    setLoading(true); setError(''); setBalances(null)
    try {
      const res = await fetch(`/api/noble-balance?email=${encodeURIComponent(emailToLoad)}`)
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Noble-Konto nicht gefunden.')
        setLoading(false); return
      }
      const d = await res.json()
      setBalances(d.balances)
      setEmailLoaded(emailToLoad)
    } catch { setError('Noble API nicht erreichbar.') }
    setLoading(false)
  }

  async function loadBalances() {
    if (!email || !email.includes('@')) return setError('Bitte gültige Noble E-Mail eingeben.')
    await loadBalancesForEmail(email)
  }

  async function handlePay() {
    if (!balances || !emailLoaded) return
    if ((balances[selectedCoin] || 0) < price) return setError('Guthaben nicht ausreichend.')
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
  const bonus = Math.round(price * BONUS_PCT * 100) / 100
  const coinLabel = COINS.find(c => c.id === selectedCoin)?.label || selectedCoin

  // Static savings values always visible
  const doppelBonus = Math.round(price * 0.05 * 100) / 100
  const buyerBonus = Math.round(price * 0.02 * 100) / 100
  const totalBonus = Math.round((doppelBonus + buyerBonus) * 100) / 100

  if (success) return (
    <div style={S.wrap}>
      <div style={S.box}>
        <div style={S.title}>Zahlung erfolgreich</div>
        <div style={{ ...S.success, marginTop: '1rem' }}>
          <div><strong>Referenz:</strong> {success.order_reference}</div>
          <div><strong>Bezahlt:</strong> {price.toFixed(2)} {coinLabel}</div>
          <div><strong>Neues Guthaben:</strong> {success.new_balance?.toFixed(2)} {coinLabel}</div>
          <div style={{ marginTop: '6px', color: '#FDE68A', fontWeight: 600 }}>
            🎉 Doppel-Wums: +{bonus.toFixed(2)} EUROPAN gutgeschrieben
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={S.wrap}>
      <div style={S.box}>
        <div style={S.title}>Mein Noble-Guthaben</div>
        {prefillEmail && email === prefillEmail && !balances && !loading && (
          <div style={{ fontSize: '0.72rem', color: '#4CAF7D', marginBottom: '0.75rem', background: 'rgba(76,175,125,0.12)', border: '1px solid rgba(76,175,125,0.25)', padding: '0.4rem 0.65rem', borderRadius: '3px' }}>
            ✓ Noble-Konto erkannt — Guthaben wird geladen…
          </div>
        )}
        <div style={S.sub}>Mit virtueller Währung zahlen</div>

        {/* Savings Preview — always visible */}
        <div style={{ background: 'rgba(201,150,58,0.08)', border: '1px solid rgba(201,150,58,0.22)', borderRadius: '4px', padding: '0.9rem 1rem', marginBottom: '1.1rem' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#DDB055', marginBottom: '0.6rem' }}>
            💰 Ihr Vorteil mit Noble
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '3px 0', color: 'rgba(255,255,255,0.55)' }}>
            <span>Produktpreis</span>
            <strong style={{ color: '#fff' }}>€{price.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '3px 0', color: 'rgba(255,255,255,0.55)' }}>
            <span>🎉 Doppel-Wums (5% EUROPAN)</span>
            <strong style={{ color: '#DDB055' }}>+{doppelBonus.toFixed(2)} EP</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '3px 0', color: 'rgba(255,255,255,0.55)' }}>
            <span>🤝 Käufer-Bonus (2% EUROPAN)</span>
            <strong style={{ color: '#DDB055' }}>+{buyerBonus.toFixed(2)} EP</strong>
          </div>
          <div style={{ height: '1px', background: 'rgba(201,150,58,0.25)', margin: '7px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700 }}>
            <span style={{ color: '#DDB055' }}>Gesamt-Bonus</span>
            <strong style={{ color: '#DDB055' }}>+{totalBonus.toFixed(2)} EUROPAN</strong>
          </div>
          <div style={{ marginTop: '0.6rem', fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
            EUROPAN ist die Noble-Netzwerkwährung — einsetzbar im gesamten PAN21-Ökosystem.
          </div>
          <a
            href="https://noble-limited.com/join"
            target="_blank"
            rel="noopener"
            style={{ display: 'block', marginTop: '0.65rem', textAlign: 'center' as const, background: 'rgba(201,150,58,0.15)', border: '1px solid rgba(201,150,58,0.35)', color: '#DDB055', padding: '0.45rem', borderRadius: '3px', fontSize: '0.72rem', fontWeight: 600, textDecoration: 'none', letterSpacing: '0.03em' }}
          >
            Noble-Konto eröffnen → noble-limited.com
          </a>
        </div>

        {/* Email */}
        <div style={S.emailRow}>
          <input
            type="email"
            placeholder="Noble E-Mail..."
            value={email}
            onChange={e => { setEmail(e.target.value); setBalances(null); setEmailLoaded('') }}
            style={S.emailInput}
            onKeyDown={e => e.key === 'Enter' && loadBalances()}
          />
          <button onClick={loadBalances} disabled={loading} style={S.checkBtn}>
            {loading ? '...' : 'Laden'}
          </button>
        </div>

        {error && <div style={S.error}>{error}</div>}

        {/* Balances */}
        {balances && (
          <>
            <div style={S.coins}>
              {COINS.map(coin => {
                const bal = balances[coin.id] || 0
                const ok = bal >= price
                return (
                  <div
                    key={coin.id}
                    style={S.coinRow(selectedCoin === coin.id)}
                    onClick={() => setSelectedCoin(coin.id)}
                  >
                    <div style={S.coinLabel}>{coin.icon} {coin.label}</div>
                    <div style={ok ? S.coinAmountOk : S.coinAmountNo}>
                      {bal.toFixed(2)}{ok && ' ✓'}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Savings */}
            <div style={S.savingsBox}>
              <div style={S.savingsTitle}>Ihre Abrechnung</div>
              <div style={S.savingsRow}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Produktpreis</span>
                <strong style={{ color: '#fff' }}>€{price.toFixed(2)}</strong>
              </div>
              <div style={S.savingsRow}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Zu zahlen in {coinLabel}</span>
                <strong style={{ color: '#fff' }}>{price.toFixed(2)} {coinLabel}</strong>
              </div>
              <div style={{ height: '1px', background: 'rgba(201,150,58,0.2)', margin: '6px 0' }} />
              <div style={S.savingsRowHL}>
                <span style={{ color: '#DDB055' }}>Doppel-Wums Bonus</span>
                <strong style={{ color: '#DDB055' }}>+{bonus.toFixed(2)} EUROPAN</strong>
              </div>
              <div style={S.doppelBox}>
                🎉 Bei Zahlung mit Noble-Währung erhalten Sie <strong>5% EUROPAN-Bonus</strong> zurück gutgeschrieben — der Doppel-Wums.
              </div>
            </div>

            {sufficient ? (
              <button onClick={handlePay} disabled={paying} style={S.payBtn}>
                {paying ? 'Verarbeitung...' : `Mit ${coinLabel} bezahlen — ${price.toFixed(2)}`}
              </button>
            ) : (
              <div style={S.payBtnDisabled}>
                {coinLabel} Guthaben nicht ausreichend<br />
                <span style={{ fontSize: '0.72rem' }}>Verfügbar: {selectedBalance.toFixed(2)} · Benötigt: {price.toFixed(2)}</span>
              </div>
            )}
          </>
        )}

        <span style={S.nobleLink}>
          {balances
            ? <a href="https://noble-limited.com/dashboard" target="_blank" rel="noopener" style={{ color: '#DDB055' }}>Dashboard öffnen →</a>
            : <><span>Kein Konto? </span><a href="https://noble-limited.com/join" target="_blank" rel="noopener" style={{ color: '#DDB055' }}>Jetzt beitreten →</a></>
          }
        </span>
      </div>
    </div>
  )
}
