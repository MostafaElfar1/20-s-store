import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Instagram, Facebook, MessageCircle } from 'lucide-react'
import { config } from '../../lib/config'
import { useLang } from '../../i18n/LanguageContext'
import { LOGO } from './Navbar'
import { CATEGORIES, categoryLink } from '../../lib/categories'

// lucide has no TikTok icon, so this is the official glyph as an inline SVG (it takes the text colour).
const TikTokIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
)

// Footer logo: public/iconf.png shown as a circle. If the file is missing, the normal logo is used instead.
const FOOTER_LOGO = `${import.meta.env.BASE_URL}iconf.png`
function FooterLogo() {
  const [src, setSrc] = useState(FOOTER_LOGO)
  return <img src={src} alt={config.storeName} onError={() => setSrc(LOGO)} className="h-16 w-16 shrink-0 rounded-full object-cover" />
}

export default function Footer() {
  const { t, lang, slogan } = useLang()
  const wa = config.whatsappNumber
  const col = 'text-xs font-medium uppercase tracking-[0.2em] text-sage'
  const link = 'text-sm text-cream/85 transition-colors hover:text-white'
  return (
    <footer className="mt-24 bg-forest text-cream">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <FooterLogo />
            {/* <p className="font-display text-2xl">{config.storeName}</p> */}
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/75">{slogan}</p>
          <div className="mt-5 flex gap-3">
            {config.instagramUrl && <a href={config.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="rounded-full border border-cream/25 p-2 hover:bg-cream/10"><Instagram size={16} /></a>}
            {config.facebookUrl && <a href={config.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="rounded-full border border-cream/25 p-2 hover:bg-cream/10"><Facebook size={16} /></a>}
            {config.tiktokUrl && <a href={config.tiktokUrl} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="rounded-full border border-cream/25 p-2 hover:bg-cream/10"><TikTokIcon /></a>}
          </div>
        </div>
        <div>
          <p className={col}>{t('footer.quick')}</p>
          <ul className="mt-4 space-y-2.5">
            <li><Link to="/" className={link}>{t('nav.home')}</Link></li>
            <li><Link to="/shop" className={link}>{t('footer.shopAll')}</Link></li>
            {CATEGORIES.map((c) => <li key={c.key}><Link to={categoryLink(c)} className={link}>{c[lang === 'ar' ? 'ar' : 'en']}</Link></li>)}
          </ul>
        </div>
        <div>
          <p className={col}>{t('footer.care')}</p>
          <ul className="mt-4 space-y-2.5">
            <li><Link to="/policies" className={link}>{t('footer.policies')}</Link></li>
          </ul>
        </div>
        <div>
          <p className={col}>{t('footer.contact')}</p>
          {wa
            ? <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className={`${link} mt-4 inline-flex items-center gap-2`}><MessageCircle size={16} /> <span dir="ltr">+{wa}</span></a>
            : <p className="mt-4 text-sm text-cream/70">{t('footer.soon')}</p>}
        </div>
      </div>
      <div className="border-t border-cream/15">
        <div className="container-x flex flex-wrap items-center justify-between gap-3 py-5 text-xs text-cream/70">
          <span>&copy; {new Date().getFullYear()} {config.storeName}</span>
          <span className="inline-flex items-center gap-2">{t('footer.accept')}: <span className="rounded-full border border-cream/25 px-3 py-1 text-cream">{t('footer.cod')}</span></span>
        </div>
      </div>
    </footer>
  )
}
