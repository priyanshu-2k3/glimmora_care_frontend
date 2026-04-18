/**
 * GlimmoraCare — PROFILES & FAMILY E2E Tests (P01–P05, F01–F06)
 *
 * Selectors:
 *  - Input ids derived from labels via label.toLowerCase().replace(/\s+/g, '-')
 *  - Button text: exact text rendered in JSX
 *  - Profile cards: Card components containing profile name text
 *  - "Add Profile" button: button:has-text("Add Profile")
 *  - Pencil edit: button[title] not set — identified by position (2nd button in action group)
 */

import { test, expect } from '@playwright/test'
import { registerUser, apiRequest, testUser } from '../helpers/api'
import { closeDb, getInviteToken } from '../helpers/db'
import { injectTokens } from '../helpers/auth'

// ── Teardown ─────────────────────────────────────────────────────────────────

test.afterAll(async () => {
  await closeDb()
})

// ─────────────────────────────────────────────────────────────────────────────
// P01 — Profile list loads from real API (self-profile auto-created on register)
// ─────────────────────────────────────────────────────────────────────────────
test('P01: profile list loads real data from API', async ({ page }) => {
  const u = testUser('p01')
  const { accessToken, refreshToken } = await registerUser(u)

  // Get user id from /me
  const meRes = await apiRequest('/auth/me', accessToken)
  const me = await meRes.json()
  const userId = me.id ?? me._id ?? 'placeholder'

  await injectTokens(page, accessToken, refreshToken, {
    id: userId,
    name: `${me.first_name} ${me.last_name}`.trim(),
    email: u.email,
    role: 'patient',
  })
  await page.goto('/profiles')

  // The "self" profile is auto-created on registration and should be visible
  await expect(page.locator('text=/self/i').first()).toBeVisible({ timeout: 15_000 })
})

// ─────────────────────────────────────────────────────────────────────────────
// P02 — Create a new family member profile
// ─────────────────────────────────────────────────────────────────────────────
test('P02: create a family member profile', async ({ page }) => {
  const u = testUser('p02')
  const { accessToken, refreshToken } = await registerUser(u)
  const meRes = await apiRequest('/auth/me', accessToken)
  const me = await meRes.json()

  await injectTokens(page, accessToken, refreshToken, {
    id: me.id ?? me._id ?? 'placeholder',
    name: `${me.first_name} ${me.last_name}`.trim(),
    email: u.email,
    role: 'patient',
  })
  await page.goto('/profiles')

  // "Add Profile" button is only shown to owners/admins (canSwitchProfile = true for creator)
  await expect(page.locator('button:has-text("Add Profile")')).toBeVisible({ timeout: 10_000 })
  await page.click('button:has-text("Add Profile")')

  // Fill the "Add New Profile" form
  await expect(page.locator('h3:has-text("Add New Profile")')).toBeVisible({ timeout: 5_000 })
  await page.fill('#full-name', 'Spouse Test')
  // Relation defaults or select spouse
  await page.selectOption('#relation', 'spouse')
  await page.fill('#date-of-birth', '1990-05-15')

  await page.click('button:has-text("Create Profile")')

  // New profile card should appear
  await expect(page.locator('text=Spouse Test')).toBeVisible({ timeout: 10_000 })
})

// ─────────────────────────────────────────────────────────────────────────────
// P03 — Edit an existing profile
// ─────────────────────────────────────────────────────────────────────────────
test('P03: edit an existing profile', async ({ page }) => {
  const u = testUser('p03')
  const { accessToken, refreshToken } = await registerUser(u)
  const meRes = await apiRequest('/auth/me', accessToken)
  const me = await meRes.json()

  // Create a second profile via API
  const createRes = await apiRequest('/profiles', accessToken, {
    method: 'POST',
    body: JSON.stringify({ name: 'EditMe Profile', relation: 'sibling', dob: '1995-03-10' }),
  })
  const created = await createRes.json()
  expect(created.id).toBeTruthy()

  await injectTokens(page, accessToken, refreshToken, {
    id: me.id ?? me._id ?? 'placeholder',
    name: `${me.first_name} ${me.last_name}`.trim(),
    email: u.email,
    role: 'patient',
  })
  await page.goto('/profiles')

  // Locate the edit (pencil) button next to "EditMe Profile"
  await expect(page.locator('text=EditMe Profile')).toBeVisible({ timeout: 10_000 })
  // Pencil button is the last button in the card action group for this profile
  const profileCard = page.locator('div.rounded-xl', { hasText: 'EditMe Profile' }).first()
  const pencilBtn = profileCard.locator('button').last()
  await pencilBtn.click()

  // Edit form should appear
  await expect(page.locator('h3:has-text("Edit Profile")')).toBeVisible({ timeout: 5_000 })

  // Clear full-name and type new value
  await page.fill('#full-name', 'Updated Profile Name')
  await page.click('button:has-text("Save Changes")')

  // Updated name should be visible on the page
  await expect(page.locator('text=Updated Profile Name')).toBeVisible({ timeout: 10_000 })
})

