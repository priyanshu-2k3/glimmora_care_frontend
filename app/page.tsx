'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ScanText, ShieldCheck, Check, ChevronRight, Mail,
  Loader2, Building2, User, AlertCircle, Menu, X,
  Brain, Lock, FileText, ArrowRight, Star,
  HeartPulse, Activity, Users, QrCode, Clock, Pill,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { planApi, type PlanOut } from '@/lib/api'

// ─── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <header className={cn(
      'sticky top-0 z-50 transition-all duration-300',
      scrolled ? 'bg-white/96 backdrop-blur-md border-b border-sand-light/70 shadow-sm' : 'bg-transparent',
    )}>
      <div className="max-w-7xl mx-auto px-6 h-[68px] flex items-center justify-between">
        <span className={cn('font-display text-[26px] tracking-tight select-none transition-colors duration-300', scrolled ? 'text-charcoal-deep' : 'text-ivory-cream')}>
          Glimmora<span className="text-gold-soft italic">Care</span>
        </span>

        <nav className="hidden md:flex items-center gap-8">
          {[['#features', 'Features'], ['#plans', 'Plans'], ['#get-started', 'Get Started']].map(([href, label]) => (
            <a key={href} href={href} className={cn('text-[13px] font-body transition-colors duration-300', scrolled ? 'text-stone hover:text-charcoal-deep' : 'text-ivory-cream/70 hover:text-ivory-cream')}>
              {label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link href="/login" className={cn('text-[13px] font-body font-medium transition-colors duration-300 px-4 py-2.5 rounded-xl', scrolled ? 'text-charcoal-deep hover:text-gold-deep' : 'text-ivory-cream/70 hover:text-ivory-cream')}>
            Log in
          </Link>
          <Link href="/register" className={cn('text-[13px] font-body font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm', scrolled ? 'bg-charcoal-deep text-ivory-cream hover:bg-noir' : 'bg-ivory-cream/10 text-ivory-cream border border-ivory-cream/20 hover:bg-ivory-cream/20')}>
            Get started →
          </Link>
        </div>

        <button className={cn('md:hidden p-2 transition-colors', scrolled ? 'text-stone' : 'text-ivory-cream/70')} onClick={() => setMenuOpen(v => !v)}>
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-sand-light px-6 py-5 space-y-4">
          {[['#features', 'Features'], ['#plans', 'Plans'], ['#get-started', 'Get Started']].map(([href, label]) => (
            <a key={href} href={href} className="block text-sm font-body text-stone" onClick={() => setMenuOpen(false)}>{label}</a>
          ))}
          <div className="flex gap-3 pt-3 border-t border-sand-light">
            <Link href="/login" className="flex-1 text-center text-sm font-body border border-sand-light rounded-xl py-2.5">Log in</Link>
            <Link href="/register" className="flex-1 text-center text-sm font-body font-semibold bg-charcoal-deep text-ivory-cream rounded-xl py-2.5">Sign up</Link>
          </div>
        </div>
      )}
    </header>
  )
}

