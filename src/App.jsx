import { Route, Routes } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import PageTracker from './components/layout/PageTracker'
import { CartProvider } from './context/CartContext'
import { ToastProvider } from './context/ToastContext'
import { LanguageProvider } from './i18n/LanguageContext'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import ProductDetails from './pages/ProductDetails'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderConfirmed from './pages/OrderConfirmed'
import Policies from './pages/Policies'
import NotFound from './pages/NotFound'
import { AuthProvider } from './context/AuthContext'
import AdminLayout from './components/admin/AdminLayout'
import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminProducts from './pages/admin/Products'
import AdminOrders from './pages/admin/Orders'
import AdminOrderDetails from './pages/admin/OrderDetails'
import AdminAnalytics from './pages/admin/Analytics'

export default function App() {
  return (
    <LanguageProvider>
    <ToastProvider>
      <AuthProvider>
      <CartProvider>
        <PageTracker />
        {/* HashRouter keeps the page in the URL hash; rewrite it so Vercel sees /product/..., and skip admin pages. */}
        <Analytics beforeSend={(e) => {
          const url = e.url.replace('/#/', '/')
          return /\/admin/.test(url) ? null : { ...e, url }
        }} />
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="orders/:id" element={<AdminOrderDetails />} />
          </Route>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Catalog />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmed" element={<OrderConfirmed />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </CartProvider>
      </AuthProvider>
    </ToastProvider>
    </LanguageProvider>
  )
}
