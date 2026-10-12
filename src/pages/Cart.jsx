import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { formatEGP } from '../lib/format'
import ProductImage from '../components/shop/ProductImage'
import QuantitySelector from '../components/ui/QuantitySelector'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import Spinner from '../components/ui/Spinner'

export default function Cart() {
  const { lines, subtotal, canCheckout, loaded, loadError, setQty, remove, refresh } = useCart()

  if (lines.length === 0) {
    return <div className="container-x py-16"><EmptyState title="Your cart is empty" text="Browse the collection and add a fragrance you like." action="Shop now" to="/shop" /></div>
  }
  if (!loaded) return <Spinner label="Checking prices and stock..." />

  return (
    <div className="container-x py-12">
      <h1 className="text-4xl sm:text-5xl">Your cart</h1>
      {loadError && <div className="mt-6"><ErrorState message={loadError} onRetry={refresh} /></div>}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px]">
        <ul className="divide-y divide-line border-y border-line">
          {lines.map((l) => (
            <li key={l.id} className="flex gap-4 py-5">
              <div className="w-24 shrink-0">
                {l.product ? <ProductImage product={l.product} /> : <div className="aspect-[4/5] bg-charcoal" />}
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-display text-lg">{l.product?.name ?? 'Unavailable product'}</p>
                    {l.product?.brand && <p className="text-xs uppercase tracking-widest text-muted">{l.product.brand}</p>}
                  </div>
                  <button aria-label={`Remove ${l.product?.name ?? 'item'}`} onClick={() => remove(l.id)} className="h-fit p-1 text-muted hover:text-red-400"><Trash2 size={16} /></button>
                </div>
                {l.unavailable && <p className="text-sm text-red-400">This product is no longer available. Please remove it to continue.</p>}
                {!l.unavailable && l.overStock && (
                  <p className="text-sm text-red-400">Only {l.product.stock_quantity} left. Reduce the quantity to continue.</p>
                )}
                {l.product && !l.unavailable && (
                  <div className="mt-auto flex items-center justify-between">
                    <QuantitySelector value={l.quantity} max={l.product.stock_quantity} onChange={(n) => setQty(l.id, n)} />
                    <div className="text-right">
                      <p className="text-xs text-muted">{formatEGP(l.product.price)} each</p>
                      <p className="text-gold">{formatEGP(Number(l.product.price) * l.quantity)}</p>
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit border border-line bg-charcoal p-6">
          <h2 className="text-2xl">Summary</h2>
          <div className="mt-5 flex justify-between"><span className="text-muted">Subtotal</span><span className="text-gold">{formatEGP(subtotal)}</span></div>
          <p className="mt-3 text-xs text-muted">Payment: cash on delivery. Final prices are confirmed when you place the order.</p>
          {canCheckout
            ? <Link to="/checkout" className="btn-gold mt-6 w-full">Checkout</Link>
            : <button disabled className="btn-gold mt-6 w-full">Checkout</button>}
          {!canCheckout && <p className="mt-3 text-xs text-red-400">Fix the items above to continue.</p>}
          <Link to="/shop" className="mt-4 block text-center text-xs uppercase tracking-widest text-muted hover:text-gold">Continue shopping</Link>
        </aside>
      </div>
    </div>
  )
}
