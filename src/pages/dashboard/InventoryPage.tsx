import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Package, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ConfirmModal } from '../../components/admin/ConfirmModal'
import { Pagination } from '../../components/admin/Pagination'
import { ProductFormModal } from '../../components/admin/ProductFormModal'
import { Badge, type BadgeTone } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input, Select } from '../../components/ui/Field'
import { PageLoader, Spinner } from '../../components/ui/Spinner'
import { labelOf, productStatusOptions, sizeOptions, type ProductStatus } from '../../constants/enums'
import { formatMoney, mediaUrl } from '../../lib/format'
import toast from 'react-hot-toast'
import { categoryOptions, PATH_SEPARATOR } from '../../lib/categories'
import { categoryApi, productApi } from '../../lib/services'
import type { Product } from '../../types/api'
import { useDashboard } from './DashboardLayout'

const statusTone: Record<ProductStatus, BadgeTone> = { Active: 'green', Draft: 'gray', OutOfStock: 'yellow', Archived: 'red' }

export default function InventoryPage() {
  const { store, onboarding, finishOnboarding } = useDashboard()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Product | 'new' | null>(onboarding ? 'new' : null)
  const [deleting, setDeleting] = useState<Product | null>(null)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const query = useQuery({
    queryKey: ['products', { page, categoryId, status, search }],
    queryFn: () => productApi.list({ page, pageSize: 12, categoryId: categoryId || undefined, status: status || undefined, search: search || undefined }),
    placeholderData: keepPreviousData,
  })

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: categoryApi.list })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productApi.remove(id),
    onSuccess: () => {
      toast.success('Item removed from inventory.')
      setDeleting(null)
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const closeForm = () => {
    setEditing(null)
    if (onboarding) finishOnboarding()
  }

  const hasFilters = !!(categoryId || status || search)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-sm text-gray-500">{query.data ? `${query.data.totalCount} ${query.data.totalCount === 1 ? 'item' : 'items'}` : 'Manage your stock'}</p>
        </div>
        <Button onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" /> Add item
        </Button>
      </div>

      <div className="mb-5 grid gap-3 rounded-3xl bg-white p-3 sm:grid-cols-[1fr_180px_180px]">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search name or SKU" className="pl-10" />
        </div>
        <Select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1) }} options={categoryOptions(categoriesQuery.data ?? [])} placeholder="All categories" />
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} options={productStatusOptions} placeholder="All statuses" />
      </div>

      {query.isPending ? (
        <PageLoader label="Loading inventory…" />
      ) : query.isError ? (
        <EmptyState icon={<Package />} title="Couldn't load inventory" text="Please try again." action={<Button onClick={() => query.refetch()}>Retry</Button>} />
      ) : query.data.items.length === 0 ? (
        <EmptyState
          icon={<Package />}
          title={hasFilters ? 'No matching items' : 'Your inventory is empty'}
          text={hasFilters ? 'Try a different search or filter.' : 'Add your first item to start selling.'}
          action={!hasFilters && <Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" /> Add item</Button>}
        />
      ) : (
        <>
          <div className="relative overflow-x-auto rounded-3xl bg-white">
            {query.isFetching && (
              <div className="absolute top-3 right-3 text-brand-700"><Spinner className="h-4 w-4" /></div>
            )}
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-gray-100 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-5 py-3 font-medium">Item</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Price</th>
                  <th className="px-5 py-3 font-medium">Cost</th>
                  <th className="px-5 py-3 font-medium">Stock</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {query.data.items.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-surface">
                          {p.images[0] && <img src={mediaUrl(p.images[0].imageUrl)} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{p.name}</p>
                          <p className="text-xs text-gray-500">
                            {p.sku}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">{p.categoryPath.map((c) => c.name).join(PATH_SEPARATOR) || p.categoryName}</td>
                    <td className="px-5 py-3">
                      {p.discountPrice ? (
                        <>
                          <span className="font-medium">{formatMoney(p.discountPrice, store.currency)}</span>{' '}
                          <span className="text-xs text-gray-400 line-through">{formatMoney(p.price, store.currency)}</span>
                        </>
                      ) : (
                        <span className="font-medium">{formatMoney(p.price, store.currency)}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {p.costPrice > 0 ? formatMoney(p.costPrice, store.currency) : <span className="text-xs text-amber-600">Not set</span>}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium">{p.stockQuantity}</p>
                      {p.variants.some((v) => v.size !== 'None') && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {p.variants.map((v) => (
                            <span
                              key={v.size}
                              className={`rounded-full px-2 py-0.5 text-[11px] ${v.stockQuantity === 0 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}
                            >
                              {labelOf(sizeOptions, v.size)}: {v.stockQuantity}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={statusTone[p.status]}>{labelOf(productStatusOptions, p.status)}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setEditing(p)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-brand-700" aria-label={`Edit ${p.name}`}>
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleting(p)} className="rounded-full p-2 text-gray-500 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${p.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={query.data.totalPages} onChange={setPage} />
        </>
      )}

      {editing && (
        <ProductFormModal
          open
          key={editing === 'new' ? 'new' : editing.id}
          product={editing === 'new' ? undefined : editing}
          currency={store.currency}
          onClose={closeForm}
          onSaved={() => {
            closeForm()
            queryClient.invalidateQueries({ queryKey: ['products'] })
          }}
        />
      )}

      <ConfirmModal
        open={!!deleting}
        title="Remove from inventory?"
        message={`"${deleting?.name}" and its images will be removed permanently.`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
