'use client'
// Bestellstrecke US-LLC: Wyoming, Delaware, New Mexico, Florida.
// Gleiches Muster wie UG/GmbH und UK: Preise rechnet der Server mit lib/orderExtras.ts nach.
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { PRODUCTS } from '@/lib/products'
import { BalanceWidget } from '@/components/BalanceWidget'
import { orderExtras, extrasTotal, hasRecurring, US_EXTRA_PRICES, type UsExtraKey } from '@/lib/orderExtras'
import { HOSTING_DOMAIN_PRICES, HOSTING_DOMAIN_TLDS, cleanDomainName, isValidDomainName, LEGAL_LINKS, US_ACCOUNT_FEE, US_NOMINEE_MONTHLY, US_SLUGS, usStateOf, type UsStateKey } from '@/lib/orderFlow'
import { isValidCoreName } from '@/lib/ukCompanyName'
import { STRINGS, type Lang } from './strings'
import { US_STRINGS } from './usStrings'
import { Actions, Bullets, Card, Field, Hero, Related, ReviewRow, Shell, Steps, flatFee, focusFirstError, mailOk, money, perMonth, productsFor, useAffiliateRef, useFlowState, type Errors, type Rows, type Summary } from './parts'

type Nominee = 'none' | 'md' | 'sh' | 'both'
type UsState = {
  step: number; state: UsStateKey
  name: string; suffix: string; members: 'single' | 'multi'; mgmt: 'member' | 'manager'
  nominee: Nominee; bankAck: boolean; account: boolean; billing: 'monthly' | 'yearly'
  extras: UsExtraKey[]; pay: 'card' | 'europan'; terms: boolean; d: Record<string, string>
}
type DomainResults = Record<string, { available: boolean | null }>

const STATE_KEYS: UsStateKey[] = ['wy', 'de', 'nm', 'fl']
const US_SUFFIXES = ['LLC', 'L.L.C.', 'Limited Liability Company']
const stripSuffix = (input: string) => {
  let s = input.replace(/\s+/g, ' ').trim()
  const re = /[\s,]+(limited liability company|l\.?\s?l\.?\s?c\.?)\s*$/i
  while (re.test(s)) s = s.replace(re, '').trim()
  return s
}

