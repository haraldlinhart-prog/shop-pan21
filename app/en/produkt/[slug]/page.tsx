'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { PRODUCTS_EN, CATEGORY_NAME_EN } from '@/lib/products.en'
import { BalanceWidget } from '@/components/BalanceWidget'
import { notFound } from 'next/navigation'
import '@/app/globals.css'
import '../../../produkt/[slug]/produkt.css'

// English mirror of app/produkt/[slug]/page.tsx — see that file for the
// canonical German version. Kept as a parallel component (not a shared one)
// so nothing here can ever affect the German product page.

function ProduktContentEn({ slug }: { slug: string }) {
  const product = PRODUCTS_EN.find(p => p.slug === slug)
  if (!product) return notFound()

  const searchParams = useSearchParams()
  const refFromUrl = searchParams.get('ref') || ''
  const [affiliateRef, setAffiliateRef] = useState(refFromUrl)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [noblePaid, setNoblePaid] = useState<any>(null)
  const [europanPreview, setEuropanPreview] = useState<{ finalTotal: number; fullyCovered: boolean; doppelWumsIncluded: boolean; pay: () => void } | null>(null)
  const [payingEuropan, setPayingEuropan] = useState(false)
  const [inquiryStatus, setInquiryStatus] = useState<'idle'|'sending'|'ok'|'err'>('idle')
  const [formstart] = useState(Date.now())
  const [inquiryData, setInquiryData] = useState({ name:'', email:'', phone:'', message:'' })
  const [checkoutToken, setCheckoutToken] = useState('')

  useEffect(() => {
    fetch(`/api/checkout-token?slug=${encodeURIComponent(product.slug)}`)
      .then(r => r.json())
      .then(d => { if (d.token) setCheckoutToken(d.token) })
      .catch(() => {})
  }, [product.slug])

  useEffect(() => {
    if (!refFromUrl) {
      const match = document.cookie.match(/pan21_ref=([^;]+)/)
      if (match) setAffiliateRef(decodeURIComponent(match[1]))
    } else {
      document.cookie = `pan21_ref=${refFromUrl}; max-age=${60*60*24*30}; path=/; samesite=lax`
    }
  }, [refFromUrl])

  async function handleBuy(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return setError('Please enter an email address.')
    if (!checkoutToken) return setError('Page is still loading, please wait a moment.')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: product.slug, email, affiliate_ref: affiliateRef, token: checkoutToken, lang: 'en' }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setError(data.error || 'Checkout error.')
    } catch { setError('Network error.') }
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
        body: JSON.stringify({ ...inquiryData, interest: product.name, elapsed: Date.now() - formstart, inquiry: true }),
      })
      if (res.ok) setInquiryStatus('ok')
      else setInquiryStatus('err')
    } catch { setInquiryStatus('err') }
  }

  const related = PRODUCTS_EN.filter(p => p.slug !== product.slug && p.category === product.category).slice(0, 2)

  return (
    <div>
      <nav className="nav">
        <div className="container nav-inner">
          <Link href="/en" className="nav-logo">
            <div className="nav-logo-mark">P21</div>
            <div>
              <span className="nav-logo-text">PAN21 Shop</span>
              <span className="nav-logo-sub">Corporate Services</span>
            </div>
          </Link>
          <ul className="nav-links">
            <li><Link href="/en/#products">← All products</Link></li>
          </ul>
          <div className="nav-actions">
            <Link href={`/produkt/${product.slug}`} className="btn-outline" style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)', fontSize: '0.78rem' }}>🇩🇪 Deutsch</Link>
            <Link href="/en/#contact" className="btn-outline" style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)', fontSize: '0.78rem' }}>Request advice</Link>
          </div>
        </div>
      </nav>

      <div style={{ paddingTop: '68px', background: 'var(--snow)', minHeight: '100vh' }}>
        <div className="container" style={{ padding: '3rem 2rem' }}>
          <div className="breadcrumb">
            <Link href="/en">Shop</Link> <span>/</span>
            <Link href="/en/#products">Products</Link> <span>/</span>
            <span>{product.name}</span>
          </div>

          {affiliateRef && (
            <div style={{ fontSize: '0.72rem', color: '#5C6B7A', background: '#F0FDF4', border: '1px solid #86EFAC', padding: '0.5rem 1rem', marginBottom: '1.5rem', borderRadius: '3px' }}>
              ✓ Partner link active — you're supporting our partner with this order.
            </div>
          )}

          {noblePaid && (
            <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderLeft: '4px solid #16A34A', padding: '1rem 1.25rem', marginBottom: '1.5rem', borderRadius: '3px' }}>
              <div style={{ fontWeight: 700, color: '#15803D', marginBottom: '0.3rem' }}>Payment with Noble currency successful</div>
              <div style={{ fontSize: '0.82rem', color: '#166534' }}>
                Reference: <strong>{noblePaid.order_reference}</strong> · Doppel-Wums bonus credited.
              </div>
            </div>
          )}

          {/* 3-column layout */}
          <div className="produkt-layout">

            {/* Column 1: Product details */}
            <div className="produkt-main">
              {(product.heroImage || product.image) && (
                <div style={{ marginBottom: '1.5rem', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--lgray)', background: 'var(--snow)', aspectRatio: '1 / 1' }}>
                  <img
                    src={product.heroImage || product.image}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: product.heroImage ? 'contain' : 'cover', display: 'block' }}
                    onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
                  />
                </div>
              )}
              <div className="produkt-cat">{product.flag} {CATEGORY_NAME_EN[product.category] || product.category}</div>
              <h1 className="produkt-title">{product.name}</h1>
              <p className="produkt-desc">{product.shortDesc}</p>

              <div className="detail-block">
                <h3 className="detail-title">Included in the package</h3>
                <ul className="detail-list included">
                  {product.included.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>

              <div className="detail-block">
                <h3 className="detail-title">Not included in the base package</h3>
                <ul className="detail-list not-included">
                  {product.notIncluded.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>

              {product.addons.length > 0 && (
                <div className="detail-block">
                  <h3 className="detail-title">Possible add-ons</h3>
                  <ul className="detail-list addons">
                    {product.addons.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              )}

              <div className="detail-block">
                <h3 className="detail-title">Process</h3>
                <ol className="process-list">
                  {product.process.map((step, i) => (
                    <li key={i}>
                      <span className="process-num">{String(i+1).padStart(2,'0')}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="hint-box"><strong>Note:</strong> {product.hint}</div>

              <div className="europan-box">
                <div className="europan-badge">EUROPAN</div>
                <p>
                  With a Noble account you can pay with EUROPAN, N-Coin, SwissyCash or CryptoCoin
                  and get the <strong style={{ color: '#C9963A' }}>Doppel-Wums bonus: 5% EUROPAN</strong> back.
                  See your balance on the right.
                </p>
              </div>
            </div>

            {/* Column 2: Order / Stripe */}
            <div className="order-box-wrap">
              <div className="order-box">
                <div className="order-product-name">{product.flag} {product.name}</div>
                <div className="order-price">
                  {product.price
                    ? (europanPreview && europanPreview.fullyCovered
                        ? <>
                            <span style={{ fontSize: '1.1rem', color: 'var(--gray)', textDecoration: 'line-through', fontWeight: 400, marginRight: '0.6rem' }}>
                              €{product.price.toLocaleString('en-US')}
                            </span>
                            <span style={{ color: '#1B7A3D' }}>€{europanPreview.finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span className="order-price-note"> EUR</span>
                          </>
                        : <>€{product.price.toLocaleString('en-US')}<span className="order-price-note"> EUR</span></>
                      )
                    : <span style={{ fontSize: '1rem', color: 'var(--gold2)' }}>{product.priceLabel}</span>
                  }
                </div>
                {product.price && <p className="order-hint" style={{ marginBottom: europanPreview && europanPreview.fullyCovered ? '0.9rem' : '0' }}>Plus any government and notary fees.</p>}
                {europanPreview && europanPreview.fullyCovered && (
                  <div style={{ background: '#E8F5EE', border: '1px solid #B7E4CC', borderRadius: '6px', padding: '0.75rem 0.9rem', marginBottom: '1.25rem', fontSize: '0.78rem', color: '#1B7A3D', lineHeight: 1.6 }}>
                    Before EUROPAN bonus: <strong>€{product.price?.toLocaleString('en-US')}</strong><br />
                    Cart price with EUROPAN{europanPreview.doppelWumsIncluded ? ' + Doppel-Wums' : ''}: <strong>€{europanPreview.finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </div>
                )}

                {!product.inquiry ? (
                  !noblePaid ? (
                    europanPreview && europanPreview.fullyCovered ? (
                      <div style={{ marginTop: '1.5rem' }}>
                        <button
                          type="button"
                          disabled={payingEuropan}
                          onClick={async () => {
                            setPayingEuropan(true)
                            try { await europanPreview.pay() } finally { setPayingEuropan(false) }
                          }}
                          style={{ width: '100%', background: '#0D5C33', color: '#fff', border: 'none', padding: '0.95rem', borderRadius: '4px', fontSize: '0.92rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          {payingEuropan ? 'Processing…' : `Order now with EUROPAN payment — )( ${europanPreview.finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} →`}
                        </button>
                        <p style={{ fontSize: '0.7rem', color: 'var(--muted)', textAlign: 'center', marginTop: '0.5rem' }}>
                          Charged directly from your EUROPAN balance — no Stripe checkout needed.
                        </p>
                      </div>
                    ) : (
                    <form onSubmit={handleBuy} style={{ marginTop: '1.5rem' }}>
                      <div className="fg">
                        <label>Your email address *</label>
                        <input
                          type="email" required placeholder="your@email.com"
                          value={email} onChange={e => setEmail(e.target.value)}
                        />
                      </div>
                      {error && <p className="form-err">{error}</p>}
                      <button type="submit" className="form-submit" disabled={loading}>
                        {loading ? 'Redirecting…' : `Order now — €${product.price?.toLocaleString('en-US')} →`}
                      </button>
                      <p style={{ fontSize: '0.7rem', color: 'var(--muted)', textAlign: 'center', marginTop: '0.5rem' }}>
                        Secure checkout via Stripe
                      </p>
                      <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--snow)', border: '1px solid var(--lgray)', borderRadius: '3px', fontSize: '0.75rem', color: 'var(--gray)' }}>
                        Have a Noble account? Use your balance in the column on the right and pay with virtual currency.
                      </div>
                    </form>
                    )
                  ) : (
                    <div style={{ marginTop: '1.5rem', textAlign: 'center', padding: '1.5rem 0' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>✓</div>
                      <div style={{ fontFamily: 'var(--ff-d)', fontSize: '1.1rem', color: 'var(--navy)' }}>Paid with Noble currency</div>
                    </div>
                  )
                ) : (
                  inquiryStatus === 'ok' ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>✓</div>
                      <div style={{ fontFamily: 'var(--ff-d)', fontSize: '1.1rem', color: 'var(--navy)' }}>Enquiry received</div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--gray)', marginTop: '0.4rem' }}>We will get back to you within one business day.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleInquiry} style={{ marginTop: '1.5rem' }}>
                      <div className="hp-field"><input type="text" name="website" tabIndex={-1} autoComplete="off" /></div>
                      <div className="fg"><label>Name *</label><input type="text" required placeholder="Your name" value={inquiryData.name} onChange={e => setInquiryData(p=>({...p,name:e.target.value}))} /></div>
                      <div className="fg"><label>Email *</label><input type="email" required placeholder="your@email.com" value={inquiryData.email} onChange={e => setInquiryData(p=>({...p,email:e.target.value}))} /></div>
                      <div className="fg"><label>Phone</label><input type="tel" placeholder="+1..." value={inquiryData.phone} onChange={e => setInquiryData(p=>({...p,phone:e.target.value}))} /></div>
                      <div className="fg"><label>Your situation</label><textarea placeholder="Briefly describe what you have in mind…" value={inquiryData.message} onChange={e => setInquiryData(p=>({...p,message:e.target.value}))} style={{minHeight:'90px'}} /></div>
                      {inquiryStatus === 'err' && <p className="form-err">Error. Please try again.</p>}
                      <button type="submit" className="btn-inquiry" style={{width:'100%',textAlign:'center'}} disabled={inquiryStatus==='sending'}>
                        {inquiryStatus==='sending' ? 'Sending…' : 'Enquire, no obligation →'}
                      </button>
                    </form>
                  )
                )}

                <div className="order-trust">
                  <div className="trust-item">🔒 Secure connection via Stripe</div>
                  <div className="trust-item">💎 Noble currency in the column on the right</div>
                  <div className="trust-item">✉️ Reply within 1 business day</div>
                </div>
              </div>

              {related.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.75rem' }}>
                    Related products
                  </div>
                  {related.map(r => (
                    <Link key={r.slug} href={`/en/produkt/${r.slug}`} style={{ display:'flex', gap:'0.75rem', padding:'0.75rem', background:'var(--white)', border:'1px solid var(--lgray)', marginBottom:'0.5rem', borderRadius:'3px' }}>
                      <span style={{ fontSize: '1.3rem' }}>{r.flag}</span>
                      <div>
                        <div style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--navy)' }}>{r.name}</div>
                        <div style={{ fontSize:'0.75rem', color:'var(--gold2)' }}>{r.price ? `€${r.price.toLocaleString('en-US')}` : 'On request'}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Column 3: Noble balance widget */}
            {!product.inquiry && product.price && (
              <BalanceWidget
                slug={product.slug}
                price={product.price}
                productName={product.name}
                affiliateRef={affiliateRef}
                lang="en"
                onNoblePayment={(result) => setNoblePaid(result)}
                onPriceUpdate={setEuropanPreview}
              />
            )}

          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-links">
            <Link href="/en">← Back to shop</Link>
            <a href="https://pan21.com" target="_blank" rel="noopener">PAN21.com</a>
            <a href="https://noble-limited.com" target="_blank" rel="noopener">Noble Limited</a>
          </div>
          <p className="footer-legal">© {new Date().getFullYear()} PAN21.COM Corporate Consultants Ltd · All prices in EUR, plus any government fees and external costs.</p>
        </div>
      </footer>
    </div>
  )
}

import { Suspense } from 'react'
export default function ProduktPageEn({ params }: { params: { slug: string } }) {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>Loading…</div>}>
      <ProduktContentEn slug={params.slug} />
    </Suspense>
  )
}
