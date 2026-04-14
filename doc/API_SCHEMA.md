# GlimmoraCare API Schema

**Backend:** FastAPI at `http://127.0.0.1:8000/api/v1`
**Auth:** Bearer JWT (access token from /auth/login)
**Status legend:** ✅ Done | ⚠️ Incomplete | ❌ Missing

---

## Auth

### POST /auth/register ✅ Done
**Auth:** Not required
**Request:**
```json
{ "email": "string", "password": "string", "first_name": "string", "last_name": "string", "phone_number": "string", "role": "patient|doctor|ngo|government|admin", "organization": "string|null" }
```
**Response:**
```json
{ "accessToken": "string", "refreshToken": "string", "user": { "id": "string", "email": "string", "role": "string" } }
```
**Used by:** `app/(auth)/register/page.tsx`

---

### POST /auth/login ✅ Done
**Auth:** Not required
**Request:**
```json
{ "email": "string", "password": "string" }
```
**Response:**
```json
{ "accessToken": "string", "refreshToken": "string", "user": { "id": "string", "email": "string", "role": "string" } }
```
**Used by:** `app/(auth)/login/page.tsx`

---

### POST /auth/logout ✅ Done
**Auth:** Required
**Request:** No body
**Response:** `{ "message": "string" }`
**Used by:** `components/layout/Sidebar.tsx`, `app/(dashboard)/settings/page.tsx`

---

### POST /auth/logout-all ✅ Done
**Auth:** Required
**Request:** No body
**Response:** `{ "message": "string" }`
**Used by:** `app/(dashboard)/settings/page.tsx` Sessions tab

---

### POST /auth/refresh-token ✅ Done
**Auth:** Not required (uses refresh token in body)
**Request:**
```json
{ "refreshToken": "string" }
```
**Response:** `{ "accessToken": "string" }`
**Used by:** `lib/api.ts` (auto-refresh on 401)

---

### POST /auth/forgot-password ✅ Done
**Auth:** Not required
**Request:** `{ "email": "string" }`
**Response:** `{ "message": "string" }`
**Used by:** `app/(auth)/forgot-password/page.tsx`

---

### POST /auth/reset-password ✅ Done
**Auth:** Not required
**Request:** `{ "token": "string", "new_password": "string" }`
**Response:** `{ "message": "string" }`
**Used by:** `app/(auth)/reset-password/page.tsx`

---

### POST /auth/verify-email ✅ Done
**Auth:** Not required
**Request:** `{ "token": "string" }`
**Response:** `{ "message": "string" }`
**Used by:** `app/(auth)/verify-email/page.tsx` (UI fix pending — page does not yet read `?token=` from URL)

---

### POST /auth/resend-verification ❌ Missing
**Auth:** Required
**Request:** No body
**Response:** `{ "message": "string" }`
**Error:** `400 { "detail": "Email already verified" }` | `429 { "detail": "Please wait before requesting another email" }`
**Used by:** `app/(auth)/verify-email/page.tsx` Resend button (currently wired to nothing)

---

### POST /auth/login-otp ✅ Done
**Auth:** Not required
**Request:** `{ "phone": "string" }`
**Response:** `{ "message": "string" }`
**Used by:** `app/(auth)/otp-verify/page.tsx`

---

### POST /auth/verify-otp ✅ Done
**Auth:** Not required
**Request:** `{ "phone": "string", "code": "string" }`
**Response:**
```json
{ "accessToken": "string", "refreshToken": "string", "user": { "id": "string", "email": "string", "role": "string" } }
```
**Used by:** `app/(auth)/otp-verify/page.tsx`

---

### POST /auth/verify-reset-otp ✅ Done
**Auth:** Not required
**Request:** `{ "phone": "string", "code": "string" }`
**Response:** `{ "message": "string" }`
**Used by:** `app/(auth)/reset-password/page.tsx` (OTP path)

---

