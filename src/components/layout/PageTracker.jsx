import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { trackEvent } from '../../lib/analytics'

// Logs one page view per route change. Admin pages are never tracked.
export default function PageTracker() {
  const { pathname } = useLocation()
  const last = useRef(null)
  useEffect(() => {
    if (pathname.startsWith('/admin') || last.current === pathname) return
    last.current = pathname
    trackEvent('page_view', { path: pathname })
  }, [pathname])
  return null
}
