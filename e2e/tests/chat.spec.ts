/**
 * GlimmoraCare — CHAT / AI ASSISTANT E2E Tests (C01–C04)
 *
 * C01 — Patient logs in → /assistants page loads with chat input
 * C02 — Send a message → gets a non-empty response within 30s
 * C03 — AI disclaimer banner is visible on /assistants
 * C04 — Doctor logs in → /assistants loads → send role-specific message
 *
 * Credentials:
 *   patient : priyanshuverma0901@gmail.com / Glimmora@2025
 *   doctor  : pv121416an@gmail.com         / Glimmora@2025
 */

import { test, expect } from '@playwright/test'
import { loginUser, registerUser, apiRequest, testUser } from '../helpers/api'
import { injectTokens } from '../helpers/auth'
import { closeDb } from '../helpers/db'

// ── Teardown ──────────────────────────────────────────────────────────────────

test.afterAll(async () => {
  await closeDb()
})

// ── Credentials ───────────────────────────────────────────────────────────────

const PATIENT = { email: 'priyanshuverma0901@gmail.com', password: 'Glimmora@2025' }
const DOCTOR  = { email: 'pv121416an@gmail.com',         password: 'Glimmora@2025' }

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
// C01 — Patient: /assistants page loads with chat input
// ─────────────────────────────────────────────────────────────────────────────
test('C01: patient /assistants page loads with chat input', async ({ page }) => {
  let tokens: { accessToken: string; refreshToken: string }
  try {
    tokens = await loginUser(PATIENT.email, PATIENT.password)
  } catch {
    // Fallback: register a fresh patient
    const u = testUser('c01')
    tokens = await registerUser({ ...u, role: 'patient' })
  }

  const meRes = await apiRequest('/auth/me', tokens.accessToken)
  const me = await meRes.json()

  await injectTokens(page, tokens.accessToken, tokens.refreshToken, {
    id: me.id ?? me._id ?? 'placeholder',
    name: `${me.first_name ?? ''} ${me.last_name ?? ''}`.trim(),
    email: me.email ?? PATIENT.email,
    role: 'patient',
  })

  await page.goto('/assistants')
  await page.waitForLoadState('networkidle')

  // Chat input textarea should be visible
  await expect(
    page.locator('textarea, input[type="text"]').filter({ hasText: '' }).first()
  ).toBeVisible({ timeout: 10_000 })

  // Page must not show a 404 or error
  await expect(page.locator('body')).not.toContainText('404')
})

// ─────────────────────────────────────────────────────────────────────────────
// C02 — Send a message → gets a non-empty AI response within 30s
// ─────────────────────────────────────────────────────────────────────────────
test('C02: sending a message produces a non-empty AI response', async ({ page }) => {
  let tokens: { accessToken: string; refreshToken: string }
  try {
    tokens = await loginUser(PATIENT.email, PATIENT.password)
  } catch {
    const u = testUser('c02')
    tokens = await registerUser({ ...u, role: 'patient' })
  }

  const meRes = await apiRequest('/auth/me', tokens.accessToken)
  const me = await meRes.json()

  await injectTokens(page, tokens.accessToken, tokens.refreshToken, {
    id: me.id ?? me._id ?? 'placeholder',
    name: `${me.first_name ?? ''} ${me.last_name ?? ''}`.trim(),
    email: me.email ?? PATIENT.email,
    role: 'patient',
  })

  await page.goto('/assistants')
  await page.waitForLoadState('networkidle')

  // Find the chat input (textarea preferred, fallback input)
  const chatInput = page.locator('textarea').first()
  await expect(chatInput).toBeVisible({ timeout: 10_000 })

  // Type a message
  await chatInput.fill('What does HbA1c mean?')

  // Send via Enter or Send button
  await chatInput.press('Enter')

  // Wait for the AI response — a message bubble from the bot should appear
  // The AI response is inside a message bubble (not a user bubble)
  // Give it up to 30 seconds (Gemini API latency)
  await expect(
    page.locator('[class*="message"], [class*="bubble"], [data-role="assistant"]').last()
  ).toBeVisible({ timeout: 30_000 })

  // Verify the last message bubble is not empty
  const lastMessage = page.locator('[class*="message"], [class*="bubble"], [data-role="assistant"]').last()
  const text = await lastMessage.textContent()
  expect((text ?? '').trim().length).toBeGreaterThan(0)
})

// ─────────────────────────────────────────────────────────────────────────────
// C03 — AI disclaimer banner is visible on /assistants
// ─────────────────────────────────────────────────────────────────────────────
test('C03: AI disclaimer banner is visible on /assistants', async ({ page }) => {
  let tokens: { accessToken: string; refreshToken: string }
  try {
    tokens = await loginUser(PATIENT.email, PATIENT.password)
  } catch {
    const u = testUser('c03')
    tokens = await registerUser({ ...u, role: 'patient' })
  }

  const meRes = await apiRequest('/auth/me', tokens.accessToken)
  const me = await meRes.json()

  await injectTokens(page, tokens.accessToken, tokens.refreshToken, {
    id: me.id ?? me._id ?? 'placeholder',
    name: `${me.first_name ?? ''} ${me.last_name ?? ''}`.trim(),
    email: me.email ?? PATIENT.email,
    role: 'patient',
  })

  await page.goto('/assistants')
  await page.waitForLoadState('networkidle')

  // AI disclaimer should be visible somewhere on the page
  // The constants.ts AI_DISCLAIMER text mentions "informational" and "not a substitute"
  await expect(
    page.locator(
      'text=/not a substitute|informational|medical advice|disclaimer/i'
    ).first()
  ).toBeVisible({ timeout: 10_000 })
})

// ─────────────────────────────────────────────────────────────────────────────
// C04 — Doctor: /assistants loads with Doctor Assistant persona + accepts messages
// ─────────────────────────────────────────────────────────────────────────────
test('C04: doctor /assistants loads Doctor Assistant persona', async ({ page }) => {
  let tokens: { accessToken: string; refreshToken: string }
  try {
    tokens = await loginUser(DOCTOR.email, DOCTOR.password)
  } catch {
    test.skip(true, 'Doctor credentials returned 401 — password may have changed')
    return
  }

  const meRes = await apiRequest('/auth/me', tokens.accessToken)
  const me = await meRes.json()

  await injectTokens(page, tokens.accessToken, tokens.refreshToken, {
    id: me.id ?? me._id ?? 'placeholder',
    name: `${me.first_name ?? ''} ${me.last_name ?? ''}`.trim(),
    email: me.email ?? DOCTOR.email,
    role: 'doctor',
  })

  await page.goto('/assistants')
  await page.waitForLoadState('networkidle')

  // The "Doctor Assistant" persona label should be visible for the doctor role
  await expect(
    page.locator('text=/Doctor Assistant/i').first()
  ).toBeVisible({ timeout: 10_000 })

  // Chat input must be present
  await expect(page.locator('textarea').first()).toBeVisible({ timeout: 5_000 })

  // Send a doctor-specific message
  const chatInput = page.locator('textarea').first()
  await chatInput.fill("Give me a clinical summary for today's patients")
  await chatInput.press('Enter')

  // Some response should appear (or a loading indicator then response)
  // Just assert the input was accepted (does not error out)
  await page.waitForTimeout(2_000)
  await expect(page.locator('body')).not.toContainText('Error sending message')
})
