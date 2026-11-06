'use client'
import { useState, useEffect, useRef } from 'react'

// Nur EUROPAN ist aktuell als Zahlungswährung im Shop aktiv. Die API kann technisch
// auch N-Coin, SwissyCash und CryptoCoin — das ist aber bewusst (noch) nicht erwünscht.
// Um das später wieder zu öffnen: COINS-Array unten einfach wieder erweitern.
const COINS = [
  { id: 'europan', label: 'EUROPAN', icon: '🇪🇺' },
]

// Standard-Logik für EUROPAN-Bestellungen im gesamten PAN21-Netzwerk:
// 1) EUROPAN-Bonus (2%) — steht jedem verifizierten Konto zu, Kunde wählt "jetzt einsetzen"
//    oder "auf dem EUROPAN-Konto sparen".
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
  embedded?: boolean  // in der Bestellstrecke: Bezahlt wird im Hauptbereich, nicht im Widget
  note?: string
  customer?: Record<string, string | undefined>
  order?: { extras?: number[]; ukExtras?: string[]; usExtras?: string[]; hkExtras?: string[]; ieExtras?: string[]; nzExtras?: string[]; auExtras?: string[]; nevisExtras?: string[]; domainTld?: string; seriesLlc?: boolean }  // Zusatzleistungen der Bestellstrecke; der Server rechnet den Preis selbst nach
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

