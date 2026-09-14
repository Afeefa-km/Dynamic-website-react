import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { ExternalLink, LogOut, Package, Settings, ShoppingCart, Tags } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useOutletContext } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { StoreFormModal } from '../../components/admin/StoreFormModal'
import { Logo } from '../../components/Logo'
import { Button } from '../../components/ui/Button'
import { PageLoader } from '../../components/ui/Spinner'
import { mediaUrl } from '../../lib/format'
import { storeApi } from '../../lib/services'
import type { Store } from '../../types/api'

export interface DashboardContext {
  store: Store
  /** True right after the store is created, so the products page opens the upload popup. */
  onboarding: boolean
  finishOnboarding: () => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const useDashboard = () => useOutletContext<DashboardContext>()

const navItems = [
  { to: '/dashboard/inventory', label: 'Inventory', icon: Package },
  { to: '/dashboard/categories', label: 'Categories', icon: Tags },
  { to: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
]

export default function DashboardLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [onboarding, setOnboarding] = useState(false)

  const storeQuery = useQuery({
    queryKey: ['my-store'],
    queryFn: storeApi.mine,
    retry: (count, err) => !(axios.isAxiosError(err) && err.response?.status === 404) && count < 2,
  })

  const noStore = axios.isAxiosError(storeQuery.error) && storeQuery.error.response?.status === 404

  if (storeQuery.isPending) return <PageLoader label="Loading your store…" />

  if (noStore) {
    return (
      <div className="min-h-screen bg-surface">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <Logo to="/dashboard" />
          <Button variant="ghost" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </header>
        <StoreFormModal
          open
          defaultEmail={user?.email}
          defaultPhone={user?.phoneNumber}
          onSaved={(store) => {
            // Next onboarding step: add the first inventory item
            setOnboarding(true)
            queryClient.setQueryData(['my-store'], store)
            navigate('/dashboard/inventory', { replace: true })
          }}
        />
      </div>
    )
  }

  if (storeQuery.isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-gray-600">We couldn't load your store.</p>
        <Button onClick={() => storeQuery.refetch()}>Try again</Button>
      </div>
    )
  }

  const store = storeQuery.data

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Logo to="/dashboard" />
          <div className="flex items-center gap-2">
            <a
              href={`/store/${store.slug}`}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:border-brand-700 hover:text-brand-700 sm:inline-flex"
            >
              View store <ExternalLink className="h-4 w-4" />
            </a>
            <Button variant="ghost" onClick={signOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-4">
          <div className="flex items-center gap-3 rounded-3xl bg-white p-4">
            {store.logoUrl ? (
              <img src={mediaUrl(store.logoUrl)} alt="" className="h-11 w-11 rounded-2xl object-cover" />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-700 font-bold text-white">
                {store.name[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold">{store.name}</p>
              <p className="truncate text-xs text-gray-500">/store/{store.slug}</p>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto rounded-3xl bg-white p-2 lg:flex-col">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium whitespace-nowrap ${
                    isActive ? 'bg-brand-700 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <Icon className="h-4 w-4" /> {label}
              </NavLink>
            ))}
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium whitespace-nowrap text-gray-700 hover:bg-gray-100"
            >
              <Settings className="h-4 w-4" /> Store settings
            </button>
          </nav>
        </aside>

        <main className="min-w-0">
          <Outlet context={{ store, onboarding, finishOnboarding: () => setOnboarding(false) } satisfies DashboardContext} />
        </main>
      </div>

      {settingsOpen && (
        <StoreFormModal
          open
          store={store}
          onClose={() => setSettingsOpen(false)}
          onSaved={(updated) => {
            queryClient.setQueryData(['my-store'], updated)
            setSettingsOpen(false)
          }}
        />
      )}
    </div>
  )
}
