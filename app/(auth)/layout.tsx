import type { ReactNode } from 'react'
import { Sparkles, Shield, Brain, Activity } from 'lucide-react'

const FEATURES = [
  { icon: Shield,   text: 'End-to-end encrypted health records' },
  { icon: Brain,    text: 'Preventive AI insights & risk scoring' },
  { icon: Activity, text: 'Real-time digital twin monitoring' },
]

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel (hidden on mobile) ── */}
      <div
        className="hidden lg:flex lg:w-[46%] xl:w-[42%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #1E1A16 0%, #2D2A26 55%, #16140F 100%)' }}
      >
        {/* Decorative orb */}
        <div
          className="absolute top-0 right-0 w-96 h-96 opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #C9A962 0%, transparent 65%)', transform: 'translate(30%, -30%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-72 h-72 opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6B84A4 0%, transparent 65%)', transform: 'translate(-30%, 30%)' }}
        />

        {/* Logo */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-soft/30 to-gold-deep/10 border border-gold-soft/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-gold-soft" />
            </div>
            <h1 className="font-display text-3xl text-ivory-cream tracking-tight leading-none">
              Glimmora<span className="text-gold-soft italic">Care</span>
            </h1>
          </div>
          <p className="text-xs text-ivory-cream/30 font-body uppercase tracking-widest ml-[52px]">
            Preventive Intelligence Engine
          </p>
        </div>

        {/* Hero text */}
        <div className="relative space-y-6">
          <div>
            <p className="text-[11px] text-gold-soft/60 font-body uppercase tracking-widest mb-3">
              Trusted by 2,400+ patients across Maharashtra
            </p>
            <h2 className="font-display text-5xl xl:text-6xl text-ivory-cream tracking-tight leading-[1.05]">
              Your health,<br />
              <span className="text-gold-soft italic">intelligently</span><br />
              protected.
            </h2>
            <p className="mt-5 text-sm text-ivory-cream/40 font-body leading-relaxed max-w-xs">
              Upload records, track markers, and receive personalised preventive insights — all in one secure platform.
            </p>
          </div>

          {/* Feature bullets */}
          <div className="space-y-3 pt-2">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-gold-soft/10 border border-gold-soft/20 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-gold-soft" />
                </div>
                <p className="text-sm text-ivory-cream/60 font-body">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative">
          <p className="text-[10px] text-ivory-cream/20 font-body">
            © 2026 GlimmoraCare · DPDP Act 2023 compliant · AES-256 encrypted
          </p>
        </div>
      </div>

      {/* ── Right: form area ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-gradient-to-br from-ivory-cream via-white to-parchment">
        {/* Mobile logo (shown only on small screens) */}
        <div className="lg:hidden text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-charcoal-deep flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-gold-soft" />
            </div>
            <h1 className="font-display text-3xl text-charcoal-deep tracking-tight">
              Glimmora<span className="text-gold-deep italic">Care</span>
            </h1>
          </div>
          <p className="text-xs text-greige font-body">Preventive Intelligence Engine</p>
        </div>

        {/* Form card */}
        <div className="w-full max-w-md">
          <div className="bg-white border border-sand-light rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.06)] p-7">
            {children}
          </div>
          <p className="text-center text-[10px] text-greige font-body mt-4">
            Secured with AES-256 encryption · DPDP Act 2023 compliant
          </p>
        </div>
      </div>
    </div>
  )
}
