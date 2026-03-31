'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, UserPlus, Shield, Eye, Users, Crown, ArrowLeft, Check, Copy, RefreshCw } from 'lucide-react'
import { MOCK_FAMILY } from '@/data/family'
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
  const [form, setForm] = useState<InviteForm>({
    email: '',
    name: '',
    relation: 'spouse',
    role: 'member',
    message: '',
  })
  const [step, setStep] = useState<'form' | 'sending' | 'sent'>('form')
  const [inviteLink] = useState('https://glimmora.care/invite/abc123xyz')
  const [copied, setCopied] = useState(false)
  const [method, setMethod] = useState<'email' | 'link'>('email')

  function handleUpdate(field: keyof InviteForm, value: string) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setStep('sending')
    await new Promise((r) => setTimeout(r, 1200))
    setStep('sent')
  }

  function copyLink() {
    navigator.clipboard.writeText(inviteLink).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
          <p className="text-sm text-greige font-body mt-0.5">Add someone to {MOCK_FAMILY.name}</p>
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
              {form.name || form.email} will receive an email invitation to join {MOCK_FAMILY.name}.
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
        <>
          {/* Invite method toggle */}
          <Card>
            <CardContent className="p-4 flex gap-2">
              {[
                { id: 'email' as const, label: 'Invite by Email', icon: Mail },
                { id: 'link' as const, label: 'Share Invite Link', icon: Copy },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-body font-medium transition-all',
                    method === m.id ? 'bg-charcoal-deep text-ivory-cream' : 'bg-ivory-warm text-greige hover:text-charcoal-deep'
                  )}
                >
                  <m.icon className="w-4 h-4" />
                  {m.label}
                </button>
              ))}
            </CardContent>
          </Card>

          {method === 'link' ? (
            <Card>
              <CardHeader>
                <CardTitle className="font-body text-base">Shareable Invite Link</CardTitle>
                <CardDescription>Anyone with this link can request to join {MOCK_FAMILY.name}. Set their role after they accept.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-parchment border border-sand-light rounded-xl px-4 py-3">
                    <p className="text-xs font-body text-stone truncate">{inviteLink}</p>
                  </div>
                  <Button variant="outline" onClick={copyLink}>
                    {copied ? <Check className="w-4 h-4 text-success-DEFAULT" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <p className="text-xs text-greige font-body">This link expires in 7 days. Regenerate anytime from Family settings.</p>
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

              <Button type="submit" className="w-full" size="lg" isLoading={step === 'sending'} disabled={!form.email}>
                <Mail className="w-4 h-4" />
                {step === 'sending' ? 'Sending invitation...' : 'Send Invitation'}
              </Button>
            </form>
          )}
        </>
      )}
    </div>
  )
}
