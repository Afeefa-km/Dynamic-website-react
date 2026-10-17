import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import type { StorefrontProduct } from '../types/api'

export interface WishlistItem {
  productId: string
  name: string
  image?: string
  price: number
  discountPrice: number | null
}

interface WishlistState {
  items: WishlistItem[]
  has: (productId: string) => boolean
  toggle: (product: StorefrontProduct) => void
  remove: (productId: string) => void
}

const WishlistContext = createContext<WishlistState | null>(null)

const read = (key: string): WishlistItem[] => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as WishlistItem[]
  } catch {
    return []
  }
}

/** Guest wishlist per store, kept in localStorage. */
export function WishlistProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const storageKey = `storely.wishlist.${slug}`
  const [items, setItems] = useState<WishlistItem[]>(() => read(storageKey))

  useEffect(() => localStorage.setItem(storageKey, JSON.stringify(items)), [storageKey, items])

  const toggle = useCallback(
    (p: StorefrontProduct) => {
      const saved = items.some((i) => i.productId === p.id)
      setItems((prev) =>
        saved
          ? prev.filter((i) => i.productId !== p.id)
          : [...prev, { productId: p.id, name: p.name, image: p.images[0], price: p.price, discountPrice: p.discountPrice }],
      )
      toast.success(saved ? `Removed "${p.name}" from your wishlist` : `Added "${p.name}" to your wishlist`, { id: `wishlist-${p.id}` })
    },
    [items],
  )
  const remove = useCallback(
    (id: string) => {
      const item = items.find((i) => i.productId === id)
      setItems((prev) => prev.filter((i) => i.productId !== id))
      if (item) toast.success(`Removed "${item.name}" from your wishlist`, { id: `wishlist-${id}` })
    },
    [items],
  )
  const has = useCallback((id: string) => items.some((i) => i.productId === id), [items])

  const value = useMemo(() => ({ items, has, toggle, remove }), [items, has, toggle, remove])
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider')
  return ctx
}
