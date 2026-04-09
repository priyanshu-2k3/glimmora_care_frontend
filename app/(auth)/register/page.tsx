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
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const ROLE_OPTIONS = (Object.keys(ROLES) as Role[]).map((r) => ({ value: r, label: ROLES[r].label }))

const GENDER_OPTIONS = [
  { value: '', label: 'Select gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

interface OwnerForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  role: Role
  organization: string
  gender: string
  location: string
}

const STEPS = [
  { id: 1, label: 'Your Details', icon: User },
  { id: 2, label: 'Review', icon: Check },
]

export default function RegisterPage() {
  const router = useRouter()
  const { register, error, clearError } = useAuth()
  const [step, setStep] = useState(1)
  const [showPw, setShowPw] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [owner, setOwner] = useState<OwnerForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    organization: '',
    gender: '',
    location: '',
  })

  const pwRules = [
    { label: 'At least 8 characters',  ok: owner.password.length >= 8 },
    { label: 'Contains uppercase',      ok: /[A-Z]/.test(owner.password) },
    { label: 'Contains number',         ok: /\d/.test(owner.password) },
    { label: 'Passwords match',         ok: owner.password === owner.confirmPassword && owner.confirmPassword !== '' },
  ]

  const step1Valid =
    owner.firstName && owner.lastName && owner.email && owner.phone && pwRules.every((r) => r.ok)

  async function handleSubmit() {
    setIsLoading(true)
    clearError()
    try {
      await register({
        firstName: owner.firstName,
        lastName: owner.lastName,
        email: owner.email,
        phone: owner.phone,
        password: owner.password,
        role: owner.role,
      })
      router.push('/verify-email')
    } catch {
      // error shown via context
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="shadow-lg">
      <div className="flex items-center gap-2 mb-5">
        <Shield className="w-4 h-4 text-gold-soft" />
        <span className="text-xs text-greige font-body uppercase tracking-widest">Create Account</span>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 flex-1">
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-body font-semibold shrink-0 transition-all',
              step > s.id  ? 'bg-success-DEFAULT text-ivory-cream' :
              step === s.id ? 'bg-gold-deep text-ivory-cream' :
                              'bg-parchment text-greige border border-sand-light',
            )}>
              {step > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
            </div>
            <span className={cn('text-xs font-body hidden sm:block', step === s.id ? 'text-charcoal-deep font-medium' : 'text-greige')}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && <div className={cn('flex-1 h-px', step > s.id ? 'bg-success-DEFAULT' : 'bg-sand-light')} />}
          </div>
        ))}
      </div>

      {/* Error banner (shown on step 2) */}
      {error && step === 2 && (
        <div className="flex items-start gap-2 bg-error-soft border border-error-DEFAULT/20 rounded-xl p-3 mb-4">
          <AlertCircle className="w-4 h-4 text-error-DEFAULT shrink-0 mt-0.5" />
          <p className="text-xs font-body text-error-DEFAULT">{error}</p>
        </div>
      )}

      {/* ─── STEP 1: Account Owner ─── */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-xl text-charcoal-deep mb-0.5">Your Details</h2>
            <p className="text-xs text-greige font-body">You'll be the account owner and family admin.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                label="First Name"
                placeholder="Priya"
                value={owner.firstName}
                onChange={(e) => setOwner((p) => ({ ...p, firstName: e.target.value }))}
                required
              />
            </div>
            <div>
              <Input
                label="Last Name"
                placeholder="Sharma"
                value={owner.lastName}
                onChange={(e) => setOwner((p) => ({ ...p, lastName: e.target.value }))}
                required
              />
            </div>
            <div className="col-span-2">
              <Input
                label="Email Address"
                type="email"
                placeholder="priya@example.com"
                value={owner.email}
                onChange={(e) => setOwner((p) => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+91 98765 43210"
                value={owner.phone}
                onChange={(e) => setOwner((p) => ({ ...p, phone: e.target.value }))}
                required
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Select
                label="Role"
                options={ROLE_OPTIONS}
                value={owner.role}
                onChange={(e) => setOwner((p) => ({ ...p, role: e.target.value as Role }))}
              />
            </div>
            {(owner.role === 'doctor' || owner.role === 'admin' || owner.role === 'super_admin') && (
              <div className="col-span-2">
                <Input
                  label="Organization"
                  placeholder="Hospital / NGO / Department"
                  value={owner.organization}
                  onChange={(e) => setOwner((p) => ({ ...p, organization: e.target.value }))}
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
                label="Password"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={owner.password}
                onChange={(e) => setOwner((p) => ({ ...p, password: e.target.value }))}
                rightIcon={
                  <button type="button" onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
            </div>
            <div className="col-span-2">
              <Input
                label="Confirm Password"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={owner.confirmPassword}
                onChange={(e) => setOwner((p) => ({ ...p, confirmPassword: e.target.value }))}
              />
            </div>
          </div>

          {owner.password && (
            <div className="bg-parchment rounded-xl p-3 grid grid-cols-2 gap-1.5">
              {pwRules.map((rule) => (
                <div key={rule.label} className="flex items-center gap-1.5">
                  <div className={cn('w-3.5 h-3.5 rounded-full shrink-0', rule.ok ? 'bg-success-DEFAULT' : 'bg-sand-DEFAULT')} />
                  <span className={cn('text-[11px] font-body', rule.ok ? 'text-success-DEFAULT' : 'text-greige')}>
                    {rule.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Button className="w-full" disabled={!step1Valid} onClick={() => setStep(2)} size="lg">
            Continue to Review
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* ─── STEP 2: Review ─── */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-xl text-charcoal-deep mb-0.5">Review your details</h2>
            <p className="text-xs text-greige font-body">Confirm before creating your account.</p>
          </div>

          <div className="bg-parchment rounded-xl p-4 space-y-3">
            <p className="text-xs font-body font-semibold text-charcoal-deep uppercase tracking-wide">Account Owner</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold-whisper border border-gold-soft/40 flex items-center justify-center text-sm font-body font-semibold text-gold-deep">
                {[owner.firstName[0], owner.lastName[0]].filter(Boolean).join('').toUpperCase() || 'AC'}
              </div>
              <div>
                <p className="text-sm font-body font-semibold text-charcoal-deep">
                  {[owner.firstName, owner.lastName].filter(Boolean).join(' ')}
                </p>
                <p className="text-xs text-greige">{owner.email} · {ROLES[owner.role]?.label}</p>
                <p className="text-xs text-greige">{owner.phone}</p>
              </div>
            </div>
          </div>

          <div className="bg-ivory-warm border border-sand-light rounded-xl p-3 text-xs text-greige font-body">
            By creating this account, you agree to our Terms of Service and Privacy Policy.
            A verification email will be sent to{' '}
            <span className="font-medium text-charcoal-deep">{owner.email}</span>.
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button className="flex-1" onClick={handleSubmit} isLoading={isLoading} size="lg">
              <UserPlus className="w-4 h-4" />
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </div>
        </div>
      )}

      <p className="mt-5 text-center text-xs text-greige font-body">
        Already have an account?{' '}
        <Link href="/login" className="text-gold-deep hover:text-gold-muted transition-colors">
          Sign in
        </Link>
      </p>
    </Card>
  )
}
