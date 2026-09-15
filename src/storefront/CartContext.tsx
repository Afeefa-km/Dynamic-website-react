import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import { effectivePrice } from '../lib/format'
import type { ProductSize } from '../constants/enums'
import type { StorefrontProduct } from '../types/api'

export interface CartItem {
  key: string
  productId: string
  size: ProductSize
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
  add: (product: StorefrontProduct, size: ProductSize, quantity?: number) => void
  setQuantity: (key: string, quantity: number) => void
  remove: (key: string) => void
  clear: () => void
}

const CartContext = createContext<CartState | null>(null)

const read = (key: string): CartItem[] => {
  try {
    // Drop items saved before sizes were tracked per cart line
    return (JSON.parse(localStorage.getItem(key) ?? '[]') as CartItem[]).filter((i) => i.key && i.size)
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

  const add = useCallback((product: StorefrontProduct, size: ProductSize, quantity = 1) => {
    const stock = product.variants.find((v) => v.size === size)?.stockQuantity ?? 0
    if (stock <= 0) return
    const key = `${product.id}:${size}`
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key)
      const nextQty = Math.min((existing?.quantity ?? 0) + quantity, stock)
      const item: CartItem = {
        key,
        productId: product.id,
        size,
        name: product.name,
        image: product.images[0],
        unitPrice: effectivePrice(product),
        quantity: nextQty,
        maxQuantity: stock,
      }
      return existing ? prev.map((i) => (i.key === key ? item : i)) : [...prev, item]
    })
    toast.success(`${product.name} added to bag`)
  }, [])

  const setQuantity = useCallback((key: string, quantity: number) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxQuantity)) } : i)))
  }, [])

  const remove = useCallback((key: string) => setItems((prev) => prev.filter((i) => i.key !== key)), [])
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
