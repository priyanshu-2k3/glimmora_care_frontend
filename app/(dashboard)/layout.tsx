'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { paymentApi } from '@/lib/api'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { ToastProvider } from '@/components/ui/Toast'

// Pages a patient with no subscription is still allowed to visit
const PATIENT_EXEMPT = ['/subscription']

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [subChecked, setSubChecked] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, isLoading, router])

  // For patients: check subscription on every dashboard entry
  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return
    if (user.role !== 'patient') { setSubChecked(true); return }
    if (PATIENT_EXEMPT.some((p) => pathname.startsWith(p))) { setSubChecked(true); return }

    paymentApi.patientGetSubscription()
      .then((sub) => {
        const expired = sub.expires_at && new Date(sub.expires_at) < new Date()
        if (sub.status !== 'active' || expired) {
          router.replace('/select-plan?renew=1')
        } else {
          setSubChecked(true)
        }
      })
      .catch(() => {
        // 404 = no subscription at all
        router.replace('/select-plan')
      })
  }, [isLoading, isAuthenticated, user, pathname, router])

  // Render loading shell while auth state is resolving OR while we redirect
  // an unauthenticated user. Never render dashboard children until
  // isAuthenticated === true — this prevents any flash of protected UI
  // when the user hits a /(dashboard) URL directly.
  const waitingForSubCheck = user?.role === 'patient' && !subChecked &&
    !PATIENT_EXEMPT.some((p) => pathname.startsWith(p))

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
          <div
            className="absolute inset-0 bg-noir/30 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
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
