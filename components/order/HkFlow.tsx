'use client'
// Bestellstrecke Hong Kong Limited.
// Gleiches Muster wie UG/GmbH, UK und USA: Preise rechnet der Server mit lib/orderExtras.ts nach.
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { PRODUCTS } from '@/lib/products'
import { BalanceWidget } from '@/components/BalanceWidget'
import { orderExtras, extrasTotal, hasRecurring, type HkExtraKey } from '@/lib/orderExtras'
import { HOSTING_DOMAIN_PRICES, HOSTING_DOMAIN_TLDS, cleanDomainName, isValidDomainName, LEGAL_LINKS, HK_ACCOUNT_FEE, HK_NOMINEE_MONTHLY, HK_SLUG } from '@/lib/orderFlow'
import { isValidCoreName } from '@/lib/ukCompanyName'
import { STRINGS, type Lang } from './strings'
import { HK_STRINGS } from './hkStrings'
import { Actions, Bullets, Card, Field, Hero, Related, ReviewRow, Shell, Steps, flatFee, focusFirstError, mailOk, money, perMonth, productsFor, useAffiliateRef, useFlowState, type Errors, type Rows, type Summary } from './parts'

type Nominee = 'none' | 'md' | 'sh' | 'both'
type HkState = {
  step: number
  nameEn: string; nameZh: string; shareholders: 'single' | 'multi'; directors: 'single' | 'multi'; capital: '1' | '10000' | 'other'
  nominee: Nominee; bankAck: boolean; account: boolean; billing: 'monthly' | 'yearly'
  extras: HkExtraKey[]; pay: 'card' | 'europan'; terms: boolean; d: Record<string, string>
}
type DomainResults = Record<string, { available: boolean | null }>

const stripLimited = (input: string) => {
  let s = input.replace(/\s+/g, ' ').trim()
  const re = /[\s,]+(limited|ltd\.?)\s*$/i
  while (re.test(s)) s = s.replace(re, '').trim()
  return s
}
const stripZh = (input: string) => input.replace(/\s+/g, '').replace(/(有限公司)+$/, '')
const isZh = (v: string) => /^[\u3400-\u9fff\uf900-\ufaff（）()·]+$/.test(v)

