import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

const base =
  'w-full rounded-xl border border-gray-300 bg-white px-3.5 text-sm outline-none transition focus:border-brand-700 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-100 aria-invalid:border-red-500'

// Inputs, selects and buttons share one fixed height so they line up when placed side by side
// (padding alone leaves a native <select> slightly shorter than an <input>).
const singleLine = (compact?: boolean) => `${base} ${compact ? 'h-9' : 'h-11'}`

/** Label line above a field. Fixed height so every field in a row starts its input at the same y. */
export const fieldLabel = 'mb-1.5 flex h-5 items-center gap-1 text-sm font-medium text-gray-700'

interface FieldProps {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
  className?: string
}

export function Field({ label, error, hint, required, children, className = '' }: FieldProps) {
  return (
    <label className={`block ${className}`}>
      <span className={fieldLabel}>
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-gray-500">{hint}</span>
      ) : null}
    </label>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Shorter field for dense places such as table rows */
  compact?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ compact, ...props }, ref) {
  return <input ref={ref} {...props} className={`${singleLine(compact)} ${props.className ?? ''}`} />
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(props, ref) {
  return <textarea ref={ref} rows={3} {...props} className={`${base} py-2.5 ${props.className ?? ''}`} />
})

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[]
  placeholder?: string
  /** Shorter field for dense places such as table rows */
  compact?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ options, placeholder, compact, ...props }, ref) {
  return (
    <select ref={ref} {...props} className={`${singleLine(compact)} ${props.className ?? ''}`}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
})
