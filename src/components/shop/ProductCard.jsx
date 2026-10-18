import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import ProductImage from './ProductImage'
import StockBadge from './StockBadge'
import { hasSale, pick, productCategory, stockInfo } from '../../lib/products'
import { useCart } from '../../context/CartContext'
import { useToast } from '../../context/ToastContext'
import { useLang } from '../../i18n/LanguageContext'
import { trackEvent } from '../../lib/analytics'

// Every block has a fixed height, so in a row of cards the image, category, name,
// price and stock line all sit at exactly the same level.
export default function ProductCard({ product }) {
  const { add } = useCart()
  const toast = useToast()
  const { t, lang, money } = useLang()
  const variants = product.variants || []
  const multi = variants.length > 1                      // several sizes: the customer picks on the product page
  const single = variants.length === 1 ? variants[0] : null
  const stock = stockInfo(product)
  const sale = hasSale(product)
  const off = sale ? Math.round((1 - Number(product.price) / Number(product.compare_at_price)) * 100) : 0
  const to = `/product/${product.id}`

  const handleAdd = () => {
    const r = add(product, single, 1)
    toast(r.message, r.ok ? 'success' : 'error')
    if (r.ok) trackEvent('add_to_cart', { productId: product.id })
  }
  const handleOpen = () => trackEvent('product_click', { productId: product.id })

  const round = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest text-cream transition-colors hover:bg-forest-hover'

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-lift">
      <Link to={to} onClick={handleOpen} className="relative block p-2 pb-0">
        <ProductImage product={product} className={`rounded-xl ${stock.ok ? '' : 'opacity-60 saturate-50'}`} />
        {sale && (
          <span dir="ltr" className="absolute start-4 top-4 rounded-full bg-forest px-2.5 py-1 text-[11px] font-medium text-cream">-{off}%</span>
        )}
      </Link>

      <div className="flex flex-1 flex-col px-3.5 pb-4 pt-3 sm:px-4">
        <p className="h-4 truncate text-[11px] uppercase tracking-[0.14em] text-muted">{productCategory(product, lang) || product.brand || '\u00A0'}</p>
        <h3 className="mt-1 min-h-[2.75em] text-[1.05rem] leading-snug text-ink">
          <Link to={to} onClick={handleOpen} className="line-clamp-2 hover:text-forest">{pick(product, 'name', lang)}</Link>
        </h3>

        <div className="mt-2 flex h-11 items-end justify-between gap-2">
          <div className="flex min-w-0 flex-col justify-end leading-tight">
            <span className="h-4 text-[11px] text-muted"><span className={!multi && sale ? 'line-through' : ''}>{multi ? t('product.from') : sale ? money(product.compare_at_price) : ''}</span></span>
            <span className="text-[15px] font-semibold text-forest">{money(product.price)}</span>
          </div>
          {multi && stock.ok
            ? <Link to={to} onClick={handleOpen} aria-label={t('product.chooseSize')} title={t('product.chooseSize')} className={round}><ShoppingBag size={16} /></Link>
            : <button onClick={handleAdd} disabled={!stock.ok} aria-label={t('product.add')} title={t('product.add')} className={`${round} disabled:cursor-not-allowed disabled:opacity-40`}><ShoppingBag size={16} /></button>}
        </div>

        <StockBadge product={product} className="mt-2 h-5" />
      </div>
    </article>
  )
}
