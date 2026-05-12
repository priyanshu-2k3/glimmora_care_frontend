'use client'

import { useState, useEffect } from 'react'
import {
  CreditCard, CheckCircle, AlertCircle, Shield,
  Loader2, Clock, Star, X,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { paymentApi, planApi, type PlanOut, type PatientVerifyResponse, type SubscriptionOut } from '@/lib/api'
import { DashboardBackLink } from '@/components/layout/DashboardBackLink'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { useToast } from '@/components/ui/Toast'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

function daysLeft(iso: string | null | undefined) {
  if (!iso) return null
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
}

function useRazorpayScript() {
  useEffect(() => {
    if (typeof window === 'undefined' || window.Razorpay) return
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true
    document.body.appendChild(s)
  }, [])
}

// ── Plan card ─────────────────────────────────────────────────────────────────

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
          ? 'border-charcoal-deep bg-[#F0F0F5] shadow-md ring-2 ring-charcoal-deep/20'
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
        : <p className="text-xs text-transparent select-none">—</p>
      }
      {plan.discount_percent > 0 && (
        <span className="mt-1.5 inline-block text-[10px] font-body font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
          Save {plan.discount_percent}%
        </span>
      )}
    </button>
  )
}

// ── Pay modal ─────────────────────────────────────────────────────────────────

