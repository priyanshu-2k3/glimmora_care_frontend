# GlimmoraCare — UI Design Upgrade Guide

## Design Vision
Modern, professional health-tech SaaS dashboard. Clean white surfaces, confident typography, purposeful use of color.
Reference aesthetic: enterprise SaaS (think Linear, Vercel, Stripe dashboard) fused with a subtle luxury health identity.

---

## Sidebar — Redesign Rules

### Layout
- White background (`bg-white`) with a right border (`border-r border-sand-light`)
- Width: `w-64` fixed
- Logo at top with brand mark; use gold accent on the brand name only
- Navigation sections with small uppercase labels in very muted color
- Active item: left accent bar (3px gold strip) + subtle gold-tinted background
- Hover: very light parchment tint, no heavy boxes
- Bottom: user card with avatar, name, role pill — clean and compact
- NO dark backgrounds on sidebar — the image's dark sidebar is explicitly rejected

### Active State
```tsx
// Active nav item pattern
className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gold-soft/8 text-charcoal-deep font-medium
  before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-0.5 before:rounded-full before:bg-gold-soft"
// Inactive
className="flex items-center gap-3 px-3 py-2 text-stone hover:text-charcoal-deep hover:bg-parchment/60 rounded-lg"
```

### Section Labels
```tsx
<p className="text-[10px] font-semibold text-greige/60 uppercase tracking-widest px-3 mb-1 mt-4">HEALTH</p>
```

### Icons
- Active: `text-gold-deep`
- Inactive: `text-greige` (grays out when not active)
- Size: `w-4 h-4` consistently

---

## Topbar — Redesign Rules

- `bg-white border-b border-sand-light` — stays clean white
- Height: `h-14` (slightly tighter than before)
- Left: Page title only — `text-base font-semibold text-charcoal-deep` (no breadcrumb noise)
- Center: Prominent search bar — `bg-ivory-warm border border-sand-light rounded-lg` with keyboard shortcut hint `⌘K`
- Right: Bell (with badge), divider, avatar + name
- Remove verbose breadcrumbs — they add noise

---

## Stat Cards — Redesign Rules

### Card Shell
```tsx
<div className="bg-white border border-sand-light rounded-2xl p-5 hover:shadow-md hover:border-gold-soft/30 transition-all duration-200">
```

### Icon Badge
- Small colored rounded square (not circle): `w-9 h-9 rounded-xl flex items-center justify-center`
- Use role-specific tints: azure-whisper for clinical, parchment for neutral, success-soft/15 for positive, warning-soft/15 for caution

### Value Typography
- Large number: `text-3xl font-bold text-charcoal-deep font-body`
- Label above: `text-xs text-greige font-body mb-2`
- Trend: small green text with arrow icon `text-[11px] text-success-DEFAULT`

### Progress bar underneath (budget-style)
- For budget/spending cards: show a thin progress bar `h-1 bg-sand-light rounded-full` with fill in gold

---

## Dashboard Layout — Redesign Rules

### Header
- Clean two-line header: greeting h1 + subtitle with date
- Optional: a subtle "last updated" chip on the right
- No heavy borders or cards around the header

### Stat Grid
- 4-up grid on desktop: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`
- Cards are uniform height

### Main Content Row
- Two-column below stats: `grid grid-cols-1 lg:grid-cols-3 gap-5`
- Left (2/3): primary chart or patient list
- Right (1/3): distribution donut or secondary metric

### Charts
- Performance line chart: `recharts` LineChart with smooth curves, `type="monotone"`
- Donut/pie chart: recharts PieChart with center label
- Always `ResponsiveContainer`
- Grid lines: very faint `stroke="#E5DFD3"` (sand-light color)
- Chart wrapper card: `bg-white border border-sand-light rounded-2xl p-5`

---

## Color Usage Rules

| Element | Class |
|---|---|
| Page background | `bg-ivory-cream` |
| Card background | `bg-white` |
| Card border | `border border-sand-light` |
| Card border hover | `hover:border-gold-soft/30` |
| Primary heading | `text-charcoal-deep font-semibold` |
| Secondary text | `text-stone` |
| Muted / labels | `text-greige` |
| Gold accent | `text-gold-deep` or `text-gold-soft` |
| Positive trend | `text-success-DEFAULT` |
| Warning | `text-warning-DEFAULT` |
| Error | `text-error-DEFAULT` |
| Active nav bg | `bg-gold-soft/8` |
| Nav icon active | `text-gold-deep` |

---

## Typography Rules

- **Page title:** `font-body text-2xl font-bold text-charcoal-deep`
- **Card title:** `font-body text-sm font-semibold text-charcoal-deep`
- **Stat value:** `font-body text-3xl font-bold text-charcoal-deep`
- **Label:** `font-body text-xs text-greige`
- **Body text:** `font-body text-sm text-stone`
- **Nav item:** `font-body text-sm font-medium`
- **Section label:** `font-body text-[10px] font-semibold uppercase tracking-widest text-greige/60`
- **Brand mark only:** `font-display` — Cormorant Garamond for logo/hero elements

---

## Spacing & Radius Rules

- Card radius: `rounded-2xl`
- Button/input radius: `rounded-lg`
- Nav item radius: `rounded-lg`
- Avatar: `rounded-full`
- Icon badge: `rounded-xl`
- Section gap: `gap-4` or `gap-5`
- Card padding: `p-5` or `p-6`
- Nav item padding: `px-3 py-2` (inactive), `px-3 py-2.5` (active)

---

## Animation
- Use `transition-all duration-200` on all interactive elements
- Page entrance: `animate-fade-in`
- Stat numbers: count-up animation on mount
- Hover shadows: `hover:shadow-md`
- NO jarring color shifts — transitions should be subtle

---

## Anti-Patterns (Do NOT do these)
- No `dark-espresso` or very dark backgrounds on the sidebar
- No inline styles
- No hardcoded hex colors — always use tokens
- No heavy box shadows on every element
- No gradient borders
- No more than 3 font sizes in a single card
- No mixing font-display and font-body in body content — font-display only for logo
- Don't use `text-4xl` or larger for stat values — `text-3xl` max
