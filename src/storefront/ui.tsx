import { Minus, Plus } from 'lucide-react'
import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Spinner } from '../components/ui/Spinner'

// Minimal, square, black-and-white building blocks for the shopper-facing store

export function StoreButton({
  variant = 'solid',
  loading,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'solid' | 'outline'; loading?: boolean }) {
  const styles =
    variant === 'solid'
      ? 'bg-neutral-900 text-white hover:bg-black disabled:bg-neutral-400'
      : 'border border-neutral-900 bg-white text-neutral-900 hover:bg-neutral-50 disabled:border-neutral-300 disabled:text-neutral-400'
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex h-12 items-center justify-center gap-2 px-6 text-sm font-medium tracking-[0.08em] uppercase transition-colors disabled:cursor-not-allowed ${styles} ${className}`}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  )
}

export function Breadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[15px] tracking-wide">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-neutral-400">/</span>}
            {item.to ? (
              <Link to={item.to} className="text-neutral-500 hover:text-neutral-900">{item.label}</Link>
            ) : (
              <span className="text-neutral-900" aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function Accordion({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-neutral-200">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between py-4 text-left text-[15px] tracking-wide" aria-expanded={open}>
        {title}
        {open ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      </button>
      {open && <div className="pb-5 text-sm leading-relaxed text-neutral-600">{children}</div>}
    </div>
  )
}

export function QuantityStepper({ value, max, onChange }: { value: number; max: number; onChange: (v: number) => void }) {
  const btn = 'flex h-10 w-10 items-center justify-center hover:bg-neutral-100 disabled:opacity-30'
  return (
    <div className="inline-flex items-center border border-neutral-300">
      <button className={btn} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease quantity"><Minus className="h-3.5 w-3.5" /></button>
      <span className="w-10 text-center text-sm">{value}</span>
      <button className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity"><Plus className="h-3.5 w-3.5" /></button>
    </div>
  )
}

export function StoreLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-neutral-900" role="status" aria-label="Loading">
      <Spinner className="h-7 w-7" />
    </div>
  )
}

export function StoreEmpty({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <p className="text-xl tracking-wide">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-neutral-500">{text}</p>
      {action && <div className="mt-8">{action}</div>}
    </div>
  )
}
