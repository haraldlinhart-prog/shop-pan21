'use client'
import { useEffect } from 'react'

// Root layout (app/layout.tsx) is the only place allowed to render <html>,
// and it always renders <html lang="de"> since the German shop is the
// default site. This tiny client component corrects the attribute to "en"
// once an /en/* route mounts — it changes nothing else and never touches
// the German pages, which don't render it.
//
// This matches the language-detection convention already used by the
// injected support-widget script on this very site (and by the
// firmenkauf.org widget): both watch document.documentElement.lang via a
// MutationObserver and switch their own copy the moment it changes.
export function SetHtmlLang({ lang }: { lang: 'de' | 'en' }) {
  useEffect(() => {
    const prev = document.documentElement.lang
    document.documentElement.lang = lang
    return () => { document.documentElement.lang = prev }
  }, [lang])
  return null
}
