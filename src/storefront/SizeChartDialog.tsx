import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { mediaUrl } from '../lib/format'
import type { StorefrontSizeChart } from '../types/api'
import { ImageViewer } from './ImageViewer'

/** The product's size chart: its images (tap to zoom) with the owner's notes underneath. Styled by the store theme. */
export function SizeChartDialog({ chart, onClose }: { chart: StorefrontSizeChart; onClose: () => void }) {
  const [zoomed, setZoomed] = useState<number | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    document.body.style.overflow = 'hidden'
    // The zoom viewer handles Escape itself while it's open
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && zoomed === null && onClose()
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, zoomed])

  const images = chart.images.map((src) => mediaUrl(src))

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Size chart: ${chart.name}`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-t-sf bg-sf-bg text-sf-text shadow-2xl sm:rounded-sf"
      >
        <div className="flex items-center justify-between gap-4 border-b border-sf-border px-6 py-4">
          <div>
            <p className="sf-label text-xs text-sf-muted">Size chart</p>
            <h2 className="sf-heading text-xl">{chart.name}</h2>
          </div>
          <button ref={closeRef} onClick={onClose} className="rounded-full p-2 hover:bg-sf-surface" aria-label="Close size chart">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <div className="space-y-4">
            {images.map((src, i) => (
              <button key={src} type="button" onClick={() => setZoomed(i)} className="block w-full cursor-zoom-in" aria-label={`Zoom size chart image ${i + 1}`}>
                <img src={src} alt={`${chart.name} size chart ${i + 1}`} className="w-full rounded-sf border border-sf-border bg-sf-surface object-contain" />
              </button>
            ))}
          </div>
          {chart.description && <p className="mt-5 border-t border-sf-border pt-4 text-sm leading-relaxed whitespace-pre-line text-sf-muted">{chart.description}</p>}
        </div>
      </div>

      {zoomed !== null && <ImageViewer images={images} startIndex={zoomed} alt={`${chart.name} size chart`} onClose={() => setZoomed(null)} />}
    </div>
  )
}
