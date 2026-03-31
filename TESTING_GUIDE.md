# GlimmoraCare — Full Integration Testing Guide

> **Backend:** http://127.0.0.1:8000
> **Frontend:** http://localhost:3000
> **All demo accounts use password:** `GlimmoraDemo#1`

---

## Step 0 — Setup (do this first)

### 0.1 Start the backend

```powershell
cd D:\BAAREZ\glimmora_care_backend
.\.venv\Scripts\activate
uvicorn app.main:app --reload
```

Verify: open http://127.0.0.1:8000/docs — you should see the Swagger UI.

### 0.2 Start the frontend

```powershell
cd D:\BAAREZ\glimmora_care
npm run dev
```

Open http://localhost:3000

### 0.3 Seed demo accounts (first time only)

Open a second terminal in the backend folder:

```powershell
cd D:\BAAREZ\glimmora_care_backend
set PYTHONPATH=%CD%
.\.venv\Scripts\python.exe scripts\seed_dummy_users.py
.\.venv\Scripts\python.exe scripts\seed_family_patients.py
```

Expected output for each account:
```
OK    patient      glimmora.demo.patient@example.com   userId=...  familyId=...
OK    doctor       glimmora.demo.doctor@example.com    userId=...  familyId=null
...
```

### Demo Accounts Reference

| Role       | Email                                  | Password         |
|------------|----------------------------------------|------------------|
| patient    | glimmora.demo.patient@example.com      | GlimmoraDemo#1   |
| doctor     | glimmora.demo.doctor@example.com       | GlimmoraDemo#1   |
| ngo        | glimmora.demo.ngo@example.com          | GlimmoraDemo#1   |
| government | glimmora.demo.gov@example.com          | GlimmoraDemo#1   |
| admin      | glimmora.demo.admin@example.com        | GlimmoraDemo#1   |

### Extra Patients (for family testing)

| Name          | Email                                   | Password       |
|---------------|-----------------------------------------|----------------|
| Vikram Sharma | glimmora.demo.patient2@example.com      | GlimmoraDemo#1 |
| Priya Mehta   | glimmora.demo.patient3@example.com      | GlimmoraDemo#1 |
| Arun Patel    | glimmora.demo.patient4@example.com      | GlimmoraDemo#1 |
| Sunita Nair   | glimmora.demo.patient5@example.com      | GlimmoraDemo#1 |

---

## Feature 1 — Registration

### Test 1.1 — New account registration

1. Go to http://localhost:3000/register
2. Step 1: Enter **First Name** `Test`, **Last Name** `User`
3. Step 2: Select role **Patient**
4. Step 3: Enter:
   - Email: any unique email (e.g. `newtest@example.com`)
   - Phone: any unique phone (e.g. `+919876543210`)
   - Password: `GlimmoraDemo#1`
5. Click **Create Account**

**Expected:** Redirected to `/verify-email` page showing "Check your email" screen.

### Test 1.2 — Duplicate email/phone rejection

1. Go to http://localhost:3000/register
2. Use email `glimmora.demo.patient@example.com` (already seeded)
3. Fill all steps and click **Create Account**

**Expected:** Error banner: _"An account with this email or phone already exists."_

---

## Feature 2 — Email Verification

### Test 2.1 — Verify email via link

> Requires email delivery to be configured OR you can grab the token from the backend logs/database.

1. After registering, check your email for a link like:
   `http://localhost:3000/verify-email?token=<TOKEN>`
2. Click the link

**Expected:** Green checkmark — "Email verified!" then auto-redirects to dashboard.

### Test 2.2 — Verify email with invalid token

1. Go to: http://localhost:3000/verify-email?token=invalidtoken123

**Expected:** Error card — "This link is invalid or has already been used."

### Test 2.3 — Resend verification email

1. Go to: http://localhost:3000/verify-email (no token in URL)
2. Click **Resend verification email**

