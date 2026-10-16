import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronDown, ChevronRight, FolderPlus, Pencil, Plus, Tags, Trash2, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ConfirmModal } from '../../components/admin/ConfirmModal'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input, Select } from '../../components/ui/Field'
import { PageLoader } from '../../components/ui/Spinner'
import { canHaveChildren, categoryOptions, descendantIds, MAX_CATEGORY_LEVELS } from '../../lib/categories'
import { categoryApi } from '../../lib/services'
import type { Category } from '../../types/api'

interface Editing {
  id: string
  name: string
  parentId: string
}

export default function CategoriesPage() {
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState<Editing | null>(null)
  const [addingUnder, setAddingUnder] = useState<{ parentId: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const query = useQuery({ queryKey: ['categories'], queryFn: categoryApi.list })
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  const categories = query.data ?? []

  const createMutation = useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId: string | null }) => categoryApi.create(name, parentId),
    onSuccess: (_, { parentId }) => {
      if (parentId) {
        setAddingUnder(null)
        expand(parentId)
      } else {
        setNewName('')
      }
      refresh()
    },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, name, parentId }: Editing) => categoryApi.update(id, name, parentId || null),
    onSuccess: (_, { parentId }) => {
      setEditing(null)
      if (parentId) expand(parentId)
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

  const expand = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      return next
    })

  const submitNew = (e: FormEvent) => {
    e.preventDefault()
    if (newName.trim()) createMutation.mutate({ name: newName.trim(), parentId: null })
  }

  const parentIds = new Set(categories.map((c) => c.parentId))

  // The list arrives in tree order, so everything deeper than a collapsed row is hidden until the next row at its level
  const visible: Category[] = []
  let hiddenBelow: number | null = null
  for (const c of categories) {
    if (hiddenBelow !== null && c.depth > hiddenBelow) continue
    hiddenBelow = collapsed.has(c.id) ? c.depth : null
    visible.push(c)
  }

  // A category can't be moved inside itself or its own subcategories, or anywhere that would push its subtree past the level limit
  const moveTargets = (id: string) => {
    const subtree = categories.filter((c) => descendantIds(categories, id).has(c.id))
    const own = subtree.find((c) => c.id === id)!
    const height = Math.max(...subtree.map((c) => c.depth)) - own.depth + 1
    return categoryOptions(categories.filter((c) => !subtree.includes(c) && c.depth + 1 + height <= MAX_CATEGORY_LEVELS))
  }

  const deleteMessage = (c: Category) => {
    if (parentIds.has(c.id)) return `"${c.name}" has subcategories. Move or delete them first.`
    if (c.productCount) return `"${c.name}" still has ${c.productCount} item(s). Move them to another category first.`
    return `"${c.name}" will be removed.`
  }

  const iconButton = 'rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-brand-700'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-sm text-gray-500">
          Group your inventory the way your shoppers browse. Nest categories up to {MAX_CATEGORY_LEVELS} levels, e.g. Women › Ethnic › Kurtas.
        </p>
      </div>

      <form onSubmit={submitNew} className="mb-5 flex gap-3 rounded-3xl bg-white p-3">
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={60} placeholder="New top-level category, e.g. Women" aria-label="New category name" />
        <Button type="submit" loading={createMutation.isPending && !addingUnder} disabled={!newName.trim()} className="shrink-0">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </form>

      {query.isPending ? (
        <PageLoader label="Loading categories…" />
      ) : query.isError ? (
        <EmptyState icon={<Tags />} title="Couldn't load categories" text="Please try again." action={<Button onClick={() => query.refetch()}>Retry</Button>} />
      ) : categories.length === 0 ? (
        <EmptyState icon={<Tags />} title="No categories yet" text="Create your first category above, then add subcategories and assign inventory items to them." />
      ) : (
        <ul className="divide-y divide-gray-100 rounded-3xl bg-white">
          {visible.map((c) => {
            const hasChildren = parentIds.has(c.id)
            const indent = { paddingLeft: `${1.25 + c.depth * 1.5}rem` }
            return (
              <li key={c.id}>
                <div className="flex items-center gap-2 py-3 pr-5" style={indent}>
                  {hasChildren ? (
                    <button
                      onClick={() => toggle(c.id)}
                      className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
                      aria-expanded={!collapsed.has(c.id)}
                      aria-label={`${collapsed.has(c.id) ? 'Expand' : 'Collapse'} ${c.name}`}
                    >
                      {collapsed.has(c.id) ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  ) : (
                    <span className="w-6 shrink-0" />
                  )}

                  {editing?.id === c.id ? (
                    <form
                      className="flex flex-1 flex-wrap items-center gap-2"
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (editing.name.trim()) updateMutation.mutate({ ...editing, name: editing.name.trim() })
                      }}
                    >
                      <Input
                        autoFocus
                        value={editing.name}
                        maxLength={60}
                        onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                        aria-label="Category name"
                        className="min-w-40 flex-1"
                      />
                      <Select
                        value={editing.parentId}
                        onChange={(e) => setEditing({ ...editing, parentId: e.target.value })}
                        options={moveTargets(c.id)}
                        placeholder="Top level (no parent)"
                        aria-label="Parent category"
                        className="min-w-40 flex-1"
                      />
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
                        <p className={`truncate ${c.depth === 0 ? 'font-semibold' : 'font-medium'}`}>{c.name}</p>
                        <p className="text-xs text-gray-500">
                          {c.totalProductCount} {c.totalProductCount === 1 ? 'item' : 'items'}
                          {hasChildren && c.productCount > 0 && ` · ${c.productCount} directly here`}
                        </p>
                      </div>
                      {canHaveChildren(c) ? (
                        <button onClick={() => setAddingUnder({ parentId: c.id, name: '' })} className={iconButton} aria-label={`Add subcategory under ${c.name}`} title="Add subcategory">
                          <FolderPlus className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="w-8 shrink-0" />
                      )}
                      <button onClick={() => setEditing({ id: c.id, name: c.name, parentId: c.parentId ?? '' })} className={iconButton} aria-label={`Rename or move ${c.name}`} title="Rename or move">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleting(c)} className="rounded-full p-2 text-gray-500 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${c.name}`} title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>

                {addingUnder?.parentId === c.id && (
                  <form
                    className="flex items-center gap-2 pr-5 pb-3"
                    style={{ paddingLeft: `${1.25 + (c.depth + 1) * 1.5 + 1.5}rem` }}
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (addingUnder.name.trim()) createMutation.mutate({ name: addingUnder.name.trim(), parentId: c.id })
                    }}
                  >
                    <Input
                      autoFocus
                      value={addingUnder.name}
                      maxLength={60}
                      onChange={(e) => setAddingUnder({ parentId: c.id, name: e.target.value })}
                      placeholder={`New subcategory under ${c.name}`}
                      aria-label={`New subcategory under ${c.name}`}
                    />
                    <Button type="submit" loading={createMutation.isPending} disabled={!addingUnder.name.trim()} className="shrink-0 px-4">
                      Add
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setAddingUnder(null)} className="shrink-0 px-3" aria-label="Cancel">
                      <X className="h-4 w-4" />
                    </Button>
                  </form>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmModal
        open={!!deleting}
        title="Delete category?"
        message={deleting ? deleteMessage(deleting) : ''}
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
