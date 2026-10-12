import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import ProductImage from './ProductImage'
import Price from './Price'
import { stockInfo } from '../../lib/products'
import { useCart } from '../../context/CartContext'
import { useToast } from '../../context/ToastContext'

export default function ProductCard({ product }) {
  const { add } = useCart()
  const toast = useToast()
  const stock = stockInfo(product)

  const handleAdd = () => {
    const r = add(product, 1)
    toast(r.message, r.ok ? 'success' : 'error')
  }

  return (
    <article className="group flex flex-col border border-line bg-moss transition-colors hover:border-sage/60">
      <Link to={`/product/${product.id}`} className="block p-3 pb-0">
        <ProductImage product={product} />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.brand && <p className="text-xs uppercase tracking-widest text-muted">{product.brand}</p>}
        <h3 className="text-lg leading-snug">{product.name}</h3>
        <Price product={product} />
        <p className={`text-xs ${stock.ok ? 'text-muted' : 'text-red-400'}`}>{stock.label}</p>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
          <Link to={`/product/${product.id}`} className="btn-outline px-3">Details</Link>
          <button onClick={handleAdd} disabled={!stock.ok} className="btn-primary px-3">
            <ShoppingBag size={14} /> Add
          </button>
        </div>
      </div>
    </article>
  )
}
