'use client'
// Gemeinsame Bausteine der Bestellstrecken (UG/GmbH, Treuhand, UK).
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { PRODUCTS, type Product } from '@/lib/products'
import { PRODUCTS_EN } from '@/lib/products.en'
import { STRINGS, type Lang } from './strings'

export type Errors = Record<string, string>
export type Rows = { label: string; value: string; minus?: boolean }[]
export type Summary = { title: string; chip: string; rows: Rows; totalLabel: string; total: string; note: string; later?: { label: string; value: string } }

export const money = (n: number, lang: Lang) => lang === 'de'
  ? `${n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
  : `€${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
export const perMonth = (n: number, lang: Lang) => lang === 'de' ? `${n} €/Monat` : `€${n}/month`
export const flatFee = (n: number, lang: Lang) => lang === 'de' ? `${n} € pauschal` : `€${n} flat fee`
export const mailOk = (e?: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '')

export function productsFor(lang: Lang): Product[] { return lang === 'en' ? PRODUCTS_EN : PRODUCTS }

/* ---------- Bausteine ---------- */
export function Field({ id, label, value, onChange, error, req, wide, type, area, placeholder, auto }: { id: string; label: string; value?: string; onChange: (v: string) => void; error?: string; req?: boolean; wide?: boolean; type?: string; area?: boolean; placeholder?: string; auto?: string }) {
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

export function Card({ id, name, type = 'radio', checked, onChange, title, price, sub, disabled }: { id: string; name?: string; type?: 'radio' | 'checkbox'; checked: boolean; onChange: () => void; title: string; price?: string; sub?: string; disabled?: boolean }) {
  return (
    <label className="ofl-card" htmlFor={id}>
      <input id={id} name={name} type={type} checked={checked} disabled={disabled} onChange={onChange} />
      <b>{title}</b>
      <span className="ofl-pr">{price || ''}</span>
      {sub && <small>{sub}</small>}
    </label>
  )
}

export function Bullets({ items, kind }: { items: string[]; kind: string }) {
  return <ul className={`ofl-list ${kind}`}>{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
}

export function Steps({ items, done = 0 }: { items: string[]; done?: number }) {
  return (
    <ol className="ofl-steps">
      {items.map((x, i) => <li key={i} className={i < done ? 'ok' : ''}><b>{i < done ? '✓' : String(i + 1).padStart(2, '0')}</b><span>{x}</span></li>)}
    </ol>
  )
}

export function Actions({ t, onBack, onNext, nextLabel, gold, disabled }: { t: any; onBack?: () => void; onNext?: () => void; nextLabel?: string; gold?: boolean; disabled?: boolean }) {
  return (
    <div className="ofl-actions">
      {onBack ? <button type="button" className="ofl-back" onClick={onBack}>{t.back}</button> : <span />}
      {onNext && <button type="button" className={`ofl-btn${gold ? ' gold' : ''}`} disabled={disabled} onClick={onNext}>{nextLabel}</button>}
    </div>
  )
}

export function ReviewRow({ label, value, onChange, t }: { label: string; value: ReactNode; onChange?: () => void; t: any }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
      {onChange ? <button type="button" className="ofl-link" onClick={onChange}>{t.change}</button> : <span />}
    </div>
  )
}

/* ---------- Rahmen: Kopf, Fortschritt, Zusammenfassung, Fuss ---------- */
export function Shell({ lang, slug, steps, step, goTo, summary, affiliateRef, side, children }: { lang: Lang; slug: string; steps: string[]; step: number; goTo: (n: number) => void; summary: Summary; affiliateRef: string; side: ReactNode; children: ReactNode }) {
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
          </div>
          <p className="footer-legal">© {new Date().getFullYear()} PAN21.com International LLC · {t.footer}</p>
        </div>
      </footer>
    </div>
  )
}

/* ---------- Schrittverwaltung mit Zurueck-Taste des Browsers und Sitzungsspeicher ---------- */
export function useFlowState<S extends { step: number }>(storageKey: string, initial: S) {
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

export function useAffiliateRef() {
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

export function focusFirstError() {
  setTimeout(() => document.querySelector('.ofl-err')?.scrollIntoView({ block: 'center' }), 0)
}

/* ---------- Angebotsseite (Schritt 1): zeigt den ganzen Produkttext, auch fuer Suchmaschinen ---------- */
export function Related({ product, lang }: { product: Product; lang: Lang }) {
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

export function Hero({ product }: { product: Product }) {
  const src = product.heroImage || product.image
  if (!src) return null
  return <div className="ofl-hero"><img src={src} alt={product.name} onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }} /></div>
}

