import { Droplet } from 'lucide-react'
import { productImageUrl } from '../../lib/products'

// Consistent 4:5 ratio. Falls back to an icon tile when no image is set (never a broken image).
export default function ProductImage({ product, className = '' }) {
  const url = productImageUrl(product.image_path)
  const alt = `${product.name}${product.brand ? ` by ${product.brand}` : ''}${product.volume_ml ? `, ${product.volume_ml} ml` : ''} perfume bottle`
  return (
    <div className={`aspect-[4/5] w-full overflow-hidden rounded-t-full bg-forest ${className}`}>
      {url
        ? <img src={url} alt={alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        : <div className="flex h-full w-full items-center justify-center text-sage/40" aria-label={`${product.name} (no image yet)`} role="img"><Droplet size={40} /></div>}
    </div>
  )
}
