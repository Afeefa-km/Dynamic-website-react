import type {
  AuthResponse, Category, LowStock, Order, OrderDashboard, Paged, PlaceOrderInput, Product, ProductImage, ProductInput, Store, StoreInput, Storefront,
  StorefrontProduct, User,
} from '../types/api'
import type { OrderStatus, StoreTheme } from '../constants/enums'
import { del, get, patch, post, put, uploadFile } from './api'

export const authApi = {
  register: (body: { fullName: string; email: string; phoneNumber: string; password: string; confirmPassword: string }) =>
    post<AuthResponse>('/auth/register', body),
  login: (body: { email: string; password: string }) => post<AuthResponse>('/auth/login', body),
  me: () => get<User>('/auth/me', { silentError: true }),
}

export const storeApi = {
  // 404 simply means "no store yet", so don't toast it
  mine: () => get<Store>('/stores/my-store', { silentError: true }),
  create: (body: StoreInput) => post<Store>('/stores', body),
  update: (body: StoreInput) => put<Store>('/stores/my-store', body),
  updateTheme: (theme: StoreTheme) => put<Store>('/stores/my-store/theme', { theme }),
  uploadCover: (file: File) => uploadFile<{ url: string }>('/media/store-cover', file, { silent: true }),
  updateCovers: (coverImages: string[]) => put<Store>('/stores/my-store/covers', { coverImages }),
  uploadLogo: (file: File) => uploadFile<{ url: string }>('/media/store-logo', file, { silent: true }),
}

export const categoryApi = {
  list: () => get<Category[]>('/categories'),
  create: (name: string, parentId: string | null = null) => post<Category>('/categories', { name, parentId }),
  // parentId is always sent: leaving it out would move the category to the top level
  update: (id: string, name: string, parentId: string | null) => put<Category>(`/categories/${id}`, { name, parentId }),
  remove: (id: string) => del<boolean>(`/categories/${id}`),
}

export interface ProductQuery {
  categoryId?: string
  status?: string
  search?: string
  page?: number
  pageSize?: number
}

export const productApi = {
  list: (params: ProductQuery) => get<Paged<Product>>('/products', { params }),
  lowStock: () => get<LowStock>('/products/low-stock', { silentError: true }),
  create: (body: ProductInput) => post<Product>('/products', body, { silent: true }),
  update: (id: string, body: ProductInput) => put<Product>(`/products/${id}`, body, { silent: true }),
  remove: (id: string) => del<boolean>(`/products/${id}`, { silent: true }),
  uploadImage: (productId: string, file: File) =>
    uploadFile<ProductImage>(`/media/products/${productId}/images`, file, { silent: true }),
  removeImage: (productId: string, imageId: string) =>
    del<boolean>(`/media/products/${productId}/images/${imageId}`, { silent: true }),
}

export const orderApi = {
  list: (params: { status?: string; search?: string; days?: number; page?: number; pageSize?: number }) => get<Paged<Order>>('/orders', { params }),
  dashboard: (from: string, to: string) => get<OrderDashboard>('/orders/dashboard', { params: { from, to } }),
  updateStatus: (id: string, status: OrderStatus) => patch<Order>(`/orders/${id}/status`, { status }),
}

export type StorefrontSort = 'newest' | 'price_asc' | 'price_desc'

export const storefrontApi = {
  store: (slug: string) => get<Storefront>(`/storefront/${slug}`),
  products: (slug: string, params: { categoryId?: string; search?: string; sort?: StorefrontSort; page?: number; pageSize?: number }) =>
    get<Paged<StorefrontProduct>>(`/storefront/${slug}/products`, { params }),
  product: (slug: string, id: string, options?: { silentError?: boolean }) =>
    get<StorefrontProduct>(`/storefront/${slug}/products/${id}`, { silentError: options?.silentError }),
  placeOrder: (slug: string, body: PlaceOrderInput) => post<Order>(`/storefront/${slug}/orders`, body),
}
