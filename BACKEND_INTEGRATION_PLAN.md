# GlimmoraCare — Backend Integration Plan
**Date:** 2026-03-31
**Frontend stack:** Next.js 16 / React 19 / TypeScript
**Backend stack:** FastAPI / MongoDB / JWT (HS256)
**API base:** `http://127.0.0.1:8000/api/v1`

---

## How to read this document

- **❌ Missing** — endpoint does not exist in backend at all
- **⚠️ Incomplete** — endpoint exists but response shape is wrong / missing fields
- **🐛 UI Bug** — frontend bug that will be fixed once the API is available
- **✅ Done** — working end-to-end today

Every section lists: what the frontend expects, exact request/response shape, and which frontend file uses it.

---

## Status Summary

| Area | Done | Incomplete | Missing |
|------|------|-----------|---------|
| Auth (login/register/logout/OTP/reset) | ✅ | — | — |
| Auth — current user + update | — | — | ❌ 3 endpoints |
| Auth — sessions with device info | — | ⚠️ | — |
| Auth — email verify (auto + resend) | — | — | ❌ 1 endpoint + 1 UI fix |
| Auth — 2FA | — | — | ❌ 5 endpoints |
| Profiles (CRUD + switch) | ✅ API | ⚠️ missing fields | 🐛 not wired to UI |
| Family (create/invite/members) | ✅ API | — | ❌ 2 endpoints + 🐛 bugs |
| Invite accept page | ✅ endpoint | — | ❌ 1 endpoint (preview) + 🐛 |
| Password change | — | — | ❌ 1 endpoint |

---

## 1. Auth — Current User

### 1.1 `GET /api/v1/auth/me` ❌ Missing

**Why it's needed:**
After login the frontend decodes the JWT to get `user_id` and `role`, but has no way to get the user's name, phone number, or organization. Non-patient users (doctor, NGO, admin) have no profiles array, so the display name falls back to `email.split('@')[0]`. The Settings → Profile tab also needs to populate its edit form from real data.

**Request:**
```
GET /api/v1/auth/me
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "id": "string",
  "email": "string",
  "first_name": "string",
  "last_name": "string",
  "phone_number": "string",
  "role": "patient | doctor | ngo | government | admin",
  "organization": "string | null",
  "location": "string | null",
  "profile_photo": "string | null",
  "is_active": true,
  "email_verified": false,
  "created_at": "ISO string",
  "family_id": "string | null"
}
```

**Used by:**
`context/AuthContext.tsx` on login (to populate `user.name`) and `app/(dashboard)/settings/page.tsx` Profile tab.

---

### 1.2 `PATCH /api/v1/auth/me` ❌ Missing

**Why it's needed:**
Settings → Profile tab has four editable fields: Full Name, Email, Organization, Location. The Save button currently does a `setTimeout(600)` mock and shows "Saved!" — nothing is persisted.

**Request:**
```json
PATCH /api/v1/auth/me
Authorization: Bearer <accessToken>

{
  "first_name": "string (optional)",
  "last_name": "string (optional)",
  "email": "string (optional)",
  "organization": "string | null (optional)",
  "location": "string | null (optional)",
  "profile_photo": "string | null (optional)"
}
```

**Response:**
```json
{
  "id": "string",
  "email": "string",
  "first_name": "string",
  "last_name": "string",
  "organization": "string | null",
  "location": "string | null",
  "profile_photo": "string | null"
}
```

**Notes:**
- If `email` is changed it should set `email_verified: false` and trigger a new verification email
- All fields optional (partial update)

**Used by:** `app/(dashboard)/settings/page.tsx` Profile tab Save button.

---

### 1.3 `PUT /api/v1/auth/change-password` ❌ Missing

**Why it's needed:**
Settings → Security tab has a full Change Password form (Current Password / New Password / Confirm New Password). The "Update Password" button is wired to nothing.

**Request:**
```json
PUT /api/v1/auth/change-password
Authorization: Bearer <accessToken>

{
  "current_password": "string",
  "new_password": "string"
}
```

**Response:**
```json
{ "message": "Password updated" }
```

**Error responses:**
```json
400 → { "detail": "Current password is incorrect" }
422 → { "detail": "New password does not meet requirements" }
```

**Used by:** `app/(dashboard)/settings/page.tsx` Security tab.

