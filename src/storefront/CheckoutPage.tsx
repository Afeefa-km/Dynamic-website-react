import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2 } from 'lucide-react'
import { forwardRef, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate } from 'react-router-dom'
import { z } from 'zod'
import { labelOf, sizeOptions } from '../constants/enums'
import { formatMoney } from '../lib/format'
import { storefrontApi } from '../lib/services'
import { emailField, phoneField } from '../lib/validation'
import type { Order } from '../types/api'
import { OrderSummary } from './CartPage'
import { useCart } from './CartContext'
import { useStorefront } from './StorefrontLayout'
import { Breadcrumb, StoreButton } from './ui'

const schema = z.object({
  customerName: z.string().trim().min(2, 'Name is required').max(150),
  customerEmail: emailField(),
  customerPhone: phoneField('Phone'),
  shippingAddress: z.string().trim().min(5, 'Enter your full delivery address').max(500),
  notes: z.string().trim().max(500).optional(),
})

type FormValues = z.infer<typeof schema>

const control = 'w-full rounded-sf border border-sf-line bg-sf-bg px-4 py-3 text-sm outline-none focus:border-sf-text aria-invalid:border-sf-sale'

const StoreInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function StoreInput(props, ref) {
  return <input ref={ref} {...props} className={control} />
})
const StoreTextarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function StoreTextarea(props, ref) {
  return <textarea ref={ref} rows={3} {...props} className={control} />
})

function StoreField({ label, error, children, className = '' }: { label: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block sf-label text-xs text-sf-muted">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-sf-sale">{error}</span>}
    </label>
  )
}

export default function CheckoutPage() {
  const { store } = useStorefront()
  const { items, subtotal, clear } = useCart()
  const queryClient = useQueryClient()
  const [placed, setPlaced] = useState<Order | null>(null)
  const base = `/store/${store.slug}`
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      storefrontApi.placeOrder(store.slug, { ...values, items: items.map((i) => ({ productId: i.productId, size: i.size, quantity: i.quantity })) }),
    onSuccess: (order) => {
      setPlaced(order)
      clear()
      queryClient.invalidateQueries({ queryKey: ['storefront-products', store.slug] })
      queryClient.invalidateQueries({ queryKey: ['storefront-product', store.slug] })
    },
  })

  if (placed) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12" strokeWidth={1.25} />
        <h1 className="sf-heading mt-6 text-2xl">Thank you for your order</h1>
        <p className="mt-3 text-sm leading-relaxed text-sf-muted">
          Order <span className="text-sf-text">{placed.orderNumber}</span> for{' '}
          <span className="text-sf-text">{formatMoney(placed.totalAmount, store.currency)}</span> has been placed.
          {' '}{store.name} will contact you at {placed.customerPhone} to confirm delivery.
        </p>
        <Link to={base}><StoreButton className="mt-10">Continue shopping</StoreButton></Link>
      </div>
    )
  }

  if (items.length === 0) return <Navigate to={`${base}/cart`} replace />

  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-12">
      <div className="pt-8">
        <Breadcrumb items={[{ label: 'Home', to: base }, { label: 'Bag', to: `${base}/cart` }, { label: 'Checkout' }]} />
      </div>
      <h1 className="sf-heading mt-8 text-2xl">Checkout</h1>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_380px]">
        <form id="checkout" onSubmit={handleSubmit((v) => mutation.mutate(v))} className="grid gap-5 sm:grid-cols-2" noValidate>
          <p className="sf-label text-sm sm:col-span-2">Delivery details</p>
          <StoreField label="Full name *" error={errors.customerName?.message} className="sm:col-span-2">
            <StoreInput {...register('customerName')} autoComplete="name" aria-invalid={!!errors.customerName} />
          </StoreField>
          <StoreField label="Email *" error={errors.customerEmail?.message}>
            <StoreInput {...register('customerEmail')} type="email" autoComplete="email" aria-invalid={!!errors.customerEmail} />
          </StoreField>
          <StoreField label="Phone *" error={errors.customerPhone?.message}>
            <StoreInput {...register('customerPhone')} type="tel" autoComplete="tel" aria-invalid={!!errors.customerPhone} />
          </StoreField>
          <StoreField label="Delivery address *" error={errors.shippingAddress?.message} className="sm:col-span-2">
            <StoreTextarea {...register('shippingAddress')} autoComplete="street-address" aria-invalid={!!errors.shippingAddress} />
          </StoreField>
          <StoreField label="Order notes" error={errors.notes?.message} className="sm:col-span-2">
            <StoreTextarea {...register('notes')} rows={2} placeholder="Anything the store should know?" />
          </StoreField>
        </form>

        <OrderSummary subtotal={subtotal} currency={store.currency}>
          <ul className="mb-5 space-y-2 border-b border-sf-border pb-5 text-sm text-sf-muted">
            {items.map((i) => (
              <li key={i.key} className="flex justify-between gap-3">
                <span className="truncate">{i.quantity} × {i.name}{i.size !== 'None' && ` (${labelOf(sizeOptions, i.size)})`}</span>
                <span className="whitespace-nowrap">{formatMoney(i.quantity * i.unitPrice, store.currency)}</span>
              </li>
            ))}
          </ul>
          <StoreButton type="submit" form="checkout" className="w-full" loading={mutation.isPending}>Place order</StoreButton>
        </OrderSummary>
      </div>
    </div>
  )
}
