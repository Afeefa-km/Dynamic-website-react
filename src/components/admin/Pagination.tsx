import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null
  const btn = 'rounded-full border border-gray-300 p-2 hover:border-brand-700 disabled:opacity-40 disabled:hover:border-gray-300'
  return (
    <div className="mt-6 flex items-center justify-center gap-3 text-sm">
      <button className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span>
        Page {page} of {totalPages}
      </span>
      <button className={btn} disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Next page">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
