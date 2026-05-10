'use client'

import { useEffect, useState } from 'react'
import {
  CreditCard, CheckCircle, AlertCircle, Clock, Loader2,
  RefreshCw, Check, Star, Shield, X, CalendarDays, Zap,
} from 'lucide-react'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardContent } from '@/components/ui/Card'
import { paymentApi, planApi, type OrgSubscriptionStatus, type SubscriptionListItem, type PlanOut } from '@/lib/api'
import { DashboardBackLink } from '@/components/layout/DashboardBackLink'
import { cn } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysLeft(iso: string | null | undefined): number | null {
  if (!iso) return null
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
}

function fmtPrice(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`
}

// ── Plan card (modal) ─────────────────────────────────────────────────────────

function PlanCard({ plan, selected, onSelect }: { plan: PlanOut; selected: boolean; onSelect: () => void }) {
  const perMonth = plan.duration_months > 1 ? Math.round(plan.price / plan.duration_months) : null
  const durationLabel =
    plan.duration_months === 0  ? '7-Day Trial' :
    plan.duration_months === 1  ? '1 Month' :
    plan.duration_months === 12 ? '1 Year' :
    plan.duration_months === 60 ? '5 Years' :
    `${plan.duration_months} Months`

  return (
    <button
      onClick={onSelect}
      className={cn(
        'relative flex flex-col text-left rounded-2xl border p-5 transition-all w-full',
        selected
          ? 'border-charcoal-deep bg-[#E8EBF0] shadow-md ring-2 ring-charcoal-deep/20'
          : 'border-sand-light bg-white hover:border-stone hover:shadow-sm',
      )}
    >
      {(plan.is_popular || plan.is_best_value) && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          {plan.is_best_value ? (
            <span className="bg-gold-deep text-white text-[10px] font-body font-semibold px-3 py-1 rounded-full tracking-wide uppercase flex items-center gap-1">
              <Star className="w-2.5 h-2.5 fill-white" /> Best Value
            </span>
          ) : (
            <span className="bg-charcoal-deep text-white text-[10px] font-body font-semibold px-3 py-1 rounded-full tracking-wide uppercase">
              Popular
            </span>
          )}
        </div>
      )}

      <p className="text-[10px] font-body font-semibold text-greige tracking-widest uppercase mb-2">{durationLabel}</p>
      <p className="font-display text-3xl text-charcoal-deep leading-none mb-0.5">₹{plan.price.toLocaleString('en-IN')}</p>
      {perMonth
        ? <p className="text-xs text-greige font-body">₹{perMonth.toLocaleString('en-IN')}/mo</p>
        : <p className="text-xs text-greige font-body opacity-0">—</p>
      }
      {plan.discount_percent > 0 && (
        <p className="text-[10px] font-body font-semibold text-emerald-600 mt-1">Save {plan.discount_percent}%</p>
      )}

      <div className="h-px bg-sand-light my-4" />

      <p className="text-[10px] font-body font-semibold text-greige uppercase tracking-wider mb-2">What you get</p>
      <ul className="space-y-2 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-stone font-body">
            <Check className={cn('w-3.5 h-3.5 shrink-0 mt-0.5', selected ? 'text-charcoal-deep' : 'text-greige')} />
            {f}
          </li>
        ))}
      </ul>
    </button>
  )
}

// ── Renew / Subscribe modal ───────────────────────────────────────────────────

function PlanModal({ isRenewal, onClose, onSuccess }: {
  isRenewal: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [plans, setPlans] = useState<PlanOut[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<PlanOut | null>(null)
  const [orderLoading, setOrderLoading] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    planApi.getPublicPlans('org')
      .then((ps) => { setPlans(ps); setSelected(ps.find((p) => p.is_popular) ?? ps[0] ?? null) })
      .catch(() => setError('Failed to load plans. Please refresh.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || window.Razorpay) return
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true
    document.body.appendChild(s)
  }, [])

  async function handlePay() {
    if (!selected) return
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    if (!keyId) { setError('Payment not configured. Contact support.'); return }
    if (!window.Razorpay) { setError('Payment SDK not loaded. Refresh and try again.'); return }
    setError(null)
    setOrderLoading(true)

    let orderId: string
    try {
      const res = await paymentApi.orgCreateOrder(selected.id, selected.price * 100)
      orderId = res.order_id
    } catch {
      setError('Could not create order. Please try again.')
      setOrderLoading(false)
      return
    }
    setOrderLoading(false)

    new window.Razorpay({
      key: keyId,
      amount: selected.price * 100,
      currency: 'INR',
      name: 'GlimmoraCare',
      description: `${selected.name} · Organisation Subscription`,
      order_id: orderId,
      theme: { color: '#B8860B' },
      handler: async (response) => {
        setPaying(true)
        try {
          await paymentApi.orgVerifyPayment({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            plan_id: selected.id,
            amount_paise: selected.price * 100,
          })
          onSuccess()
        } catch {
          setError('Payment received but verification failed. Contact support.')
        } finally {
          setPaying(false)
        }
      },
      modal: { ondismiss: () => setError('Payment was cancelled.') },
    }).open()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-noir/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sand-light shrink-0">
          <div>
            <h2 className="font-body text-lg font-bold text-charcoal-deep">
              {isRenewal ? 'Renew your subscription' : 'Subscribe your organisation'}
            </h2>
            <p className="text-xs text-greige font-body mt-0.5">
              Choose a plan — payment secured by Razorpay
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-greige hover:text-charcoal-deep hover:bg-sand-light transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Plans */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading && (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 text-gold-soft animate-spin" />
            </div>
          )}

          {!loading && plans.length > 0 && (
            <div className={cn(
              'grid gap-5 pt-2',
              plans.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' :
              plans.length === 4 ? 'grid-cols-2 lg:grid-cols-4' :
              'grid-cols-2 lg:grid-cols-5',
            )}>
              {plans.map((p) => (
                <PlanCard
                  key={p.id}
                  plan={p}
                  selected={selected?.id === p.id}
                  onSelect={() => { setSelected(p); setError(null) }}
                />
              ))}
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 bg-[#FEF2F2] border border-red-200 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <p className="text-xs font-body text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-sand-light shrink-0">
          <div className="text-xs text-greige font-body flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            {selected
              ? <>₹{selected.price.toLocaleString('en-IN')} · {selected.name} · Secured by Razorpay</>
              : 'Select a plan to continue'
            }
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-body text-stone hover:text-charcoal-deep hover:bg-sand-light transition-colors">
              Cancel
            </button>
            <button
              onClick={handlePay}
              disabled={!selected || orderLoading || paying}
              className={cn(
                'px-5 py-2.5 rounded-xl font-body font-semibold text-sm transition-all flex items-center gap-2',
                selected && !orderLoading && !paying
                  ? 'bg-charcoal-deep text-white hover:bg-noir shadow-sm'
                  : 'bg-sand-light text-greige cursor-not-allowed',
              )}
            >
              {orderLoading || paying
                ? <><Loader2 className="w-4 h-4 animate-spin" />{orderLoading ? 'Creating order…' : 'Verifying…'}</>
                : 'Pay & Activate →'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminSubscriptionPage() {
  const [sub, setSub] = useState<OrgSubscriptionStatus | null>(null)
  const [history, setHistory] = useState<SubscriptionListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  function load() {
    setLoading(true)
    setError(null)
    Promise.all([
      paymentApi.orgGetSubscription(),
      paymentApi.orgListSubscriptions().catch(() => [] as SubscriptionListItem[]),
    ])
      .then(([status, hist]) => { setSub(status); setHistory(hist) })
      .catch(() => setError('Failed to load subscription details.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const days = daysLeft(sub?.expires_at)
  const isActive = sub?.status === 'active'
  const isExpired = sub?.status === 'expired'
  const isNone = sub?.status === 'none'
  const expiringSoon = isActive && days !== null && days <= 30
  const isRenewal = isExpired || expiringSoon

  const actionLabel =
    isNone    ? 'Subscribe now' :
    isExpired ? 'Renew subscription' :
    expiringSoon ? 'Renew early' :
    'Upgrade / change plan'

  return (
    <RoleGuard allowed={['admin']}>
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <DashboardBackLink />

        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-body text-2xl lg:text-3xl font-bold text-charcoal-deep">
              Subscription
            </h1>
            <p className="text-sm text-stone font-body mt-1">
              Manage your organisation&apos;s plan and billing.
            </p>
          </div>
          <button onClick={load} className="p-2 rounded-lg text-greige hover:text-charcoal-deep hover:bg-sand-light transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-gold-soft animate-spin" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-[#FEF2F2] border border-red-200 rounded-xl p-4">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-sm font-body text-red-700">{error}</p>
          </div>
        )}

        {!loading && sub && (
          <>
            {/* Status hero card */}
            <div className={cn(
              'rounded-2xl border p-6',
              isActive && !expiringSoon ? 'bg-emerald-50 border-emerald-200' :
              expiringSoon             ? 'bg-amber-50 border-amber-200' :
              isExpired                ? 'bg-red-50 border-red-200' :
                                         'bg-parchment border-sand-light',
            )}>
              <div className="flex items-start gap-4">
                <div className={cn(
                  'w-11 h-11 rounded-full flex items-center justify-center shrink-0',
                  isActive && !expiringSoon ? 'bg-emerald-100' :
                  expiringSoon             ? 'bg-amber-100' :
                  isExpired                ? 'bg-red-100' : 'bg-sand-light',
                )}>
                  {isActive && !expiringSoon && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                  {expiringSoon            && <Clock className="w-5 h-5 text-amber-600" />}
                  {isExpired               && <AlertCircle className="w-5 h-5 text-red-500" />}
                  {isNone                  && <CreditCard className="w-5 h-5 text-greige" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-body font-semibold text-charcoal-deep text-base">
                    {isNone ? 'No active subscription'
                    : isExpired ? `${sub.plan_name ?? 'Subscription'} expired`
                    : sub.plan_name ?? 'Active plan'}
                  </p>
                  <p className="text-sm text-stone font-body mt-0.5">
                    {isNone     && 'Subscribe to unlock all features for your doctors and team.'}
                    {isExpired  && <>Expired on <span className="font-medium text-charcoal-deep">{fmt(sub.expires_at)}</span>. Renew to restore access.</>}
                    {isActive && !expiringSoon && <>Valid until <span className="font-medium text-charcoal-deep">{fmt(sub.expires_at)}</span>.</>}
                    {expiringSoon && <>Expires in <span className="font-semibold text-amber-700">{days} days</span> — renew to avoid disruption.</>}
                  </p>
                </div>

                <button
                  onClick={() => setShowModal(true)}
                  className={cn(
                    'shrink-0 px-4 py-2 rounded-xl font-body font-semibold text-sm transition-all',
                    isNone || isExpired
                      ? 'bg-charcoal-deep text-white hover:bg-noir'
                      : 'bg-white border border-sand-light text-charcoal-deep hover:border-gold-soft',
                  )}
                >
                  {actionLabel}
                </button>
              </div>

              {/* Quick stats row for active plans */}
              {isActive && (
                <div className="mt-4 pt-4 border-t border-black/5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-3.5 h-3.5 text-greige shrink-0" />
                    <div>
                      <p className="text-[10px] text-greige font-body uppercase tracking-wider">Expires</p>
                      <p className="text-xs font-body font-semibold text-charcoal-deep">{fmt(sub.expires_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-greige shrink-0" />
                    <div>
                      <p className="text-[10px] text-greige font-body uppercase tracking-wider">Plan</p>
                      <p className="text-xs font-body font-semibold text-charcoal-deep">{sub.plan_name ?? '—'}</p>
                    </div>
                  </div>
                  {sub.subscription_id && (
                    <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                      <CreditCard className="w-3.5 h-3.5 text-greige shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-greige font-body uppercase tracking-wider">Ref</p>
                        <p className="text-[10px] font-mono text-charcoal-deep truncate">{sub.subscription_id}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment history */}
            {history.length > 0 && (
              <div>
                <p className="text-sm font-body font-semibold text-charcoal-deep mb-3">Payment History</p>
                <div className="space-y-2">
                  {history.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-body font-semibold text-charcoal-deep">{item.plan_name ?? '—'}</p>
                              <span className={cn(
                                'text-[10px] font-body font-semibold px-2 py-0.5 rounded-full',
                                item.status === 'active'    ? 'bg-emerald-100 text-emerald-700' :
                                item.status === 'expired'   ? 'bg-red-100 text-red-700' :
                                item.status === 'pending'   ? 'bg-amber-100 text-amber-700' :
                                                              'bg-sand-light text-greige',
                              )}>
                                {item.status}
                              </span>
                            </div>
                            <p className="text-xs text-greige font-body mt-0.5">
                              {fmtPrice(item.amount_paise)}
                              {item.starts_at  && <> · {fmt(item.starts_at)}</>}
                              {item.expires_at && <> → {fmt(item.expires_at)}</>}
                            </p>
                          </div>
                          {item.razorpay_payment_id && (
                            <p className="font-mono text-[10px] text-greige shrink-0 hidden sm:block">
                              {item.razorpay_payment_id}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <PlanModal
          isRenewal={isRenewal ?? false}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); load() }}
        />
      )}
    </RoleGuard>
  )
}
