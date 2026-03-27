'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, Shield, ArrowRight, ArrowLeft, Plus, Trash2, Eye, EyeOff, Check, Users, User, ChevronDown } from 'lucide-react'
import type { Role } from '@/types/auth'
import type { ProfileRelation } from '@/types/profile'
import { ROLES } from '@/lib/constants'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

const ROLE_OPTIONS = (Object.keys(ROLES) as Role[]).map((r) => ({ value: r, label: ROLES[r].label }))

const RELATION_OPTIONS = [
  { value: 'spouse', label: 'Spouse / Partner' },
  { value: 'child', label: 'Child' },
  { value: 'parent', label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
]

const BLOOD_OPTIONS = ['A+', 'A−', 'B+', 'B−', 'O+', 'O−', 'AB+', 'AB−'].map((v) => ({ value: v, label: v }))

interface FamilyMemberForm {
  id: string
  name: string
  relation: ProfileRelation
  dob: string
  bloodGroup: string
  email: string
  password: string
  hasAccount: boolean
}

interface OwnerForm {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  role: Role
  organization: string
  location: string
}

const STEPS = [
  { id: 1, label: 'Your Details', icon: User },
  { id: 2, label: 'Family Members', icon: Users },
  { id: 3, label: 'Review', icon: Check },
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [showPw, setShowPw] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [owner, setOwner] = useState<OwnerForm>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    organization: '',
    location: '',
  })

  const [members, setMembers] = useState<FamilyMemberForm[]>([])

  function addMember() {
    setMembers((prev) => [...prev, {
      id: `m_${Date.now()}`,
      name: '',
      relation: 'spouse',
      dob: '',
      bloodGroup: 'B+',
      email: '',
      password: '',
      hasAccount: false,
    }])
  }

  function removeMember(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id))
  }

  function updateMember(id: string, field: keyof FamilyMemberForm, value: string | boolean) {
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, [field]: value } : m))
  }

  const pwRules = [
    { label: 'At least 8 characters', ok: owner.password.length >= 8 },
    { label: 'Contains uppercase', ok: /[A-Z]/.test(owner.password) },
    { label: 'Contains number', ok: /\d/.test(owner.password) },
    { label: 'Passwords match', ok: owner.password === owner.confirmPassword && owner.confirmPassword !== '' },
  ]

  const step1Valid = owner.name && owner.email && pwRules.every((r) => r.ok)

  async function handleSubmit() {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 1200))
    setIsLoading(false)
    router.push('/verify-email')
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
              step > s.id ? 'bg-success-DEFAULT text-ivory-cream' :
              step === s.id ? 'bg-gold-deep text-ivory-cream' :
              'bg-parchment text-greige border border-sand-light'
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

      {/* ─── STEP 1: Account Owner ─── */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-xl text-charcoal-deep mb-0.5">Your Details</h2>
            <p className="text-xs text-greige font-body">You'll be the account owner and family admin.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Input
                label="Full Name"
                placeholder="Priya Sharma"
                value={owner.name}
                onChange={(e) => setOwner((p) => ({ ...p, name: e.target.value }))}
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
            {(owner.role === 'doctor' || owner.role === 'ngo_worker' || owner.role === 'gov_analyst') && (
              <div className="col-span-2">
                <Input
                  label="Organization"
                  placeholder="Hospital / NGO / Department"
                  value={owner.organization}
                  onChange={(e) => setOwner((p) => ({ ...p, organization: e.target.value }))}
                />
              </div>
            )}
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
                  <span className={cn('text-[11px] font-body', rule.ok ? 'text-success-DEFAULT' : 'text-greige')}>{rule.label}</span>
                </div>
              ))}
            </div>
          )}

          <Button className="w-full" disabled={!step1Valid} onClick={() => setStep(2)} size="lg">
            Continue — Add Family Members
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* ─── STEP 2: Family Members ─── */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-xl text-charcoal-deep mb-0.5">Family Members</h2>
            <p className="text-xs text-greige font-body">Register health profiles for your family. Each member with an email gets their own login.</p>
          </div>

          {/* Owner summary */}
          <div className="flex items-center gap-3 p-3 bg-gold-whisper border border-gold-soft/30 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-gold-soft/30 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-gold-deep" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-body font-semibold text-charcoal-deep">{owner.name || 'You'}</p>
              <p className="text-xs text-greige">{owner.email} · Account Owner</p>
            </div>
            <Badge variant="gold">Owner</Badge>
          </div>

          {/* Family member forms */}
          {members.map((member, idx) => (
            <div key={member.id} className="border border-sand-light rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-parchment">
                <p className="text-sm font-body font-semibold text-charcoal-deep">Family Member {idx + 1}</p>
                <button onClick={() => removeMember(member.id)} className="p-1 text-greige hover:text-error-DEFAULT rounded transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Input
                      label="Full Name"
                      placeholder="e.g. Rohit Sharma"
                      value={member.name}
                      onChange={(e) => updateMember(member.id, 'name', e.target.value)}
                    />
                  </div>
                  <Select
                    label="Relation"
                    options={RELATION_OPTIONS}
                    value={member.relation}
                    onChange={(e) => updateMember(member.id, 'relation', e.target.value)}
                  />
                  <Select
                    label="Blood Group"
                    options={BLOOD_OPTIONS}
                    value={member.bloodGroup}
                    onChange={(e) => updateMember(member.id, 'bloodGroup', e.target.value)}
                  />
                  <div className="col-span-2">
                    <Input
                      label="Date of Birth"
                      type="date"
                      value={member.dob}
                      onChange={(e) => updateMember(member.id, 'dob', e.target.value)}
                    />
                  </div>
                </div>

                {/* Optional own account */}
                <div>
                  <button
                    onClick={() => updateMember(member.id, 'hasAccount', !member.hasAccount)}
                    className="flex items-center gap-2 text-xs text-gold-deep font-body hover:underline"
                  >
                    <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', member.hasAccount && 'rotate-180')} />
                    {member.hasAccount ? 'Remove' : 'Give'} separate login to this member
                  </button>
                  {member.hasAccount && (
                    <div className="mt-3 grid grid-cols-2 gap-3 pt-3 border-t border-sand-light">
                      <div className="col-span-2">
                        <Input
                          label="Email"
                          type="email"
                          placeholder="member@example.com"
                          value={member.email}
                          onChange={(e) => updateMember(member.id, 'email', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          label="Password"
                          type="password"
                          placeholder="••••••••"
                          value={member.password}
                          onChange={(e) => updateMember(member.id, 'password', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addMember}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-sand-light rounded-xl text-sm text-greige hover:text-charcoal-deep hover:border-gold-soft/50 transition-all font-body"
          >
            <Plus className="w-4 h-4" />
            Add family member
          </button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button className="flex-1" onClick={() => setStep(3)} size="lg">
              Review & Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ─── STEP 3: Review ─── */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-xl text-charcoal-deep mb-0.5">Review your details</h2>
            <p className="text-xs text-greige font-body">Confirm before creating your family account.</p>
          </div>

          <div className="bg-parchment rounded-xl p-4 space-y-3">
            <p className="text-xs font-body font-semibold text-charcoal-deep uppercase tracking-wide">Account Owner</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold-whisper border border-gold-soft/40 flex items-center justify-center text-sm font-body font-semibold text-gold-deep">
                {owner.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'AC'}
              </div>
              <div>
                <p className="text-sm font-body font-semibold text-charcoal-deep">{owner.name}</p>
                <p className="text-xs text-greige">{owner.email} · {ROLES[owner.role]?.label}</p>
              </div>
            </div>
          </div>

          {members.length > 0 && (
            <div className="bg-parchment rounded-xl p-4 space-y-3">
              <p className="text-xs font-body font-semibold text-charcoal-deep uppercase tracking-wide">Family Members ({members.length})</p>
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-ivory-warm border border-sand-light flex items-center justify-center text-xs font-body font-semibold text-charcoal-deep">
                      {m.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-body font-medium text-charcoal-deep">{m.name || '(unnamed)'}</p>
                      <p className="text-xs text-greige capitalize">{m.relation} · {m.bloodGroup} · {m.dob || 'DOB not set'}</p>
                    </div>
                    {m.hasAccount && <Badge variant="info">Own Login</Badge>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {members.length === 0 && (
            <div className="bg-ivory-warm border border-sand-light rounded-xl p-4 text-center">
              <p className="text-xs text-greige font-body">No family members added. You can add them after registration.</p>
            </div>
          )}

          <div className="bg-ivory-warm border border-sand-light rounded-xl p-3 text-xs text-greige font-body">
            By creating this account, you agree to our Terms of Service and Privacy Policy. A verification email will be sent to <span className="font-medium text-charcoal-deep">{owner.email}</span>.
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button className="flex-1" onClick={handleSubmit} isLoading={isLoading} size="lg">
              <UserPlus className="w-4 h-4" />
              {isLoading ? 'Creating account...' : 'Create Family Account'}
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
