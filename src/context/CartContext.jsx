import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

// The cart only stores {id, quantity}. Prices and stock always come from the database,
// the cart is a convenience and is never trusted by the server (create_order re-checks everything).
const KEY = 'twenties_cart_v1'
const CartCtx = createContext(null)
export const useCart = () => useContext(CartCtx)

function loadItems() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY))
    return Array.isArray(raw)
      ? raw.filter((i) => typeof i.id === 'string' && Number.isInteger(i.quantity) && i.quantity > 0)
      : []
  } catch { return [] }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadItems)
  const [products, setProducts] = useState({})
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)) } catch { /* storage full/blocked */ }
  }, [items])

  const ids = items.map((i) => i.id).join(',')

  // Fetch fresh product data (price, stock, active). Missing rows = no longer available.
  const refresh = useCallback(async () => {
    const list = ids ? ids.split(',') : []
    if (!list.length) { setProducts({}); setLoaded(true); setLoadError(null); return {} }
    if (!supabase) { setLoadError('Not connected to Supabase.'); setLoaded(true); return {} }
    const { data, error } = await supabase.from('products').select('*').in('id', list)
    if (error) { setLoadError('Could not refresh prices and stock. Check your connection.'); setLoaded(true); return null }
    const map = Object.fromEntries(data.map((p) => [p.id, p]))
    setProducts(map); setLoadError(null); setLoaded(true)
    return map
  }, [ids])

  useEffect(() => { refresh() }, [refresh])

  const add = useCallback((product, qty = 1) => {
    if (product.stock_quantity <= 0) return { ok: false, message: 'This product is out of stock.' }
    let result = { ok: true, message: 'Added to cart.' }
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id)
      const wanted = (existing?.quantity || 0) + qty
      const next = Math.min(wanted, product.stock_quantity)
      if (wanted > product.stock_quantity) result = { ok: true, message: `Only ${product.stock_quantity} available. Cart updated.` }
      return existing
        ? prev.map((i) => (i.id === product.id ? { ...i, quantity: next } : i))
        : [...prev, { id: product.id, quantity: next }]
    })
    setProducts((m) => ({ ...m, [product.id]: product }))
    return result
  }, [])

  const setQty = useCallback((id, qty) => {
    setItems((prev) => prev.map((i) => {
      if (i.id !== id) return i
      const max = products[id]?.stock_quantity ?? qty
      return { ...i, quantity: Math.max(1, Math.min(qty, max)) }
    }))
  }, [products])

  const remove = useCallback((id) => setItems((p) => p.filter((i) => i.id !== id)), [])
  const clear = useCallback(() => setItems([]), [])

  const lines = useMemo(() => items.map((i) => {
    const product = products[i.id]
    return {
      id: i.id, quantity: i.quantity, product,
      unavailable: loaded && (!product || product.stock_quantity <= 0 || !product.is_active),
      overStock: Boolean(product) && i.quantity > product.stock_quantity,
    }
  }), [items, products, loaded])

  const count = items.reduce((n, i) => n + i.quantity, 0)
  const subtotal = lines.reduce((s, l) => (l.product ? s + Number(l.product.price) * l.quantity : s), 0)
  const canCheckout = loaded && !loadError && lines.length > 0 && lines.every((l) => !l.unavailable && !l.overStock)

  return (
    <CartCtx.Provider value={{ items, lines, count, subtotal, canCheckout, loaded, loadError, add, setQty, remove, clear, refresh }}>
      {children}
    </CartCtx.Provider>
  )
}
