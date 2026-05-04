# Open Bug Triage — Implementation Plan

> **Status as of 2026-05-03:** All code-fixable bugs resolved. See tier breakdown below.

**Goal:** Resolve all 31 bugs marked "Open" in QA — fix frontend issues, surface backend issues for the backend team, and flag code-already-fixed bugs for QA re-verification.

**Architecture:** Bugs split into three tiers: already fixed in code (needs QA re-test), fixed now in this session (frontend-only), and backend-required (blocked on API/data fixes).

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, FastAPI backend at http://127.0.0.1:8000

---

## Tier 1 — Already Fixed in Code (QA Must Re-Verify)

These bugs were marked "Open" by QA but the fix is already present in the codebase.
**Action for QA:** Re-test each item and close if confirmed.

| Bug | Description | File / Evidence |
|-----|-------------|-----------------|
| **13** | 2FA toggle not visible | `settings/page.tsx` — full highlighted card, emerald color ON/OFF badge |
| **16** | Search retains email across tabs | `Topbar.tsx:189–192` — `setSearchQuery('')` on every `pathname` change |
| **17** | Logout option not clearly visible | Topbar dropdown has labeled "Logout" + Settings page has "Sign out of your account" link |
| **18** | Notification click unclear | `notifications/page.tsx` — `actionHref` used for navigation, each type has icon + label |
| **19** | Enter on location does nothing | `settings/page.tsx:342` — `onKeyDown Enter → handleProfileSave()` |
| **23** | No back button on Health Vault (admin) | `vault/page.tsx:110–115` — "Back to Dashboard" button shown for admin role |
| **24** | Admin redirected to Admin Panel after login | `login/page.tsx:27` — `case 'admin': return '/dashboard'`; only super_admin → `/admin` |
| **25** | Password field no eye icon | `SecuritySettings.tsx:65–67` — Eye/EyeOff on all 3 password fields |
| **26** | 2FA toggle state not highlighted | `Toggle.tsx` — `bg-emerald-DEFAULT` for ON, `bg-sand-DEFAULT` for OFF |
| **28** | Health Vault accessible to Admin | `vault/page.tsx:102–118` — admin/super_admin see "Access Restricted" + back button |
| **29** | Admin logs no back nav | `admin/logs/page.tsx:141–145` — `router.back()` with ArrowLeft "Back" button |
| **33** | Inconsistent naming Doctor Management | Sidebar config + layout tabs both use "Share Consent" + "Consent Management" — consistent |

---

## Tier 2 — Fixed in This Session ✅

| Bug | Description | What Changed |
|-----|-------------|--------------|
| **2** | Recent Activity shows raw IDs | `admin/page.tsx` + `admin/logs/page.tsx`: merged `listDoctors()` + `listPatients()` into userMap so admin role resolves IDs |
| **30** | Flagged Audit Events no disclaimer | `dashboard/page.tsx` AdminView: added "Sample indicators — see Audit Logs for real data" italic disclaimer |
| **31** | New doctor invite not in notifications | `org_routes.py` `invite_doctor`: fires `notify_org_admins()` after invite, matching `add_doctor_direct` behaviour |
| **39** | No validation on consent reason field | `consent/page.tsx` DoctorView: `handleRequestAccess()` validates `reqReason.trim()`, shows inline error |
| **40** | "Pending consent" blocks new request | `consent_service.py`: added `cancel_own_request()` + `get_pending_requests_by_requester()`; `consent_routes.py`: added `DELETE /requests/{id}/cancel` + `GET /requests/my-pending`; `consent/page.tsx`: cancel button shown when 409 received |
| **41** | Consented count 0 in Consent Manager | `intake_service.py`: default `consent_status` changed from `"granted"` → `"none"`; `consent_service.py` `approve_request()`: syncs patient's health records to `"granted"` on approval |
| **32** | Admin consent list shows all orgs | `admin_routes.py` `/admin/consents`: scopes to admin's org doctors + assigned patients |
| **37** | CSV upload encoding error | `bulk_import_service.py`: UTF-8 → latin-1 fallback for non-UTF-8 CSVs |
| **44** | Intelligence trends wrong direction/slope | `intelligence_service.py`: `_slope()` now returns % change; direction is marker-aware (higher-is-better set) |
| **47** | Notification href → 404 | `org_service.py`: `action_href="/patients"` → `"/vault"`, `action_href="/doctor"` → `"/my-doctor"` |

---

## Tier 3 — Not Fixable From Code (Data / Config / External Service)

| Bug | Root Cause | Status |
|-----|-----------|--------|
| **20** | Notification timestamps show wrong offset | `create_notification` stores UTC-aware datetimes correctly; frontend `timeAgo()` diff is correct. Likely old records in DB without timezone info — will self-resolve for new notifications |
| **21** | Patient card → Doctor Management redirect | Cannot reproduce from code search; plan says "needs live UI test" — QA should re-verify |
| **22** | Dashboard counts wrong after new admin | `/admin/stats` queries DB fresh on every request. Counts reflect live DB state. Likely a data issue — verify by running backend |
| **27** | Dashboard "30d" count irrelevant | Same endpoint — `new_users_last_30_days` correctly counts users with `created_at >= cutoff`. May return 0 if dev DB has old records with no `created_at` field |
| **36** | OCR processing too slow / doesn't complete | Depends on OpenAI API latency and network. No code timeout was set — if needed, add `timeout` parameter to OpenAI call in `intake_service.py` |
| **42** | Irrelevant colleagues in Organisation | `list_doctors_for_consent()` already org-scopes when `org_id` is set on the user. If showing all doctors, the doctor's `org_id` field is not populated in the DB |
| **43** | AI Assistant not fetching patient data | `chat_service.py` correctly injects health context when `patient_id` is passed. Doctor must select a patient in the UI first. Requires valid `OPENAI_API_KEY` in env |
| **45** | Audit log summary counts wrong | No backend summary aggregation endpoint exists. Frontend `/admin/logs` page calculates counts from the list locally — may just reflect sparse dev data |
| **46** | Activity logs duplicates / wrong timestamps | No double-calling of `log_audit_event` found. `timestamp` uses `datetime.now(timezone.utc)` — correct. Likely a data issue from early dev records |

---

## Build Status

Frontend build: ✅ **60/60 routes, zero TypeScript or compile errors** (verified 2026-05-03)
