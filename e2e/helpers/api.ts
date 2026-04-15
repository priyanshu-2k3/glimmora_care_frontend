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

/** djb2 hash → unsigned 32-bit integer */
function djb2(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0
  return h
}

/** Generate a unique test user for this test run. */
export function testUser(suffix: string = RUN_TS) {
  // djb2 hash of suffix+RUN_TS → 10-digit phone starting with 6–9
  const h = djb2(suffix + RUN_TS)
  const phoneNum = (h % 4_000_000_000 + 6_000_000_000).toString()
  return {
    firstName: 'Test',
    lastName: 'User',
    email: `gc_${suffix}_${RUN_TS}@example.com`,
    phone: `+91${phoneNum}`,
    password: 'TestPass123!',
  }
}
