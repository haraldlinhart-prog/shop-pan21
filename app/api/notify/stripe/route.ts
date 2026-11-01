import { NextRequest, NextResponse } from 'next/server'
import { notifyStripeEvent } from '@/lib/stripe-notify'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad json' }, { status: 400 }) }
  if (!body?.id) return NextResponse.json({ error: 'no id' }, { status: 400 })
  try { return NextResponse.json({ result: await notifyStripeEvent(body.id) }) }
  catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }) }
}