// Alle sichtbaren Texte des Widgets, DE (unverändertes Original-Wording) und
// EN. `lang` ist optional und defaultet auf 'de' — bestehende Aufrufer ohne
// lang-Prop (die deutsche Produktseite) verhalten sich exakt wie zuvor.
const STRINGS: Record<Lang, any> = {
  de: {
    invalidEmail: 'Bitte gültige E-Mail-Adresse eingeben.',
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
    byCard: 'Mit Kreditkarte',
    paidFullEuropan: 'Vollständig mit EUROPAN bezahlt',
    pointsUnit: 'Punkte',
    advantage: 'Vorteil:',
    advantageFull: '5 %',
    advantageSave: '3 %, dazu 2 % Gutschrift',
    missingLabel: 'Es fehlen',
    accountLabel: 'Konto',
    alreadyCustomer: 'Bereits EUROPAN-Kunde?',
    loginWithEuropan: 'Mit EUROPAN anmelden →',
    noAccountYet: 'Noch kein Konto?',
    openFreeAccount: 'So sammeln Sie EUROPAN',
    nobleEmailPlaceholder: 'E-Mail-Adresse',
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
    currentBalanceIs: 'Ihr aktuelles EUROPAN-Guthaben beträgt',
    useBonusNow: 'EUROPAN-Bonus jetzt für diese Bestellung einsetzen',
    saveOnAccount: 'Auf meinem EUROPAN-Konto sparen',
    saveWarning: 'Hinweis: Ohne den 2%-Bonus für diese Bestellung reicht Ihr aktuelles Guthaben nicht mehr für die vollständige Deckung — der Doppel-Wums-Vorteil entfällt dann für diesen Kauf.',
    total: 'Gesamt',
    processing: 'Verarbeitung…',
    payNowBtn: 'Jetzt mit EUROPAN bezahlen →',
    payInFlow: 'Bezahlen können Sie im Schritt „Prüfen und bezahlen“.',
    notFullyCoveredEmbedded: 'Guthaben deckt die Bestellung noch nicht komplett — bitte Kreditkarte wählen.',
    notFullyCovered: 'Guthaben deckt die Bestellung noch nicht komplett — bitte per Kreditkarte links bezahlen.',
    openDashboard: 'Dashboard öffnen →',
    createAccountCta: <>So sammeln Sie EUROPAN<br />bei jedem Einkauf</>,
    createAccountHint: 'Bei jedem Einkauf im Shop erhalten Sie EUROPAN als Bonus. Ihr Konto entsteht dabei automatisch.',
    freeAccountBox: (
      <><strong>Kostenloses EUROPAN-Konto:</strong> Es entsteht automatisch mit Ihrem ersten Bonus. EUROPAN verdienen Sie durch Käufe, Empfehlungen und Aktionen. Ihre Punkte sind im PAN21 Shop und auf unseren eigenen Seiten sichtbar und nutzbar.</>
    ),
    doppelWumsShort1: 'Doppel-Wums: zusätzlicher Vorteil bei vollständiger Zahlung in EUROPAN.',
    doppelWumsShort2: 'Der Doppel-Wums entsteht als zusätzlicher Vorteil, wenn der komplette Bestellwert in EUROPAN gezahlt wird.',
  },
  en: {
    invalidEmail: 'Please enter a valid email address.',
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
    byCard: 'By credit card',
    paidFullEuropan: 'Paid in full with EUROPAN',
    pointsUnit: 'points',
    advantage: 'Advantage:',
    advantageFull: '5%',
    advantageSave: '3%, plus 2% credited',
    missingLabel: 'Still missing',
    accountLabel: 'Account',
    alreadyCustomer: 'Already a EUROPAN customer?',
    loginWithEuropan: 'Sign in with EUROPAN →',
    noAccountYet: 'No account yet?',
    openFreeAccount: 'How to collect EUROPAN',
    nobleEmailPlaceholder: 'Email address',
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
    currentBalanceIs: 'Your current EUROPAN balance is',
    useBonusNow: 'Use the EUROPAN bonus now for this order',
    saveOnAccount: 'Save it to my EUROPAN account',
    saveWarning: 'Note: without the 2% bonus for this order, your current balance no longer fully covers it — the Doppel-Wums advantage will then not apply to this purchase.',
    total: 'Total',
    processing: 'Processing…',
    payNowBtn: 'Pay now with EUROPAN →',
    payInFlow: 'You can pay in the "Review and pay" step.',
    notFullyCoveredEmbedded: 'Your balance does not yet fully cover the order — please choose credit card.',
    notFullyCovered: 'Your balance does not yet fully cover the order — please pay by card on the left.',
    openDashboard: 'Open dashboard →',
    createAccountCta: <>How to collect EUROPAN<br />on every purchase</>,
    createAccountHint: 'You receive EUROPAN as a bonus on every shop purchase. Your account is created automatically.',
    freeAccountBox: (
      <><strong>Free EUROPAN account:</strong> it is created automatically with your first bonus. Earn EUROPAN through purchases, referrals and promotions. Your points are visible and usable in the PAN21 Shop and on our own sites.</>
    ),
    doppelWumsShort1: 'Doppel-Wums: an additional advantage when paying in full with EUROPAN.',
    doppelWumsShort2: 'The Doppel-Wums is an additional advantage that applies when the entire order value is paid in EUROPAN.',
  },
}

