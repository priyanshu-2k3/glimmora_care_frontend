/**
 * GlimmoraCare — ADMIN & SUPER ADMIN E2E Tests (A01–A05)
 *
 * A01 — Admin logs in → can access /admin (not 403/redirect)
 * A02 — /admin/manage-team loads with team list
 * A03 — /admin/logs shows audit log entries or empty state
 * A04 — Super admin → /manage-users loads with user list
 * A05 — Super admin → manage-users table contains at least the known accounts
 *
 * Credentials:
 *   super_admin : vermapriyanshu001@gmail.com / Glimmora@2025
 *   admin       : ov3644111@gmail.com         / Glimmora@2025
 */

import { test, expect } from '@playwright/test'
import { loginUser, apiRequest } from '../helpers/api'
import { injectTokens } from '../helpers/auth'
import { closeDb } from '../helpers/db'

// ── Credentials ───────────────────────────────────────────────────────────────

const SUPER_ADMIN = { email: 'vermapriyanshu001@gmail.com', password: 'Glimmora@2025' }
const ADMIN       = { email: 'ov3644111@gmail.com',         password: 'Glimmora@2025' }

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
  return { accessToken, me }
}

// ─────────────────────────────────────────────────────────────────────────────
// A01 — Admin can access /admin (not 403 / not redirected to /login)
// ─────────────────────────────────────────────────────────────────────────────
test('A01: admin can access /admin panel without redirect', async ({ page }) => {
  await loginAs(page, ADMIN, 'admin')
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')

  // Must stay on /admin (not redirected to /login or /dashboard)
  await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 })

  // Page should render some content — at least an h1 or h2
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 })

  // Must not show a 404 page
  await expect(page.locator('body')).not.toContainText('404')
})

test('A01b: super_admin can also access /admin panel', async ({ page }) => {
  await loginAs(page, SUPER_ADMIN, 'super_admin')
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')

  await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 })
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 })
  await expect(page.locator('body')).not.toContainText('404')
})

// ─────────────────────────────────────────────────────────────────────────────
// A02 — /admin/manage-team loads with team list
// ─────────────────────────────────────────────────────────────────────────────
test('A02: /admin/manage-team loads with team member content', async ({ page }) => {
  await loginAs(page, ADMIN, 'admin')
  await page.goto('/admin/manage-team')
  await page.waitForLoadState('networkidle')

  // Page must not redirect
  await expect(page).not.toHaveURL(/\/login/)

  // Should show a heading related to team management
  await expect(
    page.locator('h1, h2').filter({ hasText: /Team|Members|Manage/i }).first()
  ).toBeVisible({ timeout: 10_000 })

  // Must not crash with an unhandled error
  await expect(page.locator('body')).not.toContainText('Unexpected Application Error')
})

// ─────────────────────────────────────────────────────────────────────────────
// A03 — /admin/logs shows audit log entries or a clean empty state
// ─────────────────────────────────────────────────────────────────────────────
test('A03: /admin/logs loads without error (entries or empty state)', async ({ page }) => {
  await loginAs(page, ADMIN, 'admin')
  await page.goto('/admin/logs')
  await page.waitForLoadState('networkidle')

  // Must not redirect to login
  await expect(page).not.toHaveURL(/\/login/)

  // Should show a heading for logs
  await expect(
    page.locator('h1, h2').filter({ hasText: /Log|Audit|Activity/i }).first()
  ).toBeVisible({ timeout: 10_000 })

  // Acceptable outcomes: table rows, list items, or an "empty" state message
  const hasEntries = await page.locator('table tr, [data-testid="log-entry"], li').count()
  const hasEmptyState = await page.locator('text=/No logs|No activity|Empty/i').isVisible({ timeout: 3_000 }).catch(() => false)

  expect(hasEntries > 0 || hasEmptyState).toBe(true)
})

// ─────────────────────────────────────────────────────────────────────────────
// A04 — Super admin: /manage-users loads with user list
// ─────────────────────────────────────────────────────────────────────────────
test('A04: super_admin /manage-users loads with user list', async ({ page }) => {
  await loginAs(page, SUPER_ADMIN, 'super_admin')
  await page.goto('/manage-users')
  await page.waitForLoadState('networkidle')

  // Heading visible
  await expect(page.locator('h1:has-text("Manage Users")')).toBeVisible({ timeout: 10_000 })

  // Stats bar shows "Total Users"
  await expect(page.locator('text=Total Users').first()).toBeVisible({ timeout: 10_000 })

  // Page must not show 403 or error
  await expect(page.locator('body')).not.toContainText('403')
  await expect(page.locator('body')).not.toContainText('Forbidden')
})

// ─────────────────────────────────────────────────────────────────────────────
// A05 — Super admin: manage-users table contains known accounts
// ─────────────────────────────────────────────────────────────────────────────
test('A05: manage-users table contains known test accounts', async ({ page }) => {
  await loginAs(page, SUPER_ADMIN, 'super_admin')
  await page.goto('/manage-users')

  await expect(page.locator('h1:has-text("Manage Users")')).toBeVisible({ timeout: 10_000 })
  await expect(page.locator('text=Total Users').first()).toBeVisible({ timeout: 15_000 })

  // Search for the admin account by partial email
  await page.fill('input[placeholder*="Search"]', 'ov3644111')
  await page.waitForTimeout(500)

  // At least one result should appear — either a user card or row containing that email
  await expect(
    page.locator('text=/ov3644111/i').first()
  ).toBeVisible({ timeout: 10_000 })
})

test('A05b: manage-users search returns doctor account', async ({ page }) => {
  await loginAs(page, SUPER_ADMIN, 'super_admin')
  await page.goto('/manage-users')

  await expect(page.locator('text=Total Users').first()).toBeVisible({ timeout: 15_000 })

  // Search for the doctor
  await page.fill('input[placeholder*="Search"]', 'pv121416an')
  await page.waitForTimeout(500)

  await expect(
    page.locator('text=/pv121416an/i').first()
  ).toBeVisible({ timeout: 10_000 })
})
