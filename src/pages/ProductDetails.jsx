import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { pick, stockInfo } from '../lib/products'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useLang } from '../i18n/LanguageContext'
import { trackEvent } from '../lib/analytics'
import ProductImage from '../components/shop/ProductImage'
import Price from '../components/shop/Price'
import StockBadge from '../components/shop/StockBadge'
import QuantitySelector from '../components/ui/QuantitySelector'
import Spinner from '../components/ui/Spinner'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'

export default function ProductDetails() {
  const { id } = useParams()
  const { add } = useCart()
  const toast = useToast()
  const { t, lang } = useLang()
  const [state, setState] = useState({ product: null, loading: true, error: null })
  const [qty, setQty] = useState(1)

  const load = async () => {
    if (!supabase) return setState({ product: null, loading: false, error: 'not_connected' })
    setState({ product: null, loading: true, error: null })
    // RLS: inactive or unknown ids simply return no row
    const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle()
    if (error) setState({ product: null, loading: false, error: 'load_product' })
    else {
      setState({ product: data, loading: false, error: null })
      if (data) trackEvent('product_view', { productId: data.id })
    }
  }
  useEffect(() => { load(); setQty(1) }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const { product, loading, error } = state
  if (loading) return <Spinner />
  if (error) return <div className="container-x py-16"><ErrorState message={t(`err.${error}`)} onRetry={load} /></div>
  if (!product) return <div className="container-x py-16"><EmptyState title={t('product.notFound.title')} text={t('product.notFound.text')} action={t('product.back')} to="/shop" /></div>

  const stock = stockInfo(product)
  const description = pick(product, 'description', lang)
  const specs = [
    product.volume_ml && [t('product.volume'), t('product.ml', { n: product.volume_ml })],
    product.category && [t('product.category'), pick(product, 'category', lang)],
  ].filter(Boolean)

  const handleAdd = () => {
    const r = add(product, qty)
    toast(r.message, r.ok ? 'success' : 'error')
    if (r.ok) trackEvent('add_to_cart', { productId: product.id })
  }

  return (
    <div className="container-x py-10">
      <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-medium text-forest hover:text-forest-hover"><ArrowLeft size={14} className="rtl:-scale-x-100" /> {t('product.back')}</Link>
      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <div className="rounded-3xl border border-line bg-paper p-3 shadow-card">
          <ProductImage product={product} className={`rounded-2xl ${stock.ok ? '' : 'opacity-60 saturate-50'}`} />
        </div>
        <div>
          {product.brand && <p className="eyebrow">{product.brand}</p>}
          <h1 className="mt-2 text-4xl text-forest sm:text-5xl">{pick(product, 'name', lang)}</h1>
          <div className="mt-5"><Price product={product} large /></div>
          <StockBadge product={product} className="mt-3 text-sm" />

          {description && <p className="mt-8 whitespace-pre-line leading-relaxed text-ink/85">{description}</p>}

          {specs.length > 0 && (
            <dl className="mt-8 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-paper text-sm">
              {specs.map(([k, v]) => (
                <div key={k} className="flex justify-between px-4 py-3"><dt className="text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>
              ))}
            </dl>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            {stock.ok && <QuantitySelector value={qty} max={product.stock_quantity} onChange={setQty} />}
            <button className="btn-primary flex-1 sm:flex-none" disabled={!stock.ok} onClick={handleAdd}>
              <ShoppingBag size={16} /> {stock.ok ? t('product.add') : t('stock.out')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