### GET /auth/me ❌ Missing
**Auth:** Required
**Response:**
```json
{
  "id": "string",
  "email": "string",
  "first_name": "string",
  "last_name": "string",
  "phone_number": "string",
  "role": "patient|doctor|ngo|government|admin",
  "organization": "string|null",
  "location": "string|null",
  "profile_photo": "string|null",
  "is_active": true,
  "email_verified": false,
  "created_at": "ISO string",
  "family_id": "string|null"
}
```
**Used by:** `context/AuthContext.tsx` (to populate display name after login), `app/(dashboard)/settings/page.tsx` Profile tab

---

### PATCH /auth/me ❌ Missing
**Auth:** Required
**Request:**
```json
{ "first_name": "string?", "last_name": "string?", "email": "string?", "organization": "string|null?", "location": "string|null?", "profile_photo": "string|null?" }
```
**Response:** Updated user object (same shape as GET /auth/me)
**Notes:** Changing email sets `email_verified: false` and triggers new verification email
**Used by:** `app/(dashboard)/settings/page.tsx` Profile tab Save button

---

### PUT /auth/change-password ❌ Missing
**Auth:** Required
**Request:**
```json
{ "current_password": "string", "new_password": "string" }
```
**Response:** `{ "message": "Password updated" }`
**Error:** `400 { "detail": "Current password is incorrect" }` | `422 { "detail": "New password does not meet requirements" }`
**Used by:** `app/(dashboard)/settings/page.tsx` Security tab

---

### GET /auth/sessions ⚠️ Incomplete
**Auth:** Required
**Current response:** `[{ "id": "string", "created_at": "string", "expires_at": "string" }]`
**Required response:**
```json
[{
  "id": "string",
  "user_agent": "string",
  "ip_address": "string",
  "last_active": "ISO string",
  "is_current": true,
  "created_at": "ISO string",
  "expires_at": "ISO string"
}]
```
**Used by:** `app/(dashboard)/settings/page.tsx` Sessions tab (currently uses `data/sessions.ts` mock)

---

### DELETE /auth/session/{sessionId} ✅ Done
**Auth:** Required
**Response:** `{ "message": "string" }`
**Used by:** `app/(dashboard)/settings/page.tsx` Sessions tab Revoke button

---

### GET /auth/2fa/status ❌ Missing
**Auth:** Required
**Response:** `{ "enabled": true, "method": "totp|sms|null" }`
**Used by:** `app/(dashboard)/settings/page.tsx` Security tab 2FA toggle

---

### POST /auth/2fa/totp/setup ❌ Missing
**Auth:** Required
**Request:** No body
**Response:**
```json
{ "secret": "string", "qr_uri": "otpauth://...", "backup_codes": ["string"] }
```
**Used by:** `app/(auth)/2fa-setup/page.tsx` Step 2 (authenticator app path)

---

### POST /auth/2fa/totp/verify ❌ Missing
**Auth:** Required
**Request:** `{ "code": "string" }`
**Response:** `{ "message": "2FA enabled" }`
**Error:** `400 { "detail": "Invalid or expired code" }`
**Used by:** `app/(auth)/2fa-setup/page.tsx` Step 4

---

### POST /auth/2fa/sms/setup ❌ Missing
**Auth:** Required
**Request:** `{ "phone": "string" }`
**Response:** `{ "message": "OTP sent to <phone>" }`
**Used by:** `app/(auth)/2fa-setup/page.tsx` Step 2 (SMS path)

---

### POST /auth/2fa/sms/verify ✅ Done
**Auth:** Required
**Request:** `{ "code": "string" }`
**Response:** `{ "message": "string" }`
**Used by:** `app/(auth)/2fa-setup/page.tsx`

---

### POST /auth/2fa/email/setup ✅ Done
**Auth:** Required
**Request:** No body
**Response:** `{ "message": "string" }`

---

### POST /auth/2fa/email/verify ✅ Done
**Auth:** Required
**Request:** `{ "code": "string" }`
**Response:** `{ "message": "string" }`

---

