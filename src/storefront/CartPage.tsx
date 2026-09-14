import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatMoney, mediaUrl } from '../lib/format'
import { useCart } from './CartContext'
import { useStorefront } from './StorefrontLayout'
import { Breadcrumb, QuantityStepper, StoreButton, StoreEmpty } from './ui'

export default function CartPage() {
  const { store } = useStorefront()
  const { items, subtotal, setQuantity, remove } = useCart()
  const navigate = useNavigate()
  const base = `/store/${store.slug}`

  if (items.length === 0) {
    return (
      <StoreEmpty
        title="Your bag is empty"
        text="Browse the store and add something you like."
        action={<Link to={base}><StoreButton>Start shopping</StoreButton></Link>}
      />
    )
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-12">
      <div className="pt-8">
        <Breadcrumb items={[{ label: 'Home', to: base }, { label: 'Shopping Bag' }]} />
      </div>
      <h1 className="mt-8 text-2xl tracking-wide">Shopping Bag <span className="text-neutral-400">({items.length})</span></h1>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_380px]">
        <ul className="border-t border-neutral-200">
          {items.map((i) => (
            <li key={i.productId} className="flex gap-5 border-b border-neutral-200 py-6">
              <Link to={`${base}/p/${i.productId}`} className="aspect-[3/4] w-24 shrink-0 bg-neutral-100 sm:w-28">
                {i.image && <img src={mediaUrl(i.image)} alt="" className="h-full w-full object-cover" />}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <Link to={`${base}/p/${i.productId}`} className="text-[15px] tracking-wide hover:underline">{i.name}</Link>
                  <p className="text-[15px] whitespace-nowrap">{formatMoney(i.unitPrice * i.quantity, store.currency)}</p>
                </div>
                <p className="mt-1 text-sm text-neutral-500">{formatMoney(i.unitPrice, store.currency)} each</p>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <QuantityStepper value={i.quantity} max={i.maxQuantity} onChange={(q) => setQuantity(i.productId, q)} />
                  <button onClick={() => remove(i.productId)} className="text-sm text-neutral-500 underline underline-offset-4 hover:text-neutral-900">
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <OrderSummary subtotal={subtotal} currency={store.currency}>
          <StoreButton className="w-full" onClick={() => navigate(`${base}/checkout`)}>Checkout</StoreButton>
        </OrderSummary>
      </div>
    </div>
  )
}

export function OrderSummary({ subtotal, currency, children }: { subtotal: number; currency: string; children?: ReactNode }) {
  return (
    <aside className="h-fit border border-neutral-200 p-6">
      <h2 className="text-sm tracking-[0.1em] uppercase">Order summary</h2>
      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between"><dt className="text-neutral-500">Subtotal</dt><dd>{formatMoney(subtotal, currency)}</dd></div>
        <div className="flex justify-between"><dt className="text-neutral-500">Delivery</dt><dd>Free</dd></div>
        <div className="flex justify-between"><dt className="text-neutral-500">Payment</dt><dd>Cash on delivery</dd></div>
        <div className="flex justify-between border-t border-neutral-200 pt-4 text-base"><dt>Total</dt><dd>{formatMoney(subtotal, currency)}</dd></div>
      </dl>
      {children && <div className="mt-6">{children}</div>}
    </aside>
  )
}