**Expected:** Button changes to "Resent! Check your inbox" and a 60-second cooldown starts.

---

## Feature 3 — Login

### Test 3.1 — Real login (Sign In tab)

1. Go to http://localhost:3000/login
2. Click the **Sign In** tab
3. Enter:
   - Email: `glimmora.demo.patient@example.com`
   - Password: `GlimmoraDemo#1`
4. Click **Sign In**

**Expected:** Redirected to `/dashboard` with patient view.

### Test 3.2 — Wrong password

1. Login with correct email but wrong password (e.g. `wrongpass`)

**Expected:** Error banner — "Invalid email or password."

### Test 3.3 — Demo mode (no backend needed)

1. Go to http://localhost:3000/login
2. Click the **Demo Mode** tab
3. Click any role button (e.g. **Doctor**)

**Expected:** Logged in immediately with mock data, no API call made.

### Test 3.4 — Login as each role and verify dashboard

Repeat Test 3.1 with each role email. Verify the dashboard shows the correct role-specific content:

| Role       | Dashboard shows |
|------------|----------------|
| patient    | My Health, profiles, family widgets |
| doctor     | Patient list, clinical widgets |
| ngo        | Community, offline sync widgets |
| government | Population analytics widgets |
| admin      | All routes + agent management |

---

## Feature 4 — Forgot Password / Reset Password

### Test 4.1 — Request password reset

1. Go to http://localhost:3000/forgot-password
2. Enter `glimmora.demo.patient@example.com`
3. Click **Send Reset Link**

**Expected:** Success state — "Check your email for a password reset link."

### Test 4.2 — Reset with valid token

> Grab the reset token from your email or backend logs.

1. Navigate to: `http://localhost:3000/reset-password?token=<TOKEN>`
2. Enter new password: `GlimmoraNew#1`
3. Click **Reset Password**

**Expected:** Success state, link to sign in.

4. Login with the new password to confirm.

### Test 4.3 — Reset page with no token

1. Go to: http://localhost:3000/reset-password (no token)

**Expected:** Warning shown — "No reset token found in URL."

---

## Feature 5 — OTP Login (Phone)

### Test 5.1 — OTP flow

1. Go to http://localhost:3000/otp-verify
2. Enter phone: `+15550100001` (the seeded patient phone)
3. Click **Send OTP**

**Expected:** OTP input screen appears.

4. Enter the OTP from the backend (check logs or SMS if configured)
5. Click **Verify & Sign In**

**Expected:** Redirected to dashboard.

---

## Feature 6 — Settings — Profile

### Test 6.1 — Update profile info

1. Login as `glimmora.demo.patient@example.com`
2. Go to http://localhost:3000/settings
3. **Profile** tab is active by default
4. Change **First Name** to `DemoPatient`
5. Change **Organization** (optional)
6. Click **Save Changes**

**Expected:** Success toast/message. Refresh the page — updated name persists.

### Test 6.2 — Demo mode shows disabled inputs

1. Login via **Demo Mode** tab (any role)
2. Go to Settings → Profile tab

**Expected:** Banner "Demo Mode — changes won't persist", all inputs disabled.

---

## Feature 7 — Settings — Password Change

### Test 7.1 — Change password

1. Login as `glimmora.demo.patient@example.com`
2. Go to Settings → **Security** tab
3. Enter:
   - Current password: `GlimmoraDemo#1`
   - New password: `GlimmoraNew#2`
   - Confirm: `GlimmoraNew#2`
4. Click **Update Password**

**Expected:** Success message. Login with new password to verify.

### Test 7.2 — Wrong current password

1. Enter incorrect current password
2. Click **Update Password**

**Expected:** Error message shown.

---

## Feature 8 — Settings — Sessions

### Test 8.1 — View active sessions

1. Login as `glimmora.demo.patient@example.com`
2. Go to Settings → **Security** tab
3. Click **Sessions** section (or scroll to it)

