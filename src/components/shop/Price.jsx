import { formatEGP } from '../../lib/format'
import { hasSale } from '../../lib/products'
export default function Price({ product, large = false }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={`text-gold ${large ? 'text-2xl' : 'text-base'} font-medium`}>{formatEGP(product.price)}</span>
      {hasSale(product) && <span className="text-sm text-muted line-through">{formatEGP(product.compare_at_price)}</span>}
    </div>
  )
}
