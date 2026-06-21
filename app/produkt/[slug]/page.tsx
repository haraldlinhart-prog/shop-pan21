'use client'
import { useState } from 'react'
import Link from 'next/link'
import { PRODUCTS } from '@/lib/products'
import { notFound } from 'next/navigation'
import '@/app/globals.css'
import './produkt.css'

export default function ProduktPage({ params }: { params: { slug: string } }) {
  const product = PRODUCTS.find(p => p.slug === params.slug)
  if (!product) return notFound()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [inquiryStatus, setInquiryStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle')
  const [formstart] = useState(Date.now())
  const [inquiryData, setInquiryData] = useState({ name: '', email: '', phone: '', message: '' })

  async function handleBuy(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return setError('Bitte E-Mail-Adresse eingeben.')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: product.slug, email }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setError(data.error || 'Fehler beim Checkout.')
    } catch { setError('Netzwerkfehler.') }
    finally { setLoading(false) }
  }

  async function handleInquiry(e: React.FormEvent) {
    e.preventDefault()
    if (Date.now() - formstart < 2000) return
    if (!inquiryData.name || !inquiryData.email) return
    setInquiryStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...inquiryData,
          interest: product.name,
          elapsed: Date.now() - formstart,
          inquiry: true,
        }),
      })
      if (res.ok) setInquiryStatus('ok')
      else setInquiryStatus('err')
    } catch { setInquiryStatus('err') }
  }

  const related = PRODUCTS.filter(p => p.slug !== product.slug && p.category === product.category).slice(0, 2)

  return (
    <div>
      <nav className="nav">
        <div className="container nav-inner">
          <Link href="/" className="nav-logo">
            <div className="nav-logo-mark">P21</div>
            <div>
              <span className="nav-logo-text">PAN21 Shop</span>
              <span className="nav-logo-sub">Corporate Services</span>
            </div>
          </Link>
          <ul className="nav-links">
            <li><Link href="/#produkte">← Alle Produkte</Link></li>
          </ul>
          <div className="nav-actions">
            <Link href="/#kontakt" className="btn-outline" style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)', fontSize: '0.78rem' }}>Beratung anfragen</Link>
          </div>
        </div>
      </nav>

      <div style={{ paddingTop: '68px', background: 'var(--snow)', minHeight: '100vh' }}>
        <div className="container" style={{ padding: '3rem 2rem' }}>

          {/* Breadcrumb */}
          <div className="breadcrumb">
            <Link href="/">Shop</Link> <span>/</span> <Link href="/#produkte">Produkte</Link> <span>/</span> <span>{product.name}</span>
          </div>

          <div className="produkt-layout">
            {/* ── Left: Details ── */}
            <div className="produkt-main">
              <div className="produkt-cat">{product.flag} {product.category}</div>
              <h1 className="produkt-title">{product.name}</h1>
              <p className="produkt-desc">{product.shortDesc}</p>

              {/* Included */}
              <div className="detail-block">
                <h3 className="detail-title">✓ Im Paket enthalten</h3>
                <ul className="detail-list included">
                  {product.included.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>

              {/* Not included */}
              <div className="detail-block">
                <h3 className="detail-title">✗ Nicht im Basispaket enthalten</h3>
                <ul className="detail-list not-included">
                  {product.notIncluded.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>

              {/* Addons */}
              {product.addons.length > 0 && (
                <div className="detail-block">
                  <h3 className="detail-title">+ Mögliche Zusatzleistungen</h3>
                  <ul className="detail-list addons">
                    {product.addons.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              )}

              {/* Process */}
              <div className="detail-block">
                <h3 className="detail-title">Ablauf</h3>
                <ol className="process-list">
                  {product.process.map((step, i) => (
                    <li key={i}>
                      <span className="process-num">{String(i + 1).padStart(2, '0')}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Hint */}
              <div className="hint-box">
                <strong>Hinweis:</strong> {product.hint}
              </div>

              {/* EUROPAN note */}
              <div className="europan-box">
                <div className="europan-badge">EUROPAN</div>
                <p>Mit einem EUROPAN-Konto können Sie Gründungs- und Servicedienstleistungen günstiger nutzen oder teilweise mit vorhandenem EUROPAN-Guthaben finanzieren.</p>
              </div>
            </div>

            {/* ── Right: Order box ── */}
            <div className="order-box-wrap">
              <div className="order-box">
                <div className="order-product-name">{product.flag} {product.name}</div>
                <div className="order-price">
                  {product.price
                    ? <>€{product.price.toLocaleString('de-DE')}<span className="order-price-note"> EUR</span></>
                    : <span style={{ fontSize: '1rem', color: 'var(--gold2)' }}>{product.priceLabel}</span>
                  }
                </div>
                {product.price && <p className="order-hint">Zzgl. etwaiger Behörden- und Notargebühren.</p>}

                {!product.inquiry ? (
                  <form onSubmit={handleBuy} style={{ marginTop: '1.5rem' }}>
                    <div className="fg">
                      <label>Ihre E-Mail-Adresse *</label>
                      <input type="email" required placeholder="ihre@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    {error && <p className="form-err">{error}</p>}
                    <button type="submit" className="form-submit" disabled={loading}>
                      {loading ? 'Weiterleitung…' : `Jetzt bestellen — €${product.price?.toLocaleString('de-DE')} →`}
                    </button>
                    <p style={{ fontSize: '0.7rem', color: 'var(--muted)', textAlign: 'center', marginTop: '0.5rem' }}>Gesicherter Checkout via Stripe</p>
                  </form>
                ) : (
                  inquiryStatus === 'ok' ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>✓</div>
                      <div style={{ fontFamily: 'var(--ff-d)', fontSize: '1.1rem', color: 'var(--navy)' }}>Anfrage erhalten</div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--gray)', marginTop: '0.4rem' }}>Wir melden uns innerhalb eines Werktages.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleInquiry} style={{ marginTop: '1.5rem' }}>
                      <div className="hp-field"><input type="text" name="website" tabIndex={-1} autoComplete="off" /></div>
                      <div className="fg">
                        <label>Name *</label>
                        <input type="text" required placeholder="Ihr Name" value={inquiryData.name} onChange={e => setInquiryData(p => ({...p, name: e.target.value}))} />
                      </div>
                      <div className="fg">
                        <label>E-Mail *</label>
                        <input type="email" required placeholder="ihre@email.com" value={inquiryData.email} onChange={e => setInquiryData(p => ({...p, email: e.target.value}))} />
                      </div>
                      <div className="fg">
                        <label>Telefon</label>
                        <input type="tel" placeholder="+49..." value={inquiryData.phone} onChange={e => setInquiryData(p => ({...p, phone: e.target.value}))} />
                      </div>
                      <div className="fg">
                        <label>Ihre Situation</label>
                        <textarea placeholder="Beschreiben Sie kurz Ihr Vorhaben und die gewünschte Struktur…" value={inquiryData.message} onChange={e => setInquiryData(p => ({...p, message: e.target.value}))} style={{ minHeight: '90px' }} />
                      </div>
                      {inquiryStatus === 'err' && <p className="form-err">Fehler. Bitte versuchen Sie es erneut.</p>}
                      <button type="submit" className="btn-inquiry" style={{ width: '100%', textAlign: 'center' }} disabled={inquiryStatus === 'sending'}>
                        {inquiryStatus === 'sending' ? 'Wird gesendet…' : 'Unverbindlich anfragen →'}
                      </button>
                    </form>
                  )
                )}

                <div className="order-trust">
                  <div className="trust-item">🔒 Sichere Verbindung</div>
                  <div className="trust-item">📋 Vollständige Dokumentation</div>
                  <div className="trust-item">✉️ Antwort innerhalb 1 Werktag</div>
                </div>
              </div>

              {related.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.75rem' }}>Ähnliche Produkte</div>
                  {related.map(r => (
                    <Link key={r.slug} href={`/produkt/${r.slug}`} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem', background: 'var(--white)', border: '1px solid var(--lgray)', marginBottom: '0.5rem', borderRadius: '3px' }}>
                      <span style={{ fontSize: '1.3rem' }}>{r.flag}</span>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--navy)' }}>{r.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gold2)' }}>{r.price ? `€${r.price.toLocaleString('de-DE')}` : 'Auf Anfrage'}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-links">
            <Link href="/">← Zurück zum Shop</Link>
            <a href="https://pan21.com" target="_blank" rel="noopener">PAN21.com</a>
          </div>
          <p className="footer-legal">© {new Date().getFullYear()} PAN21.COM Corporate Consultants Ltd · Alle Preise in EUR, zzgl. etwaiger Behördengebühren und externer Kosten.</p>
        </div>
      </footer>
    </div>
  )
}
