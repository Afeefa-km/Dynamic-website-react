import { API_URL } from './api'

export function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

/** Uploaded files come back as relative paths served by the API. */
export function mediaUrl(path?: string | null) {
  if (!path) return ''
  return path.startsWith('http') ? path : `${API_URL}${path}`
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export const effectivePrice = (p: { price: number; discountPrice: number | null }) =>
  p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.price ? p.discountPrice : p.price
