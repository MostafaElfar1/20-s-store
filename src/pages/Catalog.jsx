import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useProducts } from '../hooks/useProducts'
import ProductCard from '../components/shop/ProductCard'
import Spinner from '../components/ui/Spinner'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'

const PAGE = 12

export default function Catalog() {
  const { products, loading, error, reload } = useProducts()
  const [params, setParams] = useSearchParams()
  const [visible, setVisible] = useState(PAGE)

  const q = params.get('q') || ''
  const category = params.get('category') || ''
  const sort = params.get('sort') || 'newest'
  const featuredOnly = params.get('featured') === '1'

  const update = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    setParams(next, { replace: true })
    setVisible(PAGE)
  }

  const categories = useMemo(() => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(), [products])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    let list = products.filter((p) =>
      (!term || p.name.toLowerCase().includes(term) || (p.brand || '').toLowerCase().includes(term)) &&
      (!category || p.category === category) &&
      (!featuredOnly || p.featured))
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price)
    else if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    else list = [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return list
  }, [products, q, category, sort, featuredOnly])

  return (
    <div className="container-x py-12">
      <p className="eyebrow">The collection</p>
      <h1 className="mt-2 text-4xl sm:text-5xl">Shop</h1>

      <div className="mt-8 grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <label className="relative block">
          <span className="sr-only">Search by name or brand</span>
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input className="field pl-11" placeholder="Search by name or brand" value={q} onChange={(e) => update('q', e.target.value)} />
        </label>
        <select aria-label="Category" className="field md:w-52" value={category} onChange={(e) => update('category', e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select aria-label="Sort" className="field md:w-52" value={sort} onChange={(e) => update('sort', e.target.value)}>
          <option value="newest">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </div>
      <label className="mt-4 inline-flex cursor-pointer items-center gap-2 text-sm text-muted">
        <input type="checkbox" className="accent-[#C6A15B]" checked={featuredOnly} onChange={(e) => update('featured', e.target.checked ? '1' : '')} />
        Featured only
      </label>

      <div className="mt-8">
        {loading && <Spinner />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {!loading && !error && products.length === 0 && (
          <EmptyState title="No fragrances yet" text="The collection is being prepared. Please check back soon." />
        )}
        {!loading && !error && products.length > 0 && filtered.length === 0 && (
          <EmptyState title="No matches" text="Try a different search or clear the filters."
            action="Clear filters" onAction={() => { setParams({}, { replace: true }) }} />
        )}
        {filtered.length > 0 && (
          <>
            <p className="mb-4 text-sm text-muted">{filtered.length} {filtered.length === 1 ? 'fragrance' : 'fragrances'}</p>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {filtered.slice(0, visible).map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
            {visible < filtered.length && (
              <div className="mt-10 text-center"><button className="btn-outline" onClick={() => setVisible((v) => v + PAGE)}>Load more</button></div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
