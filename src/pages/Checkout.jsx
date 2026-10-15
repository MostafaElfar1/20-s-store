import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import { useLang } from '../i18n/LanguageContext'
import { pick } from '../lib/products'
import { GOVERNORATES, GOVERNORATES_AR, cleanPhone, validateCheckout } from '../lib/validators'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'

export const LAST_ORDER_KEY = 'twenties_last_order'

// Turns the database exception text into a translation key (+ values) a customer can read.
function friendlyError(err, t) {
  const m = err?.message || ''
  if (m.includes('INSUFFICIENT_STOCK')) return t('checkout.fail.stock', { name: m.split('INSUFFICIENT_STOCK:')[1]?.trim() })
  if (m.includes('PRODUCT_UNAVAILABLE')) return t('checkout.fail.unavailable')
  if (m.includes('INVALID_PHONE')) return t('checkout.fail.phone')
  if (m.includes('INVALID_')) return t('checkout.fail.invalid')
  if (/fetch|network/i.test(m)) return t('checkout.fail.network')
  return t('checkout.fail.generic')
}

// Defined at module level on purpose: a component created inside another component is a
// brand-new component on every render, which remounts the input and drops focus after each key.
const Field = ({ id, label, error, children }) => (
  <div>
    <label htmlFor={id} className="mb-2 block text-sm font-medium text-forest">{label}</label>
    {children}
    {error && <p className="mt-1 text-sm text-danger" role="alert">{error}</p>}
  </div>
)

export default function Checkout() {
  const navigate = useNavigate()
  const { t, lang, money } = useLang()
  const { lines, subtotal, canCheckout, loaded, items, clear, refresh } = useCart()
  const [form, setForm] = useState({ name: '', phone: '', governorate: '', address: '', email: '', notes: '' })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  // One key per checkout attempt: repeated clicks/retries return the same order instead of a new one.
  const keyRef = useRef(crypto.randomUUID())

  if (items.length === 0) {
    return <div className="container-x py-16"><EmptyState title={t('cart.empty.title')} action={t('cart.shopNow')} to="/shop" /></div>
  }
  if (!loaded) return <Spinner label={t('cart.checking')} />

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setSubmitError(null)
    const v = validateCheckout(form)
    setErrors(Object.fromEntries(Object.entries(v).map(([k, code]) => [k, t(`checkout.err.${code}`)])))
    if (Object.keys(v).length) return

    setSubmitting(true)
    try {
      // Re-check prices/stock first for a friendly message; the database function re-checks again authoritatively.
      const fresh = await refresh()
      if (fresh === null) throw new Error('network')
      const problem = items.find((i) => !fresh[i.id] || fresh[i.id].stock_quantity < i.quantity)
      if (problem) {
        setSubmitError(t('checkout.fail.review'))
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
      setSubmitError(friendlyError(err, t))
      refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container-x py-12">
      <h1 className="text-4xl text-forest sm:text-5xl">{t('checkout.title')}</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px]">
        <form onSubmit={submit} noValidate className="space-y-5">
          <Field id="name" label={t('checkout.name')} error={errors.name}>
            <input id="name" className="field" autoComplete="name" value={form.name} onChange={set('name')} />
          </Field>
          <Field id="phone" label={t('checkout.phone')} error={errors.phone}>
            <input id="phone" className="field" type="tel" inputMode="tel" autoComplete="tel" placeholder="01012345678" value={form.phone} onChange={set('phone')} />
          </Field>
          <Field id="gov" label={t('checkout.gov')} error={errors.governorate}>
            <select id="gov" className="field" value={form.governorate} onChange={set('governorate')}>
              <option value="">{t('checkout.selectGov')}</option>
              {GOVERNORATES.map((g) => <option key={g} value={g}>{lang === 'ar' ? GOVERNORATES_AR[g] : g}</option>)}
            </select>
          </Field>
          <Field id="address" label={t('checkout.address')} error={errors.address}>
            <textarea id="address" rows={3} className="field" autoComplete="street-address" value={form.address} onChange={set('address')} />
          </Field>
          <Field id="email" label={t('checkout.email')} error={errors.email}>
            <input id="email" className="field" type="email" autoComplete="email" value={form.email} onChange={set('email')} />
          </Field>
          <Field id="notes" label={t('checkout.notes')}>
            <textarea id="notes" rows={2} className="field" value={form.notes} onChange={set('notes')} />
          </Field>

          <div className="rounded-xl border border-line bg-paper p-4 text-sm">
            <p className="text-ink">{t('checkout.payment')} <span className="font-medium text-forest">{t('checkout.cod')}</span></p>
          </div>

          {submitError && <div className="rounded-xl border border-danger/40 bg-paper p-4 text-sm text-danger" role="alert">{submitError}</div>}
          {!canCheckout && !submitError && (
            <p className="text-sm text-danger">{t('checkout.review')} <Link to="/cart" className="underline">{t('checkout.reviewCart')}</Link></p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={submitting || !canCheckout}>
            {submitting ? t('checkout.placing') : t('checkout.place')}
          </button>
        </form>

        <aside className="h-fit rounded-2xl border border-line bg-paper p-6 shadow-card">
          <h2 className="text-2xl text-forest">{t('checkout.summary')}</h2>
          <ul className="mt-5 space-y-3 text-sm">
            {lines.map((l) => (
              <li key={l.id} className="flex justify-between gap-3">
                <span>{l.product ? pick(l.product, 'name', lang) : t('checkout.unavailable')} <span className="text-muted">x{l.quantity}</span></span>
                <span className="text-muted">{l.product ? money(Number(l.product.price) * l.quantity) : '-'}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex justify-between border-t border-line pt-4"><span>{t('cart.subtotal')}</span><span className="font-semibold text-forest">{money(subtotal)}</span></div>
          <p className="mt-3 text-xs leading-relaxed text-muted">{t('checkout.totalNote')}</p>
        </aside>
      </div>
    </div>
  )
}
