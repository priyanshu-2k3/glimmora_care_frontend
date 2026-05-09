# GlimmoraCare — Razorpay Subscription Integration
## Full Plan: How It Works, Step by Step

---

## Why This Exists

Right now the Razorpay modal opens with just a price — no order ID, no verification, no record in the database. Anyone could close the modal and we would not know. This plan builds a real subscription billing system: two ways to pay, a proper verification flow, and subscription status tracked per organisation.

---

## Subscription Plans

Plan amounts are managed dynamically by the super admin via the **Plan Management module** (`/admin/plans`). Prices can be changed, plans added or removed, discounts set, and plans toggled active/inactive — all without a code deploy. Patient plans are managed separately under `plan_type = "patient"`.

The table below shows the default seed values loaded on first run.

### Organisation Plans (default)

| Plan | Duration  | Default Price | Per Month | Saving   |
|------|-----------|---------------|-----------|----------|
| 1m   | 1 Month   | ₹1,999        | ₹1,999    | —        |
| 3m   | 3 Months  | ₹4,999        | ₹1,666    | Save 17% |
| 6m   | 6 Months  | ₹8,999        | ₹1,500    | Save 25% |
| 1y   | 1 Year    | ₹14,999       | ₹1,250    | Save 37% |
| 5y   | 5 Years   | ₹59,999       | ₹1,000    | Save 50% |

### Patient Plans (default)

| Plan | Duration  | Default Price | Per Month | Saving   |
|------|-----------|---------------|-----------|----------|
| 1m   | 1 Month   | ₹999          | ₹999      | —        |
| 3m   | 3 Months  | ₹2,499        | ₹833      | Save 17% |
| 6m   | 6 Months  | ₹4,499        | ₹750      | Save 25% |
| 1y   | 1 Year    | ₹7,499        | ₹625      | Save 37% |
| 5y   | 5 Years   | ₹29,999       | ₹500      | Save 50% |

**Where prices live:** MongoDB `plans` collection, served by `GET /plans?plan_type=org` (public) and `GET /admin/plans` (super admin, all plans including inactive).

---

## Plan Management Module (Super Admin)

### What the super admin can do
- View all plans grouped by type (Organisation / Patient)
- Create a new plan: set name, duration in months, price in ₹, discount %, plan type, and mark as popular
- Edit any existing plan — change price, discount, active status, popular flag — instantly reflected on the org-create page
- Delete a plan (safe: subscriptions store a `plan_snapshot` at time of purchase, so historical records are preserved)

### Pages
- **`/admin/plans`** — Plan Management UI (super admin only)

### API Endpoints (Plans)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/plans` | None | Active plans only. Filter: `?plan_type=org\|patient` |
| GET | `/admin/plans` | super_admin | All plans including inactive. Optional filter. |
| POST | `/admin/plans` | super_admin | Create a new plan |
| PATCH | `/admin/plans/{plan_id}` | super_admin | Update plan fields |
| DELETE | `/admin/plans/{plan_id}` | super_admin | Hard delete plan |

### Plan Document Schema (MongoDB `plans` collection)

```
id               string (ObjectId)
name             string            e.g. "6 Months"
duration_months  int               e.g. 6
price            int               in rupees (₹), not paise
discount_percent float             e.g. 25.0 → "Save 25%"
description      string | null     optional tagline
plan_type        "org" | "patient"
is_popular       bool              shows "Most Popular" badge
is_active        bool              false = hidden from public /plans endpoint
created_at       datetime
updated_at       datetime
```

### Frontend Plan Schema (TypeScript)

```typescript
interface PlanOut {
  id: string
  name: string
  duration_months: number
  price: number                // ₹ rupees
  discount_percent: number
  description: string | null
  plan_type: 'org' | 'patient'
  is_popular: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}
```

### planApi (lib/api.ts)

```typescript
export const planApi = {
  getPublicPlans: (planType?: 'org' | 'patient') =>
    apiFetch<PlanOut[]>(`/plans${planType ? `?plan_type=${planType}` : ''}`),

  adminListPlans: (planType?: 'org' | 'patient') =>
    apiFetch<PlanOut[]>(`/admin/plans${planType ? `?plan_type=${planType}` : ''}`),

  createPlan: (data: PlanCreate) =>
    apiFetch<PlanOut>('/admin/plans', { method: 'POST', body: data }),

  updatePlan: (planId: string, data: Partial<PlanCreate>) =>
    apiFetch<PlanOut>(`/admin/plans/${planId}`, { method: 'PATCH', body: data }),

  deletePlan: (planId: string) =>
    apiFetch<{ message: string }>(`/admin/plans/${planId}`, { method: 'DELETE' }),
}
```

---

## Two Ways to Pay