---

## 2. Auth — Sessions with Device Info

### 2.1 `GET /api/v1/auth/sessions` ⚠️ Incomplete

**Current response shape:**
```json
[
  { "id": "string", "created_at": "string", "expires_at": "string" }
]
```

**What the Settings → Sessions tab needs:**

```json
[
  {
    "id": "string",
    "device": "iPhone 14 Pro",
    "browser": "Safari 17",
    "os": "iOS 17",
    "location": "Mumbai, MH",
    "ip": "103.21.58.14",
    "last_active": "ISO string",
    "is_current": true,
    "created_at": "ISO string",
    "expires_at": "ISO string"
  }
]
```

**Implementation approach (minimal):**
When a session is created (login / OTP verify), capture:
- `user_agent` from the `User-Agent` request header (parse into `device`, `browser`, `os`)
- `ip_address` from the request (parse into `location` via IP geolocation or just return raw IP)
- `last_active` — update on every authenticated request or just use `created_at` initially

**Minimum viable (no geo-IP):**
```json
{
  "id": "string",
  "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0...) Safari/...",
  "ip_address": "103.21.58.14",
  "last_active": "ISO string",
  "is_current": true,
  "created_at": "ISO string",
  "expires_at": "ISO string"
}
```
The frontend can parse `user_agent` string to determine device icon (mobile/laptop/desktop) and display the raw IP if no geolocation is available.

**Used by:** `app/(dashboard)/settings/page.tsx` Sessions tab (currently uses `data/sessions.ts` mock).

---

## 3. Auth — Email Verification

### 3.1 `POST /api/v1/auth/resend-verification` ❌ Missing

**Why it's needed:**
`app/(auth)/verify-email/page.tsx` has a Resend button with a 60-second cooldown timer. Clicking it currently does nothing — no API call is made.

**Request:**
```json
POST /api/v1/auth/resend-verification
Authorization: Bearer <accessToken>
(no body required)
```

**Response:**
```json
{ "message": "Verification email sent" }
```

**Error responses:**
```json
400 → { "detail": "Email already verified" }
429 → { "detail": "Please wait before requesting another email" }
```

**Used by:** `app/(auth)/verify-email/page.tsx` Resend button.

---

### 3.2 UI Fix — verify-email page auto-verifies from URL token 🐛

**What needs to change in frontend:**
When the user clicks the link in their email, they land on `/verify-email?token=abc123`. The page currently ignores the `?token=` param and just shows the static "check your inbox" screen.

**Required behaviour:**
- On mount, read `?token=` from URL
- If token present → call `POST /auth/verify-email` with `{ token }` immediately
- Show success state → redirect to `/dashboard` after 2 seconds
- If no token → show the "check your inbox" screen (current behaviour)

The endpoint `POST /api/v1/auth/verify-email` already exists in the backend. This is a **frontend-only fix** once the endpoint is confirmed working.

---

## 4. Auth — Two-Factor Authentication

All 2FA endpoints are missing. The frontend has a complete 5-step 2FA setup UI at `app/(auth)/2fa-setup/page.tsx` covering both TOTP (Google Authenticator) and SMS methods.

### 4.1 `POST /api/v1/auth/2fa/totp/setup` ❌ Missing

**Why:** 2FA setup page Step 2 (authenticator app path) needs to display a real QR code and TOTP secret. Currently uses `MOCK_SECRET = 'JBSWY3DPEHPK3PXP'` and a CSS-drawn fake QR.

**Request:**
```
POST /api/v1/auth/2fa/totp/setup
Authorization: Bearer <accessToken>
(no body)
```

**Response:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qr_uri": "otpauth://totp/GlimmoraCare:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=GlimmoraCare",
  "backup_codes": ["12345678", "87654321", "..."]
}
```

The frontend will pass `qr_uri` to a QR code library (e.g. `qrcode.react`) to render a real scannable code.

---

### 4.2 `POST /api/v1/auth/2fa/totp/verify` ❌ Missing

**Why:** 2FA setup Step 4 — user enters the 6-digit TOTP code to confirm the authenticator app is working before enabling 2FA.

**Request:**
```json
POST /api/v1/auth/2fa/totp/verify
Authorization: Bearer <accessToken>

