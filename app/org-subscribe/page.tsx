'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Building2, Check, CheckCircle, AlertCircle, Loader2, LogOut, Star, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { planApi, paymentApi, type PlanOut, type VerifyPaymentResponse } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

function Steps({ current }: { current: number }) {
  const steps = ['Account', 'Choose Plan', 'Payment', 'Dashboard']
  return (
    <nav className="flex items-center justify-center gap-0">
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={label} className="flex items-center">
            <div className="flex items-center gap-1.5">
              {done && <Check className="w-3 h-3 text-white/60" />}
              <span className={cn(
                'text-sm font-body transition-colors',
                active ? 'text-white font-semibold' : done ? 'text-white/60' : 'text-white/30',
              )}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('mx-4 h-px w-8', done ? 'bg-white/40' : 'bg-white/15')} />
            )}
          </div>
        )
      })}
    </nav>
  )
}

function PlanCard({ plan, selected, onSelect }: { plan: PlanOut; selected: boolean; onSelect: () => void }) {
  const perMonth = plan.duration_months > 1 ? Math.round(plan.price / plan.duration_months) : null
  const durationLabel = plan.duration_months === 1 ? '1 MONTH'
    : plan.duration_months === 12 ? '1 YEAR'
    : plan.duration_months === 60 ? '5 YEARS'
    : `${plan.duration_months} MONTHS`

  return (
    <button
      onClick={onSelect}
      className={cn(
        'relative flex flex-col text-left rounded-2xl border p-5 transition-all w-full',
        selected
          ? 'border-[#6B7280] bg-[#E8EBF0] shadow-md ring-2 ring-[#6B7280]/30'
          : 'border-[#E5E7EB] bg-white hover:border-[#9CA3AF] hover:shadow-sm',
      )}
    >
      {plan.is_popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-[#1F2937] text-white text-[10px] font-body font-semibold px-3 py-1 rounded-full tracking-wide uppercase">
            Popular
          </span>
        </div>
      )}
      {plan.is_best_value && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-[#B8860B] text-white text-[10px] font-body font-semibold px-3 py-1 rounded-full tracking-wide uppercase flex items-center gap-1">
            <Star className="w-2.5 h-2.5 fill-white" /> Best Value
          </span>
        </div>
      )}
      <p className="text-[10px] font-body font-semibold text-[#6B7280] tracking-widest uppercase mb-2">{durationLabel}</p>
      <p className="font-display text-3xl text-[#1F2937] mb-0.5">₹{plan.price.toLocaleString('en-IN')}</p>
      {perMonth && <p className="text-xs text-[#9CA3AF] font-body mb-4">₹{perMonth.toLocaleString('en-IN')}/mo</p>}
      <div className="h-px bg-[#E5E7EB] mb-4 mt-auto" />
      <ul className="space-y-2">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-[#4B5563] font-body">
            <Check className={cn('w-3.5 h-3.5 shrink-0 mt-0.5', selected ? 'text-[#1F2937]' : 'text-[#9CA3AF]')} />
            {f}
          </li>
        ))}
      </ul>
    </button>
  )
}

