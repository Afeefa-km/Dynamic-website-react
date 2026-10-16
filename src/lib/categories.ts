import type { Category } from '../types/api'

/** Keep in sync with CategoryTree.MaxLevels on the API. Depth 0 is the top level, so the deepest allowed depth is MAX_CATEGORY_LEVELS - 1. */
export const MAX_CATEGORY_LEVELS = 3

export const PATH_SEPARATOR = ' › '

interface Node {
  id: string
  parentId: string | null
}

/** Options for a <select>, labelled by full path so same-named subcategories ("Men › Shirts", "Women › Shirts") stay distinct. */
export function categoryOptions(categories: Category[]) {
  return categories.map((c) => ({ value: c.id, label: c.path }))
}

/** The category itself plus everything nested under it. */
export function descendantIds(categories: Node[], id: string) {
  const ids = new Set([id])
  let grew = true
  while (grew) {
    grew = false
    for (const c of categories) {
      if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
        ids.add(c.id)
        grew = true
      }
    }
  }
  return ids
}

/** From the top level down to the category itself. */
export function ancestorsOf<T extends Node>(categories: T[], id: string) {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const path: T[] = []
  const seen = new Set<string>()
  let cursor = byId.get(id)
  while (cursor && !seen.has(cursor.id)) {
    seen.add(cursor.id)
    path.unshift(cursor)
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined
  }
  return path
}

/** Categories that can still take a subcategory. */
export const canHaveChildren = (c: Category) => c.depth < MAX_CATEGORY_LEVELS - 1

export const childrenOf = <T extends Node>(categories: T[], parentId: string | null) =>
  categories.filter((c) => c.parentId === parentId)
