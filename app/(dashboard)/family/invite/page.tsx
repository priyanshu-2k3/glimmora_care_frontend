'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, UserPlus, Shield, Eye, Users, Crown, ArrowLeft, Check, RefreshCw } from 'lucide-react'
import { useProfile } from '@/context/ProfileContext'
import { familyApi, ApiError } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/utils'
import type { FamilyRole } from '@/types/profile'

const ROLE_INFO: Record<Exclude<FamilyRole, 'owner'>, { icon: React.ElementType; title: string; perms: string[] }> = {
  admin: {
    icon: Shield,
    title: 'Admin',
    perms: ['Manage family members', 'Change member roles', 'View & upload all records', 'Approve consent requests'],
  },
  member: {
    icon: Users,
    title: 'Member',
    perms: ['View shared health records', 'Upload own records', 'Manage own consents'],
  },
  view_only: {
    icon: Eye,
    title: 'View Only',
    perms: ['View shared health records only', 'No upload or edit access'],
  },
}

const RELATION_OPTIONS = [
  { value: 'spouse', label: 'Spouse / Partner' },
  { value: 'child', label: 'Child' },
  { value: 'parent', label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
]

interface InviteForm {
  email: string
  name: string
  relation: string
  role: Exclude<FamilyRole, 'owner'>
  message: string
}

export default function FamilyInvitePage() {
  const router = useRouter()
  const { family } = useProfile()
  const familyName = family?.name ?? 'your family'
  const [form, setForm] = useState<InviteForm>({
    email: '',
    name: '',
    relation: 'spouse',
    role: 'member',
    message: '',
  })
  const [step, setStep] = useState<'form' | 'sending' | 'sent'>('form')
  const [inviteError, setInviteError] = useState<string | null>(null)

  function handleUpdate(field: keyof InviteForm, value: string) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setInviteError(null)
    setStep('sending')
    try {
      await familyApi.invite(form.email, form.role)
      setStep('sent')
    } catch (err) {
      setInviteError(err instanceof ApiError ? err.detail : 'Failed to send invitation. Please try again.')
      setStep('form')
    }
  }

  const selectedRoleInfo = ROLE_INFO[form.role]

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/family" className="p-1.5 text-greige hover:text-charcoal-deep rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep">Invite Member</h1>
          <p className="text-sm text-greige font-body mt-0.5">Add someone to {familyName}</p>
        </div>
      </div>

      {step === 'sent' ? (
        <Card>
          <CardContent className="py-10 text-center">
            <div className="w-16 h-16 bg-success-soft rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-success-DEFAULT" />
            </div>
            <h2 className="font-body text-xl font-semibold text-charcoal-deep mb-2">Invitation sent!</h2>
            <p className="text-sm text-greige font-body mb-6">
              {form.name || form.email} will receive an email invitation to join {familyName}.
            </p>
            <div className="flex gap-2 max-w-xs mx-auto">
              <Button variant="outline" className="flex-1" onClick={() => setStep('form')}>
                <RefreshCw className="w-4 h-4" />
                Send another
              </Button>
              <Button className="flex-1" onClick={() => router.push('/family')}>
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSend} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-body text-base">Invitee Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="member@example.com"
                    value={form.email}
                    onChange={(e) => handleUpdate('email', e.target.value)}
                    required
                  />
                </div>
                <Input
                  label="Name (optional)"
                  placeholder="Rohit Sharma"
                  value={form.name}
                  onChange={(e) => handleUpdate('name', e.target.value)}
                />
                <Select
                  label="Relation"
                  options={RELATION_OPTIONS}
                  value={form.relation}
                  onChange={(e) => handleUpdate('relation', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Role selection */}
          <Card>
            <CardHeader>
              <CardTitle className="font-body text-base">Assign Role</CardTitle>
              <CardDescription>What can this member do?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(Object.entries(ROLE_INFO) as [Exclude<FamilyRole, 'owner'>, typeof ROLE_INFO[keyof typeof ROLE_INFO]][]).map(([role, info]) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleUpdate('role', role)}
                  className={cn(
                    'w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all',
                    form.role === role ? 'border-gold-soft bg-gold-whisper' : 'border-sand-light bg-ivory-warm hover:border-gold-soft/40'
                  )}
                >
                  <info.icon className={cn('w-4 h-4 shrink-0 mt-0.5', form.role === role ? 'text-gold-deep' : 'text-greige')} />
                  <div className="flex-1">
                    <p className="text-sm font-body font-semibold text-charcoal-deep mb-1">{info.title}</p>
                    <div className="space-y-0.5">
                      {info.perms.map((p) => (
                        <p key={p} className="text-xs text-greige">{p}</p>
                      ))}
                    </div>
                  </div>
                  {form.role === role && <Check className="w-4 h-4 text-gold-deep shrink-0 mt-0.5" />}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Personal message */}
          <Card>
            <CardContent className="p-4">
              <label className="block text-sm font-body font-medium text-charcoal-warm mb-1.5">
                Personal message (optional)
              </label>
              <textarea
                rows={3}
                placeholder="Add a note to your invitation..."
                value={form.message}
                onChange={(e) => handleUpdate('message', e.target.value)}
                className="w-full bg-ivory-warm border border-sand-DEFAULT rounded-xl px-4 py-2.5 text-sm font-body text-charcoal-deep resize-none focus:outline-none focus:border-gold-soft focus:ring-1 focus:ring-gold-soft/30 transition-all"
              />
            </CardContent>
          </Card>

          {inviteError && (
            <div className="flex items-center gap-2 bg-error/70 border border-error-DEFAULT/40 rounded-xl p-3">
              <p className="text-xs font-body text-ivory-cream font-medium">{inviteError}</p>
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" isLoading={step === 'sending'} disabled={!form.email}>
            <Mail className="w-4 h-4" />
            {step === 'sending' ? 'Sending invitation...' : 'Send Invitation'}
          </Button>
        </form>
      )}
    </div>
  )
}
