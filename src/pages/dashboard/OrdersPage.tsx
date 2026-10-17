import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Search, ShoppingCart } from 'lucide-react'
import { Fragment, useEffect, useState } from 'react'
import { Pagination } from '../../components/admin/Pagination'
import { Badge, type BadgeTone } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input, Select } from '../../components/ui/Field'
import { PageLoader, Spinner } from '../../components/ui/Spinner'
import { labelOf, orderStatusOptions, sizeOptions, type OrderStatus } from '../../constants/enums'
import { formatDate, formatMoney } from '../../lib/format'
import { orderApi } from '../../lib/services'
import { useDashboard } from './DashboardLayout'

const tone: Record<OrderStatus, BadgeTone> = { Pending: 'yellow', Confirmed: 'blue', Shipped: 'indigo', Delivered: 'green', Cancelled: 'red' }

const periodOptions = [
  { value: '1', label: 'Today' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
]

export default function OrdersPage() {
  const { store } = useDashboard()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [days, setDays] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const query = useQuery({
    queryKey: ['orders', { page, status, days, search }],
    queryFn: () =>
      orderApi.list({ page, pageSize: 12, status: status || undefined, days: days ? Number(days) : undefined, search: search || undefined }),
    placeholderData: keepPreviousData,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: OrderStatus }) => orderApi.updateStatus(id, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['orders-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['products'] }) // cancelling restocks inventory
      queryClient.invalidateQueries({ queryKey: ['low-stock'] })
    },
  })

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      return next
    })

  const hasFilters = !!(status || days || search)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm text-gray-500">
            {query.data ? `${query.data.totalCount} ${query.data.totalCount === 1 ? 'order' : 'orders'}` : 'Orders placed on your store'}
          </p>
        </div>
      </div>

      <div className="mb-5 grid gap-3 rounded-3xl bg-white p-3 sm:grid-cols-[1fr_180px_180px]">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search order no., customer, phone or email" className="pl-10" />
        </div>
        <Select value={days} onChange={(e) => { setDays(e.target.value); setPage(1) }} options={periodOptions} placeholder="All time" />
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} options={orderStatusOptions} placeholder="All statuses" />
      </div>

      {query.isPending ? (
        <PageLoader label="Loading orders…" />
      ) : query.isError ? (
        <EmptyState icon={<ShoppingCart />} title="Couldn't load orders" text="Please try again." action={<Button onClick={() => query.refetch()}>Retry</Button>} />
      ) : query.data.items.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart />}
          title={hasFilters ? 'No matching orders' : 'No orders yet'}
          text={hasFilters ? 'Try a different search or filter.' : 'Share your store link — new orders will show up here.'}
        />
      ) : (
        <>
          <div className="relative overflow-x-auto rounded-3xl bg-white">
            {query.isFetching && (
              <div className="absolute top-3 right-3 text-brand-700"><Spinner className="h-4 w-4" /></div>
            )}
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-gray-100 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Items</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Update</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {query.data.items.map((o) => {
                  const locked = o.status === 'Cancelled' || o.status === 'Delivered'
                  const updating = statusMutation.isPending && statusMutation.variables?.id === o.id
                  const open = expanded.has(o.id)
                  const itemCount = o.items.reduce((n, i) => n + i.quantity, 0)
                  return (
                    <Fragment key={o.id}>
                      <tr className="cursor-pointer hover:bg-gray-50" onClick={() => toggle(o.id)}>
                        <td className="px-5 py-3">
                          <p className="font-medium">{o.orderNumber}</p>
                          <p className="text-xs text-gray-500">{formatDate(o.createdAt)}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-medium">{o.customerName}</p>
                          <p className="text-xs text-gray-500">{o.customerPhone}</p>
                        </td>
                        <td className="px-5 py-3">{itemCount}</td>
                        <td className="px-5 py-3 font-medium">{formatMoney(o.totalAmount, store.currency)}</td>
                        <td className="px-5 py-3">
                          <Badge tone={tone[o.status]}>{labelOf(orderStatusOptions, o.status)}</Badge>
                        </td>
                        <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={o.status}
                            disabled={locked || updating}
                            onChange={(e) => statusMutation.mutate({ id: o.id, value: e.target.value as OrderStatus })}
                            options={orderStatusOptions}
                            compact
                            className="w-36"
                            aria-label={`Change status of ${o.orderNumber}`}
                          />
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggle(o.id) }}
                              className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-brand-700"
                              aria-label={`${open ? 'Hide' : 'Show'} details of ${o.orderNumber}`}
                              aria-expanded={open}
                            >
                              <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {open && (
                        <tr>
                          <td colSpan={7} className="px-5 pb-5">
                            <div className="grid gap-4 rounded-2xl bg-surface p-4 sm:grid-cols-2">
                              <div>
                                <p className="mb-2 font-medium">Items</p>
                                <ul className="space-y-1">
                                  {o.items.map((i, idx) => (
                                    <li key={idx} className="flex justify-between gap-4">
                                      <span>
                                        {i.quantity} × {i.productName}
                                        {i.size && i.size !== 'None' && ` (${labelOf(sizeOptions, i.size)})`}{' '}
                                        <span className="text-xs text-gray-400">{i.sku}</span>
                                      </span>
                                      <span>{formatMoney(i.lineTotal, store.currency)}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="space-y-1 text-gray-600">
                                <p className="font-medium text-gray-900">Deliver to</p>
                                <p>{o.shippingAddress}</p>
                                <p>{o.customerEmail}</p>
                                {o.notes && <p className="italic">“{o.notes}”</p>}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={query.data.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  )
}
