import { Droplet } from 'lucide-react'
import { pick, productImageUrl } from '../../lib/products'
import { useLang } from '../../i18n/LanguageContext'

// Consistent 4:5 ratio. Falls back to an icon tile when no image is set (never a broken image).
export default function ProductImage({ product, className = '' }) {
  const { t, lang } = useLang()
  const url = productImageUrl(product.image_path)
  const name = pick(product, 'name', lang)
  const alt = t('product.alt', { name, brand: product.brand, ml: product.volume_ml })
  return (
    <div className={`aspect-[4/5] w-full overflow-hidden bg-sage-soft ${className}`}>
      {url
        ? <img src={url} alt={alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        : <div className="flex h-full w-full items-center justify-center text-forest/30" aria-label={t('product.noImage', { name })} role="img"><Droplet size={40} /></div>}
    </div>
  )
}
