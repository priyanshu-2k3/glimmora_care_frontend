# GlimmoraCare — Frontend Pages, Roles & Features

Authoritative map of every frontend route in `glimmora_care/app/`, the roles that may access it, and a detailed description of what each page actually does.

**Roles**
- `patient` — end user managing their own / family's health data
- `doctor` — clinician with consent-bound access to patient records
- `admin` — operates a single organization (clinic / hospital tenant)
- `super_admin` — system-wide governance, all orgs and users
- *(Legacy demo-only)* `ngo_worker`, `gov_analyst` — surface for population/offline screens; not used by real auth

**Conventions**
- Auth guard lives in `app/(dashboard)/layout.tsx`; unauthenticated visits to any `(dashboard)` route redirect to `/login`.
- Sidebar visibility is computed from `NAV_ITEMS` in `lib/constants.ts`; routes a role cannot see still resolve via direct URL but should be treated as out-of-scope unless explicitly listed below.
- AI surfaces always render `DisclaimerBanner` + confidence % + source markers + reasoning trace.

> **Update rule:** Read this file before editing any page. Update it in the same change whenever a page is added, removed, renamed, or its features/role-access change.

---

## 1. Public & Authentication — `app/(auth)/`

These pages are reachable without a session. Successful auth lands the user on `/dashboard`.

### 1.1 Landing — `/` *(public)*
Tiny entry page (`app/page.tsx`). Routes the user to `/login` if no session, `/dashboard` if a session exists.

### 1.2 Login — `/login` *(public)*
- Email + password form posting to backend `POST /auth/login` via `lib/api.ts`.
- Stores access + refresh JWT in `localStorage`; sets user in `AuthContext`.
- Demo role-selector buttons (patient / doctor / admin / super_admin) using `demoLogin()` against `data/users.ts` for offline preview.
- Links to `/register`, `/forgot-password`.
- Surfaces backend error messages (invalid credentials, locked account, unverified email).

### 1.3 Register — `/register` *(public)*
- Multi-field signup: name, email, phone, password + confirm, role select.
- Client-side validation (password strength, matching confirm, required fields).
- POST `/auth/register`; on success triggers email verification flow and redirects to `/verify-email`.

### 1.4 Verify Email — `/verify-email` *(public, token in URL)*
- Reads verification token from query string.
- Auto-submits to `POST /auth/verify-email`; shows success/failure state.
- "Resend verification email" action with throttled retry.

### 1.5 Forgot Password — `/forgot-password` *(public)*
- Single email field → `POST /auth/forgot-password`.
- Always shows a generic confirmation (does not leak account existence).
- Cooldown timer prevents spamming the endpoint.

### 1.6 Reset Password — `/reset-password` *(public, token in URL)*
- New password + confirm fields, strength meter.
- `POST /auth/reset-password` with token; on success redirects to `/login` with banner.

### 1.7 OTP Verify — `/otp-verify` *(public)*
- 6-digit OTP input (auto-advance per field) for login MFA / sensitive actions.
- Resend OTP with cooldown; switch channel (email ↔ SMS) where supported.
- Verifies via `POST /auth/otp/verify`; on success continues original flow (login / 2FA enroll).

### 1.8 2FA Setup — `/2fa-setup` *(authenticated)*
- Enroll TOTP authenticator: shows QR code + secret, asks for verification code to confirm enrollment.
- Generates and lets the user download recovery / backup codes.
- Toggle SMS/email backup factor; disable 2FA path (with re-auth challenge).

### 1.9 Join Org — `/join-org` *(public, invited)*
- Lets an invited user attach to an existing organization by org code or pending invite.
- Maps user role within that organization (doctor / admin / staff).

### 1.10 Invite Token — `/invite/[token]` *(public, invited)*
- Token-driven invitation acceptance: prefilled email, role, org name from server.
- Asks the user to set a password (if new) or sign in (if existing) before activating membership.
- On accept → routes to `/dashboard`.

### 1.11 Emergency Token Access — `/emergency/[token]` *(public, signed token)*
- Time-limited, non-authenticated emergency view of a patient's critical record bundle.
- Shows: patient name, blood group, allergies, active conditions, recent vitals, emergency contacts.
- Logs each open as an audit event so the patient sees who accessed and when.

---

## 2. Dashboard Home & Cross-Cutting — `app/(dashboard)/`

