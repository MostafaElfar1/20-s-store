import { supabase } from './supabase'

// Anonymous visitor id kept in this browser only (no personal data).
const KEY = 'twenties_vid'
function visitorId() {
  try {
    let id = localStorage.getItem(KEY)
    if (!id) {
      id = (crypto.randomUUID && crypto.randomUUID()) || `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
      localStorage.setItem(KEY, id)
    }
    return id
  } catch {
    return null // storage blocked: skip tracking silently
  }
}

const currentPath = () => window.location.hash.replace(/^#/, '') || '/'

// Fire-and-forget: tracking must never break or slow down the store.
export function trackEvent(type, { productId = null, path } = {}) {
  try {
    const vid = visitorId()
    if (!supabase || !vid) return
    supabase
      .from('analytics_events')
      .insert({ event_type: type, path: (path || currentPath()).slice(0, 300), product_id: productId, visitor_id: vid })
      .then(() => {}, () => {})
  } catch { /* ignore */ }
}
