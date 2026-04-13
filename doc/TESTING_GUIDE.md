# GlimmoraCare — Full Integration Testing Guide

> **Backend:** http://127.0.0.1:8000  
> **Frontend:** http://localhost:3000  
> **Swagger API docs:** http://127.0.0.1:8000/docs  
> **Demo password (all accounts):** `GlimmoraDemo#1`

---

## Step 0 — Setup

### 0.1 Start the backend

```powershell
cd "D:\BAAREZ\Glimmora Care\glimmora_care_backend"
python -m uvicorn app.main:app --reload --port 8000
```

Verify: open http://127.0.0.1:8000 — should return `{"message":"API running"}`.

### 0.2 Start the frontend

```powershell
cd "D:\BAAREZ\Glimmora Care\glimmora_care"
npm run dev
```

Open http://localhost:3000 — should redirect to `/login`.

### 0.3 Demo Accounts

If demo accounts are not yet in the DB, run the seeder (one-time):

```powershell
cd "D:\BAAREZ\Glimmora Care\glimmora_care_backend"
python scripts/seed_dummy_users.py
python scripts/seed_family_patients.py
```

| Role    | Email                                 | Password       |
|---------|---------------------------------------|----------------|
| patient | glimmora.demo.patient@example.com     | GlimmoraDemo#1 |
| doctor  | glimmora.demo.doctor@example.com      | GlimmoraDemo#1 |
| admin   | glimmora.demo.admin@example.com       | GlimmoraDemo#1 |

Extra patients for family testing:

| Name          | Email                              | Password       |
|---------------|------------------------------------|----------------|
| Vikram Sharma | glimmora.demo.patient2@example.com | GlimmoraDemo#1 |
| Priya Mehta   | glimmora.demo.patient3@example.com | GlimmoraDemo#1 |
| Arun Patel    | glimmora.demo.patient4@example.com | GlimmoraDemo#1 |

---

## Feature 1 — Registration

### 1.1 — New account registration

1. Go to `/register`
2. Fill in: First Name, Last Name, unique email, unique phone, role = Patient, password
3. Click **Create Account**

**Expected:** Redirected to `/verify-email`. Backend sends a 6-digit OTP to the email.

### 1.2 — Duplicate email/phone rejected

1. Register with `glimmora.demo.patient@example.com` (already exists)

**Expected:** Error — "An account with this email or phone already exists."

### 1.3 — Weak password rejected

1. Enter a password shorter than 8 characters

**Expected:** Validation error shown before submission.

---

## Feature 2 — Email Verification (OTP)

### 2.1 — Verify with correct OTP

1. After registering, check your inbox for a 6-digit code
2. Go to `/verify-email`, enter the code, click **Verify Email**

**Expected:** "Email verified!" — auto-redirect to dashboard.

### 2.2 — Wrong OTP rejected

1. On `/verify-email`, enter `000000`

**Expected:** Error — "Invalid or expired code."

### 2.3 — Resend OTP

1. On `/verify-email`, click **Resend verification email**

**Expected:** New OTP sent; button shows 60-second cooldown.

### 2.4 — Expired OTP

1. Wait for the OTP to expire (default 5 minutes), then try to use it

**Expected:** Error — "Invalid or expired code."

---

## Feature 3 — Login

### 3.1 — Real login (Sign In tab)

1. Go to `/login` → **Sign In** tab
2. Enter `glimmora.demo.patient@example.com` / `GlimmoraDemo#1`
3. Click **Sign In**

**Expected:** Redirected to `/dashboard` with patient view.

### 3.2 — Wrong password rejected

1. Enter correct email, wrong password

**Expected:** Error — "Invalid email or password."

### 3.3 — Demo mode (no backend)

1. `/login` → **Demo Mode** tab → click any role

**Expected:** Instantly logged in with mock data. No API call. Banner shown in Settings.

### 3.4 — Role-correct dashboard

Login with each real account and verify the dashboard shows the right view:

| Role    | Dashboard shows |
|---------|----------------|
| patient | My Health, profiles, family widgets |
| doctor  | Patient list, clinical widgets |
| admin   | All routes + agent management, Organisation sidebar section |

---

## Feature 4 — Forgot Password (OTP flow)

### 4.1 — Request OTP

1. Go to `/forgot-password`
2. Enter a registered email, click **Send Reset Code**

**Expected:** Step 2 appears — OTP entry form.

### 4.2 — Enter OTP

1. Check inbox for the 6-digit code
2. Enter it and click **Verify Code**

**Expected:** Step 3 appears — new password form.

### 4.3 — Set new password

1. Enter and confirm a new password (min 8 chars)
2. Click **Reset Password**

**Expected:** Success message + link to sign in.

