'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { User, Role } from '@/types/auth'
import { MOCK_USERS } from '@/data/users'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  login: (role: Role) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'glimmora_care_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setUser(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (role: Role) => {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    const mockUser = MOCK_USERS.find((u) => u.role === role) ?? MOCK_USERS[0]
    const userWithLogin: User = { ...mockUser, lastLogin: new Date().toISOString() }
    setUser(userWithLogin)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userWithLogin))
    setIsLoading(false)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
