'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2, ArrowLeft, ArrowRight, CheckCircle, AlertCircle,
  CreditCard, Shield, Check, Calendar, Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import { adminApi, planApi, ApiError, type PlanOut } from '@/lib/api'
import { validatePhone, validateWebsite, normaliseWebsite } from '@/lib/validators'
import { DashboardBackLink } from '@/components/layout/DashboardBackLink'

// ─── Razorpay window type ──────────────────────────────────────────────────────
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

interface RazorpayOptions {
  key: string
  amount: number        // paise
  currency: string
  name: string
  description: string
  image?: string
  prefill?: { name?: string; email?: string; contact?: string }
  notes?: Record<string, string>
  theme?: { color?: string }
  handler: (response: RazorpayResponse) => void
  modal?: { ondismiss?: () => void }
}

interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_order_id?: string
  razorpay_signature?: string
}

interface RazorpayInstance {
  open: () => void
  on: (event: string, handler: () => void) => void
}

// ─── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: number }) {
  const steps = ['Details & Plan', 'Confirm', 'Payment', 'Done']
  return (
    <div className="flex items-center justify-between w-full max-w-lg mx-auto mb-8">
      {steps.map((label, i) => {
        const idx = i + 1
        const done = idx < step
        const active = idx === step
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-body font-semibold transition-all',
                done   && 'bg-gold-deep text-white',
                active && 'bg-charcoal-deep text-white ring-2 ring-charcoal-deep/20',
                !done && !active && 'bg-sand-light text-greige',
              )}>
                {done ? <Check className="w-3.5 h-3.5" /> : idx}
              </div>
              <span className={cn(
                'text-[10px] font-body whitespace-nowrap',
                active ? 'text-charcoal-deep font-semibold' : 'text-greige',
              )}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                'flex-1 h-px mx-2 mb-5 transition-colors',
                done ? 'bg-gold-deep' : 'bg-sand-light',
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Plan card ────────────────────────────────────────────────────────────────
function PlanCard({ plan, selected, onSelect }: {
  plan: PlanOut
  selected: boolean
  onSelect: () => void
}) {
  const perMonth = Math.round(plan.price / plan.duration_months)
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative w-full text-left rounded-xl border-2 p-4 transition-all duration-200',
        selected
          ? 'border-gold-deep bg-gold-whisper/60 shadow-sm'
          : 'border-sand-light bg-white hover:border-gold-soft/60 hover:bg-parchment/30',
      )}
    >
      {plan.is_popular && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gold-deep text-white text-[10px] font-body font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
          Most Popular
        </span>
      )}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-body font-semibold text-charcoal-deep text-sm">{plan.name}</p>
          {plan.discount_percent > 0 && (
            <p className="text-[10px] font-body text-gold-deep font-medium mt-0.5">Save {plan.discount_percent}%</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="font-display text-lg text-charcoal-deep">₹{plan.price.toLocaleString('en-IN')}</p>
          {plan.duration_months > 1 && (
            <p className="text-[10px] text-greige font-body">₹{perMonth.toLocaleString('en-IN')}/mo</p>
          )}
        </div>
      </div>
      {selected && (
        <div className="absolute top-3 right-3">
          <div className="w-4 h-4 rounded-full bg-gold-deep flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
        </div>
      )}
    </button>
  )
}

