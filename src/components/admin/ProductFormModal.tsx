import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { PRODUCT_SIZES, PRODUCT_STATUSES, productStatusOptions, sizeOptions } from '../../constants/enums'
import { formatMoney, mediaUrl } from '../../lib/format'
import { categoryApi, productApi } from '../../lib/services'
import { toNumber } from '../../lib/validation'
import type { Product } from '../../types/api'
import { Button } from '../ui/Button'
import { Field, Input, Select, Textarea } from '../ui/Field'
import { ImagePicker, type PickedImage } from '../ui/ImagePicker'
import { Modal } from '../ui/Modal'

type DiscountMode = 'amount' | 'percent'

const round2 = (n: number) => Math.round(n * 100) / 100

const schema = z
  .object({
    name: z.string().trim().min(2, 'Item name must be at least 2 characters').max(200),
    description: z.string().trim().max(2000).optional(),
    categoryId: z.string().min(1, 'Select a category'),
    price: z.number({ message: 'Price is required' }).positive('Price must be greater than 0').max(1_000_000),
    discountMode: z.enum(['amount', 'percent']),
    // Either the sale price (amount mode) or the % off (percent mode)
    discountValue: z.number().positive('Must be greater than 0').optional(),
    size: z.enum(PRODUCT_SIZES),
    stockQuantity: z.number({ message: 'Stock is required' }).int('Whole numbers only').min(0).max(100_000),
    status: z.enum(PRODUCT_STATUSES),
  })
  .superRefine((v, ctx) => {
    if (v.discountValue === undefined) return
    if (v.discountMode === 'percent' && v.discountValue >= 100) {
      ctx.addIssue({ code: 'custom', path: ['discountValue'], message: 'Percentage must be less than 100' })
    }
    if (v.discountMode === 'amount' && v.discountValue >= v.price) {
      ctx.addIssue({ code: 'custom', path: ['discountValue'], message: 'Discount price must be less than the price' })
    }
    if (v.discountMode === 'percent' && round2(v.price * (1 - v.discountValue / 100)) <= 0) {
      ctx.addIssue({ code: 'custom', path: ['discountValue'], message: 'Discount is too large for this price' })
    }
  })

type FormValues = z.infer<typeof schema>

/** Converts the form's discount input into the sale price stored by the API. */
function toDiscountPrice(price: number | undefined, mode: DiscountMode, value: number | undefined) {
  if (!price || !value || Number.isNaN(price) || Number.isNaN(value)) return undefined
  return mode === 'percent' ? round2(price * (1 - value / 100)) : value
}

interface Props {
  open: boolean
  product?: Product
  currency: string
  onClose: () => void
  onSaved: () => void
}

