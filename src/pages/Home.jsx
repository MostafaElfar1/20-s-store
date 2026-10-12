import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { config } from '../lib/config'
import { useProducts } from '../hooks/useProducts'
import ProductCard from '../components/shop/ProductCard'
import Spinner from '../components/ui/Spinner'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'

function Section({ eyebrow, title, to, children }) {
  return (
    <section className="container-x mt-20">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div><p className="eyebrow">{eyebrow}</p><h2 className="mt-2 text-3xl sm:text-4xl">{title}</h2></div>
        {to && <Link to={to} className="hidden items-center gap-2 text-xs uppercase tracking-widest text-sage hover:text-sage-hover sm:inline-flex">View all <ArrowRight size={14} /></Link>}
      </div>
      {children}
    </section>
  )
}

export default function Home() {
  const { products, loading, error, reload } = useProducts()
  const featured = products.filter((p) => p.featured).slice(0, 4)
  const newest = products.slice(0, 4)
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))]

  return (
    <>
      <section className="border-b border-line bg-gradient-to-b from-moss/60 to-forest">
        <div className="container-x grid min-h-[68vh] items-center gap-10 py-16 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="eyebrow">{config.storeName} Fragrances</p>
            <h1 className="mt-5 max-w-3xl text-5xl leading-[1.1] sm:text-7xl">{config.slogan}</h1>
            <p className="mt-6 max-w-xl text-lg text-muted">
              A fragrance boutique for the decade of firsts. Find the scent that goes with you everywhere.
            </p>
            <div className="mt-10"><Link to="/shop" className="btn-primary">Shop now <ArrowRight size={14} /></Link></div>
          </div>
          <img
            src={`${import.meta.env.BASE_URL}icon.png`}
            alt=""
            aria-hidden="true"
            className="mx-auto hidden w-full max-w-sm drop-shadow-[0_24px_40px_rgba(0,0,0,0.45)] lg:block"
          />
        </div>
      </section>

      {loading && <Spinner label="Loading the collection..." />}
      {error && <div className="container-x mt-16"><ErrorState message={error} onRetry={reload} /></div>}

      {!loading && !error && products.length === 0 && (
        <div className="container-x mt-16">
          <EmptyState title="The collection is being prepared" text="No fragrances are available right now. Please check back soon." />
        </div>
      )}

      {categories.length > 0 && (
        <Section eyebrow="Explore" title="Shop by category">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {categories.map((c) => (
              <Link key={c} to={`/shop?category=${encodeURIComponent(c)}`}
                className="border border-line px-4 py-8 text-center font-display text-xl transition-colors hover:border-sage hover:text-sage">{c}</Link>
            ))}
          </div>
        </Section>
      )}

      {featured.length > 0 && (
        <Section eyebrow="Handpicked" title="Featured" to="/shop?featured=1">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{featured.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </Section>
      )}

      {newest.length > 0 && (
        <Section eyebrow="Just in" title="New arrivals" to="/shop?sort=newest">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{newest.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </Section>
      )}

      <section className="container-x mt-24">
        <div className="border border-line bg-moss px-6 py-14 text-center sm:px-16">
          <p className="eyebrow">The idea</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl sm:text-4xl">Your twenties deserve a signature scent.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-muted">
            {config.storeName} is a small independent fragrance store. We keep the collection simple, so choosing is easy and ordering takes a minute.
          </p>
        </div>
      </section>
    </>
  )
}
