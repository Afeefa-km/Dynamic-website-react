import { useQuery } from '@tanstack/react-query'
import { Heart, Search, ShoppingBag } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom'
import { mediaUrl } from '../lib/format'
import { storefrontApi } from '../lib/services'
import type { Storefront } from '../types/api'
import { CartProvider, useCart } from './CartContext'
import { StoreEmpty, StoreLoader } from './ui'
import { useWishlist, WishlistProvider } from './WishlistContext'

// eslint-disable-next-line react-refresh/only-export-components
export const useStorefront = () => useOutletContext<{ store: Storefront }>()

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
  const [params] = useSearchParams()
  const base = `/store/${store.slug}`
  const [search, setSearch] = useState(params.get('q') ?? '')
  const activeCategory = location.pathname === base ? params.get('category') : null

  useEffect(() => setSearch(params.get('q') ?? ''), [params])

  const submitSearch = (e: FormEvent) => {
    e.preventDefault()
    const q = search.trim()
    navigate(q ? `${base}?q=${encodeURIComponent(q)}` : base)
  }

  const navLink = (active: boolean) =>
    `whitespace-nowrap text-[15px] tracking-wide transition-colors ${active ? 'text-neutral-900 underline underline-offset-8' : 'text-neutral-700 hover:text-neutral-900'}`

  return (
    <div className="flex min-h-screen flex-col bg-white text-neutral-900">
      <header className="sticky top-0 z-30 bg-white">
        <div className="mx-auto grid max-w-[1440px] grid-cols-[auto_1fr_auto] items-center gap-4 px-4 pt-4 pb-3 sm:px-12 md:grid-cols-[1fr_minmax(0,540px)_1fr]">
          <Link to={base} className="flex min-w-0 items-center gap-3">
            {store.logoUrl && <img src={mediaUrl(store.logoUrl)} alt="" className="h-10 w-10 object-contain" />}
            <span className="truncate font-serif text-2xl tracking-[0.12em] uppercase">{store.name}</span>
          </Link>

          <form onSubmit={submitSearch} className="order-last col-span-3 md:order-none md:col-span-1" role="search">
            <label className="flex h-11 items-center gap-3 rounded-full border border-neutral-300 px-5 focus-within:border-neutral-900">
              <Search className="h-4 w-4 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-700"
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

        {store.categories.length > 0 && (
          <nav className="border-b border-neutral-100" aria-label="Categories">
            <div className="mx-auto flex max-w-[1440px] gap-9 overflow-x-auto px-4 py-4 sm:px-12 md:justify-center">
              <NavLink to={base} end className={() => navLink(location.pathname === base && !activeCategory && !params.get('q'))}>
                All
              </NavLink>
              {store.categories.map((c) => (
                <Link key={c.id} to={`${base}?category=${c.id}`} className={navLink(activeCategory === c.id)}>
                  {c.name}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet context={{ store }} />
      </main>

      <footer className="mt-24 border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-12 text-sm sm:grid-cols-3 sm:px-12">
          <div>
            <p className="font-serif text-xl tracking-[0.12em] uppercase">{store.name}</p>
            {store.businessDescription && <p className="mt-3 max-w-xs text-neutral-600">{store.businessDescription}</p>}
          </div>
          <div>
            <p className="mb-3 text-xs tracking-[0.15em] text-neutral-500 uppercase">Shop</p>
            <ul className="space-y-2">
              {store.categories.slice(0, 6).map((c) => (
                <li key={c.id}><Link to={`${base}?category=${c.id}`} className="hover:underline">{c.name}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs tracking-[0.15em] text-neutral-500 uppercase">Contact us</p>
            <ul className="space-y-2 text-neutral-700">
              <li>{store.contactPhone}</li>
              <li>{store.contactEmail}</li>
              {store.businessAddress && <li>{store.businessAddress}</li>}
            </ul>
          </div>
        </div>
        <p className="border-t border-neutral-200 py-4 text-center text-xs text-neutral-500">© {new Date().getFullYear()} {store.name} · Powered by Storely</p>
      </footer>
    </div>
  )
}

function Badge({ children }: { children: number }) {
  return (
    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-semibold text-white">
      {children}
    </span>
  )
}
