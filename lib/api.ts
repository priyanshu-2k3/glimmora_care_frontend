/**
 * GlimmoraCare API Client
 * Wraps the FastAPI backend at http://127.0.0.1:8000/api/v1
 *
 * Role mapping:
 *   frontend  ngo_worker  ↔  backend  ngo
 *   frontend  gov_analyst ↔  backend  government
 */

import type { Role } from '@/types/auth'

const API_HOST = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000'
export const API_BASE = `${API_HOST}/api/v1`

// ─── Storage keys ─────────────────────────────────────────────────────────────
const KEY_ACCESS  = 'gc_access_token'
const KEY_REFRESH = 'gc_refresh_token'

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(KEY_ACCESS)
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(KEY_ACCESS, access)
  localStorage.setItem(KEY_REFRESH, refresh)
}

export function clearTokens(): void {
  localStorage.removeItem(KEY_ACCESS)
  localStorage.removeItem(KEY_REFRESH)
}

// ─── Role mapping ──────────────────────────────────────────────────────────────
export function backendRoleToFrontend(backendRole: string): Role {
  const map: Record<string, Role> = {
    patient:    'patient',
    doctor:     'doctor',
    ngo:        'ngo_worker',
    government: 'gov_analyst',
    admin:      'admin',
  }
  return (map[backendRole] ?? 'patient') as Role
}

export function frontendRoleToBackend(role: Role): string {
  const map: Record<Role, string> = {
    patient:     'patient',
    doctor:      'doctor',
    ngo_worker:  'ngo',
    gov_analyst: 'government',
    admin:       'admin',
  }
  return map[role]
}

// ─── Error class ──────────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
    message?: string,
  ) {
    super(message ?? detail)
    this.name = 'ApiError'
  }
}

// ─── Base fetch ───────────────────────────────────────────────────────────────
interface FetchOptions extends RequestInit {
  auth?: boolean
  skipRefresh?: boolean
}

async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { auth = true, skipRefresh = false, ...init } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }

  if (auth) {
    const token = getAccessToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })

  if (res.status === 401 && auth && !skipRefresh) {
    const refreshed = await tryRefreshToken()
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getAccessToken()}`
      const retryRes = await fetch(`${API_BASE}${path}`, { ...init, headers })
      if (!retryRes.ok) {
        const err = await retryRes.json().catch(() => ({ detail: 'Request failed' }))
        throw new ApiError(retryRes.status, err.detail ?? 'Request failed')
      }
      return retryRes.json() as Promise<T>
    }
    clearTokens()
    throw new ApiError(401, 'Session expired')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new ApiError(res.status, err.detail ?? 'Request failed')
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

async function tryRefreshToken(): Promise<boolean> {
  const refresh = typeof window !== 'undefined' ? localStorage.getItem(KEY_REFRESH) : null
  if (!refresh) return false
  try {
    const data = await apiFetch<{ accessToken: string }>('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: refresh }),
      auth: false,
      skipRefresh: true,
    })
    localStorage.setItem(KEY_ACCESS, data.accessToken)
    return true
  } catch {
    clearTokens()
    return false
  }
}

// ─── Response types ───────────────────────────────────────────────────────────

export interface BackendProfile {
  id: string
  family_id: string
  name: string
  relation: string
  dob?: string | null
  blood_group?: string | null
  gender?: string | null
  avatar?: string | null
  linked_user_id?: string | null
  created_by: string
  created_at: string
}

export interface BackendUser {
  id: string
  email: string
  first_name: string
  last_name: string
  phone_number: string
  role: string
  organization?: string | null
  location?: string | null
  profile_photo?: string | null
  is_active: boolean
  email_verified: boolean
  created_at?: string | null
  family_id?: string | null
}

export interface BackendSession {
  id: string
  created_at?: string | null
  expires_at?: string | null
  user_agent?: string | null
  ip_address?: string | null
  last_active?: string | null
  is_current: boolean
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  profiles: BackendProfile[]
}

export interface RegisterResponse {
  userId: string
  familyId: string | null
  accessToken: string
  refreshToken: string
}

export interface RegisterPayload {
  first_name: string
  last_name: string
  email: string
  phone_number: string
  role: string
  password: string
  profile_photo?: string | null
  organization?: string | null
  location?: string | null
  is_active?: boolean
}

export interface BackendFamily {
  id: string
  name: string
  created_by: string
  member_ids: string[]
  member_roles: Record<string, string>
}

export interface BackendMember {
  user_id: string
  email?: string | null
  first_name?: string | null
  last_name?: string | null
  role?: string | null
}

export interface BackendInvite {
  id: string
  family_id: string
  email: string
  role: string
  status: string
  expires_at?: string | null
}

export interface IncomingInvite {
  id: string
  family_id: string
  family_name: string
  invited_by: string
  role: string
  expires_at?: string | null
}

export interface InvitePreview {
  family_name: string
  invited_by: string
  email: string
  role: string
  expires_at?: string | null
  status: string
}

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      auth: false,
    }),

  register: (payload: RegisterPayload) =>
    apiFetch<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ user: payload }),
      auth: false,
    }),

  me: () =>
    apiFetch<BackendUser>('/auth/me'),

  updateMe: (data: {
    first_name?: string
    last_name?: string
    email?: string
    organization?: string | null
    location?: string | null
    profile_photo?: string | null
  }) =>
    apiFetch<BackendUser>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  changePassword: (current_password: string, new_password: string) =>
    apiFetch<{ message: string }>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ current_password, new_password }),
    }),

  resendVerification: () =>
    apiFetch<{ message: string }>('/auth/resend-verification', { method: 'POST' }),

  logout: () =>
    apiFetch<{ message: string }>('/auth/logout', { method: 'POST' }),

  logoutAll: () =>
    apiFetch<{ message: string }>('/auth/logout-all', { method: 'POST' }),

  refreshToken: (refreshToken: string) =>
    apiFetch<{ accessToken: string }>('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      auth: false,
    }),

  forgotPassword: (email: string) =>
    apiFetch<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      auth: false,
    }),

  resetPassword: (token: string, password: string) =>
    apiFetch<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
      auth: false,
    }),

  verifyEmail: (token: string) =>
    apiFetch<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
      auth: false,
    }),

  loginOtp: (phone: string) =>
    apiFetch<{ message: string }>('/auth/login-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
      auth: false,
    }),

  verifyOtp: (phone: string, otp: string) =>
    apiFetch<LoginResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
      auth: false,
    }),

  getSessions: () =>
    apiFetch<BackendSession[]>('/auth/sessions'),

  deleteSession: (sessionId: string) =>
    apiFetch<{ message: string }>(`/auth/session/${sessionId}`, { method: 'DELETE' }),

  twofa: {
    status: () =>
      apiFetch<{ enabled: boolean; method: string | null }>('/auth/2fa/status'),

    totpSetup: () =>
      apiFetch<{ secret: string; qr_uri: string; backup_codes: string[] }>(
        '/auth/2fa/totp/setup',
        { method: 'POST' },
      ),

    totpVerify: (code: string) =>
      apiFetch<{ message: string }>('/auth/2fa/totp/verify', {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),

    smsSetup: (phone: string) =>
      apiFetch<{ message: string }>('/auth/2fa/sms/setup', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      }),

    smsVerify: (code: string) =>
      apiFetch<{ message: string }>('/auth/2fa/sms/verify', {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),

    disable: () =>
      apiFetch<{ message: string }>('/auth/2fa', { method: 'DELETE' }),
  },
}

// ─── Profile API ──────────────────────────────────────────────────────────────
export const profileApi = {
  list: () =>
    apiFetch<BackendProfile[]>('/profiles'),

  get: (profileId: string) =>
    apiFetch<BackendProfile>(`/profiles/${profileId}`),

  getActive: () =>
    apiFetch<{ activeProfile: BackendProfile }>('/profiles/active'),

  create: (data: {
    name: string
    relation: string
    dob?: string | null
    blood_group?: string | null
    gender?: string | null
    avatar?: string | null
  }) =>
    apiFetch<BackendProfile>('/profiles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (profileId: string, data: {
    name?: string
    relation?: string
    dob?: string | null
    blood_group?: string | null
    gender?: string | null
    avatar?: string | null
  }) =>
    apiFetch<BackendProfile>(`/profiles/${profileId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (profileId: string) =>
    apiFetch<{ message: string }>(`/profiles/${profileId}`, { method: 'DELETE' }),

  switchProfile: (profileId: string) =>
    apiFetch<{ accessToken: string; activeProfile: BackendProfile }>('/profiles/switch', {
      method: 'POST',
      body: JSON.stringify({ profileId }),
    }),
}

