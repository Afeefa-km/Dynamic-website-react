import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Boxes, FileText, ImageIcon, type LucideIcon, Plus, ScrollText, Tag, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { PRODUCT_SIZES, PRODUCT_STATUSES, productStatusOptions, sizeOptions } from '../../constants/enums'
import { formatMoney, mediaUrl } from '../../lib/format'
import { categoryApi, productApi, sizeChartApi } from '../../lib/services'
import { toNumber } from '../../lib/validation'
import type { Product } from '../../types/api'
import { Button } from '../ui/Button'
import { CategoryTreeSelect } from './CategoryTreeSelect'
import { SizeChartFormModal } from './SizeChartFormModal'
import { Field, fieldLabel, Input, Select, Textarea } from '../ui/Field'
import { ImagePicker, type PickedImage } from '../ui/ImagePicker'
import { Modal } from '../ui/Modal'

type DiscountMode = 'amount' | 'percent'

/** Keep in sync with CoreConstants.Products.DetailsMaxLength on the API */
const DETAILS_MAX = 10_000

type SectionId = 'basic' | 'pricing' | 'stock' | 'details' | 'images'

// The first section is the essentials; the rest are listed under "More details" in the side menu.
// `fields` are the form fields a section owns, used to flag it and jump to it when validation fails.
const SECTIONS: { id: SectionId; label: string; icon: LucideIcon; required?: boolean; fields: string[] }[] = [
  { id: 'basic', label: 'Basic details', icon: FileText, required: true, fields: ['name', 'categoryId', 'status', 'description'] },
  { id: 'pricing', label: 'Pricing', icon: Tag, required: true, fields: ['price', 'costPrice', 'discountValue'] },
  { id: 'stock', label: 'Sizes & stock', icon: Boxes, fields: ['variants', 'sizeChartId'] },
  { id: 'details', label: 'Product details', icon: ScrollText, fields: ['details'] },
  { id: 'images', label: 'Images', icon: ImageIcon, fields: [] },
]

const round2 = (n: number) => Math.round(n * 100) / 100

