import { NextResponse } from 'next/server'

// Zentrale Pflegestelle für alle kostenlosen PAN21-Webmaster-Tools.
// Alle Tool-Websites rufen diese Liste zur Laufzeit ab, um sie in ihren
// E-Mails zu bewerben. Neues Tool hinzufügen = nur hier einen Eintrag
// ergänzen, alle anderen Tools übernehmen es automatisch beim nächsten Versand.
const TOOLS = [
  {
    slug: 'pan21counter',
    emoji: '📊',
    name: 'PAN21counter',
    url: 'https://pan21counter.de',
    description: 'Kostenloser Besucherzähler mit Toplist',
  },
  {
    slug: 'site-ok',
    emoji: '🟢',
    name: 'site-ok.de',
    url: 'https://site-ok.de',
    description: 'Prüft, ob Ihre Website erreichbar ist',
  },
  {
    slug: 'pagespeed-plus',
    emoji: '⚡',
    name: 'PageSpeed-Plus',
    url: 'https://pagespeed-plus.de',
    description: 'Kostenloser Google-PageSpeed-Check',
  },
  {
    slug: 'spam-abwehr',
    emoji: '🛡️',
    name: 'Spam-Abwehr',
    url: 'https://spam-abwehr.de',
    description: 'Gemeinschaftliche Spam-Blockliste für Formulare',
  },
  {
    slug: 'impressum-free',
    emoji: '📄',
    name: 'Impressum-Free',
    url: 'https://impressum-free.de',
    description: 'Kostenloser Impressum-Generator',
  },
  {
    slug: 'linkcheck-plus',
    emoji: '🔗',
    name: 'kaputte-links.de',
    url: 'https://kaputte-links.de',
    description: 'Findet defekte Links auf Ihrer Website',
  },
  {
    slug: 'anti-spam-info',
    emoji: '✋',
    name: 'anti-spam.info',
    url: 'https://anti-spam.info',
    description: 'Öffentliches Versprechen: Spam wird nicht gelesen, nicht geklickt, nicht gekauft',
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
  },
  {
    slug: 'search-engines-pro',
    emoji: '🌍',
    name: 'search-engines.pro',
    url: 'https://www.search-engines.pro',
    description: 'SEO content on your own domain (English version)',
  },
  {
    slug: 'abmahnschutz-pro',
    emoji: '⚖️',
    name: 'abmahnschutz.pro',
    url: 'https://www.abmahnschutz.pro',
    description: 'Erste Hilfe bei Massenabmahnungen und Vorsorge für Website-Betreiber',
  },
  {
    slug: 'dsgvo-checken',
    emoji: '🔒',
    name: 'dsgvo-checken.de',
    url: 'https://dsgvo-checken.de',
    description: 'Kostenloser DSGVO-Check: Datenschutzerklärung, Cookie-Banner, Google Fonts, Tracking',
  },
  {
    slug: 'email-checken',
    emoji: '📧',
    name: 'email-checken.de',
    url: 'https://email-checken.de',
    description: 'E-Mail-Sicherheitscheck: SPF, DKIM, DMARC und Blacklist-Prüfung',
  },
  {
    slug: 'bfsg-checken',
    emoji: '♿',
    name: 'bfsg-checken.de',
    url: 'https://bfsg-checken.de',
    description: 'Barrierefreiheits-Check nach dem BFSG: Alt-Texte, Überschriften, Formulare und mehr',
  },
]

export async function GET() {
  return NextResponse.json({ tools: TOOLS }, { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' } })
}