### DELETE /auth/2fa ❌ Missing
**Auth:** Required
**Request:** No body
**Response:** `{ "message": "2FA disabled" }`
**Used by:** `app/(dashboard)/settings/page.tsx` 2FA toggle (disable)

---

## Profiles

### GET /profiles ✅ Done
**Auth:** Required
**Response:** Array of Profile objects
**Used by:** `context/ProfileContext.tsx` (currently uses mock — will be wired once `blood_group`/`gender`/`avatar` fields added)

---

### GET /profiles/{profileId} ✅ Done
**Auth:** Required
**Response:** Single Profile object
**Used by:** `context/ProfileContext.tsx`

---

### GET /profiles/active ✅ Done
**Auth:** Required
**Response:** `{ "activeProfile": Profile }`
**Used by:** `context/ProfileContext.tsx`

---

### POST /profiles ⚠️ Incomplete
**Auth:** Required
**Request:**
```json
{ "name": "string", "relation": "string", "dob": "string|null", "blood_group": "string|null", "gender": "male|female|other|null", "avatar": "string|null" }
```
**Notes:** `blood_group`, `gender`, `avatar` fields currently missing from backend schema
**Response:** Profile object
**Used by:** `app/(dashboard)/profiles/page.tsx` Create form

---

### PUT /profiles/{profileId} ⚠️ Incomplete
**Auth:** Required
**Request:** Same fields as POST (all optional for partial update)
**Notes:** `blood_group`, `gender`, `avatar` fields missing from backend schema
**Response:** Updated Profile object
**Used by:** `app/(dashboard)/profiles/page.tsx` Edit form

---

### DELETE /profiles/{profileId} ✅ Done
**Auth:** Required
**Response:** `{ "message": "string" }`
**Used by:** `app/(dashboard)/profiles/page.tsx` Delete button

---

### POST /profiles/switch ✅ Done
**Auth:** Required
**Request:** `{ "profileId": "string" }`
**Response:** `{ "accessToken": "string", "activeProfile": Profile }`
**Used by:** `app/(dashboard)/profiles/page.tsx` Profile card click

---

## Families

### POST /families ✅ Done
**Auth:** Required
**Request:** `{ "name": "string" }`
**Response:** `{ "familyId": "string" }`
**Used by:** `app/(dashboard)/family/page.tsx`

---

### GET /families/{familyId} ✅ Done
**Auth:** Required
**Response:** Family object `{ id, name, owner_id, created_at }`
**Used by:** `app/(dashboard)/family/page.tsx`

---

### DELETE /families/{familyId} ✅ Done
**Auth:** Required
**Response:** `{ "message": "string" }`
**Used by:** `app/(dashboard)/family/page.tsx`

---

### GET /families/{familyId}/members ✅ Done
**Auth:** Required
**Response:** Array of Member objects
**Used by:** `app/(dashboard)/family/members/page.tsx`

---

### DELETE /families/members/{memberId} ✅ Done
**Auth:** Required
**Response:** `{ "message": "string" }`
**Used by:** `app/(dashboard)/family/members/page.tsx`

---

### PUT /families/members/{memberId}/role ✅ Done
**Auth:** Required
**Request:** `{ "role": "string" }`
**Response:** `{ "member": Member }`
**Used by:** `app/(dashboard)/family/members/page.tsx`

---

### POST /families/leave ✅ Done
**Auth:** Required
**Request:** No body
**Response:** `{ "message": "string" }`
**Used by:** `app/(dashboard)/family/page.tsx`

---

### POST /families/invite ✅ Done
**Auth:** Required
**Request:** `{ "email": "string", "role": "string", "relation": "string" }`
**Response:** `{ "inviteId": "string" }`
**Used by:** `app/(dashboard)/family/page.tsx`

---

### GET /families/invites ✅ Done
**Auth:** Required
**Response:** Array of Invite objects (sent invites)
**Used by:** `app/(dashboard)/family/page.tsx`

---

### GET /families/incoming-invites ✅ Done
**Auth:** Required
**Response:** Array of IncomingInvite objects
**Used by:** `app/(dashboard)/family/page.tsx`

