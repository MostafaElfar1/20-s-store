import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { config } from '../../lib/config'
import { useForceLtr } from '../../i18n/LanguageContext'

export default function Login() {
  const { session, isAdmin, loading, signIn } = useAuth()
  useForceLtr()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  if (!loading && session && isAdmin) return <Navigate to="/admin" replace />

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    setBusy(true); setError(null)
    const err = await signIn(email.trim(), password)
    if (err) setError(err)
    setBusy(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 border border-line bg-paper p-8">
        <div className="text-center">
          <p className="font-display text-3xl text-forest">{config.storeName}</p>
          <p className="mt-1 text-xs uppercase tracking-widest text-muted">Admin sign in</p>
        </div>
        <div>
          <label htmlFor="email" className="mb-2 block text-xs uppercase tracking-widest text-muted">Email</label>
          <input id="email" type="email" required autoComplete="username" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block text-xs uppercase tracking-widest text-muted">Password</label>
          <input id="password" type="password" required autoComplete="current-password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="text-sm text-danger" role="alert">{error}</p>}
        {session && !loading && !isAdmin && <p className="text-sm text-danger" role="alert">This account is not an admin.</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </div>
  )
}
