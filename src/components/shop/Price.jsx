import { hasSale } from '../../lib/products'
import { useLang } from '../../i18n/LanguageContext'

export default function Price({ product, large = false }) {
  const { money } = useLang()
  return (
    <div className="flex flex-wrap items-baseline gap-x-2.5">
      <span className={`font-semibold text-forest ${large ? 'text-3xl' : 'text-base'}`}>{money(product.price)}</span>
      {hasSale(product) && <span className="text-sm text-muted line-through">{money(product.compare_at_price)}</span>}
    </div>
  )
}
