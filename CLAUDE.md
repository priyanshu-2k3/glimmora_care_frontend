# GlimmoraCare — Claude Code Project Rules

## Pre-Push / Post-Session Build Check (MANDATORY)

Before pushing frontend to GitHub — or after any significant frontend session — run:

```bash
cd "d:/BAAREZ/Glimmora Care/glimmora_care"
npm run build
```

**Rules:**
- The build MUST pass with zero errors before any `git push`
- If the build fails, fix all errors before committing
- A passing build confirms: TypeScript types are valid, all imports resolve, all 59 routes compile
- Do NOT push if there are any `Type error:`, `Module not found:`, or `Failed to compile` lines in the output

**What a clean build looks like:**
```
✓ Compiled successfully
✓ Generating static pages (59/59)
```
Every route listed below that — no red lines above it.

## Frontend Pages Map (REQUIRED — Read Before, Update After)

The file `doc/FRONTEND_PAGES.md` is the canonical map of every frontend route, the roles that can access it, and the features/operations on it.

**Rules:**
- **Before** editing or creating any page in `app/`, read `doc/FRONTEND_PAGES.md` to confirm the page's intended scope, role access, and feature list.
- **After** adding, removing, renaming, or changing the role/feature surface of any page, update `doc/FRONTEND_PAGES.md` in the same change so it always matches the code.
- Keep the role columns in sync with `NAV_ITEMS` in `lib/constants.ts` and the dashboard layout's auth guard.

## Feature Tracking (REQUIRED — Update as You Work)

Two living documents must be kept up to date at all times:

### `D:\BAAREZ\Glimmora Care\doc\feature_list.csv`
Every time you build, modify, or integrate a feature:
1. Open `D:\BAAREZ\Glimmora Care\doc\feature_list.csv`
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
- **Type:** Next.js frontend fully integrated with FastAPI backend at http://127.0.0.1:8000/api/v1
- **Stack:** Next.js 16.1.6, React 19, TypeScript 5, Tailwind CSS 4

## Absolute Rules

### Architecture
- **Real API** — all data is fetched from the FastAPI backend via `lib/api.ts`
- **No mock data for auth/health features** — `data/*.ts` is only for demo/fallback users
- **Real AI** — OpenAI gpt-4.1-mini (chat) and gpt-4.1 (OCR) via backend `/api/v1/chat`
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
- Real auth via `context/AuthContext.tsx` — JWT access + refresh tokens in localStorage
- 5 roles: `patient`, `doctor`, `admin`, `super_admin` (ngo_worker / gov_analyst are frontend-only demo roles)
- `demoLogin()` uses `data/users.ts` mock users; `login()` hits real backend POST /auth/login
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
