'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  UserPlus, Shield, ArrowRight, ArrowLeft,
  Eye, EyeOff, Check, User, AlertCircle,
} from 'lucide-react'
import type { Role } from '@/types/auth'
import { ROLES } from '@/lib/constants'
import { useAuth } from '@/context/AuthContext'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

// Self-registration is restricted to patient and doctor. Admin and super_admin
// accounts are created exclusively through the super-admin flow / admin co-add.
const SELF_REGISTERABLE_ROLES: Role[] = ['patient', 'doctor']
const ROLE_OPTIONS = SELF_REGISTERABLE_ROLES.map((r) => ({ value: r, label: ROLES[r].label }))

const GENDER_OPTIONS = [
  { value: '',       label: 'Select gender' },
  { value: 'male',   label: 'Male' },
  { value: 'female', label: 'Female' },
]

interface OwnerForm {
  firstName:       string
  lastName:        string
  email:           string
  phone:           string
  password:        string
  confirmPassword: string
  role:            Role
  organization:    string
  gender:          string
  location:        string
}

const STEPS = [
  { id: 1, label: 'Your Details', icon: User },
  { id: 2, label: 'Review',       icon: Check },
]

export default function RegisterPage() {
  const router = useRouter()
  const { register, error, clearError } = useAuth()
  const [step, setStep] = useState(1)
  const [showPw, setShowPw] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [owner, setOwner] = useState<OwnerForm>({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirmPassword: '', role: 'patient',
    organization: '', gender: '', location: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof OwnerForm, string>>>({})

  const NAME_RE = /^[A-Za-z][A-Za-z\s'-]*$/
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  // Accepts +<country><10-digit>, or plain 10 digits, allowing spaces/dashes
  const PHONE_RE = /^(\+\d{1,3}[\s-]?)?(\d[\s-]?){9,14}\d$/

  function validateAll(): Partial<Record<keyof OwnerForm, string>> {
    const errs: Partial<Record<keyof OwnerForm, string>> = {}
    if (!owner.firstName.trim()) errs.firstName = 'First name is required'
    else if (!NAME_RE.test(owner.firstName.trim())) errs.firstName = 'Only letters allowed'
    if (!owner.lastName.trim()) errs.lastName = 'Last name is required'
    else if (!NAME_RE.test(owner.lastName.trim())) errs.lastName = 'Only letters allowed'
    if (!owner.email.trim()) errs.email = 'Email is required'
    else if (!EMAIL_RE.test(owner.email.trim())) errs.email = 'Enter a valid email address'
    if (!owner.phone.trim()) errs.phone = 'Phone number is required'
    else {
      const digits = owner.phone.replace(/\D/g, '')
      if (digits.length < 10 || digits.length > 15) errs.phone = 'Enter a valid phone number'
    }
    if (owner.password.length < 8) errs.password = 'At least 8 characters'
    else if (!/[A-Z]/.test(owner.password)) errs.password = 'Must include uppercase letter'
    else if (!/\d/.test(owner.password)) errs.password = 'Must include a number'
    if (owner.confirmPassword !== owner.password) errs.confirmPassword = 'Passwords do not match'
    if (owner.role === 'doctor' && !owner.organization.trim()) {
      errs.organization = 'Organization is required for doctors'
    }
    return errs
  }

  function handleStep1Submit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validateAll()
    setFieldErrors(errs)
    if (Object.keys(errs).length === 0) setStep(2)
  }

  const pwRules = [
    { label: 'At least 8 characters', ok: owner.password.length >= 8 },
    { label: 'Contains uppercase',     ok: /[A-Z]/.test(owner.password) },
    { label: 'Contains number',        ok: /\d/.test(owner.password) },
    { label: 'Passwords match',        ok: owner.password === owner.confirmPassword && owner.confirmPassword !== '' },
  ]

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setIsLoading(true)
    clearError()
    try {
      await register({
        firstName: owner.firstName,
        lastName:  owner.lastName,
        email:     owner.email,
        phone:     owner.phone,
        password:  owner.password,
        role:      owner.role,
      })
      router.push('/verify-email')
    } catch {
      // error shown via context
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-4">
          <Shield className="w-3.5 h-3.5 text-gold-deep/60" />
          <span className="text-[10px] text-greige font-body uppercase tracking-widest">Create Account</span>
        </div>
        <h2 className="font-display text-3xl text-charcoal-deep tracking-tight leading-tight">Join GlimmoraCare</h2>
        <p className="text-sm text-stone font-body mt-1">Secure, encrypted health records from day one</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 p-1 bg-parchment rounded-2xl mb-6">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2 flex-1">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-body font-semibold shrink-0 transition-all duration-300',
                  step > s.id  ? 'bg-gold-deep text-ivory-cream' :
                  step === s.id ? 'bg-charcoal-deep text-ivory-cream' :
                                  'bg-white text-greige border border-sand-light',
                )}
              >
                {step > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
              </div>
              <span
                className={cn(
                  'text-xs font-body hidden sm:block flex-1',
                  step === s.id ? 'text-charcoal-deep font-medium' : step > s.id ? 'text-gold-deep' : 'text-greige',
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-px mx-2 transition-all duration-500',
                  step > s.id ? 'bg-gold-deep' : 'bg-sand-light',
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error banner (shown on step 2) */}
      {error && step === 2 && (
        <div className="flex items-start gap-2.5 bg-error-soft border border-[#DC2626]/20 rounded-2xl p-3.5 mb-5">
          <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0 mt-0.5" />
          <p className="text-xs font-body text-[#B91C1C] leading-relaxed">{error}</p>
        </div>
      )}

      {/* ─── STEP 1: Account Owner ─── */}
      {step === 1 && (
        <form onSubmit={handleStep1Submit} className="space-y-4">
          <div>
            <h3 className="font-display text-xl text-charcoal-deep mb-0.5">Your Details</h3>
            <p className="text-xs text-greige font-body">You'll be the account owner and family admin.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name *"
              placeholder="Priya"
              value={owner.firstName}
              onChange={(e) => { const v = e.target.value.replace(/[^A-Za-z\s'-]/g, ''); setOwner((p) => ({ ...p, firstName: v })); setFieldErrors((p) => ({ ...p, firstName: undefined })) }}
              required
              error={fieldErrors.firstName}
            />
            <Input
              label="Last Name *"
              placeholder="Sharma"
              value={owner.lastName}
              onChange={(e) => { const v = e.target.value.replace(/[^A-Za-z\s'-]/g, ''); setOwner((p) => ({ ...p, lastName: v })); setFieldErrors((p) => ({ ...p, lastName: undefined })) }}
              required
              error={fieldErrors.lastName}
            />
            <div className="col-span-2">
              <Input
                label="Email Address *"
                type="email"
                placeholder="priya@example.com"
                value={owner.email}
                onChange={(e) => { setOwner((p) => ({ ...p, email: e.target.value })); setFieldErrors((p) => ({ ...p, email: undefined })) }}
                required
                error={fieldErrors.email}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Input
                label="Phone Number *"
                type="tel"
                placeholder="+91 98765 43210"
                value={owner.phone}
                onChange={(e) => { const v = e.target.value.replace(/[^\d+\s-]/g, ''); setOwner((p) => ({ ...p, phone: v })); setFieldErrors((p) => ({ ...p, phone: undefined })) }}
                required
                error={fieldErrors.phone}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Select
                label="Role"
                options={ROLE_OPTIONS}
                value={owner.role}
                onChange={(e) => {
                  const nextRole = e.target.value as Role
                  setOwner((p) => ({
                    ...p,
                    role: nextRole,
                    // Discard any organization the user typed if they switch back to patient.
                    organization: nextRole === 'doctor' ? p.organization : '',
                  }))
                  if (nextRole !== 'doctor') {
                    setFieldErrors((p) => ({ ...p, organization: undefined }))
                  }
                }}
              />
            </div>
            {(owner.role === 'doctor') && (
              <div className="col-span-2">
                <Input
                  label="Organization *"
                  placeholder="Hospital / NGO / Department"
                  value={owner.organization}
                  onChange={(e) => {
                    setOwner((p) => ({ ...p, organization: e.target.value }))
                    setFieldErrors((p) => ({ ...p, organization: undefined }))
                  }}
                  required
                  error={fieldErrors.organization}
                />
              </div>
            )}
            <div className="col-span-2 sm:col-span-1">
              <Select
                label="Gender"
                options={GENDER_OPTIONS}
                value={owner.gender}
                onChange={(e) => setOwner((p) => ({ ...p, gender: e.target.value }))}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Input
                label="Location"
                placeholder="City, State"
                value={owner.location}
                onChange={(e) => setOwner((p) => ({ ...p, location: e.target.value }))}
              />
            </div>
            <div className="col-span-2">
              <Input
                label="Password *"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={owner.password}
                onChange={(e) => { setOwner((p) => ({ ...p, password: e.target.value })); setFieldErrors((p) => ({ ...p, password: undefined })) }}
                error={fieldErrors.password}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="cursor-pointer text-greige hover:text-stone transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
            </div>
            <div className="col-span-2">
              <Input
                label="Confirm Password *"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={owner.confirmPassword}
                onChange={(e) => { setOwner((p) => ({ ...p, confirmPassword: e.target.value })); setFieldErrors((p) => ({ ...p, confirmPassword: undefined })) }}
                error={fieldErrors.confirmPassword}
              />
            </div>
          </div>

          {owner.password && (
            <div className="bg-parchment border border-sand-light rounded-2xl p-3.5 grid grid-cols-2 gap-2">
              {pwRules.map((rule) => (
                <div key={rule.label} className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full shrink-0 flex items-center justify-center',
                      rule.ok ? 'bg-gold-deep' : 'bg-sand-light',
                    )}
                  >
                    {rule.ok && <Check className="w-2.5 h-2.5 text-ivory-cream" />}
                  </div>
                  <span className={cn('text-[11px] font-body', rule.ok ? 'text-charcoal-deep' : 'text-greige')}>
                    {rule.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Button
            type="submit"
            className="w-full mt-1 bg-gradient-to-r from-charcoal-deep to-stone text-ivory-cream shadow-md hover:opacity-90 border-0"
            size="lg"
          >
            Continue to Review
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      )}

      {/* ─── STEP 2: Review ─── */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h3 className="font-display text-xl text-charcoal-deep mb-0.5">Review your details</h3>
            <p className="text-xs text-greige font-body">Confirm before creating your account.</p>
          </div>

          <div className="bg-gradient-to-r from-ivory-cream to-white border border-sand-light rounded-2xl p-4">
            <p className="text-[10px] font-body font-semibold text-gold-deep uppercase tracking-widest mb-3">
              Account Owner
            </p>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gold-whisper border border-gold-soft/40 flex items-center justify-center text-sm font-display font-semibold text-charcoal-deep shrink-0">
                {[owner.firstName[0], owner.lastName[0]].filter(Boolean).join('').toUpperCase() || 'AC'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body font-semibold text-charcoal-deep truncate">
                  {[owner.firstName, owner.lastName].filter(Boolean).join(' ')}
                </p>
                <p className="text-xs text-greige font-body truncate">
                  {owner.email} · {ROLES[owner.role]?.label}
                </p>
                <p className="text-xs text-greige font-body">{owner.phone}</p>
              </div>
            </div>
          </div>

          <div className="bg-azure-whisper border border-sapphire-mist/20 rounded-2xl p-3.5">
            <p className="text-[11px] text-sapphire-deep font-body leading-relaxed">
              By creating this account, you agree to our Terms of Service and Privacy Policy.
              A verification email will be sent to{' '}
              <span className="font-semibold">{owner.email}</span>.
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)} size="lg">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-charcoal-deep to-stone text-ivory-cream shadow-md hover:opacity-90 border-0"
              isLoading={isLoading}
              size="lg"
            >
              <UserPlus className="w-4 h-4" />
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </div>
        </form>
      )}

      <p className="mt-5 text-center text-xs text-greige font-body">
        Already have an account?{' '}
        <Link href="/login" className="text-gold-deep hover:text-gold-muted font-medium transition-colors">
          Sign in →
        </Link>
      </p>
    </div>
  )
}
