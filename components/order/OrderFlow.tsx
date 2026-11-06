'use client'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { PRODUCTS, type Product } from '@/lib/products'
import { PRODUCTS_EN } from '@/lib/products.en'
import { BalanceWidget } from '@/components/BalanceWidget'
import { orderExtras, extrasTotal, hasRecurring } from '@/lib/orderExtras'
import { HOSTING_DOMAIN_PRICES, HOSTING_DOMAIN_TLDS, cleanDomainName, isValidDomainName, FORMATION_SLUGS, LEGAL_LINKS, TRUST_ACCOUNT_FEE, TRUST_MONTHLY, TRUST_PAID_MONTHS_PER_YEAR, TRUST_SLUG, HOSTING_ADDON_START, PHONE_ADDON_START, type LegalForm } from '@/lib/orderFlow'
import { STRINGS, type Lang } from './strings'
import { UkFlow } from './UkFlow'
import { UsFlow } from './UsFlow'
import { isUkSlug, isUsSlug } from '@/lib/orderFlow'
import { Actions, Bullets, Card, Errors, Field, Hero, Related, ReviewRow, Rows, Shell, Steps, Summary, flatFee, focusFirstError, mailOk, money, perMonth, productsFor, useAffiliateRef, useFlowState } from './parts'
import '@/app/globals.css'
import './order.css'

/* ---------- Gruendung: UG und GmbH ---------- */
type DomainResults = Record<string, { available: boolean | null; price: number | null }>
type TrustChoice = 'none' | 'md' | 'sh' | 'both'
type FormationState = { step: number; form: LegalForm; extras: number[]; pay: 'card' | 'europan'; terms: boolean; d: Record<string, string>; trust: TrustChoice; shType: '' | 'natural' | 'legal' | 'foreign'; bankAck: boolean; account: '' | 'digital' | 'branch'; billing: 'monthly' | 'yearly'; seriesLlc?: boolean }

