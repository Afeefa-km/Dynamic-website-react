import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { Pagination } from '../../components/admin/Pagination'
import { Badge, type BadgeTone } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Select } from '../../components/ui/Field'
import { PageLoader } from '../../components/ui/Spinner'
import { orderStatusOptions, type OrderStatus } from '../../constants/enums'
import { formatDate, formatMoney } from '../../lib/format'
import { orderApi } from '../../lib/services'
import { useDashboard } from './DashboardLayout'

const tone: Record<OrderStatus, BadgeTone> = { Pending: 'yellow', Confirmed: 'blue', Shipped: 'blue', Delivered: 'green', Cancelled: 'red' }

export default function OrdersPage() {
  const { store } = useDashboard()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['orders', { page, status }],
    queryFn: () => orderApi.list({ page, pageSize: 12, status: status || undefined }),
    placeholderData: keepPreviousData,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: OrderStatus }) => orderApi.updateStatus(id, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['products'] }) // cancelling restocks inventory
    },
  })

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm text-gray-500">{query.data ? `${query.data.totalCount} orders` : 'Orders placed on your store'}</p>
        </div>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} options={orderStatusOptions} placeholder="All statuses" className="w-44" />
      </div>

      {query.isPending ? (
        <PageLoader label="Loading orders…" />
      ) : query.isError ? (
        <EmptyState icon={<ShoppingCart />} title="Couldn't load orders" text="Please try again." action={<Button onClick={() => query.refetch()}>Retry</Button>} />
      ) : query.data.items.length === 0 ? (
        <EmptyState icon={<ShoppingCart />} title="No orders yet" text="Share your store link — new orders will show up here." />
      ) : (
        <>
          <div className="space-y-3">
            {query.data.items.map((o) => {
              const locked = o.status === 'Cancelled' || o.status === 'Delivered'
              const updating = statusMutation.isPending && statusMutation.variables?.id === o.id
              return (
                <div key={o.id} className="rounded-3xl bg-white p-5">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <div className="min-w-40">
                      <p className="font-semibold">{o.orderNumber}</p>
                      <p className="text-xs text-gray-500">{formatDate(o.createdAt)}</p>
                    </div>
                    <div className="min-w-40 flex-1">
                      <p className="text-sm font-medium">{o.customerName}</p>
                      <p className="text-xs text-gray-500">{o.customerPhone}</p>
                    </div>
                    <p className="font-semibold">{formatMoney(o.totalAmount, store.currency)}</p>
                    <Badge tone={tone[o.status]}>{o.status}</Badge>
                    <Select
                      value={o.status}
                      disabled={locked || updating}
                      onChange={(e) => statusMutation.mutate({ id: o.id, value: e.target.value as OrderStatus })}
                      options={orderStatusOptions}
                      className="w-36"
                      aria-label="Change status"
                    />
                    <button onClick={() => setExpanded(expanded === o.id ? null : o.id)} className="rounded-full p-2 hover:bg-gray-100" aria-label="Toggle details">
                      <ChevronDown className={`h-4 w-4 transition-transform ${expanded === o.id ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {expanded === o.id && (
                    <div className="mt-4 grid gap-4 border-t border-gray-100 pt-4 text-sm sm:grid-cols-2">
                      <div>
                        <p className="mb-2 font-medium">Items</p>
                        <ul className="space-y-1">
                          {o.items.map((i, idx) => (
                            <li key={idx} className="flex justify-between gap-4">
                              <span>{i.quantity} × {i.productName} <span className="text-xs text-gray-400">{i.sku}</span></span>
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
                  )}
                </div>
              )
            })}
          </div>
          <Pagination page={page} totalPages={query.data.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  )
}