const schema = z
  .object({
    name: z.string().trim().min(2, 'Item name must be at least 2 characters').max(200),
    description: z.string().trim().max(2000).optional(),
    details: z.string().trim().max(DETAILS_MAX, `Product details must be ${DETAILS_MAX.toLocaleString()} characters or fewer`).optional(),
    categoryId: z.string().min(1, 'Select a category'),
    price: z.number({ message: 'Price is required' }).positive('Price must be greater than 0').max(1_000_000),
    // Optional: left blank it is saved as 0, which the dashboard treats as "not entered"
    costPrice: z.number().min(0, 'Purchase price can\'t be negative').max(1_000_000).optional(),
    discountMode: z.enum(['amount', 'percent']),
    // Either the sale price (amount mode) or the % off (percent mode)
    discountValue: z.number().positive('Must be greater than 0').optional(),
    variants: z
      .array(
        z.object({
          size: z.enum(PRODUCT_SIZES),
          // Optional: a blank quantity is saved as 0 and can be filled in later
          stockQuantity: z.number().int('Whole numbers only').min(0, 'Min 0').max(100_000).optional(),
        }),
      ),
    status: z.enum(PRODUCT_STATUSES),
    // '' means no size chart
    sizeChartId: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    const seen = new Set<string>()
    v.variants.forEach((variant, index) => {
      if (seen.has(variant.size)) {
        ctx.addIssue({ code: 'custom', path: ['variants', index, 'size'], message: 'Size already added' })
      }
      if (variant.size === 'None' && v.variants.length > 1) {
        ctx.addIssue({ code: 'custom', path: ['variants', index, 'size'], message: 'Choose a size' })
      }
      seen.add(variant.size)
    })
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
  const [section, setSection] = useState<SectionId>('basic')

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: categoryApi.list })
  const sizeChartsQuery = useQuery({ queryKey: ['size-charts'], queryFn: sizeChartApi.list })
  const [creatingChart, setCreatingChart] = useState(false)

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: product
      ? {
          name: product.name,
          description: product.description,
          details: product.details,
          categoryId: product.categoryId,
          sizeChartId: product.sizeChartId ?? '',
          price: product.price,
          // 0 means it was never entered, so leave the field blank rather than suggest the item was free
          costPrice: product.costPrice || undefined,
          discountMode: 'amount',
          discountValue: product.discountPrice ?? undefined,
          variants: product.variants.length ? product.variants : [{ size: 'None', stockQuantity: undefined }],
          status: product.status,
        }
      : { categoryId: '', sizeChartId: '', discountMode: 'amount', status: 'Active', variants: [{ size: 'None', stockQuantity: undefined }] },
  })

  const [categoryId, price, costPrice, discountMode, discountValue, variants, details] = watch(['categoryId', 'price', 'costPrice', 'discountMode', 'discountValue', 'variants', 'details'])
  const status = watch('status')
  const variantFields = useFieldArray({ control, name: 'variants' })
  const totalStock = (variants ?? []).reduce((n, v) => n + (v.stockQuantity && !Number.isNaN(v.stockQuantity) ? v.stockQuantity : 0), 0)

  const addSize = () => {
    const used = new Set((variants ?? []).map((v) => v.size))
    const next = PRODUCT_SIZES.find((s) => s !== 'None' && !used.has(s)) ?? 'FreeSize'
    // The first real size replaces the "not applicable" placeholder row
    if (variants?.length === 1 && variants[0].size === 'None') {
      setValue('variants.0.size', next, { shouldValidate: true })
      return
    }
    variantFields.append({ size: next, stockQuantity: undefined })
  }

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

  // Profit per unit at the price shoppers actually pay
  const unitProfit = (() => {
    const sellingPrice = salePrice && price && salePrice < price ? salePrice : price
    if (!sellingPrice || costPrice === undefined || Number.isNaN(sellingPrice) || Number.isNaN(costPrice)) return undefined
    const profit = round2(sellingPrice - costPrice)
    return { profit, margin: round2((profit / sellingPrice) * 100) }
  })()

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { discountMode: mode, discountValue: value, ...rest } = values
      // A lone "not applicable" row with no quantity means sizes and stock haven't been entered yet
      const variantsToSave = rest.variants
        .filter((v) => !(v.size === 'None' && v.stockQuantity === undefined && rest.variants.length === 1))
        .map((v) => ({ size: v.size, stockQuantity: v.stockQuantity ?? 0 }))
      const body = { ...rest, sizeChartId: values.sizeChartId || null, variants: variantsToSave, costPrice: values.costPrice ?? 0, discountPrice: toDiscountPrice(values.price, mode, value) ?? null }
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
      queryClient.invalidateQueries({ queryKey: ['low-stock'] })
      onSaved()
    },
    onSettled: () => setProgress(''),
  })

  const busy = mutation.isPending
  const sizeChartId = watch('sizeChartId')
  const selectedChart = sizeChartsQuery.data?.find((c) => c.id === sizeChartId)
  const formId = 'product-form'
  const num = { setValueAs: toNumber }
  // Blank or 0 both mean "no discount"
  const optionalNum = { setValueAs: (v: unknown) => toNumber(v) || undefined }
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

  const sectionHasError = (id: SectionId) => SECTIONS.find((s) => s.id === id)!.fields.some((f) => f in errors)
  const panel = (id: SectionId) => (section === id ? 'space-y-4' : 'hidden')

  const navItem = ({ id, label, icon: Icon, required }: (typeof SECTIONS)[number]) => {
    const active = section === id
    return (
      <button
        key={id}
        type="button"
        role="tab"
        id={`${formId}-tab-${id}`}
        aria-selected={active}
        aria-controls={`${formId}-panel-${id}`}
        onClick={() => setSection(id)}
        className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm whitespace-nowrap transition-colors lg:w-full ${
          active ? 'bg-brand-50 font-semibold text-brand-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span>
          {label} {required && <span className="text-red-500">*</span>}
        </span>
        {sectionHasError(id) && (
          <span className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600" title="Needs attention">
            <span aria-hidden>!</span>
            <span className="sr-only">Needs attention</span>
          </span>
        )}
      </button>
    )
  }

  return (
    <Modal
      open={open}
      onClose={busy ? undefined : onClose}
      size="xl"
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
      <form
        id={formId}
        onSubmit={handleSubmit(
          (v) => mutation.mutate(v),
          // Take the owner to the first section that still has a problem
          (invalid) => {
            const first = SECTIONS.find((s) => s.fields.some((f) => f in invalid))
            if (first) setSection(first.id)
          },
        )}
        className="grid gap-4 lg:grid-cols-[230px_1fr]"
        noValidate
      >
        <nav
          role="tablist"
          aria-label="Item sections"
          aria-orientation="vertical"
          className="flex gap-1 overflow-x-auto rounded-2xl border border-gray-200 p-2 lg:flex-col lg:self-start lg:overflow-visible lg:p-3"
        >
          {navItem(SECTIONS[0])}
          <p className="hidden border-t border-gray-100 px-3 pt-3 pb-1 text-sm font-semibold text-gray-900 lg:mt-2 lg:block">More details</p>
          {SECTIONS.slice(1).map(navItem)}
        </nav>

        {/* Every section stays mounted (hidden, not removed) so its fields keep their values and validation */}
        <div className="min-w-0 rounded-2xl border border-gray-200 p-4 sm:p-5 lg:min-h-[26rem]">
          <div role="tabpanel" id={`${formId}-panel-basic`} aria-labelledby={`${formId}-tab-basic`} className={panel('basic')}>
              <Field label="Item name" required error={errors.name?.message}>
                <Input {...register('name')} placeholder="Classic cotton tee" aria-invalid={!!errors.name} />
              </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <CategoryTreeSelect
                label="Category"
                required
                error={errors.categoryId?.message}
                categories={categoriesQuery.data ?? []}
                loading={categoriesQuery.isPending}
                value={categoryId ?? ''}
                onChange={(id) => setValue('categoryId', id, { shouldValidate: true, shouldDirty: true })}
              />
              <Field
                label="Status"
                required
                error={errors.status?.message}
                hint={status === 'OutOfStock' && totalStock > 0 ? 'This item has stock again. Set it to Active so shoppers can buy it.' : undefined}
              >
                <Select {...register('status')} options={productStatusOptions} />
              </Field>
            </div>
              <Field label="Short description" hint="A sentence or two shown at the top of the product page." error={errors.description?.message}>
                <Textarea {...register('description')} placeholder="A quick summary of the item" />
              </Field>
          </div>

          <div role="tabpanel" id={`${formId}-panel-pricing`} aria-labelledby={`${formId}-tab-pricing`} className={panel('pricing')}>
            {/* Money fields share one row, in the order the owner thinks about them */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Field label={`Purchase price (${currency})`} error={errors.costPrice?.message}>
                  <Input
                    {...register('costPrice', num)}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="What you paid per unit"
                    aria-invalid={!!errors.costPrice}
                  />
                </Field>
                {!errors.costPrice &&
                  (unitProfit ? (
                    <span className={`mt-1 block text-xs font-medium ${unitProfit.profit > 0 ? 'text-brand-600' : 'text-red-600'}`}>
                      {unitProfit.profit > 0
                        ? `Profit per unit: ${formatMoney(unitProfit.profit, currency)} (${unitProfit.margin}% margin)`
                        : unitProfit.profit === 0
                          ? 'No profit at this selling price'
                          : `Selling below cost: ${formatMoney(-unitProfit.profit, currency)} loss per unit`}
                    </span>
                  ) : (
                    <span className="mt-1 block text-xs text-gray-500">Optional. Only you see this; it's used to work out profit.</span>
                  ))}
              </div>

              <Field label={`Selling price (${currency})`} required error={errors.price?.message}>
                <Input {...register('price', num)} type="number" step="0.01" min="0" placeholder="What shoppers pay" aria-invalid={!!errors.price} />
              </Field>

              <div>
                {/* Same label line as Field; the taller toggle overflows it instead of pushing the input down */}
                <div className={`${fieldLabel} justify-between`}>
                  <span>
                    Discount
                  </span>
                  <div className="flex rounded-full bg-gray-100 p-0.5" role="group" aria-label="Discount type">
                    {modeBtn('amount', currency)}
                    {modeBtn('percent', '%')}
                  </div>
                </div>
                <div className="relative">
                  <Input
                    {...register('discountValue', optionalNum)}
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
                    Leave blank for no discount, or {discountMode === 'percent' ? 'enter % off' : 'enter the sale price'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div role="tabpanel" id={`${formId}-panel-stock`} aria-labelledby={`${formId}-tab-stock`} className={panel('stock')}>
            <div>
              <div className={`${fieldLabel} justify-between`}>
                <span>
                  Sizes &amp; stock <span className="font-normal text-gray-400">(optional)</span>
                </span>
                <span className="text-xs text-gray-500">Total stock: {totalStock}</span>
              </div>
              <p className="mb-2 text-xs text-gray-500">
                You can skip this and add sizes or stock later. Shoppers see the item as sold out until it has stock.
              </p>
              <div className="space-y-2 rounded-2xl border border-gray-200 p-3">
                {variantFields.fields.length === 0 && <p className="py-1 text-sm text-gray-500">No sizes or stock yet.</p>}
                {variantFields.fields.map((field, index) => {
                  const err = errors.variants?.[index]
                  return (
                    <div key={field.id} className="flex items-start gap-2">
                      <div className="flex-1">
                        <Select {...register(`variants.${index}.size`)} options={sizeOptions} aria-label="Size" aria-invalid={!!err?.size} />
                        {err?.size && <span className="mt-1 block text-xs text-red-600">{err.size.message}</span>}
                      </div>
                      <div className="w-32">
                        <Input
                          {...register(`variants.${index}.stockQuantity`, num)}
                          type="number"
                          step="1"
                          min="0"
                          placeholder="Qty"
                          aria-label="Stock quantity"
                          aria-invalid={!!err?.stockQuantity}
                        />
                        {err?.stockQuantity && <span className="mt-1 block text-xs text-red-600">{err.stockQuantity.message}</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => variantFields.remove(index)}
                        className="mt-1.5 rounded-full p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove size"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })}
                <button type="button" onClick={addSize} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">
                  <Plus className="h-3.5 w-3.5" /> Add size
                </button>
              </div>
              {errors.variants?.message && <span className="mt-1 block text-xs text-red-600">{errors.variants.message}</span>}
              {errors.variants?.root?.message && <span className="mt-1 block text-xs text-red-600">{errors.variants.root.message}</span>}
            </div>

            <div>
              <div className={`${fieldLabel} justify-between`}>
                <span>
                  Size chart <span className="font-normal text-gray-400">(optional)</span>
                </span>
                <button type="button" onClick={() => setCreatingChart(true)} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">
                  <Plus className="h-3.5 w-3.5" /> New size chart
                </button>
              </div>
              <Select
                {...register('sizeChartId')}
                options={(sizeChartsQuery.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
                placeholder={sizeChartsQuery.isPending ? 'Loading…' : 'No size chart'}
                aria-label="Size chart"
              />
              {selectedChart ? (
                <div className="mt-2 flex items-center gap-2">
                  {selectedChart.images.map((src) => (
                    <img key={src} src={mediaUrl(src)} alt="" className="h-12 w-12 rounded-lg border border-gray-200 object-cover" />
                  ))}
                  <span className="text-xs text-gray-500">Shoppers can open this from the product page.</span>
                </div>
              ) : (
                <span className="mt-1 block text-xs text-gray-500">Pick a chart you've made before, or create a new one. Manage them under Size charts.</span>
              )}
            </div>
          </div>

          <div role="tabpanel" id={`${formId}-panel-details`} aria-labelledby={`${formId}-tab-details`} className={panel('details')}>
            <Field
              label="Product details"
              error={errors.details?.message}
              hint={`Materials, measurements, care instructions, what's in the box. ${(details?.length ?? 0).toLocaleString()} / ${DETAILS_MAX.toLocaleString()} characters`}
            >
              <Textarea {...register('details')} rows={12} placeholder="Everything a shopper might want to know before buying…" aria-invalid={!!errors.details} />
            </Field>
          </div>

          <div role="tabpanel" id={`${formId}-panel-images`} aria-labelledby={`${formId}-tab-images`} className={panel('images')}>
            <Field label="Images" hint="Up to 8 images, 5MB each. The first image is the cover.">
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
          </div>
        </div>
      </form>
      {creatingChart && (
        <SizeChartFormModal
          onClose={() => setCreatingChart(false)}
          onSaved={(chart) => {
            // Show it in the list straight away, then select it
            queryClient.setQueryData(['size-charts'], (old: typeof sizeChartsQuery.data) => [...(old ?? []), chart])
            setValue('sizeChartId', chart.id, { shouldDirty: true })
            setCreatingChart(false)
          }}
        />
      )}
    </Modal>
  )
}
