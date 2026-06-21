'use client'
import { useState, useEffect } from 'react'

const COINS = [
  { id: 'europan',    label: 'EUROPAN',    color: '#1a5276' },
  { id: 'n_coin',     label: 'N-Coin',     color: '#0B1F3A' },
  { id: 'swissycash', label: 'SwissyCash', color: '#C41E3A' },
  { id: 'cryptocoin', label: 'CryptoCoin', color: '#0066FF' },
]

type NoblePayProps = {
  slug: string
  price: number
  productName: string
  affiliateRef?: string
}

export function NoblePayment({ slug, price, productName, affiliateRef }: NoblePayProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [coinId, setCoinId] = useState('europan')
  const [balance, setBalance] = useState<number | null>(null)
  const [checking, setChecking] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<any>(null)
  const [emailChecked, setEmailChecked] = useState(false)

  useEffect(() => {
    setBalance(null)
    setEmailChecked(false)
    setError('')
  }, [coinId])

  async function checkBalance() {
    if (!email || !email.includes('@')) return setError('Bitte gültige E-Mail eingeben.')
    setChecking(true); setError(''); setBalance(null); setEmailChecked(false)
    try {
      const res = await fetch(`/api/noble-pay?email=${encodeURIComponent(email)}&slug=${slug}&coin_id=${coinId}`)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Konto nicht gefunden.'); setChecking(false); return }
      setBalance(data.balance)
      setEmailChecked(true)
      if (!data.sufficient) setError(`Guthaben nicht ausreichend. Verfügbar: ${data.balance.toFixed(2)} ${data.coin_label}, benötigt: €${price.toFixed(2)}`)
    } catch { setError('Noble API nicht erreichbar.') }
    setChecking(false)
  }

  async function pay() {
    setPaying(true); setError('')
    try {
      const res = await fetch('/api/noble-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, slug, coin_id: coinId, affiliate_ref: affiliateRef }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Zahlung fehlgeschlagen.'); setPaying(false); return }
      setSuccess(data)
    } catch { setError('Netzwerkfehler.') }
    setPaying(false)
  }

  const sufficient = balance !== null && balance >= price

  if (success) return (
    <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderLeft: '3px solid #16A34A', padding: '1.25rem', borderRadius: '3px', marginTop: '1rem' }}>
      <div style={{ fontWeight: 700, color: '#15803D', marginBottom: '0.4rem' }}>Zahlung erfolgreich</div>
      <div style={{ fontSize: '0.82rem', color: '#166534', lineHeight: 1.7 }}>
        <div><strong>Referenz:</strong> {success.order_reference}</div>
        <div><strong>Bezahlt mit:</strong> {price.toFixed(2)} {success.paid_with}</div>
        <div><strong>Neues Guthaben:</strong> {success.new_balance?.toFixed(2)} {success.paid_with}</div>
        {success.doppel_wums && (
          <div style={{ color: '#1a5276', marginTop: '6px', fontWeight: 600 }}>
            Doppel-Wums aktiviert — Sie erhalten 5% EUROPAN-Bonus gutgeschrieben.
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ border: '1px solid #DDE2E8', borderTop: '2px solid #1a5276', marginTop: '1rem' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '0.85rem 1rem',
          background: open ? '#F7F8FA' : '#fff',
          border: 'none', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', cursor: 'pointer', fontSize: '0.85rem',
          fontWeight: 600, color: '#1a5276', fontFamily: 'inherit'
        }}
      >
        <span>Mit Noble-Währung bezahlen</span>
        <span style={{ fontSize: '0.68rem', background: '#1a5276', color: '#fff', padding: '2px 8px', borderRadius: '100px' }}>
          {open ? 'Schließen' : '+ Doppel-Wums Bonus'}
        </span>
      </button>

      {open && (
        <div style={{ padding: '1.25rem', background: '#F7F8FA', borderTop: '1px solid #DDE2E8' }}>
          <div style={{ fontSize: '0.78rem', color: '#1a5276', marginBottom: '1rem', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '0.75rem', borderRadius: '3px' }}>
            <strong>Doppel-Wums:</strong> Bei Zahlung mit Noble-Währung erhalten Sie <strong>5% EUROPAN-Bonus</strong> zusätzlich gutgeschrieben.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
            {COINS.map(c => (
              <button
                key={c.id}
                onClick={() => setCoinId(c.id)}
                style={{
                  padding: '0.5rem',
                  border: `1.5px solid ${coinId === c.id ? c.color : '#DDE2E8'}`,
                  background: coinId === c.id ? c.color : '#fff',
                  color: coinId === c.id ? '#fff' : '#5C6B7A',
                  borderRadius: '3px', fontSize: '0.75rem', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s'
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ fontSize: '0.62rem', fontWeight: 700, color: '#8A9BAE', letterSpacing: '0.14em', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>
              Noble Konto E-Mail
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="email"
                placeholder="ihre@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setBalance(null); setEmailChecked(false); setError('') }}
                style={{ flex: 1, border: '1.5px solid #DDE2E8', padding: '0.65rem 0.85rem', borderRadius: '3px', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none', background: '#fff' }}
              />
              <button
                onClick={checkBalance}
                disabled={checking}
                style={{ background: '#0B1F3A', color: '#C9963A', border: 'none', padding: '0.65rem 1rem', borderRadius: '3px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}
              >
                {checking ? '...' : 'Prüfen'}
              </button>
            </div>
          </div>

          {balance !== null && (
            <div style={{ marginBottom: '0.75rem', padding: '0.75rem', background: sufficient ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${sufficient ? '#86EFAC' : '#FECACA'}`, borderRadius: '3px', fontSize: '0.82rem' }}>
              <div style={{ color: sufficient ? '#15803D' : '#B91C1C' }}>
                Guthaben: <strong>{balance.toFixed(2)} {COINS.find(c => c.id === coinId)?.label}</strong>
                {sufficient ? ' — Ausreichend' : ' — Nicht ausreichend'}
              </div>
              {sufficient && (
                <div style={{ color: '#1a5276', marginTop: '4px', fontWeight: 600 }}>
                  Doppel-Wums Bonus: +{(price * 0.05).toFixed(2)} EUROPAN
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{ color: '#DC2626', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{error}</div>
          )}

          {sufficient && emailChecked && (
            <button
              onClick={pay}
              disabled={paying}
              style={{ width: '100%', background: '#1a5276', color: '#fff', border: 'none', padding: '0.9rem', borderRadius: '3px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {paying ? 'Zahlung wird verarbeitet...' : `Jetzt mit ${COINS.find(c => c.id === coinId)?.label} bezahlen — €${price.toFixed(2)}`}
            </button>
          )}

          <p style={{ fontSize: '0.68rem', color: '#8A9BAE', marginTop: '0.75rem', textAlign: 'center' }}>
            Kein Noble-Konto?{' '}
            <a href="https://noble-limited.com/join" target="_blank" rel="noopener" style={{ color: '#C9963A' }}>
              Jetzt beitreten
            </a>
          </p>
        </div>
      )}
    </div>
  )
}
