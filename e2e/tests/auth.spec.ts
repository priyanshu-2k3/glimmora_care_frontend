/**
 * GlimmoraCare — AUTH E2E Tests (T01–T15)
 *
 * Selectors derived from reading actual source files:
 *  - Input component: id = label.toLowerCase().replace(/\s+/g, '-')
 *  - Button text: exact text rendered in JSX
 *  - Tab buttons: identified by text label ("Security", "Sessions", etc.)
 *  - Logout: button[title="Sign out"] in Sidebar
 */

import { test, expect, type Page } from '@playwright/test'
import { registerUser, loginUser, apiRequest, testUser } from '../helpers/api'
import { getDevOtp, getUserId, closeDb } from '../helpers/db'

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Inject access + refresh tokens into localStorage so AuthContext rehydrates */
async function injectTokens(
  page: Page,
  accessToken: string,
  refreshToken: string,
  extras: { id?: string; name?: string; email?: string; role?: string } = {},
) {
  await page.addInitScript(
    ({ at, rt, id, name, email, role }) => {
      localStorage.setItem('gc_access_token', at)
      localStorage.setItem('gc_refresh_token', rt)
      localStorage.setItem(
        'glimmora_care_user',
        JSON.stringify({
          id: id ?? 'placeholder',
          name: name ?? 'Test User',
          email: email ?? 'test@glimmora.test',
          role: role ?? 'patient',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          accessToken: at,
        }),
      )
    },
    {
      at: accessToken,
      rt: refreshToken,
      id: extras.id ?? 'placeholder',
      name: extras.name ?? 'Test User',
      email: extras.email ?? 'test@glimmora.test',
      role: extras.role ?? 'patient',
    },
  )
}

// ── Teardown ──────────────────────────────────────────────────────────────────

test.afterAll(async () => {
  await closeDb()
})

// ─────────────────────────────────────────────────────────────────────────────
// T01 — Real login via UI → expect redirect to /dashboard
// ─────────────────────────────────────────────────────────────────────────────
test('T01: login with email+password redirects to /dashboard', async ({ page }) => {
  // Create a real user first
  const u = testUser('t01')
  await registerUser(u)

  await page.goto('/login')

  // The mode toggle shows "Sign In" (real mode) by default — already active
  // Fill email and password using IDs derived from Input labels
  await page.fill('#email-address', u.email)
  await page.fill('#password', u.password)
  await page.click('button[type="submit"]:has-text("Sign In")')

  // May redirect to /verify-email if email not verified yet — both are acceptable
  await expect(page).toHaveURL(/\/(dashboard|verify-email)/, { timeout: 15_000 })
})

// ─────────────────────────────────────────────────────────────────────────────
// T02 — Register via UI → expect /verify-email or /dashboard
// ─────────────────────────────────────────────────────────────────────────────
test('T02: register via UI redirects to /verify-email', async ({ page }) => {
  const u = testUser('t02')

  await page.goto('/register')

  // Step 1: fill all required fields
  await page.fill('#first-name', u.firstName)
  await page.fill('#last-name', u.lastName)
  await page.fill('#email-address', u.email)
  await page.fill('#phone-number', u.phone)
  await page.fill('#password', u.password)
  await page.fill('#confirm-password', u.password)

  // Click "Continue to Review"
  await page.click('button:has-text("Continue to Review")')

  // Step 2: click "Create Account"
  await page.click('button:has-text("Create Account")')

  await expect(page).toHaveURL(/\/(verify-email|dashboard)/, { timeout: 15_000 })
})

// ─────────────────────────────────────────────────────────────────────────────
// T03 — Email verify OTP: register via API, inject tokens, verify with DB OTP
// ─────────────────────────────────────────────────────────────────────────────
test('T03: email OTP verification succeeds', async ({ page }) => {
  const u = testUser('t03')
  const { accessToken, refreshToken } = await registerUser(u)
  const userId = await getUserId(u.email)

  await injectTokens(page, accessToken, refreshToken, { email: u.email })
  await page.goto('/verify-email')

  // Get OTP from DB
  const otp = await getDevOtp('email_verification_tokens', { user_id: userId })

  // Fill the "Verification Code" input (id = "verification-code")
  await page.fill('#verification-code', otp)
  await page.click('button:has-text("Verify Email")')

  // Expect "Email verified!" heading OR dashboard redirect
  await expect(
    page.locator('h2:has-text("Email verified!")'),
  ).toBeVisible({ timeout: 15_000 })
})

