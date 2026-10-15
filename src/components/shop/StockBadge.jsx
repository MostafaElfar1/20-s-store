import { stockInfo } from '../../lib/products'
import { useLang } from '../../i18n/LanguageContext'

const DOT = { in: 'bg-emerald-600', low: 'bg-amber-500', out: 'bg-danger' }

// "In stock" / "Only 3 left" / "Out of stock"
export default function StockBadge({ product, className = '' }) {
  const { t } = useLang()
  const s = stockInfo(product)
  const label = s.state === 'low' ? t('stock.low', { n: s.count }) : t(s.state === 'in' ? 'stock.in' : 'stock.out')
  return (
    <p className={`flex items-center gap-1.5 text-xs ${s.state === 'out' ? 'text-danger' : 'text-muted'} ${className}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT[s.state]}`} aria-hidden="true" />{label}
    </p>
  )
}
