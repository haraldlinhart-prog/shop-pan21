'use client'
import { useState, useEffect } from 'react'

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

type Lang = 'de' | 'en'

type BalanceWidgetProps = {
  slug: string
  price: number
  productName: string
  affiliateRef?: string
  prefillEmail?: string
  lang?: Lang
  onNoblePayment?: (result: any) => void
  onPriceUpdate?: (info: { finalTotal: number; fullyCovered: boolean; doppelWumsIncluded: boolean; pay: () => void } | null) => void
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

// Alle sichtbaren Texte des Widgets, DE (unverändertes Original-Wording) und
// EN. `lang` ist optional und defaultet auf 'de' — bestehende Aufrufer ohne
// lang-Prop (die deutsche Produktseite) verhalten sich exakt wie zuvor.
const STRINGS: Record<Lang, any> = {
  de: {
    invalidEmail: 'Bitte gültige Noble-E-Mail eingeben.',
    invalidPin: 'Bitte 4-stellige PIN eingeben.',
    checkError: 'Fehler bei der Prüfung.',
    networkError: 'Netzwerkfehler.',
    payFailed: 'Zahlung fehlgeschlagen.',
    paymentSuccessTitle: 'Zahlung erfolgreich',
    reference: 'Referenz:',
    paid: 'Bezahlt:',
    newBalance: 'Neues Guthaben:',
    savedToday: 'Sie haben heute mit EUROPAN gespart:',
    yourAdvantage: 'Ihr Vorteil',
    fullyCoveredBadge: '✓ Vollständig gedeckt',
    orderValueNoBonus: 'Bestellwert ohne EUROPAN-Vorteil',
    asMember: 'Als angemeldeter EUROPAN-Nutzer',
    advantage: 'Vorteil:',
    accountLabel: 'Konto',
    alreadyCustomer: 'Bereits EUROPAN-Kunde?',
    loginWithEuropan: 'Mit EUROPAN anmelden →',
    noAccountYet: 'Noch kein Konto?',
    openFreeAccount: 'Kostenloses Konto eröffnen',
    nobleEmailPlaceholder: 'Noble E-Mail',
    pinPlaceholder: 'PIN',
    checking: 'Wird geprüft…',
    checkBalanceBtn: 'Guthaben prüfen',
    doppelWums: 'Doppel-Wums',
    activatedThisOrder: 'aktiviert bei dieser Bestellung',
    extraOnFullPayment: 'zusätzlich bei Komplett-Zahlung des Bestellwerts in EUROPAN',
    doppelWumsExplainer: (
      <>Der Doppel-Wums ist ein Extra-Bonus von 3%, den Sie nur erhalten, wenn Sie den <strong>gesamten Bestellwert</strong> mit EUROPAN-Guthaben bezahlen — bei Teilzahlung entfällt er.</>
    ),
    fullyCoveredLabel: 'vollständig gedeckt',
    remainingPaymentNeeded: 'Restzahlung nötig',
    fullPaymentExplainerPrefix: 'Bei kompletter Zahlung in EUROPAN erhalten Sie zusätzlich den Doppel-Wums-Bonus, und der Gesamt-Warenwert reduziert sich um weitere',
    fullPaymentExplainerSuffix: 'auf insgesamt',
    currentBalanceIs: 'Ihr aktuelles EUROPAN-Guthaben beträgt',
    useBonusNow: 'EUROPAN-Bonus jetzt für diese Bestellung einsetzen',
    saveOnAccount: 'Auf meinem Noble-Konto sparen',
    saveWarning: 'Hinweis: Ohne den 2%-Bonus für diese Bestellung reicht Ihr aktuelles Guthaben nicht mehr für die vollständige Deckung — der Doppel-Wums-Vorteil entfällt dann für diesen Kauf.',
    total: 'Gesamt',
    processing: 'Verarbeitung…',
    payNowBtn: 'Jetzt mit EUROPAN bezahlen →',
    notFullyCovered: 'Guthaben deckt die Bestellung noch nicht komplett — bitte per Kreditkarte links bezahlen oder EUROPAN aufladen.',
    openDashboard: 'Dashboard öffnen →',
    createAccountCta: <>EUROPAN-Konto erstellen und<br />passenden Betrag vorbereiten</>,
    createAccountHint: 'Oben klicken: kostenloses EUROPAN-Konto eröffnen und passenden Aufladebetrag vorbereiten.',
    freeAccountBox: (
      <><strong>Kostenloses EUROPAN-Konto:</strong> Vorteile sichern, EUROPAN durch Anmeldung, Empfehlungen und Aktionen verdienen. Ihr Guthaben ist auf EUROPAN-Partnerseiten sichtbar und nutzbar.</>
    ),
    doppelWumsShort1: 'Doppel-Wums: zusätzlicher Vorteil bei vollständiger Zahlung in EUROPAN.',
    doppelWumsShort2: 'Der Doppel-Wums entsteht als zusätzlicher Vorteil, wenn der komplette Bestellwert in EUROPAN gezahlt wird.',
  },
  en: {
    invalidEmail: 'Please enter a valid Noble email address.',
    invalidPin: 'Please enter your 4-digit PIN.',
    checkError: 'Error checking balance.',
    networkError: 'Network error.',
    payFailed: 'Payment failed.',
    paymentSuccessTitle: 'Payment successful',
    reference: 'Reference:',
    paid: 'Paid:',
    newBalance: 'New balance:',
    savedToday: 'You saved with EUROPAN today:',
    yourAdvantage: 'Your advantage',
    fullyCoveredBadge: '✓ Fully covered',
    orderValueNoBonus: 'Order value without EUROPAN advantage',
    asMember: 'As a verified EUROPAN user',
    advantage: 'Advantage:',
    accountLabel: 'Account',
    alreadyCustomer: 'Already a EUROPAN customer?',
    loginWithEuropan: 'Sign in with EUROPAN →',
    noAccountYet: 'No account yet?',
    openFreeAccount: 'Open a free account',
    nobleEmailPlaceholder: 'Noble email',
    pinPlaceholder: 'PIN',
    checking: 'Checking…',
    checkBalanceBtn: 'Check balance',
    doppelWums: 'Doppel-Wums',
    activatedThisOrder: 'activated for this order',
    extraOnFullPayment: 'additional bonus when paying the full order value in EUROPAN',
    doppelWumsExplainer: (
      <>The Doppel-Wums is an extra 3% bonus you only receive when you pay the <strong>entire order value</strong> with EUROPAN balance — it does not apply to partial payments.</>
    ),
    fullyCoveredLabel: 'fully covered',
    remainingPaymentNeeded: 'Remaining payment required',
    fullPaymentExplainerPrefix: 'Paying the full amount in EUROPAN also earns you the Doppel-Wums bonus, reducing the total order value by a further',
    fullPaymentExplainerSuffix: 'to a total of',
    currentBalanceIs: 'Your current EUROPAN balance is',
    useBonusNow: 'Use the EUROPAN bonus now for this order',
    saveOnAccount: 'Save it to my Noble account',
    saveWarning: 'Note: without the 2% bonus for this order, your current balance no longer fully covers it — the Doppel-Wums advantage will then not apply to this purchase.',
    total: 'Total',
    processing: 'Processing…',
    payNowBtn: 'Pay now with EUROPAN →',
    notFullyCovered: 'Your balance does not yet fully cover the order — please pay by card on the left, or top up your EUROPAN balance.',
    openDashboard: 'Open dashboard →',
    createAccountCta: <>Create a EUROPAN account and<br />prepare the matching amount</>,
    createAccountHint: 'Click above: open a free EUROPAN account and prepare a matching top-up amount.',
    freeAccountBox: (
      <><strong>Free EUROPAN account:</strong> secure the advantage, earn EUROPAN through sign-up, referrals and promotions. Your balance is visible and usable across EUROPAN partner sites.</>
    ),
    doppelWumsShort1: 'Doppel-Wums: an additional advantage when paying in full with EUROPAN.',
    doppelWumsShort2: 'The Doppel-Wums is an additional advantage that applies when the entire order value is paid in EUROPAN.',
  },
}

export function BalanceWidget({ slug, price, affiliateRef, lang = 'de', onNoblePayment, onPriceUpdate }: BalanceWidgetProps) {
  const t = STRINGS[lang]
  const numberLocale = lang === 'en' ? 'en-US' : 'de-DE'
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
    if (!email || !email.includes('@')) return setError(t.invalidEmail)
    if (!/^\d{4}$/.test(pin)) return setError(t.invalidPin)
    setLoading(true); setBalances(null); setVerified(false)
    try {
      const res = await fetch('/api/noble-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin }),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error || t.checkError); setLoading(false); return }
      setBalances(d.balances)
      setVerified(true)
    } catch { setError(t.networkError) }
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

  // Meldet der Elternseite den aktuellen EUROPAN-Vorteilspreis, damit dieser
  // prominent im mittleren Bestell-Kasten als "vorher/nachher" angezeigt werden kann.
  // Wichtig: afterDoppelWums ist der tatsächliche Warenkorb-Preis (z.B. 284,05) —
  // finalTotal wäre der verbleibende Restbetrag in bar (0 bei Volldeckung) und ist hier falsch.
  useEffect(() => {
    if (!onPriceUpdate) return
    if (verified) {
      onPriceUpdate({ finalTotal: afterDoppelWums, fullyCovered, doppelWumsIncluded: fullyCovered, pay: handlePay })
    } else {
      onPriceUpdate(null)
    }
  }, [verified, afterDoppelWums, fullyCovered])

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
      if (!res.ok) { setError(data.error || t.payFailed); setPaying(false); return }
      setSuccess(data)
      if (onNoblePayment) onNoblePayment(data)
    } catch { setError(t.networkError) }
    setPaying(false)
  }

  const card: React.CSSProperties = { background: '#fff', border: `1px solid ${fullyCovered ? greenBorder : '#E2DDD8'}`, borderTop: `2px solid ${fullyCovered ? green : '#E2DDD8'}`, borderRadius: '8px', padding: '1.5rem', fontFamily: 'Jost, system-ui, sans-serif', transition: 'border-color 0.3s ease' }
  const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.8rem', padding: '4px 0' }
  const statBox: React.CSSProperties = { border: '1px solid #E2DDD8', borderRadius: '6px', padding: '0.75rem 0.85rem', marginBottom: '0.6rem' }
  const statLabel: React.CSSProperties = { fontSize: '0.7rem', color: gray, marginBottom: '0.25rem' }
  const statValue: React.CSSProperties = { fontFamily: 'Georgia, serif', fontSize: '1.15rem', fontWeight: 700, color: navy }

  if (success) return (
    <div style={{ position: 'sticky', top: '88px' }}>
      <div style={card}>
        <h4 style={{ fontFamily: 'Georgia, serif', color: navy, fontSize: '1.05rem', marginBottom: '0.75rem' }}>{t.paymentSuccessTitle}</h4>
        <div style={{ background: greenBg, border: `1px solid ${greenBorder}`, borderRadius: '6px', padding: '0.9rem', fontSize: '0.82rem', color: green, lineHeight: 1.7 }}>
          <div><strong>{t.reference}</strong> {success.order_reference}</div>
          <div><strong>{t.paid}</strong> {fmt(success.amount || 0)}</div>
          <div><strong>{t.newBalance}</strong> {fmt(success.new_balance || 0)}</div>
          {totalSaved > 0.004 && <div style={{ marginTop: '6px', fontWeight: 700 }}>{t.savedToday} €{totalSaved.toFixed(2)}</div>}
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ position: 'sticky', top: '88px' }}>
      <div style={card}>
        <h4 style={{ fontFamily: 'Georgia, serif', color: navy, fontSize: '1.05rem', marginBottom: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {t.yourAdvantage}
          {fullyCovered && (
            <span style={{ fontFamily: 'Jost, system-ui, sans-serif', fontSize: '0.65rem', fontWeight: 700, color: green, background: greenBg, border: `1px solid ${greenBorder}`, padding: '0.2rem 0.55rem', borderRadius: '100px' }}>
              {t.fullyCoveredBadge}
            </span>
          )}
        </h4>

        {/* Bestellwert ohne EUROPAN-Vorteil */}
        <div style={statBox}>
          <div style={statLabel}>{t.orderValueNoBonus}</div>
          <div style={statValue}>€{price.toFixed(2)}</div>
        </div>

        {/* Als angemeldeter EUROPAN-Nutzer */}
        <div style={{ ...statBox, background: verified ? greenBg : cream, border: `1px solid ${verified ? greenBorder : '#E2DDD8'}`, transition: 'background 0.3s ease, border-color 0.3s ease' }}>
          <div style={{ ...statLabel, color: verified ? green : gray }}>{t.asMember}{verified ? ' ✓' : ''}</div>
          <div style={{ ...statValue, color: verified ? green : gold }}>€{priceAsMember.toFixed(2)}</div>
          <div style={{ fontSize: '0.68rem', color: verified ? green : gold, marginTop: '2px' }}>{t.advantage} {fmt(europanBonusTotal)}</div>
        </div>

        {/* Konto */}
        {!verified && (
          <div
            onClick={() => setShowLogin(true)}
            style={{ cursor: 'pointer', background: greenBg, border: `1.5px solid ${greenBorder}`, borderRadius: '6px', padding: '0.75rem 0.85rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem' }}
          >
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: green, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>{t.accountLabel}</div>
              <div style={{ fontSize: '0.8rem', color: green, fontWeight: 700 }}>{t.alreadyCustomer}</div>
              <div style={{ fontSize: '0.72rem', color: green }}>{t.loginWithEuropan}</div>
            </div>
            <span style={{ fontSize: '1.3rem', color: green }}>→</span>
          </div>
        )}
        {!verified && (
          <p style={{ fontSize: '0.68rem', color: gray, textAlign: 'center', marginTop: '-0.4rem', marginBottom: '0.75rem' }}>
            {t.noAccountYet} <a href="https://noble-limited.com/join" target="_blank" rel="noopener" style={{ color: gold, fontWeight: 700 }}>{t.openFreeAccount}</a>
          </p>
        )}

        {showLogin && !verified && (
          <div style={{ marginBottom: '0.9rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <input type="email" placeholder={t.nobleEmailPlaceholder} value={email} onChange={e => setEmail(e.target.value)}
                style={{ flex: 1, minWidth: 0, padding: '0.55rem 0.7rem', border: '1px solid #E2DDD8', borderRadius: '6px', fontSize: '0.8rem', fontFamily: 'inherit' }} />
              <input type="password" inputMode="numeric" maxLength={4} placeholder={t.pinPlaceholder} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g,'').slice(0,4))}
                onKeyDown={e => e.key === 'Enter' && checkBalance()}
                style={{ width: '70px', padding: '0.55rem 0.5rem', border: '1px solid #E2DDD8', borderRadius: '6px', fontSize: '0.8rem', textAlign: 'center', fontFamily: 'inherit' }} />
            </div>
            <button onClick={checkBalance} disabled={loading}
              style={{ width: '100%', background: gold, color: '#fff', border: 'none', padding: '0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
              {loading ? t.checking : t.checkBalanceBtn}
            </button>
          </div>
        )}

        {error && <p style={{ fontSize: '0.75rem', color: '#C0392B', marginBottom: '0.75rem' }}>{error}</p>}

        {/* Doppel-Wums */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.6rem 0.7rem', borderRadius: '6px', border: `1px solid ${fullyCovered ? greenBorder : '#E2DDD8'}`, background: fullyCovered ? greenBg : 'transparent', marginBottom: '0.3rem', fontSize: '0.75rem', transition: 'background 0.3s ease, border-color 0.3s ease' }}>
          <div style={{ color: fullyCovered ? green : navy, fontWeight: 600 }}>{t.doppelWums}{fullyCovered ? ' ✓' : ''}</div>
          <div style={{ textAlign: 'right', maxWidth: '62%' }}>
            <div style={{ color: fullyCovered ? green : gold, fontWeight: 700 }}>{fmt(doppelWumsTotal)}</div>
            <div style={{ color: fullyCovered ? green : gray, fontSize: '0.68rem', marginTop: '2px' }}>
              {fullyCovered ? t.activatedThisOrder : t.extraOnFullPayment}
            </div>
          </div>
        </div>
        <p style={{ fontSize: '0.66rem', color: gray, lineHeight: 1.5, margin: '0 0 0.6rem' }}>
          {t.doppelWumsExplainer}
        </p>

        {/* Restzahlung nötig */}
        {verified && fullyCovered ? (
          <div style={{ background: greenBg, border: `1px solid ${greenBorder}`, borderRadius: '6px', padding: '0.6rem 0.75rem', marginBottom: '0.9rem', fontSize: '0.78rem', color: green, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{lang === 'en' ? '€0' : 'Für €0'} {fmt(europanPaid)}</span>
            <span style={{ fontWeight: 700 }}>{t.fullyCoveredLabel}</span>
          </div>
        ) : (
          <>
            <div style={{ background: cream, border: '1px solid #E2DDD8', borderRadius: '6px', padding: '0.6rem 0.75rem', marginBottom: '0.5rem', fontSize: '0.78rem', color: navy, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{lang === 'en' ? `€${afterEuropanBonus.toFixed(2)}` : `Für €${afterEuropanBonus.toFixed(2)}`} {fmt(missingForFullCoverage)}</span>
              <span style={{ fontWeight: 700 }}>{t.remainingPaymentNeeded}</span>
            </div>
            <p style={{ fontSize: '0.68rem', color: gray, lineHeight: 1.55, marginBottom: '0.9rem' }}>
              {t.fullPaymentExplainerPrefix} <strong style={{ color: gold }}>€{doppelWumsTotal.toFixed(2)}</strong> {t.fullPaymentExplainerSuffix} <strong style={{ color: gold }}>€{Math.max(0, afterEuropanBonus - doppelWumsTotal).toFixed(2)}</strong>.
            </p>
          </>
        )}

        {/* Bonuswahl + Zahlungsdetails, sobald verifiziert */}
        {verified && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.55rem 0.75rem', borderRadius: '6px', border: `1px solid ${fullyCovered ? greenBorder : '#E2DDD8'}`, background: fullyCovered ? greenBg : 'transparent', marginBottom: '0.75rem', transition: 'background 0.3s ease, border-color 0.3s ease' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: fullyCovered ? green : navy }}>{t.currentBalanceIs}</span>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem', fontWeight: 700, color: fullyCovered ? green : gray, whiteSpace: 'nowrap' }}>{fmt(balance)}{fullyCovered && ' ✓'}</span>
            </div>

            {europanBonusTotal > 0 && (
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: gray, cursor: 'pointer', marginBottom: '2px' }}>
                  <input type="radio" name={`bonus-choice-${slug}`} checked={bonusChoice === 'now'} onChange={() => setBonusChoice('now')} style={{ accentColor: gold }} />
                  {t.useBonusNow}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: gray, cursor: 'pointer' }}>
                  <input type="radio" name={`bonus-choice-${slug}`} checked={bonusChoice === 'save'} onChange={() => setBonusChoice('save')} style={{ accentColor: gold }} />
                  {t.saveOnAccount}
                </label>
                {bonusChoice === 'save' && !fullyCovered && (
                  <p style={{ fontSize: '0.68rem', color: gray, marginTop: '0.4rem', lineHeight: 1.5 }}>
                    {t.saveWarning}
                  </p>
                )}
              </div>
            )}

            <div style={{ ...row, fontSize: '1rem', marginTop: '0.2rem', borderTop: '1px solid #E2DDD8', paddingTop: '0.5rem' }}>
              <span><strong style={{ color: navy }}>{t.total}</strong></span>
              <strong style={{ color: gold, fontFamily: 'Georgia, serif', fontSize: '1.2rem' }}>€{finalTotal.toFixed(2)}</strong>
            </div>

            {fullyCovered ? (
              <button onClick={handlePay} disabled={paying}
                style={{ width: '100%', background: '#0D5C33', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.75rem' }}>
                {paying ? t.processing : t.payNowBtn}
              </button>
            ) : (
              <div style={{ background: cream, border: '1px solid #E2DDD8', borderRadius: '6px', padding: '0.7rem', textAlign: 'center', fontSize: '0.78rem', color: gray, marginTop: '0.75rem' }}>
                {t.notFullyCovered}
              </div>
            )}

            <p style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.7rem' }}>
              <a href="https://noble-limited.com/dashboard" target="_blank" rel="noopener" style={{ color: gold }}>{t.openDashboard}</a>
            </p>
          </>
        )}

        {/* CTA + Erklärungen für Nicht-verifizierte Besucher, analog europan.group-Referenz */}
        {!verified && (
          <>
            <a href="https://noble-limited.com/join" target="_blank" rel="noopener"
              style={{ display: 'block', textAlign: 'center', width: '100%', background: navy, color: gold, border: 'none', padding: '0.8rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', marginBottom: '0.3rem', textDecoration: 'none' }}>
              {t.createAccountCta}
            </a>
            <p style={{ fontSize: '0.66rem', color: gray, textAlign: 'center', marginBottom: '0.9rem' }}>
              {t.createAccountHint}
            </p>

            <div style={{ background: '#FDF2F2', border: '1px solid #F5D0D0', borderRadius: '6px', padding: '0.65rem 0.75rem', marginBottom: '0.75rem', fontSize: '0.7rem', color: '#B03A3A', lineHeight: 1.55 }}>
              {t.freeAccountBox}
            </div>

            <p style={{ fontSize: '0.68rem', color: gray, lineHeight: 1.6, marginBottom: '0.4rem' }}>
              {t.doppelWumsShort1}
            </p>
            <p style={{ fontSize: '0.68rem', color: gray, lineHeight: 1.6 }}>
              {t.doppelWumsShort2}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
