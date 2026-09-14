import { ImagePlus, X } from 'lucide-react'
import { useRef } from 'react'
import toast from 'react-hot-toast'
import { IMAGE_ACCEPT, MAX_IMAGE_BYTES } from '../../lib/validation'

export interface PickedImage {
  key: string
  url: string
  file?: File // present only for images not yet uploaded
}

interface Props {
  images: PickedImage[]
  onAdd: (files: File[]) => void
  onRemove: (image: PickedImage) => void
  multiple?: boolean
  max?: number
  disabled?: boolean
}

export function ImagePicker({ images, onAdd, onRemove, multiple = true, max = 8, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (list: FileList | null) => {
    if (!list) return
    const valid = Array.from(list).filter((f) => {
      if (!IMAGE_ACCEPT.split(',').includes(f.type)) {
        toast.error(`${f.name}: only JPG, PNG, WEBP or GIF images are allowed`)
        return false
      }
      if (f.size > MAX_IMAGE_BYTES) {
        toast.error(`${f.name} is larger than 5MB`)
        return false
      }
      return true
    })
    const room = multiple ? max - images.length : 1
    if (valid.length > room) toast.error(`You can add up to ${max} images`)
    onAdd(valid.slice(0, Math.max(room, 0)))
    if (inputRef.current) inputRef.current.value = ''
  }

  const canAdd = multiple ? images.length < max : images.length === 0

  return (
    <div className="flex flex-wrap gap-3">
      {images.map((img) => (
        <div key={img.key} className="group relative h-20 w-20 overflow-hidden rounded-2xl border border-gray-200 bg-surface">
          <img src={img.url} alt="" className="h-full w-full object-cover" />
          {!disabled && (
            <button
              type="button"
              onClick={() => onRemove(img)}
              className="absolute top-1 right-1 rounded-full bg-white/90 p-0.5 text-gray-700 shadow hover:text-red-600"
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
      {canAdd && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-gray-300 text-xs text-gray-500 hover:border-brand-700 hover:text-brand-700"
        >
          <ImagePlus className="h-5 w-5" />
          Add
        </button>
      )}
      <input ref={inputRef} type="file" accept={IMAGE_ACCEPT} multiple={multiple} hidden onChange={(e) => handleFiles(e.target.files)} />
    </div>
  )
}
