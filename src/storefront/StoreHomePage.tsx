import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Filter, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { storefrontApi, type StorefrontSort } from '../lib/services'
import { ProductCard } from './ProductCard'
import { useStorefront } from './StorefrontLayout'
import { Breadcrumb, StoreButton, StoreEmpty, StoreLoader } from './ui'

const PAGE_SIZE = 12
const sortOptions: { value: StorefrontSort; label: string }[] = [
  { value: 'newest', label: 'New arrivals' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
]

export default function StoreHomePage() {
  const { store } = useStorefront()
  const [params, setParams] = useSearchParams()
  const [filterOpen, setFilterOpen] = useState(false)
  const categoryId = params.get('category') ?? ''
  const search = params.get('q') ?? ''
  const sort = (params.get('sort') as StorefrontSort | null) ?? 'newest'
  const page = Math.max(1, Number(params.get('page')) || 1)
  const base = `/store/${store.slug}`
  const category = store.categories.find((c) => c.id === categoryId)

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    if (!('page' in changes)) next.delete('page')
    setParams(next)
  }

  const query = useQuery({
    queryKey: ['storefront-products', store.slug, { categoryId, search, sort, page }],
    queryFn: () =>
      storefrontApi.products(store.slug, { categoryId: categoryId || undefined, search: search || undefined, sort, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  })

  const title = search ? `Results for "${search}"` : category?.name ?? 'All Products'
  const tab = (active: boolean) =>
    `whitespace-nowrap text-[15px] tracking-wide transition-colors ${active ? 'font-semibold text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'}`

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-12">
      <div className="pt-8">
        <Breadcrumb items={[{ label: 'Home', to: base }, { label: title }]} />
      </div>

      <div className="mt-8 flex items-end justify-between gap-6">
        <div className="flex gap-9 overflow-x-auto pb-1">
          <button className={tab(!categoryId)} onClick={() => update({ category: null })}>View All</button>
          {store.categories.map((c) => (
            <button key={c.id} className={tab(categoryId === c.id)} onClick={() => update({ category: c.id })}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-10 flex justify-end">
        <button
          onClick={() => setFilterOpen((o) => !o)}
          className="flex items-center gap-2 text-sm tracking-[0.06em] uppercase underline underline-offset-4"
          aria-expanded={filterOpen}
        >
          Filter <Filter className="h-4 w-4" strokeWidth={1.5} />
        </button>
        {filterOpen && (
          <div className="absolute top-8 right-0 z-20 w-64 border border-neutral-200 bg-white p-5 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs tracking-[0.15em] text-neutral-500 uppercase">Sort by</p>
              <button onClick={() => setFilterOpen(false)} aria-label="Close filters"><X className="h-4 w-4" /></button>
            </div>
            <ul className="space-y-1">
              {sortOptions.map((o) => (
                <li key={o.value}>
                  <label className="flex cursor-pointer items-center gap-3 py-1.5 text-sm">
                    <input
                      type="radio"
                      name="sort"
                      checked={sort === o.value}
                      onChange={() => {
                        update({ sort: o.value === 'newest' ? null : o.value })
                        setFilterOpen(false)
                      }}
                      className="accent-neutral-900"
                    />
                    {o.label}
                  </label>
                </li>
              ))}
            </ul>
            {(search || categoryId || sort !== 'newest') && (
              <button onClick={() => { setParams({}); setFilterOpen(false) }} className="mt-4 text-xs underline">
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-6">
        {query.isPending ? (
          <StoreLoader />
        ) : query.isError ? (
          <StoreEmpty title="Something went wrong" text="We couldn't load products. Please refresh the page." />
        ) : query.data.items.length === 0 ? (
          <StoreEmpty
            title="No products found"
            text={search || categoryId ? 'Try a different search or category.' : 'This store is adding products. Check back soon!'}
            action={(search || categoryId) && <Link to={base}><StoreButton variant="outline">View all products</StoreButton></Link>}
          />
        ) : (
          <div className={query.isFetching ? 'opacity-60 transition-opacity' : ''}>
            <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-4 lg:grid-cols-4">
              {query.data.items.map((p) => (
                <ProductCard key={p.id} product={p} slug={store.slug} currency={store.currency} />
              ))}
            </div>

            {query.data.totalPages > 1 && (
              <div className="mt-16 flex items-center justify-center gap-6 text-sm tracking-wide">
                <button
                  disabled={page <= 1}
                  onClick={() => { update({ page: String(page - 1) }); window.scrollTo({ top: 0 }) }}
                  className="uppercase underline underline-offset-4 disabled:no-underline disabled:opacity-30"
                >
                  Previous
                </button>
                <span className="text-neutral-500">{page} / {query.data.totalPages}</span>
                <button
                  disabled={page >= query.data.totalPages}
                  onClick={() => { update({ page: String(page + 1) }); window.scrollTo({ top: 0 }) }}
                  className="uppercase underline underline-offset-4 disabled:no-underline disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