### 4.4 — Login with new password

1. Login with the new password

**Expected:** Login succeeds.

### 4.5 — Wrong OTP rejected

1. On step 2, enter `000000`

**Expected:** Error — "Invalid or expired code."

---

## Feature 5 — Settings — Profile Tab

### 5.1 — View profile fields

1. Login as `glimmora.demo.patient@example.com`
2. Go to `/settings` → Profile tab

**Expected:** Full Name, Phone Number (read-only), Email, Organisation, Location, Gender (patients only) all shown.

### 5.2 — Update name and location

1. Change Full Name and Location
2. Click **Save Changes**

**Expected:** Success checkmark. Refresh — updated values persist.

### 5.3 — Update gender (patient only)

1. Login as patient → Settings → Profile tab
2. Change Gender dropdown (Male / Female / Non-binary / Other)
3. Click **Save Changes**

**Expected:** Gender saved. Reload — correct value selected.

### 5.4 — Gender not shown for doctor/admin

1. Login as doctor or admin → Settings → Profile tab

**Expected:** No Gender field visible.

### 5.5 — Change email triggers re-verification

1. Change the email to a new address
2. Click **Save Changes**

**Expected:** `email_verified` reset. New OTP sent to the new email address.

### 5.6 — Demo mode shows disabled inputs

1. Login via Demo Mode → Settings → Profile tab

**Expected:** Banner "Demo mode — changes won't persist." All inputs disabled.

---

## Feature 6 — Settings — Notifications Tab

### 6.1 — Toggle notification preferences

1. `/settings` → Notifications tab
2. Toggle any switch on/off

**Expected:** Toggle responds visually immediately. State preserved while on the page.

---

## Feature 7 — Settings — Security Tab

### 7.1 — Change password

1. `/settings` → Security tab
2. Enter current password `GlimmoraDemo#1`, new password `GlimmoraNew#2`, confirm
3. Click **Update Password**

**Expected:** Success. Login with new password confirms change.

### 7.2 — Password mismatch rejected

1. Enter different values in New Password and Confirm fields

**Expected:** Inline error — "Passwords do not match."

### 7.3 — Wrong current password rejected

1. Enter incorrect current password

**Expected:** Error from API — "Current password is incorrect."

### 7.4 — Show/hide password fields

1. Click the eye icon on any password field

**Expected:** Password text toggled visible/hidden.

### 7.5 — 2FA status loads on mount

1. Login and navigate to Settings → Security tab

**Expected:** The 2FA toggle reflects the real state from the backend (enabled/disabled with method shown).

### 7.6 — Disable 2FA

1. If 2FA is enabled, click the 2FA toggle off

**Expected:** 2FA disabled. Toggle state updates. Method label clears.

### 7.7 — "Set up 2FA" link

1. If 2FA is disabled, click **Set up 2FA →**

**Expected:** Navigates to `/2fa-setup`.

---

## Feature 8 — Settings — Sessions Tab

### 8.1 — View active sessions

1. `/settings` → Sessions tab

**Expected:** Current session shown (gold border, "Current" badge). Device, browser, OS, IP, last active displayed.

### 8.2 — Revoke other session

1. Log in from a second browser/incognito to create a second session
2. In the first browser, Sessions tab → click trash icon on the other session

**Expected:** Session removed from list immediately.

### 8.3 — Sign out all devices

1. Click **Sign Out of All Other Devices**

**Expected:** All other sessions cleared. Other browser gets redirected to login.

---

## Feature 9 — 2FA Setup

### 9.1 — TOTP (Authenticator app)

1. Login → `/2fa-setup` → **Authenticator App** tab
2. QR code renders from the backend's base64 `qr_uri`
3. Scan with Google Authenticator / Authy
4. Enter the 6-digit TOTP code → click **Verify**

**Expected:** "2FA enabled." Settings Security tab now shows "Enabled via totp".

### 9.2 — Download backup codes

1. After TOTP setup, backup codes are shown
2. Click **Download backup codes**

**Expected:** `.txt` file downloaded containing the 10 backup codes.

### 9.3 — Email-based 2FA

1. `/2fa-setup` → **Email** tab
2. Click **Send OTP to my email**
3. Check inbox for 6-digit code
4. Enter it → click **Verify**

**Expected:** "2FA enabled." Settings Security tab shows "Enabled via email".

### 9.4 — Invalid TOTP code rejected

1. Enter `000000` as the TOTP code

**Expected:** Error — "Invalid or expired code."

---

## Feature 10 — Family Invites

You need **two browser windows / accounts**.

### 10.1 — Send invite to registered user

1. **Browser A:** Login as `glimmora.demo.patient@example.com`
2. Go to `/family` → **Invite Member**
3. Enter `glimmora.demo.patient2@example.com`, role = Member → **Send Invite**