**Expected:** List of active sessions with device info, IP, last active time. Current session marked.

### Test 8.2 — Logout individual session

1. In the sessions list, click the trash/logout icon on a non-current session

**Expected:** Session removed from list.

### Test 8.3 — Logout all other sessions

1. Click **Logout All Other Sessions** button

**Expected:** Confirmation, all other sessions cleared.

---

## Feature 9 — Family Invites — Full Flow

> **New flow:** The invitee must already have a registered account. They accept or decline from inside the app on the **Notifications** page — no password entry on the invite link, no public token page.

You need **two browser windows** (or one normal + one incognito).

### Flow overview

```
Owner sends invite (Family page)
  → Invitee logs in
  → Notifications page shows "Join <Family>" card
  → Invitee clicks Accept or Decline
  → Owner sees member appear in family
```

---

### Test 9.1 — Invite a registered user

**Prerequisites:** Both accounts must already exist (run the seeder in Step 0.3).

1. **Browser A:** Login as `glimmora.demo.patient@example.com`
2. Go to http://localhost:3000/family
3. Click **Invite Member**
4. Enter:
   - Email: `glimmora.demo.patient2@example.com`
   - Role: **Member**
5. Click **Send Invite**

**Expected:** "✓ Invite sent successfully!" — invite appears in **Pending Invites** section.

### Test 9.2 — Invite an unregistered email (should be blocked)

1. Still on the invite form, enter an email that has no account (e.g. `notregistered@example.com`)
2. Click **Send Invite**

**Expected:** Error — _"No account found with this email. Ask them to register first."_

### Test 9.3 — Accept invite from Notifications

1. **Browser B (incognito):** Login as `glimmora.demo.patient2@example.com` / `GlimmoraDemo#1`
2. Go to http://localhost:3000/notifications

**Expected:** A **Family Invites** card appears at the top showing:
- "Join **PatientHead family**"
- Invited by: `Demo PatientHead`
- Role: `member`
- [Accept] and [Decline] buttons

3. Click **Accept**

**Expected:** Card disappears, brief "✓ Joined family!" message shown.

4. Refresh http://localhost:3000/family in **Browser A**

**Expected:** `Vikram Sharma` appears in Active Members list with **Member** badge.

### Test 9.4 — Decline invite from Notifications

1. **Browser A:** Send a new invite to `glimmora.demo.patient3@example.com` (Priya Mehta)
2. **Browser B (incognito):** Login as `glimmora.demo.patient3@example.com` / `GlimmoraDemo#1`
3. Go to http://localhost:3000/notifications
4. Click **Decline** on the invite

**Expected:** Invite card disappears. Invite status in backend set to `declined`.

5. **Browser A:** Verify Priya Mehta does NOT appear in the members list.

### Test 9.5 — Invite link page (public link)

> If someone navigates to a raw `/invite/<token>` link (e.g. from an old email), they see a landing page — not a form.

1. Go to: http://localhost:3000/invite/anytoken

**Expected:** Card showing "You've been invited! Sign in to accept your family invite. Once logged in, you'll see the invite waiting in **Notifications**." with **Sign in** and **Register** buttons.

### Test 9.6 — Resend and cancel pending invites

1. **Browser A:** Login as `glimmora.demo.patient@example.com` → go to `/family`
2. Send invite to `glimmora.demo.patient4@example.com`
3. In Pending Invites, click the **↻** (resend) icon

**Expected:** No error — invite resent successfully.

4. Click the **trash** icon to cancel the invite

**Expected:** Invite removed from Pending Invites list immediately.

### Test 9.7 — Invite already-a-member

1. Try to invite `glimmora.demo.patient2@example.com` again (they already accepted in Test 9.3)

**Expected:** Error — _"This user is already in your family."_

---

## Feature 10 — Family Members Management

### Setup
Complete Feature 9 first so at least one member (Vikram Sharma) is in the family.

