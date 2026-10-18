import { supabase } from './supabase'
import { CATEGORIES, categoryLabel, findCategory } from './categories'

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

// Arabic text lives in name_ar / description_ar (category: see productCategory). Falls back to the English value.
export const pick = (p, field, lang) => (lang === 'ar' && p?.[`${field}_ar`]) || p?.[field] || ''

// Category of a product in the visitor's language (the Arabic name comes from lib/categories.js, not from the product).
export const productCategory = (p, lang) => categoryLabel(p?.category, lang, p?.category_ar)

// Map of category value -> label to show, only for categories that have products.
// Categories from lib/categories.js come first (in that order); any old/unknown ones follow.
export function categoryLabels(products, lang) {
  const used = new Map()
  for (const p of products) if (p.category && !used.has(p.category)) used.set(p.category, p)
  const map = new Map()
  for (const c of CATEGORIES) {
    const saved = [...used.keys()].find((v) => findCategory(v) === c)
    if (saved) { map.set(saved, lang === 'ar' ? c.ar : c.en); used.delete(saved) }
  }
  for (const [value, p] of used) map.set(value, categoryLabel(value, lang, p.category_ar))
  return map
}

// ---- sizes (variants) --------------------------------------------------------------------------
// Products are loaded together with their sizes. Each size has its own price and stock.
export const PRODUCT_SELECT = '*, product_variants(id, size_ml, price, compare_at_price, stock_quantity)'

// DB row -> product with a sorted `variants` array
export function normalizeProduct(row) {
  const { product_variants: pv, ...p } = row
  return { ...p, variants: [...(pv || [])].sort((a, b) => a.size_ml - b.size_ml) }
}

export const hasVariants = (p) => (p?.variants?.length ?? 0) > 0

// The exact size a cart item points at. Old carts saved without a size still work when the product has one size.
export function pickVariant(product, vid) {
  const vs = product?.variants || []
  if (vid) return vs.find((v) => v.id === vid) || null
  return vs.length === 1 ? vs[0] : null
}
export const unitPrice = (product, variant) => Number(variant ? variant.price : product.price)
export const unitStock = (product, variant) => (variant ? variant.stock_quantity : product.stock_quantity)

// Sizes (ml) a product is sold in
export const sizesOf = (p) => (hasVariants(p) ? p.variants.map((v) => v.size_ml) : p.volume_ml ? [p.volume_ml] : [])

// "In stock" for the catalog filter. When sizes are selected, the product must have one of THOSE sizes available.
export function isInStock(p, sizes = []) {
  if (sizes.length && hasVariants(p)) return p.variants.some((v) => sizes.includes(v.size_ml) && v.stock_quantity > 0)
  return p.stock_quantity > 0
}

// "You may also like": same category and shared occasions / notes score higher; in-stock first, then newest.
export function relatedProducts(current, all, limit = 4) {
  const notesOf = (p) => new Set([...(p.notes_top || []), ...(p.notes_heart || []), ...(p.notes_base || [])].map((n) => n.toLowerCase()))
  const mine = notesOf(current)
  const score = (p) => {
    let s = 0
    if (current.category && findCategory(p.category) === findCategory(current.category) && (findCategory(p.category) || p.category === current.category)) s += 3
    s += 2 * (p.occasions || []).filter((o) => (current.occasions || []).includes(o)).length
    for (const n of notesOf(p)) if (mine.has(n)) s += 1
    return s
  }
  return all
    .filter((p) => p.id !== current.id)
    .map((p) => ({ p, s: score(p), inStock: p.stock_quantity > 0 }))
    .sort((a, b) => (b.inStock - a.inStock) || (b.s - a.s) || (new Date(b.p.created_at) - new Date(a.p.created_at)))
    .slice(0, limit)
    .map((x) => x.p)
}