---

### POST /families/invite/respond ✅ Done
**Auth:** Required
**Request:** `{ "inviteId": "string", "action": "accept|decline" }`
**Response:** `{ "message": "string" }`
**Used by:** `app/(dashboard)/family/page.tsx`

---

### POST /families/invite/resend ✅ Done
**Auth:** Required
**Request:** `{ "inviteId": "string" }`
**Response:** `{ "message": "string" }`
**Used by:** `app/(dashboard)/family/page.tsx`

---

### POST /families/invite/cancel ✅ Done
**Auth:** Required
**Request:** `{ "inviteId": "string" }`
**Response:** `{ "message": "string" }`
**Used by:** `app/(dashboard)/family/page.tsx`

---

### GET /families/invite/preview ✅ Done
**Auth:** Not required
**Query params:** `token` (opaque invite token from email link)
**Response:**
```json
{
  "family_name": "string",
  "invited_by": "string",
  "email": "string",
  "role": "string",
  "expires_at": "ISO string",
  "status": "pending|accepted|cancelled|expired"
}
```
**Error:** `404 { "detail": "Invite not found" }` | `410 { "detail": "Invite has expired or been cancelled" }`
**Used by:** `app/(auth)/invite/[token]/page.tsx` (currently uses `MOCK_INVITE` — wiring pending)

---

### POST /families/invite/accept ✅ Done
**Auth:** Not required
**Request:** `{ "token": "string" }`
**Response:** `{ "userId": "string" }`
**Used by:** `app/(auth)/invite/[token]/page.tsx` Accept button

---

### POST /families/invite/decline ✅ Done
**Auth:** Not required
**Request:** `{ "token": "string" }`
**Response:** `{ "message": "string" }`
**Used by:** `app/(auth)/invite/[token]/page.tsx` Decline button (currently wired to local state only)

---

## Organizations

### POST /organizations ✅ Done
**Auth:** Required (admin only)
**Request:** `{ "name": "string", ... }`
**Response:** Organization object
**Used by:** Admin org setup flow

---

### GET /organizations/mine ✅ Done
**Auth:** Required (admin)
**Response:** Organization object `{ id, name, ... }`
**Used by:** `app/(dashboard)/settings/page.tsx` org section

---

### PUT /organizations/mine ✅ Done
**Auth:** Required (admin)
**Request:** Partial org update fields
**Response:** Updated Organization object
**Used by:** Admin settings

---

### POST /organizations/mine/invite-doctor ✅ Done
**Auth:** Required (admin)
**Request:** `{ "email": "string", ... }`
**Response:** DoctorInvite object
**Used by:** Admin doctor management

---

### GET /organizations/mine/doctor-invites ✅ Done
**Auth:** Required (admin)
**Response:** Array of DoctorInvite objects
**Used by:** Admin doctor management

---

### GET /organizations/mine/doctors ✅ Done
**Auth:** Required (admin)
**Response:** Array of Doctor objects
**Used by:** Admin doctor management

---

### POST /organizations/mine/assign-patient ✅ Done
**Auth:** Required (admin)
**Request:** `{ "patientId": "string", "doctorId": "string" }`
**Response:** Assignment object
**Used by:** Admin patient assignment

---

### GET /organizations/mine/patients ✅ Done
**Auth:** Required (admin)
**Response:** Array of Patient objects
**Used by:** Admin patient management

---

### POST /doctor/join-org ✅ Done
**Auth:** Required (doctor)
**Request:** `{ "token": "string" }`
**Response:** DoctorOrg object
**Used by:** Doctor onboarding

---

### GET /doctor/org ✅ Done
**Auth:** Required (doctor)
**Response:** DoctorOrg object or null
**Used by:** Doctor dashboard

---

### GET /doctor/patients ✅ Done
**Auth:** Required (doctor)
**Response:** Array of Patient objects (assigned to this doctor)
**Used by:** `app/(dashboard)/vault/page.tsx` (doctor filter — currently uses mock)

