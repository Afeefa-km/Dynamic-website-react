import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Images, Palette, Store as StoreIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { BUSINESS_TYPES, businessTypeOptions, CURRENCIES, currencyOptions, type StoreTheme } from '../../constants/enums'
import { mediaUrl } from '../../lib/format'
import { storeApi } from '../../lib/services'
import { emailField, phoneField } from '../../lib/validation'
import type { Store } from '../../types/api'
import { Button } from '../ui/Button'
import { Field, Input, Select, Textarea } from '../ui/Field'
import { ImagePicker, type PickedImage } from '../ui/ImagePicker'
import { Modal } from '../ui/Modal'
import { MAX_COVER_IMAGES, THEMES } from '../../storefront/themes'
import { ThemePicker } from './ThemePicker'

const schema = z.object({
  name: z.string().trim().min(2, 'Store name must be at least 2 characters').max(200),
  businessType: z.enum(BUSINESS_TYPES, { message: 'Select a business type' }),
  businessDescription: z.string().trim().max(1000).optional(),
  contactEmail: emailField('Contact email'),
  contactPhone: phoneField('Contact phone'),
  businessAddress: z.string().trim().max(500).optional(),
  currency: z.enum(CURRENCIES, { message: 'Select a currency' }),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  store?: Store // edit mode when provided
  defaultEmail?: string
  defaultPhone?: string
  onClose?: () => void
  onSaved: (store: Store) => void
}

export function StoreFormModal({ open, store, defaultEmail, defaultPhone, onClose, onSaved }: Props) {
  const [section, setSection] = useState<'details' | 'covers' | 'theme'>('details')
  const [theme, setTheme] = useState<StoreTheme>(store?.theme ?? 'Classic')
  const [covers, setCovers] = useState<PickedImage[]>(store?.coverImages.map((url) => ({ key: url, url: mediaUrl(url) })) ?? [])
  const [logo, setLogo] = useState<PickedImage[]>(store?.logoUrl ? [{ key: 'logo', url: mediaUrl(store.logoUrl) }] : [])
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: store?.name ?? '',
      businessType: store?.businessType,
      businessDescription: store?.businessDescription ?? '',
      contactEmail: store?.contactEmail ?? defaultEmail ?? '',
      contactPhone: store?.contactPhone ?? defaultPhone ?? '',
      businessAddress: store?.businessAddress ?? '',
      currency: store?.currency ?? 'USD',
    },
  })

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const picked = logo[0]
      let logoUrl = store && picked && !picked.file ? store.logoUrl : ''
      if (picked?.file) logoUrl = (await storeApi.uploadLogo(picked.file)).url
      const body = { ...values, logoUrl, businessDescription: values.businessDescription ?? '', businessAddress: values.businessAddress ?? '' }
      if (!store) return storeApi.create(body)
      let updated = await storeApi.update(body)

      // Upload new cover images, keeping the order the owner arranged them in
      const coverUrls: string[] = []
      for (const cover of covers) {
        coverUrls.push(cover.file ? (await storeApi.uploadCover(cover.file)).url : cover.key)
      }
      if (coverUrls.join('|') !== store.coverImages.join('|')) updated = await storeApi.updateCovers(coverUrls)

      return theme === store.theme ? updated : storeApi.updateTheme(theme)
    },
    onSuccess: onSaved,
  })

  const formId = 'store-form'
  const detailsForm = (
        <form
          id={formId}
          // Details errors are on the first section; show it if the owner saved from the theme section
          onSubmit={handleSubmit((v) => mutation.mutate(v), () => setSection('details'))}
          className="grid gap-4 sm:grid-cols-2"
          noValidate
        >
          <Field label="Store name" required error={errors.name?.message}>
            <Input {...register('name')} placeholder="Green Threads" aria-invalid={!!errors.name} />
          </Field>
          <Field label="Business type" required error={errors.businessType?.message}>
            <Select {...register('businessType')} options={businessTypeOptions} placeholder="Select type" aria-invalid={!!errors.businessType} />
          </Field>
          <Field label="Logo" hint="PNG, JPG, WEBP or GIF up to 5MB" className="sm:col-span-2">
            <ImagePicker
              images={logo}
              multiple={false}
              disabled={mutation.isPending}
              onAdd={(files) => files[0] && setLogo([{ key: files[0].name, url: URL.createObjectURL(files[0]), file: files[0] }])}
              onRemove={() => setLogo([])}
            />
          </Field>
          <Field label="Business description" error={errors.businessDescription?.message} className="sm:col-span-2">
            <Textarea {...register('businessDescription')} placeholder="What do you sell?" />
          </Field>
          <Field label="Contact email" required error={errors.contactEmail?.message}>
            <Input {...register('contactEmail')} type="email" aria-invalid={!!errors.contactEmail} />
          </Field>
          <Field label="Contact phone" required error={errors.contactPhone?.message}>
            <Input {...register('contactPhone')} type="tel" aria-invalid={!!errors.contactPhone} />
          </Field>
          <Field label="Business address" error={errors.businessAddress?.message}>
            <Input {...register('businessAddress')} placeholder="Street, city, country" />
          </Field>
          <Field label="Currency" required error={errors.currency?.message}>
            <Select {...register('currency')} options={currencyOptions} />
          </Field>
        </form>
  )

  return (
    <Modal
      open={open}
      onClose={mutation.isPending ? undefined : onClose}
      size={store ? 'xl' : 'lg'}
      title={store ? 'Store settings' : 'Create your store'}
      subtitle={store ? 'Update your business details and how your store website looks.' : 'Tell us about your business — you can change this later.'}
      footer={
        <>
          {onClose && (
            <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
          )}
          <Button type="submit" form={formId} loading={mutation.isPending}>
            {store ? 'Save changes' : 'Create store'}
          </Button>
        </>
      }
    >
      {store ? (
        <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
          <nav role="tablist" aria-label="Settings sections" className="flex gap-1 rounded-2xl border border-gray-200 p-2 lg:flex-col lg:self-start lg:p-3">
            {([
              ['details', 'Store details', StoreIcon],
              ['covers', 'Cover images', Images],
              ['theme', 'Theme', Palette],
            ] as const).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={section === id}
                onClick={() => setSection(id)}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm whitespace-nowrap transition-colors lg:w-full ${
                  section === id ? 'bg-brand-50 font-semibold text-brand-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" /> {label}
              </button>
            ))}
          </nav>
          <div className="min-w-0 rounded-2xl border border-gray-200 p-4 sm:p-5">
            {/* Both sections stay mounted so switching keeps unsaved edits */}
            <div className={section === 'details' ? '' : 'hidden'}>{detailsForm}</div>
            <div className={section === 'covers' ? 'space-y-4' : 'hidden'}>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Cover images</h3>
                <p className="mt-0.5 text-sm text-gray-500">
                  Photos for the top of your store's home page. Add up to {MAX_COVER_IMAGES}; each theme shows as many as its layout
                  needs, in this order. The first one is the main image.
                </p>
              </div>
              <ImagePicker
                images={covers}
                max={MAX_COVER_IMAGES}
                disabled={mutation.isPending}
                onAdd={(files) =>
                  setCovers((prev) => [...prev, ...files.map((f) => ({ key: `${f.name}-${f.lastModified}-${Math.random()}`, url: URL.createObjectURL(f), file: f }))])
                }
                onRemove={(img) => setCovers((prev) => prev.filter((c) => c.key !== img.key))}
              />
              <CoverUsage theme={theme} count={covers.length} />
            </div>
            <div className={section === 'theme' ? '' : 'hidden'}>
              <ThemePicker value={theme} onChange={setTheme} storeName={store.name} storeSlug={store.slug} />
            </div>
          </div>
        </div>
      ) : (
        detailsForm
      )}
    </Modal>
  )
}

/** Explains how many cover images the chosen theme will show, given how many the owner has added. */
function CoverUsage({ theme, count }: { theme: StoreTheme; count: number }) {
  const { name, coverSlots } = THEMES[theme]
  const message =
    coverSlots === 0
      ? `The ${name} theme doesn't show cover images. They'll appear if you switch to a theme that does.`
      : count >= coverSlots
        ? `The ${name} theme shows ${coverSlots === 1 ? 'the first image' : `the first ${coverSlots} images`}.`
        : `The ${name} theme shows ${coverSlots} image${coverSlots === 1 ? '' : 's'}. ${
            count === 0 ? 'Until you add some' : `Add ${coverSlots - count} more, or`
          } your newest product photos are used instead.`
  return (
    <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
      <p>{message}</p>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        {Object.values(THEMES)
          .filter((t) => t.coverSlots > 0)
          .map((t) => (
            <li key={t.id}>
              {t.name}: {t.coverSlots}
            </li>
          ))}
      </ul>
    </div>
  )
}
