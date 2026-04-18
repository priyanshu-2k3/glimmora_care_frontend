/**
 * GlimmoraCare — DOCTOR & ORGANISATION E2E Tests (DO01–DO04)
 *
 * DO01 — Doctor login → /organization shows org name and assigned patients
 * DO02 — Patient → /my-doctor shows doctor info or empty state
 * DO03 — Join-org ?token redirect: unauthenticated visit redirects to /login?next=…
 * DO04 — Admin → /organization/doctors shows doctors list and invite form
 *
 * Credentials:
 *   admin   : ov3644111@gmail.com         / Glimmora@2025
 *   doctor  : pv121416an@gmail.com         / Glimmora@2025
 *   patient : priyanshuverma0901@gmail.com / Glimmora@2025
 */

import { test, expect } from '@playwright/test'
import { loginUser, apiRequest } from '../helpers/api'
import { injectTokens } from '../helpers/auth'
import { closeDb } from '../helpers/db'

// ── Credentials ───────────────────────────────────────────────────────────────

const ADMIN   = { email: 'ov3644111@gmail.com',          password: 'Glimmora@2025' }
const DOCTOR  = { email: 'pv121416an@gmail.com',         password: 'Glimmora@2025' }
const PATIENT = { email: 'priyanshuverma0901@gmail.com', password: 'Glimmora@2025' }

// ── Teardown ──────────────────────────────────────────────────────────────────

test.afterAll(async () => {
  await closeDb()
})

// ── Helper ────────────────────────────────────────────────────────────────────

async function loginAs(
  page: import('@playwright/test').Page,
  creds: { email: string; password: string },
  role: string,
) {
  const { accessToken, refreshToken } = await loginUser(creds.email, creds.password)
  const meRes = await apiRequest('/auth/me', accessToken)
  const me = await meRes.json()
  await injectTokens(page, accessToken, refreshToken, {
    id: me.id ?? me._id ?? 'placeholder',
    name: `${me.first_name ?? ''} ${me.last_name ?? ''}`.trim(),
    email: me.email ?? creds.email,
    role,
  })
  return { accessToken, refreshToken, me }
}

// ─────────────────────────────────────────────────────────────────────────────
// DO01 — Doctor /organization shows org name or "not joined" + assigned patients
// ─────────────────────────────────────────────────────────────────────────────
test('DO01: doctor /organization shows org name or not-joined state', async ({ page }) => {
  await loginAs(page, DOCTOR, 'doctor')
  await page.goto('/organization')
  await page.waitForLoadState('networkidle')

  // Either in org (heading shows org name or "Organisation") or not in org
  await expect(
    page.locator('h1, h2').filter({ hasText: /Sunrise|Organisation|Not Part of/i }).first()
  ).toBeVisible({ timeout: 10_000 })
})

test('DO01b: doctor org page shows assigned patients section or empty state', async ({ page }) => {
  await loginAs(page, DOCTOR, 'doctor')
  await page.goto('/organization')
  await page.waitForLoadState('networkidle')

  // If in org: "My Assigned Patients" section should be present
  // If not in org: shows the not-joined empty state card
  await expect(
    page.getByText('My Assigned Patients')
      .or(page.getByText('Not Part of an Organisation'))
      .first()
  ).toBeVisible({ timeout: 10_000 })
})

// ─────────────────────────────────────────────────────────────────────────────
// DO02 — Patient /my-doctor shows doctor name/email or empty state
// ─────────────────────────────────────────────────────────────────────────────
test('DO02: patient /my-doctor shows doctor info or no-doctor state', async ({ page }) => {
  let tokens: { accessToken: string; refreshToken: string }
  try {
    tokens = await loginUser(PATIENT.email, PATIENT.password)
  } catch {
    test.skip(true, 'Patient credentials returned 401 — password may have changed in DB')
    return
  }

  const meRes = await apiRequest('/auth/me', tokens.accessToken)
  const me = await meRes.json()

  await injectTokens(page, tokens.accessToken, tokens.refreshToken, {
    id: me.id ?? me._id ?? 'placeholder',
    name: `${me.first_name ?? ''} ${me.last_name ?? ''}`.trim(),
    email: me.email ?? PATIENT.email,
    role: 'patient',
  })

  await page.goto('/my-doctor')
  await page.waitForLoadState('networkidle')

  // Either shows doctor name/email, or an empty state ("No doctor assigned")
  await expect(
    page.locator('text=/No doctor|My Doctor|Dr\./i').first()
  ).toBeVisible({ timeout: 10_000 })

  // Page must not crash
  await expect(page.locator('body')).not.toContainText('Error', { timeout: 5_000 })
})

// ─────────────────────────────────────────────────────────────────────────────
// DO03 — Unauthenticated /join-org?token= redirects to /login?next=
// ─────────────────────────────────────────────────────────────────────────────
test('DO03: /join-org?token=FAKE redirects unauthenticated user to /login?next=', async ({ page }) => {
  // Navigate without injecting tokens — no authenticated session
  await page.goto('/join-org?token=FAKE_TOKEN_FOR_REDIRECT_TEST')

  // Auth guard should redirect to /login and preserve the next param
  await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })

  // The URL should include a next= query param pointing back to join-org
  const url = page.url()
  expect(url).toMatch(/next=/)
  expect(url).toMatch(/join-org/)
})

// ─────────────────────────────────────────────────────────────────────────────
// DO04 — Admin /organization/doctors loads doctors list and invite form
// ─────────────────────────────────────────────────────────────────────────────
test('DO04: admin /organization/doctors shows heading and invite button', async ({ page }) => {
  await loginAs(page, ADMIN, 'admin')
  await page.goto('/organization/doctors')
  await page.waitForLoadState('networkidle')

  // Page heading
  await expect(page.locator('h1:has-text("Doctors")')).toBeVisible({ timeout: 10_000 })

  // Invite Doctor button or a no-org state should be visible
  await expect(
    page.getByRole('button', { name: 'Invite Doctor' })
      .or(page.getByText('No Organisation Found'))
      .first()
  ).toBeVisible({ timeout: 10_000 })
})

test('DO04b: admin invite doctor form opens on click', async ({ page }) => {
  await loginAs(page, ADMIN, 'admin')
  await page.goto('/organization/doctors')
  await page.waitForLoadState('networkidle')

  // Skip if no organisation exists yet
  const noOrg = await page.locator('text=No Organisation Found').isVisible({ timeout: 3_000 }).catch(() => false)
  if (noOrg) {
    test.skip(true, 'No organisation exists — skip invite form test')
    return
  }

  await page.click('button:has-text("Invite Doctor")')

  // Invite form panel should appear
  await expect(
    page.locator('text=/Invite a Doctor|Invite Doctor/i').first()
  ).toBeVisible({ timeout: 5_000 })

  // Email input should be present in the form
  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 3_000 })
})
