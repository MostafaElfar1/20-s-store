import { Link } from 'react-router-dom'
import { ArrowRight, MessageCircle, PackageCheck, Truck, Wallet } from 'lucide-react'
import { config } from '../lib/config'
import { categoryLabels, pick, productImageUrl } from '../lib/products'
import { useLang } from '../i18n/LanguageContext'
import { useProducts } from '../hooks/useProducts'
import ProductCard from '../components/shop/ProductCard'
import Spinner from '../components/ui/Spinner'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import { LOGO } from '../components/layout/Navbar'

const FEATURES = [
  [Wallet, 'feat.cod.t', 'feat.cod.d'],
  [Truck, 'feat.ship.t', 'feat.ship.d'],
  [PackageCheck, 'feat.stock.t', 'feat.stock.d'],
  [MessageCircle, 'feat.order.t', 'feat.order.d'],
]

function Section({ eyebrow, title, to, children }) {
  const { t } = useLang()
  return (
    <section className="container-x mt-20">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div><p className="eyebrow">{eyebrow}</p><h2 className="mt-2 text-3xl text-forest sm:text-4xl">{title}</h2></div>
        {to && (
          <Link to={to} className="inline-flex items-center gap-2 text-sm font-medium text-forest hover:text-forest-hover">
            {t('home.viewAll')} <ArrowRight size={14} className="rtl:-scale-x-100" />
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

// Arch-shaped frame (echoes the logo). Shows a real product photo, or the logo when there is none yet.
function HeroVisual({ hero, thumbs }) {
  const { lang, money } = useLang()
  const url = hero ? productImageUrl(hero.image_path) : null
  return (
    <div className="relative mx-auto w-full max-w-sm lg:max-w-md">
      <div className="absolute inset-0 rounded-b-3xl rounded-t-[999px] border border-forest/20 ltr:translate-x-3 ltr:translate-y-3 rtl:-translate-x-3 rtl:translate-y-3" aria-hidden="true" />
      <div className="relative aspect-[4/5] overflow-hidden rounded-b-3xl rounded-t-[999px] bg-forest">
        {url
          ? <img src={url} alt="" className="h-full w-full object-cover" />
          : <img src={LOGO} alt="" className="h-full w-full object-contain p-6" />}
        {hero && (
          <Link to={`/product/${hero.id}`} className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-2xl bg-paper p-3 shadow-lift sm:end-auto sm:w-64">
            <span className="min-w-0">
              <span className="block truncate text-[11px] uppercase tracking-[0.14em] text-muted">{hero.brand || '\u00A0'}</span>
              <span className="block truncate font-display text-base text-ink">{pick(hero, 'name', lang)}</span>
              <span className="block text-sm font-semibold text-forest">{money(hero.price)}</span>
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest text-cream"><ArrowRight size={16} className="rtl:-scale-x-100" /></span>
          </Link>
        )}
      </div>
      {thumbs.length > 0 && (
        <div className="absolute -end-2 top-10 hidden flex-col gap-3 sm:flex">
          {thumbs.map((p) => (
            <Link key={p.id} to={`/product/${p.id}`} className="h-16 w-16 overflow-hidden rounded-xl border-2 border-cream bg-sage-soft shadow-card transition-transform hover:scale-105" aria-label={pick(p, 'name', lang)}>
              <img src={productImageUrl(p.image_path)} alt="" className="h-full w-full object-cover" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const { t, lang, slogan } = useLang()
  const { products, loading, error, reload } = useProducts()
  const wa = config.whatsappNumber
  const featured = products.filter((p) => p.featured).slice(0, 4)
  const newest = products.slice(0, 4)
  const labels = categoryLabels(products, lang)
  const withImage = products.filter((p) => p.image_path)
  const hero = withImage.find((p) => p.featured) || withImage[0] || null
  const thumbs = withImage.filter((p) => p.id !== hero?.id).slice(0, 3)

  return (
    <>
      <section className="container-x pt-6 sm:pt-8">
        <div className="overflow-hidden rounded-[2rem] bg-sage-soft">
          <div className="grid items-center gap-12 px-6 py-12 sm:px-12 lg:grid-cols-2 lg:py-16">
            <div>
              <p className="eyebrow text-center mx-auto">{t('hero.eyebrow')}</p>
              <h1 className="mt-4 text-5xl leading-[1.08] text-forest sm:text-6xl  text-center mx-auto">{slogan}</h1>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-ink/75">{t('hero.text')}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/shop" className="btn-primary">{t('hero.cta')} <ArrowRight size={16} className="rtl:-scale-x-100" /></Link>
                {wa
                  ? <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="btn-outline"><MessageCircle size={16} /> {t('hero.whatsapp')}</a>
                  : <Link to="/policies" className="btn-outline">{t('hero.policies')}</Link>}
              </div>
            </div>
            <HeroVisual hero={hero} thumbs={thumbs} />
          </div>
        </div>
      </section>

      <section className="container-x mt-5">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
          {FEATURES.map(([Icon, title, desc]) => (
            <div key={title} className="flex items-center gap-3 bg-paper p-4">
              <span className="shrink-0 rounded-full bg-sage-soft p-2.5 text-forest"><Icon size={18} /></span>
              <div className="min-w-0"><p className="text-sm font-medium text-ink">{t(title)}</p><p className="text-xs text-muted">{t(desc)}</p></div>
            </div>
          ))}
        </div>
      </section>

      {loading && <Spinner label={t('home.loading')} />}
      {error && <div className="container-x mt-16"><ErrorState message={t(`err.${error}`)} onRetry={reload} /></div>}

      {!loading && !error && products.length === 0 && (
        <div className="container-x mt-16">
          <EmptyState title={t('home.empty.title')} text={t('home.empty.text')} />
        </div>
      )}

      {labels.size > 0 && (
        <Section eyebrow={t('home.cats.eyebrow')} title={t('home.cats.title')}>
          <div className="flex flex-wrap gap-3">
            {[...labels].map(([value, label]) => (
              <Link key={value} to={`/shop?category=${encodeURIComponent(value)}`} className="chip px-5 py-2.5 text-base hover:bg-sage-soft">{label}</Link>
            ))}
          </div>
        </Section>
      )}

      {featured.length > 0 && (
        <Section eyebrow={t('home.featured.eyebrow')} title={t('home.featured.title')} to="/shop?featured=1">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{featured.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </Section>
      )}

      {newest.length > 0 && (
        <Section eyebrow={t('home.new.eyebrow')} title={t('home.new.title')} to="/shop?sort=newest">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{newest.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </Section>
      )}

      <section className="container-x mt-24">
        <div className="grid items-center gap-8 overflow-hidden rounded-[2rem] bg-sage px-6 py-10 sm:px-12 md:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="max-w-lg text-3xl text-forest sm:text-4xl">{t('home.banner.title')}</h2>
            <p className="mt-4 max-w-md leading-relaxed text-forest/80">{t('home.banner.text', { store: config.storeName })}</p>
            <Link to="/shop" className="btn-primary mt-7">{t('home.banner.cta')} <ArrowRight size={16} className="rtl:-scale-x-100" /></Link>
          </div>
          <img src={LOGO} alt="" className="mx-auto w-44 sm:w-56" />
        </div>
      </section>

      {wa && (
        <section className="container-x mt-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-paper p-6 shadow-card">
            <div>
              <h3 className="text-xl text-forest">{t('home.wa.title')}</h3>
              <p className="mt-1 text-sm text-muted">{t('home.wa.text')}</p>
            </div>
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="btn-primary"><MessageCircle size={16} /> {t('hero.whatsapp')}</a>
          </div>
        </section>
      )}
    </>
  )
}
