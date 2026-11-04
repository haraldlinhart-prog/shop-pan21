'use client'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { PRODUCTS, type Product } from '@/lib/products'
import { PRODUCTS_EN } from '@/lib/products.en'
import { BalanceWidget } from '@/components/BalanceWidget'
import { HOSTING_DOMAIN_PRICES, HOSTING_DOMAIN_TLDS, cleanDomainName, isValidDomainName, FORMATION_SLUGS, LEGAL_LINKS, TRUST_ACCOUNT_FEE, TRUST_MONTHLY, TRUST_PAID_MONTHS_PER_YEAR, TRUST_SLUG, HOSTING_ADDON_START, type LegalForm } from '@/lib/orderFlow'
import { STRINGS, type Lang } from './strings'
import '@/app/globals.css'
import './order.css'

type Errors = Record<string, string>
type Rows = { label: string; value: string; minus?: boolean }[]
type Summary = { title: string; chip: string; rows: Rows; totalLabel: string; total: string; note: string; later?: { label: string; value: string } }

const money = (n: number, lang: Lang) => lang === 'de'
  ? `${n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
  : `€${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const perMonth = (n: number, lang: Lang) => lang === 'de' ? `${n} €/Monat` : `€${n}/month`
const flatFee = (n: number, lang: Lang) => lang === 'de' ? `${n} € pauschal` : `€${n} flat fee`
const mailOk = (e?: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '')

function productsFor(lang: Lang): Product[] { return lang === 'en' ? PRODUCTS_EN : PRODUCTS }

/* ---------- Bausteine ---------- */
function Field({ id, label, value, onChange, error, req, wide, type, area, placeholder, auto }: { id: string; label: string; value?: string; onChange: (v: string) => void; error?: string; req?: boolean; wide?: boolean; type?: string; area?: boolean; placeholder?: string; auto?: string }) {
  const common = { id, value: value || '', placeholder, 'aria-invalid': error ? true : undefined, 'aria-describedby': error ? `${id}-e` : undefined }
  return (
    <div className={`ofl-f${wide ? ' w' : ''}${error ? ' bad' : ''}`}>
      <label htmlFor={id}>{label}{req ? ' *' : ''}</label>
      {area
        ? <textarea {...common} onChange={e => onChange(e.target.value)} />
        : <input {...common} type={type || 'text'} autoComplete={auto} onChange={e => onChange(e.target.value)} />}
      {error && <span className="ofl-err" id={`${id}-e`}>{error}</span>}
    </div>
  )
}

function Card({ id, name, type = 'radio', checked, onChange, title, price, sub, disabled }: { id: string; name?: string; type?: 'radio' | 'checkbox'; checked: boolean; onChange: () => void; title: string; price?: string; sub?: string; disabled?: boolean }) {
  return (
    <label className="ofl-card" htmlFor={id}>
      <input id={id} name={name} type={type} checked={checked} disabled={disabled} onChange={onChange} />
      <b>{title}</b>
      <span className="ofl-pr">{price || ''}</span>
      {sub && <small>{sub}</small>}
    </label>
  )
}

function Bullets({ items, kind }: { items: string[]; kind: string }) {
  return <ul className={`ofl-list ${kind}`}>{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
}

function Steps({ items, done = 0 }: { items: string[]; done?: number }) {
  return (
    <ol className="ofl-steps">
      {items.map((x, i) => <li key={i} className={i < done ? 'ok' : ''}><b>{i < done ? '✓' : String(i + 1).padStart(2, '0')}</b><span>{x}</span></li>)}
    </ol>
  )
}

function Actions({ t, onBack, onNext, nextLabel, gold, disabled }: { t: any; onBack?: () => void; onNext?: () => void; nextLabel?: string; gold?: boolean; disabled?: boolean }) {
  return (
    <div className="ofl-actions">
      {onBack ? <button type="button" className="ofl-back" onClick={onBack}>{t.back}</button> : <span />}
      {onNext && <button type="button" className={`ofl-btn${gold ? ' gold' : ''}`} disabled={disabled} onClick={onNext}>{nextLabel}</button>}
    </div>
  )
}

function ReviewRow({ label, value, onChange, t }: { label: string; value: ReactNode; onChange?: () => void; t: any }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
      {onChange ? <button type="button" className="ofl-link" onClick={onChange}>{t.change}</button> : <span />}
    </div>
  )
}

/* ---------- Rahmen: Kopf, Fortschritt, Zusammenfassung, Fuss ---------- */
function Shell({ lang, slug, steps, step, goTo, summary, affiliateRef, side, children }: { lang: Lang; slug: string; steps: string[]; step: number; goTo: (n: number) => void; summary: Summary; affiliateRef: string; side: ReactNode; children: ReactNode }) {
  const t = STRINGS[lang]
  const [sheet, setSheet] = useState(false)
  const [details, setDetails] = useState(true)
  const done = step === steps.length - 1
  return (
    <div>
      <nav className="nav ofl-nav">
        <div className="container nav-inner">
          <Link href={t.home} className="nav-logo">
            <div className="nav-logo-mark">P21</div>
            <div>
              <span className="nav-logo-text">PAN21 Shop</span>
              <span className="nav-logo-sub">Corporate Services</span>
            </div>
          </Link>
          <ul className="nav-links"><li><Link href={t.products}>{t.allProducts}</Link></li></ul>
          <div className="nav-actions">
            <Link href={`${t.otherProductPath}${slug}`} className="btn-outline" style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)', fontSize: '0.78rem' }}>{t.otherLabel}</Link>
            <Link href={t.contact} className="btn-outline ofl-nav-advice" style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)', fontSize: '0.78rem' }}>{t.advice}</Link>
          </div>
        </div>
      </nav>

      <div className="ofl">
        <div className="ofl-prog-band">
          <div className="ofl-wrap">
            <ol className="ofl-prog">
              {steps.map((name, i) => {
                const can = i < step && !done
                return (
                  <li key={name} className={i < step ? 'done' : i === step ? 'now' : ''}>
                    <button type="button" className="ofl-pbtn" disabled={!can} onClick={() => goTo(i)} aria-current={i === step ? 'step' : undefined} aria-label={`${t.step} ${i + 1}: ${name}`}>
                      <span className="ofl-dot">{i < step ? '✓' : i + 1}</span>
                      <span className="lb">{name}</span>
                    </button>
                  </li>
                )
              })}
            </ol>
            <div className="ofl-prog-now">{t.step} {step + 1} {t.of} {steps.length}: {steps[step]}</div>
          </div>
        </div>

        <div className="ofl-wrap">
          <div className={`ofl-layout${done ? ' one' : ''}`}>
            <main className="ofl-panel">
              {affiliateRef && <div style={{ fontSize: '0.78rem', color: '#166534', background: '#F0FDF4', border: '1px solid #86EFAC', padding: '0.5rem 1rem' }}>{t.partner}</div>}
              {children}
            </main>
            {!done && (
              <div className="ofl-side">
              <aside className={`ofl-sum${sheet ? ' open' : ''}`} aria-label={t.summary}>
                <button type="button" className="ofl-mob-bar" aria-expanded={sheet} onClick={() => setSheet(!sheet)}>
                  <span>{summary.totalLabel} <span className="ofl-chev">▴</span></span>
                  <b>{summary.total}</b>
                </button>
                <div className="ofl-sum-sec full">
                  <h2>{summary.title}</h2>
                  <span className="ofl-sum-note">{summary.chip}</span>
                </div>
                <div className="ofl-sum-sec full">
                  <button type="button" className="ofl-sum-tg" aria-expanded={details} onClick={() => setDetails(!details)}>
                    <span>{t.priceDetails}</span><span className="ofl-chev">▾</span>
                  </button>
                  {details && summary.rows.map((r, i) => (
                    <div key={i} className={`ofl-row${r.minus ? ' minus' : ''}`}><span>{r.label}</span><span>{r.value}</span></div>
                  ))}
                </div>
                <div className="ofl-sum-sec full">
                  <div className="ofl-total"><span>{summary.totalLabel}</span><b>{summary.total}</b></div>
                  {summary.later && <div className="ofl-row"><span>{summary.later.label}</span><span>{summary.later.value}</span></div>}
                  <span className="ofl-sum-note">{summary.note}</span>
                </div>
              </aside>
              {side}
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-links">
            <Link href={t.home}>{t.backToShop}</Link>
            <Link href={t.impressum}>{t.impressumLabel}</Link>
            <Link href={t.privacy}>{t.privacyLabel}</Link>
            <a href="https://pan21.com" target="_blank" rel="noopener">PAN21.com</a>
            <a href="https://noble-limited.com" target="_blank" rel="noopener">Noble Limited</a>
          </div>
          <p className="footer-legal">© {new Date().getFullYear()} PAN21.com International LLC · {t.footer}</p>
        </div>
      </footer>
    </div>
  )
}

/* ---------- Schrittverwaltung mit Zurueck-Taste des Browsers und Sitzungsspeicher ---------- */
function useFlowState<S extends { step: number }>(storageKey: string, initial: S) {
  const [state, setState] = useState<S>(initial)
  const skipFocus = useRef(true)

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        setState(s => ({ ...s, ...parsed }))
        window.history.replaceState({ ...window.history.state, oflStep: parsed.step || 0 }, '')
      }
    } catch {}
    const onPop = (e: PopStateEvent) => {
      if (typeof e.state?.oflStep === 'number') setState(s => ({ ...s, step: e.state.oflStep }))
      else setState(s => ({ ...s, step: 0 }))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [storageKey])

  useEffect(() => {
    try { sessionStorage.setItem(storageKey, JSON.stringify(state)) } catch {}
  }, [storageKey, state])

  useEffect(() => {
    if (skipFocus.current) { skipFocus.current = false; return }
    window.scrollTo(0, 0)
    document.querySelector<HTMLElement>('.ofl-h1')?.focus({ preventScroll: true })
  }, [state.step])

  const goTo = useCallback((n: number) => {
    // Den vorhandenen Zustand mitnehmen: Next.js laedt sonst beim Zurueckgehen die Seite neu.
    window.history.pushState({ ...window.history.state, oflStep: n }, '')
    setState(s => ({ ...s, step: n }))
  }, [])
  const patch = useCallback((p: Partial<S>) => setState(s => ({ ...s, ...p })), [])
  const clear = useCallback(() => { try { sessionStorage.removeItem(storageKey) } catch {} }, [storageKey])
  return { state, patch, goTo, clear }
}

