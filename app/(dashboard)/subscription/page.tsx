'use client'

import { useState, useEffect } from 'react'
import {
  CreditCard, CheckCircle, AlertCircle, Shield, Check,
  Loader2, Sparkles, Calendar, RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { paymentApi, planApi, type PlanOut, type PatientVerifyResponse, type SubscriptionOut } from '@/lib/api'
import { DashboardBackLink } from '@/components/layout/DashboardBackLink'
import { RoleGuard } from '@/components/auth/RoleGuard'

function useRpScript() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.Razorpay) { setReady(true); return }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true; s.onload = () => setReady(true)
    document.body.appendChild(s)
  }, [])
  return ready
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

function subStatus(sub: SubscriptionOut) {
  if (sub.status !== 'active') return 'expired'
  if (!sub.expires_at) return 'active'
  const daysLeft = Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / 86400000)
  if (daysLeft <= 0) return 'expired'
  if (daysLeft <= 30) return 'expiring'
  return 'active'
}

export default function PatientSubscriptionPage() {
  const rpReady = useRpScript()

  const [plans, setPlans] = useState<PlanOut[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<PlanOut | null>(null)

  const [currentSub, setCurrentSub] = useState<SubscriptionOut | null>(null)
  const [subLoading, setSubLoading] = useState(true)

  const [orderLoading, setOrderLoading] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [success, setSuccess] = useState<PatientVerifyResponse | null>(null)

  useEffect(() => {
    planApi.getPublicPlans('patient')
      .then((ps) => { setPlans(ps); setSelectedPlan(ps.find((p) => p.is_popular) ?? ps[0] ?? null) })
      .catch(() => {})
      .finally(() => setPlansLoading(false))

    paymentApi.patientGetSubscription()
      .then(setCurrentSub)
      .catch(() => setCurrentSub(null))
      .finally(() => setSubLoading(false))
  }, [])

  async function handlePay() {
    if (!selectedPlan) return
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    if (!keyId) { setPayError('Payment not configured.'); return }
    if (!rpReady) { setPayError('Payment SDK not loaded. Refresh the page.'); return }
    setPayError(null); setOrderLoading(true)

    let orderId: string
    try {
      const res = await paymentApi.patientCreateOrder(selectedPlan.id, selectedPlan.price * 100)
      orderId = res.order_id
    } catch { setPayError('Failed to create order. Please try again.'); setOrderLoading(false); return }
    setOrderLoading(false)

    new window.Razorpay({
      key: keyId,
      amount: selectedPlan.price * 100,
      currency: 'INR',
      name: 'GlimmoraCare',
      description: `${selectedPlan.name} patient subscription`,
      order_id: orderId,
      theme: { color: '#B8860B' },
      handler: async (response) => {
        setPaying(true)
        try {
          const result = await paymentApi.patientVerifyPayment({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            plan_id: selectedPlan.id,
            amount_paise: selectedPlan.price * 100,
          })
          setSuccess(result)
          // refresh subscription display
          paymentApi.patientGetSubscription().then(setCurrentSub).catch(() => {})
        } catch { setPayError('Payment received but verification failed. Contact support.') }
        finally { setPaying(false) }
      },
      modal: { ondismiss: () => setPayError('Payment cancelled.') },
    }).open()
  }

  const status = currentSub ? subStatus(currentSub) : null

  return (
    <RoleGuard allowed={['patient']}>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <DashboardBackLink />

        <div>
          <h1 className="font-body text-2xl lg:text-3xl font-bold text-charcoal-deep flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold-soft" />
            My Subscription
          </h1>
          <p className="text-sm text-stone font-body mt-1">Manage your GlimmoraCare patient plan.</p>
        </div>

        {/* Current subscription card */}
        {subLoading ? (
          <Card className="p-6 flex justify-center"><Loader2 className="w-5 h-5 text-gold-soft animate-spin" /></Card>
        ) : currentSub ? (
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs text-greige font-body uppercase tracking-wide">Current Plan</p>
                <p className="font-body font-semibold text-charcoal-deep">
                  {(currentSub.plan_snapshot as Record<string, string>)?.name ?? 'Patient Plan'}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-greige font-body">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Expires {fmt(currentSub.expires_at)}</span>
                </div>
              </div>
              <div>
                {status === 'active' && <Badge variant="success">Active</Badge>}
                {status === 'expiring' && <Badge variant="warning">Expiring Soon</Badge>}
                {status === 'expired' && <Badge variant="error">Expired</Badge>}
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-5">
            <p className="text-sm text-greige font-body">You don&apos;t have an active subscription yet.</p>
          </Card>
        )}

        {/* Success banner */}
        {success && (
          <div className="bg-white border border-sand-light rounded-2xl p-6 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#D1FAE5] border border-[#059669]/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6 text-[#059669]" />
            </div>
            <p className="font-body font-semibold text-charcoal-deep">Payment Successful!</p>
            <p className="text-xs text-greige font-body">
              Your subscription is active until <span className="font-medium text-charcoal-deep">{fmt(success.expires_at)}</span>
            </p>
            <p className="text-[10px] font-mono text-greige">ID: {success.subscription_id}</p>
          </div>
        )}

        {/* Plan selection */}
        <div className="space-y-3">
          <p className="font-body font-semibold text-charcoal-deep text-sm flex items-center gap-2">
            {status === 'expired' || status === 'expiring'
              ? <><RefreshCw className="w-4 h-4 text-gold-soft" /> Renew Subscription</>
              : !currentSub
                ? <><CreditCard className="w-4 h-4 text-gold-soft" /> Choose a Plan</>
                : <><RefreshCw className="w-4 h-4 text-gold-soft" /> Upgrade or Extend</>
            }
          </p>

          {plansLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-gold-soft animate-spin" /></div>
          ) : plans.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-sm text-greige font-body">No patient plans available. Contact support.</p>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {plans.map((p) => {
                const perMonth = Math.round(p.price / p.duration_months)
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlan(p)}
                    className={cn(
                      'relative text-left rounded-2xl border p-4 transition-all',
                      selectedPlan?.id === p.id
                        ? 'border-charcoal-deep bg-charcoal-deep/5 shadow-sm'
                        : 'border-sand-light bg-white hover:border-gold-soft',
                    )}
                  >
                    {p.is_popular && (
                      <span className="absolute -top-2.5 left-4 text-[10px] font-body font-semibold px-2 py-0.5 rounded-full bg-charcoal-deep text-white">
                        Most Popular
                      </span>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-body font-semibold text-sm text-charcoal-deep">{p.name}</p>
                        <p className="text-xs text-greige mt-0.5">{p.duration_months} month{p.duration_months !== 1 ? 's' : ''}</p>
                        {p.discount_percent > 0 && (
                          <span className="inline-block mt-1 text-[10px] font-body font-semibold px-1.5 py-0.5 rounded-full bg-[#D1FAE5] text-[#059669]">
                            Save {p.discount_percent}%
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-body font-semibold text-charcoal-deep">₹{p.price.toLocaleString('en-IN')}</p>
                        {p.duration_months > 1 && (
                          <p className="text-[10px] text-greige font-body">₹{perMonth.toLocaleString('en-IN')}/mo</p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Pay button */}
        {!plansLoading && plans.length > 0 && (
          <div className="space-y-3">
            {payError && (
              <div className="flex items-center gap-2 bg-[#FEF2F2] border border-[#DC2626]/20 rounded-xl p-3">
                <AlertCircle className="w-3.5 h-3.5 text-[#B91C1C] shrink-0" />
                <p className="text-xs font-body text-[#B91C1C]">{payError}</p>
              </div>
            )}
            {(orderLoading || paying) && (
              <div className="flex items-center gap-2 text-sm font-body text-greige">
                <Loader2 className="w-4 h-4 text-gold-soft animate-spin" />
                {orderLoading ? 'Creating secure order…' : 'Verifying payment…'}
              </div>
            )}
            <Button
              className="w-full"
              onClick={handlePay}
              disabled={!selectedPlan || !rpReady || orderLoading || paying}
              isLoading={orderLoading || paying}
            >
              <CreditCard className="w-4 h-4" />
              Pay ₹{selectedPlan ? selectedPlan.price.toLocaleString('en-IN') : '—'}
            </Button>
            <div className="flex items-center justify-center gap-4">
              <span className="text-[10px] text-greige font-body flex items-center gap-1">
                <Shield className="w-3 h-3 text-gold-soft" /> SSL Encrypted
              </span>
              <span className="text-[10px] text-greige font-body flex items-center gap-1">
                <Check className="w-3 h-3 text-gold-soft" /> Powered by Razorpay
              </span>
            </div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs font-body font-semibold text-amber-800">Test Mode</p>
          <p className="text-xs font-body text-amber-700 mt-0.5">
            Use card <span className="font-mono font-semibold">4111 1111 1111 1111</span>, any future expiry, any CVV.
          </p>
        </div>
      </div>
    </RoleGuard>
  )
}
