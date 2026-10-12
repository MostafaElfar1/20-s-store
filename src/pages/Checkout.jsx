import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import { formatEGP } from '../lib/format'
import { GOVERNORATES, cleanPhone, validateCheckout } from '../lib/validators'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'

export const LAST_ORDER_KEY = 'twenties_last_order'

// Turns the database exception text into something a customer can read.
function friendlyError(err) {
  const m = err?.message || ''
  if (m.includes('INSUFFICIENT_STOCK')) return `Not enough stock for "${m.split('INSUFFICIENT_STOCK:')[1]?.trim()}". Please lower the quantity in your cart.`
  if (m.includes('PRODUCT_UNAVAILABLE')) return 'One of the products is no longer available. Please review your cart.'
  if (m.includes('INVALID_PHONE')) return 'The phone number was rejected. Please check it.'
  if (m.includes('INVALID_')) return 'Some order details were rejected. Please review the form.'
  if (/fetch|network/i.test(m)) return 'Network problem. Your order was NOT confirmed. You can safely press the button again.'
  return 'Something went wrong and your order was NOT confirmed. Please try again.'
}

// Defined at module level on purpose: a component created inside another component is a
// brand-new component on every render, which remounts the input and drops focus after each key.
const Field = ({ id, label, error, children }) => (
  <div>
    <label htmlFor={id} className="mb-2 block text-xs uppercase tracking-widest text-muted">{label}</label>
    {children}
    {error && <p className="mt-1 text-sm text-red-400" role="alert">{error}</p>}
  </div>
)

export default function Checkout() {
  const navigate = useNavigate()
  const { lines, subtotal, canCheckout, loaded, items, clear, refresh } = useCart()
  const [form, setForm] = useState({ name: '', phone: '', governorate: '', address: '', email: '', notes: '' })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  // One key per checkout attempt: repeated clicks/retries return the same order instead of a new one.
  const keyRef = useRef(crypto.randomUUID())

  if (items.length === 0) {
    return <div className="container-x py-16"><EmptyState title="Your cart is empty" action="Shop now" to="/shop" /></div>
  }
  if (!loaded) return <Spinner label="Checking prices and stock..." />

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setSubmitError(null)
    const v = validateCheckout(form)
    setErrors(v)
    if (Object.keys(v).length) return

    setSubmitting(true)
    try {
      // Re-check prices/stock first for a friendly message; the database function re-checks again authoritatively.
      const fresh = await refresh()
      if (fresh === null) throw new Error('network')
      const problem = items.find((i) => !fresh[i.id] || fresh[i.id].stock_quantity < i.quantity)
      if (problem) {
        setSubmitError('Some items are unavailable or exceed the available stock. Please review your cart.')
        return
      }

      const { data, error } = await supabase.rpc('create_order', {
        p_idempotency_key: keyRef.current,
        p_customer_name: form.name,
        p_customer_phone: cleanPhone(form.phone),
        p_customer_email: form.email.trim() || null,
        p_governorate: form.governorate,
        p_delivery_address: form.address,
        p_notes: form.notes.trim() || null,
        p_items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
      })
      if (error) throw error

      // Saved in the database. Keep a copy for the confirmation page (customers cannot read orders back).
      sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify({
        order: data,
        customer: { name: form.name.trim(), phone: cleanPhone(form.phone), governorate: form.governorate, address: form.address.trim() },
      }))
      keyRef.current = crypto.randomUUID()
      navigate('/order-confirmed', { replace: true })
      clear()
    } catch (err) {
      setSubmitError(friendlyError(err))
      refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container-x py-12">
      <h1 className="text-4xl sm:text-5xl">Checkout</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px]">
        <form onSubmit={submit} noValidate className="space-y-5">
          <Field id="name" label="Full name *" error={errors.name}>
            <input id="name" className="field" autoComplete="name" value={form.name} onChange={set('name')} />
          </Field>
          <Field id="phone" label="Mobile number *" error={errors.phone}>
            <input id="phone" className="field" type="tel" inputMode="tel" autoComplete="tel" placeholder="01012345678" value={form.phone} onChange={set('phone')} />
          </Field>
          <Field id="gov" label="Governorate *" error={errors.governorate}>
            <select id="gov" className="field" value={form.governorate} onChange={set('governorate')}>
              <option value="">Select governorate</option>
              {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <Field id="address" label="Detailed delivery address *" error={errors.address}>
            <textarea id="address" rows={3} className="field" autoComplete="street-address" value={form.address} onChange={set('address')} />
          </Field>
          <Field id="email" label="Email (optional)" error={errors.email}>
            <input id="email" className="field" type="email" autoComplete="email" value={form.email} onChange={set('email')} />
          </Field>
          <Field id="notes" label="Order notes (optional)">
            <textarea id="notes" rows={2} className="field" value={form.notes} onChange={set('notes')} />
          </Field>

          <div className="border border-line bg-charcoal p-4 text-sm">
            <p className="text-ivory">Payment method: <span className="text-gold">Cash on delivery</span></p>
          </div>

          {submitError && <div className="border border-red-400/40 bg-charcoal p-4 text-sm text-red-300" role="alert">{submitError}</div>}
          {!canCheckout && !submitError && (
            <p className="text-sm text-red-400">Some items in your cart need attention. <Link to="/cart" className="underline">Review cart</Link></p>
          )}

          <button type="submit" className="btn-gold w-full" disabled={submitting || !canCheckout}>
            {submitting ? 'Placing order...' : 'Place order'}
          </button>
        </form>

        <aside className="h-fit border border-line bg-charcoal p-6">
          <h2 className="text-2xl">Order summary</h2>
          <ul className="mt-5 space-y-3 text-sm">
            {lines.map((l) => (
              <li key={l.id} className="flex justify-between gap-3">
                <span>{l.product?.name ?? 'Unavailable'} <span className="text-muted">x{l.quantity}</span></span>
                <span className="text-muted">{l.product ? formatEGP(Number(l.product.price) * l.quantity) : '-'}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex justify-between border-t border-line pt-4"><span>Subtotal</span><span className="text-gold">{formatEGP(subtotal)}</span></div>
          <p className="mt-3 text-xs text-muted">The final total is calculated by the store's database when you place the order.</p>
        </aside>
      </div>
    </div>
  )
}
