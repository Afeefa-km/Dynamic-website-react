import { useQuery } from '@tanstack/react-query'
import { Banknote, Eye, Heart, Phone, Search, ShoppingBag, Truck, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom'
import { ancestorsOf, childrenOf } from '../lib/categories'
import { mediaUrl } from '../lib/format'
import { storefrontApi } from '../lib/services'
import type { Storefront } from '../types/api'
import { CartProvider, useCart } from './CartContext'
import { loadThemeFonts, resolveTheme, themeStyle, type ThemeDefinition } from './themes'
import { StoreEmpty, StoreLoader } from './ui'
import { useWishlist, WishlistProvider } from './WishlistContext'

// eslint-disable-next-line react-refresh/only-export-components
export const useStorefront = () => useOutletContext<{ store: Storefront; theme: ThemeDefinition }>()

const previewKey = (slug: string) => `storely.themePreview.${slug}`

function readPreview(slug: string) {
  try {
    return sessionStorage.getItem(previewKey(slug))
  } catch {
    return null
  }
}

export default function StorefrontLayout() {
  const { slug = '' } = useParams()
  const query = useQuery({ queryKey: ['storefront', slug], queryFn: () => storefrontApi.store(slug), retry: false })

  if (query.isPending) return <StoreLoader />
  if (query.isError) {
    return <StoreEmpty title="Store not found" text="This store doesn't exist or the link is incorrect." />
  }

  return (
    <CartProvider slug={slug}>
      <WishlistProvider slug={slug}>
        <Shell store={query.data} />
      </WishlistProvider>
    </CartProvider>
  )
}

function Shell({ store }: { store: Storefront }) {
  const { count } = useCart()
  const { items: wishlist } = useWishlist()
  const navigate = useNavigate()
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const base = `/store/${store.slug}`
  // Owners can try a theme before switching: /store/slug?preview=Noir. It sticks for this browser tab only.
  const [preview, setPreview] = useState(() => params.get('preview') ?? readPreview(store.slug))
  const theme = resolveTheme(preview ?? store.theme)
  const previewing = !!preview && preview !== store.theme
  const [search, setSearch] = useState(params.get('q') ?? '')
  const activeCategory = location.pathname === base ? params.get('category') : null
  // The nav shows top-level categories; one stays highlighted while browsing anything nested under it
  const topCategories = childrenOf(store.categories, null)
  const activeTopId = activeCategory ? ancestorsOf(store.categories, activeCategory)[0]?.id : undefined

  useEffect(() => setSearch(params.get('q') ?? ''), [params])
  useEffect(() => loadThemeFonts(theme), [theme])

  // Remember a preview from the link, then tidy the URL so it doesn't leak into shared links
  useEffect(() => {
    const fromLink = params.get('preview')
    if (!fromLink) return
    try {
      sessionStorage.setItem(previewKey(store.slug), fromLink)
    } catch {
      // the preview still applies for this page view
    }
    const next = new URLSearchParams(params)
    next.delete('preview')
    setParams(next, { replace: true })
  }, [params, setParams, store.slug])

  const exitPreview = () => {
    try {
      sessionStorage.removeItem(previewKey(store.slug))
    } catch {
      // nothing stored
    }
    setPreview(null)
  }

  const submitSearch = (e: FormEvent) => {
    e.preventDefault()
    const q = search.trim()
    navigate(q ? `${base}?q=${encodeURIComponent(q)}` : base)
  }

  const navLink = (active: boolean) =>
    `whitespace-nowrap text-[15px] tracking-wide transition-colors ${active ? 'text-sf-text underline underline-offset-8' : 'text-sf-muted hover:text-sf-text'}`

  return (
    <div style={themeStyle(theme)} className="flex min-h-screen flex-col bg-sf-bg font-sf-body text-sf-text">
      {previewing && (
        <div className="flex items-center justify-center gap-3 bg-gray-900 px-4 py-2 font-sans text-sm text-white">
          <Eye className="h-4 w-4 shrink-0" />
          <span>Previewing the {theme.name} theme. Only you can see this; your store hasn't changed.</span>
          <button onClick={exitPreview} className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
            <X className="h-3.5 w-3.5" /> Exit preview
          </button>
        </div>
      )}
      {theme.serviceBar && (
        <div className="bg-sf-band text-sf-on-band">
          <ul className="sf-label mx-auto flex max-w-[1440px] items-center justify-center gap-x-8 gap-y-1 overflow-x-auto px-4 py-2 text-[11px] whitespace-nowrap sm:justify-between sm:px-12">
            <li className="flex items-center gap-2"><Truck className="h-3.5 w-3.5 text-sf-accent" /> Free delivery</li>
            <li className="flex items-center gap-2"><Banknote className="h-3.5 w-3.5 text-sf-accent" /> Cash on delivery</li>
            <li className="hidden items-center gap-2 sm:flex"><Phone className="h-3.5 w-3.5 text-sf-accent" /> {store.contactPhone}</li>
          </ul>
        </div>
      )}
      <header className="sticky top-0 z-30 bg-sf-bg">
        <div className="mx-auto grid max-w-[1440px] grid-cols-[auto_1fr_auto] items-center gap-4 px-4 pt-4 pb-3 sm:px-12 md:grid-cols-[1fr_minmax(0,540px)_1fr]">
          <Link to={base} className="flex min-w-0 items-center gap-3">
            {store.logoUrl && <img src={mediaUrl(store.logoUrl)} alt="" className="h-10 w-10 object-contain" />}
            <span className="truncate font-sf-display text-2xl tracking-[0.12em] uppercase">{store.name}</span>
          </Link>

          <form onSubmit={submitSearch} className="order-last col-span-3 md:order-none md:col-span-1" role="search">
            <label className="flex h-11 items-center gap-3 rounded-full border border-sf-line px-5 focus-within:border-sf-text">
              <Search className="h-4 w-4 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="w-full bg-transparent text-sm outline-none placeholder:text-sf-muted"
                aria-label="Search products"
              />
            </label>
          </form>

          <div className="flex items-center justify-end gap-5">
            <Link to={`${base}/wishlist`} className="relative" aria-label={`Wishlist (${wishlist.length})`}>
              <Heart className="h-[22px] w-[22px]" strokeWidth={1.5} />
              {wishlist.length > 0 && <Badge>{wishlist.length}</Badge>}
            </Link>
            <Link to={`${base}/cart`} className="relative" aria-label={`Bag (${count})`}>
              <ShoppingBag className="h-[22px] w-[22px]" strokeWidth={1.5} />
              {count > 0 && <Badge>{count}</Badge>}
            </Link>
          </div>
        </div>

        {topCategories.length > 0 && (
          <nav className="border-b border-sf-border" aria-label="Categories">
            <div className="mx-auto flex max-w-[1440px] gap-9 overflow-x-auto px-4 py-4 sm:px-12 md:justify-center">
              <NavLink to={base} end className={() => navLink(location.pathname === base && !activeCategory && !params.get('q'))}>
                All
              </NavLink>
              {topCategories.map((c) => (
                <Link key={c.id} to={`${base}?category=${c.id}`} className={navLink(activeTopId === c.id)}>
                  {c.name}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet context={{ store, theme }} />
      </main>

      <footer className="mt-24 border-t border-sf-border bg-sf-surface">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-12 text-sm sm:grid-cols-3 sm:px-12">
          <div>
            <p className="font-sf-display text-xl tracking-[0.12em] uppercase">{store.name}</p>
            {store.businessDescription && <p className="mt-3 max-w-xs text-sf-muted">{store.businessDescription}</p>}
          </div>
          <div>
            <p className="mb-3 text-xs sf-label tracking-[0.15em] text-sf-muted uppercase">Shop</p>
            <ul className="space-y-2">
              {topCategories.slice(0, 6).map((c) => (
                <li key={c.id}><Link to={`${base}?category=${c.id}`} className="hover:underline">{c.name}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs sf-label tracking-[0.15em] text-sf-muted uppercase">Contact us</p>
            <ul className="space-y-2 text-sf-muted">
              <li>{store.contactPhone}</li>
              <li>{store.contactEmail}</li>
              {store.businessAddress && <li>{store.businessAddress}</li>}
            </ul>
          </div>
        </div>
        <p className="border-t border-sf-border py-4 text-center text-xs text-sf-muted">© {new Date().getFullYear()} {store.name} · Powered by Storely</p>
      </footer>
    </div>
  )
}

function Badge({ children }: { children: number }) {
  return (
    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-sf-primary px-1 text-[10px] font-semibold text-sf-on-primary">
      {children}
    </span>
  )
}