function FormationFlow({ slug, lang }: { slug: string; lang: Lang }) {
  const t = STRINGS[lang], f = t.formation, ft = t.trust, ftDe = STRINGS.de.trust
  const affiliateRef = useAffiliateRef()
  const startForm: LegalForm = slug === FORMATION_SLUGS.gmbh ? 'gmbh' : 'ug'
  const { state: s, patch, goTo, clear } = useFlowState<FormationState>(`pan21-order-${slug}`, { step: 0, form: startForm, extras: [], pay: 'card', terms: false, d: {}, trust: 'none', shType: '', bankAck: false, account: '', billing: 'monthly' })
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
  // Von den Telefon-Varianten ist nur eine waehlbar: Die neue ersetzt die bisherige.
  const toggleExtra = (i: number) => patch({ extras: s.extras.includes(i) ? s.extras.filter(x => x !== i) : [...s.extras.filter(x => i < PHONE_ADDON_START || x < PHONE_ADDON_START), i] })

  async function loadToken(forSlug: string) {
    const res = await fetch(`/api/checkout-token?slug=${encodeURIComponent(forSlug)}`)
    const data = await res.json()
    if (!data.token) throw new Error('token')
    tokenRef.current = { slug: forSlug, at: Date.now(), token: data.token }
  }

  // Der Schluessel laeuft nach 15 Minuten ab und gilt erst nach 3 Sekunden.
  // Deshalb wird er beim Betreten der Pruefseite geholt und vor dem Bezahlen geprueft.
  useEffect(() => {
    if (s.step === 5) loadToken(chosenSlug).catch(() => {})
  }, [s.step, chosenSlug])

  async function readyToken(): Promise<string> {
    const cur = tokenRef.current
    if (!cur || cur.slug !== chosenSlug || Date.now() - cur.at > 14 * 60 * 1000) await loadToken(chosenSlug)
    const age = Date.now() - tokenRef.current!.at
    if (age < 3200) await new Promise(r => setTimeout(r, 3200 - age))
    return tokenRef.current!.token
  }

  const extrasDe = [...(s.seriesLlc && s.trust !== 'sh' && s.trust !== 'both' ? ['Amerikanische Series LLC als Gesellschafter (49 € einmalig)'] : []), ...s.extras.map(i => chosenDe.addons[i]).filter(Boolean)].join('; ')
  const hostingChosen = s.extras.includes(HOSTING_ADDON_START)
  const domainName = cleanDomainName(s.d.domainName || '')
  const domainTld = s.d.domainTld || ''
  const checkedResults = domainCheck && domainCheck.name === domainName ? domainCheck.results : null
  // Immer der feste Preis aus lib/orderFlow.ts, damit Anzeige und Abbuchung uebereinstimmen
  const domainPrice = (tld: string) => HOSTING_DOMAIN_PRICES[tld]
  const domainFull = hostingChosen && domainTld && isValidDomainName(domainName) ? `${domainName}.${domainTld}` : ''
  // Auswahl fuer Checkout und EUROPAN; die Preise rechnet der Server mit lib/orderExtras.ts nach
  const order = { extras: s.extras, domainTld: domainFull ? domainTld : '', seriesLlc: !!s.seriesLlc && s.trust !== 'sh' && s.trust !== 'both' }
  const extraItems = orderExtras(chosenSlug, order)
  const payable = Math.round(((chosen.price as number) + extrasTotal(extraItems)) * 100) / 100

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
  // Treuhand: Wer selbst Geschaeftsfuehrer wird, bekommt keine Kontoeroeffnung ueber uns.
  const withMd = s.trust === 'md' || s.trust === 'both'
  const withSh = s.trust === 'sh' || s.trust === 'both'
  const shPrice = s.shType === 'foreign' ? ft.byCountry : perMonth(TRUST_MONTHLY.shareholder, lang)
  function chooseTrust(v: TrustChoice) {
    const md = v === 'md' || v === 'both', sh = v === 'sh' || v === 'both'
    setErrors({})
    patch({ trust: v, seriesLlc: sh ? false : s.seriesLlc, shType: sh ? s.shType : '', bankAck: md ? s.bankAck : false, account: md ? s.account : '', billing: v === 'none' ? 'monthly' : s.billing })
  }
  function validateTrust(): boolean {
    const e: Errors = {}
    if (withSh && !s.shType) e.shType = ft.errSh
    if (withMd && !s.bankAck) e.bankAck = ft.errBankAck
    setErrors(e)
    if (Object.keys(e).length) focusFirstError()
    return !Object.keys(e).length
  }
  // Die Bestellmail geht an das deutschsprachige Team und ist deshalb immer deutsch beschriftet.
  const trustDe = s.trust === 'none' ? undefined : [
    ftDe.variants[s.trust],
    s.shType ? `${ftDe.shareholder}: ${ftDe.shTypes[s.shType]}` : '',
    withMd ? 'Alleiniger Kontozugriff zur Kenntnis genommen' : '',
    withMd ? (s.account ? `${ftDe.accounts[s.account]} (${TRUST_ACCOUNT_FEE[s.account]} € pauschal)` : `${ftDe.account}: ${ftDe.notWanted}`) : '',
    `${ftDe.payment}: ${s.billing === 'yearly' ? `${ftDe.payYearly} (${ftDe.payYearlySub})` : ftDe.payMonthly}`,
  ].filter(Boolean).join('; ')
  const trustLines = s.trust === 'none' ? [f.trustNone] : [
    ft.variants[s.trust],
    s.shType ? `${ft.shareholder}: ${ft.shTypes[s.shType]}` : '',
    withMd ? (s.account ? `${ft.accounts[s.account]}: ${flatFee(TRUST_ACCOUNT_FEE[s.account], lang)}` : `${ft.account}: ${ft.notWanted}`) : '',
    `${ft.payment}: ${s.billing === 'yearly' ? `${ft.payYearly} (${ft.payYearlySub})` : ft.payMonthly}`,
  ].filter(Boolean)
  const customer = { firstName: s.d.firstName, lastName: s.d.lastName, contactEmail: s.d.email, phone: s.d.phone, company: s.d.company, street: s.d.street, postalCode: s.d.postalCode, city: s.d.city, country: s.d.country, desiredName: s.d.desiredName, extras: extrasDe, domain: domainFull ? `${domainFull} (${money(domainPrice(domainTld), 'de')} pro Jahr)` : undefined, trust: trustDe }

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
        body: JSON.stringify({ slug: chosenSlug, email: s.d.email, affiliate_ref: affiliateRef, token, lang, customer, order }),
      })
      const data = await res.json()
      if (data.url) { window.location.href = data.url; return }
      setPayError(data.error || f.errCheckout)
    } catch { setPayError(t.errNetwork) }
    setBusy(false)
  }

  const europanActive = s.pay === 'europan' && preview?.fullyCovered
  const total = europanActive && preview ? preview.finalTotal : payable
  const ugPrice = PRODUCTS.find(p => p.slug === FORMATION_SLUGS.ug)!.price as number
  const gmbhPrice = PRODUCTS.find(p => p.slug === FORMATION_SLUGS.gmbh)!.price as number
  const rows: Rows = [{ label: f.packageRow, value: money(price, lang) }]
  extraItems.forEach(item => rows.push({ label: lang === 'en' ? item.en : item.de, value: money(item.amount, lang) }))
  if (withMd) rows.push({ label: `${f.trustRow}: ${ft.mdRow}`, value: perMonth(TRUST_MONTHLY.managingDirector, lang) })
  if (withSh) rows.push({ label: `${f.trustRow}: ${ft.shRow}`, value: shPrice })
  if (withMd && s.account) rows.push({ label: ft.accounts[s.account], value: flatFee(TRUST_ACCOUNT_FEE[s.account], lang) })
  if (europanActive) rows.push({ label: f.advantage, value: `− ${money(payable - total, lang)}`, minus: true })
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
    note: `${chosen.priceNote ?? (lang === 'de' ? 'Zzgl. etwaiger Behörden- und Notargebühren.' : 'Plus any government and notary fees.')}${europanActive ? ` ${f.paidEuropan}` : ''}${s.trust !== 'none' ? ` ${f.notInTotal}` : ''}${hasRecurring(extraItems) ? ` ${f.recurringLater}` : ''}`,
  }

  const pickButton = (form: LegalForm, label: string) => (
    <button type="button" id={`pick-${form}`} className="ofl-pick" aria-pressed={s.form === form} onClick={() => patch({ form })}>{s.form === form ? f.chosen : label}</button>
  )

  return (
    <Shell lang={lang} slug={slug} steps={f.steps} step={s.step} goTo={goTo} summary={summary} affiliateRef={affiliateRef}
      side={<BalanceWidget embedded slug={chosenSlug} price={payable} productName={chosenDe.name} affiliateRef={affiliateRef} lang={lang} customer={customer} order={order} onPriceUpdate={setPreview} onNoblePayment={r => { setPaid(r); clear(); goTo(6) }} />}>
      {s.step === 0 && <>
        {f.bannerSrc ? <img className="ofl-photo" src={f.bannerSrc} alt={f.bannerAlt} width={1945} height={809} /> : <Hero product={shown} />}
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
        {f.europanBannerSrc && <a href={f.europanBannerHref} target="_blank" rel="noopener" style={{ display: 'block' }}><img className="ofl-photo" src={f.europanBannerSrc} alt={f.europanBannerAlt} width={1942} height={809} loading="lazy" /></a>}
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
        <Actions t={t} onBack={() => goTo(0)} onNext={() => goTo(2)} nextLabel={f.nextTrust} />
        <a href={f.altBannerHref} target="_blank" rel="noopener" style={{ display: 'block' }}><img className="ofl-photo" src={f.altBannerSrc} alt={f.altBannerAlt} width={1945} height={808} loading="lazy" /></a>
      </>}

      {s.step === 2 && <>
        <div className="ofl-head"><h1 className="ofl-h1" tabIndex={-1}>{f.trustTitle}</h1><p className="ofl-lead">{f.trustLead}</p></div>
        <img className="ofl-photo" src="/hero/treuhand-handschlag.jpg" alt={f.trustImageAlt} width={1672} height={941} />
        <section className="ofl-sec"><h2 className="ofl-h2">{f.trustChoice}</h2>
          <div className="ofl-choices">
            <Card id="trust-none" name="trust" checked={s.trust === 'none'} onChange={() => chooseTrust('none')} title={f.trustNone} price={money(0, lang)} sub={f.trustNoneSub} />
            <Card id="trust-md" name="trust" checked={s.trust === 'md'} onChange={() => chooseTrust('md')} title={f.trustMd} price={perMonth(TRUST_MONTHLY.managingDirector, lang)} sub={f.trustMdSub} />
            <Card id="trust-sh" name="trust" checked={s.trust === 'sh'} onChange={() => chooseTrust('sh')} title={f.trustSh} price={perMonth(TRUST_MONTHLY.shareholder, lang)} sub={f.trustShSub} />
            <Card id="trust-both" name="trust" checked={s.trust === 'both'} onChange={() => chooseTrust('both')} title={f.trustBoth} price={perMonth(TRUST_MONTHLY.managingDirector + TRUST_MONTHLY.shareholder, lang)} sub={f.trustBothSub} />
          </div>
        </section>
        {withSh && <section className="ofl-sec"><h2 className="ofl-h2">{ft.shTitle}</h2>
          <div className="ofl-choices">
            {(['natural', 'legal', 'foreign'] as const).map(v => (
              <Card key={v} id={`sh-${v}`} name="shType" checked={s.shType === v} onChange={() => { patch({ shType: v }); setErrors(({ shType, ...r }) => r) }} title={ft.shTypes[v]} price={v === 'foreign' ? ft.shForeignPr : undefined} />
            ))}
          </div>
          {errors.shType && <span className="ofl-err">{errors.shType}</span>}
        </section>}
        {withMd && <section className="ofl-sec"><h2 className="ofl-h2">{ft.bankTitle}</h2><p className="ofl-lead">{ft.bankText}</p>
          <label className="ofl-check" htmlFor="bankAck">
            <input id="bankAck" type="checkbox" checked={s.bankAck} onChange={e => { patch({ bankAck: e.target.checked }); setErrors(({ bankAck, ...r }) => r) }} />
            <span>{ft.bankAck}</span>
          </label>
          {errors.bankAck && <span className="ofl-err">{errors.bankAck}</span>}
        </section>}
        {withMd && <section className="ofl-sec"><h2 className="ofl-h2">{ft.accountTitle}</h2><p className="ofl-note">{ft.accountNote}</p><p className="ofl-note">{ft.accountView}</p>
          <div className="ofl-choices">
            <Card id="account-none" name="account" checked={!s.account} onChange={() => patch({ account: '' })} title={ft.accountNone} price={money(0, lang)} />
            {(['digital', 'branch'] as const).map(a => (
              <Card key={a} id={`account-${a}`} name="account" checked={s.account === a} onChange={() => patch({ account: a })} title={ft.accounts[a]} price={flatFee(TRUST_ACCOUNT_FEE[a], lang)} />
            ))}
          </div>
        </section>}
        {!withMd && <div className="ofl-hint"><strong>{f.trustBankHint}</strong> {f.trustBankOnly}</div>}
        {!withSh && <section className="ofl-sec"><h2 className="ofl-h2">{f.seriesTitle}</h2><p className="ofl-lead">{f.seriesLead}</p>
          <div className="ofl-choices">
            <Card id="series-none" name="seriesLlc" checked={!s.seriesLlc} onChange={() => patch({ seriesLlc: false })} title={f.seriesNone} price={money(0, lang)} sub={f.seriesNoneSub} />
            <Card id="series-yes" name="seriesLlc" checked={!!s.seriesLlc} onChange={() => patch({ seriesLlc: true })} title={f.seriesYes} price={f.seriesPrice} sub={f.seriesYesSub} />
          </div>
          <p className="ofl-note">{f.seriesNote}</p>
          <p className="ofl-note"><a href={f.seriesMoreUrl} target="_blank" rel="noopener">{f.seriesMoreLink}</a></p>
        </section>}
        {s.trust !== 'none' && <section className="ofl-sec"><h2 className="ofl-h2">{ft.payTitle}</h2>
          <div className="ofl-choices">
            <Card id="billing-monthly" name="billing" checked={s.billing === 'monthly'} onChange={() => patch({ billing: 'monthly' })} title={ft.payMonthly} />
            <Card id="billing-yearly" name="billing" checked={s.billing === 'yearly'} onChange={() => patch({ billing: 'yearly' })} title={ft.payYearly} sub={ft.payYearlySub} />
          </div>
        </section>}
        {s.trust !== 'none' && <section className="ofl-sec"><h2 className="ofl-h2">{ft.termsTitle}</h2><Bullets items={ft.termsList} kind="dot" />
          <p className="ofl-note"><Link href={f.trustMoreUrl} target="_blank">{f.trustMoreLink}</Link></p>
        </section>}
        <Actions t={t} onBack={() => goTo(1)} onNext={() => { if (validateTrust()) goTo(3) }} nextLabel={f.nextExtras} />
        <a href={f.trustBannerHref} target="_blank" rel="noopener" style={{ display: 'block' }}><img className="ofl-photo" src={f.trustBannerSrc} alt={f.trustBannerAlt} width={1947} height={808} loading="lazy" /></a>
      </>}

      {s.step === 3 && <>
        <div className="ofl-head"><h1 className="ofl-h1" tabIndex={-1}>{f.extrasTitle}</h1><p className="ofl-lead">{f.extrasLead}</p></div>
        <div className="ofl-choices">
          <Card id="extra-none" type="checkbox" checked={s.extras.length === 0} onChange={() => patch({ extras: [] })} title={f.noThanks} price={money(0, lang)} sub={f.noThanksSub} />
          {chosen.addons.slice(0, HOSTING_ADDON_START).map((a, i) => (
            <Card key={a} id={`extra-${i}`} type="checkbox" checked={s.extras.includes(i)} onChange={() => toggleExtra(i)} title={a} price={i === 0 ? f.addressPrice : f.extraPrice} sub={i === 0 ? f.addressSub : f.extraSub} />
          ))}
        </div>
        <img className="ofl-photo" src="/hero/zusatz-buero.jpg" alt={f.extrasImageAlt} width={1672} height={941} />
        <section className="ofl-sec">
          <h2 className="ofl-h2">{f.hostingTitle}</h2>
          <p className="ofl-lead">{f.hostingLead}</p>
          <div className="ofl-choices">
            {chosen.addons.slice(HOSTING_ADDON_START, PHONE_ADDON_START).map((a, n) => {
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
          <div className="ofl-tools">
            <h3>{f.toolsTitle}</h3>
            <p>{f.toolsLead}</p>
            <ul>
              {f.tools.map(tool => <li key={tool.name}><a href={tool.url} target="_blank" rel="noopener noreferrer">{tool.name}</a> {tool.text}</li>)}
            </ul>
            <p>{f.toolsAll} <a href={f.toolsAllUrl} target="_blank" rel="noopener noreferrer">tools.webmaster.plus</a></p>
          </div>
        </section>
        <section className="ofl-sec">
          <h2 className="ofl-h2">{f.phoneTitle}</h2>
          <p className="ofl-lead">{f.phoneLead}</p>
          <div className="ofl-choices">
            {chosen.addons.slice(PHONE_ADDON_START).map((a, n) => {
              const i = PHONE_ADDON_START + n
              return <Card key={a} id={`extra-${i}`} type="checkbox" checked={s.extras.includes(i)} onChange={() => toggleExtra(i)} title={a} price={f.phonePlans[n].price} sub={f.phonePlans[n].sub} />
            })}
          </div>
          <p className="ofl-note">{f.phoneNote}</p>
          <div className="ofl-hint"><strong>{f.phoneAltTitle}</strong> {f.phoneAlt} <a href={f.phoneAltUrl} target="_blank" rel="noopener noreferrer">{f.phoneAltLink}</a></div>
        </section>
        <Actions t={t} onBack={() => goTo(2)} onNext={() => { if (validateExtras()) goTo(4) }} nextLabel={f.nextData} />
        <a href={f.seriesBannerHref} target="_blank" rel="noopener" style={{ display: 'block' }}><img className="ofl-photo" src={f.seriesBannerSrc} alt={f.seriesBannerAlt} width={1944} height={809} loading="lazy" /></a>
      </>}

      {s.step === 4 && <>
        <div className="ofl-head"><h1 className="ofl-h1" tabIndex={-1}>{f.dataTitle}</h1><p className="ofl-lead">{f.dataLead}</p></div>
        <img className="ofl-photo" src="/hero/angaben-formular.jpg" alt={f.dataImageAlt} width={1672} height={941} />
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
        <Actions t={t} onBack={() => goTo(3)} onNext={() => { if (validateData()) goTo(5) }} nextLabel={f.nextReview} />
      </>}

      {s.step === 5 && <>
        <div className="ofl-head"><h1 className="ofl-h1" tabIndex={-1}>{f.reviewTitle}</h1></div>
        <section className="ofl-sec"><h2 className="ofl-h2">{f.yourOrder}</h2>
          <dl className="ofl-rev">
            <ReviewRow t={t} label={f.package} value={chosen.name} onChange={() => goTo(1)} />
            <ReviewRow t={t} label={f.trustRow} value={trustLines.join('\n')} onChange={() => goTo(2)} />
            {order.seriesLlc && <ReviewRow t={t} label={f.seriesRow} value={`${f.seriesYes} (${f.seriesPrice})`} onChange={() => goTo(2)} />}
            <ReviewRow t={t} label={f.extra} value={s.extras.length ? s.extras.map(i => chosen.addons[i]).join('\n') : f.none} onChange={() => goTo(3)} />
            {domainFull && <ReviewRow t={t} label={f.domainRow} value={`${domainFull} (${money(domainPrice(domainTld), lang)}${f.domainYear})`} onChange={() => goTo(3)} />}
            <ReviewRow t={t} label={f.contact} value={[`${s.d.firstName} ${s.d.lastName}`, s.d.email, s.d.phone].filter(Boolean).join('\n')} onChange={() => goTo(4)} />
            <ReviewRow t={t} label={f.billingShort} value={[s.d.company, s.d.street, `${s.d.postalCode} ${s.d.city}`, s.d.country].filter(Boolean).join('\n')} onChange={() => goTo(4)} />
            {s.d.desiredName && <ReviewRow t={t} label={f.desiredShort} value={s.d.desiredName} onChange={() => goTo(4)} />}
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
              <Actions t={t} onBack={() => goTo(4)} onNext={payCard} disabled={busy} gold nextLabel={busy ? f.loading : `${f.orderBtn} — ${money(payable, lang)}`} />
              {preview && <p className="ofl-note">{f.cardRegular}{preview.fullyCovered && ` ${f.cardEuropanHint(preview.finalTotal.toLocaleString(t.numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}`}</p>}
              <p className="ofl-note">{f.cardFine}</p>
            </>
          : <>
              {!preview && <span className="ofl-err">{f.europanLogin}</span>}
              {preview && !preview.fullyCovered && <span className="ofl-err">{f.europanLow}</span>}
              <Actions t={t} onBack={() => goTo(4)} onNext={preview?.fullyCovered ? payEuropan : undefined} disabled={busy} gold nextLabel={busy ? f.loading : preview?.fullyCovered ? `${f.orderBtn} — )(\u00a0${preview.finalTotal.toLocaleString(t.numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : f.orderBtn} />
              {preview?.fullyCovered && <p className="ofl-note">{f.europanFine}</p>}
            </>}
      </>}

      {s.step === 6 && <>
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
    if (withMd) add(de.account, s.account ? `${de.accounts[s.account]} (${TRUST_ACCOUNT_FEE[s.account]} € pauschal)` : de.notWanted)
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
              <Card key={v} id={`variant-${v}`} name="variant" checked={s.variant === v} onChange={() => { patch({ variant: v, shType: trustNeedsSh(v) ? s.shType : '', bankAck: trustNeedsMd(v) ? s.bankAck : false, account: trustNeedsMd(v) ? s.account : '' }); setErrors(({ variant, ...r }) => r) }} title={f.variants[v]} />
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

        {!withMd && <div className="ofl-hint"><strong>{t.formation.trustBankHint}</strong> {t.formation.trustBankOnly}</div>}
        {withMd && <section className="ofl-sec"><h2 className="ofl-h2">{f.accountTitle}</h2><p className="ofl-note">{f.accountNote}</p><p className="ofl-note">{f.accountView}</p>
          <div className="ofl-choices">
            <Card id="account-none" name="account" checked={!s.account} onChange={() => patch({ account: '' })} title={f.accountNone} price={money(0, lang)} />
            {(['digital', 'branch'] as const).map(a => (
              <Card key={a} id={`account-${a}`} name="account" checked={s.account === a} onChange={() => patch({ account: a })} title={f.accounts[a]} price={flatFee(TRUST_ACCOUNT_FEE[a], lang)} />
            ))}
          </div>
        </section>}
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
          {withMd && <ReviewRow t={t} label={f.account} value={s.account ? `${f.accounts[s.account]}: ${flatFee(TRUST_ACCOUNT_FEE[s.account], lang)}` : f.notWanted} onChange={() => goTo(1)} />}
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
  if (isUkSlug(slug)) return <UkFlow slug={slug} lang={lang} />
  if (isUsSlug(slug)) return <UsFlow slug={slug} lang={lang} />
  return slug === TRUST_SLUG ? <TrustFlow slug={slug} lang={lang} /> : <FormationFlow slug={slug} lang={lang} />
}
