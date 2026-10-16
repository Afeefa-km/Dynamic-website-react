import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { PageLoader } from '../components/ui/Spinner'
import { useAuth } from './AuthContext'

export function RequireAuth() {
  const { isAuthenticated, initializing } = useAuth()
  const location = useLocation()

  if (initializing) return <PageLoader label="Signing you in…" />
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}