// ─────────────────────────────────────────────────────────────────────────────
// T04 — Resend verification email
// ─────────────────────────────────────────────────────────────────────────────
test('T04: resend verification email shows success text', async ({ page }) => {
  const u = testUser('t04')
  const { accessToken, refreshToken } = await registerUser(u)

  await injectTokens(page, accessToken, refreshToken, { email: u.email })
  await page.goto('/verify-email')

  // Click resend button
  await page.click('button:has-text("Resend verification email")')

  // Expect "Resent! Check your inbox" text OR cooldown button
  await expect(
    page.locator('text=/Resent|check your inbox|Resend in/i'),
  ).toBeVisible({ timeout: 15_000 })
})

// ─────────────────────────────────────────────────────────────────────────────
// T05 — OTP login: fill phone, send OTP, get from DB, verify → dashboard
// ─────────────────────────────────────────────────────────────────────────────
test('T05: OTP login via phone', async ({ page }) => {
  const u = testUser('t05')
  await registerUser(u)

  await page.goto('/otp-verify')

  // Step 1 — phone
  await page.fill('#phone-number', u.phone)
  await page.click('button:has-text("Send OTP")')

  // Wait for step 2 (OTP boxes appear)
  await expect(page.locator('h2:has-text("Verify your identity")')).toBeVisible({ timeout: 10_000 })

  // Get OTP from phone_otps collection
  const otp = await getDevOtp('phone_otps', { phone: u.phone })

  // The OTP step uses individual <input> boxes — paste approach
  const otpInputs = page.locator('form input[type="text"][maxlength="1"]')
  for (let i = 0; i < otp.length; i++) {
    await otpInputs.nth(i).fill(otp[i])
  }

  await page.click('button:has-text("Verify OTP")')
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
})

// ─────────────────────────────────────────────────────────────────────────────
// T06 — 2FA SMS setup: choose SMS, enter phone, send OTP, verify from DB
// ─────────────────────────────────────────────────────────────────────────────
test('T06: 2FA SMS setup succeeds', async ({ page }) => {
  const u = testUser('t06')
  const { accessToken, refreshToken } = await registerUser(u)
  const userId = await getUserId(u.email)

  await injectTokens(page, accessToken, refreshToken, { email: u.email })
  await page.goto('/2fa-setup')

  // Choose "SMS / Phone" method
  await page.click('button:has-text("SMS / Phone")')
  // Click "Continue"
  await page.click('button:has-text("Continue")')

  // SMS step — fill phone number (id = "phone-number")
  await expect(page.locator('h2:has-text("SMS Authentication")')).toBeVisible({ timeout: 8_000 })
  await page.fill('#phone-number', u.phone)

  // Click "Send OTP"
  await page.click('button:has-text("Send OTP")')

  // Verify step — get OTP from DB
  await expect(page.locator('h2:has-text("Enter verification code")')).toBeVisible({ timeout: 10_000 })
  const otp = await getDevOtp('two_factor_sms_enroll', { user_id: userId })

  // Fill "Verification Code" input (id = "verification-code")
  await page.fill('#verification-code', otp)
  await page.click('button:has-text("Enable 2FA")')

  // Expect "2FA Enabled!" heading
  await expect(page.locator('h2:has-text("2FA Enabled!")')).toBeVisible({ timeout: 15_000 })
})

// ─────────────────────────────────────────────────────────────────────────────
// T07 — Forgot password: submit email → "code sent" / step advances
// ─────────────────────────────────────────────────────────────────────────────
test('T07: forgot password shows reset code step', async ({ page }) => {
  const u = testUser('t07')
  await registerUser(u)

  await page.goto('/forgot-password')

  // Fill "Email Address" (id = "email-address")
  await page.fill('#email-address', u.email)
  await page.click('button:has-text("Send Reset Code")')

  // Expect step 2 heading "Enter reset code"
  await expect(page.locator('h2:has-text("Enter reset code")')).toBeVisible({ timeout: 15_000 })
})

