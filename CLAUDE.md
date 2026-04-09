# GlimmoraCare — Claude Code Project Rules

## Feature Tracking (REQUIRED — Update as You Work)

Two living documents must be kept up to date at all times:

### `doc/feature_list.csv`
Every time you build, modify, or integrate a feature:
1. Open `doc/feature_list.csv`
2. Find the row for the affected feature
3. Update the relevant % column(s):
   - **Frontend %** — UI exists and renders correctly (0/50/100)
   - **Backend %** — API endpoint exists with correct response shape (0/50/100)
   - **Integration %** — Frontend is calling the real API, not mock data (0/50/100)
4. Update the **Notes** column if anything notable changed

### `doc/API_SCHEMA.md`
Every time an API endpoint is created or integrated:
1. Find the endpoint section in `doc/API_SCHEMA.md`
2. Change its status marker: `❌ Missing` → `⚠️ Incomplete` → `✅ Done`
3. Update the request/response schema if it changed
4. Update the "Used by" file reference if new frontend files use it

**Rule:** Never finish a coding task without updating these two files. The feature list and API schema are the single source of truth for project progress.

## Project Identity
- **Project:** GlimmoraCare Phase 1 — Preventive Intelligence Engine
- **Type:** Frontend-only Next.js application with mock data (no database, no real AI)
- **Stack:** Next.js 16.1.6, React 19, TypeScript 5, Tailwind CSS 4

## Absolute Rules

### Architecture
- **Frontend only** — never create API routes or server actions that connect to real databases
- **Mock data only** — all data lives in `data/*.ts` files; never fetch from external APIs
- **No real AI** — all AI responses are pre-scripted in `data/chat-responses.ts`
- App directory lives at root `app/` (NOT `src/app/`) — path alias `@/*` maps to project root

### Tailwind / Styling
- Always use the custom luxury design tokens defined in `tailwind.config.ts`
- Use `@config "../tailwind.config.ts";` in `globals.css` (Tailwind v4 requirement)
- Content paths in `tailwind.config.ts` must point to `./app/**` and `./components/**` (NOT `./src/...`)
- Primary font: `font-display` = Cormorant Garamond (headings), `font-body` = Outfit (body text)
- Design language: ivory backgrounds, gold accents, charcoal text, sapphire intelligence signals

### Design Token Reference
```
Backgrounds: bg-ivory-cream, bg-ivory-warm, bg-parchment
Text: text-charcoal-deep (headings), text-stone (body), text-greige (secondary)
Accents: text-gold-deep, bg-champagne, border-gold-soft, border-sand-light
Cards: bg-ivory-cream border border-sand-light rounded-xl shadow-sm p-6
Headings: font-display text-2xl text-charcoal-deep tracking-tight
Interactive: transition-all duration-300 hover:shadow-md hover:border-gold-soft
Semantic: success-soft (muted green), warning-soft (muted amber), error-soft (muted red)
Gradients: bg-ivory-flow, bg-gold-whisper, bg-intelligence-depth, bg-noir-editorial
```

### Code Style
- TypeScript strict mode — always type everything, no `any`
- Use `cn()` from `lib/utils.ts` (clsx + tailwind-merge) for all class merging
- Named exports for components; default export for pages
- `'use client'` only where interactivity is required
- No inline styles — Tailwind classes only
- No hardcoded colors — always use design tokens

### Component Conventions
- UI primitives live in `components/ui/`
- Feature components grouped by module: `components/intake/`, `components/vault/`, etc.
- Charts in `components/charts/`
- Layout components in `components/layout/`
- Every component receives typed props (no implicit any)

### Mock Data Conventions
- All mock data in `data/*.ts` with TypeScript types from `types/*.ts`
- Use `lib/mock-delay.ts` `simulateAsync()` for fake loading states
- Indian healthcare context for patient names, locations, and clinical scenarios
- Minimum 8-10 patient records, 20+ health records in mock data

### Authentication (Mock)
- Mock auth via `context/AuthContext.tsx` + localStorage
- 5 roles: `patient`, `doctor`, `ngo_worker`, `gov_analyst`, `admin`
- Login selects a pre-built user from `data/users.ts` — no real credential validation
- Always check auth in dashboard layout and redirect to `/login` if missing

### AI/Chat Conventions
- Pre-scripted responses only — keyword matching in `hooks/useMockChat.ts`
- Always show `DisclaimerBanner` with "This is not medical advice" on all assistant pages
- Confidence scores must accompany every AI output (display as percentage)
- Non-diagnostic language only — never use words like "diagnosis", "treatment", "prescription"

### Charts / Visualization
- Use **recharts** for all charts (trends, gauges, timelines, bars, donuts)
- Use **framer-motion** for animations (OCR processing, typing indicators, page transitions)
- Charts must be responsive (use `ResponsiveContainer` from recharts)
- Always show loading skeleton while chart data resolves

### File Naming
- Pages: `page.tsx` (Next.js convention)
- Components: PascalCase (`HealthTimeline.tsx`)
- Hooks: camelCase with `use` prefix (`useMockChat.ts`)
- Data files: kebab-case (`health-records.ts`)
- Type files: kebab-case (`health.ts`)

## SOW Compliance (Non-Negotiable)
- Every AI output must display: confidence score + source markers + reasoning trace + disclaimer
- Audit trail must be visible in vault module
- Role-based access must be enforced — wrong role = redirect or hidden nav item
- Offline sync status indicator must appear in NGO worker sidebar
- Population data must be aggregated only — no individual identifiers shown

## Dependencies (Approved)
```
recharts, framer-motion, clsx, tailwind-merge, lucide-react, date-fns
```
No other UI libraries (no shadcn, no MUI, no Chakra) — build from scratch using Tailwind tokens.

## Week Priorities (Reference)
- **Week 1:** Design system fix, auth, intake UI, vault UI
- **Week 2:** Intelligence dashboard, agent dashboard, digital twin
- **Week 3:** AI assistants, population dashboard, offline mode
- **Week 4:** Polish, responsive, build verification