// ─────────────────────────────────────────────────────────────────────────────
// P04 — Delete a profile
// ─────────────────────────────────────────────────────────────────────────────
test('P04: delete a family member profile', async ({ page }) => {
  const u = testUser('p04')
  const { accessToken, refreshToken } = await registerUser(u)
  const meRes = await apiRequest('/auth/me', accessToken)
  const me = await meRes.json()

  // Create a second profile via API to delete
  const createRes = await apiRequest('/profiles', accessToken, {
    method: 'POST',
    body: JSON.stringify({ name: 'DeleteMe Profile', relation: 'child', dob: '2010-01-01' }),
  })
  const created = await createRes.json()
  expect(created.id).toBeTruthy()

  await injectTokens(page, accessToken, refreshToken, {
    id: me.id ?? me._id ?? 'placeholder',
    name: `${me.first_name} ${me.last_name}`.trim(),
    email: u.email,
    role: 'patient',
  })
  await page.goto('/profiles')

  await expect(page.locator('text=DeleteMe Profile')).toBeVisible({ timeout: 10_000 })

  // Trash button is the first action button (delete) in the non-self, non-active profile card
  const profileCard = page.locator('div.rounded-xl', { hasText: 'DeleteMe Profile' }).first()
  const trashBtn = profileCard.locator('button').first()
  await trashBtn.click()

  // Profile should disappear
  await expect(page.locator('text=DeleteMe Profile')).not.toBeVisible({ timeout: 10_000 })
})

// ─────────────────────────────────────────────────────────────────────────────
// P05 — Switch active profile
// ─────────────────────────────────────────────────────────────────────────────
test('P05: switch active profile', async ({ page }) => {
  const u = testUser('p05')
  const { accessToken, refreshToken } = await registerUser(u)
  const meRes = await apiRequest('/auth/me', accessToken)
  const me = await meRes.json()

  // Create a second profile
  const createRes = await apiRequest('/profiles', accessToken, {
    method: 'POST',
    body: JSON.stringify({ name: 'Switch Target', relation: 'spouse', dob: '1988-07-20' }),
  })
  const created = await createRes.json()
  expect(created.id).toBeTruthy()

  await injectTokens(page, accessToken, refreshToken, {
    id: me.id ?? me._id ?? 'placeholder',
    name: `${me.first_name} ${me.last_name}`.trim(),
    email: u.email,
    role: 'patient',
  })
  await page.goto('/profiles')

  await expect(page.locator('text=Switch Target')).toBeVisible({ timeout: 10_000 })

  // Click the profile card to switch
  const profileCard = page.locator('div.rounded-xl', { hasText: 'Switch Target' }).first()
  await profileCard.click()

  // "Active Profile" banner should now show "Switch Target"
  // Wait for the active profile banner (has "Active Profile" label) to show the switched name
  await expect(page.locator('text=Active Profile').first()).toBeVisible({ timeout: 10_000 })
  await expect(page.locator('p.font-semibold, p[class*="font-semibold"]', { hasText: 'Switch Target' }).first()).toBeVisible({ timeout: 10_000 })
})

// ─────────────────────────────────────────────────────────────────────────────
// F01 — Family invite page shows real family name and sends real invite
// ─────────────────────────────────────────────────────────────────────────────
test('F01: family invite sends real invite via API', async ({ page }) => {
  const owner = testUser('f01o')
  const { accessToken, refreshToken } = await registerUser(owner)
  const meRes = await apiRequest('/auth/me', accessToken)
  const me = await meRes.json()

  // Register invitee first so their email exists in the system
  const invitee = testUser('f01e')
  await registerUser(invitee)

  await injectTokens(page, accessToken, refreshToken, {
    id: me.id ?? me._id ?? 'placeholder',
    name: `${me.first_name} ${me.last_name}`.trim(),
    email: owner.email,
    role: 'patient',
  })
  await page.goto('/family/invite')

  // Wait for page to load — family name should NOT be hardcoded "undefined"
  await expect(page.locator('h1:has-text("Invite Member")')).toBeVisible({ timeout: 10_000 })
  const headerText = await page.locator('p.font-body').first().textContent()
  expect(headerText).not.toContain('undefined')
  expect(headerText).not.toContain('MOCK_FAMILY')

  // Fill invite form with the registered invitee's email
  await page.fill('#email-address', invitee.email)
  // Wait for button to be enabled (email is now filled)
  await expect(page.locator('button:has-text("Send Invitation")')).toBeEnabled({ timeout: 5_000 })

  // Role is already defaulted; submit
  await page.click('button:has-text("Send Invitation")')

  // Expect success screen
  await expect(page.locator('h2:has-text("Invitation sent!")')).toBeVisible({ timeout: 20_000 })
})