export function UsFlow({ slug, lang }: { slug: string; lang: Lang }) {
  const t = STRINGS[lang], f = t.formation, u = US_STRINGS[lang], uDe = US_STRINGS.de
  const affiliateRef = useAffiliateRef()
  const { state: s, patch, goTo, clear } = useFlowState<UsState>(`pan21-order-us`, {
    step: 0, state: usStateOf(slug), name: '', suffix: US_SUFFIXES[0], members: 'single', mgmt: 'member',
    nominee: 'none', bankAck: false, account: false, billing: 'monthly', extras: [], pay: 'card', terms: false, d: {},
  })
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
  const shown = products.find(p => p.slug === US_SLUGS.wy)!
  const chosenSlug = US_SLUGS[s.state]
  const chosen = products.find(p => p.slug === chosenSlug)!
  const chosenDe = PRODUCTS.find(p => p.slug === chosenSlug)!
  const price = chosen.price as number
  const priceOf = (k: UsStateKey) => PRODUCTS.find(p => p.slug === US_SLUGS[k])!.price as number
  const hasLegal = Boolean(LEGAL_LINKS.terms && LEGAL_LINKS.withdrawal)
  const set = (k: string) => (v: string) => patch({ d: { ...s.d, [k]: v } })

  /* ---------- Name und Struktur ---------- */
  const core = stripSuffix(s.name)
  const fullName = `${core} ${s.suffix}`.trim()
  function validateName(): boolean {
    const msg = isValidCoreName(core) ? '' : u.errName
    setErrors(msg ? { name: msg } : {})
    if (msg) focusFirstError()
    return !msg
  }
  const structure = (lab: typeof u) => `${s.members === 'single' ? lab.single : lab.multi}, ${s.mgmt === 'manager' ? lab.managerManaged : lab.memberManaged}`

  /* ---------- Nominee ---------- */
  const withMd = s.nominee === 'md' || s.nominee === 'both'
  const withSh = s.nominee === 'sh' || s.nominee === 'both'
  function chooseNominee(v: Nominee) {
    const md = v === 'md' || v === 'both'
    setErrors({})
    // Ein Nominee Manager setzt eine Manager-managed-LLC voraus
    patch({ nominee: v, mgmt: md ? 'manager' : s.mgmt, bankAck: md ? s.bankAck : false, account: md ? s.account : false, billing: v === 'none' ? 'monthly' : s.billing })
  }
  function validateNominee(): boolean {
    const e: Errors = {}
    if (withMd && !s.bankAck) e.bankAck = u.errBankAck
    setErrors(e)
    if (Object.keys(e).length) focusFirstError()
    return !Object.keys(e).length
  }
  const nomineeLabel = (lab: typeof u) => s.nominee === 'none' ? lab.none : s.nominee === 'md' ? lab.md : s.nominee === 'sh' ? lab.sh : lab.both

  /* ---------- Zusatzleistungen ---------- */
  const hostingChosen = s.extras.includes('hosting')
  const toggleExtra = (k: UsExtraKey) => {
    const on = s.extras.includes(k)
    let next = on ? s.extras.filter(x => x !== k) : [...s.extras, k]
    if (!on && k === 'phone0') next = next.filter(x => x !== 'phone1')
    if (!on && k === 'phone1') next = next.filter(x => x !== 'phone0')
    patch({ extras: next })
  }
  const domainName = cleanDomainName(s.d.domainName || '')
  const domainTld = s.d.domainTld || ''
  const checkedResults = domainCheck && domainCheck.name === domainName ? domainCheck.results : null
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
      for (const r of data.results) results[r.tld] = { available: r.available }
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

  /* ---------- Preise ---------- */
  const order = { usExtras: s.extras, domainTld: domainFull ? domainTld : '' }
  const extraItems = orderExtras(chosenSlug, order)
  const payable = Math.round((price + extrasTotal(extraItems)) * 100) / 100

  /* ---------- Bestellmail (immer deutsch) ---------- */
  const nomineeDe = s.nominee === 'none' ? undefined : [
    nomineeLabel(uDe),
    withMd ? 'Alleiniger Kontozugriff des Nominee Manager zur Kenntnis genommen' : '',
    withMd ? (s.account ? `${uDe.account} (${US_ACCOUNT_FEE} € pauschal)` : `${uDe.accountTitle} Nein`) : '',
    `Zahlweise: ${s.billing === 'yearly' ? `${uDe.payYearly} (${uDe.payYearlySub})` : uDe.payMonthly}`,
  ].filter(Boolean).join('; ')
  const customer = {
    firstName: s.d.firstName, lastName: s.d.lastName, contactEmail: s.d.email, phone: s.d.phone, company: s.d.company,
    street: s.d.street, postalCode: s.d.postalCode, city: s.d.city, country: s.d.country,
    desiredName: `${fullName} (${uDe.states[s.state].name}; ${structure(uDe)})`,
    extras: extraItems.map(i => i.de).join('; ') || undefined,
    domain: domainFull ? `${domainFull} (${money(HOSTING_DOMAIN_PRICES[domainTld], 'de')} pro Jahr)` : undefined,
    trust: nomineeDe,
  }

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

  /* ---------- Bezahlen ---------- */
  async function loadToken(forSlug: string) {
    const res = await fetch(`/api/checkout-token?slug=${encodeURIComponent(forSlug)}`)
    const data = await res.json()
    if (!data.token) throw new Error('token')
    tokenRef.current = { slug: forSlug, at: Date.now(), token: data.token }
  }
  useEffect(() => {
    if (s.step === 6) loadToken(chosenSlug).catch(() => {})
  }, [s.step, chosenSlug])
  async function readyToken(): Promise<string> {
    const cur = tokenRef.current
    if (!cur || cur.slug !== chosenSlug || Date.now() - cur.at > 14 * 60 * 1000) await loadToken(chosenSlug)
    const age = Date.now() - tokenRef.current!.at
    if (age < 3200) await new Promise(r => setTimeout(r, 3200 - age))
    return tokenRef.current!.token
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

  /* ---------- Zusammenfassung ---------- */
  const europanActive = s.pay === 'europan' && preview?.fullyCovered
  const total = europanActive && preview ? preview.finalTotal : payable
  const rows: Rows = [{ label: f.packageRow, value: money(price, lang) }]
  extraItems.forEach(item => rows.push({ label: lang === 'en' ? item.en : item.de, value: money(item.amount, lang) }))
  if (withMd) rows.push({ label: u.mdRow, value: perMonth(US_NOMINEE_MONTHLY.manager, lang) })
  if (withSh) rows.push({ label: u.shRow, value: perMonth(US_NOMINEE_MONTHLY.member, lang) })
  if (withMd && s.account) rows.push({ label: u.account, value: flatFee(US_ACCOUNT_FEE, lang) })
  if (europanActive) rows.push({ label: f.advantage, value: `− ${money(payable - total, lang)}`, minus: true })
  const summary: Summary = s.step === 0 ? {
    title: shown.card?.name ?? shown.name,
    chip: u.stateHint,
    rows: STATE_KEYS.map(k => ({ label: u.states[k].name, value: money(priceOf(k), lang) })),
    totalLabel: f.priceFromLabel, total: money(Math.min(...STATE_KEYS.map(priceOf)), lang),
    note: shown.card?.priceNote ?? shown.priceNote ?? '',
  } : {
    title: chosen.name,
    chip: `${u.steps[1]}: ${u.states[s.state].name}${core ? ` · ${fullName}` : ''}`,
    rows, totalLabel: f.totalLabel, total: money(total, lang),
    note: `${chosen.priceNote ?? ''}${europanActive ? ` ${f.paidEuropan}` : ''}${s.nominee !== 'none' ? ` ${lang === 'de' ? 'Der Nominee ist in diesem Gesamtpreis nicht enthalten.' : 'The nominee is not included in this total.'}` : ''}${hasRecurring(extraItems) ? ` ${f.recurringLater}` : ''}`,
  }

  const nomineeLines = s.nominee === 'none' ? [u.none] : [
    nomineeLabel(u),
    withMd ? (s.account ? `${u.account}: ${flatFee(US_ACCOUNT_FEE, lang)}` : `${u.accountTitle} ${u.accountNone}`) : '',
    s.billing === 'yearly' ? `${u.payYearly} (${u.payYearlySub})` : u.payMonthly,
  ].filter(Boolean)

  return (
    <Shell lang={lang} slug={slug} steps={u.steps} step={s.step} goTo={goTo} summary={summary} affiliateRef={affiliateRef}
      side={<BalanceWidget embedded slug={chosenSlug} price={payable} productName={chosenDe.name} affiliateRef={affiliateRef} lang={lang} customer={customer} order={order} onPriceUpdate={setPreview} onNoblePayment={r => { setPaid(r); clear(); goTo(7) }} />}>

      {s.step === 0 && <>
        <Hero product={shown} />
        <div className="ofl-head">
          <span className="ofl-eyebrow">{shown.flag} {shown.category}</span>
          <h1 className="ofl-h1" tabIndex={-1}>{shown.card?.name ?? shown.name}</h1>
          <p className="ofl-lead">{shown.card?.lead ?? shown.shortDesc}</p>
          <p style={{ fontWeight: 600, color: 'var(--navy)' }}>{u.stateHint}</p>
        </div>
        <section className="ofl-sec"><h2 className="ofl-h2">{t.included}</h2><Bullets items={shown.card?.included ?? shown.included} kind="yes" /></section>
        <section className="ofl-sec"><h2 className="ofl-h2">{t.notIncluded}</h2><Bullets items={shown.notIncluded} kind="no" /></section>
        <section className="ofl-sec"><h2 className="ofl-h2">{t.addons}</h2><Bullets items={shown.card?.addons ?? shown.addons} kind="plus" /></section>
        <section className="ofl-sec"><h2 className="ofl-h2">{t.process}</h2><Steps items={shown.process} /></section>
        <div className="ofl-hint"><strong>{t.hint}</strong> {shown.card?.hint ?? shown.hint}</div>
        <p className="ofl-note">{f.europanBox}</p>
        <Actions t={t} onNext={() => goTo(1)} nextLabel={u.nextState} />
        <Related product={shown} lang={lang} />
      </>}

      {s.step === 1 && <>
        <div className="ofl-head"><h1 className="ofl-h1" tabIndex={-1}>{u.stateTitle}</h1><p className="ofl-lead">{u.stateLead}</p></div>
        <div className="ofl-choices">
          {STATE_KEYS.map(k => (
            <Card key={k} id={`state-${k}`} name="usstate" checked={s.state === k} onChange={() => patch({ state: k })} title={u.states[k].name} price={money(priceOf(k), lang)} sub={u.states[k].sub} />
          ))}
        </div>
        <section className="ofl-sec"><h2 className="ofl-h2">{u.states[s.state].name}</h2>
          <dl className="ofl-rev">
            {u.rowLabels.map((label, i) => <ReviewRow key={label} t={t} label={label} value={u.states[s.state].rows[i]} />)}
          </dl>
          <div className="ofl-hint">{chosen.hint}</div>
        </section>
        <div className="ofl-hint"><strong>{u.seriesTitle}</strong> {u.seriesText} <a href={u.seriesUrl} target="_blank" rel="noopener">{u.seriesLink}</a></div>
        <Actions t={t} onBack={() => goTo(0)} onNext={() => goTo(2)} nextLabel={u.nextName} />
      </>}

      {s.step === 2 && <>
        <div className="ofl-head"><h1 className="ofl-h1" tabIndex={-1}>{u.nameTitle}</h1><p className="ofl-lead">{u.nameLead}</p></div>
        <section className="ofl-sec"><div className="ofl-form">
          <Field id="name" label={u.nameLabel} placeholder={u.namePlaceholder} wide value={s.name} onChange={v => patch({ name: v })} error={errors.name} auto="off" />
        </div></section>
        <section className="ofl-sec"><h2 className="ofl-h2">{u.suffixTitle}</h2><p className="ofl-lead">{u.suffixLead}</p>
          <div className="ofl-choices">
            {US_SUFFIXES.map(sx => (
              <Card key={sx} id={`suffix-${sx}`} name="suffix" checked={s.suffix === sx} onChange={() => patch({ suffix: sx })} title={`${core || '…'} ${sx}`} />
            ))}
          </div>
          {core && <p className="ofl-note">{u.preview} <strong>{fullName}</strong></p>}
          <p className="ofl-note">{u.nameNote}</p>
        </section>
        <section className="ofl-sec"><h2 className="ofl-h2">{u.membersTitle}</h2>
          <div className="ofl-choices">
            <Card id="members-single" name="members" checked={s.members === 'single'} onChange={() => patch({ members: 'single' })} title={u.single} sub={u.singleSub} />
            <Card id="members-multi" name="members" checked={s.members === 'multi'} onChange={() => patch({ members: 'multi' })} title={u.multi} sub={u.multiSub} />
          </div>
        </section>
        <section className="ofl-sec"><h2 className="ofl-h2">{u.mgmtTitle}</h2>
          <div className="ofl-choices">
            <Card id="mgmt-member" name="mgmt" checked={s.mgmt === 'member'} onChange={() => patch({ mgmt: 'member' })} title={u.memberManaged} sub={u.memberManagedSub} />
            <Card id="mgmt-manager" name="mgmt" checked={s.mgmt === 'manager'} onChange={() => patch({ mgmt: 'manager' })} title={u.managerManaged} sub={u.managerManagedSub} />
          </div>
        </section>
        <Actions t={t} onBack={() => goTo(1)} onNext={() => { if (validateName()) goTo(3) }} nextLabel={u.nextNominee} />
      </>}

      {s.step === 3 && <>
        <div className="ofl-head"><h1 className="ofl-h1" tabIndex={-1}>{u.nomineeTitle}</h1><p className="ofl-lead">{u.nomineeLead}</p></div>
        <img className="ofl-photo" src="/hero/treuhand-handschlag.jpg" alt={f.trustImageAlt} width={1672} height={941} />
        <div className="ofl-hint"><strong>{u.whyTitle}</strong><br />{u.whyText}</div>
        <section className="ofl-sec"><h2 className="ofl-h2">{u.rolesTitle}</h2>
          <div className="ofl-choices">
            <Card id="nom-none" name="nominee" checked={s.nominee === 'none'} onChange={() => chooseNominee('none')} title={u.none} price={money(0, lang)} sub={u.noneSub} />
            <Card id="nom-md" name="nominee" checked={s.nominee === 'md'} onChange={() => chooseNominee('md')} title={u.md} price={perMonth(US_NOMINEE_MONTHLY.manager, lang)} sub={u.mdSub} />
            <Card id="nom-sh" name="nominee" checked={s.nominee === 'sh'} onChange={() => chooseNominee('sh')} title={u.sh} price={perMonth(US_NOMINEE_MONTHLY.member, lang)} sub={u.shSub} />
            <Card id="nom-both" name="nominee" checked={s.nominee === 'both'} onChange={() => chooseNominee('both')} title={u.both} price={perMonth(US_NOMINEE_MONTHLY.manager + US_NOMINEE_MONTHLY.member, lang)} sub={u.bothSub} />
          </div>
          {withMd && <p className="ofl-note">{u.managerAuto}</p>}
        </section>
        {withMd && <section className="ofl-sec"><h2 className="ofl-h2">{u.bankTitle}</h2><p className="ofl-lead">{u.bankText}</p>
          <label className="ofl-check" htmlFor="bankAck">
            <input id="bankAck" type="checkbox" checked={s.bankAck} onChange={e => { patch({ bankAck: e.target.checked }); setErrors(({ bankAck, ...r }) => r) }} />
            <span>{u.bankAck}</span>
          </label>
          {errors.bankAck && <span className="ofl-err">{errors.bankAck}</span>}
        </section>}
        {withMd && <section className="ofl-sec"><h2 className="ofl-h2">{u.accountTitle}</h2>
          <div className="ofl-choices">
            <Card id="account-none" name="account" checked={!s.account} onChange={() => patch({ account: false })} title={u.accountNone} price={money(0, lang)} />
            <Card id="account-yes" name="account" checked={s.account} onChange={() => patch({ account: true })} title={u.account} price={flatFee(US_ACCOUNT_FEE, lang)} />
          </div>
        </section>}
        {!withMd && <div className="ofl-hint"><strong>{u.bankTitle}:</strong> {u.bankNoneHint}</div>}
        {s.nominee !== 'none' && <section className="ofl-sec"><h2 className="ofl-h2">{u.payTitle}</h2>
          <div className="ofl-choices">
            <Card id="billing-monthly" name="billing" checked={s.billing === 'monthly'} onChange={() => patch({ billing: 'monthly' })} title={u.payMonthly} />
            <Card id="billing-yearly" name="billing" checked={s.billing === 'yearly'} onChange={() => patch({ billing: 'yearly' })} title={u.payYearly} sub={u.payYearlySub} />
          </div>
        </section>}
        {s.nominee !== 'none' && <section className="ofl-sec"><h2 className="ofl-h2">{u.termsTitle}</h2><Bullets items={u.termsList} kind="dot" />
          <p className="ofl-note"><Link href={u.moreUrl} target="_blank">{u.moreLink}</Link></p>
        </section>}
        <Actions t={t} onBack={() => goTo(2)} onNext={() => { if (validateNominee()) goTo(4) }} nextLabel={u.nextExtras} />
      </>}

      {s.step === 4 && <>
        <div className="ofl-head"><h1 className="ofl-h1" tabIndex={-1}>{u.extrasTitle}</h1><p className="ofl-lead">{u.extrasLead}</p></div>
        <section className="ofl-sec"><h2 className="ofl-h2">{u.usTitle}</h2>
          <div className="ofl-choices">
            <Card id="extra-none" type="checkbox" checked={s.extras.length === 0} onChange={() => patch({ extras: [] })} title={u.extraNone} price={money(0, lang)} sub={u.extraNoneSub} />
            <Card id="extra-ein" type="checkbox" checked={s.extras.includes('ein')} onChange={() => toggleExtra('ein')} title={u.ein} price={u.einPrice} sub={u.einSub} />
            <Card id="extra-address" type="checkbox" checked={s.extras.includes('address')} onChange={() => toggleExtra('address')} title={u.address} price={u.yearPrice(money(US_EXTRA_PRICES.address, lang))} sub={u.addressSub} />
          </div>
        </section>
        <img className="ofl-photo" src="/hero/zusatz-buero.jpg" alt={f.extrasImageAlt} width={1672} height={941} />
        <section className="ofl-sec">
          <h2 className="ofl-h2">{f.hostingTitle}</h2>
          <p className="ofl-lead">{f.hostingLead}</p>
          <div className="ofl-choices">
            <Card id="extra-hosting" type="checkbox" checked={hostingChosen} onChange={() => toggleExtra('hosting')} title={chosen.addons[2]} price={f.hostingPrice} sub={f.hostingSub} />
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
                  return <Card key={tld} id={`domain-${tld}`} name="domain-tld" checked={domainTld === tld} disabled={state === false} onChange={() => { setErrors({}); patch({ d: { ...s.d, domainTld: tld } }) }} title={`${domainName && isValidDomainName(domainName) ? domainName : ''}.${tld}`} price={`${money(HOSTING_DOMAIN_PRICES[tld], lang)}${f.domainYear}`} sub={checkedResults ? (state === true ? f.domainFree : state === false ? f.domainTaken : f.domainUnknown) : undefined} />
                })}
              </div>
              <p>{f.domainNote}</p>
            </div>
          )}
        </section>
        <section className="ofl-sec">
          <h2 className="ofl-h2">{f.phoneTitle}</h2>
          <p className="ofl-lead">{f.phoneLead}</p>
          <div className="ofl-choices">
            {(['phone0', 'phone1'] as const).map((k, n) => (
              <Card key={k} id={`extra-${k}`} type="checkbox" checked={s.extras.includes(k)} onChange={() => toggleExtra(k)} title={chosen.addons[3 + n]} price={f.phonePlans[n].price} sub={f.phonePlans[n].sub} />
            ))}
          </div>
          <p className="ofl-note">{f.phoneNote}</p>
        </section>
        <Actions t={t} onBack={() => goTo(3)} onNext={() => { if (validateExtras()) goTo(5) }} nextLabel={u.nextData} />
      </>}

      {s.step === 5 && <>
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
        <Actions t={t} onBack={() => goTo(4)} onNext={() => { if (validateData()) goTo(6) }} nextLabel={u.nextReview} />
      </>}

      {s.step === 6 && <>
        <div className="ofl-head"><h1 className="ofl-h1" tabIndex={-1}>{f.reviewTitle}</h1></div>
        <section className="ofl-sec"><h2 className="ofl-h2">{f.yourOrder}</h2>
          <dl className="ofl-rev">
            <ReviewRow t={t} label={f.package} value={chosen.name} onChange={() => goTo(1)} />
            <ReviewRow t={t} label={u.companyRow} value={fullName} onChange={() => goTo(2)} />
            <ReviewRow t={t} label={u.structureRow} value={structure(u)} onChange={() => goTo(2)} />
            <ReviewRow t={t} label={u.nomineeRow} value={nomineeLines.join('\n')} onChange={() => goTo(3)} />
            <ReviewRow t={t} label={f.extra} value={extraItems.length ? extraItems.map(i => lang === 'en' ? i.en : i.de).join('\n') : f.none} onChange={() => goTo(4)} />
            <ReviewRow t={t} label={f.contact} value={[`${s.d.firstName} ${s.d.lastName}`, s.d.email, s.d.phone].filter(Boolean).join('\n')} onChange={() => goTo(5)} />
            <ReviewRow t={t} label={f.billingShort} value={[s.d.company, s.d.street, `${s.d.postalCode} ${s.d.city}`, s.d.country].filter(Boolean).join('\n')} onChange={() => goTo(5)} />
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
              <Actions t={t} onBack={() => goTo(5)} onNext={payCard} disabled={busy} gold nextLabel={busy ? f.loading : `${f.orderBtn} — ${money(payable, lang)}`} />
              {preview && <p className="ofl-note">{f.cardRegular}{preview.fullyCovered && ` ${f.cardEuropanHint(preview.finalTotal.toLocaleString(t.numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}`}</p>}
              <p className="ofl-note">{f.cardFine}</p>
            </>
          : <>
              {!preview && <span className="ofl-err">{f.europanLogin}</span>}
              {preview && !preview.fullyCovered && <span className="ofl-err">{f.europanLow}</span>}
              <Actions t={t} onBack={() => goTo(5)} onNext={preview?.fullyCovered ? payEuropan : undefined} disabled={busy} gold nextLabel={busy ? f.loading : preview?.fullyCovered ? `${f.orderBtn} — )( ${preview.finalTotal.toLocaleString(t.numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : f.orderBtn} />
              {preview?.fullyCovered && <p className="ofl-note">{f.europanFine}</p>}
            </>}
      </>}

      {s.step === 7 && <>
        <div className="ofl-ok" aria-hidden="true">✓</div>
        <div className="ofl-head">
          <h1 className="ofl-h1" tabIndex={-1}>{f.doneTitle}</h1>
          <p className="ofl-lead">{f.doneThanks} <strong>{chosen.name}</strong>. {f.doneMail}</p>
          <p className="ofl-lead">{u.doneTeam}</p>
          {paid?.order_reference && <p className="ofl-note">{f.reference} {paid.order_reference}</p>}
        </div>
        <section className="ofl-sec"><h2 className="ofl-h2">{f.nextSteps}</h2><Steps items={chosen.process} done={1} /></section>
      </>}
    </Shell>
  )
}
