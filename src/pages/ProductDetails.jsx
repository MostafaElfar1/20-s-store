import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PRODUCT_SELECT, normalizeProduct, pick, productCategory, relatedProducts, stockInfo } from '../lib/products'
import { occasionLabel } from '../lib/catalogOptions'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useLang } from '../i18n/LanguageContext'
import { trackEvent } from '../lib/analytics'
import { useProducts } from '../hooks/useProducts'
import ProductCard from '../components/shop/ProductCard'
import ProductImage from '../components/shop/ProductImage'
import Price from '../components/shop/Price'
import StockBadge from '../components/shop/StockBadge'
import Accordion from '../components/shop/Accordion'
import NotesList, { hasNotes } from '../components/shop/NotesList'
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
  const [sizeId, setSizeId] = useState(null)
  const [qty, setQty] = useState(1)

  const load = async () => {
    if (!supabase) return setState({ product: null, loading: false, error: 'not_connected' })
    setState({ product: null, loading: true, error: null })
    // RLS: inactive or unknown ids simply return no row
    const { data, error } = await supabase.from('products').select(PRODUCT_SELECT).eq('id', id).maybeSingle()
    if (error) return setState({ product: null, loading: false, error: 'load_product' })
    const product = data ? normalizeProduct(data) : null
    // start on the first size that is in stock (or the first size when everything is sold out)
    setSizeId((product?.variants.find((v) => v.stock_quantity > 0) || product?.variants[0])?.id ?? null)
    setState({ product, loading: false, error: null })
    if (product) trackEvent('product_view', { productId: product.id })
  }
  useEffect(() => { load(); setQty(1) }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const { product, loading, error } = state
  const { products: all } = useProducts() // for "You may also like"
  const related = useMemo(() => (product ? relatedProducts(product, all, 4) : []), [product, all])
  if (loading) return <Spinner />
  if (error) return <div className="container-x py-16"><ErrorState message={t(`err.${error}`)} onRetry={load} /></div>
  if (!product) return <div className="container-x py-16"><EmptyState title={t('product.notFound.title')} text={t('product.notFound.text')} action={t('product.back')} to="/shop" /></div>

  const variants = product.variants
  const variant = variants.find((v) => v.id === sizeId) || variants[0] || null
  const buying = variant || product                 // price and stock of the selected size
  const stock = stockInfo(buying)
  const description = pick(product, 'description', lang)
  const usage = pick(product, 'usage', lang)
  const occasions = product.occasions || []
  const eyebrow = productCategory(product, lang) || product.brand

  const handleAdd = () => {
    const r = add(product, variant, qty)
    toast(r.message, r.ok ? 'success' : 'error')
    if (r.ok) trackEvent('add_to_cart', { productId: product.id })
  }

  return (
    <div className="container-x py-10">
      <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-medium text-forest hover:text-forest-hover"><ArrowLeft size={14} className="rtl:-scale-x-100" /> {t('product.back')}</Link>
      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <div className="h-fit rounded-3xl border border-line bg-paper p-3 shadow-card">
          <ProductImage product={product} className={`rounded-2xl ${product.stock_quantity > 0 ? '' : 'opacity-60 saturate-50'}`} />
        </div>

        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="mt-2 text-4xl text-forest sm:text-5xl">{pick(product, 'name', lang)}</h1>
          <div className="mt-5"><Price product={buying} large /></div>
          <StockBadge product={buying} className="mt-3 text-sm" />

          {variants.length > 0 && (
            <div className="mt-7">
              <p className="mb-2 text-sm font-medium text-forest">{t('product.size')}</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('product.size')}>
                {variants.map((v) => {
                  const on = v.id === variant.id
                  return (
                    <button key={v.id} type="button" role="radio" aria-checked={on} onClick={() => { setSizeId(v.id); setQty(1) }}
                      className={`chip rounded-xl px-5 py-2.5 ${on ? 'chip-on' : ''} ${v.stock_quantity <= 0 ? 'opacity-50' : ''}`}>
                      <span className={v.stock_quantity <= 0 ? 'line-through' : ''}>{t('product.ml', { n: v.size_ml })}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            {stock.ok && <QuantitySelector value={qty} max={buying.stock_quantity} onChange={setQty} />}
            <button className="btn-primary flex-1 sm:flex-none" disabled={!stock.ok} onClick={handleAdd}>
              <ShoppingBag size={16} /> {stock.ok ? t('product.add') : t('stock.out')}
            </button>
          </div>

          <div className="mt-10 border-t border-forest/20">
            {description && (
              <Accordion title={t('product.acc.description')}>
                <p className="whitespace-pre-line leading-relaxed text-ink/85">{description}</p>
              </Accordion>
            )}
            {hasNotes(product) && (
              <Accordion title={t('product.acc.notes')}><NotesList product={product} /></Accordion>
            )}
            {(occasions.length > 0 || usage) && (
              <Accordion title={t('product.acc.use')}>
                {occasions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {occasions.map((k) => <span key={k} className="rounded-full bg-sage-soft px-3 py-1 text-sm text-ink">{occasionLabel(k, lang)}</span>)}
                  </div>
                )}
                {usage && <p className={`whitespace-pre-line leading-relaxed text-ink/85 ${occasions.length ? 'mt-4' : ''}`}>{usage}</p>}
              </Accordion>
            )}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20 border-t border-forest/20 pt-12">
          <h2 className="text-3xl text-forest sm:text-4xl">{t('product.related')}</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  )
}
