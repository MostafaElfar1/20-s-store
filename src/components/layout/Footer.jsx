import { Link } from 'react-router-dom'
import { Instagram, Facebook, MessageCircle } from 'lucide-react'
import { config } from '../../lib/config'

export default function Footer() {
  const wa = config.whatsappNumber
  return (
    <footer className="mt-24 border-t border-line bg-moss">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-3">
        <div>
          <p className="font-display text-2xl text-sage">{config.storeName}</p>
          <p className="mt-2 text-sm text-muted">{config.slogan}</p>
        </div>
        <div>
          <p className="eyebrow">Contact</p>
          {wa
            ? <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm hover:text-sage"><MessageCircle size={16} /> WhatsApp +{wa}</a>
            : <p className="mt-3 text-sm text-muted">Contact details coming soon.</p>}
          <div className="mt-4 flex gap-4">
            {config.instagramUrl && <a href={config.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-sage"><Instagram size={18} /></a>}
            {config.facebookUrl && <a href={config.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-sage"><Facebook size={18} /></a>}
          </div>
        </div>
        <div>
          <p className="eyebrow">Store</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/shop" className="hover:text-sage">Shop all</Link></li>
            <li><Link to="/policies" className="hover:text-sage">Store policies</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-muted">&copy; {new Date().getFullYear()} {config.storeName}</div>
    </footer>
  )
}