### Way 1 — Super Admin Pays Directly (In-App Checkout)

This is for when the super admin is onboarding an org themselves.

```
Step 1  →  Super admin fills org name, address, phone, website
Step 2  →  Super admin selects a plan (fetched live from GET /plans?plan_type=org)
Step 3  →  Super admin sees the order summary
           Clicks "Pay ₹X,XXX"
           → Frontend calls backend: POST /payments/create-order
           → Backend creates an order with Razorpay (using Key Secret, server-side)
           → Backend returns order_id
           → Frontend opens Razorpay modal with the order_id
           → User completes payment (card / UPI / netbanking)
           → Razorpay calls handler() in the browser with payment_id + order_id + signature
           → Frontend calls backend: POST /payments/verify
           → Backend checks the signature using HMAC-SHA256 (Key Secret, server-side)
           → If valid: backend creates the org + saves subscription record
           → Backend returns org_id + expires_at
Step 4  →  Success screen shows org name, plan, expiry date, payment ID
```

### Way 2 — Super Admin Sends a Payment Link to the Org Contact

This is for when the org contact (clinic manager, hospital admin) needs to pay themselves without logging into GlimmoraCare.

```
Step 1  →  Super admin fills org name, address, phone, website
Step 2  →  Super admin selects a plan
Step 3  →  Super admin clicks "Send Payment Link" (below the Pay button)
           → A small form appears:
               Contact Name (optional)
               Contact Email
               Contact Phone (optional)
               Link Expiry: 24 hrs / 3 days / 7 days
           → Super admin clicks "Generate Link"
           → Frontend calls backend: POST /payments/create-payment-link
           → Backend calls Razorpay Payment Links API (server-side, Key Secret)
           → Razorpay returns a hosted payment URL (razorpay.me/... link)
           → Backend saves a pending subscription row tied to the payment link ID
           → Frontend shows the URL in a card with:
               [ Copy Link ]
               [ Share via WhatsApp ]  ← opens wa.me with pre-filled message
Step 4  →  Org contact opens the link on their device
           → They see a Razorpay-hosted payment page (GlimmoraCare branding)
           → They complete payment (any method)
           → Razorpay sends a webhook to the backend: POST /webhooks/razorpay
           → Backend verifies the webhook signature
           → Backend marks subscription as active, sets expires_at, creates the org
```

The super admin does not need to wait — they can leave. The webhook handles the rest automatically.

---

## What the Backend Needs to Build

### New Database Table: subscriptions

```
id                        UUID, primary key
org_id                    UUID, foreign key → organizations.id (nullable until org is created)
patient_id                UUID, foreign key → users.id (nullable — for patient subscriptions)
plan_id                   string  (ObjectId ref to plans collection)
plan_snapshot             JSON    (copy of PlanOut at time of purchase — survives plan deletion)
amount_paise              integer (price in paise, e.g. ₹1999 → 199900)
currency                  string, default 'INR'
status                    enum: 'pending' | 'active' | 'expired' | 'cancelled'
razorpay_order_id         string | null
razorpay_payment_id       string | null
razorpay_signature        string | null
razorpay_payment_link_id  string | null
razorpay_payment_link_url string | null
contact_name              string | null  (for payment link flow)
contact_email             string | null
contact_phone             string | null
org_data_snapshot         JSON | null    (org name/address/phone/website for link flow)
starts_at                 datetime | null
expires_at                datetime | null
created_at                datetime
```

### New Backend Endpoints (Payment)

#### 1. POST /api/v1/payments/create-order
- Who calls it: Frontend (super admin, Way 1)
- What it does: Calls Razorpay `orders.create({ amount, currency, receipt })` using the Key Secret
- Request body: `{ plan_id, amount_paise }`
- Response: `{ order_id, amount, currency }`

#### 2. POST /api/v1/payments/verify
- Who calls it: Frontend (super admin, Way 1) — called from inside the Razorpay handler callback
- What it does:
  1. Verifies HMAC-SHA256 signature: `hmac(order_id + "|" + payment_id, key_secret) === signature`
  2. If valid: creates the org via existing org creation logic
  3. Creates subscription row with status='active', starts_at=now, expires_at=now+months, plan_snapshot=plan doc
- Request body: `{ razorpay_payment_id, razorpay_order_id, razorpay_signature, org_name, address, phone, website, plan_id }`
- Response: `{ org_id, org_name, subscription_id, expires_at }`

#### 3. POST /api/v1/payments/create-payment-link
- Who calls it: Frontend (super admin, Way 2)
- Request body: `{ plan_id, amount_paise, org_name, address, phone, website, contact_name, contact_email, contact_phone, expiry_hours }`
- Response: `{ payment_link_url, payment_link_id, expires_at }`

