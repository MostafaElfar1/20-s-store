import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useProducts } from '../hooks/useProducts'
import { useLang } from '../i18n/LanguageContext'
import { categoryLabels } from '../lib/products'
import ProductCard from '../components/shop/ProductCard'
import Spinner from '../components/ui/Spinner'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'

const PAGE = 12

const Group = ({ title, children }) => (
  <div className="border-t border-line pt-5 first:border-0 first:pt-0">
    {title && <p className="mb-3 text-sm font-medium text-forest">{title}</p>}
    {children}
  </div>
)

export default function Catalog() {
  const { t, lang } = useLang()
  const { products, loading, error, reload } = useProducts()
  const [params, setParams] = useSearchParams()
  const [visible, setVisible] = useState(PAGE)
  const [showFilters, setShowFilters] = useState(false)

  const q = params.get('q') || ''
  const category = params.get('category') || ''
  const sort = params.get('sort') || 'newest'
  const featuredOnly = params.get('featured') === '1'
  const stock = params.get('stock') || ''                       // '' | 'in' | 'out'
  const sizes = (params.get('size') || '').split(',').filter(Boolean).map(Number)

  const update = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    setParams(next, { replace: true })
    setVisible(PAGE)
  }
  const toggleSize = (ml) => update('size', (sizes.includes(ml) ? sizes.filter((s) => s !== ml) : [...sizes, ml]).sort((a, b) => a - b).join(','))

  const labels = useMemo(() => categoryLabels(products, lang), [products, lang])
  const categories = useMemo(() => [...labels].sort((a, b) => a[1].localeCompare(b[1], lang)), [labels, lang])
  const allSizes = useMemo(() => [...new Set(products.map((p) => p.volume_ml).filter(Boolean))].sort((a, b) => a - b), [products])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    let list = products.filter((p) =>
      (!term || [p.name, p.name_ar, p.brand].some((v) => (v || '').toLowerCase().includes(term))) &&
      (!category || p.category === category) &&
      (!featuredOnly || p.featured) &&
      (!sizes.length || sizes.includes(p.volume_ml)) &&
      (stock !== 'in' || p.stock_quantity > 0) &&
      (stock !== 'out' || p.stock_quantity <= 0))
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price)
    else if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    else list = [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return list
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, q, category, sort, featuredOnly, stock, params.get('size')])

  const activeCount = [category, featuredOnly, stock, sizes.length].filter(Boolean).length
  const clearAll = () => { setParams(q ? { q } : {}, { replace: true }); setVisible(PAGE) }

  const panel = (
    <div className="space-y-5 rounded-2xl border border-line bg-paper p-5 shadow-card">
      {categories.length > 0 && (
        <Group title={t('filter.category')}>
          <select aria-label={t('filter.category')} className="field py-2.5" value={category} onChange={(e) => update('category', e.target.value)}>
            <option value="">{t('filter.allCategories')}</option>
            {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </Group>
      )}

      {allSizes.length > 0 && (
        <Group title={t('filter.size')}>
          <div className="flex flex-wrap gap-2">
            {allSizes.map((ml) => (
              <button key={ml} type="button" aria-pressed={sizes.includes(ml)} onClick={() => toggleSize(ml)}
                className={`chip ${sizes.includes(ml) ? 'chip-on' : ''}`}>{t('product.ml', { n: ml })}</button>
            ))}
          </div>
        </Group>
      )}

      <Group title={t('filter.availability')}>
        <div className="flex flex-wrap gap-2">
          {[['', 'filter.all'], ['in', 'filter.inStock'], ['out', 'filter.outOfStock']].map(([v, key]) => (
            <button key={v} type="button" aria-pressed={stock === v} onClick={() => update('stock', v)}
              className={`chip ${stock === v ? 'chip-on' : ''}`}>{t(key)}</button>
          ))}
        </div>
      </Group>

      <Group>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink">
          <input type="checkbox" className="h-4 w-4 accent-[#103C21]" checked={featuredOnly} onChange={(e) => update('featured', e.target.checked ? '1' : '')} />
          {t('filter.featured')}
        </label>
      </Group>

      {activeCount > 0 && <button type="button" onClick={clearAll} className="text-sm font-medium text-forest underline underline-offset-4">{t('filter.clear')}</button>}
    </div>
  )

  return (
    <div className="container-x py-12">
      <p className="eyebrow">{t('catalog.eyebrow')}</p>
      <h1 className="mt-2 text-4xl text-forest sm:text-5xl">{t('catalog.title')}</h1>

      <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <label className="relative block">
          <span className="sr-only">{t('catalog.search')}</span>
          <Search size={16} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-muted" />
          <input className="field ps-11" placeholder={t('catalog.search')} value={q} onChange={(e) => update('q', e.target.value)} />
        </label>
        <select aria-label={t('sort.label')} className="field sm:w-56" value={sort} onChange={(e) => update('sort', e.target.value)}>
          <option value="newest">{t('sort.newest')}</option>
          <option value="price-asc">{t('sort.priceAsc')}</option>
          <option value="price-desc">{t('sort.priceDesc')}</option>
        </select>
        <button type="button" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}
          className="btn-outline lg:hidden"><SlidersHorizontal size={16} /> {t('filter.title')}{activeCount > 0 ? ` (${activeCount})` : ''}</button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[250px_1fr]">
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
          <div className="lg:sticky lg:top-24">{panel}</div>
        </aside>

        <div>
          {loading && <Spinner />}
          {error && <ErrorState message={t(`err.${error}`)} onRetry={reload} />}
          {!loading && !error && products.length === 0 && (
            <EmptyState title={t('catalog.empty.title')} text={t('catalog.empty.text')} />
          )}
          {!loading && !error && products.length > 0 && filtered.length === 0 && (
            <EmptyState title={t('catalog.noMatch.title')} text={t('catalog.noMatch.text')}
              action={t('filter.clear')} onAction={clearAll} />
          )}
          {filtered.length > 0 && (
            <>
              <p className="mb-4 text-sm text-muted">{t('catalog.count', { n: filtered.length })}</p>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {filtered.slice(0, visible).map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              {visible < filtered.length && (
                <div className="mt-10 text-center"><button className="btn-outline" onClick={() => setVisible((v) => v + PAGE)}>{t('catalog.loadMore')}</button></div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
