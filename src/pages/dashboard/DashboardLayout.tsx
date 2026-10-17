import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { ChevronDown, ExternalLink, LayoutDashboard, LogOut, Menu, Package, PanelLeftClose, PanelLeftOpen, Settings, ShoppingCart, Tags, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { LowStockBell } from '../../components/admin/LowStockBell'
import { StoreFormModal } from '../../components/admin/StoreFormModal'
import { ThemeOnboardingModal } from '../../components/admin/ThemeOnboardingModal'
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
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/inventory', label: 'Inventory', icon: Package },
  { to: '/dashboard/categories', label: 'Categories', icon: Tags },
  { to: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
]

const COLLAPSE_KEY = 'storely.sidebar.collapsed'

export default function DashboardLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [onboarding, setOnboarding] = useState(false)
  // First-run steps after creating the store: pick a theme (skippable), then add the first item
  const [themeStep, setThemeStep] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1'
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
    } catch {
      // ignore storage errors
    }
  }, [collapsed])

  // Close the mobile drawer after navigating
  useEffect(() => setMobileOpen(false), [location.pathname])

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
            // Next onboarding step: choose a theme, then add the first inventory item
            setThemeStep(true)
            queryClient.setQueryData(['my-store'], store)
            navigate('/dashboard', { replace: true })
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

  const pageTitle =
    navItems.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)))?.label ?? 'Dashboard'

  // On mobile the drawer always shows labels
  const compact = collapsed && !mobileOpen
  const navClass = (active: boolean) =>
    `flex items-center gap-3 rounded-2xl py-2.5 text-sm font-medium whitespace-nowrap transition ${
      compact ? 'lg:justify-center lg:px-0' : ''
    } px-4 ${active ? 'bg-brand-700 text-white' : 'text-gray-700 hover:bg-gray-100'}`

  return (
    <div className="min-h-screen bg-surface">
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-all duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${collapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        <div className={`flex h-16 shrink-0 items-center border-b border-gray-100 px-4 ${compact ? 'lg:justify-center' : 'justify-between'}`}>
          <div className={compact ? 'lg:hidden' : ''}>
            <Logo to="/dashboard" />
          </div>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-brand-700 lg:inline-flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
          <button onClick={() => setMobileOpen(false)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100 lg:hidden" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className={`flex items-center gap-3 p-4 ${compact ? 'lg:justify-center lg:px-0' : ''}`} title={compact ? store.name : undefined}>
          {store.logoUrl ? (
            <img src={mediaUrl(store.logoUrl)} alt="" className="h-11 w-11 shrink-0 rounded-2xl object-cover" />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-700 font-bold text-white">
              {store.name[0]?.toUpperCase()}
            </div>
          )}
          <div className={`min-w-0 ${compact ? 'lg:hidden' : ''}`}>
            <p className="truncate font-semibold">{store.name}</p>
            <p className="truncate text-xs text-gray-500">/store/{store.slug}</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => navClass(isActive)} title={compact ? label : undefined}>
              <Icon className="h-5 w-5 shrink-0" />
              <span className={compact ? 'lg:hidden' : ''}>{label}</span>
            </NavLink>
          ))}
          <button onClick={() => setSettingsOpen(true)} className={navClass(false)} title={compact ? 'Store settings' : undefined}>
            <Settings className="h-5 w-5 shrink-0" />
            <span className={compact ? 'lg:hidden' : ''}>Store settings</span>
          </button>
        </nav>

        <div className="flex flex-col gap-1 border-t border-gray-100 p-3">
          <a href={`/store/${store.slug}`} target="_blank" rel="noreferrer" className={navClass(false)} title={compact ? 'View store' : undefined}>
            <ExternalLink className="h-5 w-5 shrink-0" />
            <span className={compact ? 'lg:hidden' : ''}>View store</span>
          </a>
          <button onClick={signOut} className={navClass(false)} title={compact ? 'Sign out' : undefined}>
            <LogOut className="h-5 w-5 shrink-0" />
            <span className={compact ? 'lg:hidden' : ''}>Sign out</span>
          </button>
        </div>
      </aside>

      <div className={`transition-all duration-200 ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button onClick={() => setMobileOpen(true)} className="rounded-full p-2 text-gray-600 hover:bg-gray-100 lg:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{pageTitle}</p>
            <p className="hidden truncate text-xs text-gray-500 sm:block">{store.name}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <a
              href={`/store/${store.slug}`}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:border-brand-700 hover:text-brand-700 md:inline-flex"
            >
              View store <ExternalLink className="h-4 w-4" />
            </a>
            <LowStockBell />
            <ProfileMenu
              name={user?.fullName ?? ''}
              email={user?.email ?? ''}
              onSettings={() => setSettingsOpen(true)}
              onSignOut={signOut}
            />
          </div>
        </header>

        <main className="mx-auto max-w-7xl min-w-0 px-4 py-6 sm:px-6">
          <Outlet context={{ store, onboarding, finishOnboarding: () => setOnboarding(false) } satisfies DashboardContext} />
        </main>
      </div>

      {themeStep && (
        <ThemeOnboardingModal
          store={store}
          onDone={(updated) => {
            if (updated) queryClient.setQueryData(['my-store'], updated)
            setThemeStep(false)
            // The inventory page opens the add-item popup when it mounts during onboarding
            setOnboarding(true)
            navigate('/dashboard/inventory', { replace: true })
          }}
        />
      )}

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

function ProfileMenu({ name, email, onSettings, onSignOut }: { name: string; email: string; onSettings: () => void; onSignOut: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?'
  const item = 'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 hover:bg-gray-100"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white">{initials}</span>
        <span className="hidden max-w-40 text-left sm:block">
          <span className="block truncate text-sm leading-tight font-medium">{name}</span>
          <span className="block truncate text-xs leading-tight text-gray-500">Store owner</span>
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-64 rounded-2xl border border-gray-100 bg-white p-2 shadow-lg">
          <div className="flex items-center gap-3 border-b border-gray-100 px-3 pt-1 pb-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white">{initials}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="truncate text-xs text-gray-500">{email}</p>
            </div>
          </div>
          <div className="pt-2">
            <button role="menuitem" className={`${item} text-gray-700 hover:bg-gray-100`} onClick={() => { setOpen(false); onSettings() }}>
              <Settings className="h-4 w-4" /> Store settings
            </button>
            <button role="menuitem" className={`${item} text-red-600 hover:bg-red-50`} onClick={onSignOut}>
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