### 2.1 Dashboard — `/dashboard` *(patient, doctor, admin, super_admin)*
Role-aware home with KPI tiles, "next action" prompts, recent activity.
- **Patient view:** vault completeness %, recent uploads, AI insights summary, upcoming reminders, family snapshot.
- **Doctor view:** assigned-patient count, pending consent requests, flagged risk insights, recent record activity.
- **Admin view:** org KPIs (active doctors / patients), pending invites, audit-log highlights, system health tiles.
- **Super admin view:** global counts (orgs, users, agents), platform alerts, recent provisioning events.

### 2.2 Notifications — `/notifications` *(all roles)*
- Unified notification feed (system, consent, clinical, billing).
- Filter by category and read/unread; mark single / mark all read.
- Click-through deep-links to the originating record (consent request, log entry, etc.).

### 2.3 Audit Logs (user-scoped) — `/logs` *(all roles)*
- Personal audit trail: who accessed your records, when, from where, with what consent grant.
- Filters: action type, date range, actor, IP.
- Export CSV; anomaly highlights (off-hours, foreign IP).

### 2.4 Settings — `/settings` *(all roles)*
- **Profile:** name, photo, contact, language, timezone.
- **Notifications:** channel toggles (email / SMS / push) per category.
- **Security:** password change, 2FA management, active sessions list with revoke.
- **Display:** theme/density, units (metric/imperial), date format.
- **Account:** export data (GDPR-style), deactivate / delete account.

---

## 3. Patient — Health Data & Vault

### 3.1 Health Vault — `/vault` *(patient, doctor)*
- Master list of all health records for the current patient (or, for doctors, the selected assigned patient).
- Card / table view; each row shows date, type (lab, imaging, prescription, vitals), source, marker count, OCR status.
- Filters by type, date, lab, marker; quick search; sort by date or risk.
- Bulk actions: download, share via consent grant, archive.

### 3.2 Vault Search — `/vault/search` *(patient, doctor)*
- Dedicated full-text + structured search across records.
- Query by marker name (e.g., HbA1c), value range, abnormality flag, date window, document type.
- Returns ranked hits with marker preview and "open record" deep-link.

### 3.3 Vault Timeline — `/vault/timeline` *(patient, doctor)*
- Chronological vertical timeline of all records.
- Visual icons per type; clicking expands to show extracted markers inline.
- Year / quarter quick-jump rail.

### 3.4 Vault Insights — `/vault/insights` *(patient, doctor)*
- AI-generated narrative across the full vault: trend summaries, abnormal cluster detection, suggested follow-ups.
- Each insight carries confidence %, the markers it cited, and an "explain" trace.
- Disclaimer banner; non-diagnostic language.

### 3.5 Vault Upload — `/vault/upload` *(patient, doctor)*
- Drag-drop or file-picker upload of PDFs / images of lab reports.
- Choose record type and date; optionally tag patient (doctor uploading on behalf).
- Submits to backend OCR → marker-extraction pipeline; redirects to the new record's detail page on completion.

### 3.6 Vault Record Detail — `/vault/[id]` *(patient, doctor)*
- Single record's full surface: original document preview, extracted OCR text, structured marker table with reference ranges and flags.
- Marker-level trend charts (this marker over time) using recharts.
- Consent log: who currently has access to this record, when granted/revoked.
- Audit trail: every read/write touch.
- Actions: download original, share (creates consent grant), edit metadata, request re-OCR.

### 3.7 Data Intake — `/intake` *(patient)*
End-to-end "smart upload" experience.
1. Upload report (drag-drop or camera).
2. Animated OCR progress (framer-motion).
3. Extracted markers preview with confidence % per field.
4. Patient confirms / corrects values before commit.
5. Adds the record to vault and triggers AI insights refresh.

### 3.8 Health Twin — `/twin` *(patient)*
- Multi-marker overlay timeline (24-month synthetic + real markers) for the patient.
- KPI tiles: marker count, data completeness %, snapshot count.
- Trajectory projection: forward-looking risk curves with scenario toggles ("if you reduce X by 10%").
- Disclaimer + confidence on every projection.

---

## 4. Patient — Family, Doctors & Profiles

### 4.1 Family Hub — `/family` *(patient)*
- Overview of the patient's family unit: family name, member count, role distribution, recent activity.
- Quick links to invite, manage members, configure roles.

### 4.2 Family — Members — `/family/members` *(patient)*
- List of linked family members with avatar, relation, role, status (pending / active).
- Per-member actions: open profile, change role, remove, resend invite.

