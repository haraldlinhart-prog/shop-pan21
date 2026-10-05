import Link from 'next/link'

// Rechtsseiten des Shops (Impressum/Datenschutz, DE + EN).
// Betreiber: PAN21.com International LLC (Stand Oktober 2026).

type Lang = 'de' | 'en'
type Kind = 'imprint' | 'privacy'

const PATHS: Record<Lang, Record<Kind, string>> = {
  de: { imprint: '/impressum', privacy: '/datenschutz' },
  en: { imprint: '/en/legal-notice', privacy: '/en/privacy' },
}

const h1: React.CSSProperties = { fontFamily: 'var(--ff-d)', fontSize: '2.2rem', color: 'var(--navy)', marginBottom: '1.75rem', lineHeight: 1.2 }
const h2: React.CSSProperties = { fontFamily: 'var(--ff-d)', fontSize: '1.25rem', color: 'var(--navy)', margin: '2rem 0 0.6rem' }
const p: React.CSSProperties = { fontSize: '0.95rem', lineHeight: 1.8, marginBottom: '0.9rem', color: '#3a4656' }
const a: React.CSSProperties = { color: 'var(--gold)', textDecoration: 'underline' }

export function LegalShell({ lang, kind, children }: { lang: Lang; kind: Kind; children: React.ReactNode }) {
  const other: Lang = lang === 'de' ? 'en' : 'de'
  const de = lang === 'de'
  return (
    <div>
      <nav className="nav">
        <div className="container nav-inner">
          <Link href={de ? '/' : '/en'} className="nav-logo">
            <div className="nav-logo-mark">P21</div>
            <div>
              <span className="nav-logo-text">PAN21 Shop</span>
              <span className="nav-logo-sub">Corporate Services</span>
            </div>
          </Link>
          <div className="nav-actions">
            <Link href={PATHS[other][kind]} style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em' }}>
              {de ? 'EN' : 'DE'}
            </Link>
          </div>
        </div>
      </nav>

      <main className="container-sm" style={{ paddingTop: '120px', paddingBottom: '4rem' }}>
        <Link href={de ? '/' : '/en'} style={{ fontSize: '0.85rem', color: 'var(--gold)' }}>
          {de ? '← Zurück zum Shop' : '← Back to the shop'}
        </Link>
        <div style={{ marginTop: '1.5rem' }}>{children}</div>
      </main>

      <LegalFooter lang={lang} />
    </div>
  )
}

export function LegalFooter({ lang }: { lang: Lang }) {
  const de = lang === 'de'
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-links">
          <Link href={de ? '/' : '/en'}>{de ? 'Shop' : 'Shop'}</Link>
          <Link href={PATHS[lang].imprint}>{de ? 'Impressum' : 'Legal notice'}</Link>
          <Link href={PATHS[lang].privacy}>{de ? 'Datenschutz' : 'Privacy policy'}</Link>
          <a href="https://pan21.com" target="_blank" rel="noopener">PAN21.com</a>
        </div>
        <p className="footer-legal">© {new Date().getFullYear()} PAN21.com International LLC · shop.pan21.com</p>
      </div>
    </footer>
  )
}

export function ImprintDe() {
  return (
    <>
      <h1 style={h1}>Impressum</h1>
      <p style={p}>Angaben gemäß § 5 DDG</p>
      <p style={p}>PAN21.com International LLC<br />7533 South Center View CT, STE R<br />West Jordan, UT 84084<br />USA</p>
      <p style={p}>Vertreten durch: Harald Linhart<br />Registrierung: Utah Division of Corporations, Registernummer 14723637-0163</p>
      <h2 style={h2}>Kontakt</h2>
      <p style={p}>
        Telefon: <a href="tel:+493056844500" style={a}>+49 30 5684450-0</a><br />
        E-Mail: <a href="mailto:dsgvo@pan21.com" style={a}>dsgvo@pan21.com</a>
      </p>
      <h2 style={h2}>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <p style={p}>Harald Linhart, Anschrift wie oben</p>
      <h2 style={h2}>Verbraucherstreitbeilegung</h2>
      <p style={p}>Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
    </>
  )
}

