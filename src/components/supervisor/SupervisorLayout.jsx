import { Link, Navigate, Outlet } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { config } from '../../lib/config'
import { useForceLtr } from '../../i18n/LanguageContext'
import Spinner from '../ui/Spinner'
import ErrorState from '../ui/ErrorState'

// Separate from /admin: its own entry point and its own sign-in page, nothing links here from the store or the admin.
// The database still decides who may read the data (is_admin() inside every supervisor_* function and RLS policy).
export default function SupervisorLayout() {
  const { session, isAdmin, loading, checkError, signOut } = useAuth()
  useForceLtr()

  if (loading) return <Spinner label="Checking access..." />
  if (!session) return <Navigate to="/supervisor/login" replace />
  if (checkError) return <div className="container-x py-16"><ErrorState message={checkError} onRetry={() => window.location.reload()} /></div>
  if (!isAdmin) {
    return (
      <div className="container-x max-w-md py-20 text-center">
        <h1 className="text-3xl text-forest">Not authorized</h1>
        <p className="mt-3 text-muted">This account does not have access.</p>
        <button onClick={signOut} className="btn-outline mt-6">Sign out</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-paper">
        <div className="container-x flex items-center justify-between gap-2 py-3">
          <span className="font-display text-xl text-forest">{config.storeName} Supervisor</span>
          <nav className="flex items-center">
            <Link to="/" className="px-3 py-2 text-xs uppercase tracking-widest text-muted hover:text-forest">View store</Link>
            <button onClick={signOut} className="ml-2 inline-flex items-center gap-1 px-3 py-2 text-xs uppercase tracking-widest text-muted hover:text-forest"><LogOut size={14} /> Sign out</button>
          </nav>
        </div>
      </header>
      <div className="container-x py-10"><Outlet /></div>
    </div>
  )
}