// ─── Family API ───────────────────────────────────────────────────────────────
export const familyApi = {
  create: (familyName: string) =>
    apiFetch<{ familyId: string }>('/families', {
      method: 'POST',
      body: JSON.stringify({ familyName }),
    }),

  get: (familyId: string) =>
    apiFetch<BackendFamily>(`/families/${familyId}`),

  delete: (familyId: string) =>
    apiFetch<{ message: string }>(`/families/${familyId}`, { method: 'DELETE' }),

  getMembers: (familyId: string) =>
    apiFetch<BackendMember[]>(`/families/${familyId}/members`),

  removeMember: (memberId: string) =>
    apiFetch<{ message: string }>(`/families/members/${memberId}`, { method: 'DELETE' }),

  updateMemberRole: (memberId: string, role: string) =>
    apiFetch<{ member: BackendMember }>(`/families/members/${memberId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),

  leave: () =>
    apiFetch<{ message: string }>('/families/leave', { method: 'POST' }),

  invite: (email: string, role: string) =>
    apiFetch<{ inviteId: string }>('/families/invite', {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    }),

  listInvites: () =>
    apiFetch<BackendInvite[]>('/families/invites'),

  listIncomingInvites: () =>
    apiFetch<IncomingInvite[]>('/families/incoming-invites'),

  respondToInvite: (inviteId: string, action: 'accept' | 'decline') =>
    apiFetch<{ message: string }>('/families/invite/respond', {
      method: 'POST',
      body: JSON.stringify({ inviteId, action }),
    }),

  resendInvite: (inviteId: string) =>
    apiFetch<{ message: string }>('/families/invite/resend', {
      method: 'POST',
      body: JSON.stringify({ inviteId }),
    }),

  cancelInvite: (inviteId: string) =>
    apiFetch<{ message: string }>('/families/invite/cancel', {
      method: 'POST',
      body: JSON.stringify({ inviteId }),
    }),

  previewInvite: (token: string) =>
    apiFetch<InvitePreview>(`/families/invite/preview?token=${encodeURIComponent(token)}`, {
      auth: false,
    }),

  acceptInvite: (token: string, password: string) =>
    apiFetch<{ userId: string }>('/families/invite/accept', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
      auth: false,
    }),

  declineInvite: (token: string) =>
    apiFetch<{ message: string }>('/families/invite/decline', {
      method: 'POST',
      body: JSON.stringify({ token }),
      auth: false,
    }),
}

export default apiFetch