// ─────────────────────────────────────────────────────────────────────────────
// T08 — Reset password: get OTP from DB, fill form, expect success
// ─────────────────────────────────────────────────────────────────────────────
test('T08: reset password via OTP flow succeeds', async ({ page }) => {
  const u = testUser('t08')
  await registerUser(u)

  // Trigger forgot-password via API
  await fetch('http://localhost:8000/api/v1/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: u.email }),
  })

  // Get OTP from DB
  const otp = await getDevOtp('password_reset_tokens', { email: u.email })

  // Navigate to reset-password with query params (otp flow)
  await page.goto(`/reset-password?email=${encodeURIComponent(u.email)}&otp=${encodeURIComponent(otp)}`)

  const newPassword = 'NewPass456!'
  await page.fill('#new-password', newPassword)
  await page.fill('#confirm-password', newPassword)
  await page.click('button:has-text("Reset Password")')

  // Expect "Password reset!" heading
  await expect(page.locator('h2:has-text("Password reset!")')).toBeVisible({ timeout: 15_000 })
})

// ─────────────────────────────────────────────────────────────────────────────
// T09 — /me in settings: inject tokens with real /me data → email visible
// ─────────────────────────────────────────────────────────────────────────────
test('T09: settings page shows logged-in user email', async ({ page }) => {
  const u = testUser('t09')
  const { accessToken, refreshToken } = await registerUser(u)

  // Fetch real /me data
  const meRes = await apiRequest('/auth/me', accessToken)
  const me = await meRes.json()

  const fullName = `${me.first_name ?? ''} ${me.last_name ?? ''}`.trim() || u.firstName
  const email = me.email ?? u.email

  await injectTokens(page, accessToken, refreshToken, {
    id: me.id ?? me._id ?? 'placeholder',
    name: fullName,
    email,
    role: me.role ?? 'patient',
  })

  await page.goto('/settings')

  // The Email Address input on Profile tab should show the user's email
  await expect(page.locator('#email-address')).toHaveValue(email, { timeout: 10_000 })
})

// ─────────────────────────────────────────────────────────────────────────────
// T10 — Update profile: change name, save, verify via API
// ─────────────────────────────────────────────────────────────────────────────
test('T10: update profile name saves successfully', async ({ page }) => {
  const u = testUser('t10')
  const { accessToken, refreshToken } = await registerUser(u)
  const meRes = await apiRequest('/auth/me', accessToken)
  const me = await meRes.json()

  await injectTokens(page, accessToken, refreshToken, {
    id: me.id ?? me._id ?? 'placeholder',
    name: `${me.first_name ?? ''} ${me.last_name ?? ''}`.trim(),
    email: me.email ?? u.email,
    role: me.role ?? 'patient',
  })

  await page.goto('/settings')

  // Clear name and fill new value (id = "full-name")
  await page.fill('#full-name', '')
  await page.fill('#full-name', 'Updated Name Test')

  // Click "Save Changes"
  await page.click('button:has-text("Save Changes")')

  // Expect "Saved!" text to appear briefly
  await expect(page.locator('button:has-text("Saved!")')).toBeVisible({ timeout: 10_000 })

  // Verify via API
  const verifyRes = await apiRequest('/auth/me', accessToken)
  const updated = await verifyRes.json()
  const updatedName = `${updated.first_name ?? ''} ${updated.last_name ?? ''}`.trim()
  expect(updatedName).toContain('Updated')
})

// ─────────────────────────────────────────────────────────────────────────────
// T11 — Change password via Security tab
// ─────────────────────────────────────────────────────────────────────────────
test('T11: change password via security tab succeeds', async ({ page }) => {
  const u = testUser('t11')
  const { accessToken, refreshToken } = await registerUser(u)
  const meRes = await apiRequest('/auth/me', accessToken)
  const me = await meRes.json()

  await injectTokens(page, accessToken, refreshToken, {
    id: me.id ?? me._id ?? 'placeholder',
    name: `${me.first_name ?? ''} ${me.last_name ?? ''}`.trim(),
    email: me.email ?? u.email,
    role: me.role ?? 'patient',
  })

  await page.goto('/settings')

  // Click "Security" tab
  await page.click('button:has-text("Security")')

  // Fill password fields
  // IDs: "current-password", "new-password", "confirm-new-password"
  await page.fill('#current-password', u.password)
  await page.fill('#new-password', 'UpdatedPass789!')
  await page.fill('#confirm-new-password', 'UpdatedPass789!')

  // Click "Update Password"
  await page.click('button:has-text("Update Password")')

  // Expect success message
  await expect(page.locator('text=/Password updated successfully/i')).toBeVisible({ timeout: 15_000 })
})

