import { Link } from 'react-router-dom'
import { Instagram, Facebook, MessageCircle } from 'lucide-react'
import { config } from '../../lib/config'
import { useLang } from '../../i18n/LanguageContext'
import { LOGO, LOGOF } from './Navbar'

export default function Footer() {
  const { t, slogan } = useLang()
  const wa = config.whatsappNumber
  const col = 'text-xs font-medium uppercase tracking-[0.2em] text-sage'
  const link = 'text-sm text-cream/85 transition-colors hover:text-white'
  return (
    <footer className="mt-24 bg-forest text-cream">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <img src={LOGOF} alt="" className="h-12 w-auto rounded-md bg-cream/5" />
            {/* <p className="font-display text-2xl">{config.storeName}</p> */}
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/75">{slogan}</p>
          <div className="mt-5 flex gap-3">
            {config.instagramUrl && <a href={config.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="rounded-full border border-cream/25 p-2 hover:bg-cream/10"><Instagram size={16} /></a>}
            {config.facebookUrl && <a href={config.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="rounded-full border border-cream/25 p-2 hover:bg-cream/10"><Facebook size={16} /></a>}
          </div>
        </div>
        <div>
          <p className={col}>{t('footer.quick')}</p>
          <ul className="mt-4 space-y-2.5">
            <li><Link to="/" className={link}>{t('nav.home')}</Link></li>
            <li><Link to="/shop" className={link}>{t('footer.shopAll')}</Link></li>
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
