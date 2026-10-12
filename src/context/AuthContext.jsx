import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

// "Admin" = a row for this user in public.admins (verified by the database, not by JavaScript).
// Even if someone fakes isAdmin in the browser, RLS still blocks every admin query.
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [checkError, setCheckError] = useState(null)

  useEffect(() => {
    if (!supabase) { setSessionReady(true); return }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setSessionReady(true) })
    // Fires on login, logout, token refresh, and when a session can no longer be refreshed (expired).
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user?.id
  useEffect(() => {
    if (!sessionReady) return
    if (!supabase || !userId) { setIsAdmin(false); setLoading(false); return }
    let cancelled = false
    setLoading(true)
    supabase.from('admins').select('user_id').eq('user_id', userId).maybeSingle().then(({ data, error }) => {
      if (cancelled) return
      setCheckError(error ? 'Could not verify admin access. Check your connection.' : null)
      setIsAdmin(Boolean(data))
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [sessionReady, userId])

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) return null
    return /invalid login/i.test(error.message) ? 'Wrong email or password.' : 'Could not sign in. Please try again.'
  }, [])
  const signOut = useCallback(() => supabase.auth.signOut(), [])

  return (
    <AuthCtx.Provider value={{ session, isAdmin, loading: loading || !sessionReady, checkError, signIn, signOut }}>
      {children}
    </AuthCtx.Provider>
  )
}