// ─────────────────────────────────────────────────────────────────────────────
// T12 — Sessions tab: shows session cards
// ─────────────────────────────────────────────────────────────────────────────
test('T12: sessions tab shows active session cards', async ({ page }) => {
  const u = testUser('t12')
  const { accessToken, refreshToken } = await registerUser(u)
  // Login a second time to create a second session
  await loginUser(u.email, u.password)

  const meRes = await apiRequest('/auth/me', accessToken)
  const me = await meRes.json()

  await injectTokens(page, accessToken, refreshToken, {
    id: me.id ?? me._id ?? 'placeholder',
    name: `${me.first_name ?? ''} ${me.last_name ?? ''}`.trim(),
    email: me.email ?? u.email,
    role: me.role ?? 'patient',
  })

  await page.goto('/settings')

  // Click "Sessions" tab
  await page.click('button:has-text("Sessions")')

  // Wait for session cards to load
  await expect(page.locator('[data-testid="session-card"]').first()).toBeVisible({ timeout: 15_000 })
  const count = await page.locator('[data-testid="session-card"]').count()
  expect(count).toBeGreaterThanOrEqual(1)
})

// ─────────────────────────────────────────────────────────────────────────────
// T13 — Logout: click logout button → /login, localStorage cleared
// ─────────────────────────────────────────────────────────────────────────────
test('T13: logout clears session and redirects to /login', async ({ page }) => {
  const u = testUser('t13')
  const { accessToken, refreshToken } = await registerUser(u)

  await injectTokens(page, accessToken, refreshToken, { email: u.email })
  await page.goto('/dashboard')

  // Logout button is in Sidebar: button[title="Sign out"]
  await page.click('button[title="Sign out"]')

  await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })

  // Verify localStorage is cleared
  const token = await page.evaluate(() => localStorage.getItem('gc_access_token'))
  expect(token).toBeNull()
})

// ─────────────────────────────────────────────────────────────────────────────
// T14 — Logout all devices: from Sessions tab, click "Sign Out of All Other Devices" → /login
// ─────────────────────────────────────────────────────────────────────────────
test('T14: logout all devices from sessions tab', async ({ page }) => {
  const u = testUser('t14')
  const { accessToken, refreshToken } = await registerUser(u)
  const meRes = await apiRequest('/auth/me', accessToken)
  const me = await meRes.json()

  await injectTokens(page, accessToken, refreshToken, {
    id: me.id ?? me._id ?? 'placeholder',
    name: `${me.first_name ?? ''} ${me.last_name ?? ''}`.trim(),
    email: me.email ?? u.email,
    role: me.role ?? 'patient',
  })

  await page.goto('/settings')

  // Click "Sessions" tab
  await page.click('button:has-text("Sessions")')

  // Wait for the "Sign Out of All Other Devices" button in Sessions tab
  const logoutAllBtn = page.locator('button:has-text("Sign Out of All Other Devices")')
  await expect(logoutAllBtn).toBeVisible({ timeout: 15_000 })
  await logoutAllBtn.click()

  await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
})

// ─────────────────────────────────────────────────────────────────────────────
// T15 — Token refresh: inject expired access token + valid refresh token
//        → page still loads (silent refresh worked)
// ─────────────────────────────────────────────────────────────────────────────
test('T15: expired access token is silently refreshed', async ({ page }) => {
  const u = testUser('t15')
  const { accessToken: realAt, refreshToken } = await registerUser(u)
  const meRes = await apiRequest('/auth/me', realAt)
  const me = await meRes.json()

  // Craft a structurally valid but expired JWT
  // We keep the header/signature of the real token but tamper the payload exp
  const EXPIRED_TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    btoa(
      JSON.stringify({
        sub: me.id ?? me._id ?? 'placeholder',
        role: me.role ?? 'patient',
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        iat: Math.floor(Date.now() / 1000) - 7200,
      }),
    )
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_') +
    '.fake-sig'

  await injectTokens(page, EXPIRED_TOKEN, refreshToken, {
    id: me.id ?? me._id ?? 'placeholder',
    name: `${me.first_name ?? ''} ${me.last_name ?? ''}`.trim(),
    email: me.email ?? u.email,
    role: me.role ?? 'patient',
  })

  await page.goto('/settings')

  // If token refresh works, the settings page should load and show the email field
  // Allow some time for the silent refresh to complete
  await expect(page.locator('#email-address')).toBeVisible({ timeout: 20_000 })
})
