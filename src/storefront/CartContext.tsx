import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import { effectivePrice } from '../lib/format'
import type { StorefrontProduct } from '../types/api'

export interface CartItem {
  productId: string
  name: string
  image?: string
  unitPrice: number
  quantity: number
  maxQuantity: number
}

interface CartState {
  items: CartItem[]
  count: number
  subtotal: number
  add: (product: StorefrontProduct, quantity?: number) => void
  setQuantity: (productId: string, quantity: number) => void
  remove: (productId: string) => void
  clear: () => void
}

const CartContext = createContext<CartState | null>(null)

const read = (key: string): CartItem[] => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as CartItem[]
  } catch {
    return []
  }
}

/** One cart per store, persisted in localStorage. */
export function CartProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const storageKey = `storely.cart.${slug}`
  const [items, setItems] = useState<CartItem[]>(() => read(storageKey))

  useEffect(() => setItems(read(storageKey)), [storageKey])
  useEffect(() => localStorage.setItem(storageKey, JSON.stringify(items)), [storageKey, items])

  const add = useCallback((product: StorefrontProduct, quantity = 1) => {
    if (!product.inStock) return
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      const nextQty = Math.min((existing?.quantity ?? 0) + quantity, product.stockQuantity)
      const item: CartItem = {
        productId: product.id,
        name: product.name,
        image: product.images[0],
        unitPrice: effectivePrice(product),
        quantity: nextQty,
        maxQuantity: product.stockQuantity,
      }
      return existing ? prev.map((i) => (i.productId === product.id ? item : i)) : [...prev, item]
    })
    toast.success(`${product.name} added to bag`)
  }, [])

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxQuantity)) } : i)))
  }, [])

  const remove = useCallback((productId: string) => setItems((prev) => prev.filter((i) => i.productId !== productId)), [])
  const clear = useCallback(() => setItems([]), [])

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((n, i) => n + i.quantity * i.unitPrice, 0),
      add,
      setQuantity,
      remove,
      clear,
    }),
    [items, add, setQuantity, remove, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
