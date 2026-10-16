import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { labelOf, sizeOptions } from '../constants/enums'
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
      <h1 className="sf-heading mt-8 text-2xl">Shopping Bag <span className="text-sf-subtle">({items.length})</span></h1>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_380px]">
        <ul className="border-t border-sf-border">
          {items.map((i) => (
            <li key={i.key} className="flex gap-5 border-b border-sf-border py-6">
              <Link to={`${base}/p/${i.productId}`} className="aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-sf bg-sf-surface sm:w-28">
                {i.image && <img src={mediaUrl(i.image)} alt="" className="h-full w-full object-cover" />}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <Link to={`${base}/p/${i.productId}`} className="text-[15px] tracking-wide hover:underline">{i.name}</Link>
                  <p className="text-[15px] whitespace-nowrap">{formatMoney(i.unitPrice * i.quantity, store.currency)}</p>
                </div>
                <p className="mt-1 text-sm text-sf-muted">
                  {i.size !== 'None' && <>Size {labelOf(sizeOptions, i.size)} · </>}
                  {formatMoney(i.unitPrice, store.currency)} each
                </p>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <QuantityStepper value={i.quantity} max={i.maxQuantity} onChange={(q) => setQuantity(i.key, q)} />
                  <button onClick={() => remove(i.key)} className="text-sm text-sf-muted underline underline-offset-4 hover:text-sf-text">
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
    <aside className="h-fit rounded-sf border border-sf-border p-6">
      <h2 className="sf-label text-sm">Order summary</h2>
      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between"><dt className="text-sf-muted">Subtotal</dt><dd>{formatMoney(subtotal, currency)}</dd></div>
        <div className="flex justify-between"><dt className="text-sf-muted">Delivery</dt><dd>Free</dd></div>
        <div className="flex justify-between"><dt className="text-sf-muted">Payment</dt><dd>Cash on delivery</dd></div>
        <div className="flex justify-between border-t border-sf-border pt-4 text-base"><dt>Total</dt><dd>{formatMoney(subtotal, currency)}</dd></div>
      </dl>
      {children && <div className="mt-6">{children}</div>}
    </aside>
  )
}