export function ImprintEn() {
  return (
    <>
      <h1 style={h1}>Legal notice</h1>
      <p style={p}>Information pursuant to § 5 DDG (German Digital Services Act)</p>
      <p style={p}>PAN21.com International LLC<br />7533 South Center View CT, STE R<br />West Jordan, UT 84084<br />USA</p>
      <p style={p}>Represented by: Harald Linhart<br />Registration: Utah Division of Corporations, registration no. 14723637-0163</p>
      <h2 style={h2}>Contact</h2>
      <p style={p}>
        Phone: <a href="tel:+493056844500" style={a}>+49 30 5684450-0</a><br />
        Email: <a href="mailto:dsgvo@pan21.com" style={a}>dsgvo@pan21.com</a>
      </p>
      <h2 style={h2}>Responsible for content pursuant to § 18 (2) MStV</h2>
      <p style={p}>Harald Linhart, address as above</p>
      <h2 style={h2}>Consumer dispute resolution</h2>
      <p style={p}>We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board.</p>
    </>
  )
}

export function PrivacyDe() {
  return (
    <>
      <h1 style={h1}>Datenschutzerklärung</h1>

      <h2 style={h2}>1. Verantwortlicher</h2>
      <p style={p}>
        Verantwortlich für die Datenverarbeitung auf dieser Website ist die PAN21.com International LLC, 7533 South Center View CT, STE R,
        West Jordan, UT 84084, USA, vertreten durch Harald Linhart. E-Mail: <a href="mailto:dsgvo@pan21.com" style={a}>dsgvo@pan21.com</a>,
        Telefon: +49 30 5684450-0.
      </p>

      <h2 style={h2}>2. Hosting</h2>
      <p style={p}>
        Diese Website wird bei Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA, gehostet. Beim Aufruf der Website verarbeitet
        Vercel technisch notwendige Daten wie IP-Adresse, Datum und Uhrzeit, aufgerufene Seite, Referrer und Browserinformationen
        (Server-Logfiles), um die Website auszuliefern und vor Missbrauch zu schützen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO
        (berechtigtes Interesse an einem sicheren und stabilen Betrieb). Mit Vercel besteht ein Vertrag zur Auftragsverarbeitung;
        Datenübermittlungen in die USA erfolgen auf Grundlage der EU-Standardvertragsklauseln.
      </p>

      <h2 style={h2}>3. Cookies</h2>
      <p style={p}>
        Diese Website setzt keine Cookies zu Analyse- oder Werbezwecken. Rufen Sie den Shop über einen Partnerlink mit Empfehlungscode
        auf, wird dieser Code im Cookie <code>pan21_ref</code> für 30 Tage gespeichert, damit eine Bestellung dem empfehlenden Partner
        zugeordnet werden kann (Art. 6 Abs. 1 lit. f DSGVO, berechtigtes Interesse an der Zuordnung von Empfehlungen).
      </p>

      <h2 style={h2}>4. Besucherzählung mit PAN21counter</h2>
      <p style={p}>
        Zur Zählung der Seitenaufrufe nutzen wir den eigenen Besucherzähler PAN21counter (pan21counter.de). Er setzt keine Cookies und
        erstellt keine Nutzerprofile. Aus der IP-Adresse wird beim Aufruf ein gekürzter, täglich wechselnder Hashwert gebildet, um
        Mehrfachzählungen am selben Tag zu vermeiden; die IP-Adresse selbst wird nicht gespeichert. Einzelne Aufrufe werden nach drei
        Tagen gelöscht, danach bleiben nur zusammengefasste Tageszahlen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
        Interesse an einer einfachen Reichweitenmessung).
      </p>

      <h2 style={h2}>5. Werbebanner</h2>
      <p style={p}>
        Werbebanner werden über unseren eigenen Adserver ads.pan21.com ausgeliefert. Dabei wird die IP-Adresse technisch bedingt
        verarbeitet, um das Banner auszuliefern; es werden keine Nutzerprofile erstellt. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.
      </p>

      <h2 style={h2}>6. Bestellungen und Zahlungen</h2>
      <p style={p}>
        Wenn Sie im Shop bestellen, verarbeiten wir die für die Vertragsabwicklung erforderlichen Daten (z. B. E-Mail-Adresse, gewähltes
        Produkt, Zahlungsstatus und die Angaben, die für die Erbringung der bestellten Leistung nötig sind). Rechtsgrundlage ist Art. 6
        Abs. 1 lit. b DSGVO; Rechnungs- und Bestelldaten bewahren wir im Rahmen der gesetzlichen Aufbewahrungspflichten auf (Art. 6
        Abs. 1 lit. c DSGVO).
      </p>
      <p style={p}>
        Zahlungen werden über Stripe (Stripe Payments Europe Ltd., 1 Grand Canal Street Lower, Dublin 2, Irland) abgewickelt. Dabei
        werden die für die Zahlung erforderlichen Daten an Stripe übermittelt; Ihre Kartendaten gibt Stripe nicht an uns weiter.
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.
      </p>
      <p style={p}>
        Bei Zahlung mit EUROPAN-Guthaben werden Ihre E-Mail-Adresse und Ihre PIN zur Prüfung des Guthabens und zur Abbuchung an das
        EUROPAN-Kontosystem (noble-limited.com) übermittelt. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.
      </p>

      <h2 style={h2}>7. Kontaktformular und E-Mail</h2>
      <p style={p}>
        Wenn Sie uns über das Kontaktformular oder per E-Mail schreiben, verarbeiten wir Ihre Angaben (z. B. Name, E-Mail-Adresse,
        Telefonnummer, Nachricht), um Ihre Anfrage zu beantworten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, soweit Ihre Anfrage
        auf einen Vertrag zielt, sonst Art. 6 Abs. 1 lit. f DSGVO. Die Daten werden gelöscht, sobald sie nicht mehr benötigt werden und
        keine gesetzlichen Aufbewahrungspflichten bestehen. Der E-Mail-Versand (Kontaktanfragen und Bestellbestätigungen) erfolgt über
        Resend (Resend Inc., USA) auf Grundlage eines Auftragsverarbeitungsvertrags und der EU-Standardvertragsklauseln.
      </p>

      <h2 style={h2}>8. Newsletter</h2>
      <p style={p}>
        Für den Newsletter nutzen wir beehiiv (Beehiiv Inc., USA). Wenn Sie sich anmelden, werden Ihre E-Mail-Adresse und Anmeldedaten bei
        beehiiv gespeichert. Rechtsgrundlage ist Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), die Sie jederzeit über den Abmeldelink
        widerrufen können.
      </p>

      <h2 style={h2}>9. KI-Chat und Sprachanruf</h2>
      <p style={p}>
        Der KI-Chat bzw. Sprachanruf wird erst geladen, wenn Sie ihn aktiv starten. Dann werden Ihre Eingaben bzw. Ihre Stimme an den
        Anbieter übermittelt, um das Gespräch zu führen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b bzw. f DSGVO.
      </p>

      <h2 style={h2}>10. Schriftarten</h2>
      <p style={p}>
        Die Schriftarten dieser Website werden lokal von unserem Server geladen. Es findet keine Verbindung zu Servern von Google oder
        anderen Schriftanbietern statt.
      </p>

      <h2 style={h2}>11. Eingebettete Inhalte</h2>
      <p style={p}>
        Diese Website bindet Banner und Widgets von Partnerseiten ein (z. B. firmenkauf.org, ffa-links.de, swiss-quality.de,
        german-quality.net). Beim Laden dieser Inhalte wird Ihre IP-Adresse technisch bedingt an den jeweiligen Server übertragen.
      </p>

      <h2 style={h2}>12. Ihre Rechte</h2>
      <p style={p}>
        Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung
        (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch gegen Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO
        (Art. 21). Erteilte Einwilligungen können Sie jederzeit mit Wirkung für die Zukunft widerrufen. Außerdem haben Sie das Recht, sich
        bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Wenden Sie sich für Ihre Anliegen an{' '}
        <a href="mailto:dsgvo@pan21.com" style={a}>dsgvo@pan21.com</a>.
      </p>

      <p style={{ ...p, marginTop: '2rem' }}>Stand: Oktober 2026</p>
    </>
  )
}

