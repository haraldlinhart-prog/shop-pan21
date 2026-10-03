import { NextResponse } from 'next/server'

// Zentrale Pflegestelle für alle kostenlosen PAN21-Webmaster-Tools.
// Alle Tool-Websites rufen diese Liste zur Laufzeit ab, um sie in ihren
// E-Mails zu bewerben. Neues Tool hinzufügen = nur hier einen Eintrag
// ergänzen, alle anderen Tools übernehmen es automatisch beim nächsten Versand.
//
// Englisch (für tools.webmaster.plus/en): `url_en` und `en` mit description/details.
// `langs` begrenzt, in welchen Sprachversionen der Übersicht ein Tool erscheint.
const TOOLS = [
  {
    slug: 'pan21counter',
    emoji: '📊',
    name: 'PAN21counter',
    url: 'https://pan21counter.de',
    description: 'Kostenloser Besucherzähler mit Toplist',
    url_en: 'https://pan21counter.de/en',
    en: { description: 'Free visitor counter with a public top list' },
  },
  {
    slug: 'site-ok',
    emoji: '🟢',
    name: 'site-ok.de',
    url: 'https://site-ok.de',
    description: 'Prüft, ob Ihre Website erreichbar ist',
    url_en: 'https://site-ok.de/en',
    en: { description: 'Checks whether your website is up and reachable' },
  },
  {
    slug: 'pagespeed-plus',
    emoji: '⚡',
    name: 'PageSpeed-Plus',
    url: 'https://pagespeed-plus.de',
    description: 'Kostenloser Google-PageSpeed-Check',
    url_en: 'https://pagespeed-plus.de/en',
    en: { description: 'Free Google PageSpeed check' },
  },
  {
    slug: 'spam-abwehr',
    emoji: '🛡️',
    name: 'Spam-Abwehr',
    url: 'https://spam-abwehr.de',
    description: 'Gemeinschaftliche Spam-Blockliste für Formulare',
    url_en: 'https://spam-abwehr.de/en',
    en: { description: 'Shared community spam blocklist for website forms' },
  },
  {
    slug: 'impressum-free',
    emoji: '📄',
    name: 'Impressum-Free',
    url: 'https://impressum-free.de',
    description: 'Kostenloser Impressum-Generator',
    url_en: 'https://impressum-free.de/en',
    en: { description: 'Free generator for the legal notice (Impressum) required in Germany' },
  },
  {
    slug: 'linkcheck-plus',
    emoji: '🔗',
    name: 'kaputte-links.de',
    url: 'https://kaputte-links.de',
    description: 'Findet defekte Links auf Ihrer Website',
    url_en: 'https://kaputte-links.de/en',
    en: { description: 'Broken link checker: finds dead links on your website' },
  },
  {
    slug: 'anti-spam-info',
    emoji: '✋',
    name: 'anti-spam.info',
    url: 'https://anti-spam.info',
    description: 'Öffentliches Versprechen: Spam wird nicht gelesen, nicht geklickt, nicht gekauft',
    url_en: 'https://anti-spam.info/en',
    en: { description: 'A public pledge: spam is not read, not clicked, not bought' },
  },
  {
    slug: 'suchmaschinen-pro',
    emoji: '🔍',
    name: 'suchmaschinen.pro',
    url: 'https://www.suchmaschinen.pro',
    description: 'SEO-Artikel auf Ihrer eigenen Domain, automatisch auch auf Facebook geteilt',
    // Ausführlicher Text nur für tools.webmaster.plus. Die E-Mail-Footer nutzen weiter nur `description`.
    details: [
      'suchmaschinen.pro wertet die Suchbegriffe aus Ihrer Google Search Console aus und findet Themen, nach denen Ihre Zielgruppe bereits sucht, für die Ihre Website aber noch keine passende Seite hat. Daraus schreibt eine KI regelmäßig Artikel und veröffentlicht sie automatisch im Blog auf Ihrer eigenen Domain, zum Beispiel unter ihredomain.de/blog/. Die Inhalte gehören Ihnen und bleiben online, auch wenn Sie kündigen.',
      'Neu und nach den letzten Tests fehlerfrei: die Facebook-Anbindung. Jeder neue Artikel wird gleichzeitig auf Ihrer Facebook-Unternehmensseite geteilt. So erreichen Sie nicht nur Menschen, die bei Google aktiv suchen, sondern auch Leser im Facebook-Feed, die Sie noch nicht kennen, ohne zusätzlichen Aufwand und ohne Werbebudget.',
      'Anders als bei Google Ads zahlen Sie nicht für jeden Klick: Die Sichtbarkeit wächst mit jedem Artikel. Der FREE-Plan ist kostenlos (1 Artikel alle 2 Wochen, mit Badge). Die bezahlten Pläne reichen von 19 € bis 49 € im Monat, bis hin zu einem Artikel täglich mit automatischer Überarbeitung von Artikeln, die bei Google abrutschen. Monatlich kündbar.',
    ],
    // Auf der englischen Übersicht steht stattdessen search-engines.pro
    langs: ['de'],
  },
  {
    slug: 'search-engines-pro',
    emoji: '🌍',
    name: 'search-engines.pro',
    url: 'https://www.search-engines.pro',
    description: 'SEO content on your own domain, auto-shared to Facebook (English version)',
    details: [
      'search-engines.pro analyzes your website, finds the search terms with real traffic potential and writes matching articles. They are published natively under yourdomain.com/blog/ on your own domain, not on an isolated subdomain or via a JavaScript footer plugin, so every article adds directly to your main domain\'s visibility in Google. The content is yours and stays online even if you cancel.',
      'New and fully working after our latest tests: the Facebook integration. Every new article is shared to your Facebook business page at the same time, so you reach not only people actively searching on Google but also readers in their Facebook feed who don\'t know you yet, with no extra effort and no ad budget.',
      'Unlike Google Ads, you don\'t pay per click: your visibility grows with every article, and transparent reporting shows how many of them Google has actually indexed. The FREE plan costs €0 (1 article every 2 weeks, with badge). Paid plans range from €19 to €49 per month, up to one article every day. Cancel monthly, no minimum term.',
    ],
    en: {
      description: 'SEO articles on your own domain, automatically shared to Facebook',
    },
  },
  {
    slug: 'abmahnschutz-pro',
    emoji: '⚖️',
    name: 'abmahnschutz.pro',
    url: 'https://www.abmahnschutz.pro',
    description: 'Erste Hilfe bei Massenabmahnungen und Vorsorge für Website-Betreiber',
    url_en: 'https://www.abmahnschutz.pro/en',
    en: {
      description:
        'First aid against mass "Abmahnungen" (German cease-and-desist letters) and prevention for website owners',
    },
  },
  {
    slug: 'dsgvo-checken',
    emoji: '🔒',
    name: 'dsgvo-checken.de',
    url: 'https://dsgvo-checken.de',
    description: 'Kostenloser DSGVO-Check: Datenschutzerklärung, Cookie-Banner, Google Fonts, Tracking',
    url_en: 'https://dsgvo-checken.de/en',
    en: { description: 'Free GDPR check: privacy policy, cookie banner, Google Fonts, tracking' },
  },
  {
    slug: 'email-checken',
    emoji: '📧',
    name: 'email-checken.de',
    url: 'https://email-checken.de',
    description: 'E-Mail-Sicherheitscheck: SPF, DKIM, DMARC und Blacklist-Prüfung',
    url_en: 'https://email-checken.de/en',
    en: { description: 'Email security check: SPF, DKIM, DMARC and blacklist lookup' },
  },
  {
    slug: 'bfsg-checken',
    emoji: '♿',
    name: 'bfsg-checken.de',
    url: 'https://bfsg-checken.de',
    description: 'Barrierefreiheits-Check nach dem BFSG: Alt-Texte, Überschriften, Formulare und mehr',
    url_en: 'https://bfsg-checken.de/en',
    en: {
      description:
        'Accessibility check under the European Accessibility Act (German BFSG): alt texts, headings, forms and more',
    },
  },
]

export async function GET() {
  return NextResponse.json({ tools: TOOLS }, { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' } })
}
