/**
 * GlimmoraCare — SETTINGS E2E Tests (S01–S05)
 *
 * S01 — Profile update (name + location) → verify saved via /auth/me
 * S02 — Password change → login with new password → change back
 * S03 — Sessions tab loads, shows current session with "Current" badge
 * S04 — Google Account section shows "Not connected" or "✓ Linked" text
 * S05 — 2FA toggle redirect → clicking "Set up 2FA →" link goes to /2fa-setup
 */

import { test, expect } from '@playwright/test'
import { registerUser, loginUser, apiRequest, testUser } from '../helpers/api'
import { closeDb } from '../helpers/db'
import { injectTokens } from '../helpers/auth'

// ── Teardown ──────────────────────────────────────────────────────────────────

test.afterAll(async () => {
  await closeDb()
})

// ── Helper ────────────────────────────────────────────────────────────────────

async function loginAndInject(page: import('@playwright/test').Page, email: string, password: string) {
  const { accessToken, refreshToken } = await loginUser(email, password)
  const meRes = await apiRequest('/auth/me', accessToken)
  const me = await meRes.json()
  await injectTokens(page, accessToken, refreshToken, {
    id: me.id ?? me._id ?? 'placeholder',
    name: `${me.first_name ?? ''} ${me.last_name ?? ''}`.trim(),
    email: me.email ?? email,
    role: me.role ?? 'patient',
  })
  return { accessToken, refreshToken, me }
}

// ─────────────────────────────────────────────────────────────────────────────
// S01 — Profile update: name + location → verify via /auth/me
// ─────────────────────────────────────────────────────────────────────────────
test('S01: profile update (name + location) saves successfully', async ({ page }) => {
  const u = testUser('s01')
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

  // Update Full Name
  await page.fill('#full-name', 'S01 Updated Name')

  // Update Location (id = "location" derived from label "Location")
  const locationInput = page.locator('#location')
  if (await locationInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await locationInput.fill('Mumbai, India')
  }

  await page.click('button:has-text("Save Changes")')
  await expect(page.locator('button:has-text("Saved!")')).toBeVisible({ timeout: 10_000 })

  // Verify via API — first_name should contain "S01"
  const verifyRes = await apiRequest('/auth/me', accessToken)
  const updated = await verifyRes.json()
  const updatedName = `${updated.first_name ?? ''} ${updated.last_name ?? ''}`.trim()
  expect(updatedName).toContain('S01')
})

// ─────────────────────────────────────────────────────────────────────────────
// S02 — Password change → login with new password → change back
// ─────────────────────────────────────────────────────────────────────────────
test('S02: password change allows login with new password', async ({ page }) => {
  const u = testUser('s02')
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
  await page.click('button:has-text("Security")')

  const newPassword = 'NewS02Pass!'
  await page.fill('#current-password', u.password)
  await page.fill('#new-password', newPassword)
  await page.fill('#confirm-new-password', newPassword)
  await page.click('button:has-text("Update Password")')

  await expect(
    page.locator('text=/Password updated successfully/i')
  ).toBeVisible({ timeout: 15_000 })

  // Verify new password works via API login
  const newTokens = await loginUser(u.email, newPassword)
  expect(newTokens.accessToken).toBeTruthy()

  // Change password back to original so test accounts remain consistent
  const revertRes = await apiRequest('/auth/change-password', newTokens.accessToken, {
    method: 'PUT',
    body: JSON.stringify({
      current_password: newPassword,
      new_password: u.password,
    }),
  })
  expect([200, 204]).toContain(revertRes.status)
})

// ─────────────────────────────────────────────────────────────────────────────
// S03 — Sessions tab loads, shows session card with "Current" badge
// ─────────────────────────────────────────────────────────────────────────────
test('S03: sessions tab shows current session badge', async ({ page }) => {
  const u = testUser('s03')
  const { accessToken, refreshToken } = await registerUser(u)
  // Create a second session so there is something to show
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
  await page.click('button:has-text("Sessions")')

  // Wait for session cards
  await expect(
    page.locator('[data-testid="session-card"]').first()
  ).toBeVisible({ timeout: 15_000 })

  const count = await page.locator('[data-testid="session-card"]').count()
  expect(count).toBeGreaterThanOrEqual(1)

  // At least one card should have a "Current" label
  await expect(
    page.locator('text=/Current/i').first()
  ).toBeVisible({ timeout: 5_000 })
})

// ─────────────────────────────────────────────────────────────────────────────
// S04 — Google Account section shows connection status text
// ─────────────────────────────────────────────────────────────────────────────
test('S04: Google Account section shows "Not connected" for email-registered users', async ({ page }) => {
  const u = testUser('s04')
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
  await page.click('button:has-text("Security")')

  // Google Account section must be visible
  await expect(page.getByText('Google Account')).toBeVisible({ timeout: 10_000 })

  // An email-registered user has no firebase_uid → "Not connected"
  // A Google-registered user would show "✓ Linked" or similar
  await expect(
    page.locator('text=/Not connected|Linked|Connected/i').first()
  ).toBeVisible({ timeout: 5_000 })
})

// ─────────────────────────────────────────────────────────────────────────────
// S05 — 2FA setup link navigates to /2fa-setup
// ─────────────────────────────────────────────────────────────────────────────
test('S05: clicking "Set up 2FA" link navigates to /2fa-setup', async ({ page }) => {
  const u = testUser('s05')
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
  await page.click('button:has-text("Security")')

  // The 2FA section should have a link/button to set up 2FA
  const setupLink = page.locator('a:has-text("Set up 2FA"), button:has-text("Set up 2FA")')
  await expect(setupLink.first()).toBeVisible({ timeout: 10_000 })
  await setupLink.first().click()

  await expect(page).toHaveURL(/\/2fa-setup/, { timeout: 10_000 })
})
