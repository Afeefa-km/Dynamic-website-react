// Categories are owner-created (see categoryApi), not an enum.
// Mirrors the backend enums (DynamicWebsite.Domain.Enums). Values are sent/received as strings.

const options = <T extends string>(values: readonly T[], labels: Partial<Record<T, string>> = {}) =>
  values.map((value) => ({ value, label: labels[value] ?? value }))

export const BUSINESS_TYPES = [
  'Clothing', 'Shoes', 'Supermarket', 'Electronics', 'Beauty', 'HomeAndLiving', 'Jewelry', 'Books', 'Sports', 'Toys', 'Other',
] as const
export type BusinessType = (typeof BUSINESS_TYPES)[number]
export const businessTypeOptions = options(BUSINESS_TYPES, { HomeAndLiving: 'Home & Living' })

export const PRODUCT_STATUSES = ['Active', 'Draft', 'OutOfStock', 'Archived'] as const
export type ProductStatus = (typeof PRODUCT_STATUSES)[number]
export const productStatusOptions = options(PRODUCT_STATUSES, { OutOfStock: 'Out of stock' })

export const PRODUCT_SIZES = ['None', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'FreeSize'] as const
export type ProductSize = (typeof PRODUCT_SIZES)[number]
export const sizeOptions = options(PRODUCT_SIZES, { None: 'Not applicable', FreeSize: 'Free size' })

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AED', 'SAR', 'QAR'] as const
export type Currency = (typeof CURRENCIES)[number]
export const currencyOptions = options(CURRENCIES)

export const ORDER_STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]
export const orderStatusOptions = options(ORDER_STATUSES)

export const labelOf = (list: { value: string; label: string }[], value: string) =>
  list.find((o) => o.value === value)?.label ?? value
