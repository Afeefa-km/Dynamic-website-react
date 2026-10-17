import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

const MIN_ZOOM = 1
const MAX_ZOOM = 4
const STEP = 0.5

interface Props {
  images: string[]
  startIndex: number
  alt: string
  onClose: () => void
}

/**
 * Full-screen photo viewer for the product page. Zoom with the buttons, the mouse wheel, +/- keys or a
 * double-click; drag to look around while zoomed; arrows switch photos and Escape closes.
 */
export function ImageViewer({ images, startIndex, alt, onClose }: Props) {
  const [index, setIndex] = useState(startIndex)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  const setZoomClamped = useCallback((next: number) => {
    const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next))
    setZoom(z)
    if (z === 1) setOffset({ x: 0, y: 0 })
  }, [])

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => (i + delta + images.length) % images.length)
      setZoom(1)
      setOffset({ x: 0, y: 0 })
    },
    [images.length],
  )

  useEffect(() => {
    closeRef.current?.focus()
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight' && images.length > 1) go(1)
      else if (e.key === 'ArrowLeft' && images.length > 1) go(-1)
      else if (e.key === '+' || e.key === '=') setZoomClamped(zoom + STEP)
      else if (e.key === '-') setZoomClamped(zoom - STEP)
      else if (e.key === '0') setZoomClamped(1)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [go, images.length, onClose, setZoomClamped, zoom])

  const onPointerDown = (e: ReactPointerEvent) => {
    if (zoom === 1) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
    setDragging(true)
  }
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!drag.current) return
    setOffset({ x: drag.current.ox + e.clientX - drag.current.x, y: drag.current.oy + e.clientY - drag.current.y })
  }
  const endDrag = () => {
    drag.current = null
    setDragging(false)
  }

  const control = 'flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-30'

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black font-sans" role="dialog" aria-modal="true" aria-label={`${alt}: photo ${index + 1} of ${images.length}`}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-white/80">
        <span>{images.length > 1 ? `${index + 1} / ${images.length}` : ''}</span>
        <div className="flex items-center gap-2">
          <button className={control} onClick={() => setZoomClamped(zoom - STEP)} disabled={zoom <= MIN_ZOOM} aria-label="Zoom out" title="Zoom out (-)">
            <Minus className="h-5 w-5" />
          </button>
          <span className="w-12 text-center tabular-nums" aria-live="polite">{Math.round(zoom * 100)}%</span>
          <button className={control} onClick={() => setZoomClamped(zoom + STEP)} disabled={zoom >= MAX_ZOOM} aria-label="Zoom in" title="Zoom in (+)">
            <Plus className="h-5 w-5" />
          </button>
          <button className={control} onClick={() => setZoomClamped(1)} disabled={zoom === 1} aria-label="Reset zoom" title="Reset (0)">
            <RotateCcw className="h-4 w-4" />
          </button>
          <button ref={closeRef} className={`${control} ml-2`} onClick={onClose} aria-label="Close" title="Close (Esc)">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        className={`relative flex flex-1 items-center justify-center overflow-hidden ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}
        onWheel={(e) => setZoomClamped(zoom + (e.deltaY < 0 ? STEP : -STEP) / 2)}
        onDoubleClick={() => setZoomClamped(zoom > 1 ? 1 : 2)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{ touchAction: 'none' }}
      >
        <img
          src={images[index]}
          alt={alt}
          draggable={false}
          className="max-h-full max-w-full object-contain select-none"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, transition: dragging ? 'none' : 'transform 150ms ease-out' }}
        />

        {images.length > 1 && (
          <>
            <button className={`${control} absolute left-4 h-12 w-12`} onClick={() => go(-1)} aria-label="Previous photo">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button className={`${control} absolute right-4 h-12 w-12`} onClick={() => go(1)} aria-label="Next photo">
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>
      <p className="pb-3 text-center text-xs text-white/50">Scroll or double-click to zoom · drag to move around</p>
    </div>
  )
}
