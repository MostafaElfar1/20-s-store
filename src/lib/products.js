import { supabase } from './supabase'

export function productImageUrl(path) {
  if (!path || !supabase) return null
  if (/^https?:\/\//.test(path)) return path
  return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
}

export function stockInfo(p) {
  if (p.stock_quantity <= 0) return { label: 'Out of stock', ok: false }
  if (p.stock_quantity <= 5) return { label: `Only ${p.stock_quantity} left`, ok: true }
  return { label: 'In stock', ok: true }
}

export const hasSale = (p) => p.compare_at_price && Number(p.compare_at_price) > Number(p.price)
