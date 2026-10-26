import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { mediaUrl } from '../../lib/format'
import { sizeChartApi } from '../../lib/services'
import type { SizeChart } from '../../types/api'
import { Button } from '../ui/Button'
import { Field, Input, Textarea } from '../ui/Field'
import { ImagePicker, type PickedImage } from '../ui/ImagePicker'
import { Modal } from '../ui/Modal'

/** Keep in sync with CoreConstants.Media.MaxSizeChartImages on the API */
export const MAX_SIZE_CHART_IMAGES = 3

interface Props {
  /** Edit this chart; leave out to create a new one */
  chart?: SizeChart
  onClose: () => void
  onSaved: (chart: SizeChart) => void
}

/** Create or edit a size chart: a name (e.g. Kurti, Shirt), up to three images and an optional description. */
export function SizeChartFormModal({ chart, onClose, onSaved }: Props) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(chart?.name ?? '')
  const [description, setDescription] = useState(chart?.description ?? '')
  const [images, setImages] = useState<PickedImage[]>(chart?.images.map((url) => ({ key: url, url: mediaUrl(url) })) ?? [])
  const [errors, setErrors] = useState<{ name?: string; images?: string }>({})

  const mutation = useMutation({
    mutationFn: async () => {
      // Upload new images in the order the owner arranged them
      const urls: string[] = []
      for (const img of images) urls.push(img.file ? (await sizeChartApi.uploadImage(img.file)).url : img.key)
      const body = { name: name.trim(), description: description.trim(), images: urls }
      return chart ? sizeChartApi.update(chart.id, body) : sizeChartApi.create(body)
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['size-charts'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onSaved(saved)
    },
  })

  const submit = () => {
    const next = {
      name: name.trim() ? undefined : 'Give the size chart a name, e.g. Kurti or Shirt',
      images: images.length ? undefined : 'Add at least one size chart image',
    }
    setErrors(next)
    if (!next.name && !next.images) mutation.mutate()
  }

  const busy = mutation.isPending

  return (
    <Modal
      open
      size="lg"
      onClose={busy ? undefined : onClose}
      title={chart ? 'Edit size chart' : 'New size chart'}
      subtitle={chart?.productCount ? `Used by ${chart.productCount} item${chart.productCount === 1 ? '' : 's'}; changes show on all of them.` : 'Reuse it on as many items as you like.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} loading={busy}>
            {chart ? 'Save changes' : 'Create size chart'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Name" required error={errors.name} hint="Name it after the kind of item it fits, e.g. Kurti, Shirt or Kids dresses.">
          <Input
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
            placeholder="e.g. Kurti"
            aria-invalid={!!errors.name}
          />
        </Field>
        <Field label={`Images (up to ${MAX_SIZE_CHART_IMAGES})`} required error={errors.images} hint="Measurement tables or how-to-measure pictures. Shown in this order.">
          <ImagePicker
            images={images}
            max={MAX_SIZE_CHART_IMAGES}
            disabled={busy}
            onAdd={(files) => setImages((prev) => [...prev, ...files.map((f) => ({ key: `${f.name}-${f.lastModified}-${Math.random()}`, url: URL.createObjectURL(f), file: f }))])}
            onRemove={(img) => setImages((prev) => prev.filter((i) => i.key !== img.key))}
          />
        </Field>
        <Field label="Description" hint={`Shown under the images, e.g. "Measurements are in inches. If you're between sizes, pick the larger one." ${description.length} / 2000`}>
          <Textarea value={description} maxLength={2000} rows={4} onChange={(e) => setDescription(e.target.value)} placeholder="Optional fitting notes" />
        </Field>
      </div>
    </Modal>
  )
}