function PayModal({ plans, onClose, onSuccess }: {
  plans: PlanOut[]
  onClose: () => void
  onSuccess: (result: PatientVerifyResponse) => void
}) {
  const [selected, setSelected] = useState<PlanOut | null>(
    plans.find((p) => p.is_popular) ?? plans[0] ?? null,
  )
  const [orderLoading, setOrderLoading] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  async function handlePay() {
    if (!selected) return
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    if (!keyId) { setError('Payment not configured. Contact support.'); return }
    if (!window.Razorpay) { setError('Payment SDK not loaded. Refresh and try again.'); return }
    setError(null)
    setOrderLoading(true)

    let orderId: string
    try {
      const res = await paymentApi.patientCreateOrder(selected.id, selected.price * 100)
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
      description: `${selected.name} · Patient Subscription`,
      order_id: orderId,
      theme: { color: '#B8860B' },
      handler: async (response) => {
        setPaying(true)
        try {
          const result = await paymentApi.patientVerifyPayment({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            plan_id: selected.id,
            amount_paise: selected.price * 100,
          })
          toast.success(`Subscription activated — ₹${selected.price.toLocaleString('en-IN')} paid for ${selected.name}.`)
          onSuccess(result)
        } catch {
          toast.error('Payment received but verification failed. Please contact support.')
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-sand-light shrink-0">
          <div>
            <h2 className="font-body text-lg font-bold text-charcoal-deep">Choose your plan</h2>
            <p className="text-xs text-greige font-body mt-0.5">Payment secured by Razorpay</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-greige hover:text-charcoal-deep hover:bg-sand-light transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className={cn(
            'grid gap-5 pt-2',
            plans.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' :
            plans.length === 4 ? 'grid-cols-2 lg:grid-cols-4' :
            'grid-cols-2 lg:grid-cols-5',
          )}>
            {plans.map((p) => (
              <PlanCard key={p.id} plan={p} selected={selected?.id === p.id} onSelect={() => { setSelected(p); setError(null) }} />
            ))}
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 bg-[#FEF2F2] border border-red-200 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <p className="text-xs font-body text-red-700">{error}</p>
            </div>
          )}

          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <p className="text-xs font-body font-semibold text-amber-800">Test Mode</p>
            <p className="text-xs font-body text-amber-700 mt-0.5">
              Card: <span className="font-mono font-semibold">4111 1111 1111 1111</span> · any expiry · any CVV
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-sand-light shrink-0">
          <div className="text-xs text-greige font-body flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            {selected ? <>₹{selected.price.toLocaleString('en-IN')} · {selected.name}</> : 'Select a plan'}
          </div>
          <div className="flex items-center gap-2">
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

export default function PatientSubscriptionPage() {
  useRazorpayScript()

  const [plans,       setPlans]       = useState<PlanOut[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [currentSub,  setCurrentSub]  = useState<SubscriptionOut | null>(null)
  const [subLoading,  setSubLoading]  = useState(true)
  const [showModal,   setShowModal]   = useState(false)
  const [success,     setSuccess]     = useState<PatientVerifyResponse | null>(null)
  const [subError,    setSubError]    = useState<string | null>(null)

  function loadSub() {
    setSubError(null)
    paymentApi.patientGetSubscription()
      .then((s) => { setCurrentSub(s); setSubError(null) })
      .catch((err: { status?: number }) => {
        if (err?.status === 404) {
          setCurrentSub(null)
        } else {
          setSubError('Could not load subscription. Please refresh.')
        }
      })
      .finally(() => setSubLoading(false))
  }

  useEffect(() => {
    planApi.getPublicPlans('patient')
      .then(setPlans)
      .catch(() => {})
      .finally(() => setPlansLoading(false))

    loadSub()
  }, [])

  const days = daysLeft(currentSub?.expires_at)
  const isActive    = currentSub?.status === 'active' && (days === null || days > 0)
  const isExpiring  = isActive && days !== null && days <= 30
  const isExpired   = !isActive && currentSub !== null
  const planName    = (currentSub?.plan_snapshot as Record<string, string>)?.name ?? currentSub?.plan_snapshot?.['name'] ?? 'Patient Plan'

  return (
    <RoleGuard allowed={['patient']}>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <DashboardBackLink />

        <h1 className="font-body text-2xl lg:text-3xl font-bold text-charcoal-deep">
          My Subscription
        </h1>

        {/* Success banner */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-body font-semibold text-charcoal-deep">Payment successful!</p>
              <p className="text-sm text-stone font-body mt-0.5">
                Your subscription is active until <span className="font-semibold text-charcoal-deep">{fmt(success.expires_at)}</span>.
              </p>
              <p className="text-[10px] font-mono text-greige mt-1">Ref: {success.subscription_id}</p>
            </div>
          </div>
        )}

        {/* Current subscription status */}
        {subError && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-sm font-body text-red-700">{subError}</p>
            <button onClick={loadSub} className="ml-auto text-xs font-body text-red-600 underline">Retry</button>
          </div>
        )}
        {subLoading ? (
          <Card><CardContent className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-gold-soft animate-spin" /></CardContent></Card>
        ) : !subError && (
          <div className={cn(
            'rounded-2xl border p-6',
            isActive && !isExpiring ? 'bg-emerald-50 border-emerald-200' :
            isExpiring              ? 'bg-amber-50 border-amber-200' :
            isExpired               ? 'bg-red-50 border-red-200' :
                                      'bg-parchment border-sand-light',
          )}>
            <div className="flex items-start gap-4">
              <div className={cn(
                'w-11 h-11 rounded-full flex items-center justify-center shrink-0',
                isActive && !isExpiring ? 'bg-emerald-100' :
                isExpiring              ? 'bg-amber-100' :
                isExpired               ? 'bg-red-100' : 'bg-sand-light',
              )}>
                {isActive && !isExpiring && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                {isExpiring             && <Clock className="w-5 h-5 text-amber-600" />}
                {isExpired              && <AlertCircle className="w-5 h-5 text-red-500" />}
                {!currentSub            && <CreditCard className="w-5 h-5 text-greige" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-body font-semibold text-charcoal-deep">
                    {!currentSub ? 'No active subscription' : isExpired ? `${planName} — Expired` : planName}
                  </p>
                  {isActive && !isExpiring && <Badge variant="success">Active</Badge>}
                  {isExpiring             && <Badge variant="warning">Expiring in {days} days</Badge>}
                  {isExpired              && <Badge variant="error">Expired</Badge>}
                </div>
                <p className="text-sm text-stone font-body mt-1">
                  {!currentSub  && 'Choose a plan below to unlock GlimmoraCare features.'}
                  {isActive && !isExpiring && <>Valid until <span className="font-semibold text-charcoal-deep">{fmt(currentSub!.expires_at)}</span>.</>}
                  {isExpiring  && <>Renew before <span className="font-semibold text-amber-700">{fmt(currentSub!.expires_at)}</span> to avoid interruption.</>}
                  {isExpired   && <>Expired on <span className="font-semibold text-charcoal-deep">{fmt(currentSub!.expires_at)}</span>. Renew to continue.</>}
                </p>
              </div>

              {(!currentSub || isExpired || isExpiring) && (
                <button
                  onClick={() => setShowModal(true)}
                  className={cn(
                    'shrink-0 px-4 py-2 rounded-xl font-body font-semibold text-sm transition-all',
                    !currentSub || isExpired
                      ? 'bg-charcoal-deep text-white hover:bg-noir'
                      : 'bg-white border border-sand-light text-charcoal-deep hover:border-gold-soft',
                  )}
                >
                  {!currentSub ? 'Subscribe' : isExpired ? 'Renew' : 'Renew early'}
                </button>
              )}
            </div>

            {isActive && currentSub && (
              <div className="mt-4 pt-4 border-t border-black/5 flex flex-wrap gap-5 text-sm font-body">
                <div>
                  <p className="text-[10px] text-greige uppercase tracking-wider mb-0.5">Plan</p>
                  <p className="font-semibold text-charcoal-deep">{planName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-greige uppercase tracking-wider mb-0.5">Expires</p>
                  <p className="font-semibold text-charcoal-deep">{fmt(currentSub.expires_at)}</p>
                </div>
                {currentSub.id && (
                  <div>
                    <p className="text-[10px] text-greige uppercase tracking-wider mb-0.5">Ref</p>
                    <p className="font-mono text-[11px] text-charcoal-deep">{currentSub.id}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Available plans preview — only shown when user needs to act */}
        {!plansLoading && plans.length > 0 && (!currentSub || isExpired || isExpiring) && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-body font-semibold text-charcoal-deep">
                {isExpiring || isExpired ? 'Renew your plan' : 'Choose a plan'}
              </p>
              <button onClick={() => setShowModal(true)} className="text-xs font-body text-gold-deep hover:text-gold-muted transition-colors">
                Subscribe →
              </button>
            </div>

            <div className={cn(
              'grid gap-4',
              plans.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' :
              plans.length === 4 ? 'grid-cols-2' :
              'grid-cols-2 lg:grid-cols-3',
            )}>
              {plans.map((p) => (
                <PlanCard
                  key={p.id}
                  plan={p}
                  selected={false}
                  onSelect={() => setShowModal(true)}
                />
              ))}
            </div>
          </div>
        )}

        {plansLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 text-gold-soft animate-spin" />
          </div>
        )}
      </div>

      {showModal && plans.length > 0 && (
        <PayModal
          plans={plans}
          onClose={() => setShowModal(false)}
          onSuccess={(result) => {
            setShowModal(false)
            setSuccess(result)
            setSubLoading(true)
            loadSub()
          }}
        />
      )}
    </RoleGuard>
  )
}