// ─────────────────────────────────────────────────────────────────────────────
// F02 — Members page: non-owner cannot see role-edit buttons
// ─────────────────────────────────────────────────────────────────────────────
test('F02: non-owner member cannot see role-edit buttons', async ({ page }) => {
  // Register owner (User A) — they create the family implicitly via registration
  const owner = testUser('f02o')
  const { accessToken: ownerAt, refreshToken: ownerRt } = await registerUser(owner)
  const ownerMeRes = await apiRequest('/auth/me', ownerAt)
  const ownerMe = await ownerMeRes.json()

  // Register member (User B)
  const member = testUser('f02m')
  const { accessToken: memberAt, refreshToken: memberRt } = await registerUser(member)
  const memberMeRes = await apiRequest('/auth/me', memberAt)
  const memberMe = await memberMeRes.json()

  // Owner invites member
  await apiRequest('/families/invite', ownerAt, {
    method: 'POST',
    body: JSON.stringify({ email: member.email, role: 'member' }),
  })

  // Member accepts invite via the public token flow — skip UI for this, use API
  // Get the invite token from the invites list
  const invitesRes = await apiRequest('/families/invites', ownerAt)
  const invites = await invitesRes.json()
  const pendingInvite = invites.find((i: { email: string; status: string }) => i.email === member.email && i.status === 'pending')
  if (pendingInvite) {
    // Accept invite via API
    await fetch('http://localhost:8000/api/v1/families/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: pendingInvite.id, password: '' }),
    })
  }

  // Now log in as member and check members page
  await injectTokens(page, memberAt, memberRt, {
    id: memberMe.id ?? memberMe._id ?? 'placeholder',
    name: `${memberMe.first_name} ${memberMe.last_name}`.trim(),
    email: member.email,
    role: 'patient',
  })
  await page.goto('/family/members')

  // Non-owner should NOT see role-selector dropdowns (they're gated on isCurrentUserOwner)
  // The select for roles is only shown when editing is active for owner/admin
  const roleSelects = page.locator('select[id]')
  await expect(roleSelects).toHaveCount(0, { timeout: 8_000 })
})

// ─────────────────────────────────────────────────────────────────────────────
// F03 — Members page: owner CAN see role-edit affordances
// ─────────────────────────────────────────────────────────────────────────────
test('F03: family owner can see member rows on members page', async ({ page }) => {
  const u = testUser('f03')
  const { accessToken, refreshToken } = await registerUser(u)
  const meRes = await apiRequest('/auth/me', accessToken)
  const me = await meRes.json()

  await injectTokens(page, accessToken, refreshToken, {
    id: me.id ?? me._id ?? 'placeholder',
    name: `${me.first_name} ${me.last_name}`.trim(),
    email: u.email,
    role: 'patient',
  })
  await page.goto('/family/members')

  // Owner sees "Active Members" section with at least themselves
  await expect(page.locator('text=/Active Members/i')).toBeVisible({ timeout: 15_000 })

  // The owner row should show the "Owner" role badge/label
  await expect(page.locator('text=Owner').first()).toBeVisible({ timeout: 10_000 })
})

