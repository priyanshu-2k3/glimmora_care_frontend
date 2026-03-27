'use client'

import { useState } from 'react'
import { Users, Mail, Crown, Shield, Eye, UserPlus, Trash2, RefreshCw, Clock } from 'lucide-react'
import { MOCK_FAMILY } from '@/data/family'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import type { FamilyRole } from '@/types/profile'

const ROLE_META: Record<FamilyRole, { label: string; desc: string; icon: React.ElementType; variant: 'gold' | 'info' | 'default' }> = {
  owner: { label: 'Owner', desc: 'Full control', icon: Crown, variant: 'gold' },
  admin: { label: 'Admin', desc: 'Can manage members', icon: Shield, variant: 'default' },
  member: { label: 'Member', desc: 'Can view & add records', icon: Users, variant: 'info' },
  view_only: { label: 'View Only', desc: 'Read-only access', icon: Eye, variant: 'default' },
}

const ROLE_OPTIONS: { value: FamilyRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'view_only', label: 'View Only' },
]

export default function FamilyPage() {
  const [family] = useState(MOCK_FAMILY)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'member' as FamilyRole })
  const [inviting, setInviting] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    await new Promise((r) => setTimeout(r, 1000))
    setInviting(false)
    setInviteSent(true)
    setTimeout(() => { setInviteSent(false); setShowInvite(false) }, 2000)
  }

  const activeMembers = family.members.filter((m) => m.status === 'active')
  const pendingMembers = family.members.filter((m) => m.status === 'pending')

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep">{family.name}</h1>
          <p className="text-sm text-greige font-body mt-1">{family.members.length} members · Family health management</p>
        </div>
        <Button onClick={() => setShowInvite(true)} size="sm">
          <UserPlus className="w-4 h-4" />
          Invite Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Members', value: family.members.length, icon: Users },
          { label: 'Active', value: activeMembers.length, icon: Shield },
          { label: 'Pending', value: pendingMembers.length, icon: Clock },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 text-center">
            <stat.icon className="w-5 h-5 text-gold-soft mx-auto mb-1" />
            <p className="font-display text-2xl text-charcoal-deep">{stat.value}</p>
            <p className="text-xs text-greige font-body">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Active members */}
      <Card>
        <CardHeader>
          <CardTitle className="font-body text-base">Active Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeMembers.map((member) => {
            const meta = ROLE_META[member.role]
            const RoleIcon = meta.icon
            return (
              <div key={member.id} className="flex items-center gap-3 py-2 border-b border-sand-light last:border-0">
                <Avatar name={member.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-body font-semibold text-charcoal-deep truncate">{member.name}</p>
                    <Badge variant={meta.variant}>
                      <RoleIcon className="w-3 h-3 mr-1" />
                      {meta.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-greige truncate">{member.email} · <span className="capitalize">{member.relation}</span></p>
                </div>
                {member.role !== 'owner' && (
                  <button className="p-1.5 text-greige hover:text-error-DEFAULT rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Pending invites */}
      {pendingMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-body text-base">Pending Invites</CardTitle>
            <CardDescription>Awaiting acceptance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3 py-2 border-b border-sand-light last:border-0">
                <div className="w-9 h-9 rounded-full bg-ivory-warm border border-dashed border-greige flex items-center justify-center">
                  <Mail className="w-4 h-4 text-greige" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-medium text-charcoal-deep truncate">{member.name}</p>
                  <p className="text-xs text-greige truncate">{member.email}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="warning">Pending</Badge>
                  <button className="p-1.5 text-greige hover:text-charcoal-deep rounded-lg transition-colors" title="Resend">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Invite form */}
      {showInvite && (
        <Card className="border-gold-soft/40">
          <CardHeader>
            <CardTitle className="font-body text-base">Invite Family Member</CardTitle>
            <CardDescription>They'll receive an email to join {family.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="member@example.com"
                value={inviteForm.email}
                onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))}
                required
              />
              <Select
                label="Role"
                options={ROLE_OPTIONS}
                value={inviteForm.role}
                onChange={(e) => setInviteForm((p) => ({ ...p, role: e.target.value as FamilyRole }))}
              />
              <div className={cn('text-xs font-body p-3 rounded-lg', {
                'bg-success-soft text-success-DEFAULT': inviteSent,
              })}>
                {inviteSent ? '✓ Invite sent successfully!' : (
                  <span className="text-greige">
                    <strong>admin</strong> — can manage members &nbsp;|&nbsp; <strong>member</strong> — view &amp; add records &nbsp;|&nbsp; <strong>view_only</strong> — read only
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit" isLoading={inviting} className="flex-1">
                  <Mail className="w-4 h-4" />
                  {inviting ? 'Sending...' : 'Send Invite'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
