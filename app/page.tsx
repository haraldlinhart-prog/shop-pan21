'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { PRODUCTS, CATEGORIES } from '@/lib/products'
import './shop.css'

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState('alle')

  const filtered = activeCategory === 'alle'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === activeCategory)

  return (
    <div>
      {/* ── Nav ── */}
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
            <li><Link href="#produkte">Produkte</Link></li>
            <li><Link href="#ablauf">Ablauf</Link></li>
            <li><Link href="#kontakt">Kontakt</Link></li>
            <li><a href="https://pan21.com" target="_blank" rel="noopener">PAN21.com</a></li>
          </ul>
          <div className="nav-actions">
            <Link href="#kontakt" className="btn-outline" style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)', fontSize: '0.78rem' }}>Beratung anfragen</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="container hero-inner">
          <div>
            <span className="eyebrow" style={{ color: 'var(--gold3)' }}>PAN21 Corporate Services — Seit 1985</span>
            <h1 className="hero-h1">
              Internationale<br />
              <em>Firmengründung</em><br />
              & Gesellschaftsverwaltung
            </h1>
            <p className="hero-sub">
              Von der deutschen GmbH bis zur Nevis LLC — PAN21 begleitet Unternehmer,
              Investoren und internationale Strukturen mit 40 Jahren Erfahrung.
              Seriös, dokumentiert, compliance-orientiert.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem' }}>
              <Link href="#produkte" className="btn-gold-lg">Produkte ansehen →</Link>
              <Link href="#kontakt" className="btn-outline" style={{ color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.25)' }}>Beratung anfragen</Link>
            </div>
            <div className="hero-usps">
              {['Keine anonymen Strukturen', 'Compliance-orientiert', 'Weltweit tätig', '40+ Jahre Erfahrung'].map(u => (
                <div key={u} className="hero-usp">
                  <span style={{ color: 'var(--gold)' }}>✓</span> {u}
                </div>
              ))}
            </div>
          </div>
          <div className="hero-flags">
            {['🇩🇪', '🇬🇧', '🇺🇸', '🇭🇰', '🇮🇪', '🇳🇿', '🏝️', '🌐'].map((flag, i) => (
              <div key={i} className="hero-flag">{flag}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <div className="trust-bar">
        <div className="container trust-inner">
          {[
            { val: '40+', label: 'Jahre Erfahrung' },
            { val: '50+', label: 'Länder' },
            { val: '140+', label: 'Büros weltweit' },
            { val: '10', label: 'Jurisdiktionen im Shop' },
          ].map(s => (
            <div key={s.label} className="trust-stat">
              <span className="trust-val">{s.val}</span>
              <span className="trust-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Products ── */}
      <section className="section" id="produkte" style={{ background: 'var(--snow)' }}>
        <div className="container">
          <div style={{ marginBottom: '3rem' }}>
            <span className="eyebrow">Unsere Leistungen</span>
            <h2 className="sec-title">Firmengründungen & <em>Gesellschaftsverwaltung</em></h2>
            <p className="sec-sub">Wählen Sie Ihre gewünschte Jurisdiktion oder Dienstleistung. Bei Fragen beraten wir Sie kostenlos und unverbindlich.</p>
          </div>

          {/* Category filter */}
          <div className="cat-filter">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`cat-btn${activeCategory === c.id ? ' active' : ''}`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="products-grid">
            {filtered.map(product => (
              <Link key={product.slug} href={`/produkt/${product.slug}`} className="product-card">
                <div className="product-img-wrap">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="product-img"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <div className="product-flag">{product.flag}</div>
                  {product.inquiry && <div className="product-badge">Auf Anfrage</div>}
                </div>
                <div className="product-body">
                  <div className="product-cat">{product.category}</div>
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-desc">{product.shortDesc}</p>
                  <div className="product-footer">
                    <div className="product-price">
                      {product.price
                        ? <>€{product.price.toLocaleString('de-DE')}<span className="price-note"> EUR</span></>
                        : <span className="price-inquiry">{product.priceLabel}</span>
                      }
                    </div>
                    <span className="product-cta">
                      {product.inquiry ? 'Anfragen →' : 'Bestellen →'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ablauf ── */}
      <section className="section" id="ablauf">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span className="eyebrow">So funktioniert es</span>
            <h2 className="sec-title">Von der Bestellung <em>zur Gesellschaft</em></h2>
          </div>
          <div className="ablauf-steps">
            {[
              { n: '01', title: 'Produkt wählen & bestellen', text: 'Wählen Sie Ihre gewünschte Jurisdiktion und schließen Sie den Bestellvorgang ab — per Kreditkarte oder Banküberweisung.' },
              { n: '02', title: 'Daten übermitteln', text: 'Nach der Bestellung erhalten Sie eine Bestätigung mit einem strukturierten Fragebogen zur Übermittlung der erforderlichen Gründungsdaten und Identifikationsnachweise.' },
              { n: '03', title: 'Prüfung & Vorbereitung', text: 'Wir prüfen Firmierung, Struktur und Compliance-Anforderungen und koordinieren alle notwendigen Schritte mit den zuständigen Stellen.' },
              { n: '04', title: 'Gründung & Übergabe', text: 'Nach Abschluss aller Formalitäten erhalten Sie die vollständigen Gesellschaftsunterlagen und werden über alle laufenden Pflichten informiert.' },
            ].map(s => (
              <div key={s.n} className="ablauf-step">
                <div className="ablauf-num">{s.n}</div>
                <div>
                  <h3 className="ablauf-title">{s.title}</h3>
                  <p className="ablauf-text">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust / Hinweis ── */}
      <section className="section" style={{ background: 'var(--navy)', padding: '60px 0' }}>
        <div className="container" style={{ maxWidth: '760px' }}>
          <span className="eyebrow" style={{ color: 'rgba(201,150,58,0.7)' }}>Wichtiger Hinweis</span>
          <h2 style={{ fontFamily: 'var(--ff-d)', fontSize: 'clamp(1.5rem,2.5vw,2rem)', fontWeight: 400, color: '#fff', marginBottom: '1.25rem', lineHeight: 1.3 }}>
            Keine anonymen Strukturen. Keine Umgehung gesetzlicher Pflichten.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', lineHeight: 1.85 }}>
            Alle Produkte im PAN21 Shop richten sich ausschließlich an Kunden mit legitimen unternehmerischen Zwecken.
            Wirtschaftlich Berechtigte, Geschäftszweck, Mittelherkunft und Steueransässigkeit werden dokumentiert und geprüft.
            PAN21 behält sich vor, Anfragen abzulehnen, wenn Compliance-, Steuer- oder Transparenzgesichtspunkte dem entgegenstehen.
          </p>
        </div>
      </section>

      {/* ── Contact ── */}
      <section className="section" id="kontakt">
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '5rem', alignItems: 'start' }}>
          <div>
            <span className="eyebrow">Kostenlose Beratung</span>
            <h2 className="sec-title">Fragen? <em>Wir helfen.</em></h2>
            <div className="gold-rule" />
            <p style={{ fontSize: '0.9rem', color: 'var(--gray)', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              Nicht sicher welche Jurisdiktion für Ihr Vorhaben passt?
              Wir beraten Sie kostenlos und unverbindlich — telefonisch oder per E-Mail.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'E-Mail', val: 'shop@pan21.com', href: 'mailto:shop@pan21.com' },
                { label: 'Website', val: 'pan21.com', href: 'https://pan21.com' },
              ].map(c => (
                <div key={c.label} style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--gray)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--navy)', minWidth: '70px' }}>{c.label}</span>
                  <a href={c.href} style={{ color: 'var(--gold2)' }}>{c.val}</a>
                </div>
              ))}
            </div>
          </div>
          <ContactForm />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="container footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="nav-logo-mark" style={{ width: '32px', height: '32px', fontSize: '0.72rem' }}>P21</div>
            <span style={{ fontFamily: 'var(--ff-d)', fontSize: '1.1rem', color: 'rgba(255,255,255,0.5)' }}>PAN21 Shop</span>
          </div>
          <div className="footer-links">
            <Link href="#produkte">Produkte</Link>
            <Link href="#ablauf">Ablauf</Link>
            <Link href="#kontakt">Kontakt</Link>
            <a href="https://pan21.com" target="_blank" rel="noopener">PAN21.com</a>
            <a href="https://pan21.net" target="_blank" rel="noopener">PAN21.net</a>
          </div>
          <p className="footer-legal">
            © {new Date().getFullYear()} PAN21.COM Corporate Consultants Ltd · shop.pan21.com ·
            Alle Preise in EUR, zzgl. etwaiger Behördengebühren, Notarkosten und externer Dienstleisterkosten.
            Kein Angebot zur Steuerhinterziehung oder Umgehung gesetzlicher Pflichten.
          </p>
        </div>
      </footer>
    </div>
  )
}

function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle')
  const [err, setErr] = useState('')
  const [formstart] = useState(Date.now())

  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    if (data.get('website')) return
    if (Date.now() - formstart < 2000) return
    setStatus('sending'); setErr('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          phone: data.get('phone'),
          interest: data.get('interest'),
          message: data.get('message'),
          elapsed: Date.now() - formstart,
        }),
      })
      if (res.ok) setStatus('ok')
      else { const d = await res.json(); setErr(d.error || 'Fehler'); setStatus('err') }
    } catch { setErr('Netzwerkfehler'); setStatus('err') }
  }

  if (status === 'ok') return (
    <div style={{ background: 'var(--snow)', border: '1px solid var(--lgray)', padding: '3rem', textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✓</div>
      <div style={{ fontFamily: 'var(--ff-d)', fontSize: '1.4rem', color: 'var(--navy)', marginBottom: '0.5rem' }}>Anfrage erhalten</div>
      <p style={{ color: 'var(--gray)', fontSize: '0.875rem' }}>Wir melden uns innerhalb eines Werktages.</p>
    </div>
  )

  return (
    <form onSubmit={handle} style={{ background: 'var(--snow)', border: '1px solid var(--lgray)', padding: '2.5rem' }} noValidate>
      <div className="hp-field"><input type="text" name="website" tabIndex={-1} autoComplete="off" /></div>
      <div className="form-row">
        <div className="fg"><label>Name *</label><input type="text" name="name" placeholder="Ihr Name" required /></div>
        <div className="fg"><label>E-Mail *</label><input type="email" name="email" placeholder="ihre@email.com" required /></div>
      </div>
      <div className="form-row">
        <div className="fg"><label>Telefon</label><input type="tel" name="phone" placeholder="+49..." /></div>
        <div className="fg">
          <label>Interesse</label>
          <select name="interest">
            <option value="">Bitte wählen</option>
            {PRODUCTS.map(p => <option key={p.slug} value={p.name}>{p.flag} {p.name}</option>)}
            <option value="Allgemeine Beratung">Allgemeine Beratung</option>
          </select>
        </div>
      </div>
      <div className="fg"><label>Nachricht</label><textarea name="message" placeholder="Beschreiben Sie kurz Ihr Vorhaben..." /></div>
      <button type="submit" className="form-submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Wird gesendet…' : 'Anfrage senden →'}
      </button>
      {status === 'err' && <p className="form-err">{err}</p>}
    </form>
  )
}