// ─── Load Razorpay checkout.js script once ─────────────────────────────────────
function useRazorpayScript() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.Razorpay) { setReady(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => setReady(true)
    document.body.appendChild(script)
  }, [])
  return ready
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function CreateOrganisationPage() {
  const router = useRouter()
  const razorpayReady = useRazorpayScript()
  const [step, setStep] = useState(1)

  // Plans fetched from DB
  const [plans, setPlans] = useState<PlanOut[]>([])
  const [plansLoading, setPlansLoading] = useState(true)

  useEffect(() => {
    planApi.getPublicPlans('org')
      .then(setPlans)
      .catch(() => setPlans([]))
      .finally(() => setPlansLoading(false))
  }, [])

  // Step 1 state
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [step1Error, setStep1Error] = useState<string | null>(null)

  // Auto-select the popular plan (or first) once plans load
  useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) {
      const popular = plans.find((p) => p.is_popular)
      setSelectedPlanId((popular ?? plans[0]).id)
    }
  }, [plans, selectedPlanId])

  // Step 3 state
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)

  // Step 4 state
  const [createdName, setCreatedName] = useState('')

  const plan = plans.find((p) => p.id === selectedPlanId) ?? null

  function handleStep1Next() {
    if (!name.trim()) { setStep1Error('Organisation name is required.'); return }
    if (!plan) { setStep1Error('Please select a subscription plan.'); return }
    const phoneErr = validatePhone(phone, { optional: true })
    if (phoneErr) { setStep1Error(phoneErr); return }
    const webErr = validateWebsite(website, { optional: true })
    if (webErr) { setStep1Error(webErr); return }
    setStep1Error(null)
    setStep(2)
  }

  // Called after Razorpay payment_id is received
  async function createOrgAfterPayment(rzpPaymentId: string) {
    setPaying(true)
    setPayError(null)
    try {
      const created = await adminApi.createOrg({
        name: name.trim(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() ? normaliseWebsite(website) : undefined,
      })
      setPaymentId(rzpPaymentId)
      setCreatedName(created.name)
      setStep(4)
    } catch (err) {
      setPayError(err instanceof ApiError ? err.detail : 'Organisation creation failed after payment.')
    } finally {
      setPaying(false)
    }
  }

  function openRazorpay() {
    if (!razorpayReady) { setPayError('Payment SDK not loaded. Please refresh.'); return }
    if (!plan) { setPayError('No plan selected.'); return }
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    if (!keyId) { setPayError('Payment key not configured.'); return }

    setPayError(null)

    const options: RazorpayOptions = {
      key: keyId,
      amount: plan.price * 100,  // convert ₹ to paise
      currency: 'INR',
      name: 'GlimmoraCare',
      description: `${plan.name} subscription — ${name}`,
      prefill: { name },
      notes: {
        org_name: name,
        plan: plan.id,
        plan_label: plan.name,
      },
      theme: { color: '#B8860B' },
      handler: (response) => {
        // Payment successful — response has payment_id
        createOrgAfterPayment(response.razorpay_payment_id)
      },
      modal: {
        ondismiss: () => {
          setPayError('Payment was cancelled. You can try again.')
        },
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <DashboardBackLink />

      <div>
        <h1 className="font-body text-2xl font-bold text-charcoal-deep flex items-center gap-2">
          <Building2 className="w-5 h-5 text-gold-soft" />
          Create Organisation
        </h1>
        <p className="text-sm text-greige font-body mt-1">Set up a new organisation with a subscription plan.</p>
      </div>

      <StepIndicator step={step} />

      {/* ── Step 1: Details + Plan ── */}
      {step === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-body text-base">Organisation Details</CardTitle>
              <CardDescription>Basic information about the organisation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Organisation Name *"
                placeholder="e.g. Sunrise Health Clinic"
                value={name}
                onChange={(e) => { setName(e.target.value); setStep1Error(null) }}
              />
              <Input
                label="Address"
                placeholder="123 Medical Street, Mumbai"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setStep1Error(null) }}
                />
                <Input
                  label="Website"
                  placeholder="https://clinic.example.com"
                  value={website}
                  onChange={(e) => { setWebsite(e.target.value); setStep1Error(null) }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-body text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gold-soft" />
                Select Plan
              </CardTitle>
              <CardDescription>Choose a subscription duration for this organisation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {plansLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-gold-soft animate-spin" />
                </div>
              ) : plans.length === 0 ? (
                <p className="text-sm text-greige font-body text-center py-6">
                  No plans available. Please contact support.
                </p>
              ) : (
                plans.map((p) => (
                  <PlanCard
                    key={p.id}
                    plan={p}
                    selected={selectedPlanId === p.id}
                    onSelect={() => setSelectedPlanId(p.id)}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {step1Error && (
            <div className="flex items-center gap-2 bg-error-soft border border-[#DC2626]/20 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0" />
              <p className="text-xs font-body text-[#B91C1C]">{step1Error}</p>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleStep1Next}>
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Confirm ── */}
      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-body text-base">Confirm Details</CardTitle>
              <CardDescription>Review before proceeding to payment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm font-body">
              {[
                { label: 'Organisation Name', value: name },
                { label: 'Address',           value: address || '—' },
                { label: 'Phone',             value: phone   || '—' },
                { label: 'Website',           value: website || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-sand-light last:border-0">
                  <span className="text-greige">{label}</span>
                  <span className="text-charcoal-deep font-medium max-w-xs text-right truncate">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-body text-base">Selected Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gold-whisper/40 border border-gold-soft/40 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-body font-semibold text-charcoal-deep">{plan?.name}</p>
                  {plan && plan.discount_percent > 0 && (
                    <p className="text-xs text-gold-deep font-body mt-0.5">Save {plan.discount_percent}%</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl text-charcoal-deep">₹{plan?.price.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-greige font-body">incl. GST</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button onClick={() => setStep(3)}>
              Confirm & Pay
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Payment ── */}
      {step === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-body text-base flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gold-soft" />
                    Payment
                  </CardTitle>
                  <CardDescription>Powered by Razorpay — secure & encrypted</CardDescription>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-greige font-body">
                  <Shield className="w-3.5 h-3.5 text-gold-soft" />
                  SSL Secured
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order summary */}
              <div className="bg-parchment/60 border border-sand-light rounded-xl p-4 space-y-3">
                <p className="text-xs font-body text-greige uppercase tracking-wide">Order Summary</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-body font-semibold text-charcoal-deep">{name}</p>
                    <p className="text-xs text-greige font-body mt-0.5">{plan?.name} subscription</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-2xl text-charcoal-deep">₹{plan?.price.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-greige font-body">incl. GST</p>
                  </div>
                </div>
              </div>

              {/* Razorpay branding */}
              <div className="flex items-center justify-center gap-2 py-2">
                <Shield className="w-3.5 h-3.5 text-greige" />
                <span className="text-xs text-greige font-body">
                  Checkout secured by{' '}
                  <span className="font-semibold text-[#072654]">Razorpay</span>
                </span>
              </div>

              {/* Test mode notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
                <p className="text-xs font-body font-semibold text-amber-800">Test Mode Active</p>
                <p className="text-xs font-body text-amber-700">
                  Use card <span className="font-mono font-semibold">4111 1111 1111 1111</span>, any future expiry, any CVV.
                </p>
              </div>

              {payError && (
                <div className="flex items-center gap-2 bg-error-soft border border-[#DC2626]/20 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0" />
                  <p className="text-xs font-body text-[#B91C1C]">{payError}</p>
                </div>
              )}

              {paying && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Loader2 className="w-5 h-5 text-gold-soft animate-spin" />
                  <p className="text-sm font-body text-greige">Creating organisation…</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-between">
            <Button variant="outline" onClick={() => setStep(2)} disabled={paying}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              onClick={openRazorpay}
              disabled={!razorpayReady || paying || !plan}
              className="flex-1 max-w-xs"
            >
              {!razorpayReady ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading…
                </>
              ) : (
                <>
                  Pay ₹{plan?.price.toLocaleString('en-IN')}
                  <CreditCard className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 4: Success ── */}
      {step === 4 && (
        <Card className="text-center py-12 px-6">
          <div className="w-16 h-16 rounded-full bg-success-soft border border-success-DEFAULT/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-success-DEFAULT" />
          </div>
          <h2 className="font-display text-2xl text-charcoal-deep mb-2">Organisation Created!</h2>
          <p className="text-sm text-greige font-body mb-1">
            <span className="font-semibold text-charcoal-deep">{createdName}</span> has been set up successfully.
          </p>
          <p className="text-xs text-greige font-body">
            {plan?.name} · ₹{plan?.price.toLocaleString('en-IN')} paid
          </p>
          {paymentId && (
            <p className="text-[10px] font-mono text-greige mt-1 mb-8">
              Payment ID: {paymentId}
            </p>
          )}
          {!paymentId && <div className="mb-8" />}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => router.push('/organization')}>
              <Building2 className="w-4 h-4" />
              View All Organisations
            </Button>
            <Button variant="outline" onClick={() => {
              setStep(1)
              setName(''); setAddress(''); setPhone(''); setWebsite('')
              setSelectedPlanId(null); setPaymentId(null)
            }}>
              Create Another
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
