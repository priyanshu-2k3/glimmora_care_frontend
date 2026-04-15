const API = 'http://localhost:8000/api/v1'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

/** Register a new user via the backend API directly (bypasses UI). */
export async function registerUser(opts: {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  role?: string
}): Promise<AuthTokens & { userId: string }> {
  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user: {
        first_name: opts.firstName,
        last_name: opts.lastName,
        email: opts.email,
        phone_number: opts.phone,
        password: opts.password,
        role: opts.role ?? 'patient',
      },
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`register failed: ${res.status} ${JSON.stringify(err)}`)
  }
  const data = await res.json()
  return { accessToken: data.accessToken, refreshToken: data.refreshToken, userId: data.userId }
}

/** Login via API and return tokens. */
export async function loginUser(email: string, password: string): Promise<AuthTokens> {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error(`login failed: ${res.status}`)
  const data = await res.json()
  return { accessToken: data.accessToken, refreshToken: data.refreshToken }
}

/** Make an authenticated API request. */
export async function apiRequest(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  })
}

/** Generate a unique test user. */
export function testUser(suffix: string = Date.now().toString()) {
  return {
    firstName: 'Test',
    lastName: 'User',
    email: `test_${suffix}@glimmora.test`,
    phone: `+91${suffix.slice(-10).padStart(10, '9')}`,
    password: 'TestPass123!',
  }
}
