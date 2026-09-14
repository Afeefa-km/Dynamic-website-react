import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Pencil, Plus, Tags, Trash2, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ConfirmModal } from '../../components/admin/ConfirmModal'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Field'
import { PageLoader } from '../../components/ui/Spinner'
import { categoryApi } from '../../lib/services'
import type { Category } from '../../types/api'

export default function CategoriesPage() {
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)

  const query = useQuery({ queryKey: ['categories'], queryFn: categoryApi.list })
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['categories'] })

  const createMutation = useMutation({
    mutationFn: (name: string) => categoryApi.create(name),
    onSuccess: () => {
      setNewName('')
      refresh()
    },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => categoryApi.update(id, name),
    onSuccess: () => {
      setEditing(null)
      refresh()
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryApi.remove(id),
    onSuccess: () => {
      setDeleting(null)
      refresh()
    },
    onError: () => setDeleting(null),
  })

  const submitNew = (e: FormEvent) => {
    e.preventDefault()
    if (newName.trim()) createMutation.mutate(newName.trim())
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-sm text-gray-500">Group your inventory the way your shoppers browse — e.g. Kurtas, Sneakers, Dairy.</p>
      </div>

      <form onSubmit={submitNew} className="mb-5 flex gap-3 rounded-3xl bg-white p-3">
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={60} placeholder="New category name" aria-label="New category name" />
        <Button type="submit" loading={createMutation.isPending} disabled={!newName.trim()} className="shrink-0">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </form>

      {query.isPending ? (
        <PageLoader label="Loading categories…" />
      ) : query.isError ? (
        <EmptyState icon={<Tags />} title="Couldn't load categories" text="Please try again." action={<Button onClick={() => query.refetch()}>Retry</Button>} />
      ) : query.data.length === 0 ? (
        <EmptyState icon={<Tags />} title="No categories yet" text="Create your first category above, then assign inventory items to it." />
      ) : (
        <ul className="divide-y divide-gray-100 rounded-3xl bg-white">
          {query.data.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-5 py-3">
              {editing?.id === c.id ? (
                <form
                  className="flex flex-1 items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (editing.name.trim()) updateMutation.mutate({ id: c.id, name: editing.name.trim() })
                  }}
                >
                  <Input autoFocus value={editing.name} maxLength={60} onChange={(e) => setEditing({ id: c.id, name: e.target.value })} aria-label="Category name" />
                  <Button type="submit" loading={updateMutation.isPending} className="shrink-0 px-3" aria-label="Save">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setEditing(null)} className="shrink-0 px-3" aria-label="Cancel">
                    <X className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.productCount} {c.productCount === 1 ? 'item' : 'items'}</p>
                  </div>
                  <button onClick={() => setEditing({ id: c.id, name: c.name })} className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-brand-700" aria-label={`Rename ${c.name}`}>
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleting(c)} className="rounded-full p-2 text-gray-500 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${c.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        open={!!deleting}
        title="Delete category?"
        message={
          deleting?.productCount
            ? `"${deleting.name}" still has ${deleting.productCount} item(s). Move them to another category first.`
            : `"${deleting?.name}" will be removed.`
        }
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
