'use client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import '../globals.css'

function SuccessContent() {
  const params = useSearchParams()
  const product = params.get('product') || 'Ihr Produkt'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--snow)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', paddingTop: '88px' }}>
      <div style={{ maxWidth: '520px', textAlign: 'center', background: 'var(--white)', border: '1px solid var(--lgray)', borderTop: '3px solid var(--gold)', padding: '3rem' }}>
        <div style={{ width: '64px', height: '64px', background: 'rgba(201,150,58,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '1.5rem' }}>✓</div>
        <h1 style={{ fontFamily: 'var(--ff-d)', fontSize: '2rem', fontWeight: 600, color: 'var(--navy)', marginBottom: '0.75rem' }}>
          Bestellung erfolgreich
        </h1>
        <p style={{ color: 'var(--gray)', lineHeight: 1.8, marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Vielen Dank für Ihre Bestellung von <strong style={{ color: 'var(--navy)' }}>{product}</strong>.
          Sie erhalten in Kürze eine Bestätigung per E-Mail.
        </p>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.75, marginBottom: '2.5rem' }}>
          Unser Team wird sich innerhalb von einem Werktag mit Ihnen in Verbindung setzen,
          um die erforderlichen Daten für die Gründung anzufordern.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="https://pan21.com" className="btn-navy">PAN21.com besuchen →</a>
          <Link href="/" className="btn-outline">← Zurück zum Shop</Link>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <>
      <nav className="nav">
        <div className="container nav-inner">
          <Link href="/" className="nav-logo">
            <div className="nav-logo-mark">P21</div>
            <div>
              <span className="nav-logo-text">PAN21 Shop</span>
              <span className="nav-logo-sub">Corporate Services</span>
            </div>
          </Link>
        </div>
      </nav>
      <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Laden…</div>}>
        <SuccessContent />
      </Suspense>
    </>
  )
}
