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
]

export async function GET() {
  return NextResponse.json({ tools: TOOLS }, { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' } })
}
