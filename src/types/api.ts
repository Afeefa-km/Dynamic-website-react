import type {
  BusinessType, Currency, OrderStatus, ProductSize, ProductStatus,
} from '../constants/enums'

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  errors: string[] | null
}

export interface Paged<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface User {
  id: string
  fullName: string
  email: string
  phoneNumber: string
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: User
  hasStore: boolean
  storeId: string | null
  storeSlug: string | null
}

export interface Store {
  id: string
  name: string
  slug: string
  logoUrl: string
  businessType: BusinessType
  businessDescription: string
  contactEmail: string
  contactPhone: string
  businessAddress: string
  currency: Currency
  createdAt: string
}

export type StoreInput = Omit<Store, 'id' | 'slug' | 'createdAt'>

export interface Category {
  id: string
  name: string
  productCount: number
}

export interface ProductImage {
  id: string
  imageUrl: string
  displayOrder: number
}

export interface Product {
  id: string
  storeId: string
  name: string
  description: string
  categoryId: string
  categoryName: string
  price: number
  discountPrice: number | null
  sku: string
  size: ProductSize
  stockQuantity: number
  status: ProductStatus
  images: ProductImage[]
  createdAt: string
  updatedAt: string
}

export interface ProductInput {
  name: string
  description?: string
  categoryId: string
  price: number
  discountPrice?: number | null
  size: ProductSize
  stockQuantity: number
  status: ProductStatus
}

export interface Storefront {
  name: string
  slug: string
  logoUrl: string
  businessType: BusinessType
  businessDescription: string
  contactEmail: string
  contactPhone: string
  businessAddress: string
  currency: Currency
  categories: { id: string; name: string }[]
}

export interface StorefrontProduct {
  id: string
  name: string
  description: string
  categoryId: string
  categoryName: string
  price: number
  discountPrice: number | null
  sku: string
  size: ProductSize
  inStock: boolean
  stockQuantity: number
  images: string[]
  isNew: boolean
}

export interface OrderItem {
  productId: string | null
  productName: string
  sku: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

export interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: string
  notes: string
  status: OrderStatus
  totalAmount: number
  items: OrderItem[]
  createdAt: string
}

export interface PlaceOrderInput {
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: string
  notes?: string
  items: { productId: string; quantity: number }[]
}