export function BalanceWidget({ slug, price, affiliateRef, lang = 'de', embedded = false, note, customer, order, onNoblePayment, onPriceUpdate }: BalanceWidgetProps) {
  const t = STRINGS[lang]
  const customerRef = useRef(customer)
  customerRef.current = customer
  const orderRef = useRef(order)
  orderRef.current = order
  const numberLocale = lang === 'en' ? 'en-US' : 'de-DE'
  const num = (n: number) => n.toLocaleString(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const pts = (n: number) => ')( ' + num(n)
  const eur = (n: number) => n.toLocaleString(numberLocale, { style: 'currency', currency: 'EUR' })
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

  // Schritt 1: EUROPAN-Bonus (2%)
  const europanBonusTotal = Math.round(price * EUROPAN_BONUS_PCT * 100) / 100
  const europanBonusApplied = bonusChoice === 'now' ? europanBonusTotal : 0
  const afterEuropanBonus = Math.max(0, price - europanBonusApplied)

  // Schritt 2: Doppel-Wums — nur wenn Guthaben den (reduzierten) Betrag komplett deckt
  const doppelWumsTotal = Math.round(price * DOPPELWUMS_PCT * 100) / 100
  const cents = (n: number) => Math.round(n * 100) / 100
  // Was bei vollstaendiger Zahlung abgebucht wird, gleiche Rechnung wie in /api/noble-pay
  const fullPaymentAmount = cents(Math.max(0, afterEuropanBonus - doppelWumsTotal))
  const fullyCovered = verified && balance >= fullPaymentAmount
  const coveredWithBonus = verified && balance >= cents(Math.max(0, price - europanBonusTotal - doppelWumsTotal))
  const afterDoppelWums = Math.max(0, afterEuropanBonus - (fullyCovered ? doppelWumsTotal : 0))

  // Schritt 3: mit Guthaben bezahlter Betrag (alles oder nichts)
  const europanPaid = fullyCovered ? afterDoppelWums : 0
  const totalSaved = Math.max(0, price - afterDoppelWums)

  const missingForFullCoverage = cents(Math.max(0, fullPaymentAmount - balance))

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
  }, [verified, afterDoppelWums, fullyCovered, slug])

  async function handlePay() {
    if (!verified || !fullyCovered) return
    setPaying(true); setError('')
    try {
      const res = await fetch('/api/noble-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin, slug, coin_id: selectedCoin, affiliate_ref: affiliateRef, customer: customerRef.current, order: orderRef.current, use_bonus: bonusChoice === 'now' }),
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
    <div style={embedded ? undefined : { position: 'sticky', top: '88px' }}>
      <div style={card}>
        <h4 style={{ fontFamily: 'Georgia, serif', color: navy, fontSize: '1.05rem', marginBottom: '0.75rem' }}>{t.paymentSuccessTitle}</h4>
        <div style={{ background: greenBg, border: `1px solid ${greenBorder}`, borderRadius: '6px', padding: '0.9rem', fontSize: '0.82rem', color: green, lineHeight: 1.7 }}>
          <div><strong>{t.reference}</strong> {success.order_reference}</div>
          <div><strong>{t.paid}</strong> {pts(success.amount || 0)}</div>
          <div><strong>{t.newBalance}</strong> {pts(success.new_balance || 0)}</div>
          {totalSaved > 0.004 && <div style={{ marginTop: '6px', fontWeight: 700 }}>{t.savedToday} {eur(totalSaved)}</div>}
        </div>
      </div>
    </div>
  )

  return (
    <div style={embedded ? undefined : { position: 'sticky', top: '88px' }}>
      <div style={card}>
        <h4 style={{ fontFamily: 'Georgia, serif', color: navy, fontSize: '1.05rem', marginBottom: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {t.yourAdvantage}
          {fullyCovered && (
            <span style={{ fontFamily: 'Jost, system-ui, sans-serif', fontSize: '0.65rem', fontWeight: 700, color: green, background: greenBg, border: `1px solid ${greenBorder}`, padding: '0.2rem 0.55rem', borderRadius: '100px' }}>
              {t.fullyCoveredBadge}
            </span>
          )}
        </h4>

        {note && <p style={{ fontSize: '0.72rem', color: gray, lineHeight: 1.5, margin: '0 0 0.7rem' }}>{note}</p>}

        {/* Preis ohne EUROPAN-Vorteil */}
        <div style={statBox}>
          <div style={statLabel}>{note ? t.orderValueNoBonus : t.byCard}</div>
          <div style={statValue}>{eur(price)}</div>
        </div>

        {/* Preis bei vollstaendiger Zahlung mit EUROPAN */}
        <div style={{ ...statBox, background: fullyCovered ? greenBg : cream, border: `1px solid ${fullyCovered ? greenBorder : '#E2DDD8'}`, transition: 'background 0.3s ease, border-color 0.3s ease' }}>
          <div style={{ ...statLabel, color: fullyCovered ? green : gray }}>{t.paidFullEuropan}{fullyCovered ? ' ✓' : ''}</div>
          <div style={{ ...statValue, color: fullyCovered ? green : gold }}>{num(fullPaymentAmount)} {t.pointsUnit}</div>
          <div style={{ fontSize: '0.68rem', color: fullyCovered ? green : gold, marginTop: '2px' }}>{t.advantage} {bonusChoice === 'now' ? t.advantageFull : t.advantageSave}</div>
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
            {t.noAccountYet} <a href={`https://www.europan.group/bonus?lang=${lang}`} target="_blank" rel="noopener" style={{ color: gold, fontWeight: 700 }}>{t.openFreeAccount}</a>
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
            <div style={{ color: fullyCovered ? green : gold, fontWeight: 700 }}>{pts(doppelWumsTotal)}</div>
            <div style={{ color: fullyCovered ? green : gray, fontSize: '0.68rem', marginTop: '2px' }}>
              {fullyCovered ? t.activatedThisOrder : t.extraOnFullPayment}
            </div>
          </div>
        </div>
        <p style={{ fontSize: '0.66rem', color: gray, lineHeight: 1.5, margin: '0 0 0.6rem' }}>
          {t.doppelWumsExplainer}
        </p>

        {/* Deckung durch das Guthaben, sobald angemeldet */}
        {verified && fullyCovered ? (
          <div style={{ background: greenBg, border: `1px solid ${greenBorder}`, borderRadius: '6px', padding: '0.6rem 0.75rem', marginBottom: '0.9rem', fontSize: '0.78rem', color: green, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{pts(europanPaid)}</span>
            <span style={{ fontWeight: 700 }}>{t.fullyCoveredLabel}</span>
          </div>
        ) : verified ? (
          <div style={{ background: cream, border: '1px solid #E2DDD8', borderRadius: '6px', padding: '0.6rem 0.75rem', marginBottom: '0.9rem', fontSize: '0.78rem', color: navy, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700 }}>{t.missingLabel}</span>
            <span>{pts(missingForFullCoverage)}</span>
          </div>
        ) : null}

        {/* Bonuswahl + Zahlungsdetails, sobald verifiziert */}
        {verified && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.55rem 0.75rem', borderRadius: '6px', border: `1px solid ${fullyCovered ? greenBorder : '#E2DDD8'}`, background: fullyCovered ? greenBg : 'transparent', marginBottom: '0.75rem', transition: 'background 0.3s ease, border-color 0.3s ease' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: fullyCovered ? green : navy }}>{t.currentBalanceIs}</span>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem', fontWeight: 700, color: fullyCovered ? green : gray, whiteSpace: 'nowrap' }}>{pts(balance)}{fullyCovered && ' ✓'}</span>
            </div>

            {europanBonusTotal > 0 && coveredWithBonus && (
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

            {/* In der Bestellstrecke steht der Gesamtpreis links und folgt der gewaehlten Zahlungsart */}
            {!embedded && (
              <div style={{ ...row, fontSize: '1rem', marginTop: '0.2rem', borderTop: '1px solid #E2DDD8', paddingTop: '0.5rem' }}>
                <span><strong style={{ color: navy }}>{t.total}</strong></span>
                <strong style={{ color: gold, fontFamily: 'Georgia, serif', fontSize: '1.2rem' }}>{fullyCovered ? pts(europanPaid) : eur(price)}</strong>
              </div>
            )}

            {embedded ? (
              !note && <div style={{ background: fullyCovered ? greenBg : cream, border: '1px solid #E2DDD8', borderRadius: '6px', padding: '0.7rem', textAlign: 'center', fontSize: '0.78rem', color: fullyCovered ? green : gray, marginTop: '0.75rem' }}>
                {fullyCovered ? t.payInFlow : t.notFullyCoveredEmbedded}
              </div>
            ) : fullyCovered ? (
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
              <a href={`https://accounts.europan.group/dashboard?lang=${lang}`} target="_blank" rel="noopener" style={{ color: gold }}>{t.openDashboard}</a>
            </p>
          </>
        )}

        {/* CTA + Erklärungen für Nicht-verifizierte Besucher, analog europan.group-Referenz */}
        {!verified && (
          <>
            <a href={`https://www.europan.group/bonus?lang=${lang}`} target="_blank" rel="noopener"
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
