import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronDown, FolderOpen, Plus, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { canHaveChildren } from '../../lib/categories'
import { categoryApi } from '../../lib/services'
import type { Category } from '../../types/api'
import { fieldLabel, Input } from '../ui/Field'
import { Spinner } from '../ui/Spinner'

interface Props {
  label: string
  required?: boolean
  error?: string
  /** In tree order, as returned by the API */
  categories: Category[]
  loading?: boolean
  value: string
  onChange: (categoryId: string) => void
}

/** Where a new category is being typed: under a parent, or at the top level (null). */
type Adding = { parentId: string | null; name: string }

const INDENT_REM = 1.5

/**
 * Category picker that shows the tree instead of a flat list. Categories can be added in place:
 * the plus on a row adds a subcategory under it, the button at the bottom adds a top-level category.
 */
export function CategoryTreeSelect({ label, required, error, categories, loading, value, onChange }: Props) {
  const queryClient = useQueryClient()
  const labelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState<Adding | null>(null)

  const selected = categories.find((c) => c.id === value)
  const parentIds = new Set(categories.map((c) => c.parentId))

  const close = () => {
    setOpen(false)
    setAdding(null)
  }

  useEffect(() => {
    if (!open) return
    const onMouseDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', onMouseDown)
    // The popup scrolls, so make sure the whole list, including the add button at the bottom, is on screen
    panelRef.current?.scrollIntoView({ block: 'nearest' })
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  const createMutation = useMutation({
    mutationFn: ({ name, parentId }: Adding) => categoryApi.create(name, parentId),
    onSuccess: (category) => {
      // Show the new category straight away; the refetch then puts it in its proper place in the tree
      queryClient.setQueryData(['categories'], (old: Category[] | undefined) => [...(old ?? []), category])
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      onChange(category.id)
      close()
    },
  })

  const submitNew = () => {
    if (adding?.name.trim() && !createMutation.isPending) createMutation.mutate({ ...adding, name: adding.name.trim() })
  }

  const addForm = (depth: number, placeholder: string) => (
    <div className="flex items-center gap-2 py-1.5 pr-2" style={{ paddingLeft: `${0.75 + depth * INDENT_REM}rem` }}>
      <Input
        autoFocus
        compact
        value={adding?.name ?? ''}
        maxLength={60}
        onChange={(e) => adding && setAdding({ ...adding, name: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            // Enter must add the category, not submit the product form around it
            e.preventDefault()
            submitNew()
          }
        }}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      <button
        type="button"
        onClick={submitNew}
        disabled={!adding?.name.trim() || createMutation.isPending}
        className="flex h-9 shrink-0 items-center justify-center rounded-full bg-brand-700 px-3.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
      >
        {createMutation.isPending ? <Spinner className="h-4 w-4" /> : 'Add'}
      </button>
      <button type="button" onClick={() => setAdding(null)} className="shrink-0 rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Cancel">
        <X className="h-4 w-4" />
      </button>
    </div>
  )

  return (
    <div
      ref={rootRef}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          // Close only the dropdown, not the popup it sits in
          e.stopPropagation()
          close()
        }
      }}
    >
      <span id={labelId} className={fieldLabel}>
        {label} {required && <span className="text-red-500">*</span>}
      </span>

      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        disabled={loading}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelId}
        aria-invalid={!!error}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-gray-300 bg-white px-3.5 text-left text-sm outline-none transition focus:border-brand-700 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-100 aria-invalid:border-red-500"
      >
        <span className={`truncate ${selected ? '' : 'text-gray-500'}`}>
          {selected ? selected.path : loading ? 'Loading…' : categories.length ? 'Select category' : 'No categories yet'}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}

      {open && (
        <div ref={panelRef} className="absolute top-[4.75rem] left-0 z-20 scroll-mb-3 w-full min-w-72 rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div role="listbox" aria-labelledby={labelId} className="max-h-64 overflow-y-auto p-1.5">
            {categories.length === 0 && !adding && (
              <p className="px-3 py-4 text-center text-sm text-gray-500">No categories yet. Add your first one below.</p>
            )}
            {categories.map((c) => {
              const isSelected = c.id === value
              return (
                <div key={c.id}>
                  <div className={`group flex items-center rounded-xl ${isSelected ? 'bg-brand-50' : 'hover:bg-gray-100'}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(c.id)
                        close()
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2 rounded-xl py-2.5 pr-2 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-100"
                      style={{ paddingLeft: `${0.75 + c.depth * INDENT_REM}rem` }}
                    >
                      {parentIds.has(c.id) ? (
                        <FolderOpen className={`h-4 w-4 shrink-0 ${c.depth === 0 ? 'text-brand-500' : 'text-gray-500'}`} />
                      ) : (
                        <span className="w-4 shrink-0" />
                      )}
                      <span className={`truncate ${isSelected || parentIds.has(c.id) ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{c.name}</span>
                      {isSelected && <Check className="ml-auto h-4 w-4 shrink-0 text-brand-700" />}
                    </button>
                    {canHaveChildren(c) && (
                      <Tooltip text="Add new subcategory" side="left">
                        <button
                          type="button"
                          onClick={() => setAdding({ parentId: c.id, name: '' })}
                          className="mr-1.5 rounded-full p-1.5 text-gray-500 hover:bg-white hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-100"
                          aria-label={`Add new subcategory under ${c.name}`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </Tooltip>
                    )}
                  </div>
                  {adding?.parentId === c.id && addForm(c.depth + 1, `New subcategory under ${c.name}`)}
                </div>
              )
            })}
          </div>

          <div className="border-t border-gray-100 p-1.5">
            {adding && adding.parentId === null ? (
              addForm(0, 'New category name')
            ) : (
              <Tooltip text="Add new category" side="top" className="block">
                <button
                  type="button"
                  onClick={() => setAdding({ parentId: null, name: '' })}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50 focus-visible:ring-2 focus-visible:ring-brand-100"
                >
                  <Plus className="h-4 w-4" /> Add category
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** Small hover/focus hint. The wrapped control keeps its own accessible name; this is a visual aid. */
function Tooltip({ text, side, className = '', children }: { text: string; side: 'top' | 'left'; className?: string; children: ReactNode }) {
  const position = side === 'top' ? 'bottom-full left-1/2 mb-1.5 -translate-x-1/2' : 'top-1/2 right-full mr-1 -translate-y-1/2'
  return (
    <span className={`group/tip relative ${className || 'inline-flex'}`}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-30 rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity group-focus-within/tip:opacity-100 group-hover/tip:opacity-100 ${position}`}
      >
        {text}
      </span>
    </span>
  )
}
