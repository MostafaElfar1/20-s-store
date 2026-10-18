import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useLang } from '../i18n/LanguageContext'
import { pick } from '../lib/products'
import ProductImage from '../components/shop/ProductImage'
import QuantitySelector from '../components/ui/QuantitySelector'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import Spinner from '../components/ui/Spinner'

export default function Cart() {
  const { lines, subtotal, canCheckout, loaded, loadError, setQty, remove, refresh } = useCart()
  const { t, lang, money } = useLang()

  if (lines.length === 0) {
    return <div className="container-x py-16"><EmptyState title={t('cart.empty.title')} text={t('cart.empty.text')} action={t('cart.shopNow')} to="/shop" /></div>
  }
  if (!loaded) return <Spinner label={t('cart.checking')} />

  return (
    <div className="container-x py-12">
      <h1 className="text-4xl text-forest sm:text-5xl">{t('cart.title')}</h1>
      {loadError && <div className="mt-6"><ErrorState message={t(`err.${loadError}`)} onRetry={refresh} /></div>}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <ul className="space-y-4">
          {lines.map((l) => {
            const name = l.product ? pick(l.product, 'name', lang) : t('cart.unavailableName')
            return (
              <li key={l.key} className="flex gap-4 rounded-2xl border border-line bg-paper p-3 shadow-card sm:p-4">
                <div className="w-24 shrink-0">
                  {l.product ? <ProductImage product={l.product} className="rounded-xl" /> : <div className="aspect-[4/5] rounded-xl bg-sage-soft" />}
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-display text-lg text-ink">{name}</p>
                      {l.variant && <p className="text-xs uppercase tracking-[0.14em] text-muted">{t('product.ml', { n: l.variant.size_ml })}</p>}
                    </div>
                    <button aria-label={t('cart.remove', { name })} onClick={() => remove(l.key)} className="h-fit rounded-full p-2 text-muted transition-colors hover:bg-sage-soft hover:text-danger"><Trash2 size={16} /></button>
                  </div>
                  {l.unavailable && <p className="text-sm text-danger">{t(l.needsSize ? 'cart.needSize' : 'cart.unavailable')}</p>}
                  {!l.unavailable && l.overStock && (
                    <p className="text-sm text-danger">{t('cart.overStock', { n: l.stock })}</p>
                  )}
                  {l.product && !l.unavailable && (
                    <div className="mt-auto flex items-center justify-between gap-3">
                      <QuantitySelector value={l.quantity} max={l.stock} onChange={(n) => setQty(l.key, n)} />
                      <div className="text-end">
                        <p className="text-xs text-muted">{t('cart.each', { price: money(l.unitPrice) })}</p>
                        <p className="font-semibold text-forest">{money(l.unitPrice * l.quantity)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>

        <aside className="h-fit rounded-2xl border border-line bg-paper p-6 shadow-card">
          <h2 className="text-2xl text-forest">{t('cart.summary')}</h2>
          <div className="mt-5 flex justify-between"><span className="text-muted">{t('cart.subtotal')}</span><span className="font-semibold text-forest">{money(subtotal)}</span></div>
          <p className="mt-3 text-xs leading-relaxed text-muted">{t('cart.payNote')}</p>
          {canCheckout
            ? <Link to="/checkout" className="btn-primary mt-6 w-full">{t('cart.checkout')}</Link>
            : <button disabled className="btn-primary mt-6 w-full">{t('cart.checkout')}</button>}
          {!canCheckout && <p className="mt-3 text-xs text-danger">{t('cart.fix')}</p>}
          <Link to="/shop" className="mt-4 block text-center text-sm font-medium text-forest hover:text-forest-hover">{t('cart.continue')}</Link>
        </aside>
      </div>
    </div>
  )
}
