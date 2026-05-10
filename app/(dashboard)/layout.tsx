'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { paymentApi, type OrgSubscriptionStatus } from '@/lib/api'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { ToastProvider } from '@/components/ui/Toast'
import { Building2, AlertCircle, LogOut } from 'lucide-react'

// These pages are accessible inside the dashboard even without an active subscription
const PATIENT_EXEMPT = ['/subscription', '/payments']
const ORG_EXEMPT     = ['/admin/subscription']

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, logout } = useAuth()
  const router   = useRouter()
  const pathname = usePathname()

  const [sidebarOpen,  setSidebarOpen]  = useState(false)
  const [subChecked,   setSubChecked]   = useState(false)
  const [orgSubStatus, setOrgSubStatus] = useState<OrgSubscriptionStatus | null>(null)

  // Ref so we only hit the subscription API once per session, not on every navigation
  const subFetchedRef = useRef(false)

  // ── Auth redirect ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, isLoading, router])

  // ── Subscription check (runs once after user is known) ──────────────────────
  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return
    if (subFetchedRef.current) return   // already fetched — skip re-check on every nav

    subFetchedRef.current = true

    if (user.role === 'patient') {
      // Pages like /subscription are always accessible — skip the gate
      if (PATIENT_EXEMPT.some((p) => pathname.startsWith(p))) {
        setSubChecked(true)
        return
      }

      paymentApi.patientGetSubscription()
        .then((sub) => {
          const expired = sub.expires_at && new Date(sub.expires_at) < new Date()
          if (sub.status !== 'active' || expired) {
            router.replace('/select-plan?renew=1')
          } else {
            setSubChecked(true)
          }
        })
        .catch((err: { status?: number }) => {
          if (err?.status === 404) {
            // No subscription at all → go pick a plan
            router.replace('/select-plan')
          } else {
            // Network / auth error — let them in, the backend will enforce access per-route
            setSubChecked(true)
          }
        })
      return
    }

    if (user.role === 'admin' || user.role === 'doctor') {
      paymentApi.orgGetSubscription()
        .then((status) => {
          setOrgSubStatus(status)
          setSubChecked(true)
        })
        .catch(() => {
          // Can't reach subscription API — assume no subscription
          setOrgSubStatus({ status: 'none', expires_at: null, plan_name: null, subscription_id: null })
          setSubChecked(true)
        })
      return
    }

    // super_admin, family_admin, etc. — no gate
    setSubChecked(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated, user])
  // ↑ pathname intentionally excluded — we only want ONE fetch per login session.
  //   PATIENT_EXEMPT / ORG_EXEMPT pages are handled by rendering children directly below.

  // ── Org subscription blocking screens ──────────────────────────────────────
  const orgBlocked =
    subChecked &&
    orgSubStatus &&
    orgSubStatus.status !== 'active' &&
    !ORG_EXEMPT.some((p) => pathname.startsWith(p))

  if (orgBlocked) {
    if (user?.role === 'admin') {
      const isExpired = orgSubStatus!.status === 'expired'
      return (
        <div className="min-h-screen bg-[#F9F7F4] flex flex-col">
          <header className="bg-[#1A1A1A] px-6 py-4 flex items-center justify-between">
            <span className="font-display text-xl text-white">Glimmora<span className="text-[#B8860B] italic">Care</span></span>
            <button onClick={logout} className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 font-body transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </header>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-5 max-w-sm">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                <Building2 className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="font-display text-3xl text-[#1F2937]">
                {isExpired ? 'Subscription expired' : 'No active subscription'}
              </h2>
              <p className="text-sm text-[#6B7280] font-body">
                {isExpired
                  ? `Your organisation's ${orgSubStatus!.plan_name ?? 'plan'} expired. Renew to restore access for your team.`
                  : 'Your organisation needs an active subscription to access the dashboard.'}
              </p>
              <button
                onClick={() => router.push('/admin/subscription')}
                className="w-full py-3.5 rounded-xl bg-[#1F2937] text-white font-body font-semibold text-sm hover:bg-[#111827] transition-colors"
              >
                {isExpired ? 'Renew subscription →' : 'Subscribe now →'}
              </button>
            </div>
          </div>
        </div>
      )
    }

    if (user?.role === 'doctor') {
      return (
        <div className="min-h-screen bg-[#F9F7F4] flex flex-col">
          <header className="bg-[#1A1A1A] px-6 py-4 flex items-center justify-between">
            <span className="font-display text-xl text-white">Glimmora<span className="text-[#B8860B] italic">Care</span></span>
            <button onClick={logout} className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 font-body transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </header>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-5 max-w-sm">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="font-display text-3xl text-[#1F2937]">Access restricted</h2>
              <p className="text-sm text-[#6B7280] font-body">
                Your organisation doesn&apos;t have an active subscription. Please ask your admin to subscribe to restore access.
              </p>
            </div>
          </div>
        </div>
      )
    }
  }

  // ── Loading / waiting spinner ───────────────────────────────────────────────
  const waitingForSubCheck = !subChecked && (
    user?.role === 'patient' || user?.role === 'admin' || user?.role === 'doctor'
  )

  if (isLoading || !isAuthenticated || waitingForSubCheck) {
    return (
      <div className="min-h-screen bg-dawn-luxury flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-3xl text-charcoal-deep tracking-tight mb-2">
            Glimmora<span className="text-gold-soft italic">Care</span>
          </h1>
          <div className="w-8 h-8 border-2 border-gold-soft border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  // ── Dashboard shell ─────────────────────────────────────────────────────────
  return (
    <ToastProvider>
      <div className="flex h-screen bg-ivory-cream overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:w-56 lg:shrink-0">
          <Sidebar />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-noir/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-64 z-50">
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