#### 4. POST /api/v1/webhooks/razorpay  (public endpoint, no auth header)
- Who calls it: Razorpay's servers automatically
- Events handled: `payment_link.paid`, `payment.failed`
- Always responds HTTP 200 within 5 seconds

#### 5. GET /api/v1/admin/organizations/{org_id}/subscription
- Returns: `{ plan_id, plan_snapshot, status, expires_at, amount_paise, razorpay_payment_id, created_at }`

### Backend Environment Variables (server only, never frontend)
```
RAZORPAY_KEY_ID=rzp_test_SmqM1w9wGjgzs8
RAZORPAY_KEY_SECRET=Hg2rA6Z4E4KKy6W3HhPdKXCd
RAZORPAY_WEBHOOK_SECRET=<copy from Razorpay Dashboard → Settings → Webhooks>
```

---

## What the Frontend Needs to Change

### File 1: app/(dashboard)/organization/create/page.tsx

**Change 1 — Remove hardcoded PLANS array**
The old static `PLANS` const (lines ~49–56) is removed. Plans are now fetched from `GET /plans?plan_type=org` on mount via `planApi.getPublicPlans('org')`.

Dynamic fields from API:
- `plan.price` → price in ₹
- `plan.duration_months` → used to compute per-month: `Math.round(plan.price / plan.duration_months)`
- `plan.discount_percent` → shows "Save X%" if > 0
- `plan.is_popular` → shows "Most Popular" badge
- `plan.id` → sent to backend as `plan_id`

**Change 2 — Upgrade openRazorpay() for Way 1**

New flow:
```
click Pay
  → setOrderLoading(true)
  → call paymentApi.createOrder(plan.id, plan.price * 100)
  → receive { order_id }
  → open Razorpay modal with order_id included in options
  → handler(response) fires after user pays
  → call paymentApi.verifyPayment({ payment_id, order_id, signature, org_data, plan_id })
  → receive { org_id, org_name, expires_at }
  → setCreatedName(org_name), setExpiresAt(expires_at), setStep(4)
```

**Change 3 — Add "Send Payment Link" section in Step 3**

Below the Pay button, add:
```
──── or send a payment link ────

[ Contact Name (optional) ]
[ Contact Email *         ]
[ Contact Phone (optional)]
[ Link expires in: 24h / 3 days / 7 days ]

[ Generate & Copy Link ]
```

After the link is generated, replace the form with:
```
┌─────────────────────────────────────────┐
│  Payment link ready                     │
│  https://rzp.io/l/XXXXXXXX             │
│  [ Copy Link ]  [ Share via WhatsApp ]  │
│  Expires in 3 days                      │
└─────────────────────────────────────────┘
```

**Change 4 — Update Step 4 success screen**
Add expiry date: "Active until 8 May 2027"
Add payment ID (from Way 1) or link ID (from Way 2)

### File 2: lib/api.ts

Add `planApi` namespace (see Plan Management section above) and a `paymentApi` namespace:

```typescript
export const paymentApi = {
  createOrder: (planId: string, amountPaise: number) =>
    apiFetch<{ order_id: string; amount: number; currency: string }>(
      '/payments/create-order', { method: 'POST', body: { plan_id: planId, amount_paise: amountPaise } }
    ),

  verifyPayment: (payload: VerifyPaymentBody) =>
    apiFetch<{ org_id: string; org_name: string; subscription_id: string; expires_at: string }>(
      '/payments/verify', { method: 'POST', body: payload }
    ),

  createPaymentLink: (payload: CreatePaymentLinkBody) =>
    apiFetch<{ payment_link_url: string; payment_link_id: string; expires_at: string }>(
      '/payments/create-payment-link', { method: 'POST', body: payload }
    ),
}
```

Also add to adminApi:
```typescript
getOrgSubscription: (orgId: string) =>
  apiFetch<SubscriptionOut>(`/admin/organizations/${orgId}/subscription`)
```

### File 3: app/(dashboard)/organization/page.tsx

On each org card in the super admin list, add a subscription status badge:

- Green: "Active · expires Jan 2026" — when status='active' and expires_at > 30 days away
- Amber: "Expiring in 12 days" — when status='active' and expires_at ≤ 30 days away
- Red: "Expired" + Renew button — when status='expired' or expires_at is in the past
- Grey: "No plan" — when no subscription exists

### File 4: app/(dashboard)/admin/plans/page.tsx (NEW)

Super admin plan management UI — table of all plans with create/edit/delete. See Plan Management Module section above.

---

## Build Order (Phased)

### Phase 0 — Done
- Updated this doc to reflect dynamic plan management

