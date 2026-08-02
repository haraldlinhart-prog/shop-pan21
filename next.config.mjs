/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { remotePatterns: [{ protocol: 'https', hostname: 'shop.europan.group' }] },
  async redirects() {
    // Alte WooCommerce-Kategorie-URLs (vor der Migration zu diesem Next.js-Shop)
    // auf die passenden neuen Produktseiten umleiten. Mehrere Netzwerk-Sites
    // (u.a. pan21.com) verlinken noch auf dieses alte URL-Schema.
    const map = {
      'uk-grossbritannien': 'englische-limited-gruenden',
      'usa-firmengruendung': 'amerikanische-llc-gruenden',
      'irland-firmengruendung': 'irische-limited-gruenden',
      'deutschland-firmengruendung': 'deutsche-gmbh-gruendung',
      'hong-kong-firmengruendung': 'hong-kong-limited-gruenden',
      'australien-firmengruendung': 'australische-pty-ltd-gruenden',
      'neuseeland-firmengruendung': 'neuseelaendische-limited-gruenden',
      'belize-firmengruendung': 'belize-llc-gruenden',
      'nevis-firmengruendung': 'nevis-llc-gruenden',
    }
    const redirects = Object.entries(map).flatMap(([oldSlug, newSlug]) => [
      { source: `/produkt-kategorie/firmengruendung/${oldSlug}`, destination: `/produkt/${newSlug}`, permanent: true },
      { source: `/produkt-kategorie/firmengruendung/${oldSlug}/`, destination: `/produkt/${newSlug}`, permanent: true },
    ])
    redirects.push(
      { source: '/produkt-kategorie/firmengruendung', destination: '/#produkte', permanent: true },
      { source: '/produkt-kategorie/firmengruendung/', destination: '/#produkte', permanent: true }
    )
    return redirects
  },
}
export default nextConfig
