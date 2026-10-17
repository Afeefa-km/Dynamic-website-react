import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { RequireAuth } from './auth/RequireAuth'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import DashboardLayout from './pages/dashboard/DashboardLayout'
import DashboardOverview from './pages/dashboard/DashboardOverview'
import OrdersPage from './pages/dashboard/OrdersPage'
import CategoriesPage from './pages/dashboard/CategoriesPage'
import InventoryPage from './pages/dashboard/InventoryPage'
import LandingPage from './pages/LandingPage'
import CartPage from './storefront/CartPage'
import CheckoutPage from './storefront/CheckoutPage'
import ProductDetailPage from './storefront/ProductDetailPage'
import StoreHomePage from './storefront/StoreHomePage'
import StorefrontLayout from './storefront/StorefrontLayout'
import WishlistPage from './storefront/WishlistPage'

/** Opening a new page (a product, the cart…) starts at the top instead of keeping the previous scroll position. */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    // Block body on purpose: an effect must not return anything, and some browsers return a value from scrollTo
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
    <ScrollToTop />
    <Routes>
      <Route path="/" element={<LandingPage />} />

      {/* Always show the form, even with a remembered session: signing in is the way into the dashboard */}
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="products" element={<Navigate to="../inventory" replace />} />
          <Route path="orders" element={<OrdersPage />} />
        </Route>
      </Route>

      {/* Public storefront for each store */}
      <Route path="/store/:slug" element={<StorefrontLayout />}>
        <Route index element={<StoreHomePage />} />
        <Route path="p/:productId" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="wishlist" element={<WishlistPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}
