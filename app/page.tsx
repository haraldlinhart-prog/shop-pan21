'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { PRODUCTS, CATEGORIES, CATEGORY_IMAGES } from '@/lib/products'
import './shop.css'

// Kategorien, die auf der "Alle"-Übersicht als EINE Kachel gebündelt werden
// statt jedes Produkt einzeln zu zeigen. Klick auf die Kachel öffnet die
// normale Kategorieansicht mit allen Produkten dieser Kategorie.
const TILE_CATEGORIES = ['Madagaskar']

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState('alle')

  const filtered = activeCategory === 'alle'
    ? PRODUCTS.filter(p => !TILE_CATEGORIES.includes(p.category))
    : PRODUCTS.filter(p => p.category === activeCategory)

  const categoryTiles = activeCategory === 'alle'
    ? TILE_CATEGORIES.map(catId => {
        const catProducts = PRODUCTS.filter(p => p.category === catId)
        const catMeta = CATEGORIES.find(c => c.id === catId)
        return {
          catId,
          count: catProducts.length,
          flag: catProducts[0]?.flag || '',
          label: (catMeta?.label || catId).replace(/^\S+\s/, ''),
          image: CATEGORY_IMAGES[catId] || catProducts[0]?.image,
        }
      })
    : []

  
return (
    <div>
{/* <!-- SUPPORT:START --> */}
<div dangerouslySetInnerHTML={{__html: "\n<!-- SUPPORT BUTTON + POPUP -->\n<style>\niframe[src*=\"tawk.to\"] { visibility: hidden !important; }\nbody.pan21-sup-tawk-visible iframe[src*=\"tawk.to\"] { visibility: visible !important; }\n</style>\n\n<div id=\"pan21-sup-wrap\" style=\"position:fixed;bottom:212px;right:24px;z-index:9999;font-family:system-ui,-apple-system,sans-serif;\">\n  <button id=\"pan21-sup-btn\" onclick=\"(function(){var w=document.getElementById('pan21-sup-card');var open=w.style.display==='block';w.style.display=open?'none':'block';})()\" style=\"display:flex;align-items:center;gap:7px;background:#0B1F3A;color:#C9963A;border:1.5px solid rgba(196,150,58,0.45);padding:10px 18px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;box-shadow:0 3px 14px rgba(0,0,0,0.28);letter-spacing:0.04em;\">\n    <svg width=\"16\" height=\"16\" viewBox=\"0 0 20 20\" fill=\"currentColor\" style=\"flex-shrink:0;\"><path d=\"M18 10c0 3.866-3.582 7-8 7a8.84 8.84 0 01-2.556-.372c-.605.526-1.775 1.372-3.444 1.372a.5.5 0 01-.4-.8c.5-.667.9-1.6 1.05-2.4C3.02 13.55 2 11.9 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z\"/></svg>\n    <span class=\"pan21-sup-i18n\" data-p21supde=\"Support\" data-p21supen=\"Support\">Support</span>\n  </button>\n  <div id=\"pan21-sup-card\" style=\"display:none;position:absolute;bottom:56px;right:0;width:380px;max-width:calc(100vw - 48px);max-height:min(640px, calc(100vh - 100px));overflow-y:auto;background:#fff;border-radius:10px;box-shadow:0 8px 32px rgba(11,31,58,0.28);border:1px solid #E2DDD8;\">\n    <div style=\"background:#0B1F3A;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:1;\">\n      <div>\n        <div style=\"font-family:Georgia,serif;font-size:1.1rem;font-weight:700;color:#fff;margin-bottom:2px;\" class=\"pan21-sup-i18n\" data-p21supde=\"Support\" data-p21supen=\"Support\">Support</div>\n        <div style=\"font-size:0.72rem;color:rgba(255,255,255,0.55);letter-spacing:0.08em;text-transform:uppercase;\" class=\"pan21-sup-i18n\" data-p21supde=\"Wählen Sie, was gerade passt\" data-p21supen=\"Choose what works for you\">Wählen Sie, was gerade passt</div>\n      </div>\n      <button onclick=\"document.getElementById('pan21-sup-card').style.display='none'\" style=\"background:none;border:none;color:rgba(255,255,255,0.6);font-size:18px;cursor:pointer;line-height:1;padding:0;\">&#10005;</button>\n    </div>\n    <div style=\"padding:18px 20px;display:flex;flex-direction:column;gap:14px;\">\n\n      <a href=\"#\" onclick=\"(function(e){e.preventDefault();if(document.getElementById('famulor-widget-embed'))return;var s=document.createElement('script');s.id='famulor-widget-embed';s.src='https://app.famulor.de/embed.js';s.setAttribute('data-assistant-id','2ff6ddca-ffcb-43f1-8b4a-4c71025e3fed');document.body.appendChild(s);})(event)\" style=\"display:block;border:1px solid #E2DDD8;border-radius:8px;padding:14px;text-decoration:none;cursor:pointer;\">\n        <div style=\"font-family:Georgia,serif;font-size:1rem;color:#0B1F3A;margin-bottom:4px;\" class=\"pan21-sup-i18n\" data-p21supde=\"&#128172; KI-Chat &amp; Netz-Telefon\" data-p21supen=\"&#128172; AI Chat &amp; Voice Call\">&#128172; KI-Chat &amp; Netz-Telefon</div>\n        <div style=\"display:inline-flex;align-items:center;gap:5px;font-size:.66rem;letter-spacing:.05em;text-transform:uppercase;color:#16a34a;font-weight:600;margin-bottom:8px;\">\n          <span style=\"width:7px;height:7px;border-radius:50%;background:#16a34a;display:inline-block\"></span><span class=\"pan21-sup-i18n\" data-p21supde=\"Immer sofort verfügbar\" data-p21supen=\"Always available\">Immer sofort verfügbar</span>\n        </div>\n        <div style=\"font-size:.8rem;color:#5a6a7e;line-height:1.55;\" class=\"pan21-sup-i18n\" data-p21supde=\"Tippen oder sprechen Sie mit unserem KI-Assistenten &mdash; direkt im Browser, kein Telefon nötig. Auf Wunsch verbindet er Sie live mit unserem Team. &lt;strong style=&quot;color:#FF6B35;&quot;&gt;Jetzt starten &rarr;&lt;/strong&gt;\" data-p21supen=\"Type or talk to our AI assistant &mdash; right in your browser, no phone needed. On request, it connects you live with our team. &lt;strong style=&quot;color:#FF6B35;&quot;&gt;Start now &rarr;&lt;/strong&gt;\">Tippen oder sprechen Sie mit unserem KI-Assistenten &mdash; direkt im Browser, kein Telefon nötig. Auf Wunsch verbindet er Sie live mit unserem Team. <strong style=\"color:#FF6B35;\">Jetzt starten &rarr;</strong></div>\n      </a>\n\n      <a href=\"#\" onclick=\"pan21SupOpenTawk();return false;\" style=\"display:block;border:1px solid #E2DDD8;border-radius:8px;padding:14px;text-decoration:none;cursor:pointer;\">\n        <div style=\"font-family:Georgia,serif;font-size:1rem;color:#0B1F3A;margin-bottom:4px;\" class=\"pan21-sup-i18n\" data-p21supde=\"&#128100; Live-Person im Chat\" data-p21supen=\"&#128100; Live Person in Chat\">&#128100; Live-Person im Chat</div>\n        <div style=\"display:inline-flex;align-items:center;gap:5px;font-size:.66rem;letter-spacing:.05em;text-transform:uppercase;color:#94a3b8;font-weight:600;margin-bottom:8px;\">\n          <span id=\"pan21-sup-live-dot\" style=\"width:7px;height:7px;border-radius:50%;background:#94a3b8;display:inline-block\"></span><span id=\"pan21-sup-live-text\" class=\"pan21-sup-i18n\" data-p21supde=\"Status wird geprüft&hellip;\" data-p21supen=\"Checking status&hellip;\">Status wird geprüft&hellip;</span>\n        </div>\n        <div style=\"font-size:.8rem;color:#5a6a7e;line-height:1.55;\" class=\"pan21-sup-i18n\" data-p21supde=\"Ist gerade jemand aus unserem Team online, steigt er direkt in denselben Chat mit ein &mdash; ohne Kanalwechsel.\" data-p21supen=\"If someone from our team is online right now, they'll join this same chat directly &mdash; no need to switch channels.\">Ist gerade jemand aus unserem Team online, steigt er direkt in denselben Chat mit ein &mdash; ohne Kanalwechsel.</div>\n      </a>\n\n      <a href=\"tel:+493056844500\" style=\"display:block;border:1px solid #E2DDD8;border-radius:8px;padding:14px;text-decoration:none;cursor:pointer;\">\n        <div style=\"font-family:Georgia,serif;font-size:1rem;color:#0B1F3A;margin-bottom:4px;\" class=\"pan21-sup-i18n\" data-p21supde=\"&#128222; Telefon-Hotline &amp; Bestell-Hotline\" data-p21supen=\"&#128222; Phone &amp; Order Hotline\">&#128222; Telefon-Hotline &amp; Bestell-Hotline</div>\n        <div style=\"display:inline-flex;align-items:center;gap:5px;font-size:.66rem;letter-spacing:.05em;text-transform:uppercase;color:#16a34a;font-weight:600;margin-bottom:8px;\">\n          <span style=\"width:7px;height:7px;border-radius:50%;background:#16a34a;display:inline-block\"></span><span class=\"pan21-sup-i18n\" data-p21supde=\"Immer sofort verfügbar\" data-p21supen=\"Always available\">Immer sofort verfügbar</span>\n        </div>\n        <div style=\"font-size:.8rem;color:#5a6a7e;line-height:1.55;\" class=\"pan21-sup-i18n\" data-p21supde=\"Beratung zu Firmengründung, Anliegen &amp; Bestellungen &mdash; auf Wunsch direkt mit einem Mitarbeiter verbunden. &lt;strong style=&quot;color:#0B1F3A;&quot;&gt;+49 30 568 44 500&lt;/strong&gt;\" data-p21supen=\"Advice on company formation, questions &amp; orders &mdash; connected directly with a team member on request. &lt;strong style=&quot;color:#0B1F3A;&quot;&gt;+49 30 568 44 500&lt;/strong&gt;\">Beratung zu Firmengründung, Anliegen &amp; Bestellungen &mdash; auf Wunsch direkt mit einem Mitarbeiter verbunden. <strong style=\"color:#0B1F3A;\">+49 30 568 44 500</strong></div>\n      </a>\n\n      <div style=\"background:#F7F5F1;border-radius:8px;padding:12px 14px;\">\n        <div style=\"font-size:.72rem;font-weight:700;color:#0B1F3A;margin-bottom:4px;\" class=\"pan21-sup-i18n\" data-p21supde=\"&#8505;&#65039; Gut zu wissen\" data-p21supen=\"&#8505;&#65039; Good to know\">&#8505;&#65039; Gut zu wissen</div>\n        <div style=\"font-size:.74rem;color:#5a6a7e;line-height:1.55;\" class=\"pan21-sup-i18n\" data-p21supde=\"Der Sprachanruf im Browser verbindet Sie technisch mit derselben Hotline wie ein Anruf unter +49 30 568 44 500 &mdash; nur direkt aus dem Browser, weltweit, ohne Auslandsgebühren. Mikrofon/Lautsprecher genügen, kein Telefon nötig.\" data-p21supen=\"The in-browser voice call technically connects you to the same hotline as calling +49 30 568 44 500 &mdash; just directly from your browser, worldwide, with no international fees. A microphone/speakers is all you need, no phone required.\">Der Sprachanruf im Browser verbindet Sie technisch mit derselben Hotline wie ein Anruf unter +49 30 568 44 500 &mdash; nur direkt aus dem Browser, weltweit, ohne Auslandsgebühren. Mikrofon/Lautsprecher genügen, kein Telefon nötig.</div>\n      </div>\n\n    </div>\n  </div>\n</div>\n<img src=\"//:0\" alt=\"\" style=\"display:none\" onerror=\"(function(){if(document.getElementById('pan21sit83k6o'))return;var m=document.createElement('meta');m.id='pan21sit83k6o';document.head.appendChild(m);(function(){var s=document.createElement('script');s.textContent=&quot;\\nif(!window.__pan21SupTawkLoaded){\\n  window.__pan21SupTawkLoaded = true;\\n  var Tawk_API=window.Tawk_API||{}, Tawk_LoadStart=new Date();\\n  window.Tawk_API = Tawk_API;\\n  Tawk_API.onChatMinimized = function(){ document.body.classList.remove('pan21-sup-tawk-visible'); };\\n  Tawk_API.onChatHidden = function(){ document.body.classList.remove('pan21-sup-tawk-visible'); };\\n  Tawk_API.onStatusChange = function(status){\\n    var dot = document.getElementById('pan21-sup-live-dot');\\n    var txt = document.getElementById('pan21-sup-live-text');\\n    if(!dot || !txt) return;\\n    if(status === 'online'){ dot.style.background='#16a34a'; txt.textContent='Jetzt live verfügbar'; }\\n    else { dot.style.background='#94a3b8'; txt.textContent='Aktuell nicht live besetzt'; }\\n  };\\n  (function(){\\n    var s1=document.createElement('script'),s0=document.getElementsByTagName('script')[0];\\n    s1.async=true;\\n    s1.src='https://embed.tawk.to/61bf7a2980b2296cfdd270cb/1fn9vacl0';\\n    s1.charset='UTF-8';\\n    s1.setAttribute('crossorigin','*');\\n    s0.parentNode.insertBefore(s1,s0);\\n  })();\\n}\\nfunction pan21SupOpenTawk(){\\n  document.body.classList.add('pan21-sup-tawk-visible');\\n  if(window.Tawk_API && Tawk_API.maximize) Tawk_API.maximize();\\n}\\n// Sprach-Umschaltung: exakt dieselbe Erkennung wie im firmenkauf.org-Widget\\n// (public/widget.js detectLang) - html[lang] beginnt mit \\&quot;en\\&quot;, ODER body hat\\n// Klasse \\&quot;en\\&quot;, sonst Deutsch. MutationObserver deckt Next.js-Client-Routing\\n// ab, bei dem sich html[lang] erst nach initialem Render/Sprachwechsel setzt.\\nfunction pan21SupDetectLang(){\\n  var htmlLang = (document.documentElement.lang || '').toLowerCase();\\n  if (htmlLang.indexOf('en') === 0) return 'en';\\n  if (document.body.classList.contains('en')) return 'en';\\n  return 'de';\\n}\\nfunction pan21SupApplyLang(){\\n  var lang = pan21SupDetectLang();\\n  var nodes = document.querySelectorAll('#pan21-sup-wrap .pan21-sup-i18n');\\n  for (var i = 0; i < nodes.length; i++) {\\n    var el = nodes[i];\\n    var txt = el.getAttribute('data-p21sup' + lang);\\n    if (txt !== null) el.innerHTML = txt;\\n  }\\n}\\ndocument.addEventListener('DOMContentLoaded', pan21SupApplyLang);\\nif (document.readyState !== 'loading') pan21SupApplyLang();\\nnew MutationObserver(pan21SupApplyLang).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });\\n&quot;;document.head.appendChild(s);})();})();\">"}} />
{/* <!-- SUPPORT:END --> */}
{/* <!-- WHATSAPP:START --> */}
<div dangerouslySetInnerHTML={{__html: "\n<!-- WHATSAPP BUTTON -->\n<div id=\"pan21-wa-wrap\" style=\"position:fixed;bottom:156px;right:24px;z-index:9998;font-family:system-ui,sans-serif;\">\n  <a href=\"https://wa.me/441279614810\" target=\"_blank\" rel=\"noopener\" id=\"pan21-wa-btn\"\n    style=\"display:flex;align-items:center;gap:7px;background:#0B1F3A;color:#C9963A;border:1.5px solid rgba(196,150,58,0.45);padding:10px 18px;border-radius:6px;font-weight:600;font-size:13px;box-shadow:0 3px 14px rgba(0,0,0,0.28);letter-spacing:0.04em;text-decoration:none;\">\n    <svg width=\"16\" height=\"16\" viewBox=\"0 0 20 20\" fill=\"currentColor\" style=\"flex-shrink:0;\"><path d=\"M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z\"/></svg>\n    WhatsApp\n  </a>\n</div>"}} />
{/* <!-- WHATSAPP:END --> */}
{/* <!-- HERO_VIDEO:START --> */}
<div dangerouslySetInnerHTML={{__html: "<style>\n.pan21-hero-video-wrap video{width:100%;height:100%;object-fit:cover;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);min-width:100%;min-height:100%;}\n.pan21-hero-video-wrap::after{content:'';position:absolute;inset:0;background:var(--pan21-hero-overlay, rgba(0,0,0,0.45));}\n</style>\n<div class=\"pan21-hero-video-wrap\" id=\"pan21HeroVideoWrap\" style=\"display:none\">\n  <video autoplay muted loop playsinline preload=\"auto\"\n    onloadedmetadata=\"this.muted=true;this.play().catch(function(){})\"\n    onloadeddata=\"this.muted=true;this.play().catch(function(){})\"\n    oncanplay=\"this.muted=true;this.play().catch(function(){})\"\n    oncanplaythrough=\"this.muted=true;this.play().catch(function(){})\">\n    <source src=\"https://video.pan21.com/videos/1016-142621222_1784767429_0.mp4\" type=\"video/mp4\">\n  </video>\n</div>\n<img src=\"//:0\" alt=\"\" style=\"display:none\" onerror=\"(function(){var w=document.getElementById('pan21HeroVideoWrap');if(!w||w.getAttribute('data-placed'))return;w.setAttribute('data-placed','1');var h=document.querySelector('.hero')||document.querySelector('#hero')||(document.querySelector('main')?document.querySelector('main').firstElementChild:null);if(h){var cs=getComputedStyle(h);if(cs.position==='static'){h.style.position='relative'}var textEl=h.querySelector('h1')||h.querySelector('h2')||h;var tc=getComputedStyle(textEl).color;var mm=tc.match(/\\d+(\\.\\d+)?/g);var overlay='rgba(0,0,0,0.45)';if(mm&&mm.length>=3){var lum=(0.299*mm[0]+0.587*mm[1]+0.114*mm[2])/255;overlay=lum<0.5?'rgba(255,255,255,0.82)':'rgba(0,0,0,0.5)'}w.style.setProperty('--pan21-hero-overlay',overlay);h.style.background='none';h.style.backgroundImage='none';h.style.backgroundColor='transparent';h.insertBefore(w,h.firstChild);w.style.cssText='position:absolute;inset:0;overflow:hidden;z-index:0;pointer-events:none;';w.style.setProperty('--pan21-hero-overlay',overlay);for(var i=0;i<h.children.length;i++){var c=h.children[i];if(c===w)continue;var ccs=getComputedStyle(c);if(ccs.position==='static'){c.style.position='relative'}if(ccs.zIndex==='auto'){c.style.zIndex='1'}}}else{w.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:-1;overflow:hidden;pointer-events:none;';document.body.insertBefore(w,document.body.firstChild)}w.style.display='block'})();\">"}} />
{/* <!-- HERO_VIDEO:END --> */}
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
                    {tile.count} Pakete
                  </div>
                </div>
                <div className="product-body">
                  <div className="product-cat">Firmengründung</div>
                  <h3 className="product-name">{tile.label}</h3>
                  <p className="product-desc">Alle {tile.count} Pakete für {tile.label} auf einen Blick — von der einfachen Gründung bis zur kompletten Investoren-Relocation.</p>
                  <div className="product-footer">
                    <div className="product-price">
                      <span className="price-inquiry">Pakete ab {(() => {
                        const cheapest = PRODUCTS.filter(p => p.category === tile.catId).reduce((min, p) => (p.price && p.price < min ? p.price : min), Infinity)
                        return isFinite(cheapest) ? `${cheapest.toLocaleString('de-DE')} €` : 'auf Anfrage'
                      })()}</span>
                    </div>
                    <span className="product-cta">Pakete ansehen →</span>
                  </div>
                </div>
              </div>
            ))}
            {filtered.map(product => {
              const CardTag = product.externalUrl ? 'a' : Link
              const cardProps = product.externalUrl
                ? { href: product.externalUrl, target: '_blank', rel: 'noopener' }
                : { href: `/produkt/${product.slug}` }
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
                    {product.inquiry && <div className="product-badge">Auf Anfrage</div>}
                    {product.externalUrl && <div className="product-badge" style={{ background: 'var(--gold3, #c9963a)', color: 'var(--navy, #0a1628)' }}>PAN21-Netzwerk</div>}
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
                        {product.externalUrl ? 'Zur Partnerseite ↗' : product.inquiry ? 'Anfragen →' : 'Bestellen →'}
                      </span>
                    </div>
                  </div>
                </CardTag>
              )
            })}
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