### 4.3 Family — Invite — `/family/invite` *(patient)*
- Invite by email or phone; choose relation and proposed role (caregiver / dependent / viewer).
- Sends signed invite token; shows pending invites with revoke option.

### 4.4 Family — Roles & Permissions — `/family/roles` *(patient)*
- Define what each family role can do: view records, upload, manage consents, receive emergency alerts.
- Toggle matrix saved per family.

### 4.5 Profiles — `/profiles` *(patient)*
- Manage dependent health profiles (children, elderly parents) under the primary account.
- Add / edit profile (DOB, blood group, allergies, conditions); switch active profile context for vault and intake.

### 4.6 My Doctor — `/my-doctor` *(patient)*
- Assigned primary doctor card: name, specialty, org, contact.
- Actions: message, request consult, view shared records, revoke assignment.
- Empty state with link to `/assign-doctor` if none.

### 4.7 Assign Doctor — `/assign-doctor` *(patient)*
- Search the directory of doctors by name, specialty, org, location.
- Send assignment request; shows pending and historical assignments.

---

## 5. Patient — Consent, Access & Emergency

### 5.1 Consent Manager — `/consent` *(patient, doctor)*
The control plane for all data sharing.
- Three tabs / sections aggregated into one page: incoming requests, currently active grants, history.
- Per-grant detail: requester, scope (records / markers), purpose, duration, status.
- Patient actions: approve, deny, revoke, edit scope, extend duration.
- Doctor view: lists consents granted *to* the doctor and lets the doctor request new access.

### 5.2 Consent — Active — `/consent/active` *(patient, doctor)*
- Focused list of grants currently in force.
- Inline revoke; expiry countdowns; quick filter by requester / record.

### 5.3 Consent — Requests — `/consent/requests` *(patient, doctor)*
- Pending requests inbox with approve / deny actions, optional scope edits before approval.
- Shows requester credentials, purpose-of-use, requested duration.

### 5.4 Consent — History — `/consent/history` *(patient, doctor)*
- Append-only ledger of all consent events (granted, revoked, expired, denied).
- CSV export; filter by date / actor / outcome.

### 5.5 Emergency Access — `/emergency` *(patient)*
- Generate signed emergency-access tokens for first responders / hospitals.
- Configure scope (which records & markers are exposed) and TTL.
- View active tokens, copy link / QR, and revoke immediately.
- See access log of who opened the emergency view.

### 5.6 Access Control — `/access` *(patient)*
- Per-record and per-marker visibility rules independent of consent grants ("never share marker X").
- Default-share toggles for newly added records.
- Block/allow specific orgs or doctors.

### 5.7 Offline Mode — `/offline` *(patient — legacy: ngo_worker)*
- Offline sync queue for field/low-connectivity usage.
- Pending uploads, conflict list (server vs local), resolve-with-mine / resolve-with-server actions.
- Sync status indicator and last-sync timestamp.

---

## 6. Doctor-Specific

### 6.1 Intelligence — `/intelligence` *(doctor)*
- Cross-patient analytics for the doctor's panel.
- Risk insights (top patients by composite risk), marker correlations, AGI-style trend cards.
- Filter by cohort (age, condition, assigned clinic); drill down into a specific patient's vault.
- Every insight surfaces confidence, contributing markers, and reasoning trace.

### 6.2 Vault (doctor view) — `/vault` *(doctor)*
Same component as §3.1 but scoped by consent: only patients who have an active consent grant to this doctor are shown. Patient-picker dropdown switches context.

### 6.3 Consent (doctor view) — `/consent` *(doctor)*
Same component as §5.1 but oriented toward consents *received*: see what's granted, request new scope from a patient.

### 6.4 AI Assistant — `/assistants` *(patient, doctor)*
- Chat interface with persona switcher (4 personas: e.g., general health, nutrition, clinical brief, family).
- Pre-scripted keyword responses via `hooks/useMockChat.ts` plus real backend `/api/v1/chat` for live mode.
- Each response shows confidence %, sources cited, and a non-medical-advice disclaimer.
- Conversation history per persona.

---

## 7. Admin — Organization Operations

### 7.1 Admin Panel — `/admin` *(admin, super_admin)*
- Operational home: org KPI tiles (active doctors, active patients, monthly uploads, pending invites).
- Quick links into team, doctor management, logs, settings.
- Recent system events surfaced inline.

