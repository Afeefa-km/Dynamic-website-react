import type { BusinessType, Currency, OrderStatus, ProductSize, ProductStatus, StoreTheme } from '../constants/enums'

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
  theme: StoreTheme
  /** Home page cover photos in display order (max 3); each theme uses as many as it needs */
  coverImages: string[]
  createdAt: string
}

export type StoreInput = Omit<Store, 'id' | 'slug' | 'createdAt' | 'theme' | 'coverImages'>

export interface Category {
  id: string
  name: string
  /** null for a top-level category */
  parentId: string | null
  depth: number
  /** Full label from the top level down, e.g. "Women › Kurtas" */
  path: string
  /** Items directly in this category */
  productCount: number
  /** Items in this category and everything nested under it */
  totalProductCount: number
}

export interface CategoryPathItem {
  id: string
  name: string
}

export interface ProductImage {
  id: string
  imageUrl: string
  displayOrder: number
}

export interface ProductVariant {
  size: ProductSize
  stockQuantity: number
}

export interface Product {
  id: string
  storeId: string
  name: string
  description: string
  /** Long-form product information shown on the product page */
  details: string
  categoryId: string
  categoryName: string
  /** Top-level category first, the product's own category last */
  categoryPath: CategoryPathItem[]
  sizeChartId: string | null
  sizeChartName: string | null
  price: number
  discountPrice: number | null
  costPrice: number
  sku: string
  /** System-generated 8-digit code shoppers and owners can search by */
  productCode: string
  variants: ProductVariant[]
  stockQuantity: number
  status: ProductStatus
  images: ProductImage[]
  createdAt: string
  updatedAt: string
}

export interface ProductInput {
  name: string
  description?: string
  details?: string
  categoryId: string
  sizeChartId?: string | null
  price: number
  discountPrice?: number | null
  costPrice: number
  variants: ProductVariant[]
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
  theme: StoreTheme
  coverImages: string[]
  /** In tree order; only categories with something to buy */
  categories: StorefrontCategory[]
}

export interface StorefrontCategory {
  id: string
  name: string
  parentId: string | null
}

export interface StorefrontProduct {
  id: string
  name: string
  description: string
  /** Long-form product information shown on the product page */
  details: string
  categoryId: string
  categoryName: string
  /** Top-level category first, the product's own category last */
  categoryPath: CategoryPathItem[]
  price: number
  discountPrice: number | null
  sku: string
  /** System-generated 8-digit code shoppers and owners can search by */
  productCode: string
  variants: ProductVariant[]
  sizeChart: StorefrontSizeChart | null
  inStock: boolean
  stockQuantity: number
  images: string[]
  isNew: boolean
}

export interface OrderItem {
  productId: string | null
  productName: string
  sku: string
  /** Snapshot taken when the order was placed; empty for very old orders whose product is gone */
  productCode: string
  size: ProductSize
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

export interface DashboardKpis {
  totalOrders: number
  placedOrders: number
  cancelledOrders: number
  itemsSold: number
  revenue: number
  averageOrderValue: number
  cost: number
  profit: number
  marginPercent: number
}

export interface DashboardStatusCount {
  status: OrderStatus
  count: number
  revenue: number
}

export interface DashboardTopItem {
  productName: string
  quantity: number
  revenue: number
  cost: number
  profit: number
}

export interface DashboardUnderperformer {
  productName: string
  quantity: number
  revenue: number
  profit: number
  stockQuantity: number
  /** Unsold stock valued at purchase price */
  stockValue: number
}

export interface DashboardPoint {
  periodStart: string
  orders: number
  placed: number
  cancelled: number
  revenue: number
  profit: number
}

export interface OrderDashboard {
  from: string
  to: string
  grain: 'Day' | 'Week' | 'Month'
  current: DashboardKpis
  previous: DashboardKpis
  mostOrderedItem: string | null
  mostOrderedQuantity: number
  mostProfitableItem: DashboardTopItem | null
  byStatus: DashboardStatusCount[]
  topItems: DashboardTopItem[]
  topProfitItems: DashboardTopItem[]
  underperformers: DashboardUnderperformer[]
  productsMissingCost: number
  series: DashboardPoint[]
}

export interface PlaceOrderInput {
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: string
  notes?: string
  items: { productId: string; size: ProductSize; quantity: number }[]
}

export interface LowStockAlert {
  productId: string
  productName: string
  sku: string
  productCode: string
  /** 'None' for products without sizes */
  size: ProductSize
  stockQuantity: number
  updatedAt: string
}

export interface LowStock {
  /** A size is listed when fewer than this many are left */
  threshold: number
  items: LowStockAlert[]
}

/** A reusable size guide, named for the garment it fits (e.g. "Kurti") */
export interface SizeChart {
  id: string
  name: string
  description: string
  /** Image paths in display order, 1 to 3 */
  images: string[]
  /** How many products show this chart */
  productCount: number
}

export interface SizeChartInput {
  name: string
  description?: string
  images: string[]
}

export interface StorefrontSizeChart {
  name: string
  description: string
  images: string[]
}