export function HkFlow({ slug, lang }: { slug: string; lang: Lang }) {
  const t = STRINGS[lang], f = t.formation, u = HK_STRINGS[lang], uDe = HK_STRINGS.de
  const affiliateRef = useAffiliateRef()
  const { state: s, patch, goTo, clear } = useFlowState<HkState>(`pan21-order-hk`, {
    step: 0, nameEn: '', nameZh: '', shareholders: 'single', directors: 'single', capital: '10000',
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
  const chosenSlug = HK_SLUG
  const chosen = products.find(p => p.slug === chosenSlug)!
  const shown = chosen
  const chosenDe = PRODUCTS.find(p => p.slug === chosenSlug)!
  const price = chosen.price as number
  const hasLegal = Boolean(LEGAL_LINKS.terms && LEGAL_LINKS.withdrawal)
  const set = (k: string) => (v: string) => patch({ d: { ...s.d, [k]: v } })

  /* ---------- Name und Struktur ---------- */
  const core = stripLimited(s.nameEn)
  const zh = stripZh(s.nameZh)
  const fullName = `${core} Limited`.trim()
  const fullZh = zh ? `${zh}有限公司` : ''
  function validateName(): boolean {
    const e: Errors = {}
    if (!isValidCoreName(core)) e.nameEn = u.errEn
    if (zh && !isZh(zh)) e.nameZh = u.errZh
    setErrors(e)
    if (Object.keys(e).length) focusFirstError()
    return !Object.keys(e).length
  }
  const capitalText = s.capital === 'other' ? (s.d.capitalOther || '').trim() : s.capital === '1' ? '1' : '10.000'
  function validateStructure(): boolean {
    const msg = s.capital === 'other' && !/^[0-9.,' ]+$/.test((s.d.capitalOther || '').trim()) ? u.errCap : ''
    setErrors(msg ? { capitalOther: msg } : {})
    if (msg) focusFirstError()
    return !msg
  }
  const structure = (lab: typeof u) => [s.shareholders === 'single' ? lab.shRowSingle : lab.shRowMulti, s.directors === 'single' ? lab.dirRowSingle : lab.dirRowMulti, lab.capRow(capitalText)].join(', ')

  /* ---------- Nominee ---------- */
  const withMd = s.nominee === 'md' || s.nominee === 'both'
  const withSh = s.nominee === 'sh' || s.nominee === 'both'
  function chooseNominee(v: Nominee) {
    const md = v === 'md' || v === 'both'
    setErrors({})
    patch({ nominee: v, bankAck: md ? s.bankAck : false, account: md ? s.account : false, billing: v === 'none' ? 'monthly' : s.billing })
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
  const toggleExtra = (k: HkExtraKey) => {
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
  const order = { hkExtras: s.extras, domainTld: domainFull ? domainTld : '' }
  const extraItems = orderExtras(chosenSlug, order)
  const payable = Math.round((price + extrasTotal(extraItems)) * 100) / 100

  /* ---------- Bestellmail (immer deutsch) ---------- */
  const nomineeDe = s.nominee === 'none' ? undefined : [
    nomineeLabel(uDe),
    withMd ? 'Alleiniger Kontozugriff des Nominee Director zur Kenntnis genommen' : '',
    withMd ? (s.account ? `${uDe.account} (${HK_ACCOUNT_FEE} € pauschal)` : `${uDe.accountTitle} Nein`) : '',
    `Zahlweise: ${s.billing === 'yearly' ? `${uDe.payYearly} (${uDe.payYearlySub})` : uDe.payMonthly}`,
  ].filter(Boolean).join('; ')
  const customer = {
    firstName: s.d.firstName, lastName: s.d.lastName, contactEmail: s.d.email, phone: s.d.phone, company: s.d.company,
    street: s.d.street, postalCode: s.d.postalCode, city: s.d.city, country: s.d.country,
    desiredName: `${fullName}${fullZh ? ` / ${fullZh}` : ''} (${structure(uDe)})`,
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
  if (withMd) rows.push({ label: u.mdRow, value: perMonth(HK_NOMINEE_MONTHLY.director, lang) })
  if (withSh) rows.push({ label: u.shRow, value: perMonth(HK_NOMINEE_MONTHLY.shareholder, lang) })
  if (withMd && s.account) rows.push({ label: u.account, value: flatFee(HK_ACCOUNT_FEE, lang) })
  if (europanActive) rows.push({ label: f.advantage, value: `− ${money(payable - total, lang)}`, minus: true })
  const summary: Summary = {
    title: chosen.name,
    chip: core ? `${fullName}${fullZh ? ` · ${fullZh}` : ''}` : (chosen.card?.priceNote ?? ''),
    rows, totalLabel: f.totalLabel, total: money(total, lang),
    note: `${chosen.priceNote ?? ''}${europanActive ? ` ${f.paidEuropan}` : ''}${s.nominee !== 'none' ? ` ${lang === 'de' ? 'Der Nominee ist in diesem Gesamtpreis nicht enthalten.' : 'The nominee is not included in this total.'}` : ''}${hasRecurring(extraItems) ? ` ${f.recurringLater}` : ''}`,
  }

  const nomineeLines = s.nominee === 'none' ? [u.none] : [
    nomineeLabel(u),
    withMd ? (s.account ? `${u.account}: ${flatFee(HK_ACCOUNT_FEE, lang)}` : `${u.accountTitle} ${u.accountNone}`) : '',
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
        </div>
        <section className="ofl-sec"><h2 className="ofl-h2">{t.included}</h2><Bullets items={shown.card?.included ?? shown.included} kind="yes" /></section>
        <section className="ofl-sec"><h2 className="ofl-h2">{t.notIncluded}</h2><Bullets items={shown.notIncluded} kind="no" /></section>
        <section className="ofl-sec"><h2 className="ofl-h2">{t.addons}</h2><Bullets items={shown.card?.addons ?? shown.addons} kind="plus" /></section>
        <section className="ofl-sec"><h2 className="ofl-h2">{t.process}</h2><Steps items={shown.process} /></section>
        <div className="ofl-hint"><strong>{t.hint}</strong> {shown.card?.hint ?? shown.hint}</div>
        <p className="ofl-note">{f.europanBox}</p>
        <Actions t={t} onNext={() => goTo(1)} nextLabel={u.nextName} />
        <Related product={shown} lang={lang} />
      </>}

      {s.step === 1 && <>
        <div className="ofl-head"><h1 className="ofl-h1" tabIndex={-1}>{u.nameTitle}</h1><p className="ofl-lead">{u.nameLead}</p></div>
        <section className="ofl-sec"><div className="ofl-form">
          <Field id="nameEn" label={u.enLabel} placeholder={u.enPlaceholder} wide value={s.nameEn} onChange={v => patch({ nameEn: v })} error={errors.nameEn} auto="off" />
          <Field id="nameZh" label={u.zhLabel} placeholder={u.zhPlaceholder} wide value={s.nameZh} onChange={v => patch({ nameZh: v })} error={errors.nameZh} auto="off" />
        </div>
          {core && <p className="ofl-note">{u.preview} <strong>{fullName}</strong>{fullZh && <> · <strong>{fullZh}</strong></>}</p>}
          <p className="ofl-note">{u.nameNote}</p>
        </section>
        <Actions t={t} onBack={() => goTo(0)} onNext={() => { if (validateName()) goTo(2) }} nextLabel={u.nextStructure} />
      </>}

      {s.step === 2 && <>
        <div className="ofl-head"><h1 className="ofl-h1" tabIndex={-1}>{u.structureTitle}</h1><p className="ofl-lead">{u.structureLead}</p></div>
        <section className="ofl-sec"><h2 className="ofl-h2">{u.shTitle}</h2>
          <div className="ofl-choices">
            <Card id="sh-single" name="shareholders" checked={s.shareholders === 'single'} onChange={() => patch({ shareholders: 'single' })} title={u.shSingle} sub={u.shSingleSub} />
            <Card id="sh-multi" name="shareholders" checked={s.shareholders === 'multi'} onChange={() => patch({ shareholders: 'multi' })} title={u.shMulti} sub={u.shMultiSub} />
          </div>
        </section>
        <section className="ofl-sec"><h2 className="ofl-h2">{u.dirTitle}</h2>
          <div className="ofl-choices">
            <Card id="dir-single" name="directors" checked={s.directors === 'single'} onChange={() => patch({ directors: 'single' })} title={u.dirSingle} sub={u.dirSingleSub} />
            <Card id="dir-multi" name="directors" checked={s.directors === 'multi'} onChange={() => patch({ directors: 'multi' })} title={u.dirMulti} sub={u.dirMultiSub} />
          </div>
        </section>
        <section className="ofl-sec"><h2 className="ofl-h2">{u.capTitle}</h2><p className="ofl-lead">{u.capLead}</p>
          <div className="ofl-choices">
            <Card id="cap-10000" name="capital" checked={s.capital === '10000'} onChange={() => patch({ capital: '10000' })} title={u.cap10k} sub={u.cap10kSub} />
            <Card id="cap-1" name="capital" checked={s.capital === '1'} onChange={() => patch({ capital: '1' })} title={u.cap1} sub={u.cap1Sub} />
            <Card id="cap-other" name="capital" checked={s.capital === 'other'} onChange={() => patch({ capital: 'other' })} title={u.capOther} sub={u.capOtherSub} />
          </div>
          {s.capital === 'other' && <div className="ofl-form"><Field id="capitalOther" label={u.capOtherLabel} value={s.d.capitalOther} onChange={set('capitalOther')} error={errors.capitalOther} auto="off" /></div>}
        </section>
        <Actions t={t} onBack={() => goTo(1)} onNext={() => { if (validateStructure()) goTo(3) }} nextLabel={u.nextNominee} />
      </>}

      {s.step === 3 && <>
        <div className="ofl-head"><h1 className="ofl-h1" tabIndex={-1}>{u.nomineeTitle}</h1><p className="ofl-lead">{u.nomineeLead}</p></div>
        <img className="ofl-photo" src="/hero/treuhand-handschlag.jpg" alt={f.trustImageAlt} width={1672} height={941} />
        <div className="ofl-hint"><strong>{u.whyTitle}</strong><br />{u.whyText}</div>
        <section className="ofl-sec"><h2 className="ofl-h2">{u.rolesTitle}</h2>
          <div className="ofl-choices">
            <Card id="nom-none" name="nominee" checked={s.nominee === 'none'} onChange={() => chooseNominee('none')} title={u.none} price={money(0, lang)} sub={u.noneSub} />
            <Card id="nom-md" name="nominee" checked={s.nominee === 'md'} onChange={() => chooseNominee('md')} title={u.md} price={perMonth(HK_NOMINEE_MONTHLY.director, lang)} sub={u.mdSub} />
            <Card id="nom-sh" name="nominee" checked={s.nominee === 'sh'} onChange={() => chooseNominee('sh')} title={u.sh} price={perMonth(HK_NOMINEE_MONTHLY.shareholder, lang)} sub={u.shSub} />
            <Card id="nom-both" name="nominee" checked={s.nominee === 'both'} onChange={() => chooseNominee('both')} title={u.both} price={perMonth(HK_NOMINEE_MONTHLY.director + HK_NOMINEE_MONTHLY.shareholder, lang)} sub={u.bothSub} />
          </div>
          {withSh && <p className="ofl-note">{u.scrNote}</p>}
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
            <Card id="account-yes" name="account" checked={s.account} onChange={() => patch({ account: true })} title={u.account} price={flatFee(HK_ACCOUNT_FEE, lang)} />
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
        <section className="ofl-sec"><h2 className="ofl-h2">{u.chopTitle}</h2>
          <div className="ofl-choices">
            <Card id="extra-none" type="checkbox" checked={s.extras.length === 0} onChange={() => patch({ extras: [] })} title={u.extraNone} price={money(0, lang)} sub={u.extraNoneSub} />
            <Card id="extra-chop" type="checkbox" checked={s.extras.includes('chop')} onChange={() => toggleExtra('chop')} title={u.chop} price={u.chopPrice} sub={u.chopSub} />
          </div>
        </section>
        <img className="ofl-photo" src="/hero/zusatz-buero.jpg" alt={f.extrasImageAlt} width={1672} height={941} />
        <section className="ofl-sec">
          <h2 className="ofl-h2">{f.hostingTitle}</h2>
          <p className="ofl-lead">{f.hostingLead}</p>
          <div className="ofl-choices">
            <Card id="extra-hosting" type="checkbox" checked={hostingChosen} onChange={() => toggleExtra('hosting')} title={chosen.addons[1]} price={f.hostingPrice} sub={f.hostingSub} />
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
              <Card key={k} id={`extra-${k}`} type="checkbox" checked={s.extras.includes(k)} onChange={() => toggleExtra(k)} title={chosen.addons[2 + n]} price={f.phonePlans[n].price} sub={f.phonePlans[n].sub} />
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
            <ReviewRow t={t} label={f.package} value={chosen.name} />
            <ReviewRow t={t} label={u.companyRow} value={[fullName, fullZh].filter(Boolean).join('\n')} onChange={() => goTo(1)} />
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
