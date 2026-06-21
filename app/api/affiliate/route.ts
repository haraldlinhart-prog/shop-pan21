import { NextRequest, NextResponse } from 'next/server'

// GET /api/affiliate?ref=PARTNERID — sets affiliate cookie
// Used by widget and product pages
export async function GET(req: NextRequest) {
  const ref      = req.nextUrl.searchParams.get('ref')
  const redirect = req.nextUrl.searchParams.get('to') || '/'

  if (!ref) return NextResponse.redirect(new URL(redirect, req.url))

  const response = NextResponse.redirect(new URL(redirect, req.url))
  response.cookies.set('pan21_ref', ref, {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
    sameSite: 'lax',
  })
  return response
}
