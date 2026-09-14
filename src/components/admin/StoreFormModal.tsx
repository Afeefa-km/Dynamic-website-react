import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { BUSINESS_TYPES, businessTypeOptions, CURRENCIES, currencyOptions } from '../../constants/enums'
import { mediaUrl } from '../../lib/format'
import { storeApi } from '../../lib/services'
import { emailField, phoneField } from '../../lib/validation'
import type { Store } from '../../types/api'
import { Button } from '../ui/Button'
import { Field, Input, Select, Textarea } from '../ui/Field'
import { ImagePicker, type PickedImage } from '../ui/ImagePicker'
import { Modal } from '../ui/Modal'

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
      return store ? storeApi.update(body) : storeApi.create(body)
    },
    onSuccess: onSaved,
  })

  const formId = 'store-form'

  return (
    <Modal
      open={open}
      onClose={mutation.isPending ? undefined : onClose}
      size="lg"
      title={store ? 'Store settings' : 'Create your store'}
      subtitle={store ? 'Update how your store appears to shoppers.' : 'Tell us about your business — you can change this later.'}
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
      <form id={formId} onSubmit={handleSubmit((v) => mutation.mutate(v))} className="grid gap-4 sm:grid-cols-2" noValidate>
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
    </Modal>
  )
}