export function PrivacyEn() {
  return (
    <>
      <h1 style={h1}>Privacy policy</h1>

      <h2 style={h2}>1. Controller</h2>
      <p style={p}>
        The controller responsible for data processing on this website is PAN21.com International LLC, 7533 South Center View CT, STE R,
        West Jordan, UT 84084, USA, represented by Harald Linhart. Email: <a href="mailto:dsgvo@pan21.com" style={a}>dsgvo@pan21.com</a>,
        phone: +49 30 5684450-0.
      </p>

      <h2 style={h2}>2. Hosting</h2>
      <p style={p}>
        This website is hosted by Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA. When you visit the website, Vercel
        processes technically necessary data such as your IP address, date and time, the page requested, the referrer and browser
        information (server log files) in order to deliver the website and protect it against misuse. The legal basis is Art. 6(1)(f)
        GDPR (legitimate interest in secure and stable operation). We have concluded a data processing agreement with Vercel; transfers
        of data to the USA are based on the EU Standard Contractual Clauses.
      </p>

      <h2 style={h2}>3. Cookies</h2>
      <p style={p}>
        This website does not set any cookies for analytics or advertising purposes. If you reach the shop via a partner link containing
        a referral code, this code is stored in the cookie <code>pan21_ref</code> for 30 days so that an order can be attributed to the
        referring partner (Art. 6(1)(f) GDPR, legitimate interest in attributing referrals).
      </p>

      <h2 style={h2}>4. Visitor counting with PAN21counter</h2>
      <p style={p}>
        To count page views, we use our own visitor counter PAN21counter (pan21counter.de). It does not set cookies and does not create
        user profiles. When a page is requested, a shortened hash value that changes daily is derived from the IP address to avoid
        counting the same visitor more than once per day; the IP address itself is not stored. Individual page views are deleted after
        three days; after that, only aggregated daily figures remain. The legal basis is Art. 6(1)(f) GDPR (legitimate interest in simple
        reach measurement).
      </p>

      <h2 style={h2}>5. Advertising banners</h2>
      <p style={p}>
        Advertising banners are delivered via our own ad server ads.pan21.com. Your IP address is necessarily processed in order to
        deliver the banner; no user profiles are created. The legal basis is Art. 6(1)(f) GDPR.
      </p>

      <h2 style={h2}>6. Orders and payments</h2>
      <p style={p}>
        When you order in the shop, we process the data required to perform the contract (e.g. email address, the product chosen,
        payment status and the information needed to provide the service ordered). The legal basis is Art. 6(1)(b) GDPR; we retain
        invoice and order data in line with statutory retention obligations (Art. 6(1)(c) GDPR).
      </p>
      <p style={p}>
        Payments are processed by Stripe (Stripe Payments Europe Ltd., 1 Grand Canal Street Lower, Dublin 2, Ireland). The data required
        for the payment is transmitted to Stripe; Stripe does not pass your card details on to us. The legal basis is Art. 6(1)(b) GDPR.
      </p>
      <p style={p}>
        If you pay with EUROPAN credit, your email address and PIN are transmitted to the EUROPAN account system (noble-limited.com) to
        check your balance and debit the amount. The legal basis is Art. 6(1)(b) GDPR.
      </p>

      <h2 style={h2}>7. Contact form and email</h2>
      <p style={p}>
        If you write to us via the contact form or by email, we process the information you provide (e.g. name, email address, phone
        number, message) in order to answer your enquiry. The legal basis is Art. 6(1)(b) GDPR where your enquiry relates to a contract,
        otherwise Art. 6(1)(f) GDPR. The data is deleted as soon as it is no longer needed and no statutory retention obligations apply.
        Emails (contact enquiries and order confirmations) are sent via Resend (Resend Inc., USA) on the basis of a data processing
        agreement and the EU Standard Contractual Clauses.
      </p>

      <h2 style={h2}>8. Newsletter</h2>
      <p style={p}>
        We use beehiiv (Beehiiv Inc., USA) for our newsletter. When you subscribe, your email address and sign-up data are stored by
        beehiiv. The legal basis is your consent (Art. 6(1)(a) GDPR), which you can withdraw at any time via the unsubscribe link.
      </p>

      <h2 style={h2}>9. AI chat and voice call</h2>
      <p style={p}>
        The AI chat and voice call are only loaded once you actively start them. Your input or your voice is then transmitted to the
        provider in order to conduct the conversation. The legal basis is Art. 6(1)(b) or (f) GDPR.
      </p>

      <h2 style={h2}>10. Fonts</h2>
      <p style={p}>
        The fonts on this website are loaded locally from our own server. No connection is made to servers of Google or other font
        providers.
      </p>

      <h2 style={h2}>11. Embedded content</h2>
      <p style={p}>
        This website embeds banners and widgets from partner sites (e.g. firmenkauf.org, ffa-links.de, swiss-quality.de,
        german-quality.net). When this content is loaded, your IP address is necessarily transmitted to the respective server.
      </p>

      <h2 style={h2}>12. Your rights</h2>
      <p style={p}>
        You have the right of access (Art. 15 GDPR), rectification (Art. 16), erasure (Art. 17), restriction of processing (Art. 18), data
        portability (Art. 20) and to object to processing based on Art. 6(1)(f) GDPR (Art. 21). You can withdraw any consent you have
        given at any time with effect for the future. You also have the right to lodge a complaint with a data protection supervisory
        authority. Please send any requests to <a href="mailto:dsgvo@pan21.com" style={a}>dsgvo@pan21.com</a>.
      </p>

      <p style={{ ...p, marginTop: '2rem' }}>Status: October 2026</p>
    </>
  )
}