{ "code": "123456" }
```

**Response:**
```json
{ "message": "2FA enabled" }
```

**Error:**
```json
400 → { "detail": "Invalid or expired code" }
```

---

### 4.3 `POST /api/v1/auth/2fa/sms/setup` ❌ Missing

**Why:** 2FA setup Step 2 (SMS path) — sends an OTP to the user's registered phone for 2FA enrollment.

**Request:**
```json
POST /api/v1/auth/2fa/sms/setup
Authorization: Bearer <accessToken>

{ "phone": "+919876543210" }
```

**Response:**
```json
{ "message": "OTP sent to +919876543210" }
```

---

### 4.4 `GET /api/v1/auth/2fa/status` ❌ Missing

**Why:** Settings → Security tab shows a "Two-Factor Authentication" toggle. It needs to know if 2FA is currently enabled to set the toggle state.

**Request:**
```
GET /api/v1/auth/2fa/status
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "enabled": true,
  "method": "totp | sms | null"
}
```

---

### 4.5 `DELETE /api/v1/auth/2fa` ❌ Missing

**Why:** Settings → Security tab "Two-Factor Authentication" toggle needs to be able to disable 2FA.

**Request:**
```
DELETE /api/v1/auth/2fa
Authorization: Bearer <accessToken>
```

**Response:**
```json
{ "message": "2FA disabled" }
```

---

## 5. Profiles — Missing Fields

The backend profile schema is missing three fields that the frontend `types/profile.ts` expects and the profile UI (`app/(dashboard)/profiles/page.tsx`) actively renders and edits.

### 5.1 Add `blood_group`, `gender`, `avatar` to Profile schema ⚠️ Incomplete

**Current backend profile fields:**
```
id, family_id, name, relation, dob, linked_user_id, created_by, created_at
```

**Frontend `types/profile.ts` expects:**
```typescript
Profile {
  id: string
  name: string
  relation: string
  dob: string
  bloodGroup: string      // ← MISSING from backend
  gender: string          // ← MISSING from backend
  avatar?: string         // ← MISSING from backend
  // ...
}
```

**Where it's used:**
- `app/(dashboard)/profiles/page.tsx` — shows blood group and gender on each profile card, has dropdowns to set both when creating a profile
- `app/(auth)/register/page.tsx` — Step 2 family member form collects Blood Group for each member

**Changes needed in backend:**

`POST /api/v1/profiles` — add optional fields to request:
```json
{
  "name": "string",
  "relation": "string",
  "dob": "string | null",
  "blood_group": "string | null",
  "gender": "male | female | other | null",
  "avatar": "string | null"
}
```

`PUT /api/v1/profiles/{profile_id}` — same fields as optional updates.

`GET /api/v1/profiles` / `GET /api/v1/profiles/{profile_id}` — include these fields in response:
```json
{
  "id": "string",
  "family_id": "string",
  "name": "string",
  "relation": "string",
  "dob": "string | null",
  "blood_group": "string | null",
  "gender": "male | female | other | null",
  "avatar": "string | null",
  "linked_user_id": "string | null",
  "created_by": "string",
  "created_at": "string"
}
```

---

### 5.2 ProfileContext is not wired to real API 🐛 (Frontend fix — unblocked once fields added)

`context/ProfileContext.tsx` uses `MOCK_PROFILES` and `MOCK_FAMILY` exclusively. All 7 profile endpoints exist in the backend. Once the schema fields above are added, the frontend will wire ProfileContext to call:

- `profileApi.list()` on mount
- `profileApi.create()` on form submit
- `profileApi.update()` on edit save
- `profileApi.delete()` on trash icon
- `profileApi.switchProfile()` on profile card click (updates access token)

---

## 6. Family — Missing Endpoints & UI Bugs

### 6.1 `GET /api/v1/families/invite/preview` ❌ Missing

**Why it's needed:**
`app/(auth)/invite/[token]/page.tsx` reads `params.token` from the URL but then uses a hardcoded `MOCK_INVITE` object. The page renders:
- Family name ("Sharma Family")
- Inviter name ("Priya Sharma")
- Invited email
- Role
- Relation

All of this is fake. The page needs a **public** endpoint to resolve the invite details from the token **before** the user accepts.

**Request:**
```
GET /api/v1/families/invite/preview?token=<opaque_token>
(no auth required — invitee may not have an account yet)
```

**Response:**
```json
{
  "family_name": "Sharma Family",
  "invited_by": "Priya Sharma",
  "email": "vikram@example.com",
  "role": "member",
  "expires_at": "ISO string",
  "status": "pending | accepted | cancelled | expired"
}
```

**Error responses:**
```json
404 → { "detail": "Invite not found" }
410 → { "detail": "Invite has expired or been cancelled" }
```

**Used by:** `app/(auth)/invite/[token]/page.tsx`

---

### 6.2 `POST /api/v1/families/invite/decline` ❌ Missing

**Why it's needed:**
The invite page has an explicit **Decline** button. Clicking it currently just shows a local "declined" state — no backend call is made. There is no endpoint to record a decline.

**Request:**
```json
POST /api/v1/families/invite/decline
(no auth required)