### Test 10.1 — View members page

1. Login as `glimmora.demo.patient@example.com`
2. Go to http://localhost:3000/family/members

**Expected:** Active members list with role badges. Owner row has no edit/delete buttons.

### Test 10.2 — Change a member's role

1. Click the role badge/button on **Vikram Sharma** (currently **Member**)
2. Change dropdown to **Admin**
3. Click the **✓ checkmark** to save

**Expected:** Role badge updates to **Admin** in the list.

### Test 10.3 — Remove a member

1. Invite `glimmora.demo.patient4@example.com` and have them accept (see Feature 9)
2. In Members page, click the **trash** icon on Arun Patel

**Expected:** Member removed from list immediately.

### Test 10.4 — Cancel role edit

1. Click to edit a member's role
2. Click the **✗ cancel** button

**Expected:** Dropdown closes, role unchanged.

---

## Feature 11 — Logout

### Test 11.1 — Logout from sidebar

1. Login as any real account
2. Click the **Logout** button in the sidebar

**Expected:** Redirected to `/login`. Local storage cleared (tokens gone).

### Test 11.2 — Session expiry redirect

1. Login, then manually clear `gc_access_token` and `gc_refresh_token` from localStorage (DevTools → Application → Local Storage)
2. Try to navigate to http://localhost:3000/dashboard

**Expected:** Redirected to `/login`.

---

## Feature 12 — 2FA Setup (TOTP)

### Test 12.1 — Enable TOTP

1. Login as `glimmora.demo.patient@example.com`
2. Go to http://localhost:3000/2fa-setup
3. Click **Set up Authenticator App**

**Expected:** QR code and secret key displayed.

4. Scan QR with Google Authenticator / Authy
5. Enter the 6-digit code
6. Click **Verify**

**Expected:** 2FA enabled confirmation, backup codes shown.

### Test 12.2 — Disable 2FA

1. If 2FA is enabled, go to Settings → Security
2. Click **Disable 2FA**

**Expected:** 2FA disabled.

---

## Quick Smoke Test Checklist

Run through this after any deployment to verify nothing is broken:

| # | Action | Expected Result |
|---|--------|----------------|
| 1 | Open http://localhost:3000 | Redirects to /login |
| 2 | Login with demo patient | Dashboard loads |
| 3 | Go to /settings, change first name | Saves successfully |
| 4 | Go to /family | Family name and members shown |
| 5 | Send invite to patient2 email | "✓ Invite sent", appears in Pending |
| 6 | Try inviting unregistered email | Error "No account found…" |
| 7 | Login as patient2 → /notifications | Family Invite card shown |
| 8 | Click Accept on invite | Card disappears, "✓ Joined family!" |
| 9 | Back as patient → /family | patient2 appears in members |
| 10 | Go to /family/members, change role | Role badge updates |
| 11 | Logout | Redirected to /login |
| 12 | Login via Demo Mode (doctor) | Dashboard with doctor view |

---

## Troubleshooting

### "Unable to connect to server"
- Backend is not running. Start it: `uvicorn app.main:app --reload`

### "Invalid email or password" when using seeded accounts
- Run the seeder again: `python scripts/seed_dummy_users.py`

### Invite token not received by email
- Check backend logs for the raw token
- Or query MongoDB `invites` collection directly for the token field
- Or use the GET `/api/v1/families/invites` endpoint (authenticated) to get the invite ID, then construct the URL manually

### CORS error in browser console
- Backend must be running at `http://127.0.0.1:8000` (not `localhost:8000`)
- Check `.env.local` has `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`

### Token expired / session issues
- Clear localStorage in DevTools → Application → Local Storage → clear all `gc_*` keys
- Re-login

### Build errors
```powershell
cd D:\BAAREZ\glimmora_care
npm run build
```
Should show `✓ Compiled successfully` with no TypeScript errors.