### Phase 1 — Backend: Plan CRUD
1. Add `get_plans_collection()` to `db/mongodb.py` + index
2. Create `schemas/plan_schema.py` (PlanCreate / PlanUpdate / PlanOut)
3. Create `routes/plan_routes.py` (5 endpoints)
4. Register router in `api/v1/router.py`
5. Run `scripts/seed_plans.py` — inserts 10 default plans (5 org + 5 patient)

### Phase 2 — Frontend: Admin Plans UI
1. Create `app/(dashboard)/admin/plans/page.tsx`
2. Add `planApi` to `lib/api.ts`
3. Add "Plans" nav link in admin sidebar

### Phase 3 — Frontend: Dynamic Org Create
1. Remove hardcoded PLANS array from `organization/create/page.tsx`
2. Fetch from `planApi.getPublicPlans('org')` on mount
3. Compute per-month and saving labels from API data

### Phase 4 — Backend: Subscriptions + Razorpay (next session)
1. Create `subscriptions` collection + schema
2. Build `POST /payments/create-order`
3. Build `POST /payments/verify`
4. Build `POST /payments/create-payment-link`
5. Build `POST /webhooks/razorpay`
6. Update frontend `openRazorpay()` to use real order flow
7. Wire "Generate & Copy Link" to real endpoint

### Phase 5 — Subscription Status UI (next session)
1. Backend: include subscription in org list response
2. Frontend: add status badges and Renew button to org cards

---

## One-Time Razorpay Dashboard Setup

1. Go to Razorpay Dashboard → Settings → Payment Methods → enable UPI
2. Go to Settings → Webhooks → Add new webhook:
   - URL: `https://careapi.glimmora.ai/api/v1/webhooks/razorpay`
   - Events to select: `payment.captured`, `payment.failed`, `payment_link.paid`
   - Copy the webhook secret → paste into backend `.env` as `RAZORPAY_WEBHOOK_SECRET`
3. Go to Settings → Payment Links → make sure it is enabled on your account

---

## How to Test End to End

### Plan Management (Phase 1–3)
1. Run seed script → 10 plans inserted in MongoDB
2. `GET /plans?plan_type=org` → 5 active org plans returned
3. Log in as super_admin → `/admin/plans` → table shows org plans
4. Toggle to Patient → 5 patient plans shown
5. Edit "1 Month" org plan price to ₹2,499 → save
6. Navigate to `/organization/create` → Step 1 shows ₹2,499 for 1 Month (fetched from API)

### Way 1 — In-App (Phase 4)
1. Log in as super_admin → Organisation → Create
2. Fill org name → select 6m plan → Next → Confirm & Pay
3. Razorpay modal opens showing correct amount (from DB)
4. Enter card `4111 1111 1111 1111`, any future expiry, any CVV → Pay
5. Success screen shows org name, expiry date (6 months from today), payment ID
6. Go back to org list → org appears with green "Active" badge

### Way 2 — Payment Link (Phase 4)
1. On Step 3, click "Send Payment Link"
2. Fill contact email → select 3 days → Generate
3. A Razorpay link URL appears → copy it
4. Open the link in a new tab → pay with test card
5. Wait up to 30 seconds → go to org list → org appears automatically (webhook created it)

### Subscription Status (Phase 5)
1. Manually set `expires_at` to 10 days from now in DB → org card shows amber warning
2. Manually set `expires_at` to yesterday → org card shows red Expired + Renew button

---

## Key Files

| File | What Changes |
|------|-------------|
| `glimmora_care_backend/app/db/mongodb.py` | Add `get_plans_collection()`, `get_subscriptions_collection()` |
| `glimmora_care_backend/app/schemas/plan_schema.py` | **NEW** — PlanCreate / PlanUpdate / PlanOut |
| `glimmora_care_backend/app/schemas/subscription_schema.py` | **NEW** — SubscriptionOut and related |
| `glimmora_care_backend/app/routes/plan_routes.py` | **NEW** — Plan CRUD endpoints |
| `glimmora_care_backend/app/routes/payment_routes.py` | **NEW** — Payment + webhook endpoints |
| `glimmora_care_backend/app/api/v1/router.py` | Register plan_router and payment_router |
| `glimmora_care_backend/scripts/seed_plans.py` | **NEW** — seed 10 default plans |
| `app/(dashboard)/admin/plans/page.tsx` | **NEW** — Plan management UI |
| `app/(dashboard)/organization/create/page.tsx` | Remove hardcoded PLANS, fetch from API |
| `app/(dashboard)/organization/page.tsx` | Subscription status badges on org cards |
| `lib/api.ts` | Add `planApi`, `paymentApi`, `adminApi.getOrgSubscription` |
| `.env.local` | Keep only `NEXT_PUBLIC_RAZORPAY_KEY_ID` |
| Backend `.env` | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` |
