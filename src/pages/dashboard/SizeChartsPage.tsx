import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Ruler, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ConfirmModal } from '../../components/admin/ConfirmModal'
import { SizeChartFormModal } from '../../components/admin/SizeChartFormModal'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageLoader } from '../../components/ui/Spinner'
import { mediaUrl } from '../../lib/format'
import { sizeChartApi } from '../../lib/services'
import type { SizeChart } from '../../types/api'

export default function SizeChartsPage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<SizeChart | 'new' | null>(null)
  const [deleting, setDeleting] = useState<SizeChart | null>(null)
  const query = useQuery({ queryKey: ['size-charts'], queryFn: sizeChartApi.list })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sizeChartApi.remove(id),
    onSuccess: () => {
      setDeleting(null)
      queryClient.invalidateQueries({ queryKey: ['size-charts'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: () => setDeleting(null),
  })

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Size charts</h1>
          <p className="text-sm text-gray-500">Make one chart per kind of item (Kurti, Shirt…) and reuse it on as many items as you like.</p>
        </div>
        <Button onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" /> New size chart
        </Button>
      </div>

      {query.isPending ? (
        <PageLoader label="Loading size charts…" />
      ) : query.isError ? (
        <EmptyState icon={<Ruler />} title="Couldn't load size charts" text="Please try again." action={<Button onClick={() => query.refetch()}>Retry</Button>} />
      ) : query.data.length === 0 ? (
        <EmptyState
          icon={<Ruler />}
          title="No size charts yet"
          text="Upload your measurement tables once, then pick them when adding items."
          action={<Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" /> New size chart</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {query.data.map((chart) => (
            <div key={chart.id} className="flex flex-col rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="grid grid-cols-3 gap-2">
                {chart.images.map((src) => (
                  <img key={src} src={mediaUrl(src)} alt="" className="aspect-square w-full rounded-xl border border-gray-100 object-cover" />
                ))}
              </div>
              <div className="mt-3 flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{chart.name}</p>
                  <p className="text-xs text-gray-500">
                    {chart.images.length} image{chart.images.length === 1 ? '' : 's'} · used by {chart.productCount} item{chart.productCount === 1 ? '' : 's'}
                  </p>
                  {chart.description && <p className="mt-1 line-clamp-2 text-sm text-gray-600">{chart.description}</p>}
                </div>
                <button onClick={() => setEditing(chart)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-brand-700" aria-label={`Edit ${chart.name}`}>
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => setDeleting(chart)} className="rounded-full p-2 text-gray-500 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${chart.name}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <SizeChartFormModal
          chart={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
      )}

      <ConfirmModal
        open={!!deleting}
        title="Delete size chart?"
        message={
          deleting?.productCount
            ? `"${deleting.name}" is used by ${deleting.productCount} item(s). They'll no longer show a size chart.`
            : `"${deleting?.name}" will be removed.`
        }
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
