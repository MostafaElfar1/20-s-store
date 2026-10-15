import { supabase } from './supabase'

export function productImageUrl(path) {
  if (!path || !supabase) return null
  if (/^https?:\/\//.test(path)) return path
  return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
}

// state: 'out' | 'low' (5 or fewer left, shows the count) | 'in'
export function stockInfo(p) {
  if (p.stock_quantity <= 0) return { state: 'out', ok: false, count: 0 }
  if (p.stock_quantity <= 5) return { state: 'low', ok: true, count: p.stock_quantity }
  return { state: 'in', ok: true, count: p.stock_quantity }
}

export const hasSale = (p) => p.compare_at_price && Number(p.compare_at_price) > Number(p.price)

// Arabic text lives in name_ar / description_ar / category_ar. Falls back to the English value.
export const pick = (p, field, lang) => (lang === 'ar' && p?.[`${field}_ar`]) || p?.[field] || ''

// Map of category -> label to show. Uses category_ar in Arabic when any product of that category has one.
export function categoryLabels(products, lang) {
  const map = new Map()
  for (const p of products) {
    if (!p.category) continue
    const ar = lang === 'ar' && p.category_ar ? p.category_ar : null
    if (!map.has(p.category) || (ar && map.get(p.category) === p.category)) map.set(p.category, ar || p.category)
  }
  return map
}
