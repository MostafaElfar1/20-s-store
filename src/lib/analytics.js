import { supabase } from './supabase'

// Anonymous, approximate visitor analytics. Stores NO IP address and no exact location.
const VID = 'twenties_vid'        // persistent id for this browser
const VISIT = 'twenties_visit'    // id of the current visit (one per browser tab session)
const OFF = 'twenties_internal'   // "don't track this browser" switch (set from /supervisor)

const uuid = () =>
  (crypto.randomUUID && crypto.randomUUID()) ||
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 3) | 8).toString(16) })

export const isTrackingOff = () => { try { return localStorage.getItem(OFF) === '1' } catch { return false } }
export const setTrackingOff = (off) => { try { off ? localStorage.setItem(OFF, '1') : localStorage.removeItem(OFF) } catch { /* ignore */ } }

function visitorId() {
  try {
    let id = localStorage.getItem(VID)
    if (!id) { id = uuid(); localStorage.setItem(VID, id) }
    return id
  } catch {
    return null // storage blocked: skip tracking silently
  }
}

const currentPath = () => window.location.hash.replace(/^#/, '') || '/'

// ---- device / browser / source -------------------------------------------------------------
export function parseUA(ua = navigator.userAgent || '') {
  const iPadOS = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1
  const device = /iPad|Tablet|PlayBook|Silk/i.test(ua) || iPadOS || (/Android/i.test(ua) && !/Mobile/i.test(ua))
    ? 'tablet'
    : /Mobi|iPhone|iPod|Android/i.test(ua) ? 'mobile' : 'desktop'
  const os = /Windows/i.test(ua) ? 'Windows'
    : /Android/i.test(ua) ? 'Android'
    : /iPhone|iPad|iPod/i.test(ua) || iPadOS ? 'iOS'
    : /Mac OS X|Macintosh/i.test(ua) ? 'macOS'
    : /CrOS/i.test(ua) ? 'ChromeOS'
    : /Linux/i.test(ua) ? 'Linux' : 'Other'
  const browser = /Instagram/i.test(ua) ? 'Instagram app'
    : /FBAN|FBAV|FB_IAB/i.test(ua) ? 'Facebook app'
    : /TikTok|musical_ly|Bytedance/i.test(ua) ? 'TikTok app'
    : /Snapchat/i.test(ua) ? 'Snapchat app'
    : /SamsungBrowser/i.test(ua) ? 'Samsung Internet'
    : /Edg\//i.test(ua) ? 'Edge'
    : /OPR\/|Opera/i.test(ua) ? 'Opera'
    : /Firefox|FxiOS/i.test(ua) ? 'Firefox'
    : /Chrome|CriOS/i.test(ua) ? 'Chrome'
    : /Safari/i.test(ua) ? 'Safari' : 'Other'
  return { device, os, browser }
}

const SOURCES = [
  [/(^|\.)instagram\.com$/, 'Instagram'], [/(^|\.)(facebook|fb)\.com$|^fb\.me$/, 'Facebook'],
  [/(^|\.)(twitter|x)\.com$|^t\.co$/, 'X'], [/(^|\.)tiktok\.com$/, 'TikTok'], [/(^|\.)google\./, 'Google'],
  [/(^|\.)bing\.com$/, 'Bing'], [/(^|\.)(whatsapp\.com|wa\.me)$/, 'WhatsApp'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'YouTube'], [/(^|\.)snapchat\.com$/, 'Snapchat'], [/(^|\.)pinterest\./, 'Pinterest'],
]

export function sourceInfo(browser) {
  const qs = new URLSearchParams(window.location.search)
  const hashQs = new URLSearchParams(window.location.hash.split('?')[1] || '')
  const utm = (k) => qs.get(k) || hashQs.get(k) || null
  let host = ''
  try { host = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : '' } catch { /* ignore */ }
  if (host === window.location.hostname.replace(/^www\./, '')) host = '' // our own site (reload)
  const us = utm('utm_source')
  let source = us ? us.slice(0, 40) : host ? (SOURCES.find(([re]) => re.test(host))?.[1] || host) : 'Direct'
  // In-app browsers often hide the referrer, but the app name still tells us where the visitor came from.
  if (source === 'Direct') {
    const app = /^(Instagram|Facebook|TikTok|Snapchat) app$/.exec(browser)
    if (app) source = app[1]
  }
  return { source, referrer_host: host || null, utm_campaign: utm('utm_campaign') }
}

// ---- visits --------------------------------------------------------------------------------
// Approximate area from /api/geo (resolved by Vercel from the connection; the IP is never read or stored).
// Cached, so the visit tracking and the checkout pre-fill share one request.
let geoPromise = null
export function getGeo() {
  if (!geoPromise) geoPromise = fetchGeo()
  return geoPromise
}

async function fetchGeo() {
  try {
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), 2500)
    const r = await fetch('/api/geo', { signal: ctl.signal, cache: 'no-store' })
    clearTimeout(timer)
    if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) return {} // not on Vercel (e.g. local dev)
    return await r.json()
  } catch { return {} }
}

async function registerVisit(id) {
  const vid = visitorId()
  if (!vid || !supabase) return
  const geo = await getGeo()
  const ua = parseUA()
  const src = sourceInfo(ua.browser)
  let tz = geo.timezone
  if (!tz) { try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone } catch { /* ignore */ } }
  supabase.from('visits').insert({
    id, visitor_id: vid,
    country: geo.country || null, region: geo.region || null, city: geo.city ? String(geo.city).slice(0, 100) : null, timezone: tz || null,
    device: ua.device, os: ua.os, browser: ua.browser,
    language: (navigator.language || '').slice(0, 16) || null,
    ...src, landing_path: currentPath().slice(0, 300),
  }).then(() => {}, () => {})
}

let memoryVisit = null
function getVisitId() {
  let id = null
  try { id = sessionStorage.getItem(VISIT) } catch { id = memoryVisit }
  if (id) return id
  id = uuid()
  memoryVisit = id
  try { sessionStorage.setItem(VISIT, id) } catch { /* ignore */ }
  registerVisit(id) // fire and forget
  return id
}

// ---- events --------------------------------------------------------------------------------
// Fire-and-forget: tracking must never break or slow down the store.
export function trackEvent(type, { productId = null, path, meta = null } = {}) {
  try {
    if (isTrackingOff()) return
    const vid = visitorId()
    if (!supabase || !vid) return
    supabase
      .from('analytics_events')
      .insert({
        event_type: type, path: (path || currentPath()).slice(0, 300), product_id: productId,
        visitor_id: vid, visit_id: getVisitId(), meta: meta ? String(meta).slice(0, 100) : null,
      })
      .then(() => {}, () => {})
  } catch { /* ignore */ }
}
