export type Role = 'patient' | 'doctor' | 'ngo_worker' | 'gov_analyst' | 'admin' | 'super_admin'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  avatar?: string
  organization?: string
  location?: string
  createdAt: string
  lastLogin?: string
  /** populated from JWT access token after real login */
  accessToken?: string
  /** family id for patient accounts */
  familyId?: string | null
}

export interface AuthSession {
  user: User | null
  isAuthenticated: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  role: Role
}

/** Decode a JWT payload without verifying signature (client-side only) */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split('.')
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}
