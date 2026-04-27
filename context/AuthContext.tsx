'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { User, Role, LoginCredentials, RegisterCredentials } from '@/types/auth'
import { decodeJwtPayload } from '@/types/auth'
import { MOCK_USERS } from '@/data/users'
import {
  authApi,
  setTokens,
  clearTokens,
  getAccessToken,
  backendRoleToFrontend,
  frontendRoleToBackend,
  ApiError,
  type BackendUser,
} from '@/lib/api'
import { startGoogleSignIn, consumeGoogleRedirect, signOutFromFirebase } from '@/lib/firebase'

// ─── Context shape ─────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<User>
  googleLogin: () => Promise<void>
  startConnectGoogle: () => Promise<void>
  googleRedirectMsg: string | null
  clearGoogleRedirectMsg: () => void
  googleLoginWithRole: (role: Role) => Promise<boolean>
  demoLogin: (role: Role) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => Promise<void>
  /** Re-fetch /auth/me and refresh user in state + localStorage */
  refreshUser: () => Promise<void>
  isLoading: boolean
  error: string | null
  clearError: () => void
  pendingGoogleRole: { email: string; name: string; picture: string | null; idToken: string } | null
}

const AuthContext = createContext<AuthContextValue | null>(null)
const STORAGE_KEY = 'glimmora_care_user'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function backendUserToUser(b: BackendUser, accessToken?: string): User {
  return {
    id: b.id,
    name: `${b.first_name} ${b.last_name}`.trim(),
    email: b.email,
    role: backendRoleToFrontend(b.role),
    organization: b.organization ?? undefined,
    location: b.location ?? undefined,
    phone_number: b.phone_number ?? undefined,
    gender: b.gender ?? undefined,
    avatar: b.profile_photo ?? undefined,
    createdAt: b.created_at ?? new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    accessToken,
    familyId: b.family_id ?? null,
    emailVerified: b.email_verified,
    firebase_uid: b.firebase_uid ?? null,
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingGoogleRole, setPendingGoogleRole] = useState<{
    email: string
    name: string
    picture: string | null
    idToken: string
  } | null>(null)

  const clearError = useCallback(() => setError(null), [])

  function persistUser(u: User) {
    setUser(u)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
  }

  // Rehydrate on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: User = JSON.parse(stored)
        if (parsed.accessToken) {
          const payload = decodeJwtPayload(parsed.accessToken)
          const exp = payload?.exp as number | undefined
          if (exp && Date.now() / 1000 > exp) {
            localStorage.removeItem(STORAGE_KEY)
            clearTokens()
          } else {
            setUser(parsed)
          }
        } else {
          // demo user — no token
          setUser(parsed)
        }
      }
    } catch {
      // ignore
    }
    setIsLoading(false)
  }, [])

  // ─── Refresh user from /auth/me ─────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return
    try {
      const me = await authApi.me()
      const updated = backendUserToUser(me, token)
      persistUser(updated)
    } catch {
      // silently fail — user stays as-is
    }
  }, [])

  // ─── Real login ─────────────────────────────────────────────────────────────
  const login = useCallback(async ({ email, password }: LoginCredentials) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await authApi.login(email, password)
      setTokens(data.accessToken, data.refreshToken)

      // Fetch full user details from /auth/me
      let loggedInUser: User
      try {
        const me = await authApi.me()
        loggedInUser = backendUserToUser(me, data.accessToken)
      } catch {
        // Fallback: decode from JWT if /me fails
        const payload = decodeJwtPayload(data.accessToken)
        loggedInUser = {
          id: (payload?.sub as string) ?? '',
          name: email.split('@')[0],
          email,
          role: backendRoleToFrontend((payload?.role as string) ?? 'patient'),
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          accessToken: data.accessToken,
        }
      }

      persistUser(loggedInUser)
      return loggedInUser
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.status === 401 ? 'Invalid email or password.' : err.detail)
      } else {
        setError('Unable to connect to server. Check your connection.')
      }
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ─── Demo login ──────────────────────────────────────────────────────────────
  const demoLogin = useCallback(async (role: Role) => {
    setIsLoading(true)
    setError(null)
    await new Promise((r) => setTimeout(r, 600))
    const mockUser = MOCK_USERS.find((u) => u.role === role) ?? MOCK_USERS[0]
    const demoUser: User = { ...mockUser, lastLogin: new Date().toISOString() }
    persistUser(demoUser)
    setIsLoading(false)
  }, [])

  // ─── Google login (redirect flow) ───────────────────────────────────────────
  // Initiates a redirect to Google. The page navigates away; the response is
  // picked up by the redirect handler below when the user lands back in the app.
  const googleLogin = useCallback(async () => {
    setError(null)
    try {
      await startGoogleSignIn('login')
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      const message = (err as { message?: string }).message ?? ''
      console.error('[Google login redirect error]', code, message, err)
      if (code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized in Firebase. Add it to Firebase Console → Authentication → Authorized domains.')
      } else if (code === 'auth/operation-not-allowed') {
        setError('Google sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method.')
      } else {
        setError(`Google sign-in failed: ${code ?? message}`)
      }
    }
  }, [])

  const startConnectGoogle = useCallback(async () => {
    setError(null)
    try {
      await startGoogleSignIn('connect')
    } catch (err) {
      console.error('[Google connect redirect error]', err)
      setError('Failed to start Google connect flow.')
    }
  }, [])

  // ─── Handle return from Google redirect ─────────────────────────────────────
  const [googleRedirectMsg, setGoogleRedirectMsg] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const payload = await consumeGoogleRedirect()
        if (!payload || cancelled) return

        if (payload.intent === 'connect') {
          setIsLoading(true)
          try {
            await authApi.connectGoogle(payload.idToken)
            const token = getAccessToken()
            if (token) {
              const me = await authApi.me()
              persistUser(backendUserToUser(me, token))
            }
            setGoogleRedirectMsg('Google account connected successfully.')
          } catch (err) {
            console.error('[Google connect error]', err)
            setError('Failed to connect Google account. Please try again.')
          } finally {
            setIsLoading(false)
          }
          return
        }

        // intent === 'login'
        setIsLoading(true)
        try {
          const result = await authApi.googleSignIn(payload.idToken)
          if ('needs_role' in result) {
            setPendingGoogleRole({
              email: result.email,
              name: result.name,
              picture: result.picture,
              idToken: payload.idToken,
            })
          } else {
            setTokens(result.accessToken, result.refreshToken)
            const me = await authApi.me()
            persistUser(backendUserToUser(me, result.accessToken))
          }
        } catch (err) {
          console.error('[Google login exchange error]', err)
          setError('Google sign-in failed. Please try again.')
        } finally {
          setIsLoading(false)
        }
      } catch (err) {
        console.error('[consumeGoogleRedirect]', err)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const googleLoginWithRole = useCallback(async (role: Role): Promise<boolean> => {
    if (!pendingGoogleRole) return false
    setIsLoading(true)
    setError(null)
    try {
      const result = await authApi.googleSignIn(
        pendingGoogleRole.idToken,
        frontendRoleToBackend(role)
      )
      if ('needs_role' in result) {
        setError('Role selection failed. Please try again.')
        return false
      }
      setPendingGoogleRole(null)
      setTokens(result.accessToken, result.refreshToken)
      const me = await authApi.me()
      const mapped = backendUserToUser(me, result.accessToken)
      persistUser(mapped)
      return true
    } catch {
      setError('Google sign-in failed. Please try again.')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [pendingGoogleRole])

  // ─── Register ────────────────────────────────────────────────────────────────
  const register = useCallback(async ({
    firstName, lastName, email, phone, password, role,
  }: RegisterCredentials) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await authApi.register({
        first_name: firstName,
        last_name: lastName,
        email,
        phone_number: phone,
        role: frontendRoleToBackend(role),
        password,
      })
      setTokens(data.accessToken, data.refreshToken)

      // Fetch full user details
      let newUser: User
      try {
        const me = await authApi.me()
        newUser = backendUserToUser(me, data.accessToken)
      } catch {
        newUser = {
          id: data.userId,
          name: `${firstName} ${lastName}`.trim(),
          email,
          role,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          accessToken: data.accessToken,
          familyId: data.familyId,
        }
      }

      persistUser(newUser)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 409 || err.status === 400
            ? 'An account with this email or phone already exists.'
            : err.detail,
        )
      } else {
        setError('Unable to connect to server. Check your connection.')
      }
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ─── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      const token = getAccessToken()
      if (token) await authApi.logout()
    } catch {
      // ignore errors — clear locally regardless
    }
    try {
      await signOutFromFirebase()
    } catch {
      // ignore firebase sign-out errors
    }
    clearTokens()
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      googleLogin,
      startConnectGoogle,
      googleRedirectMsg,
      clearGoogleRedirectMsg: () => setGoogleRedirectMsg(null),
      googleLoginWithRole,
      demoLogin,
      register,
      logout,
      refreshUser,
      isLoading,
      error,
      clearError,
      pendingGoogleRole,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
