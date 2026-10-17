import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Bell, PackageCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { labelOf, sizeOptions } from '../../constants/enums'
import { productApi } from '../../lib/services'

/**
 * Header bell for the store owner. Lists every size that has dropped below the low-stock threshold,
 * worked out from live stock, so a notice disappears on its own once the size is restocked.
 */
export function LowStockBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const query = useQuery({
    queryKey: ['low-stock'],
    queryFn: productApi.lowStock,
    // Orders come in from shoppers, so check again regularly
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })

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

  const items = query.data?.items ?? []
  const threshold = query.data?.threshold ?? 5
  const count = items.length

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100 hover:text-brand-700"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={count ? `Notifications: ${count} low stock` : 'Notifications'}
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div role="dialog" aria-label="Notifications" className="absolute right-0 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-100 bg-white shadow-xl">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            <p className="text-xs text-gray-500">Sizes with fewer than {threshold} left</p>
          </div>

          {count === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
              <PackageCheck className="h-7 w-7 text-brand-600" />
              <p className="text-sm font-medium text-gray-900">All stocked up</p>
              <p className="text-xs text-gray-500">You'll see a notice here when a size drops below {threshold}.</p>
            </div>
          ) : (
            <ul className="max-h-96 divide-y divide-gray-100 overflow-y-auto">
              {items.map((item) => (
                <li key={`${item.productId}-${item.size}`}>
                  <Link
                    to={`/dashboard/inventory?search=${item.productCode}`}
                    onClick={() => setOpen(false)}
                    className="flex gap-3 px-4 py-3 hover:bg-gray-50"
                  >
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-label="Warning" />
                    <div className="min-w-0 text-sm">
                      <p className="truncate font-medium text-gray-900">{item.productName}</p>
                      <p className="text-gray-600">
                        {item.size !== 'None' && (
                          <>
                            Size <span className="font-semibold text-red-600">{labelOf(sizeOptions, item.size)}</span>
                            {' · '}
                          </>
                        )}
                        {item.stockQuantity === 0 ? (
                          <span className="font-semibold text-red-600">Out of stock</span>
                        ) : (
                          <>
                            Only <span className="font-semibold text-red-600">{item.stockQuantity}</span> left
                          </>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">Code {item.productCode}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
