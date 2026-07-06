import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://shop.pan21.com'),
  title: {
    default: 'PAN21 Shop — Firmengründung & Gesellschaftsverwaltung International',
    template: '%s | PAN21 Shop',
  },
  description:
    'Internationale Firmengründungen: Deutsche GmbH, UG, UK Limited, US LLC, Hong Kong Limited, Irische Limited, Neuseeländische Limited, Nevis LLC sowie Nominee- und Treuhandstrukturen. PAN21 Corporate Services — seriös, dokumentiert, compliance-orientiert.',
  keywords: [
    'Firmengründung', 'GmbH gründen', 'UG gründen', 'UK Limited gründen', 'US LLC gründen',
    'Hong Kong Limited', 'Irische Limited', 'Neuseeländische Limited', 'Nevis LLC',
    'internationale Firmengründung', 'Gesellschaft gründen', 'Kapitalgesellschaft gründen',
    'Offshore Gesellschaft', 'Asset Protection', 'Holding gründen', 'Nominee Shareholder',
    'Treuhandverwaltung', 'Gesellschaftsverwaltung', 'PAN21', 'EUROPAN',
    'company formation', 'incorporate', 'Limited Company', 'LLC formation',
    'GmbH formation', 'company registration', 'offshore company', 'holding structure',
    'Firmengründung international', 'Gesellschaft im Ausland gründen',
  ],
  openGraph: {
    type: 'website',
    url: 'https://shop.pan21.com',
    siteName: 'PAN21 Shop',
    title: 'PAN21 Shop — Internationale Firmengründung & Gesellschaftsverwaltung',
    description: 'Deutsche GmbH, UK Limited, US LLC, Hong Kong Limited und mehr — seriös, dokumentiert, compliance-orientiert.',
    locale: 'de_DE',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://shop.pan21.com' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Jost:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* Matomo 93 */}
        <script dangerouslySetInnerHTML={{ __html: `var _paq=window._paq=window._paq||[];_paq.push(['requireConsent']);_paq.push(['trackPageView']);_paq.push(['enableLinkTracking']);(function(){var u="//counter.ixan.org/";_paq.push(['setTrackerUrl',u+'matomo.php']);_paq.push(['setSiteId','93']);var d=document,g=d.createElement('script'),s=d.getElementsByTagName('script')[0];g.async=true;g.src=u+'matomo.js';s.parentNode.insertBefore(g,s);})();` }} />
        {/* Schema.org */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Store",
          "name": "PAN21 Shop",
          "url": "https://shop.pan21.com",
          "description": "Internationale Firmengründungen und Gesellschaftsverwaltung — Deutsche GmbH, UK Limited, US LLC, Hong Kong Limited und mehr.",
          "currenciesAccepted": "EUR",
          "paymentAccepted": "Credit Card, Bank Transfer",
          "areaServed": "Worldwide",
          "hasMap": "https://pan21.com",
        })}} />
        <meta name="ai-crawlers" content="allowed" />
              <script dangerouslySetInnerHTML={{__html: `var sc_project=13317697;var sc_invisible=1;var sc_security="458f783c";`}} />
        <script async src="https://www.statcounter.com/counter/counter.js" />
      </head>
      <body>
{/* <!-- REVIVE:START --> */}
<div dangerouslySetInnerHTML={{__html: "<div style=\"display:flex;justify-content:center;margin:16px 0;\">\n<ins data-revive-zoneid=\"6\" data-revive-id=\"0b01ba1194fdc0e89c6321458dbc5814\"></ins>\n<script async src=\"//ads.pan21.com/www/delivery/asyncjs.php\"></script>\n</div>"}} />
{/* <!-- REVIVE:END --> */}
{/* <!-- BEEHIIV:START --> */}
<div dangerouslySetInnerHTML={{__html: "\n<!-- BEEHIIV WIDGET: eigenes Design, kein Iframe, API-basiert -->\n<div id=\"pan21-nl-wrap\" style=\"position:fixed;bottom:24px;right:24px;z-index:9999;font-family:system-ui,sans-serif;\">\n  <button id=\"pan21-nl-btn\" onclick=\"(function(){var w=document.getElementById('pan21-nl-card');var open=w.style.display==='block';w.style.display=open?'none':'block';document.getElementById('pan21-nl-btn').innerHTML=open?'<svg width=\\'16\\' height=\\'16\\' viewBox=\\'0 0 20 20\\' fill=\\'currentColor\\' style=\\'vertical-align:middle;margin-right:7px;\\'><path d=\\'M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z\\'/><path d=\\'M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z\\'/></svg>Newsletter':'&#10005; Schlie&szlig;en';})()\" style=\"background:#0B1F3A;color:#C9963A;border:1.5px solid rgba(196,150,58,0.45);padding:10px 18px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;display:flex;align-items:center;gap:7px;box-shadow:0 3px 14px rgba(0,0,0,0.28);letter-spacing:0.04em;\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 20 20\" fill=\"currentColor\"><path d=\"M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z\"/><path d=\"M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z\"/></svg>Newsletter</button>\n  <div id=\"pan21-nl-card\" style=\"display:none;margin-top:8px;width:320px;background:#fff;border-radius:10px;box-shadow:0 8px 32px rgba(11,31,58,0.22);border:1px solid #E2DDD8;overflow:hidden;\">\n    <div style=\"background:#0B1F3A;padding:16px 20px;\">\n      <div style=\"font-family:Georgia,serif;font-size:1.1rem;font-weight:700;color:#fff;margin-bottom:2px;\">PAN21 Newsletter</div>\n      <div style=\"font-size:0.72rem;color:rgba(255,255,255,0.55);letter-spacing:0.08em;text-transform:uppercase;\">Neuigkeiten &amp; Updates</div>\n    </div>\n    <div style=\"padding:20px;\">\n      <p style=\"font-size:0.84rem;color:#5E7085;line-height:1.55;margin-bottom:16px;\">Aktuelle Informationen aus dem PAN21-Netzwerk. Kein Spam, jederzeit abbestellbar.</p>\n      <div id=\"pan21-nl-form\">\n        <input id=\"pan21-nl-email\" type=\"email\" placeholder=\"Ihre E-Mail-Adresse\" style=\"width:100%;padding:10px 12px;border:1.5px solid #DDE3EC;border-radius:5px;font-size:0.875rem;font-family:system-ui,sans-serif;color:#1A2530;outline:none;margin-bottom:10px;box-sizing:border-box;\" onfocus=\"this.style.borderColor='#0B1F3A'\" onblur=\"this.style.borderColor='#DDE3EC'\">\n        <button onclick=\"pan21NlSubmit()\" style=\"width:100%;background:#C4963A;color:#fff;border:none;padding:11px;border-radius:5px;font-weight:700;font-size:0.875rem;cursor:pointer;letter-spacing:0.04em;\">Jetzt anmelden</button>\n      </div>\n      <div id=\"pan21-nl-ok\" style=\"display:none;text-align:center;padding:12px 0;\">\n        <div style=\"font-size:1.5rem;margin-bottom:6px;\">✓</div>\n        <div style=\"font-weight:700;color:#0B1F3A;font-size:0.9rem;\">Angemeldet!</div>\n        <div style=\"font-size:0.78rem;color:#5E7085;margin-top:4px;\">Bitte bestätigen Sie Ihre E-Mail.</div>\n      </div>\n      <div id=\"pan21-nl-err\" style=\"display:none;background:#FEF2F2;border-radius:4px;padding:8px 12px;font-size:0.78rem;color:#991B1B;margin-top:8px;\"></div>\n    </div>\n  </div>\n</div>\n<script>\nasync function pan21NlSubmit(){\n  var email=document.getElementById('pan21-nl-email').value.trim();\n  if(!email||!email.includes('@')){\n    var err=document.getElementById('pan21-nl-err');\n    err.textContent='Bitte geben Sie eine gültige E-Mail-Adresse ein.';\n    err.style.display='block';return;\n  }\n  document.getElementById('pan21-nl-err').style.display='none';\n  var btn=event.target||document.querySelector('#pan21-nl-form button');\n  btn.textContent='Wird gesendet…';btn.disabled=true;\n  try{\n    var res=await fetch('https://news.pan21.com/api/beehiiv-subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email})});\n    if(res.ok){\n      document.getElementById('pan21-nl-form').style.display='none';\n      document.getElementById('pan21-nl-ok').style.display='block';\n    }else{\n      var d=await res.json();\n      document.getElementById('pan21-nl-err').textContent=d.error||'Fehler. Bitte versuchen Sie es später.';\n      document.getElementById('pan21-nl-err').style.display='block';\n      btn.textContent='Jetzt anmelden';btn.disabled=false;\n    }\n  }catch(e){\n    document.getElementById('pan21-nl-err').textContent='Netzwerkfehler. Bitte versuchen Sie es später.';\n    document.getElementById('pan21-nl-err').style.display='block';\n    btn.textContent='Jetzt anmelden';btn.disabled=false;\n  }\n}\n</script>"}} />
{/* <!-- BEEHIIV:END --> */}
{/* <!-- DIRECTORIES:START --> */}
<div style={{display:'flex',justifyContent:'center',gap:'16px',flexWrap:'wrap',margin:'16px 0'}}>
<a href="https://ffa-links.de" target="_blank" rel="noopener"><img src="https://ffa-links.de/banner.svg" alt="FFA-Links" height={60} style={{borderRadius:'4px'}} /></a>
<a href="https://swiss-quality.de" target="_blank" rel="noopener"><img src="https://swiss-quality.de/banner.svg" alt="Swiss Quality" height={60} style={{borderRadius:'4px'}} /></a>
<a href="https://german-quality.net" target="_blank" rel="noopener"><img src="https://german-quality.net/banner.svg" alt="German Quality" height={60} style={{borderRadius:'4px'}} /></a>
</div>
{/* <!-- DIRECTORIES:END --> */}
        {children}
      </body>
    </html>
  )
}