export function ProductFormModal({ open, product, currency, onClose, onSaved }: Props) {
  const queryClient = useQueryClient()
  const [images, setImages] = useState<PickedImage[]>(
    product?.images.map((i) => ({ key: i.id, url: mediaUrl(i.imageUrl) })) ?? [],
  )
  const [removedIds, setRemovedIds] = useState<string[]>([])
  const [progress, setProgress] = useState('')
  const [newCategory, setNewCategory] = useState<string | null>(null)

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: categoryApi.list })

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: product
      ? {
          name: product.name,
          description: product.description,
          categoryId: product.categoryId,
          price: product.price,
          discountMode: 'amount',
          discountValue: product.discountPrice ?? undefined,
          size: product.size,
          stockQuantity: product.stockQuantity,
          status: product.status,
        }
      : { categoryId: '', discountMode: 'amount', size: 'None', status: 'Active', stockQuantity: 1 },
  })

  const [price, discountMode, discountValue] = watch(['price', 'discountMode', 'discountValue'])

  const createCategory = useMutation({
    mutationFn: (name: string) => categoryApi.create(name),
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setNewCategory(null)
      // Add the option immediately so it can be selected before the refetch lands
      queryClient.setQueryData(['categories'], (old: typeof categoriesQuery.data) => [...(old ?? []), category])
      setValue('categoryId', category.id, { shouldValidate: true })
    },
  })

  const switchMode = (mode: DiscountMode) => {
    if (mode === discountMode) return
    // Convert the current value so the owner doesn't lose what they typed
    let converted: number | undefined
    if (price && discountValue && !Number.isNaN(discountValue)) {
      converted = mode === 'percent' ? round2((1 - discountValue / price) * 100) : round2(price * (1 - discountValue / 100))
      if (converted <= 0) converted = undefined
    }
    setValue('discountMode', mode)
    setValue('discountValue', converted, { shouldValidate: !!converted })
  }

  const salePrice = toDiscountPrice(price, discountMode, discountValue)
  const discountHint = (() => {
    if (!salePrice || !price || salePrice >= price || salePrice <= 0) return undefined
    const saved = round2(price - salePrice)
    const pct = round2((saved / price) * 100)
    return discountMode === 'percent'
      ? `Discount amount: ${formatMoney(saved, currency)} · Sale price ${formatMoney(salePrice, currency)}`
      : `Discount: ${pct}% off · Saves ${formatMoney(saved, currency)}`
  })()

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { discountMode: mode, discountValue: value, ...rest } = values
      const body = { ...rest, discountPrice: toDiscountPrice(values.price, mode, value) ?? null }
      setProgress('Saving item…')
      const saved = product ? await productApi.update(product.id, body) : await productApi.create(body)

      for (const id of removedIds) {
        await productApi.removeImage(saved.id, id)
      }

      // Upload new images one at a time; a failed image shouldn't lose the item
      const newFiles = images.filter((i) => i.file)
      let failed = 0
      for (const [index, img] of newFiles.entries()) {
        setProgress(`Uploading image ${index + 1} of ${newFiles.length}…`)
        try {
          await productApi.uploadImage(saved.id, img.file!)
        } catch {
          failed++
        }
      }
      return { saved, failed }
    },
    onSuccess: ({ failed }) => {
      if (failed) toast.error(`${failed} image(s) failed to upload. You can retry by editing the item.`)
      toast.success(product ? 'Inventory item updated.' : 'Item added to inventory.')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      onSaved()
    },
    onSettled: () => setProgress(''),
  })

  const busy = mutation.isPending
  const formId = 'product-form'
  const num = { setValueAs: toNumber }
  const categoryOptions = (categoriesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name }))
  const modeBtn = (mode: DiscountMode, label: string) => (
    <button
      type="button"
      onClick={() => switchMode(mode)}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${discountMode === mode ? 'bg-brand-700 text-white' : 'text-gray-600 hover:text-brand-700'}`}
      aria-pressed={discountMode === mode}
    >
      {label}
    </button>
  )

  return (
    <Modal
      open={open}
      onClose={busy ? undefined : onClose}
      size="lg"
      title={product ? 'Edit inventory item' : 'Add inventory item'}
      subtitle={product ? `SKU ${product.sku}` : 'SKU is generated automatically when you save.'}
      footer={
        <>
          {progress && <span className="mr-auto self-center text-sm text-gray-500">{progress}</span>}
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={busy}>
            {product ? 'Save changes' : 'Add to inventory'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit((v) => mutation.mutate(v))} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Item name" required error={errors.name?.message} className="sm:col-span-2">
          <Input {...register('name')} placeholder="Classic cotton tee" aria-invalid={!!errors.name} />
        </Field>
        <Field label="Description" error={errors.description?.message} className="sm:col-span-2">
          <Textarea {...register('description')} placeholder="Material, fit, care instructions…" />
        </Field>

        <div className="sm:col-span-1">
          <Field label="Category" required error={errors.categoryId?.message}>
            <Select
              {...register('categoryId')}
              options={categoryOptions}
              placeholder={categoriesQuery.isPending ? 'Loading…' : categoryOptions.length ? 'Select category' : 'No categories yet'}
              disabled={categoriesQuery.isPending}
              aria-invalid={!!errors.categoryId}
            />
          </Field>
          {newCategory === null ? (
            <button type="button" onClick={() => setNewCategory('')} className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">
              <Plus className="h-3.5 w-3.5" /> Create new category
            </button>
          ) : (
            <div className="mt-2 flex gap-2">
              <Input
                autoFocus
                value={newCategory}
                maxLength={60}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (newCategory.trim()) createCategory.mutate(newCategory.trim())
                  }
                }}
                placeholder="e.g. Sneakers"
                aria-label="New category name"
                className="py-2"
              />
              <Button type="button" onClick={() => createCategory.mutate(newCategory.trim())} disabled={!newCategory.trim()} loading={createCategory.isPending} className="shrink-0 px-4 py-2">
                Add
              </Button>
              <Button type="button" variant="ghost" onClick={() => setNewCategory(null)} className="shrink-0 px-3 py-2">
                Cancel
              </Button>
            </div>
          )}
        </div>

        <Field label="Size" error={errors.size?.message}>
          <Select {...register('size')} options={sizeOptions} />
        </Field>
        <Field label={`Price (${currency})`} required error={errors.price?.message}>
          <Input {...register('price', num)} type="number" step="0.01" min="0" aria-invalid={!!errors.price} />
        </Field>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-gray-700">Discount</span>
            <div className="flex rounded-full bg-gray-100 p-0.5" role="group" aria-label="Discount type">
              {modeBtn('amount', currency)}
              {modeBtn('percent', '%')}
            </div>
          </div>
          <div className="relative">
            <Input
              {...register('discountValue', num)}
              type="number"
              step={discountMode === 'percent' ? '1' : '0.01'}
              min="0"
              max={discountMode === 'percent' ? '99' : undefined}
              placeholder={discountMode === 'percent' ? 'e.g. 20' : 'Sale price'}
              aria-label={discountMode === 'percent' ? 'Discount percentage' : 'Discount price'}
              aria-invalid={!!errors.discountValue}
              className="pr-12"
            />
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-gray-400">
              {discountMode === 'percent' ? '%' : currency}
            </span>
          </div>
          {errors.discountValue ? (
            <span className="mt-1 block text-xs text-red-600">{errors.discountValue.message}</span>
          ) : discountHint ? (
            <span className="mt-1 block text-xs font-medium text-brand-600">{discountHint}</span>
          ) : (
            <span className="mt-1 block text-xs text-gray-500">
              Optional — {discountMode === 'percent' ? 'enter % off' : 'enter the sale price'}
            </span>
          )}
        </div>

        <Field label="Stock quantity" required error={errors.stockQuantity?.message}>
          <Input {...register('stockQuantity', num)} type="number" step="1" min="0" aria-invalid={!!errors.stockQuantity} />
        </Field>
        <Field label="Status" required error={errors.status?.message}>
          <Select {...register('status')} options={productStatusOptions} />
        </Field>
        <Field label="Images" hint="Up to 8 images, 5MB each. The first image is the cover." className="sm:col-span-2">
          <ImagePicker
            images={images}
            disabled={busy}
            onAdd={(files) =>
              setImages((prev) => [
                ...prev,
                ...files.map((f) => ({ key: `${f.name}-${f.lastModified}-${Math.random()}`, url: URL.createObjectURL(f), file: f })),
              ])
            }
            onRemove={(img) => {
              setImages((prev) => prev.filter((i) => i.key !== img.key))
              if (!img.file) setRemovedIds((prev) => [...prev, img.key])
            }}
          />
        </Field>
      </form>
    </Modal>
  )
}
