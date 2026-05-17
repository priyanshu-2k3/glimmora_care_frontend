'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  CheckCircle, AlertCircle, CreditCard, Shield,
  Check, Loader2, Building2, ArrowRight,
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/utils'
import { planApi, paymentApi, type PlanOut, type VerifyPaymentResponse } from '@/lib/api'


function useRazorpayScript() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.Razorpay) { setReady(true); return }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true
    s.onload = () => setReady(true)
    document.body.appendChild(s)
  }, [])
  return ready
}

// ─── Small input ───────────────────────────────────────────────────────────
function Field({ label, required, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-body font-medium text-stone mb-1">
        {label}{required && <span className="text-[#B91C1C] ml-0.5">*</span>}
      </label>
      <input
        {...props}
        className="w-full text-sm font-body border border-sand-light rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:border-gold-soft placeholder:text-greige/60 transition-colors"
      />
    </div>
  )
}

// ─── Inner component (uses useSearchParams) ────────────────────────────────
function PayPage() {
  const params = useSearchParams()
  const planId = params.get('plan')
  const razorpayReady = useRazorpayScript()

  const [plan, setPlan] = useState<PlanOut | null>(null)
  const [planLoading, setPlanLoading] = useState(true)
  const [planError, setPlanError] = useState(false)

  // Form
  const [orgName, setOrgName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')

  // Payment state
  const [orderLoading, setOrderLoading] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState<VerifyPaymentResponse | null>(null)

  useEffect(() => {
    if (!planId) { setPlanLoading(false); setPlanError(true); return }
    planApi.getPublicPlans('org')
      .then((plans) => {
        const found = plans.find((p) => p.id === planId)
        if (found) setPlan(found)
        else setPlanError(true)
      })
      .catch(() => setPlanError(true))
      .finally(() => setPlanLoading(false))
  }, [planId])

  async function handlePay() {
    if (!plan) return
    if (!orgName.trim()) { setFormError('Organisation name is required.'); return }
    if (!contactEmail.trim()) { setFormError('Contact email is required.'); return }
    setFormError(null)
    setPayError(null)

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    if (!keyId) { setPayError('Payment not configured. Please contact support.'); return }
    if (!razorpayReady) { setPayError('Payment SDK not loaded. Please refresh.'); return }

    setOrderLoading(true)
    let orderId: string
    try {
      const res = await paymentApi.publicCreateOrder(plan.id, plan.price * 100)
      orderId = res.order_id
    } catch {
      setPayError('Failed to create order. Please try again.')
      setOrderLoading(false)
      return
    }
    setOrderLoading(false)

    const options: RazorpayOptions = {
      key: keyId,
      amount: plan.price * 100,
      currency: 'INR',
      name: 'GlimmoraCare',
      description: `${plan.name} subscription — ${orgName}`,
      order_id: orderId,
      prefill: { name: contactName || orgName, email: contactEmail, contact: phone },
      notes: { org_name: orgName, plan_id: plan.id },
      theme: { color: '#B8860B' },
      handler: async (response) => {
        setPaying(true)
        try {
          const result = await paymentApi.publicVerifyPayment({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            org_name: orgName.trim(),
            address: address.trim() || undefined,
            phone: phone.trim() || undefined,
            website: website.trim() || undefined,
            contact_name: contactName.trim() || undefined,
            contact_email: contactEmail.trim(),
            plan_id: plan.id,
            amount_paise: plan.price * 100,
          })
          setSuccess(result)
        } catch {
          setPayError('Payment received but verification failed. Please contact support with your payment ID.')
        } finally {
          setPaying(false)
        }
      },
      modal: { ondismiss: () => setPayError('Payment cancelled. You can try again.') },
    }

    new window.Razorpay(options).open()
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const perMonth = plan ? Math.round(plan.price / plan.duration_months) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory-cream via-white to-parchment">
      {/* Header */}
      <div className="border-b border-sand-light bg-white/80 backdrop-blur-sm">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-2.5">
          <Logo href="/" height={32} />
          <span className="ml-auto text-[10px] text-greige font-body flex items-center gap-1">
            <Shield className="w-3 h-3 text-gold-soft" /> Secured by Razorpay
          </span>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-10 space-y-6">

        {/* Loading */}
        {planLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-gold-soft animate-spin" />
          </div>
        )}

        {/* Plan not found */}
        {!planLoading && planError && (
          <div className="text-center py-20 space-y-3">
            <AlertCircle className="w-10 h-10 text-[#B91C1C] mx-auto" />
            <p className="font-body font-semibold text-charcoal-deep">Invalid or expired link</p>
            <p className="text-sm text-greige font-body">Please contact the person who shared this link.</p>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-white border border-sand-light rounded-2xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-[#D1FAE5] border border-[#059669]/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-[#059669]" />
            </div>
            <h2 className="font-display text-2xl text-charcoal-deep">Payment Successful!</h2>
            <p className="text-sm text-greige font-body">
              <span className="font-semibold text-charcoal-deep">{success.org_name}</span> has been registered on GlimmoraCare.
            </p>
            {success.expires_at && (
              <p className="text-xs text-greige font-body">
                Subscription active until <span className="font-medium text-charcoal-deep">{formatDate(success.expires_at)}</span>
              </p>
            )}
            <p className="text-[10px] font-mono text-greige">
              Subscription ID: {success.subscription_id}
            </p>
            <p className="text-xs text-greige font-body pt-2">
              Our team will reach out to complete your onboarding. Thank you!
            </p>
          </div>
        )}

        {/* Payment form */}
        {!planLoading && !planError && !success && plan && (
          <>
            {/* Plan summary */}
            <div className="bg-white border border-sand-light rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-body text-greige uppercase tracking-wide mb-3">Selected Plan</p>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-body font-semibold text-charcoal-deep text-base">{plan.name}</p>
                  <p className="text-xs text-stone font-body mt-0.5">
                    {plan.duration_months} {plan.duration_months === 1 ? 'month' : 'months'} subscription
                  </p>
                  {plan.discount_percent > 0 && (
                    <span className="inline-block mt-1 text-[10px] font-body font-semibold px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#059669]">
                      Save {plan.discount_percent}%
                    </span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-3xl text-charcoal-deep">₹{plan.price.toLocaleString('en-IN')}</p>
                  {plan.duration_months > 1 && (
                    <p className="text-xs text-greige font-body">₹{perMonth.toLocaleString('en-IN')}/mo</p>
                  )}
                  <p className="text-[10px] text-greige font-body">incl. GST</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white border border-sand-light rounded-2xl p-6 shadow-sm space-y-5">
              <div>
                <p className="font-body font-semibold text-charcoal-deep text-sm mb-0.5 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gold-soft" /> Organisation Details
                </p>
                <p className="text-xs text-greige font-body">Tell us about your clinic or hospital</p>
              </div>

              <div className="space-y-3">
                <Field
                  label="Organisation Name"
                  required
                  placeholder="e.g. Sunrise Health Clinic"
                  value={orgName}
                  onChange={(e) => { setOrgName(e.target.value); setFormError(null) }}
                />
                <Field
                  label="Address"
                  placeholder="123 Medical Street, Mumbai"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <Field
                    label="Website"
                    placeholder="https://clinic.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
              </div>

              <hr className="border-sand-light" />

              <div>
                <p className="font-body font-semibold text-charcoal-deep text-sm mb-3">Your Details</p>
                <div className="space-y-3">
                  <Field
                    label="Your Name"
                    placeholder="Dr. Meena Sharma"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                  />
                  <Field
                    label="Email Address"
                    required
                    type="email"
                    placeholder="you@clinic.com"
                    value={contactEmail}
                    onChange={(e) => { setContactEmail(e.target.value); setFormError(null) }}
                  />
                </div>
              </div>

              {formError && (
                <div className="flex items-center gap-2 bg-[#FEF2F2] border border-[#DC2626]/20 rounded-xl p-3">
                  <AlertCircle className="w-3.5 h-3.5 text-[#B91C1C] shrink-0" />
                  <p className="text-xs font-body text-[#B91C1C]">{formError}</p>
                </div>
              )}

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

              <button
                onClick={handlePay}
                disabled={!razorpayReady || orderLoading || paying}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-body font-semibold text-sm transition-all',
                  'bg-charcoal-deep text-white hover:bg-charcoal-deep/90 active:scale-[0.98]',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
                )}
              >
                {orderLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating order…</>
                ) : paying ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Pay ₹{plan.price.toLocaleString('en-IN')}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 pt-1">
                <span className="text-[10px] text-greige font-body flex items-center gap-1">
                  <Shield className="w-3 h-3 text-gold-soft" /> SSL Encrypted
                </span>
                <span className="text-[10px] text-greige font-body flex items-center gap-1">
                  <Check className="w-3 h-3 text-gold-soft" /> Powered by Razorpay
                </span>
              </div>
            </div>

            {/* Test mode notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs font-body font-semibold text-amber-800">Test Mode</p>
              <p className="text-xs font-body text-amber-700 mt-0.5">
                Use card <span className="font-mono font-semibold">4111 1111 1111 1111</span>, any future expiry, any CVV.
              </p>
            </div>
          </>
        )}
      </div>

      <div className="text-center pb-8">
        <p className="text-[10px] text-greige font-body">
          © 2026 GlimmoraCare · DPDP Act 2023 compliant · AES-256 encrypted
        </p>
      </div>
    </div>
  )
}

// Wrap in Suspense because useSearchParams requires it in Next.js App Router
export default function PayPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-ivory-cream">
        <Loader2 className="w-6 h-6 text-gold-soft animate-spin" />
      </div>
    }>
      <PayPage />
    </Suspense>
  )
}
