'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2, ArrowLeft, ArrowRight, CheckCircle, AlertCircle,
  CreditCard, Shield, Check, Calendar, Loader2, Link2, Copy,
  MessageCircle, ChevronDown,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import { paymentApi, planApi, ApiError, type PlanOut, type VerifyPaymentResponse } from '@/lib/api'
import { validatePhone, validateWebsite, normaliseWebsite } from '@/lib/validators'
import { DashboardBackLink } from '@/components/layout/DashboardBackLink'

// ─── Razorpay window types ─────────────────────────────────────────────────
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}
interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  prefill?: { name?: string; email?: string; contact?: string }
  notes?: Record<string, string>
  theme?: { color?: string }
  handler: (response: RazorpayResponse) => void
  modal?: { ondismiss?: () => void }
}
interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}
interface RazorpayInstance {
  open: () => void
  on: (event: string, handler: () => void) => void
}

// ─── Load Razorpay checkout.js ─────────────────────────────────────────────
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

// ─── Step indicator ────────────────────────────────────────────────────────
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

// ─── Plan card ─────────────────────────────────────────────────────────────
function PlanCard({ plan, selected, onSelect }: {
  plan: PlanOut; selected: boolean; onSelect: () => void
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

// ─── Main page ─────────────────────────────────────────────────────────────
export default function CreateOrganisationPage() {
  const router = useRouter()
  const razorpayReady = useRazorpayScript()
  const [step, setStep] = useState(1)

  // Plans from DB
  const [plans, setPlans] = useState<PlanOut[]>([])
  const [plansLoading, setPlansLoading] = useState(true)

  useEffect(() => {
    planApi.getPublicPlans('org')
      .then(setPlans)
      .catch(() => setPlans([]))
      .finally(() => setPlansLoading(false))
  }, [])

  // Auto-select popular plan once loaded
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) {
      const popular = plans.find((p) => p.is_popular)
      setSelectedPlanId((popular ?? plans[0]).id)
    }
  }, [plans, selectedPlanId])

  const plan = plans.find((p) => p.id === selectedPlanId) ?? null

  // Step 1
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [step1Error, setStep1Error] = useState<string | null>(null)

  // Step 3 — in-app payment
  const [orderLoading, setOrderLoading] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  // Step 3 — payment link
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [linkContactName, setLinkContactName] = useState('')
  const [linkEmail, setLinkEmail] = useState('')
  const [linkPhone, setLinkPhone] = useState('')
  const [linkExpiry, setLinkExpiry] = useState<24 | 72 | 168>(72)
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkResult, setLinkResult] = useState<{ url: string; expires_at: string } | null>(null)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Step 4
  const [successData, setSuccessData] = useState<VerifyPaymentResponse | null>(null)

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

  async function openRazorpay() {
    if (!plan) return
    if (!razorpayReady) { setPayError('Payment SDK not loaded. Please refresh.'); return }
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    if (!keyId) { setPayError('Payment key not configured.'); return }

    setPayError(null)
    setOrderLoading(true)

    let orderId: string
    try {
      const orderRes = await paymentApi.createOrder(plan.id, plan.price * 100)
      orderId = orderRes.order_id
    } catch (err) {
      setPayError(err instanceof ApiError ? err.detail : 'Failed to create secure order.')
      setOrderLoading(false)
      return
    }
    setOrderLoading(false)

    const options: RazorpayOptions = {
      key: keyId,
      amount: plan.price * 100,
      currency: 'INR',
      name: 'GlimmoraCare',
      description: `${plan.name} subscription — ${name}`,
      order_id: orderId,
      prefill: { name },
      notes: { org_name: name, plan_id: plan.id, plan_name: plan.name },
      theme: { color: '#B8860B' },
      handler: async (response) => {
        setPaying(true)
        setPayError(null)
        try {
          const result = await paymentApi.verifyPayment({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            org_name: name.trim(),
            address: address.trim() || undefined,
            phone: phone.trim() || undefined,
            website: website.trim() ? normaliseWebsite(website) : undefined,
            plan_id: plan.id,
            amount_paise: plan.price * 100,
          })
          setSuccessData(result)
          setStep(4)
        } catch (err) {
          setPayError(err instanceof ApiError ? err.detail : 'Payment verification failed.')
        } finally {
          setPaying(false)
        }
      },
      modal: {
        ondismiss: () => setPayError('Payment was cancelled. You can try again.'),
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  async function handleGenerateLink() {
    if (!plan) return
    if (!linkEmail) { setLinkError('Contact email is required.'); return }
    setLinkError(null)
    setLinkLoading(true)
    try {
      const res = await paymentApi.createPaymentLink({
        plan_id: plan.id,
        amount_paise: plan.price * 100,
        org_name: name.trim(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() ? normaliseWebsite(website) : undefined,
        contact_name: linkContactName.trim() || undefined,
        contact_email: linkEmail.trim(),
        contact_phone: linkPhone.trim() || undefined,
        expiry_hours: linkExpiry,
      })
      setLinkResult({ url: res.payment_link_url, expires_at: res.expires_at })
    } catch (err) {
      setLinkError(err instanceof ApiError ? err.detail : 'Failed to generate link.')
    } finally {
      setLinkLoading(false)
    }
  }

  function copyLink() {
    if (!linkResult) return
    navigator.clipboard.writeText(linkResult.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function whatsappLink() {
    if (!linkResult) return '#'
    const msg = encodeURIComponent(
      `Hi, please complete your GlimmoraCare subscription payment here: ${linkResult.url}`
    )
    return `https://wa.me/?text=${msg}`
  }

  function expiryLabel(h: 24 | 72 | 168) {
    if (h === 24) return '24 hours'
    if (h === 72) return '3 days'
    return '7 days'
  }

  function formatExpiry(iso: string) {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  function resetAll() {
    setStep(1)
    setName(''); setAddress(''); setPhone(''); setWebsite('')
    setSelectedPlanId(null); setSuccessData(null)
    setLinkResult(null); setLinkEmail(''); setLinkContactName(''); setLinkPhone('')
    setShowLinkForm(false); setPayError(null)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <DashboardBackLink />

      <div>
        <h1 className="font-body text-2xl font-bold text-charcoal-deep flex items-center gap-2">
          <Building2 className="w-5 h-5 text-gold-soft" /> Create Organisation
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
                <Calendar className="w-4 h-4 text-gold-soft" /> Select Plan
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
                  No plans available. Contact support.
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
            <Button onClick={handleStep1Next} disabled={plansLoading}>
              Next <ArrowRight className="w-4 h-4" />
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
            <CardHeader><CardTitle className="font-body text-base">Selected Plan</CardTitle></CardHeader>
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
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button onClick={() => setStep(3)}>
              Confirm & Pay <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Payment ── */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Order summary card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-body text-base flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gold-soft" /> Payment
                  </CardTitle>
                  <CardDescription>Powered by Razorpay — secure &amp; encrypted</CardDescription>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-greige font-body">
                  <Shield className="w-3.5 h-3.5 text-gold-soft" /> SSL Secured
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
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

              {/* Test mode notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
                <p className="text-xs font-body font-semibold text-amber-800">Test Mode Active</p>
                <p className="text-xs font-body text-amber-700">
                  Use card <span className="font-mono font-semibold">4111 1111 1111 1111</span>, any future expiry, any CVV.
                </p>
              </div>

              {orderLoading && (
                <div className="flex items-center gap-2 py-2 text-sm font-body text-greige">
                  <Loader2 className="w-4 h-4 text-gold-soft animate-spin" /> Creating secure order…
                </div>
              )}

              {paying && (
                <div className="flex items-center gap-2 py-2 text-sm font-body text-greige">
                  <Loader2 className="w-4 h-4 text-gold-soft animate-spin" /> Verifying payment &amp; creating organisation…
                </div>
              )}

              {payError && (
                <div className="flex items-center gap-2 bg-error-soft border border-[#DC2626]/20 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0" />
                  <p className="text-xs font-body text-[#B91C1C]">{payError}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Payment link section ── */}
          <Card>
            <CardHeader>
              <button
                type="button"
                onClick={() => { setShowLinkForm((v) => !v); setLinkResult(null); setLinkError(null) }}
                className="flex items-center justify-between w-full text-left"
              >
                <div>
                  <CardTitle className="font-body text-base flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-gold-soft" /> Send Payment Link
                  </CardTitle>
                  <CardDescription className="mt-0.5">
                    Generate a Razorpay link and share it with the organisation contact
                  </CardDescription>
                </div>
                <ChevronDown className={cn('w-4 h-4 text-greige transition-transform', showLinkForm && 'rotate-180')} />
              </button>
            </CardHeader>

            {showLinkForm && (
              <CardContent className="space-y-4 pt-0">
                {linkResult ? (
                  /* Link generated — show result */
                  <div className="space-y-3">
                    <div className="bg-parchment/60 border border-sand-light rounded-xl p-4 space-y-3">
                      <p className="text-xs font-body font-semibold text-charcoal-deep flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-[#059669]" /> Payment link ready
                      </p>
                      <p className="text-xs font-mono text-stone break-all">{linkResult.url}</p>
                      <p className="text-[10px] text-greige font-body">
                        Expires {formatExpiry(linkResult.expires_at)}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="outline" onClick={copyLink}>
                        <Copy className="w-3.5 h-3.5" />
                        {copied ? 'Copied!' : 'Copy Link'}
                      </Button>
                      <a
                        href={whatsappLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#25D366] text-[#25D366] text-xs font-body font-medium hover:bg-[#25D366]/10 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Share via WhatsApp
                      </a>
                      <Button size="sm" variant="outline" onClick={() => setLinkResult(null)}>
                        New Link
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Link form */
                  <div className="space-y-3">
                    <Input
                      label="Contact Name (optional)"
                      placeholder="Dr. Meena Sharma"
                      value={linkContactName}
                      onChange={(e) => setLinkContactName(e.target.value)}
                    />
                    <Input
                      label="Contact Email *"
                      type="email"
                      placeholder="contact@clinic.com"
                      value={linkEmail}
                      onChange={(e) => { setLinkEmail(e.target.value); setLinkError(null) }}
                    />
                    <Input
                      label="Contact Phone (optional)"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={linkPhone}
                      onChange={(e) => setLinkPhone(e.target.value)}
                    />

                    <div>
                      <label className="text-xs font-body font-medium text-stone block mb-1.5">Link expires in</label>
                      <div className="flex gap-2">
                        {([24, 72, 168] as const).map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setLinkExpiry(h)}
                            className={cn(
                              'flex-1 py-1.5 rounded-xl border text-xs font-body font-medium transition-colors',
                              linkExpiry === h
                                ? 'bg-gold-soft text-white border-gold-soft'
                                : 'bg-white text-stone border-sand-light hover:border-gold-soft',
                            )}
                          >
                            {expiryLabel(h)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {linkError && (
                      <div className="flex items-center gap-2 bg-error-soft border border-[#DC2626]/20 rounded-xl p-3">
                        <AlertCircle className="w-3.5 h-3.5 text-[#B91C1C] shrink-0" />
                        <p className="text-xs font-body text-[#B91C1C]">{linkError}</p>
                      </div>
                    )}

                    <Button
                      size="sm"
                      onClick={handleGenerateLink}
                      isLoading={linkLoading}
                      disabled={!linkEmail}
                    >
                      <Link2 className="w-3.5 h-3.5" /> Generate &amp; Copy Link
                    </Button>
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          <div className="flex gap-3 justify-between">
            <Button variant="outline" onClick={() => setStep(2)} disabled={orderLoading || paying}>
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button
              onClick={openRazorpay}
              disabled={!razorpayReady || orderLoading || paying || !plan}
              className="flex-1 max-w-xs"
            >
              {orderLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating order…</>
              ) : !razorpayReady ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</>
              ) : (
                <>Pay ₹{plan?.price.toLocaleString('en-IN')} <CreditCard className="w-4 h-4" /></>
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
            <span className="font-semibold text-charcoal-deep">{successData?.org_name ?? name}</span> has been set up successfully.
          </p>
          <p className="text-xs text-greige font-body">
            {plan?.name} · ₹{plan?.price.toLocaleString('en-IN')} paid
          </p>
          {successData?.expires_at && (
            <p className="text-xs text-greige font-body mt-0.5">
              Active until {formatExpiry(successData.expires_at)}
            </p>
          )}
          {successData?.subscription_id && (
            <p className="text-[10px] font-mono text-greige mt-1 mb-8">
              Subscription ID: {successData.subscription_id}
            </p>
          )}
          {!successData && <div className="mb-8" />}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => router.push('/organization')}>
              <Building2 className="w-4 h-4" /> View All Organisations
            </Button>
            <Button variant="outline" onClick={resetAll}>
              Create Another
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
