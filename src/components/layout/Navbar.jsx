import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Globe, Menu, ShoppingBag, X } from 'lucide-react'
import { config } from '../../lib/config'
import { useCart } from '../../context/CartContext'
import { useLang } from '../../i18n/LanguageContext'

export const LOGO = `${import.meta.env.BASE_URL}icon.png`
export const LOGOF = `${import.meta.env.BASE_URL}iconf.png`

export default function Navbar() {
  const { count } = useCart()
  const { t, lang, toggle } = useLang()
  const [open, setOpen] = useState(false)

  const link = ({ isActive }) =>
    `border-b-2 py-1 text-sm font-medium transition-colors hover:text-forest ${isActive ? 'border-forest text-forest' : 'border-transparent text-ink/80'}`
  
  const mobileLink = ({ isActive }) => 
    `block rounded-lg px-3 py-3 text-base ${isActive ? 'bg-sage-soft text-forest' : 'text-ink'}`
  
  const items = lang === 'ar' 
    ? [
        ['/', 'nav.home', true],       
        ['/shop', 'nav.shop'],         
        ['/policies', 'nav.policies']  
      ] 
    : [
        ['/', 'nav.home', true],       
        ['/shop', 'nav.shop'],         
        ['/policies', 'nav.policies']  
      ]

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur" style={{ direction: 'ltr' }}>
      {/* استخدام Flex للموبايل و Grid للشاشات الكبيرة (md) لضمان دقة التوزيع */}
      <div className="container-x flex md:grid h-[68px] md:grid-cols-3 items-center justify-between gap-4">
        
        {/* 1. اللوجو (على الشمال دائماً في كل الشاشات) */}
        <div className="flex items-center justify-start">
          <Link to="/" className="flex items-center gap-3" aria-label={`${config.storeName}`} onClick={() => setOpen(false)}>
            <img src={LOGO} alt="" className="h-11 w-auto object-contain" />
          </Link>
        </div>

        {/* 2. القوائم في المنتصف (تظهر فقط في الشاشات الكبيرة md) */}
        <nav className="hidden items-center justify-center gap-8 md:flex" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
          {items.map(([to, key, end]) => (
            <NavLink key={to} to={to} end={end} className={link}>
              {t(key)}
            </NavLink>
          ))}
        </nav>

        {/* 3. أزرار السلة، اللغة، والمنيو (على اليمين دائماً) */}
        <div className="flex items-center justify-end gap-1.5">
          <button 
            onClick={toggle} 
            aria-label={t('nav.switchLabel')}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5 text-sm font-medium text-forest transition-colors hover:border-forest"
          >
            <Globe size={15} /> {t('nav.switch')}
          </button>
          
          <Link 
            to="/cart" 
            className="relative rounded-full p-2.5 text-forest transition-colors hover:bg-sage-soft" 
            aria-label={t('nav.cart', { n: count })}
          >
            <ShoppingBag size={20} />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-forest px-1 text-[11px] font-semibold text-cream">
                {count}
              </span>
            )}
          </Link>

          <button 
            className="rounded-full p-2.5 text-forest hover:bg-sage-soft md:hidden" 
            aria-label={t('nav.menu')} 
            aria-expanded={open} 
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* القائمة المندمجة للجوال */}
      {open && (
        <nav className="border-t border-line bg-cream px-5 py-3 md:hidden" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
          {items.map(([to, key, end]) => (
            <NavLink key={to} to={to} end={end} className={mobileLink} onClick={() => setOpen(false)}>
              {t(key)}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}