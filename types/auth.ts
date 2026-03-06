export type Role = 'patient' | 'doctor' | 'ngo_worker' | 'gov_analyst' | 'admin'

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
}

export interface AuthSession {
  user: User | null
  isAuthenticated: boolean
}

export interface LoginCredentials {
  email: string
  password: string
  role: Role
}