{ "token": "string" }
```

**Response:**
```json
{ "message": "Invite declined" }
```

**Used by:** `app/(auth)/invite/[token]/page.tsx` Decline button.

---

### 6.3 Family page UI bugs 🐛

`app/(dashboard)/family/page.tsx` has two HTML-rendering bugs in the role description text:

```jsx
// Current (broken — renders literally as text):
"Owner &nbsp; Full control..."
"Admin &amp; Member..."

// Should be plain text strings:
"Owner — Full control..."
"Admin — Member..."
```

These will be fixed in the frontend when the page is wired to real data.

---

### 6.4 Family members page broken routes 🐛

`app/(dashboard)/family/members/page.tsx` has two buttons that navigate to pages that do not exist:

```jsx
// These pages do not exist:
href="/family/invite"   // → 404
href="/family/roles"    // → 404

// Also uses window.location.href instead of Next.js router:
window.location.href = '/family/invite'  // ← wrong, should use router.push()
```

**Frontend fix:** Replace with existing working routes or create the missing pages.

---

## 7. Priority Order for Backend Implementation

Ordered by how much frontend functionality is unblocked.

### P0 — Breaks login experience for all non-patient roles

| # | Endpoint | Impact |
|---|----------|--------|
| 1 | `GET /api/v1/auth/me` | Every doctor/NGO/admin user shows no name after login |

### P1 — Settings page is entirely mock

| # | Endpoint | Impact |
|---|----------|--------|
| 2 | `PATCH /api/v1/auth/me` | Profile tab save does nothing |
| 3 | `PUT /api/v1/auth/change-password` | Password change form does nothing |
| 4 | Sessions — add `user_agent`, `ip_address`, `last_active`, `is_current` to `GET /auth/sessions` | Sessions tab shows hardcoded mock devices |

### P2 — Profile & family features are entirely mock

| # | Endpoint / Change | Impact |
|---|-------------------|--------|
| 5 | Add `blood_group`, `gender`, `avatar` to Profile schema | Profiles page can't be wired without these fields |
| 6 | `GET /api/v1/families/invite/preview?token=` | Invite page shows hardcoded fake data |
| 7 | `POST /api/v1/auth/resend-verification` | Resend button on verify-email page does nothing |
| 8 | `POST /api/v1/families/invite/decline` | Decline button has no effect |

### P3 — Nice to have / auth security

| # | Endpoint | Impact |
|---|----------|--------|
| 9 | `GET /api/v1/auth/2fa/status` | 2FA toggle in settings has no real state |
| 10 | `POST /api/v1/auth/2fa/totp/setup` | 2FA page shows fake QR code |
| 11 | `POST /api/v1/auth/2fa/totp/verify` | 2FA setup can't be completed |
| 12 | `POST /api/v1/auth/2fa/sms/setup` | SMS 2FA path non-functional |
| 13 | `DELETE /api/v1/auth/2fa` | Can't disable 2FA once set |

---

## 8. Frontend Changes Queued (waiting on backend)

These are confirmed frontend code changes that will be made once the corresponding backend endpoint is ready.

| Frontend File | Change Needed | Waiting On |
|--------------|---------------|-----------|
| `context/AuthContext.tsx` | Call `GET /auth/me` after login to populate `user.name`, `user.organization` etc. | Endpoint #1 |
| `app/(dashboard)/settings/page.tsx` | Wire Profile tab save to `PATCH /auth/me` | Endpoint #2 |
| `app/(dashboard)/settings/page.tsx` | Wire Change Password form to `PUT /auth/change-password` | Endpoint #3 |
| `app/(dashboard)/settings/page.tsx` | Wire Sessions tab to real `GET /auth/sessions` + `DELETE /auth/session/{id}` | Endpoint #4 (schema fix) |
| `context/ProfileContext.tsx` | Replace all `MOCK_PROFILES` / `MOCK_FAMILY` with real `profileApi.*` calls | Endpoint #5 (fields) |
| `app/(auth)/verify-email/page.tsx` | Read `?token=` from URL on mount, auto-call verify, remove demo button | Existing endpoint (just needs UI fix) |
| `app/(auth)/invite/[token]/page.tsx` | Replace `MOCK_INVITE` with `GET /invite/preview?token=` call | Endpoint #6 |
| `app/(auth)/verify-email/page.tsx` | Wire Resend button to `POST /auth/resend-verification` | Endpoint #7 |
| `app/(auth)/invite/[token]/page.tsx` | Wire Decline button to `POST /invite/decline` | Endpoint #8 |
| `app/(dashboard)/family/page.tsx` | Fix HTML entity bugs (`&amp;` → `—`) | No backend needed, fix immediately |
| `app/(dashboard)/family/members/page.tsx` | Fix broken `/family/invite` and `/family/roles` routes, replace `window.location.href` with `router.push()` | No backend needed, fix immediately |

---

## 9. What Is Already Working End-to-End ✅

| Feature | Frontend | Backend |
|---------|----------|---------|
| Register (email + password) | `app/(auth)/register/page.tsx` | `POST /api/v1/auth/register` |
| Login (email + password) | `app/(auth)/login/page.tsx` Sign In tab | `POST /api/v1/auth/login` |
| Demo login (mock, no backend) | `app/(auth)/login/page.tsx` Demo tab | — |
| Logout (revokes session) | Sidebar + Settings | `POST /api/v1/auth/logout` |
| Token auto-refresh on 401 | `lib/api.ts` apiFetch | `POST /api/v1/auth/refresh-token` |
| Forgot password | `app/(auth)/forgot-password/page.tsx` | `POST /api/v1/auth/forgot-password` |
| Reset password (from email link) | `app/(auth)/reset-password/page.tsx` | `POST /api/v1/auth/reset-password` |
| OTP login (phone → code) | `app/(auth)/otp-verify/page.tsx` | `POST /api/v1/auth/login-otp` + `POST /api/v1/auth/verify-otp` |
| RBAC nav filtering | `components/layout/Sidebar.tsx` | JWT `role` claim |
| Role-based redirect guard | `app/(dashboard)/layout.tsx` | JWT stored in localStorage |
| CORS preflight | All pages | `CORSMiddleware` in `main.py` |

---

## 10. Appendix — Data Models Reference

### User (full shape after `GET /auth/me`)
```typescript
{
  id: string
  email: string
  first_name: string
  last_name: string
  phone_number: string
  role: 'patient' | 'doctor' | 'ngo' | 'government' | 'admin'
  organization: string | null
  location: string | null
  profile_photo: string | null
  is_active: boolean
  email_verified: boolean
  created_at: string       // ISO 8601
  family_id: string | null // patients only
}
```

### Profile (full shape after schema update)
```typescript
{
  id: string
  family_id: string
  name: string
  relation: 'self' | 'spouse' | 'child' | 'parent' | 'sibling'
  dob: string | null
  blood_group: string | null    // e.g. "B+"
  gender: 'male' | 'female' | 'other' | null
  avatar: string | null         // URL or base64
  linked_user_id: string | null
  created_by: string
  created_at: string
}
```

### Session (full shape after schema update)
```typescript
{
  id: string
  user_agent: string          // raw UA string
  ip_address: string
  last_active: string         // ISO 8601
  is_current: boolean         // true if this is the token making the request
  created_at: string
  expires_at: string
}
```

### Invite Preview (new `GET /families/invite/preview` response)
```typescript
{
  family_name: string
  invited_by: string          // full name of inviter
  email: string               // who was invited
  role: string
  expires_at: string
  status: 'pending' | 'accepted' | 'cancelled' | 'expired'
}
```
