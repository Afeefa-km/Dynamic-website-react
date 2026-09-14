import { Navigate, Route, Routes } from 'react-router-dom'
import { GuestOnly, RequireAuth } from './auth/RequireAuth'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import DashboardLayout from './pages/dashboard/DashboardLayout'
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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<GuestOnly />}>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Navigate to="inventory" replace />} />
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
  )
}
