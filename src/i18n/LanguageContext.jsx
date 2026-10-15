import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import en from './en'
import ar from './ar'
import { config } from '../lib/config'
import { formatEGP } from '../lib/format'

const DICTS = { en, ar }
const KEY = 'twenties_lang'
const LangCtx = createContext(null)
export const useLang = () => useContext(LangCtx)

function initialLang() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'ar' || saved === 'en') return saved
  } catch { /* storage blocked */ }
  return (navigator.language || '').toLowerCase().startsWith('ar') ? 'ar' : 'en'
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(initialLang)
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  // Keep <html lang dir> and the tab title in sync before the browser paints.
  useLayoutEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
    document.title = DICTS[lang]['meta.title']
  }, [lang, dir])

  const setLang = useCallback((l) => {
    setLangState(l)
    try { localStorage.setItem(KEY, l) } catch { /* ignore */ }
  }, [])
  const toggle = useCallback(() => setLang(lang === 'ar' ? 'en' : 'ar'), [lang, setLang])

  const value = useMemo(() => {
    const dict = DICTS[lang]
    const t = (key, vars) => {
      const v = dict[key] ?? en[key]
      if (v === undefined) return key
      if (typeof v === 'function') return v(vars || {})
      return vars ? v.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`)) : v
    }
    return {
      lang, dir, isAr: lang === 'ar', setLang, toggle, t,
      money: (n) => formatEGP(n, lang),
      slogan: lang === 'ar' ? config.sloganAr : config.slogan,
    }
  }, [lang, dir, setLang, toggle])

  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>
}

// The admin area is English only: force LTR there, and restore the shop language when leaving it.
export function useForceLtr() {
  useEffect(() => {
    const el = document.documentElement
    const prev = { lang: el.lang, dir: el.dir }
    el.lang = 'en'; el.dir = 'ltr'
    return () => { el.lang = prev.lang; el.dir = prev.dir }
  }, [])
}