// ─── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative overflow-hidden -mt-[68px] pt-[68px]" style={{ background: 'linear-gradient(160deg, #1A1816 0%, #2D2A26 55%, #3D3228 100%)' }}>
      {/* Dot grid */}
      <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: 'radial-gradient(circle, #C9A962 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      {/* Glow orb */}
      <div className="absolute -top-20 right-[10%] w-[520px] h-[520px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(201,169,98,0.12) 0%, transparent 70%)' }} />

      <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-16 grid lg:grid-cols-[1fr_420px] gap-16 items-center">
        {/* Left */}
        <div>
          <div className="inline-flex items-center gap-2.5 rounded-full border border-gold-soft/25 bg-gold-soft/8 px-4 py-1.5 mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-soft animate-pulse" />
            <span className="text-[11px] font-body font-semibold tracking-[0.18em] text-gold-soft uppercase">Preventive Intelligence Engine</span>
          </div>

          <h1 className="font-display text-[58px] lg:text-[72px] xl:text-[82px] text-ivory-cream leading-[1.0] mb-7 tracking-tight">
            The Health<br />
            Intelligence layer<br />
            <span className="italic text-gold-soft">for Modern India</span>
          </h1>

          <p className="text-[15px] font-body text-ivory-cream/50 max-w-[480px] leading-[1.75] mb-11">
            Secure health records, AI-driven preventive insights, and digital consent management — built for patients, clinics, and healthcare organisations.
          </p>

          <div className="flex flex-wrap gap-3 mb-14">
            <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-body font-semibold text-[14px] hover:opacity-90 transition-all shadow-xl" style={{ background: 'linear-gradient(135deg, #C9A962 0%, #9A7F35 100%)', color: '#1A1816' }}>
              Start for free <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#get-started" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-ivory-cream/15 text-ivory-cream font-body font-medium text-[14px] hover:border-ivory-cream/30 hover:bg-ivory-cream/5 transition-all">
              For organisations
            </a>
          </div>

          <div className="flex gap-10 pt-6 border-t border-ivory-cream/8">
            {[['10,000+', 'Records digitised'], ['99.9%', 'Uptime SLA'], ['256-bit', 'Encryption']].map(([v, l]) => (
              <div key={l}>
                <p className="font-display text-[26px] text-ivory-cream">{v}</p>
                <p className="text-[11px] font-body text-ivory-cream/35 mt-0.5 tracking-wide">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — product card */}
        <div className="hidden lg:block">
          <div className="relative">
            <div className="rounded-2xl border border-ivory-cream/10 p-6 shadow-2xl" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gold-soft/15 flex items-center justify-center">
                    <HeartPulse className="w-4 h-4 text-gold-soft" />
                  </div>
                  <span className="text-[12px] font-body font-semibold text-ivory-cream/80">Health Vault</span>
                </div>
                <span className="text-[10px] font-body px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(201,169,98,0.15)', color: '#C9A962' }}>Active</span>
              </div>

              <div className="space-y-2 mb-5">
                {[
                  ['Blood Report — Jan 2025', 'Lab'],
                  ['Prescription — Dr. Mehta', 'Rx'],
                  ['Discharge Summary', 'Hospital'],
                ].map(([label, tag]) => (
                  <div key={label as string} className="flex items-center justify-between rounded-xl px-4 py-3 border border-ivory-cream/5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-3.5 h-3.5 text-ivory-cream/30" />
                      <span className="text-[12px] font-body text-ivory-cream/65">{label}</span>
                    </div>
                    <span className="text-[10px] font-body font-semibold px-2 py-0.5 rounded-md" style={{ background: 'rgba(201,169,98,0.1)', color: '#C9A962' }}>{tag}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-xl px-4 py-3.5 flex items-center gap-3 border border-gold-soft/15" style={{ background: 'rgba(201,169,98,0.06)' }}>
                <Brain className="w-4 h-4 text-gold-soft" />
                <div>
                  <p className="text-[12px] font-body font-semibold text-ivory-cream/90">AI Insight ready</p>
                  <p className="text-[10px] font-body text-ivory-cream/35 mt-0.5">3 documents analysed</p>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -bottom-5 -left-6 rounded-2xl px-5 py-4 shadow-xl border border-ivory-cream/8" style={{ background: 'linear-gradient(135deg, #2D2A26 0%, #4A453D 100%)' }}>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-gold-soft" />
                <span className="text-[12px] font-body font-semibold text-ivory-cream">Consent granted</span>
              </div>
              <p className="text-[10px] font-body text-ivory-cream/40">Dr. Sharma · 30 days</p>
            </div>

            <div className="absolute -top-4 -right-4 rounded-2xl px-4 py-3.5 shadow-xl border border-ivory-cream/8" style={{ background: 'linear-gradient(135deg, #3D3228 0%, #2D2A26 100%)' }}>
              <div className="flex items-center gap-2">
                <ScanText className="w-3.5 h-3.5 text-gold-soft" />
                <span className="text-[12px] font-body font-semibold text-ivory-cream">OCR complete</span>
              </div>
              <p className="text-[10px] font-body text-ivory-cream/40 mt-0.5">12 fields extracted</p>
            </div>
          </div>
        </div>
      </div>

      <div className="h-12 bg-gradient-to-b from-transparent to-ivory-cream" />
    </section>
  )
}

// ─── Trusted by ────────────────────────────────────────────────────────────────
function TrustedBy() {
  return (
    <section className="bg-ivory-cream py-10 px-6 border-b border-sand-light">
      <p className="text-center text-[10px] font-body uppercase tracking-[0.28em] text-greige font-semibold mb-7">
        Trusted by leading healthcare providers
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-3">
        {['Apollo Hospitals', 'Fortis Health', 'Max Healthcare', 'Manipal Group', 'AIIMS Network'].map(org => (
          <span key={org} className="text-[13px] font-body font-semibold text-taupe tracking-wide">{org}</span>
        ))}
      </div>
    </section>
  )
}

// ─── Problem ───────────────────────────────────────────────────────────────────
function Problem() {
  const items = [
    { icon: FileText, title: 'Fragmented records', desc: 'Health data scattered across clinics, labs, and paper files — no single source of truth.' },
    { icon: Lock, title: 'Consent gaps', desc: 'No clear trail of who accessed patient data, when, and why. A compliance and liability risk.' },
    { icon: Brain, title: 'Zero insights', desc: 'Raw data never becomes intelligence. Doctors lack context. Patients lack awareness.' },
    { icon: Activity, title: 'Manual overhead', desc: 'Staff spend hours re-typing data from reports instead of focusing on patient care.' },
  ]
  return (
    <section className="bg-ivory-warm py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <p className="text-[11px] font-body uppercase tracking-[0.22em] text-gold-deep font-semibold text-center mb-3">The Problem</p>
        <h2 className="font-display text-[42px] sm:text-[52px] text-charcoal-deep text-center leading-tight mb-4">
          Stop managing health in silos.
        </h2>
        <p className="text-[14px] font-body text-stone text-center max-w-xl mx-auto mb-14 leading-relaxed">
          Healthcare in India is fragmented, paper-heavy, and consent-blind. GlimmoraCare solves all three.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white border border-sand-light rounded-2xl p-6 hover:shadow-md hover:border-champagne transition-all group">
              <div className="w-10 h-10 rounded-xl bg-champagne/70 flex items-center justify-center mb-4 group-hover:bg-champagne transition-colors">
                <Icon className="w-5 h-5 text-gold-deep" />
              </div>
              <p className="font-body font-semibold text-charcoal-deep text-[13px] mb-2">{title}</p>
              <p className="text-[12px] font-body text-stone leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Features ──────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    id: 'ocr',
    icon: ScanText,
    label: 'OCR & Document Scanning',
    headline: 'Digitise any health document instantly',
    body: 'Upload prescriptions, lab reports, discharge summaries, or insurance papers. Our OCR engine extracts structured data from images and PDFs — no manual entry. Records are indexed, searchable, and stored with end-to-end encryption.',
    points: ['Prescriptions, lab reports & discharge summaries', 'Instant extraction from images and PDFs', 'Auto-tagged and searchable in your vault', 'End-to-end encrypted, stored in India'],
  },
  {
    id: 'consent',
    icon: ShieldCheck,
    label: 'Consent Management',
    headline: 'Patient-first, privacy-by-design',
    body: "Patients control exactly who sees their data and for how long. Organisations can request consent digitally and maintain a full audit trail — fully aligned with India's DPDP Act.",
    points: ['Granular, time-bound sharing permissions', 'Digital consent requests sent to patients', 'Full audit trail for every access event', 'Revoke access at any time, instantly'],
  },
  {
    id: 'ai',
    icon: Brain,
    label: 'AI Health Insights',
    headline: 'Intelligence that works before you fall sick',
    body: 'Our AI analyses your historical records to surface patterns, flag anomalies, and generate plain-language summaries — giving doctors context at a glance and giving patients awareness they never had before.',
    points: ['Pattern detection across historical records', 'Plain-language summaries for patients', 'Anomaly flagging before it becomes critical', 'Doctor-ready context at appointment time'],
  },
  {
    id: 'family',
    icon: Users,
    label: 'Family Health Vault',
    headline: 'One account for the whole family',
    body: 'Add dependents — children, parents, grandparents — and manage all their health records, consent, and subscriptions under a single dashboard. Care doesn\'t stop at the individual.',
    points: ['Add unlimited dependents under one plan', 'Separate health timelines per member', 'Role-based access for family caregivers', 'Consolidated family health overview'],
  },
  {
    id: 'timeline',
    icon: Clock,
    label: 'Health Timeline',
    headline: 'Your entire health story, chronologically',
    body: 'Every diagnosis, prescription, lab result, and hospital visit — organised into a clean, scrollable timeline. Spot patterns, track progress, and walk into any consultation fully prepared.',
    points: ['Chronological view of every health event', 'Filter by category — labs, prescriptions, visits', 'Share a read-only snapshot with any doctor', 'Exportable as a PDF health summary'],
  },
  {
    id: 'emergency',
    icon: QrCode,
    label: 'Emergency Health Card',
    headline: 'Critical information when seconds matter',
    body: 'A scannable QR code that any doctor or paramedic can access in an emergency — showing blood type, allergies, active medications, and emergency contacts. No login required for emergency responders.',
    points: ['QR-accessible without login by responders', 'Blood type, allergies & active medications', 'Emergency contacts always visible', 'Updated automatically from your vault'],
  },
]

function Features() {
  const [active, setActive] = useState('ocr')
  const feature = FEATURES.find(f => f.id === active)!
  const Icon = feature.icon

  return (
    <section id="features" className="bg-white py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <p className="text-[11px] font-body uppercase tracking-[0.22em] text-gold-deep font-semibold text-center mb-3">Capabilities</p>
        <h2 className="font-display text-[42px] sm:text-[52px] text-charcoal-deep text-center leading-tight mb-4">
          Purpose-built for healthcare.
        </h2>
        <p className="text-[14px] font-body text-stone text-center max-w-lg mx-auto mb-14">
          Every feature is designed around one principle — the patient owns their health data.
        </p>

        <div className="grid lg:grid-cols-[260px_1fr] gap-5">
          {/* Sidebar */}
          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {FEATURES.map(f => {
              const FIcon = f.icon
              const on = active === f.id
              return (
                <button
                  key={f.id}
                  onClick={() => setActive(f.id)}
                  className={cn(
                    'shrink-0 w-full text-left rounded-xl border px-4 py-3.5 transition-all flex items-center gap-3',
                    on
                      ? 'bg-charcoal-deep border-charcoal-deep shadow-sm'
                      : 'bg-ivory-warm border-sand-light hover:border-champagne hover:bg-champagne/20',
                  )}
                >
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', on ? 'bg-gold-soft/20' : 'bg-champagne')}>
                    <FIcon className={cn('w-3.5 h-3.5', on ? 'text-gold-soft' : 'text-gold-deep')} />
                  </div>
                  <span className={cn('text-[12px] font-body font-semibold whitespace-nowrap lg:whitespace-normal', on ? 'text-ivory-cream' : 'text-charcoal-deep')}>
                    {f.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Detail */}
          <div className="rounded-2xl border border-sand-light bg-ivory-warm overflow-hidden">
            {/* Top accent strip */}
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #C9A962 0%, #9A7F35 100%)' }} />
            <div className="p-8 sm:p-10">
              <div className="flex items-start gap-5 mb-7">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-sand-light" style={{ background: 'linear-gradient(135deg, #E8DCC4 0%, #FAF8F5 100%)' }}>
                  <Icon className="w-7 h-7 text-gold-deep" />
                </div>
                <div>
                  <h3 className="font-display text-[30px] sm:text-[36px] text-charcoal-deep leading-tight">{feature.headline}</h3>
                  <p className="text-[13px] font-body text-stone mt-2 leading-[1.7] max-w-2xl">{feature.body}</p>
                </div>
              </div>

              <div className="h-px bg-sand-light mb-7" />

              <ul className="grid sm:grid-cols-2 gap-3">
                {feature.points.map(p => (
                  <li key={p} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-champagne border border-sand flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-gold-deep" />
                    </div>
                    <span className="text-[13px] font-body text-charcoal-deep leading-snug">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── How it works ──────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { num: '01', icon: User, title: 'Register', desc: 'Create your account in under 2 minutes. Patients sign up directly; organisations go through a quick verification step.' },
    { num: '02', icon: ScanText, title: 'Upload & Scan', desc: 'Add health records — photos, PDFs, or scans. OCR extracts all structured data automatically and organises it.' },
    { num: '03', icon: ShieldCheck, title: 'Control & Share', desc: 'Grant time-limited consent to doctors. Revoke anytime. Every access is logged in your audit trail.' },
  ]

  return (
    <section className="bg-ivory-warm py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <p className="text-[11px] font-body uppercase tracking-[0.22em] text-gold-deep font-semibold text-center mb-3">Process</p>
        <h2 className="font-display text-[42px] sm:text-[52px] text-charcoal-deep text-center leading-tight mb-4">
          How GlimmoraCare operates
        </h2>
        <p className="text-[14px] font-body text-stone text-center max-w-md mx-auto mb-14">
          From signup to full control of your health data — in three steps.
        </p>

        <div className="grid sm:grid-cols-3 gap-5 relative">
          {/* Connector line */}
          <div className="hidden sm:block absolute top-11 left-[calc(33%+24px)] right-[calc(33%+24px)] h-px bg-sand" />

          {steps.map(({ num, icon: Icon, title, desc }) => (
            <div key={title} className="bg-white border border-sand-light rounded-2xl p-7 hover:shadow-md hover:border-champagne transition-all relative">
              <div className="w-11 h-11 rounded-xl border border-sand-light flex items-center justify-center mb-5" style={{ background: 'linear-gradient(135deg, #E8DCC4 0%, #FAF8F5 100%)' }}>
                <Icon className="w-5 h-5 text-gold-deep" />
              </div>
              <p className="text-[10px] font-body font-bold text-greige tracking-[0.2em] mb-1">{num}</p>
              <h3 className="font-display text-[24px] text-charcoal-deep mb-3">{title}</h3>
              <p className="text-[13px] font-body text-stone leading-[1.7]">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Security ──────────────────────────────────────────────────────────────────
function SecurityBanner() {
  const badges = ['HIPAA aligned', 'AES-256 encryption', 'Zero-knowledge storage', 'SOC 2 ready', 'DPDP compliant', 'India-only data residency']
  return (
    <section className="relative py-24 px-6 overflow-hidden" style={{ background: 'linear-gradient(160deg, #1A1816 0%, #2D2A26 60%, #3D3228 100%)' }}>
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #C9A962 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[260px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(201,169,98,0.1) 0%, transparent 70%)' }} />

      <div className="relative max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-gold-soft/25 bg-gold-soft/8 px-4 py-1.5 mb-8">
          <Lock className="w-3 h-3 text-gold-soft" />
          <span className="text-[11px] font-body font-semibold tracking-[0.18em] text-gold-soft uppercase">Customer promise</span>
        </div>

        <h2 className="font-display text-[42px] sm:text-[56px] lg:text-[64px] text-ivory-cream leading-[1.05] mb-6">
          Secure by Design.<br />
          <span className="italic text-gold-soft">Sovereign by Default.</span>
        </h2>

        <p className="text-[14px] font-body text-ivory-cream/45 max-w-xl mx-auto mb-12 leading-[1.8]">
          Your health data never leaves India. We operate on India-based infrastructure with end-to-end encryption, zero-knowledge architecture, and a complete audit trail for every action.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          {badges.map(badge => (
            <div key={badge} className="flex items-center gap-2 rounded-full px-4 py-2 border border-ivory-cream/10" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <Check className="w-3 h-3 text-gold-soft" />
              <span className="text-[12px] font-body text-ivory-cream/75 font-medium">{badge}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Plans ─────────────────────────────────────────────────────────────────────
function durationLabel(months: number) {
  if (months === 0) return '7 Days'
  if (months === 1) return '1 Month'
  if (months === 12) return '1 Year'
  return `${months} Months`
}

function PlanCard({ plan }: { plan: PlanOut }) {
  const perMonth = plan.duration_months > 1 ? Math.round(plan.price / plan.duration_months) : null
  const highlight = plan.is_popular || plan.is_best_value

  return (
    <div className={cn(
      'relative rounded-2xl border flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-lg',
      highlight ? 'border-gold-soft/60 shadow-md' : 'border-sand-light',
      'bg-white',
    )}>
      {/* Top accent */}
      {highlight && <div className="h-0.5 w-full rounded-t-2xl" style={{ background: 'linear-gradient(90deg, #C9A962 0%, #9A7F35 100%)' }} />}

      {highlight && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="text-[10px] font-body font-bold px-3.5 py-1 rounded-full whitespace-nowrap uppercase tracking-wide" style={{ background: 'linear-gradient(135deg, #C9A962 0%, #9A7F35 100%)', color: '#1A1816' }}>
            {plan.is_best_value ? '★ Best Value' : 'Most Popular'}
          </span>
        </div>
      )}

      <div className="p-6 flex-1">
        <p className="text-[10px] font-body font-bold tracking-[0.22em] uppercase mb-5 text-greige">
          {durationLabel(plan.duration_months)}
        </p>

        <p className="font-display text-[44px] text-charcoal-deep leading-none mb-1">
          ₹{plan.price.toLocaleString('en-IN')}
        </p>

        {perMonth && (
          <p className="text-[12px] font-body text-greige mb-4">
            ₹{perMonth.toLocaleString('en-IN')}/month
          </p>
        )}

        {plan.discount_percent > 0 && (
          <div className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 mb-2" style={{ background: 'linear-gradient(135deg, #E8DCC4 0%, #FAF8F5 100%)', border: '1px solid #E5DFD3' }}>
            <span className="text-[11px] font-body font-semibold text-gold-deep">Save {plan.discount_percent}%</span>
          </div>
        )}
      </div>

      <div className="px-6 pb-6">
        <Link href="/register" className={cn(
          'block w-full text-center py-3 rounded-xl text-[13px] font-body font-semibold transition-all',
          highlight
            ? 'text-ivory-cream hover:opacity-90'
            : 'bg-ivory-warm border border-sand-light text-charcoal-deep hover:border-champagne hover:bg-champagne/30',
        )} style={highlight ? { background: 'linear-gradient(135deg, #C9A962 0%, #9A7F35 100%)' } : {}}>
          Get started
        </Link>
      </div>
    </div>
  )
}

function Plans() {
  const [tab, setTab] = useState<'patient' | 'org'>('patient')
  const [plans, setPlans] = useState<PlanOut[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    planApi.getPublicPlans(tab)
      .then(setPlans)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [tab])

  return (
    <section id="plans" className="bg-ivory-cream py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <p className="text-[11px] font-body uppercase tracking-[0.22em] text-gold-deep font-semibold text-center mb-3">Pricing</p>
        <h2 className="font-display text-[42px] sm:text-[52px] text-charcoal-deep text-center leading-tight mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-[14px] font-body text-stone text-center mb-10 max-w-sm mx-auto">
          No hidden charges. Pay once, stay covered.
        </p>

        {/* Toggle */}
        <div className="flex justify-center mb-12">
          <div className="flex bg-parchment border border-sand-light rounded-2xl p-1.5 gap-1">
            {(['patient', 'org'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'flex items-center gap-2 px-7 py-2.5 rounded-xl text-[13px] font-body font-medium transition-all',
                  tab === t ? 'bg-white text-charcoal-deep shadow-sm border border-sand-light' : 'text-stone hover:text-charcoal-deep',
                )}
              >
                {t === 'patient' ? <User className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                {t === 'patient' ? 'Patient' : 'Organisation'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 text-gold-soft animate-spin" /></div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <AlertCircle className="w-5 h-5 text-greige" />
            <p className="text-[13px] font-body text-stone">Could not load plans. Please refresh.</p>
          </div>
        ) : plans.length === 0 ? (
          <p className="text-center text-[13px] font-body text-stone py-16">No plans available right now.</p>
        ) : (
          <div className={cn(
            'grid gap-5',
            plans.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' :
            plans.length === 4 ? 'grid-cols-2 lg:grid-cols-4' :
            'grid-cols-2 lg:grid-cols-5',
          )}>
            {plans.map(p => <PlanCard key={p.id} plan={p} />)}
          </div>
        )}

        <p className="text-center text-[12px] font-body text-greige mt-8">
          All plans include OCR scanning, consent management, AI insights, and health timeline.
        </p>
      </div>
    </section>
  )
}

// ─── Stats ─────────────────────────────────────────────────────────────────────
function Stats() {
  return (
    <section className="bg-white border-y border-sand-light py-20 px-6">
      <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-8 divide-y sm:divide-y-0 sm:divide-x divide-sand-light">
        {[
          ['10,000+', 'Health records digitised', 'and growing daily'],
          ['99.9%', 'Platform uptime SLA', 'guaranteed always-on'],
          ['3×', 'Faster record retrieval', 'vs paper-based systems'],
          ['100%', 'India data residency', 'your data never leaves'],
        ].map(([v, l, sub]) => (
          <div key={l} className="text-center pt-8 sm:pt-0 sm:px-8 first:pt-0 first:pl-0 last:pr-0">
            <p className="font-display text-[52px] text-charcoal-deep leading-none mb-2">{v}</p>
            <p className="text-[13px] font-body font-semibold text-charcoal-deep mb-1">{l}</p>
            <p className="text-[11px] font-body text-greige">{sub}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Get Started ───────────────────────────────────────────────────────────────
function GetStarted() {
  return (
    <section id="get-started" className="bg-ivory-warm py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <p className="text-[11px] font-body uppercase tracking-[0.22em] text-gold-deep font-semibold text-center mb-3">Onboarding</p>
        <h2 className="font-display text-[42px] sm:text-[52px] text-charcoal-deep text-center leading-tight mb-4">
          How to get started
        </h2>
        <p className="text-[14px] font-body text-stone text-center max-w-md mx-auto mb-14">
          Two paths. One platform. Both designed to get you running as fast as possible.
        </p>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Patient */}
          <div className="relative rounded-2xl overflow-hidden border border-sand-light" style={{ background: 'linear-gradient(140deg, #2D2A26 0%, #1A1816 100%)' }}>
            <div className="absolute top-0 right-0 w-56 h-56 rounded-full -translate-y-1/2 translate-x-1/3 opacity-20" style={{ background: 'radial-gradient(circle, #C9A962 0%, transparent 70%)' }} />
            <div className="relative p-8 sm:p-10">
              <div className="w-12 h-12 rounded-xl bg-gold-soft/15 flex items-center justify-center mb-6 border border-gold-soft/20">
                <User className="w-6 h-6 text-gold-soft" />
              </div>
              <h3 className="font-display text-[32px] text-ivory-cream mb-2">For Patients</h3>
              <p className="text-[13px] font-body text-ivory-cream/50 mb-8 leading-[1.7]">
                Sign up directly, pick a plan, and you&apos;re in. No approvals, no waiting.
              </p>
              <ol className="space-y-3.5 mb-8">
                {['Create your account', 'Select a subscription plan', 'Complete payment via Razorpay', 'Access your personal health dashboard'].map((s, i) => (
                  <li key={s} className="flex items-center gap-3 text-[13px] font-body text-ivory-cream/75">
                    <span className="w-6 h-6 rounded-full bg-gold-soft/20 border border-gold-soft/30 text-gold-soft text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
              <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-body font-semibold transition-all" style={{ background: 'linear-gradient(135deg, #C9A962 0%, #9A7F35 100%)', color: '#1A1816' }}>
                Register now <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Organisation */}
          <div className="relative rounded-2xl overflow-hidden border border-sand-light bg-white">
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #C9A962 0%, #9A7F35 100%)' }} />
            <div className="p-8 sm:p-10">
              <div className="w-12 h-12 rounded-xl bg-champagne flex items-center justify-center mb-6 border border-sand-light">
                <Building2 className="w-6 h-6 text-gold-deep" />
              </div>
              <h3 className="font-display text-[32px] text-charcoal-deep mb-2">For Organisations</h3>
              <p className="text-[13px] font-body text-stone mb-8 leading-[1.7]">
                Quick verification before access. We handle the onboarding — you focus on care.
              </p>
              <ol className="space-y-3.5 mb-8">
                {['Email us your org details & documents', 'Share your SPOC information', 'We verify and create your account', 'Receive your team registration link'].map((s, i) => (
                  <li key={s} className="flex items-center gap-3 text-[13px] font-body text-charcoal-deep">
                    <span className="w-6 h-6 rounded-full bg-champagne border border-sand-light text-gold-deep text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
              <a href="mailto:onboarding@glimmora.ai" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-sand-light text-charcoal-deep text-[13px] font-body font-medium hover:border-champagne hover:bg-champagne/30 transition-all">
                <Mail className="w-4 h-4 text-gold-deep" /> onboarding@glimmora.ai
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── CTA ───────────────────────────────────────────────────────────────────────
function CTABanner() {
  return (
    <section className="bg-white py-10 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="relative rounded-3xl px-8 sm:px-16 py-16 text-center overflow-hidden border border-ivory-cream/5" style={{ background: 'linear-gradient(160deg, #1A1816 0%, #2D2A26 60%, #3D3228 100%)' }}>
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #C9A962 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(201,169,98,0.08) 0%, transparent 70%)' }} />

          <div className="relative">
            <div className="flex justify-center gap-0.5 mb-5">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-gold-soft fill-gold-soft" />)}
            </div>
            <h2 className="font-display text-[38px] sm:text-[50px] text-ivory-cream mb-4 leading-tight">
              Ready to take control<br />
              <span className="italic text-gold-soft">of your health data?</span>
            </h2>
            <p className="text-[14px] font-body text-ivory-cream/40 max-w-md mx-auto mb-9 leading-[1.7]">
              Join thousands of patients and healthcare providers already using GlimmoraCare.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-[14px] font-body font-semibold transition-all shadow-lg" style={{ background: 'linear-gradient(135deg, #C9A962 0%, #9A7F35 100%)', color: '#1A1816' }}>
                Get started free <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="mailto:onboarding@glimmora.ai" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-ivory-cream/15 text-ivory-cream text-[14px] font-body font-medium hover:border-ivory-cream/30 hover:bg-ivory-cream/5 transition-all">
                <Mail className="w-4 h-4" /> Contact for orgs
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="pt-16 pb-8 px-6" style={{ background: 'linear-gradient(160deg, #1A1816 0%, #2D2A26 100%)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-12">
          <div>
            <span className="font-display text-[28px] text-ivory-cream">
              Glimmora<span className="text-gold-soft italic">Care</span>
            </span>
            <p className="text-[12px] font-body text-ivory-cream/35 mt-3 max-w-[240px] leading-[1.8]">
              Preventive health intelligence for patients and healthcare organisations across India.
            </p>
            <div className="flex gap-2 mt-5">
              {['Twitter', 'LinkedIn'].map(s => (
                <a key={s} href="#" className="text-[11px] font-body text-ivory-cream/35 hover:text-ivory-cream transition-colors border border-ivory-cream/10 rounded-lg px-3 py-1.5">{s}</a>
              ))}
            </div>
          </div>

          {[
            ['Product', ['#features', 'Features'], ['#plans', 'Pricing'], ['#get-started', 'Get Started']],
            ['Legal', ['/privacy-policy', 'Privacy Policy'], ['/terms-of-use', 'Terms of Use'], ['/data-processing', 'Data Processing']],
            ['Contact', ['mailto:support@glimmora.ai', 'support@glimmora.ai'], ['mailto:onboarding@glimmora.ai', 'onboarding@glimmora.ai']],
          ].map(([heading, ...links]) => (
            <div key={heading as string}>
              <p className="text-[10px] font-body font-semibold text-ivory-cream/50 uppercase tracking-[0.2em] mb-4">{heading}</p>
              <div className="space-y-2.5">
                {(links as string[][]).map(([href, label]) => (
                  <a key={href} href={href} className="block text-[13px] font-body text-ivory-cream/40 hover:text-ivory-cream/80 transition-colors">{label}</a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-ivory-cream/8 pt-6 flex flex-col sm:flex-row justify-between gap-2 text-[11px] font-body text-ivory-cream/25">
          <p>© {new Date().getFullYear()} Glimmora Technologies Pvt. Ltd. All rights reserved.</p>
          <p>Made with care in India</p>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />

      <Problem />
      <Features />
      <HowItWorks />
      <SecurityBanner />
      <Plans />
      <Stats />
      <GetStarted />
      <CTABanner />
      <Footer />
    </div>
  )
}
