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

// Run-unique prefix so repeated test runs don't collide on the same email/phone
const RUN_TS = Date.now().toString().slice(-7)

/** Generate a unique test user for this test run. */
export function testUser(suffix: string = RUN_TS) {
  // Derive a fully-numeric phone suffix (strip non-digits, fall back to RUN_TS)
  const numericSuffix = (suffix.replace(/\D/g, '') + RUN_TS).slice(-10)
  return {
    firstName: 'Test',
    lastName: 'User',
    email: `gc_${suffix}_${RUN_TS}@example.com`,
    phone: `+91${numericSuffix.padStart(10, '9')}`,
    password: 'TestPass123!',
  }
}
