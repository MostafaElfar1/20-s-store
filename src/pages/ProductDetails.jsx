import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { stockInfo } from '../lib/products'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import ProductImage from '../components/shop/ProductImage'
import Price from '../components/shop/Price'
import QuantitySelector from '../components/ui/QuantitySelector'
import Spinner from '../components/ui/Spinner'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'

export default function ProductDetails() {
  const { id } = useParams()
  const { add } = useCart()
  const toast = useToast()
  const [state, setState] = useState({ product: null, loading: true, error: null })
  const [qty, setQty] = useState(1)

  const load = async () => {
    if (!supabase) return setState({ product: null, loading: false, error: 'The store is not connected to Supabase yet.' })
    setState({ product: null, loading: true, error: null })
    // RLS: inactive or unknown ids simply return no row
    const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle()
    if (error) setState({ product: null, loading: false, error: 'Could not load this product. Please try again.' })
    else setState({ product: data, loading: false, error: null })
  }
  useEffect(() => { load(); setQty(1) }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const { product, loading, error } = state
  if (loading) return <Spinner />
  if (error) return <div className="container-x py-16"><ErrorState message={error} onRetry={load} /></div>
  if (!product) return <div className="container-x py-16"><EmptyState title="Product not found" text="This fragrance is no longer available." action="Back to shop" to="/shop" /></div>

  const stock = stockInfo(product)
  const specs = [
    product.volume_ml && ['Volume', `${product.volume_ml} ml`],
    product.category && ['Category', product.category],
  ].filter(Boolean)

  const handleAdd = () => {
    const r = add(product, qty)
    toast(r.message, r.ok ? 'success' : 'error')
  }

  return (
    <div className="container-x py-10">
      <Link to="/shop" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted hover:text-gold"><ArrowLeft size={14} /> Back to shop</Link>
      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <ProductImage product={product} className="border border-line" />
        <div>
          {product.brand && <p className="eyebrow">{product.brand}</p>}
          <h1 className="mt-2 text-4xl sm:text-5xl">{product.name}</h1>
          <div className="mt-5"><Price product={product} large /></div>
          <p className={`mt-3 text-sm ${stock.ok ? 'text-muted' : 'text-red-400'}`}>{stock.label}</p>

          {product.description && <p className="mt-8 whitespace-pre-line leading-relaxed text-ivory/90">{product.description}</p>}

          {specs.length > 0 && (
            <dl className="mt-8 divide-y divide-line border-y border-line text-sm">
              {specs.map(([k, v]) => (
                <div key={k} className="flex justify-between py-3"><dt className="text-muted">{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            {stock.ok && <QuantitySelector value={qty} max={product.stock_quantity} onChange={setQty} />}
            <button className="btn-gold flex-1 sm:flex-none" disabled={!stock.ok} onClick={handleAdd}>
              <ShoppingBag size={14} /> {stock.ok ? 'Add to cart' : 'Out of stock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
