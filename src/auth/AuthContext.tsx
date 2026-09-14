import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { TOKEN_KEY } from '../lib/api'
import { authApi } from '../lib/services'
import type { AuthResponse, User } from '../types/api'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  initializing: boolean
  signIn: (response: AuthResponse) => void
  signOut: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  const [initializing, setInitializing] = useState(() => !!localStorage.getItem(TOKEN_KEY))

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
    queryClient.clear()
  }, [queryClient])

  const signIn = useCallback((response: AuthResponse) => {
    localStorage.setItem(TOKEN_KEY, response.token)
    setUser(response.user)
  }, [])

  // Restore the session from a stored token
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return
    authApi
      .me()
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setInitializing(false))
  }, [])

  useEffect(() => {
    window.addEventListener('storely:logout', signOut)
    return () => window.removeEventListener('storely:logout', signOut)
  }, [signOut])

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, initializing, signIn, signOut }),
    [user, initializing, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