function useAffiliateRef() {
  const params = useSearchParams()
  const fromUrl = params.get('ref') || ''
  const [ref, setRef] = useState(fromUrl)
  useEffect(() => {
    if (!fromUrl) {
      const match = document.cookie.match(/pan21_ref=([^;]+)/)
      if (match) setRef(decodeURIComponent(match[1]))
    } else {
      document.cookie = `pan21_ref=${fromUrl}; max-age=${60 * 60 * 24 * 30}; path=/; samesite=lax`
    }
  }, [fromUrl])
  return ref
}

function focusFirstError() {
  setTimeout(() => document.querySelector('.ofl-err')?.scrollIntoView({ block: 'center' }), 0)
}

/* ---------- Angebotsseite (Schritt 1): zeigt den ganzen Produkttext, auch fuer Suchmaschinen ---------- */
function Related({ product, lang }: { product: Product; lang: Lang }) {
  const t = STRINGS[lang]
  const related = productsFor(lang).filter(p => p.slug !== product.slug && p.category === product.category && !p.externalUrl && !p.hideCard).slice(0, 2)
  if (!related.length) return null
  return (
    <section className="ofl-sec">
      <h2 className="ofl-h2">{t.related}</h2>
      <div className="ofl-related">
        {related.map(r => (
          <Link key={r.slug} href={`${t.productPath}${r.slug}`}>
            <span>{r.flag}</span>
            <span><b>{r.card?.name ?? r.name}</b><small>{r.price ? money(r.price, lang) : t.onRequest}</small></span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function Hero({ product }: { product: Product }) {
  const src = product.heroImage || product.image
  if (!src) return null
  return <div className="ofl-hero"><img src={src} alt={product.name} onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }} /></div>
}

/* ---------- Gruendung: UG und GmbH ---------- */
type DomainResults = Record<string, { available: boolean | null; price: number | null }>
type FormationState = { step: number; form: LegalForm; extras: number[]; pay: 'card' | 'europan'; terms: boolean; d: Record<string, string> }

function FormationFlow({ slug, lang }: { slug: string; lang: Lang }) {
  const t = STRINGS[lang], f = t.formation
  const affiliateRef = useAffiliateRef()
  const startForm: LegalForm = slug === FORMATION_SLUGS.gmbh ? 'gmbh' : 'ug'
  const { state: s, patch, goTo, clear } = useFlowState<FormationState>(`pan21-order-${slug}`, { step: 0, form: startForm, extras: [], pay: 'card', terms: false, d: {} })
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const [payError, setPayError] = useState('')
  const [preview, setPreview] = useState<{ finalTotal: number; fullyCovered: boolean; pay: () => void | Promise<void> } | null>(null)
  const [paid, setPaid] = useState<{ order_reference?: string } | null>(null)
  const [domainCheck, setDomainCheck] = useState<{ name: string; results: DomainResults } | null>(null)
  const [domainChecking, setDomainChecking] = useState(false)
  const [domainMsg, setDomainMsg] = useState('')
  const tokenRef = useRef<{ slug: string; at: number; token: string } | null>(null)

  const products = productsFor(lang)
  const shown = products.find(p => p.slug === slug)!
  const chosenSlug = FORMATION_SLUGS[s.form]
  const chosen = products.find(p => p.slug === chosenSlug)!
  const chosenDe = PRODUCTS.find(p => p.slug === chosenSlug)!
  const price = chosen.price as number
  const hasLegal = Boolean(LEGAL_LINKS.terms && LEGAL_LINKS.withdrawal)
  const set = (k: string) => (v: string) => patch({ d: { ...s.d, [k]: v } })
  const toggleExtra = (i: number) => patch({ extras: s.extras.includes(i) ? s.extras.filter(x => x !== i) : [...s.extras, i] })

  async function loadToken(forSlug: string) {
    const res = await fetch(`/api/checkout-token?slug=${encodeURIComponent(forSlug)}`)
    const data = await res.json()
    if (!data.token) throw new Error('token')
    tokenRef.current = { slug: forSlug, at: Date.now(), token: data.token }
  }

  // Der Schluessel laeuft nach 15 Minuten ab und gilt erst nach 3 Sekunden.
  // Deshalb wird er beim Betreten der Pruefseite geholt und vor dem Bezahlen geprueft.
  useEffect(() => {
    if (s.step === 4) loadToken(chosenSlug).catch(() => {})
  }, [s.step, chosenSlug])

  async function readyToken(): Promise<string> {
    const cur = tokenRef.current
    if (!cur || cur.slug !== chosenSlug || Date.now() - cur.at > 14 * 60 * 1000) await loadToken(chosenSlug)
    const age = Date.now() - tokenRef.current!.at
    if (age < 3200) await new Promise(r => setTimeout(r, 3200 - age))
    return tokenRef.current!.token
  }

  const extrasDe = s.extras.map(i => chosenDe.addons[i]).filter(Boolean).join('; ')
  const hostingChosen = s.extras.includes(HOSTING_ADDON_START)
  const domainName = cleanDomainName(s.d.domainName || '')
  const domainTld = s.d.domainTld || ''
  const checkedResults = domainCheck && domainCheck.name === domainName ? domainCheck.results : null
  const domainPrice = (tld: string) => checkedResults?.[tld]?.price ?? HOSTING_DOMAIN_PRICES[tld]
  const domainFull = hostingChosen && domainTld && isValidDomainName(domainName) ? `${domainName}.${domainTld}` : ''

  async function checkDomain() {
    setDomainMsg('')
    if (!isValidDomainName(domainName)) { setErrors({ domainName: f.domainErrName }); focusFirstError(); return }
    setErrors({}); setDomainChecking(true)
    try {
      const res = await fetch(`/api/check-domain?name=${encodeURIComponent(domainName)}`)
      const data = await res.json()
      if (!res.ok) throw new Error('check')
      const results: DomainResults = {}
      for (const r of data.results) results[r.tld] = { available: r.available, price: r.price }
      setDomainCheck({ name: domainName, results })
      if (Object.values(results).every(r => r.available === null)) setDomainMsg(f.domainErrFailed)
      if (domainTld && results[domainTld]?.available === false) patch({ d: { ...s.d, domainTld: '' } })
    } catch { setDomainCheck(null); setDomainMsg(f.domainErrFailed) }
    setDomainChecking(false)
  }

  function validateExtras(): boolean {
    if (!hostingChosen) return true
    const hasName = Boolean((s.d.domainName || '').trim())
    let msg = ''
    if (hasName && !isValidDomainName(domainName)) msg = f.domainErrName
    else if (domainTld && !hasName) msg = f.domainErrName
    else if (hasName && !domainTld) msg = f.domainErrTld
    setErrors(msg ? { domainName: msg } : {})
    if (msg) focusFirstError()
    return !msg
  }
  const customer = { firstName: s.d.firstName, lastName: s.d.lastName, contactEmail: s.d.email, phone: s.d.phone, company: s.d.company, street: s.d.street, postalCode: s.d.postalCode, city: s.d.city, country: s.d.country, desiredName: s.d.desiredName, extras: extrasDe, domain: domainFull ? `${domainFull} (${money(domainPrice(domainTld), 'de')} pro Jahr)` : undefined }

  function validateData(): boolean {
    const e: Errors = {}
    const need = (k: string, msg: string) => { if (!(s.d[k] || '').trim()) e[k] = msg }
    need('firstName', f.errFirstName); need('lastName', f.errLastName)
    if (!mailOk(s.d.email)) e.email = t.errEmail
    need('street', f.errStreet); need('postalCode', f.errPostalCode); need('city', f.errCity); need('country', f.errCountry)
    setErrors(e)
    if (Object.keys(e).length) focusFirstError()
    return !Object.keys(e).length
  }

  async function payEuropan() {
    if (!preview) return
    if (hasLegal && !s.terms) { setErrors({ terms: f.errTerms }); focusFirstError(); return }
    setErrors({}); setBusy(true)
    try { await preview.pay() } finally { setBusy(false) }
  }

  async function payCard() {
    if (hasLegal && !s.terms) { setErrors({ terms: f.errTerms }); focusFirstError(); return }
    setErrors({}); setPayError(''); setBusy(true)
    try {
      const token = await readyToken()
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: chosenSlug, email: s.d.email, affiliate_ref: affiliateRef, token, lang, customer }),
      })
      const data = await res.json()
      if (data.url) { window.location.href = data.url; return }
      setPayError(data.error || f.errCheckout)
    } catch { setPayError(t.errNetwork) }
    setBusy(false)
  }

  const europanActive = s.pay === 'europan' && preview?.fullyCovered
  const total = europanActive && preview ? preview.finalTotal : price
  const ugPrice = PRODUCTS.find(p => p.slug === FORMATION_SLUGS.ug)!.price as number
  const gmbhPrice = PRODUCTS.find(p => p.slug === FORMATION_SLUGS.gmbh)!.price as number
  const rows: Rows = [{ label: f.packageRow, value: money(price, lang) }]
  s.extras.forEach(i => { if (chosen.addons[i]) rows.push({ label: chosen.addons[i], value: i >= HOSTING_ADDON_START ? f.hostingPrice : f.extraPrice }) })
  if (domainFull) rows.push({ label: `${f.domainRow}: ${domainFull}`, value: `${money(domainPrice(domainTld), lang)}${f.domainYear}` })
  if (europanActive) rows.push({ label: f.advantage, value: `− ${money(price - total, lang)}`, minus: true })
  // Erste Seite der gemeinsamen Kachel: noch keine Rechtsform gewaehlt, also beide Preise zeigen
  const overview = s.step === 0 && shown.card ? shown.card : null
  const summary: Summary = overview ? {
    title: overview.name,
    chip: f.formHint,
    rows: [{ label: 'UG', value: money(ugPrice, lang) }, { label: 'GmbH', value: money(gmbhPrice, lang) }],
    totalLabel: f.priceFromLabel, total: money(ugPrice, lang),
    note: overview.priceNote ?? '',
  } : {
    title: chosen.name,
    chip: `${f.steps[1]}: ${s.form === 'ug' ? 'UG' : 'GmbH'}`,
    rows, totalLabel: f.totalLabel, total: money(total, lang),
    note: `${chosen.priceNote ?? (lang === 'de' ? 'Zzgl. etwaiger Behörden- und Notargebühren.' : 'Plus any government and notary fees.')}${europanActive ? ` ${f.paidEuropan}` : ''}`,
  }

  const pickButton = (form: LegalForm, label: string) => (
    <button type="button" id={`pick-${form}`} className="ofl-pick" aria-pressed={s.form === form} onClick={() => patch({ form })}>{s.form === form ? f.chosen : label}</button>
  )

  return (
    <Shell lang={lang} slug={slug} steps={f.steps} step={s.step} goTo={goTo} summary={summary} affiliateRef={affiliateRef}
      side={<BalanceWidget embedded slug={chosenSlug} price={price} productName={chosenDe.name} affiliateRef={affiliateRef} lang={lang} customer={customer} onPriceUpdate={setPreview} onNoblePayment={r => { setPaid(r); clear(); goTo(5) }} />}>
      {s.step === 0 && <>
        <Hero product={shown} />
        <div className="ofl-head">
          <span className="ofl-eyebrow">{shown.flag} {shown.category}</span>
          <h1 className="ofl-h1" tabIndex={-1}>{shown.card?.name ?? shown.name}</h1>
          <p className="ofl-lead">{shown.card?.lead ?? shown.shortDesc}</p>
          <p style={{ fontWeight: 600, color: 'var(--navy)' }}>{f.formHint}</p>
        </div>
        <section className="ofl-sec"><h2 className="ofl-h2">{t.included}</h2><Bullets items={shown.card?.included ?? shown.included} kind="yes" /></section>
        <section className="ofl-sec"><h2 className="ofl-h2">{t.notIncluded}</h2><Bullets items={shown.notIncluded} kind="no" /></section>
        {shown.addons.length > 0 && <section className="ofl-sec"><h2 className="ofl-h2">{t.addons}</h2><Bullets items={shown.card?.addons ?? shown.addons} kind="plus" /></section>}
        <section className="ofl-sec"><h2 className="ofl-h2">{t.process}</h2><Steps items={shown.process} /></section>
        <div className="ofl-hint"><strong>{t.hint}</strong> {shown.card?.hint ?? shown.hint}</div>
        <p className="ofl-note">{f.europanBox}</p>
        <Actions t={t} onNext={() => goTo(1)} nextLabel={f.nextForm} />
        <Related product={shown} lang={lang} />
      </>}

      {s.step === 1 && <>
        <div className="ofl-head"><h1 className="ofl-h1" tabIndex={-1}>{f.formTitle}</h1><p className="ofl-lead">{f.formLead}</p></div>
        <table className="ofl-table">
          <thead><tr>
            <th aria-hidden="true" />
            <th className={s.form === 'ug' ? 'sel' : ''}><span className="ofl-tname">UG</span><span className="ofl-tprice">{money(ugPrice, lang)}</span>{pickButton('ug', f.chooseUg)}</th>
            <th className={s.form === 'gmbh' ? 'sel' : ''}><span className="ofl-tname">GmbH</span><span className="ofl-tprice">{money(gmbhPrice, lang)}</span>{pickButton('gmbh', f.chooseGmbh)}</th>
          </tr></thead>
          <tbody>
            {f.rows.map(r => (
              <tr key={r[0]}><th scope="row">{r[0]}</th><td className={s.form === 'ug' ? 'sel' : ''}>{r[1]}</td><td className={s.form === 'gmbh' ? 'sel' : ''}>{r[2]}</td></tr>
            ))}
          </tbody>
        </table>
        <Actions t={t} onBack={() => goTo(0)} onNext={() => goTo(2)} nextLabel={f.nextExtras} />
      </>}

      {s.step === 2 && <>
        <div className="ofl-head"><h1 className="ofl-h1" tabIndex={-1}>{f.extrasTitle}</h1><p className="ofl-lead">{f.extrasLead}</p></div>
        <div className="ofl-choices">
          <Card id="extra-none" type="checkbox" checked={s.extras.length === 0} onChange={() => patch({ extras: [] })} title={f.noThanks} price={money(0, lang)} sub={f.noThanksSub} />
          {chosen.addons.slice(0, HOSTING_ADDON_START).map((a, i) => (
            <Card key={a} id={`extra-${i}`} type="checkbox" checked={s.extras.includes(i)} onChange={() => toggleExtra(i)} title={a} price={f.extraPrice} sub={i === 0 ? f.addressSub : f.extraSub} />
          ))}
        </div>
        <section className="ofl-sec">
          <h2 className="ofl-h2">{f.hostingTitle}</h2>
          <p className="ofl-lead">{f.hostingLead}</p>
          <div className="ofl-choices">
            {chosen.addons.slice(HOSTING_ADDON_START).map((a, n) => {
              const i = HOSTING_ADDON_START + n
              return <Card key={a} id={`extra-${i}`} type="checkbox" checked={s.extras.includes(i)} onChange={() => toggleExtra(i)} title={a} price={f.hostingPrice} sub={f.hostingSub} />
            })}
          </div>
          {hostingChosen && (
            <div className="ofl-domain">
              <h3>{f.domainTitle}</h3>
              <p>{f.domainLead}</p>
              <div className="ofl-domain-row">
                <Field id="domainName" label={f.domainName} placeholder={f.domainPlaceholder} value={s.d.domainName} onChange={v => { setDomainMsg(''); set('domainName')(v) }} error={errors.domainName} auto="off" />
                <button type="button" className="ofl-btn" disabled={domainChecking} onClick={checkDomain}>{domainChecking ? f.domainChecking : f.domainCheck}</button>
              </div>
              {domainMsg && <p role="status">{domainMsg}</p>}
              <div className="ofl-choices">
                <Card id="domain-none" name="domain-tld" checked={!domainTld} onChange={() => { setErrors({}); patch({ d: { ...s.d, domainTld: '', domainName: '' } }) }} title={f.domainNone} price={money(0, lang)} sub={f.domainNoneSub} />
                {HOSTING_DOMAIN_TLDS.map(tld => {
                  const state = checkedResults?.[tld]?.available
                  return <Card key={tld} id={`domain-${tld}`} name="domain-tld" checked={domainTld === tld} disabled={state === false} onChange={() => { setErrors({}); patch({ d: { ...s.d, domainTld: tld } }) }} title={`${domainName && isValidDomainName(domainName) ? domainName : ''}.${tld}`} price={`${money(domainPrice(tld), lang)}${f.domainYear}`} sub={checkedResults ? (state === true ? f.domainFree : state === false ? f.domainTaken : f.domainUnknown) : undefined} />
                })}
              </div>
              <p>{f.domainNote}</p>
            </div>
          )}
          <div className="ofl-hint"><strong>{f.hostingAltTitle}</strong> {f.hostingAlt} <a href={`${f.hostingAltUrl}${domainFull ? `&domain=${encodeURIComponent(domainFull)}` : ''}`} target="_blank" rel="noopener noreferrer">{f.hostingAltLink}</a></div>
        </section>
        <Actions t={t} onBack={() => goTo(1)} onNext={() => { if (validateExtras()) goTo(3) }} nextLabel={f.nextData} />
      </>}

      {s.step === 3 && <>
        <div className="ofl-head"><h1 className="ofl-h1" tabIndex={-1}>{f.dataTitle}</h1><p className="ofl-lead">{f.dataLead}</p></div>
        <section className="ofl-sec"><h2 className="ofl-h2">{f.contact}</h2><div className="ofl-form">
          <Field id="firstName" label={f.firstName} req auto="given-name" value={s.d.firstName} onChange={set('firstName')} error={errors.firstName} />
          <Field id="lastName" label={f.lastName} req auto="family-name" value={s.d.lastName} onChange={set('lastName')} error={errors.lastName} />
          <Field id="email" label={f.email} req type="email" auto="email" value={s.d.email} onChange={set('email')} error={errors.email} />
          <Field id="phone" label={f.phone} type="tel" auto="tel" value={s.d.phone} onChange={set('phone')} />
        </div></section>
        <section className="ofl-sec"><h2 className="ofl-h2">{f.billing}</h2><div className="ofl-form">
          <Field id="company" label={f.company} wide auto="organization" value={s.d.company} onChange={set('company')} />
          <Field id="street" label={f.street} req wide auto="street-address" value={s.d.street} onChange={set('street')} error={errors.street} />
          <Field id="postalCode" label={f.postalCode} req auto="postal-code" value={s.d.postalCode} onChange={set('postalCode')} error={errors.postalCode} />
          <Field id="city" label={f.city} req auto="address-level2" value={s.d.city} onChange={set('city')} error={errors.city} />
          <Field id="country" label={f.country} req wide auto="country-name" value={s.d.country} onChange={set('country')} error={errors.country} />
        </div></section>
        <section className="ofl-sec"><h2 className="ofl-h2">{f.newCompany}</h2><div className="ofl-form">
          <Field id="desiredName" label={f.desiredName} wide value={s.d.desiredName} onChange={set('desiredName')} />
        </div></section>
        <Actions t={t} onBack={() => goTo(2)} onNext={() => { if (validateData()) goTo(4) }} nextLabel={f.nextReview} />
      </>}

      {s.step === 4 && <>
        <div className="ofl-head"><h1 className="ofl-h1" tabIndex={-1}>{f.reviewTitle}</h1></div>
        <section className="ofl-sec"><h2 className="ofl-h2">{f.yourOrder}</h2>
          <dl className="ofl-rev">
            <ReviewRow t={t} label={f.package} value={chosen.name} onChange={() => goTo(1)} />
            <ReviewRow t={t} label={f.extra} value={s.extras.length ? s.extras.map(i => chosen.addons[i]).join('\n') : f.none} onChange={() => goTo(2)} />
            {domainFull && <ReviewRow t={t} label={f.domainRow} value={`${domainFull} (${money(domainPrice(domainTld), lang)}${f.domainYear})`} onChange={() => goTo(2)} />}
            <ReviewRow t={t} label={f.contact} value={[`${s.d.firstName} ${s.d.lastName}`, s.d.email, s.d.phone].filter(Boolean).join('\n')} onChange={() => goTo(3)} />
            <ReviewRow t={t} label={f.billingShort} value={[s.d.company, s.d.street, `${s.d.postalCode} ${s.d.city}`, s.d.country].filter(Boolean).join('\n')} onChange={() => goTo(3)} />
            {s.d.desiredName && <ReviewRow t={t} label={f.desiredShort} value={s.d.desiredName} onChange={() => goTo(3)} />}
          </dl>
        </section>
        <section className="ofl-sec"><h2 className="ofl-h2">{f.payTitle}</h2>
          <div className="ofl-choices">
            <Card id="pay-card" name="pay" checked={s.pay === 'card'} onChange={() => patch({ pay: 'card' })} title={f.card} sub={f.cardSub} />
            <Card id="pay-europan" name="pay" checked={s.pay === 'europan'} onChange={() => patch({ pay: 'europan' })} title={f.europan} price={f.europanPr} sub={f.europanSub} />
          </div>
        </section>
        {hasLegal && <section className="ofl-sec">
          <label className="ofl-check" htmlFor="terms">
            <input id="terms" type="checkbox" checked={s.terms} onChange={e => { patch({ terms: e.target.checked }); setErrors({}) }} />
            <span>{f.terms} <a href={LEGAL_LINKS.terms!} target="_blank" rel="noopener">{f.termsLink}</a> {f.termsAnd} <a href={LEGAL_LINKS.withdrawal!} target="_blank" rel="noopener">{f.withdrawalLink}</a> {f.termsEnd}</span>
          </label>
          {errors.terms && <span className="ofl-err">{errors.terms}</span>}
        </section>}
        <p className="ofl-note">{f.privacy} <Link href={t.privacy} target="_blank">{f.privacyLink}</Link>.</p>
        {payError && <span className="ofl-err">{payError}</span>}
        {s.pay === 'card'
          ? <>
              <Actions t={t} onBack={() => goTo(3)} onNext={payCard} disabled={busy} gold nextLabel={busy ? f.loading : `${f.orderBtn} — ${money(price, lang)}`} />
              <p className="ofl-note">{f.cardFine}</p>
            </>
          : <>
              {!preview && <span className="ofl-err">{f.europanLogin}</span>}
              {preview && !preview.fullyCovered && <span className="ofl-err">{f.europanLow}</span>}
              <Actions t={t} onBack={() => goTo(3)} onNext={preview?.fullyCovered ? payEuropan : undefined} disabled={busy} gold nextLabel={busy ? f.loading : `${f.orderBtn} — )(\u00a0${preview ? preview.finalTotal.toLocaleString(t.numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}`} />
              {preview?.fullyCovered && <p className="ofl-note">{f.europanFine}</p>}
            </>}
      </>}

      {s.step === 5 && <>
        <div className="ofl-ok" aria-hidden="true">✓</div>
        <div className="ofl-head">
          <h1 className="ofl-h1" tabIndex={-1}>{f.doneTitle}</h1>
          <p className="ofl-lead">{f.doneThanks} <strong>{chosen.name}</strong>. {f.doneMail}</p>
          <p className="ofl-lead">{f.doneTeam}</p>
          {paid?.order_reference && <p className="ofl-note">{f.reference} {paid.order_reference}</p>}
        </div>
        <section className="ofl-sec"><h2 className="ofl-h2">{f.nextSteps}</h2><Steps items={chosen.process} done={1} /></section>
      </>}
    </Shell>
  )
}

