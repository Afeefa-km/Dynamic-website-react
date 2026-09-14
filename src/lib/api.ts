import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import toast from 'react-hot-toast'
import type { ApiResponse } from '../types/api'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5062'
export const TOKEN_KEY = 'storely.token'

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Suppress the automatic success toast (errors still show unless `silentError`). */
    silent?: boolean
    silentError?: boolean
  }
}

export const http = axios.create({ baseURL: `${API_URL}/api` })

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (response) => {
    // Success toast for every mutating call; reads stay quiet so pages don't spam toasts while browsing
    const method = response.config.method?.toUpperCase()
    const body = response.data as ApiResponse<unknown>
    if (method !== 'GET' && !response.config.silent && body?.message) {
      toast.success(body.message)
    }
    return response
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY) && !error.config?.url?.includes('/auth/')) {
      localStorage.removeItem(TOKEN_KEY)
      window.dispatchEvent(new Event('storely:logout'))
    }
    if (!error.config?.silentError) {
      toast.error(errorMessage(error))
    }
    return Promise.reject(error)
  },
)

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiResponse<unknown> | undefined
    if (!error.response) return 'Cannot reach the server. Please check your connection.'
    if (body?.errors?.length) return body.errors.join('\n')
    if (body?.message) return body.message
  }
  return 'Something went wrong. Please try again.'
}

// Thin helpers that unwrap ApiResponse.data
export async function get<T>(url: string, config?: AxiosRequestConfig) {
  return (await http.get<ApiResponse<T>>(url, config)).data.data
}
export async function post<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
  return (await http.post<ApiResponse<T>>(url, body, config)).data.data
}
export async function put<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
  return (await http.put<ApiResponse<T>>(url, body, config)).data.data
}
export async function patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
  return (await http.patch<ApiResponse<T>>(url, body, config)).data.data
}
export async function del<T>(url: string, config?: AxiosRequestConfig) {
  return (await http.delete<ApiResponse<T>>(url, config)).data.data
}

export function uploadFile<T>(url: string, file: File, config?: AxiosRequestConfig) {
  const form = new FormData()
  form.append('file', file)
  return post<T>(url, form, config)
}