---

### GET /patient/doctor ✅ Done
**Auth:** Required (patient)
**Response:** AssignedDoctor object
**Used by:** Patient dashboard (currently uses mock)

---

## Intake

### POST /intake/upload ✅ Done
**Auth:** Required
**Request:** `multipart/form-data` — `file` (PDF/JPG/PNG/WEBP, max 20MB) + `patient_id` (form field)
**Response:**
```json
{
  "recordId": "string",
  "status": "draft",
  "markers": [
    {
      "name": "HbA1c",
      "value": 6.4,
      "unit": "%",
      "normalMin": 4.0,
      "normalMax": 5.6,
      "isAbnormal": true,
      "extractionConfidence": 0.95
    }
  ],
  "ocrConfidence": 0.92,
  "processingTime": 2.3
}
```
**Used by:** `app/(dashboard)/intake/page.tsx`

---

### POST /intake/confirm ✅ Done
**Auth:** Required
**Request:**
```json
{ "recordId": "string", "markers": [...], "title": "string", "notes": "string|null" }
```
**Response:** `{ "recordId": "string", "status": "confirmed", "message": "string" }`
**Used by:** `app/(dashboard)/intake/page.tsx`

---

### POST /intake/manual ✅ Done
**Auth:** Required
**Request:**
```json
{ "patientId": "string", "title": "string", "date": "YYYY-MM-DD", "source": "string", "markers": [...], "notes": "string|null" }
```
**Response:** `{ "recordId": "string", "status": "confirmed", "message": "string" }`
**Used by:** `components/intake/ManualEntryForm.tsx`

---

### GET /intake/records ✅ Done
**Auth:** Required
**Query params:** `patient_id` (optional; doctor/admin only)
**Response:** Array of HealthRecord objects
**Used by:** `app/(dashboard)/intake/page.tsx` (future vault integration)

---

### GET /intake/records/{id} ✅ Done
**Auth:** Required
**Response:** Single HealthRecord object with decrypted markers
**Used by:** `app/(dashboard)/vault/[id]/page.tsx` (future)

---

## Bulk Import

### POST /bulk-import/preview ✅ Done
**Auth:** Required
**Request:** `multipart/form-data` — `file` (CSV or XLSX)
**CSV columns required:** `patient_id, title, date, source, marker_name, value, unit` + optional `normal_min, normal_max`
**Response:**
```json
{
  "rows": [...],
  "totalRows": 10,
  "validRows": 9,
  "invalidRows": 1,
  "errors": []
}
```
**Used by:** `components/intake/BulkImportPanel.tsx`

---

### POST /bulk-import/confirm ✅ Done
**Auth:** Required
**Request:** `{ "rows": [ManualEntryRequest, ...] }`
**Response:** `{ "importedCount": 9, "failedCount": 1, "message": "string" }`
**Used by:** `components/intake/BulkImportPanel.tsx`

---

## Chat

### POST /chat ⚠️ Incomplete
**Auth:** Required
**Request:**
```json
{ "persona": "dr_priya|wellness_coach|mental_health|nutrition", "message": "string", "history": [{ "role": "user|assistant", "content": "string" }] }
```
**Response:**
```json
{ "reply": "string", "confidence": 0.87, "disclaimer": "string" }
```
**Notes:** Endpoint exists but frontend AI Assistants page uses pre-scripted mock responses from `data/chat-responses.ts`; real LLM integration not yet wired
**Used by:** `app/(dashboard)/assistants/page.tsx` (currently mock)

---

## Health Records (Vault) ❌ Missing

### GET /health-records ❌ Missing
Vault list page (`app/(dashboard)/vault/page.tsx`) currently uses mock data from `data/health-records.ts`.

---

### GET /health-records/{id} ❌ Missing
Vault detail page (`app/(dashboard)/vault/[id]/page.tsx`) uses mock data.

---

### DELETE /health-records/{id} ❌ Missing
Right to erasure (DPDP Act compliance). No frontend UI yet.