/* ---------- Treuhand: Anfrage ohne Zahlung ---------- */
type TrustState = { step: number; firm: '' | 'existing' | 'new'; variant: '' | 'md' | 'sh' | 'both'; shType: '' | 'natural' | 'legal' | 'foreign'; bankAck: boolean; staff: '' | 'yes' | 'no'; special: '' | 'yes' | 'no'; account: '' | 'digital' | 'branch'; billing: '' | 'monthly' | 'yearly'; d: Record<string, string> }

function trustNeedsSh(v: TrustState['variant']) { return v === 'sh' || v === 'both' }
function trustNeedsMd(v: TrustState['variant']) { return v === 'md' || v === 'both' }

function TrustFlow({ slug, lang }: { slug: string; lang: Lang }) {
  const t = STRINGS[lang], f = t.trust, de = STRINGS.de.trust
  const affiliateRef = useAffiliateRef()
  const { state: s, patch, goTo, clear } = useFlowState<TrustState>(`pan21-order-${slug}`, { step: 0, firm: '', variant: '', shType: '', bankAck: false, staff: '', special: '', account: '', billing: '', d: {} })
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'err'>('idle')
  const [website, setWebsite] = useState('')
  const started = useRef(Date.now())
  const product = productsFor(lang).find(p => p.slug === slug)!
  const productDe = PRODUCTS.find(p => p.slug === slug)!
  const set = (k: string) => (v: string) => patch({ d: { ...s.d, [k]: v } })

  const withMd = trustNeedsMd(s.variant)
  const withSh = trustNeedsSh(s.variant)
  const foreign = withSh && s.shType === 'foreign'
  const monthly = (withMd ? TRUST_MONTHLY.managingDirector : 0) + (withSh && !foreign ? TRUST_MONTHLY.shareholder : 0)

  function fail(e: Errors) { setErrors(e); if (Object.keys(e).length) focusFirstError(); return !Object.keys(e).length }

  function validateProject() {
    const e: Errors = {}
    const need = (k: string, msg: string) => { if (!(s.d[k] || '').trim()) e[k] = msg }
    if (!s.firm) e.firm = f.errFirm
    if (s.firm === 'existing') { need('companyName', f.errCompanyName); need('registerNo', f.errRegisterNo); need('currentPeople', f.errCurrentPeople); need('changeReason', f.errChangeReason) }
    need('activity', f.errActivity)
    if (!s.variant) e.variant = f.errVariant
    if (withSh && !s.shType) e.shType = f.errSh
    if (withMd && !s.bankAck) e.bankAck = f.errBankAck
    if (!s.staff) e.staff = f.errYesNo
    if (s.staff === 'yes') { need('staffCount', f.errStaff); need('staffCost', f.errStaff); need('capital', f.errStaff) }
    if (!s.special) e.special = f.errYesNo
    if (!s.billing) e.billing = f.errPay
    return fail(e)
  }
  function validateContact() {
    const e: Errors = {}
    const need = (k: string, msg: string) => { if (!(s.d[k] || '').trim()) e[k] = msg }
    need('name', f.errName)
    if (!mailOk(s.d.email)) e.email = t.errEmail
    need('street', f.errStreet); need('postalCode', f.errPostalCode); need('city', f.errCity); need('country', f.errCountry)
    return fail(e)
  }

  // Die Anfrage-Mail geht an das deutschsprachige Team und ist deshalb immer deutsch beschriftet.
  function buildMessage() {
    const lines: string[] = []
    const add = (label: string, value?: string) => { if (value && value.trim()) lines.push(`${label}: ${value.trim()}`) }
    add(de.firm, s.firm === 'existing' ? de.firmExisting : de.firmNew)
    if (s.firm === 'existing') { add(de.companyName, s.d.companyName); add(de.registerNo, s.d.registerNo); add(de.currentPeople, s.d.currentPeople); add(de.changeReason, s.d.changeReason) }
    else add('Wunsch-Firmenname', s.d.desiredName)
    add(de.activityShort, s.d.activity)
    if (s.variant) add(de.variant, de.variants[s.variant])
    if (s.shType) add(de.shareholder, de.shTypes[s.shType])
    if (withMd) add('Alleiniger Kontozugriff', 'zur Kenntnis genommen')
    add(de.staff, s.staff === 'yes' ? de.yes : de.no)
    if (s.staff === 'yes') { add(de.staffCount, s.d.staffCount); add(de.staffCost, s.d.staffCost); add(de.capital, s.d.capital) }
    add(de.special, s.special === 'yes' ? de.yes : de.no)
    add(de.account, s.account ? `${de.accounts[s.account]} (${TRUST_ACCOUNT_FEE[s.account]} € pauschal)` : de.notWanted)
    add(de.payment, s.billing === 'yearly' ? `${de.payYearly} (${de.payYearlySub})` : de.payMonthly)
    add(de.billingShort, [s.d.street, `${s.d.postalCode} ${s.d.city}`, s.d.country].join(', '))
    add(de.situationShort, s.d.situation)
    return lines.join('\n')
  }

  async function send() {
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: s.d.name, email: s.d.email, phone: s.d.tel, interest: productDe.name, message: buildMessage(), elapsed: Date.now() - started.current, inquiry: true, website }),
      })
      if (!res.ok) { setStatus('err'); return }
      clear(); setStatus('idle'); goTo(4)
    } catch { setStatus('err') }
  }

  const rows: Rows = [{ label: f.preCheck, value: f.free }]
  if (!s.variant || withMd) rows.push({ label: f.mdRow, value: perMonth(TRUST_MONTHLY.managingDirector, lang) })
  if (!s.variant || withSh) rows.push({ label: f.shRow, value: foreign ? f.byCountry : perMonth(TRUST_MONTHLY.shareholder, lang) })
  if (s.account) rows.push({ label: f.accounts[s.account], value: flatFee(TRUST_ACCOUNT_FEE[s.account], lang) })
  const later = s.variant && monthly > 0
    ? (s.billing === 'yearly'
        ? { label: f.laterYear, value: money(monthly * TRUST_PAID_MONTHS_PER_YEAR, lang) }
        : { label: f.laterMonth, value: money(monthly, lang) })
    : undefined
  const chip = s.variant ? [f.variants[s.variant], s.shType ? f.shTypes[s.shType] : ''].filter(Boolean).join(' · ') : f.chipDefault
  const summary: Summary = { title: product.name, chip, rows, totalLabel: f.todayLabel, total: money(0, lang), later, note: f.sumNote }

  const yesNo = (key: 'staff' | 'special') => (
    <div className="ofl-choices">
      <Card id={`${key}-yes`} name={key} checked={s[key] === 'yes'} onChange={() => { patch({ [key]: 'yes' } as Partial<TrustState>); setErrors(({ [key]: _, ...r }) => r) }} title={f.yes} />
      <Card id={`${key}-no`} name={key} checked={s[key] === 'no'} onChange={() => { patch({ [key]: 'no' } as Partial<TrustState>); setErrors(({ [key]: _, ...r }) => r) }} title={f.no} />
    </div>
  )

  return (
    <Shell lang={lang} slug={slug} steps={f.steps} step={s.step} goTo={goTo} summary={summary} affiliateRef={affiliateRef}
      side={s.variant && monthly === 0
        ? <p className="ofl-note ofl-side-note">{f.europanCountry}</p>
        : <BalanceWidget embedded note={f.europanNote} slug={slug} price={(monthly || TRUST_MONTHLY.managingDirector) * (s.billing === 'yearly' ? TRUST_PAID_MONTHS_PER_YEAR : 1)} productName={productDe.name} affiliateRef={affiliateRef} lang={lang} />}>
      {s.step === 0 && <>
        <Hero product={product} />
        <div className="ofl-head">
          <span className="ofl-eyebrow">{f.eyebrow}</span>
          <h1 className="ofl-h1" tabIndex={-1}>{product.name}</h1>
          <p className="ofl-lead">{product.shortDesc}</p>
          {product.priceLabel && <p style={{ fontWeight: 600, color: 'var(--navy)' }}>{product.priceLabel}</p>}
        </div>
        <section className="ofl-sec"><h2 className="ofl-h2">{f.variantsTitle}</h2><Bullets items={f.variantsList} kind="dot" /><p className="ofl-note">{f.variantsNote}</p></section>
        <section className="ofl-sec"><h2 className="ofl-h2">{f.whoTitle}</h2><p className="ofl-lead">{f.whoLead}</p><Bullets items={f.whoList} kind="yes" /><p className="ofl-note">{f.whoEnd}</p></section>
        <section className="ofl-sec"><h2 className="ofl-h2">{f.bankTitle}</h2><p className="ofl-lead">{f.bankText}</p></section>
        <section className="ofl-sec"><h2 className="ofl-h2">{t.included}</h2><Bullets items={product.included} kind="yes" /></section>
        <section className="ofl-sec"><h2 className="ofl-h2">{t.notOffered}</h2><Bullets items={product.notIncluded} kind="no" /></section>
        {product.addons.length > 0 && <section className="ofl-sec"><h2 className="ofl-h2">{t.addons}</h2><Bullets items={product.addons} kind="plus" /></section>}
        <section className="ofl-sec"><h2 className="ofl-h2">{t.process}</h2><Steps items={product.process} /></section>
        <section className="ofl-sec"><h2 className="ofl-h2">{f.termsTitle}</h2><Bullets items={f.termsList} kind="dot" /></section>
        <div className="ofl-hint"><strong>{t.hint}</strong> {product.hint}</div>
        <Actions t={t} onNext={() => goTo(1)} nextLabel={f.nextProject} />
        <Related product={product} lang={lang} />
      </>}

      {s.step === 1 && <>
        <div className="ofl-head"><h1 className="ofl-h1" tabIndex={-1}>{f.projectTitle}</h1><p className="ofl-lead">{f.projectLead}</p></div>
        <section className="ofl-sec"><h2 className="ofl-h2">{f.firmTitle}</h2>
          <div className="ofl-choices">
            <Card id="firm-existing" name="firm" checked={s.firm === 'existing'} onChange={() => { patch({ firm: 'existing' }); setErrors(({ firm, ...r }) => r) }} title={f.firmExisting} />
            <Card id="firm-new" name="firm" checked={s.firm === 'new'} onChange={() => { patch({ firm: 'new' }); setErrors(({ firm, ...r }) => r) }} title={f.firmNew} />
          </div>
          {errors.firm && <span className="ofl-err">{errors.firm}</span>}
          {s.firm === 'existing' && <div className="ofl-form">
            <Field id="companyName" label={f.companyName} req value={s.d.companyName} onChange={set('companyName')} error={errors.companyName} />
            <Field id="registerNo" label={f.registerNo} req value={s.d.registerNo} onChange={set('registerNo')} error={errors.registerNo} />
            <Field id="currentPeople" label={f.currentPeople} req wide area value={s.d.currentPeople} onChange={set('currentPeople')} error={errors.currentPeople} />
            <Field id="changeReason" label={f.changeReason} req wide area value={s.d.changeReason} onChange={set('changeReason')} error={errors.changeReason} />
          </div>}
          {s.firm === 'new' && <div className="ofl-form">
            <Field id="desiredName" label={f.desiredName} wide value={s.d.desiredName} onChange={set('desiredName')} />
          </div>}
        </section>
        <div className="ofl-form"><Field id="activity" label={f.activity} req wide area value={s.d.activity} onChange={set('activity')} error={errors.activity} /></div>

        <section className="ofl-sec"><h2 className="ofl-h2">{f.variantTitle}</h2>
          <div className="ofl-choices">
            {(['md', 'sh', 'both'] as const).map(v => (
              <Card key={v} id={`variant-${v}`} name="variant" checked={s.variant === v} onChange={() => { patch({ variant: v, shType: trustNeedsSh(v) ? s.shType : '', bankAck: trustNeedsMd(v) ? s.bankAck : false }); setErrors(({ variant, ...r }) => r) }} title={f.variants[v]} />
            ))}
          </div>
          {errors.variant && <span className="ofl-err">{errors.variant}</span>}
        </section>
        {withSh && <section className="ofl-sec"><h2 className="ofl-h2">{f.shTitle}</h2>
          <div className="ofl-choices">
            {(['natural', 'legal', 'foreign'] as const).map(v => (
              <Card key={v} id={`sh-${v}`} name="shType" checked={s.shType === v} onChange={() => { patch({ shType: v }); setErrors(({ shType, ...r }) => r) }} title={f.shTypes[v]} price={v === 'foreign' ? f.shForeignPr : undefined} />
            ))}
          </div>
          {errors.shType && <span className="ofl-err">{errors.shType}</span>}
        </section>}
        {withMd && <section className="ofl-sec">
          <label className="ofl-check" htmlFor="bankAck">
            <input id="bankAck" type="checkbox" checked={s.bankAck} onChange={e => { patch({ bankAck: e.target.checked }); setErrors(({ bankAck, ...r }) => r) }} />
            <span>{f.bankAck}</span>
          </label>
          {errors.bankAck && <span className="ofl-err">{errors.bankAck}</span>}
        </section>}

        <section className="ofl-sec"><h2 className="ofl-h2">{f.staffTitle}</h2><p className="ofl-note">{f.staffNote}</p>{yesNo('staff')}
          {errors.staff && <span className="ofl-err">{errors.staff}</span>}
          {s.staff === 'yes' && <div className="ofl-form">
            <Field id="staffCount" label={f.staffCount} req value={s.d.staffCount} onChange={set('staffCount')} error={errors.staffCount} />
            <Field id="capital" label={f.capital} req value={s.d.capital} onChange={set('capital')} error={errors.capital} />
            <Field id="staffCost" label={f.staffCost} req wide value={s.d.staffCost} onChange={set('staffCost')} error={errors.staffCost} />
          </div>}
        </section>
        <section className="ofl-sec"><h2 className="ofl-h2">{f.specialTitle}</h2><p className="ofl-note">{f.specialNote}</p>{yesNo('special')}
          {errors.special && <span className="ofl-err">{errors.special}</span>}
        </section>

        <section className="ofl-sec"><h2 className="ofl-h2">{f.accountTitle}</h2><p className="ofl-note">{f.accountNote}</p><p className="ofl-note">{f.accountView}</p>
          <div className="ofl-choices">
            <Card id="account-none" name="account" checked={!s.account} onChange={() => patch({ account: '' })} title={f.accountNone} price={money(0, lang)} />
            {(['digital', 'branch'] as const).map(a => (
              <Card key={a} id={`account-${a}`} name="account" checked={s.account === a} onChange={() => patch({ account: a })} title={f.accounts[a]} price={flatFee(TRUST_ACCOUNT_FEE[a], lang)} />
            ))}
          </div>
        </section>
        <section className="ofl-sec"><h2 className="ofl-h2">{f.payTitle}</h2>
          <div className="ofl-choices">
            <Card id="billing-monthly" name="billing" checked={s.billing === 'monthly'} onChange={() => { patch({ billing: 'monthly' }); setErrors(({ billing, ...r }) => r) }} title={f.payMonthly} />
            <Card id="billing-yearly" name="billing" checked={s.billing === 'yearly'} onChange={() => { patch({ billing: 'yearly' }); setErrors(({ billing, ...r }) => r) }} title={f.payYearly} sub={f.payYearlySub} />
          </div>
          {errors.billing && <span className="ofl-err">{errors.billing}</span>}
        </section>
        <div className="ofl-form"><Field id="situation" label={f.situation} wide area placeholder={f.situationPh} value={s.d.situation} onChange={set('situation')} /></div>
        <Actions t={t} onBack={() => goTo(0)} onNext={() => { if (validateProject()) goTo(2) }} nextLabel={f.nextContact} />
      </>}

      {s.step === 2 && <>
        <div className="ofl-head"><h1 className="ofl-h1" tabIndex={-1}>{f.contactTitle}</h1><p className="ofl-lead">{f.contactLead}</p></div>
        <div className="hp-field"><input type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} /></div>
        <div className="ofl-form">
          <Field id="name" label={f.name} req wide auto="name" placeholder={f.namePh} value={s.d.name} onChange={set('name')} error={errors.name} />
          <Field id="email" label={f.email} req type="email" auto="email" placeholder={f.emailPh} value={s.d.email} onChange={set('email')} error={errors.email} />
          <Field id="tel" label={f.phone} type="tel" auto="tel" placeholder={f.phonePh} value={s.d.tel} onChange={set('tel')} />
        </div>
        <section className="ofl-sec"><h2 className="ofl-h2">{f.billing}</h2><div className="ofl-form">
          <Field id="street" label={f.street} req wide auto="street-address" value={s.d.street} onChange={set('street')} error={errors.street} />
          <Field id="postalCode" label={f.postalCode} req auto="postal-code" value={s.d.postalCode} onChange={set('postalCode')} error={errors.postalCode} />
          <Field id="city" label={f.city} req auto="address-level2" value={s.d.city} onChange={set('city')} error={errors.city} />
          <Field id="country" label={f.country} req wide auto="country-name" value={s.d.country} onChange={set('country')} error={errors.country} />
        </div></section>
        <Actions t={t} onBack={() => goTo(1)} onNext={() => { if (validateContact()) goTo(3) }} nextLabel={f.nextReview} />
      </>}

      {s.step === 3 && <>
        <div className="ofl-head"><h1 className="ofl-h1" tabIndex={-1}>{f.reviewTitle}</h1></div>
        <dl className="ofl-rev">
          <ReviewRow t={t} label={f.offer} value={product.name} />
          <ReviewRow t={t} label={f.firm} value={s.firm === 'existing' ? [f.firmExisting, s.d.companyName, s.d.registerNo].filter(Boolean).join('\n') : [f.firmNew, s.d.desiredName].filter(Boolean).join('\n')} onChange={() => goTo(1)} />
          <ReviewRow t={t} label={f.activityShort} value={s.d.activity} onChange={() => goTo(1)} />
          <ReviewRow t={t} label={f.variant} value={s.variant ? f.variants[s.variant] : ''} onChange={() => goTo(1)} />
          {s.shType && <ReviewRow t={t} label={f.shareholder} value={f.shTypes[s.shType]} onChange={() => goTo(1)} />}
          <ReviewRow t={t} label={f.staff} value={s.staff === 'yes' ? [f.yes, `${f.staffCount}: ${s.d.staffCount}`, `${f.staffCost}: ${s.d.staffCost}`, `${f.capital}: ${s.d.capital}`].join('\n') : f.no} onChange={() => goTo(1)} />
          <ReviewRow t={t} label={f.special} value={s.special === 'yes' ? f.yes : f.no} onChange={() => goTo(1)} />
          <ReviewRow t={t} label={f.account} value={s.account ? `${f.accounts[s.account]}: ${flatFee(TRUST_ACCOUNT_FEE[s.account], lang)}` : f.notWanted} onChange={() => goTo(1)} />
          <ReviewRow t={t} label={f.payment} value={s.billing === 'yearly' ? `${f.payYearly} (${f.payYearlySub})` : f.payMonthly} onChange={() => goTo(1)} />
          <ReviewRow t={t} label={f.situationShort} value={s.d.situation || f.noEntry} onChange={() => goTo(1)} />
          <ReviewRow t={t} label={f.contact} value={[s.d.name, s.d.email, s.d.tel].filter(Boolean).join('\n')} onChange={() => goTo(2)} />
          <ReviewRow t={t} label={f.billingShort} value={[s.d.street, `${s.d.postalCode} ${s.d.city}`, s.d.country].join('\n')} onChange={() => goTo(2)} />
        </dl>
        <div className="ofl-hint"><strong>{f.notOrder}</strong> {f.notOrderText}</div>
        <p className="ofl-note">{f.privacy} <Link href={t.privacy} target="_blank">{f.privacyLink}</Link>.</p>
        {status === 'err' && <span className="ofl-err">{f.errSend}</span>}
        <Actions t={t} onBack={() => goTo(2)} onNext={send} gold disabled={status === 'sending'} nextLabel={status === 'sending' ? f.sending : f.send} />
      </>}

      {s.step === 4 && <>
        <div className="ofl-ok" aria-hidden="true">✓</div>
        <div className="ofl-head"><h1 className="ofl-h1" tabIndex={-1}>{f.doneTitle}</h1><p className="ofl-lead">{f.doneText}</p></div>
        <section className="ofl-sec"><h2 className="ofl-h2">{f.nextSteps}</h2><Steps items={product.process} done={1} /></section>
      </>}
    </Shell>
  )
}

export function OrderFlow({ slug, lang }: { slug: string; lang: Lang }) {
  return slug === TRUST_SLUG ? <TrustFlow slug={slug} lang={lang} /> : <FormationFlow slug={slug} lang={lang} />
}
