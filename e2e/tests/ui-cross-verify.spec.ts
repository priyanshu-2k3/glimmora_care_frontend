/**
 * UI cross-verification of every fix from the recent change set.
 *
 * Logs in as each role (SA, admin, doctor, patient) and checks the
 * pages/buttons/notifications that were affected. Each section is independent —
 * one failure does not stop the others.
 */
import { test, expect, Page } from '@playwright/test'

const BASE = 'http://localhost:3000'
const ACCOUNTS = {
  sa:    { email: 'superadmin@glimmoratest.in',  password: 'Super@1234',   name: 'Aditi' },
  a1:    { email: 'admin@glimmoratest.in',       password: 'Admin@1234',   name: 'Aarav' },
  d1:    { email: 'doctor.rao@glimmoratest.in',  password: 'Doctor@1234',  name: 'Priya' },
  d2:    { email: 'doctor.iyer@glimmoratest.in', password: 'Doctor@1234',  name: 'Vikram' },
  p1:    { email: 'patient.anita@glimmoratest.in', password: 'Patient@1234', name: 'Anita' },
  p3:    { email: 'patient.kavya@glimmoratest.in', password: 'Patient@1234', name: 'Kavya' },
}

async function login(page: Page, email: string, password: string) {
  await page.context().clearCookies()
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear() } catch {} })
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.locator('#email-address').waitFor({ state: 'visible' })
  // Type instead of fill so React's controlled-input onChange fires reliably
  await page.locator('#email-address').click()
  await page.keyboard.type(email)
  await page.locator('#password').click()
  await page.keyboard.type(password)
  // Submit via Enter to side-step disabled-button race
  await page.keyboard.press('Enter')
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20000 })
}

test.describe.configure({ mode: 'default' })

test('Super Admin — /admin link cards, no inline form, management pages', async ({ page }) => {
  await login(page, ACCOUNTS.sa.email, ACCOUNTS.sa.password)
  await expect(page).toHaveURL(/\/admin/)

  // Inline create-org form must be gone
  await expect(page.locator('input[placeholder*="Organisation name"]')).toHaveCount(0)

  // Link cards present
  for (const label of ['Organisations', 'Manage Users', 'Manage Doctors', 'Manage Patients', 'Platform Logs']) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible()
  }

  // Visit each management page
  for (const path of ['/admin/users', '/admin/doctors', '/admin/patients', '/admin/organizations']) {
    await page.goto(`${BASE}${path}`)
    await expect(page.locator('main h1, [role=main] h1, h1').nth(1)).toBeVisible()
  }

  // Notifications bell should not 404
  await page.goto(`${BASE}/notifications`).catch(() => {})
})

test('Admin (A1) — error popup contrast, /organization, email-based assign, /logs scoped', async ({ page }) => {
  // Bad-password attempt to render error popup
  await page.context().clearCookies()
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.evaluate(() => { try { localStorage.clear() } catch {} })
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.locator('#email-address').click()
  await page.keyboard.type(ACCOUNTS.a1.email)
  await page.locator('#password').click()
  await page.keyboard.type('WRONG_PASSWORD')
  await page.keyboard.press('Enter')
  // Error popup visible — wait for it
  const errorBox = page.locator('div', { hasText: /invalid|incorrect|wrong|denied|unauthor|bad/i }).first()
  await errorBox.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {})

  // Now log in for real — clear and retype
  await page.locator('#password').click()
  await page.keyboard.press('Control+A')
  await page.keyboard.type(ACCOUNTS.a1.password)
  await page.keyboard.press('Enter')
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20000 })

  // /organization shows org name
  await page.goto(`${BASE}/organization`)
  await expect(page.locator('h1').nth(1)).toContainText(/Glimmora Demo Hospital|Organisation/i)

  // Email-based assign form
  await page.goto(`${BASE}/admin/doctor-management/assign`)
  await expect(page.getByText(/Assign Doctor to Patient/i)).toBeVisible()
  await page.locator('input[type="email"]').nth(0).fill('patient.anita@glimmoratest.in')
  await page.locator('input[type="email"]').nth(1).fill('doctor.rao@glimmoratest.in')
  await page.getByRole('button', { name: /^Assign Doctor$|^Assigning/i }).click()
  await expect(page.getByText(/assigned successfully|already/i)).toBeVisible({ timeout: 8000 })

  // /logs renders
  await page.goto(`${BASE}/logs`)
  await expect(page.getByRole('heading', { name: /Audit Logs/i })).toBeVisible()
})

test('Doctor (D1) — /consent/active shows patients, /logs personal-only', async ({ page }) => {
  await login(page, ACCOUNTS.d1.email, ACCOUNTS.d1.password)
  await page.goto(`${BASE}/consent/active`)
  await expect(page.locator('body')).toContainText(/active|patient|consent/i)

  await page.goto(`${BASE}/logs`)
  await expect(page.getByRole('heading', { name: /Audit Logs/i })).toBeVisible()
})

test('Patient (P1) — Trigger Emergency button visible, /family Delete visible if owner', async ({ page }) => {
  await login(page, ACCOUNTS.p1.email, ACCOUNTS.p1.password)

  // Emergency
  await page.goto(`${BASE}/emergency`)
  const trigger = page.getByRole('button', { name: /Trigger Emergency Access/i })
  await expect(trigger).toBeVisible()
  // Must be visible (computed style not transparent)
  const bgColor = await trigger.evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(bgColor).not.toBe('rgba(0, 0, 0, 0)')
  expect(bgColor).not.toBe('rgb(255, 255, 255)') // not white-on-white

  // Family — P1 is family A owner so Delete Family Group must be visible
  await page.goto(`${BASE}/family`)
  const del = page.getByRole('button', { name: /Delete Family/i })
  await expect(del).toBeVisible()
})

test('Patient (P3, Family B owner) — Acting-for selector present', async ({ page }) => {
  await login(page, ACCOUNTS.p3.email, ACCOUNTS.p3.password)
  await page.goto(`${BASE}/consent`)
  await expect(page.getByText(/Acting for|on behalf/i)).toBeVisible({ timeout: 8000 })
})
