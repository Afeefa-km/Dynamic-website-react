import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Check, Filter, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ancestorsOf, childrenOf } from '../lib/categories'
import { storefrontApi, type StorefrontSort } from '../lib/services'
import { ProductCard } from './ProductCard'
import { StoreHero } from './StoreHero'
import { useStorefront } from './StorefrontLayout'
import { Breadcrumb, StoreButton, StoreEmpty, StoreLoader } from './ui'

const PAGE_SIZE = 12
const sortOptions: { value: StorefrontSort; label: string }[] = [
  { value: 'newest', label: 'New arrivals' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
]

export default function StoreHomePage() {
  const { store, theme } = useStorefront()
  const [params, setParams] = useSearchParams()
  const [filterOpen, setFilterOpen] = useState(false)
  const categoryId = params.get('category') ?? ''
  const search = params.get('q') ?? ''
  const sort = (params.get('sort') as StorefrontSort | null) ?? 'newest'
  const page = Math.max(1, Number(params.get('page')) || 1)
  const base = `/store/${store.slug}`
  // Top-level category first, the selected one last
  const trail = categoryId ? ancestorsOf(store.categories, categoryId) : []
  const category = trail.at(-1)
  const topCategories = childrenOf(store.categories, null)
  // Subcategory chips: the children of the category being browsed. Shoppers can tick several at once
  // (e.g. Shirts and T-shirts under Men); they're kept in ?sub=id1,id2. A deep link straight to a leaf
  // category shows its siblings with that one ticked.
  const ownChildren = category ? childrenOf(store.categories, category.id) : []
  const isLeaf = !!category && ownChildren.length === 0 && !!category.parentId
  const chipParent = isLeaf ? store.categories.find((c) => c.id === category.parentId) : category
  const subcategories = chipParent ? childrenOf(store.categories, chipParent.id) : []
  const subParam = (params.get('sub') ?? '').split(',').filter((id) => subcategories.some((c) => c.id === id))
  const selectedSubs = subParam.length ? subParam : isLeaf ? [category.id] : []

  const toggleSub = (id: string) => {
    if (!chipParent) return
    const next = selectedSubs.includes(id) ? selectedSubs.filter((s) => s !== id) : [...selectedSubs, id]
    update({ category: chipParent.id, sub: next.length ? next.join(',') : null })
  }

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    if (!('page' in changes)) next.delete('page')
    setParams(next)
  }

  const query = useQuery({
    queryKey: ['storefront-products', store.slug, { categoryId, subs: selectedSubs.join(','), search, sort, page }],
    queryFn: () =>
      storefrontApi.products(store.slug, {
        categoryId: categoryId || undefined,
        categoryIds: selectedSubs.length ? selectedSubs.join(',') : undefined,
        search: search || undefined,
        sort,
        page,
        pageSize: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  })

  const selectedNames = selectedSubs.map((id) => subcategories.find((c) => c.id === id)?.name).filter(Boolean)
  const title = search
    ? `Results for "${search}"`
    : selectedNames.length
      ? `${chipParent?.name}: ${selectedNames.join(', ')}`
      : category?.name ?? 'All Products'
  const chip = (on: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm transition-colors ${
      on ? 'border-sf-primary bg-sf-primary text-sf-on-primary' : 'border-sf-line text-sf-muted hover:border-sf-text'
    }`
  const tab = (active: boolean) =>
    `whitespace-nowrap text-[15px] tracking-wide transition-colors ${active ? 'font-semibold text-sf-text' : 'text-sf-muted hover:text-sf-text'}`

  // The hero sits on the landing view only, so browsing, searching and paging stay compact
  const showHero = theme.hero !== 'none' && !search && !categoryId && page === 1
  const heroImages = (query.data?.items ?? []).flatMap((p) => (p.images[0] ? [p.images[0]] : []))

  return (
    <>
    {showHero && <StoreHero store={store} theme={theme} productImages={heroImages} />}
    <div id="products" className="mx-auto max-w-[1440px] scroll-mt-28 px-4 sm:px-12">
      <div className="pt-8">
        <Breadcrumb
          items={[
            { label: 'Home', to: base },
            ...(search ? [] : trail.slice(0, -1).map((c) => ({ label: c.name, to: `${base}?category=${c.id}` }))),
            { label: title },
          ]}
        />
      </div>

      <div className="mt-8 flex items-end justify-between gap-6">
        <div className="flex gap-9 overflow-x-auto pb-1">
          <button className={tab(!categoryId)} onClick={() => update({ category: null, sub: null })}>View All</button>
          {topCategories.map((c) => (
            <button key={c.id} className={tab(trail[0]?.id === c.id)} onClick={() => update({ category: c.id, sub: null })}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {subcategories.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2" role="group" aria-label={`Filter ${chipParent?.name ?? ''} by type`}>
          <button
            onClick={() => chipParent && update({ category: chipParent.id, sub: null })}
            aria-pressed={selectedSubs.length === 0}
            className={chip(selectedSubs.length === 0)}
          >
            All {chipParent?.name}
          </button>
          {subcategories.map((c) => {
            const on = selectedSubs.includes(c.id)
            return (
              <button key={c.id} onClick={() => toggleSub(c.id)} aria-pressed={on} className={chip(on)}>
                {on && <Check className="h-3.5 w-3.5" />}
                {c.name}
              </button>
            )
          })}
          {selectedSubs.length > 1 && <span className="text-xs text-sf-muted">{selectedSubs.length} selected</span>}
        </div>
      )}

      <div className="relative mt-10 flex justify-end">
        <button
          onClick={() => setFilterOpen((o) => !o)}
          className="flex items-center gap-2 text-sm tracking-[0.06em] uppercase underline underline-offset-4"
          aria-expanded={filterOpen}
        >
          Filter <Filter className="h-4 w-4" strokeWidth={1.5} />
        </button>
        {filterOpen && (
          <div className="absolute top-8 right-0 z-20 w-64 rounded-sf border border-sf-border bg-sf-bg p-5 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs sf-label tracking-[0.15em] text-sf-muted uppercase">Sort by</p>
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
                      className="accent-sf-primary"
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
                <span className="text-sf-muted">{page} / {query.data.totalPages}</span>
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
    </>
  )
}
