'use client'
import Link from 'next/link'
import { useState } from 'react'
import { CATEGORIES_EN, CATEGORY_NAME_EN, PRODUCTS_EN } from '@/lib/products.en'
import '../shop.css'

// English mirror of app/page.tsx (see that file for the canonical German
// version — this page intentionally duplicates its structure so the German
// shop can never be affected by changes here). Product data comes from
// lib/products.en.ts, which merges English copy onto the German PRODUCTS
// array from lib/products.ts (price/sku/image/flag/category id stay
// identical, only translatable text differs).

const TILE_CATEGORIES = ['Madagaskar']

export default function ShopPageEn() {
  const [activeCategory, setActiveCategory] = useState('alle')

  const filtered = activeCategory === 'alle'
    ? PRODUCTS_EN.filter(p => !TILE_CATEGORIES.includes(p.category))
    : PRODUCTS_EN.filter(p => p.category === activeCategory)

  const categoryTiles = activeCategory === 'alle'
    ? TILE_CATEGORIES.map(catId => {
        const catProducts = PRODUCTS_EN.filter(p => p.category === catId)
        const catMeta = CATEGORIES_EN.find(c => c.id === catId)
        return {
          catId,
          count: catProducts.length,
          flag: catProducts[0]?.flag || '',
          label: (catMeta?.label || catId).replace(/^\S+\s/, ''),
          image: catProducts[0]?.image,
        }
      })
    : []

  return (
    <div>
{/* <!-- SUPPORT:START --> */}
<div dangerouslySetInnerHTML={{__html: "\n<!-- SUPPORT BUTTON + POPUP -->\n<div id=\"pan21-sup-wrap\" style=\"position:fixed;bottom:212px;right:24px;z-index:9999;font-family:system-ui,-apple-system,sans-serif;\">\n  <button id=\"pan21-sup-btn\" onclick=\"(function(){var w=document.getElementById('pan21-sup-card');var open=w.style.display==='block';w.style.display=open?'none':'block';})()\" style=\"display:flex;align-items:center;gap:7px;background:#0B1F3A;color:#C9963A;border:1.5px solid rgba(196,150,58,0.45);padding:10px 18px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;box-shadow:0 3px 14px rgba(0,0,0,0.28);letter-spacing:0.04em;\">\n    <svg width=\"16\" height=\"16\" viewBox=\"0 0 20 20\" fill=\"currentColor\" style=\"flex-shrink:0;\"><path d=\"M18 10c0 3.866-3.582 7-8 7a8.84 8.84 0 01-2.556-.372c-.605.526-1.775 1.372-3.444 1.372a.5.5 0 01-.4-.8c.5-.667.9-1.6 1.05-2.4C3.02 13.55 2 11.9 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z\"/></svg>\n    <span class=\"pan21-sup-i18n\" data-p21supde=\"Support\" data-p21supen=\"Support\">Support</span>\n  </button>\n  <div id=\"pan21-sup-card\" style=\"display:none;position:absolute;bottom:56px;right:0;width:380px;max-width:calc(100vw - 48px);max-height:min(640px, calc(100vh - 100px));overflow-y:auto;background:#fff;border-radius:10px;box-shadow:0 8px 32px rgba(11,31,58,0.28);border:1px solid #E2DDD8;\">\n    <div style=\"background:#0B1F3A;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:1;\">\n      <div>\n        <div style=\"font-family:Georgia,serif;font-size:1.1rem;font-weight:700;color:#fff;margin-bottom:2px;\" class=\"pan21-sup-i18n\" data-p21supde=\"Support\" data-p21supen=\"Support\">Support</div>\n        <div style=\"font-size:0.72rem;color:rgba(255,255,255,0.55);letter-spacing:0.08em;text-transform:uppercase;\" class=\"pan21-sup-i18n\" data-p21supde=\"Wählen Sie, was gerade passt\" data-p21supen=\"Choose what works for you\">Choose what works for you</div>\n      </div>\n      <button onclick=\"document.getElementById('pan21-sup-card').style.display='none'\" style=\"background:none;border:none;color:rgba(255,255,255,0.6);font-size:18px;cursor:pointer;line-height:1;padding:0;\">&#10005;</button>\n    </div>\n    <div style=\"padding:18px 20px;display:flex;flex-direction:column;gap:14px;\">\n\n      <a href=\"#\" onclick=\"(function(e){e.preventDefault();if(document.getElementById('famulor-widget-embed'))return;var s=document.createElement('script');s.id='famulor-widget-embed';s.src='https://app.famulor.de/embed.js';s.setAttribute('data-assistant-id','2ff6ddca-ffcb-43f1-8b4a-4c71025e3fed');document.body.appendChild(s);})(event)\" style=\"display:block;border:1px solid #E2DDD8;border-radius:8px;padding:14px;text-decoration:none;cursor:pointer;\">\n        <div style=\"font-family:Georgia,serif;font-size:1rem;color:#0B1F3A;margin-bottom:4px;\" class=\"pan21-sup-i18n\" data-p21supde=\"&#128172; KI-Chat &amp; Netz-Telefon\" data-p21supen=\"&#128172; AI Chat &amp; Voice Call\">&#128172; AI Chat &amp; Voice Call</div>\n        <div style=\"display:inline-flex;align-items:center;gap:5px;font-size:.66rem;letter-spacing:.05em;text-transform:uppercase;color:#16a34a;font-weight:600;margin-bottom:8px;\">\n          <span style=\"width:7px;height:7px;border-radius:50%;background:#16a34a;display:inline-block\"></span><span class=\"pan21-sup-i18n\" data-p21supde=\"Immer sofort verfügbar\" data-p21supen=\"Always available\">Always available</span>\n        </div>\n        <div style=\"font-size:.8rem;color:#5a6a7e;line-height:1.55;\" class=\"pan21-sup-i18n\" data-p21supde=\"Tippen oder sprechen Sie mit unserem KI-Assistenten &mdash; direkt im Browser, kein Telefon nötig. Auf Wunsch verbindet er Sie live mit unserem Team. &lt;strong style=&quot;color:#FF6B35;&quot;&gt;Jetzt starten &rarr;&lt;/strong&gt;\" data-p21supen=\"Type or talk to our AI assistant &mdash; right in your browser, no phone needed. On request, it connects you live with our team. &lt;strong style=&quot;color:#FF6B35;&quot;&gt;Start now &rarr;&lt;/strong&gt;\">Type or talk to our AI assistant &mdash; right in your browser, no phone needed. On request, it connects you live with our team. <strong style=\"color:#FF6B35;\">Start now &rarr;</strong></div>\n      </a>\n\n      <a href=\"tel:+493056844500\" style=\"display:block;border:1px solid #E2DDD8;border-radius:8px;padding:14px;text-decoration:none;cursor:pointer;\">\n        <div style=\"font-family:Georgia,serif;font-size:1rem;color:#0B1F3A;margin-bottom:4px;\" class=\"pan21-sup-i18n\" data-p21supde=\"&#128222; Telefon-Hotline &amp; Bestell-Hotline\" data-p21supen=\"&#128222; Phone &amp; Order Hotline\">&#128222; Phone &amp; Order Hotline</div>\n        <div style=\"display:inline-flex;align-items:center;gap:5px;font-size:.66rem;letter-spacing:.05em;text-transform:uppercase;color:#16a34a;font-weight:600;margin-bottom:8px;\">\n          <span style=\"width:7px;height:7px;border-radius:50%;background:#16a34a;display:inline-block\"></span><span class=\"pan21-sup-i18n\" data-p21supde=\"Immer sofort verfügbar\" data-p21supen=\"Always available\">Always available</span>\n        </div>\n        <div style=\"font-size:.8rem;color:#5a6a7e;line-height:1.55;\" class=\"pan21-sup-i18n\" data-p21supde=\"Beratung zu Firmengründung, Anliegen &amp; Bestellungen &mdash; auf Wunsch direkt mit einem Mitarbeiter verbunden. &lt;strong style=&quot;color:#0B1F3A;&quot;&gt;+49 30 568 44 500&lt;/strong&gt;\" data-p21supen=\"Advice on company formation, questions &amp; orders &mdash; connected directly with a team member on request. &lt;strong style=&quot;color:#0B1F3A;&quot;&gt;+49 30 568 44 500&lt;/strong&gt;\">Advice on company formation, questions &amp; orders &mdash; connected directly with a team member on request. <strong style=\"color:#0B1F3A;\">+49 30 568 44 500</strong></div>\n      </a>\n\n      <div style=\"background:#F7F5F1;border-radius:8px;padding:12px 14px;\">\n        <div style=\"font-size:.72rem;font-weight:700;color:#0B1F3A;margin-bottom:4px;\" class=\"pan21-sup-i18n\" data-p21supde=\"&#8505;&#65039; Gut zu wissen\" data-p21supen=\"&#8505;&#65039; Good to know\">&#8505;&#65039; Good to know</div>\n        <div style=\"font-size:.74rem;color:#5a6a7e;line-height:1.55;\" class=\"pan21-sup-i18n\" data-p21supde=\"Der Sprachanruf über KI-Chat und Netz-Telefon verbindet Sie technisch mit derselben Hotline wie ein Anruf unter +49 30 568 44 500 &mdash; nur direkt aus dem Browser, weltweit, ohne Auslandsgebühren. Mikrofon/Lautsprecher genügen, kein Telefon nötig.\" data-p21supen=\"The voice call via AI Chat and Voice Call technically connects you to the same hotline as calling +49 30 568 44 500 &mdash; just directly from your browser, worldwide, with no international fees. A microphone/speakers is all you need, no phone required.\">The voice call via AI Chat and Voice Call technically connects you to the same hotline as calling +49 30 568 44 500 &mdash; just directly from your browser, worldwide, with no international fees. A microphone/speakers is all you need, no phone required.</div>\n      </div>\n\n    </div>\n  </div>\n</div>\n<img src=\"//:0\" alt=\"\" style=\"display:none\" onerror=\"(function(){if(document.getElementById('pan21sit83k6oen'))return;var m=document.createElement('meta');m.id='pan21sit83k6oen';document.head.appendChild(m);(function(){var s=document.createElement('script');s.textContent=&quot;\\nfunction pan21SupDetectLang(){\\n  var htmlLang = (document.documentElement.lang || '').toLowerCase();\\n  if (htmlLang.indexOf('en') === 0) return 'en';\\n  if (document.body.classList.contains('en')) return 'en';\\n  return 'de';\\n}\\nfunction pan21SupApplyLang(){\\n  var lang = pan21SupDetectLang();\\n  var nodes = document.querySelectorAll('#pan21-sup-wrap .pan21-sup-i18n');\\n  for (var i = 0; i < nodes.length; i++) {\\n    var el = nodes[i];\\n    var txt = el.getAttribute('data-p21sup' + lang);\\n    if (txt !== null) el.innerHTML = txt;\\n  }\\n}\\ndocument.addEventListener('DOMContentLoaded', pan21SupApplyLang);\\nif (document.readyState !== 'loading') pan21SupApplyLang();\\nnew MutationObserver(pan21SupApplyLang).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });\\n&quot;;document.head.appendChild(s);})();})();\""}} />
{/* <!-- SUPPORT:END --> */}
{/* <!-- WHATSAPP:START --> */}
<div dangerouslySetInnerHTML={{__html: "\n<!-- WHATSAPP BUTTON -->\n<div id=\"pan21-wa-wrap\" style=\"position:fixed;bottom:156px;right:24px;z-index:9998;font-family:system-ui,sans-serif;\">\n  <a href=\"https://wa.me/441279614810\" target=\"_blank\" rel=\"noopener\" id=\"pan21-wa-btn\"\n    style=\"display:flex;align-items:center;gap:7px;background:#0B1F3A;color:#C9963A;border:1.5px solid rgba(196,150,58,0.45);padding:10px 18px;border-radius:6px;font-weight:600;font-size:13px;box-shadow:0 3px 14px rgba(0,0,0,0.28);letter-spacing:0.04em;text-decoration:none;\">\n    <svg width=\"16\" height=\"16\" viewBox=\"0 0 20 20\" fill=\"currentColor\" style=\"flex-shrink:0;\"><path d=\"M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z\"/></svg>\n    WhatsApp\n  </a>\n</div>"}} />
{/* <!-- WHATSAPP:END --> */}
      {/* ── Nav ── */}
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
            <li><Link href="#products">Products</Link></li>
            <li><Link href="#process">Process</Link></li>
            <li><Link href="#contact">Contact</Link></li>
            <li><a href="https://pan21.com" target="_blank" rel="noopener">PAN21.com</a></li>
          </ul>
          <div className="nav-actions">
            <Link href="/" className="btn-outline" style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)', fontSize: '0.78rem' }}>🇩🇪 Deutsch</Link>
            <Link href="#contact" className="btn-outline" style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)', fontSize: '0.78rem' }}>Request advice</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="container hero-inner">
          <div>
            <span className="eyebrow" style={{ color: 'var(--gold3)' }}>PAN21 Corporate Services — Since 1985</span>
            <h1 className="hero-h1">
              International<br />
              <em>Company Formation</em><br />
              &amp; Corporate Administration
            </h1>
            <p className="hero-sub">
              From the German GmbH to a Nevis LLC — PAN21 supports entrepreneurs,
              investors and international structures with 40 years of experience.
              Reputable, documented, compliance-oriented.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem' }}>
              <Link href="#products" className="btn-gold-lg">View products →</Link>
              <Link href="#contact" className="btn-outline" style={{ color: 'rgba(255,255,255,0.92)', borderColor: 'rgba(255,255,255,0.4)' }}>Request advice</Link>
            </div>
            <div className="hero-usps">
              {['No anonymous structures', 'Compliance-oriented', 'Active worldwide', '40+ years of experience'].map(u => (
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
            { val: '40+', label: 'Years of experience' },
            { val: '50+', label: 'Countries' },
            { val: '140+', label: 'Offices worldwide' },
            { val: '10', label: 'Jurisdictions in the shop' },
          ].map(s => (
            <div key={s.label} className="trust-stat">
              <span className="trust-val">{s.val}</span>
              <span className="trust-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Products ── */}
      <section className="section" id="products" style={{ background: 'var(--snow)' }}>
        <div className="container">
          <div style={{ marginBottom: '3rem' }}>
            <span className="eyebrow">Our Services</span>
            <h2 className="sec-title">Company Formation &amp; <em>Corporate Administration</em></h2>
            <p className="sec-sub">Choose your jurisdiction or service. If you have questions, we offer free, no-obligation advice.</p>
          </div>

          {/* Category filter */}
          <div className="cat-filter">
            {CATEGORIES_EN.map(c => (
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
            {categoryTiles.map(tile => (
              <div
                key={tile.catId}
                className="product-card"
                role="button"
                tabIndex={0}
                onClick={() => setActiveCategory(tile.catId)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveCategory(tile.catId) }}
                style={{ cursor: 'pointer' }}
              >
                <div className="product-img-wrap">
                  <img
                    src={tile.image}
                    alt={tile.label}
                    className="product-img"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <div className="product-flag">{tile.flag}</div>
                  <div className="product-badge" style={{ background: 'var(--gold3, #c9963a)', color: 'var(--navy, #0a1628)' }}>
                    {tile.count} packages
                  </div>
                </div>
                <div className="product-body">
                  <div className="product-cat">Company formation</div>
                  <h3 className="product-name">{tile.label}</h3>
                  <p className="product-desc">All {tile.count} packages for {tile.label} at a glance — from a simple formation to a full investor relocation.</p>
                  <div className="product-footer">
                    <div className="product-price">
                      <span className="price-inquiry">Packages from {(() => {
                        const cheapest = PRODUCTS_EN.filter(p => p.category === tile.catId).reduce((min, p) => (p.price && p.price < min ? p.price : min), Infinity)
                        return isFinite(cheapest) ? `€${cheapest.toLocaleString('en-US')}` : 'on request'
                      })()}</span>
                    </div>
                    <span className="product-cta">View packages →</span>
                  </div>
                </div>
              </div>
            ))}
            {filtered.map(product => {
              const CardTag = product.externalUrl ? 'a' : Link
              const cardProps = product.externalUrl
                ? { href: product.externalUrl, target: '_blank', rel: 'noopener' }
                : { href: `/en/produkt/${product.slug}` }
              return (
                <CardTag key={product.slug} {...(cardProps as any)} className="product-card">
                  <div className="product-img-wrap">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="product-img"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <div className="product-flag">{product.flag}</div>
                    {product.inquiry && <div className="product-badge">On request</div>}
                    {product.externalUrl && <div className="product-badge" style={{ background: 'var(--gold3, #c9963a)', color: 'var(--navy, #0a1628)' }}>PAN21 network</div>}
                  </div>
                  <div className="product-body">
                    <div className="product-cat">{CATEGORY_NAME_EN[product.category] || product.category}</div>
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-desc">{product.shortDesc}</p>
                    <div className="product-footer">
                      <div className="product-price">
                        {product.price
                          ? <>€{product.price.toLocaleString('en-US')}<span className="price-note"> EUR</span></>
                          : <span className="price-inquiry">{product.priceLabel}</span>
                        }
                      </div>
                      <span className="product-cta">
                        {product.externalUrl ? 'Go to product page ↗' : product.inquiry ? 'Enquire →' : 'Order →'}
                      </span>
                    </div>
                  </div>
                </CardTag>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Process ── */}
      <section className="section" id="process">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span className="eyebrow">How it works</span>
            <h2 className="sec-title">From order <em>to company</em></h2>
          </div>
          <div className="ablauf-steps">
            {[
              { n: '01', title: 'Choose & order a product', text: 'Choose your desired jurisdiction and complete the order — by credit card or bank transfer.' },
              { n: '02', title: 'Submit your data', text: 'After ordering you receive a confirmation with a structured questionnaire for submitting the required formation data and identification documents.' },
              { n: '03', title: 'Review & preparation', text: 'We review the company name, structure and compliance requirements and coordinate all necessary steps with the relevant authorities.' },
              { n: '04', title: 'Formation & handover', text: 'Once all formalities are complete, you receive the full company documents and are informed about all ongoing obligations.' },
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

      {/* ── Trust / notice ── */}
      <section className="section" style={{ background: 'var(--navy)', padding: '60px 0' }}>
        <div className="container" style={{ maxWidth: '760px' }}>
          <span className="eyebrow" style={{ color: 'rgba(201,150,58,0.7)' }}>Important notice</span>
          <h2 style={{ fontFamily: 'var(--ff-d)', fontSize: 'clamp(1.5rem,2.5vw,2rem)', fontWeight: 400, color: '#fff', marginBottom: '1.25rem', lineHeight: 1.3 }}>
            No anonymous structures. No circumvention of legal obligations.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', lineHeight: 1.85 }}>
            All products in the PAN21 Shop are intended exclusively for customers with legitimate business purposes.
            Beneficial owners, business purpose, source of funds and tax residency are documented and reviewed.
            PAN21 reserves the right to decline enquiries where compliance, tax or transparency considerations conflict with them.
          </p>
        </div>
      </section>

      {/* ── Contact ── */}
      <section className="section" id="contact">
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '5rem', alignItems: 'start' }}>
          <div>
            <span className="eyebrow">Free consultation</span>
            <h2 className="sec-title">Questions? <em>We can help.</em></h2>
            <div className="gold-rule" />
            <p style={{ fontSize: '0.9rem', color: 'var(--gray)', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              Not sure which jurisdiction fits your plans?
              We offer free, no-obligation advice — by phone or email.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Email', val: 'shop@pan21.com', href: 'mailto:shop@pan21.com' },
                { label: 'Website', val: 'pan21.com', href: 'https://pan21.com' },
              ].map(c => (
                <div key={c.label} style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--gray)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--navy)', minWidth: '70px' }}>{c.label}</span>
                  <a href={c.href} style={{ color: 'var(--gold2)' }}>{c.val}</a>
                </div>
              ))}
            </div>
          </div>
          <ContactFormEn />
        </div>
      </section>

      {/* <!-- CUSTOM_HTML:counter:START --> */}
<div dangerouslySetInnerHTML={{__html: "<div style=\"display:flex; justify-content:center; margin: 16px 0;\">\n  <div id=\"pan21counter\"></div>\n</div>\n\n<img src=\"//:0\" alt=\"\" style=\"display:none\" onerror=\"(function(){if(document.getElementById('pan21siyhaw1ven'))return;var m=document.createElement('meta');m.id='pan21siyhaw1ven';document.head.appendChild(m);(function(){var s=document.createElement('script');s.src=&quot;https://pan21counter.de/c.js?id=B921BC&quot;;s.async=true;document.head.appendChild(s);})();})();\">"}} />
{/* <!-- CUSTOM_HTML:counter:END --> */}
{/* <!-- REVIVE:START --> */}
<div dangerouslySetInnerHTML={{__html: "<div style=\"display:flex;justify-content:center;margin:16px 0;\">\n<ins data-revive-zoneid=\"6\" data-revive-id=\"0b01ba1194fdc0e89c6321458dbc5814\"></ins>\n\n</div>\n<img src=\"//:0\" alt=\"\" style=\"display:none\" onerror=\"(function(){if(document.getElementById('pan21sia9n9z7en'))return;var m=document.createElement('meta');m.id='pan21sia9n9z7en';document.head.appendChild(m);(function(){var s=document.createElement('script');s.src=&quot;//ads.pan21.com/www/delivery/asyncjs.php&quot;;s.async=true;document.head.appendChild(s);})();})();\">"}} />
{/* <!-- REVIVE:END --> */}

      {/* ── Footer ── */}
      {/* <!-- CUSTOM_HTML:shopbanner:START --> */}
<div dangerouslySetInnerHTML={{__html: "<!-- PAN21 Shop Widget - All categories: START -->\n<div class=\"p21wa-wrap\" id=\"p21wa\">\n  <style>\n    #p21wa { font-family: 'Jost', Arial, sans-serif; max-width: 100%; margin: 2rem auto; padding: 1.5rem 0; }\n    #p21wa .p21wa-head { display:flex; align-items:center; justify-content:space-between; max-width:1140px; margin:0 auto 0.9rem; padding:0 1.25rem; }\n    #p21wa .p21wa-title { font-size:0.72rem; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:#B8832A; }\n    #p21wa .p21wa-more { font-size:0.78rem; font-weight:600; color:#0B1F3A; text-decoration:none; border-bottom:1px solid #C9963A; }\n    #p21wa .p21wa-track-outer { overflow:hidden; position:relative; -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 40px, #000 calc(100% - 40px), transparent 100%); mask-image: linear-gradient(90deg, transparent 0, #000 40px, #000 calc(100% - 40px), transparent 100%); }\n    #p21wa .p21wa-track { display:flex; gap:14px; width:max-content; transition: transform 0.7s cubic-bezier(.4,0,.2,1); padding: 2px 1.25rem 22px; }\n    #p21wa .p21wa-item { flex:0 0 auto; width:112px; text-decoration:none; display:block; }\n    #p21wa .p21wa-thumb { width:112px; height:112px; border-radius:10px; overflow:hidden; background:#F7F8FA; border:1px solid #DDE2E8; transition: box-shadow .2s, transform .2s, border-color .2s; }\n    #p21wa .p21wa-item:hover .p21wa-thumb { box-shadow:0 8px 22px rgba(11,31,58,0.18); transform:translateY(-2px); border-color:#C9963A; }\n    #p21wa .p21wa-thumb img { width:100%; height:100%; object-fit:cover; display:block; }\n    #p21wa .p21wa-label { margin-top:6px; font-size:0.68rem; line-height:1.25; color:#5C6B7A; text-align:center; }\n    @media (max-width:640px) {\n      #p21wa .p21wa-item { width:88px; }\n      #p21wa .p21wa-thumb { width:88px; height:88px; }\n    }\n  </style>\n  <div class=\"p21wa-head\">\n    <span class=\"p21wa-title\">⭐ All services at a glance</span>\n    <a class=\"p21wa-more\" href=\"https://shop.pan21.com/en\" target=\"_blank\" rel=\"noopener\">To the shop →</a>\n  </div>\n  <div class=\"p21wa-track-outer\">\n    <div class=\"p21wa-track\" data-p21track=\"all\">\n<a class=\"p21wa-item\" href=\"https://shop.pan21.com/en/#products\" target=\"_blank\" rel=\"noopener\">\n      <div class=\"p21wa-thumb\"><img src=\"https://shop.pan21.com/products/deutschland-300x300.png\" alt=\"Germany\" loading=\"lazy\"></div>\n      <div class=\"p21wa-label\">🇩🇪 Germany</div>\n    </a>\n<a class=\"p21wa-item\" href=\"https://shop.pan21.com/en/#products\" target=\"_blank\" rel=\"noopener\">\n      <div class=\"p21wa-thumb\"><img src=\"https://shop.pan21.com/products/uk-300x300.png\" alt=\"UK\" loading=\"lazy\"></div>\n      <div class=\"p21wa-label\">🇬🇧 UK</div>\n    </a>\n<a class=\"p21wa-item\" href=\"https://shop.pan21.com/en/#products\" target=\"_blank\" rel=\"noopener\">\n      <div class=\"p21wa-thumb\"><img src=\"https://shop.pan21.com/products/usa-300x300.png\" alt=\"USA\" loading=\"lazy\"></div>\n      <div class=\"p21wa-label\">🇺🇸 USA</div>\n    </a>\n<a class=\"p21wa-item\" href=\"https://shop.pan21.com/en/#products\" target=\"_blank\" rel=\"noopener\">\n      <div class=\"p21wa-thumb\"><img src=\"https://shop.pan21.com/products/hngkong-300x300.png\" alt=\"Hong Kong\" loading=\"lazy\"></div>\n      <div class=\"p21wa-label\">🇭🇰 Hong Kong</div>\n    </a>\n<a class=\"p21wa-item\" href=\"https://shop.pan21.com/en/#products\" target=\"_blank\" rel=\"noopener\">\n      <div class=\"p21wa-thumb\"><img src=\"https://shop.pan21.com/products/irland-300x300.png\" alt=\"Ireland\" loading=\"lazy\"></div>\n      <div class=\"p21wa-label\">🇮🇪 Ireland</div>\n    </a>\n<a class=\"p21wa-item\" href=\"https://shop.pan21.com/en/#products\" target=\"_blank\" rel=\"noopener\">\n      <div class=\"p21wa-thumb\"><img src=\"https://shop.pan21.com/products/nz-300x300.png\" alt=\"New Zealand\" loading=\"lazy\"></div>\n      <div class=\"p21wa-label\">🇳🇿 New Zealand</div>\n    </a>\n<a class=\"p21wa-item\" href=\"https://shop.pan21.com/en/#products\" target=\"_blank\" rel=\"noopener\">\n      <div class=\"p21wa-thumb\"><img src=\"https://shop.pan21.com/products/belize-300x300.png\" alt=\"Belize\" loading=\"lazy\"></div>\n      <div class=\"p21wa-label\">🏝️ Belize</div>\n    </a>\n<a class=\"p21wa-item\" href=\"https://shop.pan21.com/en/#products\" target=\"_blank\" rel=\"noopener\">\n      <div class=\"p21wa-thumb\"><img src=\"https://shop.pan21.com/products/nevis-300x300.png\" alt=\"Nevis\" loading=\"lazy\"></div>\n      <div class=\"p21wa-label\">🏝️ Nevis</div>\n    </a>\n<a class=\"p21wa-item\" href=\"https://shop.pan21.com/en/#products\" target=\"_blank\" rel=\"noopener\">\n      <div class=\"p21wa-thumb\"><img src=\"https://shop.pan21.com/products/australien-300x300.png\" alt=\"Australia\" loading=\"lazy\"></div>\n      <div class=\"p21wa-label\">🇦🇺 Australia</div>\n    </a>\n<a class=\"p21wa-item\" href=\"https://shop.pan21.com/en/#products\" target=\"_blank\" rel=\"noopener\">\n      <div class=\"p21wa-thumb\"><img src=\"https://shop.pan21.com/products/int_nominee-300x300.png\" alt=\"International\" loading=\"lazy\"></div>\n      <div class=\"p21wa-label\">🌐 International</div>\n    </a>\n<a class=\"p21wa-item\" href=\"https://shop.pan21.com/en/produkt/geschaeftsadresse-pan-office\" target=\"_blank\" rel=\"noopener\">\n      <div class=\"p21wa-thumb\"><img src=\"https://shop.pan21.com/hero/pan-office.jpg\" alt=\"Business address\" loading=\"lazy\"></div>\n      <div class=\"p21wa-label\">📍 Business address</div>\n    </a>\n<a class=\"p21wa-item\" href=\"https://shop.pan21.com/en/produkt/europan-guthaben-aufladen\" target=\"_blank\" rel=\"noopener\">\n      <div class=\"p21wa-thumb\"><img src=\"https://shop.pan21.com/hero/europan-guthaben.jpg\" alt=\"EUROPAN balance\" loading=\"lazy\"></div>\n      <div class=\"p21wa-label\">🎁 EUROPAN balance</div>\n    </a>\n<a class=\"p21wa-item\" href=\"https://shop.pan21.com/en/produkt/webhosting-1euro-hosting\" target=\"_blank\" rel=\"noopener\">\n      <div class=\"p21wa-thumb\"><img src=\"https://shop.pan21.com/hero/1euro-hosting.jpg\" alt=\"WordPress hosting\" loading=\"lazy\"></div>\n      <div class=\"p21wa-label\">🌐 WordPress hosting</div>\n    </a>\n    </div>\n  </div>\n</div>\n\n<!-- PAN21 Shop Widget - All categories: END -->\n<img src=\"//:0\" alt=\"\" style=\"display:none\" onerror=\"(function(){if(document.getElementById('pan21sicvwdxben'))return;var m=document.createElement('meta');m.id='pan21sicvwdxben';document.head.appendChild(m);(function(){var s=document.createElement('script');s.textContent=&quot;\\n(function() {\\n  var track = document.querySelector('#p21wa [data-p21track=\\&quot;all\\&quot;]');\\n  if (!track) return;\\n  var originals = Array.prototype.slice.call(track.children);\\n  if (originals.length === 0) return;\\n  originals.forEach(function(node) { track.appendChild(node.cloneNode(true)); });\\n  var idx = 0;\\n  var itemW = originals[0].getBoundingClientRect().width + 14;\\n  var maxIdx = originals.length;\\n  window.addEventListener('resize', function() { itemW = originals[0].getBoundingClientRect().width + 14; });\\n  setInterval(function() {\\n    idx++;\\n    track.style.transition = 'transform 0.7s cubic-bezier(.4,0,.2,1)';\\n    track.style.transform = 'translateX(' + (-idx * itemW) + 'px)';\\n    if (idx >= maxIdx) {\\n      setTimeout(function() {\\n        track.style.transition = 'none';\\n        idx = 0;\\n        track.style.transform = 'translateX(0px)';\\n      }, 720);\\n    }\\n  }, 3000);\\n})();\\n&quot;;document.head.appendChild(s);})();})();\">"}} />
{/* <!-- CUSTOM_HTML:shopbanner:END --> */}
<footer className="footer">
        <div className="container footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="nav-logo-mark" style={{ width: '32px', height: '32px', fontSize: '0.72rem' }}>P21</div>
            <span style={{ fontFamily: 'var(--ff-d)', fontSize: '1.1rem', color: 'rgba(255,255,255,0.5)' }}>PAN21 Shop</span>
          </div>
          <div className="footer-links">
            <Link href="#products">Products</Link>
            <Link href="#process">Process</Link>
            <Link href="#contact">Contact</Link>
            <Link href="/en/legal-notice">Legal notice</Link>
            <Link href="/en/privacy">Privacy policy</Link>
            <a href="https://pan21.com" target="_blank" rel="noopener">PAN21.com</a>
            <a href="https://pan21.net" target="_blank" rel="noopener">PAN21.net</a>
          </div>
          <p className="footer-legal">
            © {new Date().getFullYear()} PAN21.com International LLC · shop.pan21.com ·
            All prices in EUR, plus any government fees, notary costs and external service-provider costs.
            No offer for tax evasion or circumvention of legal obligations.
          </p>
        </div>
      </footer>
    </div>
  )
}

function ContactFormEn() {
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
      else { const d = await res.json(); setErr(d.error || 'Error'); setStatus('err') }
    } catch { setErr('Network error'); setStatus('err') }
  }

  if (status === 'ok') return (
    <div style={{ background: 'var(--snow)', border: '1px solid var(--lgray)', padding: '3rem', textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✓</div>
      <div style={{ fontFamily: 'var(--ff-d)', fontSize: '1.4rem', color: 'var(--navy)', marginBottom: '0.5rem' }}>Enquiry received</div>
      <p style={{ color: 'var(--gray)', fontSize: '0.875rem' }}>We will get back to you within one business day.</p>
    </div>
  )

  return (
    <form onSubmit={handle} style={{ background: 'var(--snow)', border: '1px solid var(--lgray)', padding: '2.5rem' }} noValidate>
      <div className="hp-field"><input type="text" name="website" tabIndex={-1} autoComplete="off" /></div>
      <div className="form-row">
        <div className="fg"><label>Name *</label><input type="text" name="name" placeholder="Your name" required /></div>
        <div className="fg"><label>Email *</label><input type="email" name="email" placeholder="your@email.com" required /></div>
      </div>
      <div className="form-row">
        <div className="fg"><label>Phone</label><input type="tel" name="phone" placeholder="+1..." /></div>
        <div className="fg">
          <label>Interest</label>
          <select name="interest">
            <option value="">Please choose</option>
            {PRODUCTS_EN.map(p => <option key={p.slug} value={p.name}>{p.flag} {p.name}</option>)}
            <option value="General advice">General advice</option>
          </select>
        </div>
      </div>
      <div className="fg"><label>Message</label><textarea name="message" placeholder="Briefly describe what you have in mind..." /></div>
      <button type="submit" className="form-submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send enquiry →'}
      </button>
      {status === 'err' && <p className="form-err">{err}</p>}
    </form>
  )
}
