import { Minus, Plus } from 'lucide-react'
import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Spinner } from '../components/ui/Spinner'

// Building blocks for the shopper-facing store. Colours, fonts and corners come from the active theme (see themes.ts).

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
      ? 'bg-sf-primary text-sf-on-primary hover:opacity-90 disabled:opacity-40'
      : 'border border-sf-text bg-transparent text-sf-text hover:bg-sf-surface disabled:opacity-40'
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-sf-btn px-6 text-sm font-medium tracking-[0.08em] uppercase transition-colors disabled:cursor-not-allowed ${styles} ${className}`}
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
            {i > 0 && <span className="text-sf-subtle">/</span>}
            {item.to ? (
              <Link to={item.to} className="text-sf-muted hover:text-sf-text">{item.label}</Link>
            ) : (
              <span className="text-sf-text" aria-current="page">{item.label}</span>
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
    <div className="border-b border-sf-border">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between py-4 text-left text-[15px] tracking-wide" aria-expanded={open}>
        {title}
        {open ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      </button>
      {open && <div className="pb-5 text-sm leading-relaxed text-sf-muted">{children}</div>}
    </div>
  )
}

export function QuantityStepper({ value, max, onChange }: { value: number; max: number; onChange: (v: number) => void }) {
  const btn = 'flex h-10 w-10 items-center justify-center hover:bg-sf-surface disabled:opacity-30'
  return (
    <div className="inline-flex items-center overflow-hidden rounded-sf-btn border border-sf-line">
      <button className={btn} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease quantity"><Minus className="h-3.5 w-3.5" /></button>
      <span className="w-10 text-center text-sm">{value}</span>
      <button className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity"><Plus className="h-3.5 w-3.5" /></button>
    </div>
  )
}

export function StoreLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sf-text" role="status" aria-label="Loading">
      <Spinner className="h-7 w-7" />
    </div>
  )
}

export function StoreEmpty({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <p className="sf-heading text-xl">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-sf-muted">{text}</p>
      {action && <div className="mt-8">{action}</div>}
    </div>
  )
}
