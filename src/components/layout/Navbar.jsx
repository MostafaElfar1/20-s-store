import { Link, NavLink } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { config } from '../../lib/config'
import { useCart } from '../../context/CartContext'

export default function Navbar() {
  const { count } = useCart()
  const link = ({ isActive }) => `text-xs uppercase tracking-widest transition-colors hover:text-sage ${isActive ? 'text-sage' : 'text-mist'}`
  return (
<header className="sticky top-0 z-40 border-b border-line bg-moss/95 backdrop-blur">
  <div className="container-x flex h-16 items-center justify-between">
    
    <Link to="/" className="flex items-center gap-3" aria-label={`${config.storeName} home`}>
      <img
        src={`${import.meta.env.BASE_URL}icon.png`}
        alt={config.storeName}
        className="h-12 w-auto object-contain"
      />
    </Link>

    <nav className="flex items-center gap-6">
      <NavLink to="/" end className={link}>Home</NavLink>
      <NavLink to="/shop" className={link}>Shop</NavLink>
      <Link to="/cart" className="relative p-2 hover:text-sage" aria-label={`Cart, ${count} items`}>
        <ShoppingBag size={20} />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center bg-sage px-1 text-[11px] font-semibold text-forest">{count}</span>
        )}
      </Link>
    </nav>
  </div>
</header>
  )
}
