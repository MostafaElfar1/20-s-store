import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { config } from '../../lib/config'
import Spinner from '../ui/Spinner'
import ErrorState from '../ui/ErrorState'

// Guard: nothing from the admin area renders until the database confirms this user is an admin.
export default function AdminLayout() {
  const { session, isAdmin, loading, checkError, signOut } = useAuth()

  if (loading) return <Spinner label="Checking access..." />
  if (!session) return <Navigate to="/admin/login" replace />
  if (checkError) return <div className="container-x py-16"><ErrorState message={checkError} onRetry={() => window.location.reload()} /></div>
  if (!isAdmin) {
    return (
      <div className="container-x max-w-md py-20 text-center">
        <h1 className="text-3xl">Not authorized</h1>
        <p className="mt-3 text-muted">This account does not have admin access.</p>
        <button onClick={signOut} className="btn-outline mt-6">Sign out</button>
      </div>
    )
  }

  const link = ({ isActive }) => `px-3 py-2 text-xs uppercase tracking-widest hover:text-sage ${isActive ? 'text-sage' : 'text-mist'}`
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-moss">
        <div className="container-x flex flex-wrap items-center justify-between gap-2 py-3">
          <span className="font-display text-xl text-sage">{config.storeName} Admin</span>
          <nav className="flex flex-wrap items-center">
            <NavLink to="/admin" end className={link}>Overview</NavLink>
            <NavLink to="/admin/products" className={link}>Products</NavLink>
            <NavLink to="/admin/orders" className={link}>Orders</NavLink>
            <NavLink to="/" className="px-3 py-2 text-xs uppercase tracking-widest text-muted hover:text-sage">View store</NavLink>
            <button onClick={signOut} className="ml-2 inline-flex items-center gap-1 px-3 py-2 text-xs uppercase tracking-widest text-muted hover:text-sage"><LogOut size={14} /> Sign out</button>
          </nav>
        </div>
      </header>
      <div className="container-x py-10"><Outlet /></div>
    </div>
  )
}
