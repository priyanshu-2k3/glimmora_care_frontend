'use client'

import { useState, useEffect } from 'react'
import { Receipt, CheckCircle, Clock, XCircle, Loader2, ExternalLink } from 'lucide-react'
import { paymentApi, type SubscriptionListItem } from '@/lib/api'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { DashboardBackLink } from '@/components/layout/DashboardBackLink'
import { cn } from '@/lib/utils'

function fmt(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'active') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-body font-semibold">
      <CheckCircle className="w-3 h-3" /> Active
    </span>
  )
  if (status === 'expired') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-body font-semibold">
      <Clock className="w-3 h-3" /> Expired
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-body font-semibold">
      <XCircle className="w-3 h-3" /> {status}
    </span>
  )
}

function PaymentsInner() {
  const [payments, setPayments] = useState<SubscriptionListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    paymentApi.patientGetPaymentHistory()
      .then(setPayments)
      .catch(() => setError('Failed to load payment history.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <DashboardBackLink />

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gold-soft/15 flex items-center justify-center shrink-0">
          <Receipt className="w-5 h-5 text-gold-deep" />
        </div>
        <div>
          <h1 className="font-display text-2xl text-charcoal-deep">Payment History</h1>
          <p className="text-sm text-greige font-body">All your subscription payments</p>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-gold-deep animate-spin" />
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 font-body">
          {error}
        </div>
      )}

      {!loading && !error && payments.length === 0 && (
        <div className="text-center py-16">
          <Receipt className="w-10 h-10 text-greige mx-auto mb-3" />
          <p className="text-sm text-greige font-body">No payments yet</p>
        </div>
      )}

      {!loading && !error && payments.length > 0 && (
        <div className="space-y-3">
          {payments.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-sand-light p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-gold-soft/10 flex items-center justify-center shrink-0">
                <Receipt className="w-4 h-4 text-gold-deep" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-body font-semibold text-charcoal-deep">
                  {p.plan_name ?? 'Subscription'}
                </p>
                <p className="text-xs text-greige font-body mt-0.5">
                  {fmt(p.starts_at)} — {fmt(p.expires_at)}
                </p>
                {p.razorpay_payment_id && (
                  <p className="text-[10px] font-mono text-greige mt-1 truncate">
                    {p.razorpay_payment_id}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <p className={cn(
                  'text-base font-display',
                  p.status === 'active' ? 'text-charcoal-deep' : 'text-greige'
                )}>
                  ₹{(p.amount_paise / 100).toLocaleString('en-IN')}
                </p>
                <StatusBadge status={p.status} />
              </div>

              {p.razorpay_payment_link_url && (
                <a
                  href={p.razorpay_payment_link_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-greige hover:text-gold-deep transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PaymentsPage() {
  return (
    <RoleGuard allowed={['patient']}>
      <PaymentsInner />
    </RoleGuard>
  )
}