**Expected:** "Invite sent!" Appears in Pending Invites list. Invite email sent to patient2's inbox.

### 10.2 — Unregistered email rejected

1. Enter an email with no account (e.g. `nobody@example.com`)

**Expected:** Error — "No account found with this email. Ask them to register first."

### 10.3 — Accept invite (in-app)

1. **Browser B:** Login as `glimmora.demo.patient2@example.com`
2. Go to `/family` → **Incoming Invites** section

**Expected:** Invite from patient shown. Click **Accept** → member added.

3. **Browser A:** Refresh `/family`

**Expected:** Vikram Sharma appears in Active Members.

### 10.4 — Decline invite

1. Send invite to patient3, then patient3 logs in → `/family` → Incoming Invites → **Decline**

**Expected:** Invite removed. Patient3 does not appear in members.

### 10.5 — Accept via email link

1. Check invite email → click the link → taken to `/invite/[token]`
2. Page shows invite details and **Sign in to accept** button

**Expected:** After signing in, redirected to `/family` with invite in Incoming Invites.

### 10.6 — Resend invite

1. `/family` → Pending Invites → click **↻** resend icon

**Expected:** No error. New invite email sent.

### 10.7 — Cancel invite

1. Click trash icon on a pending invite

**Expected:** Invite removed from Pending list immediately.

### 10.8 — Already-a-member rejected

1. Try to invite someone who already accepted

**Expected:** Error — "This user is already in your family."

---

## Feature 11 — Family Members Management

### 11.1 — View members list

1. `/family/members`

**Expected:** All members shown with role badges. Owner row has no edit/delete buttons.

### 11.2 — Change member role

1. Click a member's role badge → select new role → click ✓

**Expected:** Role badge updates immediately.

### 11.3 — Remove member

1. Click trash icon on a non-owner member

**Expected:** Member removed from list.

---

## Feature 12 — Admin Portal

### 12.1 — Organisation sidebar section

1. Login as `glimmora.demo.admin@example.com`

**Expected:** Sidebar shows **Organisation** section with links:
- Organisation Overview → `/organization`
- Manage Doctors → `/organization/doctors`
- Manage Patients → `/organization/patients`

### 12.2 — Organisation pages load

1. Click each organisation link

**Expected:** Pages load without errors.

---

## Feature 13 — Logout

### 13.1 — Logout from sidebar

1. Click **Logout** in sidebar

**Expected:** Redirected to `/login`. localStorage `gc_*` tokens cleared.

### 13.2 — Expired token redirect

1. Clear `gc_access_token` and `gc_refresh_token` from DevTools → Application → Local Storage
2. Navigate to `/dashboard`

**Expected:** Redirected to `/login`.

---

## Quick Smoke Test Checklist

Run after any code change to confirm nothing broke:

| # | Action | Expected |
|---|--------|----------|
| 1 | Open http://localhost:3000 | Redirects to /login |
| 2 | Login as demo patient (real) | Dashboard loads |
| 3 | Settings → Profile → change name | Saves, persists on reload |
| 4 | Settings → Profile → change gender | Dropdown saves |
| 5 | Settings → Security → view 2FA status | Correct enabled/disabled state |
| 6 | Settings → Sessions | Current session shown |
| 7 | Go to /family | Family + Incoming Invites section visible |
| 8 | Invite patient2 | "Invite sent!" + appears in Pending |
| 9 | Login as patient2 → /family | Incoming invite shown |
| 10 | Accept invite | Disappears from incoming, patient2 in members |
| 11 | Login as admin | Organisation section in sidebar |
| 12 | /forgot-password → enter email | Step 2 (OTP entry) appears |
| 13 | Logout | Redirected to /login |
| 14 | Demo Mode → doctor | Dashboard loads with doctor view |

---

## Troubleshooting

### "Unable to connect to server"
Backend not running. Start it: `python -m uvicorn app.main:app --reload --port 8000`

### "Invalid email or password" with seeded accounts
Re-run the seeder: `python scripts/seed_dummy_users.py`

### Emails not arriving
- Check `.env` has valid `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`
- For Gmail: use an App Password (not your account password)
- Check backend logs for `SMTP not configured` warnings

### CORS error in browser console
Backend must run at `http://127.0.0.1:8000` (not `localhost:8000`).  
Check `.env.local` has `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`.

### Token expired / redirect loops
Clear localStorage in DevTools → Application → Local Storage → delete all `gc_*` keys → re-login.

### Build check
```powershell
cd "D:\BAAREZ\Glimmora Care\glimmora_care"
npm run build
```
Should complete with no TypeScript errors.
