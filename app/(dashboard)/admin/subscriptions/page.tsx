'use client'

import { useEffect, useState } from 'react'
import { CreditCard, Loader2, Building2, AlertCircle, ExternalLink } from 'lucide-react'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { paymentApi, type SubscriptionListItem } from '@/lib/api'
import { DashboardBackLink } from '@/components/layout/DashboardBackLink'

const STATUS_FILTERS = ['all', 'active', 'pending', 'expired', 'cancelled'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

function statusBadge(status: string) {
  if (status === 'active') return <Badge variant="success">Active</Badge>
  if (status === 'pending') return <Badge variant="warning">Pending</Badge>
  if (status === 'expired') return <Badge variant="error">Expired</Badge>
  if (status === 'cancelled') return <Badge variant="default">Cancelled</Badge>
  return <Badge variant="default">{status}</Badge>
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtAmount(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`
}

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<SubscriptionListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    paymentApi.listSubscriptions(filter === 'all' ? undefined : filter)
      .then(setSubs)
      .catch(() => setError('Failed to load subscriptions.'))
      .finally(() => setLoading(false))
  }, [filter])

  return (
    <RoleGuard allowedRoles={['super_admin']}>
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        <DashboardBackLink />

        <div>
          <h1 className="font-body text-2xl lg:text-3xl font-bold text-charcoal-deep flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gold-soft" />
            Subscriptions
          </h1>
          <p className="text-sm text-stone font-body mt-1">All payment and subscription records across the platform.</p>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium capitalize transition-colors border ${
                filter === s
                  ? 'bg-charcoal-deep text-white border-charcoal-deep'
                  : 'bg-white text-stone border-sand-light hover:border-gold-soft hover:text-charcoal-deep'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-gold-soft animate-spin" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-[#FEF2F2] border border-[#DC2626]/20 rounded-xl p-4">
            <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0" />
            <p className="text-sm font-body text-[#B91C1C]">{error}</p>
          </div>
        )}

        {!loading && !error && subs.length === 0 && (
          <Card className="text-center py-12">
            <CreditCard className="w-10 h-10 text-greige mx-auto mb-3" />
            <p className="text-sm text-greige font-body">No subscriptions found.</p>
          </Card>
        )}

        {!loading && !error && subs.length > 0 && (
          <div className="space-y-3">
            {subs.map((sub) => (
              <Card key={sub.id} hover>
                <CardContent>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-gold-whisper border border-gold-soft/40 flex items-center justify-center shrink-0 mt-0.5">
                        <Building2 className="w-4 h-4 text-gold-deep" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-body font-semibold text-charcoal-deep text-sm">
                          {sub.org_name ?? 'Unknown org'}
                        </p>
                        <p className="text-xs text-greige font-body">
                          {sub.plan_name ?? '—'} · {fmtAmount(sub.amount_paise)}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-greige font-body flex-wrap pt-0.5">
                          <span>Start: {fmt(sub.starts_at)}</span>
                          <span>Expires: {fmt(sub.expires_at)}</span>
                          {sub.razorpay_payment_id && (
                            <span className="font-mono text-[10px]">ID: {sub.razorpay_payment_id}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {statusBadge(sub.status)}
                      {sub.razorpay_payment_link_url && (
                        <a
                          href={sub.razorpay_payment_link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-greige hover:text-sapphire-deep hover:bg-azure-whisper transition-colors"
                          title="Open payment link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