function OrgSubscribeInner() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isRenewal = searchParams.get('renew') === '1'

  const [plans, setPlans] = useState<PlanOut[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<PlanOut | null>(null)
  const [step, setStep] = useState<'choose' | 'pay' | 'done'>('choose')
  const [orderLoading, setOrderLoading] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<VerifyPaymentResponse | null>(null)

  useEffect(() => {
    planApi.getPublicPlans('org')
      .then((ps) => { setPlans(ps); setSelected(ps.find((p) => p.is_popular) ?? ps[0] ?? null) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || window.Razorpay) return
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true
    document.body.appendChild(s)
  }, [])

  async function handleContinue() {
    if (!selected) return
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    if (!keyId) { setError('Payment not configured. Contact support.'); return }
    if (!window.Razorpay) { setError('Payment SDK not loaded. Refresh the page.'); return }
    setError(null); setOrderLoading(true)

    let orderId: string
    try {
      const res = await paymentApi.orgCreateOrder(selected.id, selected.price * 100)
      orderId = res.order_id
    } catch { setError('Failed to create order. Please try again.'); setOrderLoading(false); return }
    setOrderLoading(false); setStep('pay')

    new window.Razorpay({
      key: keyId,
      amount: selected.price * 100,
      currency: 'INR',
      name: 'GlimmoraCare',
      description: `${selected.name} organisation subscription`,
      order_id: orderId,
      theme: { color: '#B8860B' },
      handler: async (response) => {
        setPaying(true)
        try {
          const res = await paymentApi.orgVerifyPayment({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            plan_id: selected.id,
            amount_paise: selected.price * 100,
          })
          setResult(res); setStep('done')
        } catch { setError('Payment received but verification failed. Contact support.'); setStep('choose') }
        finally { setPaying(false) }
      },
      modal: { ondismiss: () => { setStep('choose'); setError('Payment cancelled.') } },
    }).open()
  }

  const currentStep = step === 'choose' ? 1 : step === 'pay' ? 2 : 3

  if (step === 'done' && result) {
    return (
      <div className="min-h-screen bg-[#F9F7F4] flex flex-col">
        <header className="bg-[#1A1A1A] px-6 py-4 flex items-center justify-between">
          <span className="font-display text-xl text-white">Glimmora<span className="text-[#B8860B] italic">Care</span></span>
          <Steps current={3} />
          <div className="w-24" />
        </header>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-5 max-w-sm">
            <div className="w-16 h-16 rounded-full bg-[#D1FAE5] flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-[#059669]" />
            </div>
            <h2 className="font-display text-3xl text-[#1F2937]">Subscription active!</h2>
            <p className="text-sm text-[#6B7280] font-body">
              <span className="font-semibold text-[#1F2937]">{result.org_name}</span> is now on the{' '}
              <span className="font-semibold text-[#1F2937]">{selected?.name}</span> plan until{' '}
              <span className="font-semibold text-[#1F2937]">
                {new Date(result.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>.
            </p>
            <p className="text-[10px] font-mono text-[#9CA3AF]">ID: {result.subscription_id}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3.5 rounded-xl bg-[#1F2937] text-white font-body font-semibold text-sm hover:bg-[#111827] transition-colors"
            >
              Go to Dashboard →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F7F4] flex flex-col">
      <header className="bg-[#1A1A1A] px-6 py-4 flex items-center justify-between">
        <span className="font-display text-xl text-white">Glimmora<span className="text-[#B8860B] italic">Care</span></span>
        <Steps current={currentStep} />
        <button onClick={logout} className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 font-body transition-colors">
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </header>

      <div className="bg-[#1A1A1A] pt-10 pb-14 text-center px-4">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-5 h-5 text-[#B8860B]" />
        </div>
        <h1 className="font-display text-5xl text-white mb-3">
          {isRenewal ? 'Renew your organisation' : 'Subscribe your organisation'}
        </h1>
        <p className="text-sm text-white/50 font-body max-w-md mx-auto">
          Unlock the full GlimmoraCare platform for your clinic — doctors, patients, and AI-powered insights.
        </p>
      </div>

      <div className="flex-1 px-4 py-10 max-w-6xl mx-auto w-full">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-[#B8860B] animate-spin" /></div>
        ) : (
          <div className={cn(
            'grid gap-5',
            plans.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' :
            plans.length === 4 ? 'grid-cols-2 lg:grid-cols-4' :
            'grid-cols-2 lg:grid-cols-5',
          )}>
            {plans.map((p) => (
              <PlanCard key={p.id} plan={p} selected={selected?.id === p.id} onSelect={() => { setSelected(p); setError(null) }} />
            ))}
          </div>
        )}

        {error && (
          <div className="mt-6 flex items-center gap-2 bg-[#FEF2F2] border border-[#DC2626]/20 rounded-xl p-3 max-w-md mx-auto">
            <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0" />
            <p className="text-xs font-body text-[#B91C1C]">{error}</p>
          </div>
        )}

        <div className="mt-10 flex flex-col items-center gap-2">
          <button
            onClick={handleContinue}
            disabled={!selected || orderLoading || paying}
            className={cn(
              'px-10 py-4 rounded-xl font-body font-semibold text-sm transition-all flex items-center gap-2',
              selected && !orderLoading && !paying
                ? 'bg-[#1F2937] text-white hover:bg-[#111827] shadow-md'
                : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed',
            )}
          >
            {orderLoading || paying
              ? <><Loader2 className="w-4 h-4 animate-spin" />{orderLoading ? 'Creating order…' : 'Verifying…'}</>
              : <>Continue to Payment →</>
            }
          </button>
          {selected && !orderLoading && !paying && (
            <p className="text-xs text-[#9CA3AF] font-body flex items-center gap-1">
              <Shield className="w-3 h-3" /> ₹{selected.price.toLocaleString('en-IN')} · {selected.name} · Secured by Razorpay
            </p>
          )}
        </div>

        <div className="mt-8 max-w-sm mx-auto bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
          <p className="text-xs font-body font-semibold text-amber-800">Test Mode</p>
          <p className="text-xs font-body text-amber-700 mt-0.5">
            Card: <span className="font-mono font-semibold">4111 1111 1111 1111</span> · any expiry · any CVV
          </p>
        </div>
      </div>
    </div>
  )
}

export default function OrgSubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#B8860B] animate-spin" />
      </div>
    }>
      <OrgSubscribeInner />
    </Suspense>
  )
}