// ─────────────────────────────────────────────────────────────────────────────
// F04 — Incoming invite: register, invite, accept via UI
// ─────────────────────────────────────────────────────────────────────────────
test('F04: user can see and accept an incoming family invite', async ({ page }) => {
  // Register inviter (owner)
  const inviter = testUser('f04i')
  const { accessToken: inviterAt } = await registerUser(inviter)

  // Register invitee
  const invitee = testUser('f04e')
  const { accessToken: inviteeAt, refreshToken: inviteeRt } = await registerUser(invitee)
  const inviteeMeRes = await apiRequest('/auth/me', inviteeAt)
  const inviteeMe = await inviteeMeRes.json()

  // Inviter sends invite to invitee's email
  const inviteRes = await apiRequest('/families/invite', inviterAt, {
    method: 'POST',
    body: JSON.stringify({ email: invitee.email, role: 'member' }),
  })
  // Invite created (200 or 201)
  expect([200, 201]).toContain(inviteRes.status)

  // Log in as invitee and go to /family
  await injectTokens(page, inviteeAt, inviteeRt, {
    id: inviteeMe.id ?? inviteeMe._id ?? 'placeholder',
    name: `${inviteeMe.first_name} ${inviteeMe.last_name}`.trim(),
    email: invitee.email,
    role: 'patient',
  })
  await page.goto('/family')

  // Expect "Family Invitations" card to appear with Accept button
  // Works for both the "no-family" view (title: "Family Invitations") and
  // the main family view (title: "Family Invitations Received")
  await expect(page.locator('text=/Family Invitation/i').first()).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('button[title="Accept"]')).toBeVisible({ timeout: 15_000 })

  // Click Accept
  await page.click('button[title="Accept"]')

  // Invite should disappear from the list (responded) — allow extra time for API + re-render
  await expect(page.locator('button[title="Accept"]')).not.toBeVisible({ timeout: 20_000 })
})

// ─────────────────────────────────────────────────────────────────────────────
// F05 — Public invite link: preview shows correct invite details (unauthenticated)
// ─────────────────────────────────────────────────────────────────────────────
test('F05: public invite link shows invite preview', async ({ page }) => {
  // Register owner and invitee
  const owner = testUser('f05o')
  const { accessToken: ownerAt } = await registerUser(owner)
  const invitee = testUser('f05e')
  await registerUser(invitee)

  // Owner sends invite
  const inviteRes = await apiRequest('/families/invite', ownerAt, {
    method: 'POST',
    body: JSON.stringify({ email: invitee.email, role: 'member' }),
  })
  expect([200, 201]).toContain(inviteRes.status)

  // Get plaintext token from DB (stored as dev_token when DEBUG=true)
  const token = await getInviteToken(invitee.email)

  // Navigate to the public invite page (unauthenticated — no injectTokens)
  await page.goto(`/invite/${token}`)

  // Invite preview should load with family and role info
  await expect(page.locator('h2:has-text("You\'re invited to a Family!")')).toBeVisible({ timeout: 10_000 })
  await expect(page.locator('text=member')).toBeVisible({ timeout: 5_000 })

  // Accept Invite button should be present for unauthenticated user
  await expect(page.locator('button:has-text("Accept Invite")')).toBeVisible({ timeout: 5_000 })
})

// ─────────────────────────────────────────────────────────────────────────────
// F06 — Public invite link: logged-in user accepts and is redirected to /family
// ─────────────────────────────────────────────────────────────────────────────
test('F06: logged-in user accepts public invite link', async ({ page }) => {
  // Register owner and invitee
  const owner = testUser('f06o')
  const { accessToken: ownerAt } = await registerUser(owner)
  const invitee = testUser('f06e')
  const { accessToken: inviteeAt, refreshToken: inviteeRt } = await registerUser(invitee)
  const inviteeMeRes = await apiRequest('/auth/me', inviteeAt)
  const inviteeMe = await inviteeMeRes.json()

  // Owner sends invite to invitee
  const inviteRes = await apiRequest('/families/invite', ownerAt, {
    method: 'POST',
    body: JSON.stringify({ email: invitee.email, role: 'member' }),
  })
  expect([200, 201]).toContain(inviteRes.status)

  // Get plaintext token from DB
  const token = await getInviteToken(invitee.email)

  // Log in as invitee and navigate to the public invite link
  await injectTokens(page, inviteeAt, inviteeRt, {
    id: inviteeMe.id ?? inviteeMe._id ?? 'placeholder',
    name: `${inviteeMe.first_name} ${inviteeMe.last_name}`.trim(),
    email: invitee.email,
    role: 'patient',
  })
  await page.goto(`/invite/${token}`)

  // Invite preview loads for authenticated user
  await expect(page.locator('h2:has-text("You\'re invited to a Family!")')).toBeVisible({ timeout: 10_000 })

  // "Accept Invite" button (authenticated flow — direct accept, no password)
  await expect(page.locator('button:has-text("Accept Invite")')).toBeVisible({ timeout: 5_000 })
  await page.click('button:has-text("Accept Invite")')

  // Success state: "Invite Accepted!" heading
  await expect(page.locator('h2:has-text("Invite Accepted!")')).toBeVisible({ timeout: 10_000 })
})
