import { NextRequest, NextResponse } from 'next/server'

// Catches bot-generated random tokens that are short enough to slide past a simple
// length check but look nothing like a real word: very few vowels AND unnaturally
// frequent upper/lowercase switching. Both conditions required together to avoid
// flagging real oddly-cased words (e.g. "McDonald").
// E-Mail-Blockliste — normalisiert Gmail-Punkte/Plus-Tags, damit Bots sie nicht
// durch e.dip.a.ju.l.o.d.ev.8.5@gmail.com vs. ed.ip.ajulo.de.v85@gmail.com umgehen.
const BLOCKED_EMAILS = new Set([
  'ugibanicepi459@gmail.com',
  'edipajulodev85@gmail.com',
]);
function normalizeEmail(email: string): string {
  const e = (email || '').trim().toLowerCase();
  const at = e.indexOf('@');
  if (at === -1) return e;
  let local = e.slice(0, at);
  const domain = e.slice(at + 1);
  local = local.split('+')[0];
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    local = local.replace(/\./g, '');
  }
  return local + '@' + (domain === 'googlemail.com' ? 'gmail.com' : domain);
}

function isGibberish(str: string): boolean {
  const words = (str || '').split(/\s+/).filter(w => w.length >= 6);
  const vowelChars = 'aeiouyAEIOUYäöüÄÖÜàáâãåèéêëìíîïòóôõùúûýÀÁÂÃÅÈÉÊËÌÍÎÏÒÓÔÕÙÚÛÝ';
  for (const word of words) {
    const letters = word.replace(/[^a-zA-ZäöüÄÖÜßàáâãåèéêëìíîïòóôõùúûýÀÁÂÃÅÈÉÊËÌÍÎÏÒÓÔÕÙÚÛÝ]/g, '');
    if (letters.length < 6) continue;
    let vowels = 0;
    for (const ch of letters) if (vowelChars.includes(ch)) vowels++;
    const vowelRatio = vowels / letters.length;
    let transitions = 0;
    for (let i = 1; i < letters.length; i++) {
      const prevUpper = letters[i - 1] === letters[i - 1].toUpperCase() && letters[i - 1] !== letters[i - 1].toLowerCase();
      const curUpper = letters[i] === letters[i].toUpperCase() && letters[i] !== letters[i].toLowerCase();
      if (prevUpper !== curUpper) transitions++;
    }
    const transitionRatio = transitions / (letters.length - 1);
    // Tiered threshold: longer strings need a less extreme vowel-ratio to be flagged,
    // since genuine long words (esp. German compounds) always carry a healthy vowel
    // share, while short strings need a stricter cutoff to avoid catching real
    // camelCase brand names (McDonald, PayPal, JavaScript...).
    const vowelThreshold = letters.length >= 14 ? 0.28 : (letters.length >= 11 ? 0.22 : 0.16);
    if (vowelRatio < vowelThreshold && transitionRatio > 0.3) return true;
  }
  if (/\S{61,}/.test(str || '')) return true;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, interest, message, elapsed, inquiry } = body

  // Gibberish-Bot-Erkennung (kurze Zufallsstrings) — silent success wie Honeypot
  if (isGibberish(message) || isGibberish(name) || BLOCKED_EMAILS.has(normalizeEmail(email))) { return NextResponse.json({ ok: true }); }

    if (body.website) return NextResponse.json({ ok: true })
    if (typeof elapsed === 'number' && elapsed < 2000) return NextResponse.json({ ok: true })
    if (!name || !email) return NextResponse.json({ error: 'Pflichtfelder fehlen' }, { status: 400 })
    if (!email.includes('@')) return NextResponse.json({ error: 'Ungültige E-Mail' }, { status: 400 })
    if (message) {
      const noSpaces = String(message).replace(/\s/g, '')
      if (noSpaces.length > 60 && noSpaces.length === String(message).length) return NextResponse.json({ ok: true })
    }

    const resendKey = process.env.RESEND_API_KEY
    const contactTo = process.env.CONTACT_TO || 'shop@pan21.com'

    if (!resendKey) {
      console.log('Contact (no Resend):', { name, email, interest })
      return NextResponse.json({ ok: true })
    }

    const subject = inquiry
      ? `Anfrage: ${interest || name} — PAN21 Shop`
      : `Kontakt: ${interest || name} — PAN21 Shop`

    const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#F7F8FA;">
  <div style="border-left:3px solid #C9963A;padding-left:16px;margin-bottom:20px;">
    <div style="font-size:0.65rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#C9963A;margin-bottom:4px;">PAN21 Shop — ${inquiry ? 'Produktanfrage' : 'Kontakt'}</div>
    <div style="font-size:1rem;font-weight:700;color:#0B1F3A;">${interest || 'Allgemeine Anfrage'}</div>
  </div>
  <table style="width:100%;font-size:0.875rem;color:#5C6B7A;border-collapse:collapse;">
    <tr><td style="padding:7px 0;font-weight:700;color:#0B1F3A;width:90px;">Name</td><td>${name}</td></tr>
    <tr><td style="padding:7px 0;font-weight:700;color:#0B1F3A;">E-Mail</td><td><a href="mailto:${email}">${email}</a></td></tr>
    ${phone ? `<tr><td style="padding:7px 0;font-weight:700;color:#0B1F3A;">Telefon</td><td>${phone}</td></tr>` : ''}
    ${interest ? `<tr><td style="padding:7px 0;font-weight:700;color:#0B1F3A;">Interesse</td><td>${interest}</td></tr>` : ''}
  </table>
  ${message ? `<div style="background:#fff;border:1px solid #DDE2E8;padding:16px 20px;margin-top:16px;font-size:0.875rem;line-height:1.8;white-space:pre-wrap;">${message}</div>` : ''}
  <p style="font-size:0.68rem;color:#9CA3AF;margin-top:20px;">shop.pan21.com · ${elapsed}ms</p>
</div>`

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'PAN21 Shop <noreply@pan21.com>',
        to: contactTo,
        reply_to: email,
        subject,
        html,
      }),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Contact error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