### 7.2 Manage Team — `/admin/manage-team` *(admin, super_admin)* — alias `/manage-team`
- Full CRUD over org staff (non-doctor): admins, support, viewers.
- Invite by email, set role, resend invite, revoke pending, remove active member.
- Status column (active / pending / disabled), last-login timestamp.

### 7.3 Doctor Management Hub — `/admin/doctor-management` *(admin, super_admin)*
- Roster of doctors in the org with credentials, specialty, patient-panel size, status.
- Invite doctor, suspend, reinstate, view audit trail.
- Sub-flows linked from this page:

#### 7.3.1 Assign — `/admin/doctor-management/assign`
Pick a patient and a doctor → create the assignment and seed an initial consent request.

#### 7.3.2 Reassign — `/admin/doctor-management/reassign`
Move a patient (or batch) from one doctor to another, preserving history.

#### 7.3.3 Share — `/admin/doctor-management/share`
Grant a second doctor co-access to a patient's panel (multi-doctor care).

#### 7.3.4 Consent (admin override) — `/admin/doctor-management/consent`
Audit and, where policy permits, override consent grants between org doctors and patients.

### 7.4 Admin Logs — `/admin/logs` *(admin, super_admin)*
- Org-wide audit log: logins, record access, consent changes, role changes, exports.
- Filters: user, action, date, IP; CSV export; alert highlights for suspicious patterns.

### 7.5 Admin Settings Hub — `/admin/settings` *(admin)*
Tabbed settings, each as its own route:
- **Profile** `/admin/settings/profile` — org profile (name, address, branding) + admin user profile.
- **Security** `/admin/settings/security` — password policy, 2FA enforcement, IP allow-list, SSO.
- **Notification Settings** `/admin/settings/notification-settings` — org notification routing rules and templates.
- **Sessions** `/admin/settings/sessions` — active admin sessions across the org with revoke.

### 7.6 Organization — `/organization` *(admin, doctor, super_admin)*
- If no org exists → create-organization wizard (name, type, address, branding).
- If org exists → org dashboard: identity, KPIs, doctors / patients shortcuts, settings deep-link.

### 7.7 Organization — Doctors — `/organization/doctors` *(admin, super_admin)*
- Org-scoped doctors directory (read-friendly view distinct from §7.3 management table).
- Search, filter by specialty, view profile, message.

### 7.8 Organization — Patients — `/organization/patients` *(admin, super_admin)*
- Org-scoped patients directory: search, filter by status / assigned doctor, open patient context.
- Bulk actions: assign doctor, send announcement, export.

---

## 8. Super Admin — System Governance

### 8.1 Manage Users — `/manage-users` *(super_admin)*
- Global user CRUD across all orgs and roles.
- Create / edit / disable / delete users, force password reset, change role, attach to org.
- Filters by role, org, status; CSV export.

### 8.2 Agents — `/agents` *(super_admin; admin gated)*
- Five autonomous AI agents (vault watcher, risk scorer, consent guardian, ingestion bot, comms bot) with status, last-run, success rate.
- Live activity feed (streaming events).
- Per-agent actions: pause, resume, run-now, view logs, edit config.

### 8.3 Population — `/population` *(super_admin — legacy: ngo_worker, gov_analyst)*
- Aggregated, de-identified population health analytics.
- Heatmaps by district / village, maternal & pediatric cohorts, seasonal trends.
- Configurable screening-interval recommendations per cohort/region.
- **No PII** — only aggregate counts and percentages.

---

## 9. Cross-Cutting Behavior (must hold on every page)

1. **Auth guard:** `(dashboard)/layout.tsx` redirects to `/login` if no session; refreshes tokens via `lib/api.ts` interceptor.
2. **Role gating:** `NAV_ITEMS` filters the sidebar; pages that the role isn't entitled to should redirect to `/dashboard` rather than render.
3. **AI compliance:** every AI-rendered output must include confidence %, source markers, reasoning trace, and the `AI_DISCLAIMER` banner.
4. **Audit trail visibility:** vault record pages (§3.6) always render the trail; logs pages (§2.3, §7.4) expose org / user scope.
5. **Population privacy:** no individual identifiers may appear on `/population`.
6. **Offline indicator:** sidebar shows sync status whenever the offline route or queue is in use.
7. **Dev tooling:** `RoleSwitcher` floating button (bottom-right) appears across all dashboard pages for fast role switching during development.
