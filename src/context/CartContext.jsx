import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLang } from '../i18n/LanguageContext'
import { PRODUCT_SELECT, normalizeProduct, pickVariant, unitPrice, unitStock } from '../lib/products'

// The cart only stores {id (product), vid (size), quantity}. Prices and stock always come from the database,
// the cart is a convenience and is never trusted by the server (create_order re-checks everything).
const KEY = 'twenties_cart_v1'
const CartCtx = createContext(null)
export const useCart = () => useContext(CartCtx)

// One cart line per product + size. Size ids are unique, so the size id is the key (old carts: the product id).
const keyOf = (i) => i.vid || i.id

// Pure helper (easy to test): put `qty` more of this size in the cart, never above its stock.
export function addToItems(prev, product, variant, qty, stock) {
  const key = variant?.id || product.id
  const existing = prev.find((i) => keyOf(i) === key)
  const next = Math.min((existing?.quantity || 0) + qty, stock)
  return existing
    ? prev.map((i) => (keyOf(i) === key ? { ...i, quantity: next } : i))
    : [...prev, { id: product.id, vid: variant?.id || null, quantity: next }]
}

function loadItems() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY))
    return Array.isArray(raw)
      ? raw
          .filter((i) => typeof i.id === 'string' && Number.isInteger(i.quantity) && i.quantity > 0)
          .map((i) => ({ id: i.id, vid: typeof i.vid === 'string' ? i.vid : null, quantity: i.quantity }))
      : []
  } catch { return [] }
}

export function CartProvider({ children }) {
  const { t } = useLang()
  const [items, setItems] = useState(loadItems)
  const [products, setProducts] = useState({})
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)) } catch { /* storage full/blocked */ }
  }, [items])

  const ids = [...new Set(items.map((i) => i.id))].join(',')

  // Fetch fresh product data (price, stock, active, sizes). Missing rows = no longer available.
  const refresh = useCallback(async () => {
    const list = ids ? ids.split(',') : []
    if (!list.length) { setProducts({}); setLoaded(true); setLoadError(null); return {} }
    if (!supabase) { setLoadError('not_connected'); setLoaded(true); return {} }
    const { data, error } = await supabase.from('products').select(PRODUCT_SELECT).in('id', list)
    if (error) { setLoadError('refresh_failed'); setLoaded(true); return null }
    const map = Object.fromEntries(data.map((row) => { const p = normalizeProduct(row); return [p.id, p] }))
    setProducts(map); setLoadError(null); setLoaded(true)
    return map
  }, [ids])

  useEffect(() => { refresh() }, [refresh])

  // Carts saved before sizes existed: attach the only size, and merge lines that became identical.
  useEffect(() => {
    if (!loaded) return
    setItems((prev) => {
      let changed = false
      const upgraded = prev.map((i) => {
        if (i.vid) return i
        const v = pickVariant(products[i.id], null)
        if (!v) return i
        changed = true
        return { ...i, vid: v.id }
      })
      if (!changed) return prev
      const merged = []
      for (const i of upgraded) {
        const same = merged.find((m) => keyOf(m) === keyOf(i))
        if (same) same.quantity += i.quantity
        else merged.push({ ...i })
      }
      return merged
    })
  }, [loaded, products])

  const itemsRef = useRef(items)
  itemsRef.current = items

  // `variant` is the chosen size (null only for a product without sizes).
  const add = useCallback((product, variant, qty = 1) => {
    const stock = unitStock(product, variant)
    if (stock <= 0) return { ok: false, message: t('cart.outOfStock') }
    const key = variant?.id || product.id
    const already = itemsRef.current.find((i) => keyOf(i) === key)?.quantity || 0
    setItems((prev) => addToItems(prev, product, variant, qty, stock))
    setProducts((m) => ({ ...m, [product.id]: product }))
    return already + qty > stock
      ? { ok: true, message: t('cart.limited', { n: stock }) }
      : { ok: true, message: t('cart.added') }
  }, [t])

  const setQty = useCallback((key, qty) => {
    setItems((prev) => prev.map((i) => {
      if (keyOf(i) !== key) return i
      const p = products[i.id]
      const max = p ? unitStock(p, pickVariant(p, i.vid)) : qty
      return { ...i, quantity: Math.max(1, Math.min(qty, max)) }
    }))
  }, [products])

  const remove = useCallback((key) => setItems((p) => p.filter((i) => keyOf(i) !== key)), [])
  const clear = useCallback(() => setItems([]), [])

  const lines = useMemo(() => items.map((i) => {
    const product = products[i.id]
    const variant = product ? pickVariant(product, i.vid) : null
    const hasSizes = (product?.variants?.length ?? 0) > 0
    const needsSize = loaded && Boolean(product) && hasSizes && !variant // the size was removed, or the old cart was ambiguous
    const stock = product ? unitStock(product, variant) : 0
    return {
      key: keyOf(i), id: i.id, vid: i.vid, quantity: i.quantity, product, variant, needsSize, stock,
      unitPrice: product ? unitPrice(product, variant) : 0,
      unavailable: loaded && (!product || !product.is_active || needsSize || stock <= 0),
      overStock: Boolean(product) && !needsSize && i.quantity > stock,
    }
  }), [items, products, loaded])

  const count = items.reduce((n, i) => n + i.quantity, 0)
  const subtotal = lines.reduce((s, l) => (l.product && !l.needsSize ? s + l.unitPrice * l.quantity : s), 0)
  const canCheckout = loaded && !loadError && lines.length > 0 && lines.every((l) => !l.unavailable && !l.overStock)

  return (
    <CartCtx.Provider value={{ items, lines, count, subtotal, canCheckout, loaded, loadError, add, setQty, remove, clear, refresh }}>
      {children}
    </CartCtx.Provider>
  )
}
