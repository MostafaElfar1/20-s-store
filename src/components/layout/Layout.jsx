import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import { useLang } from '../../i18n/LanguageContext'

export default function Layout() {
  const { pathname } = useLocation()
  const { t } = useLang()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return (
    <div className="flex min-h-screen flex-col">
      <div className="bg-forest-deep px-4 py-2 text-center text-xs text-cream/90">{t('announce')}</div>
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  )
}
