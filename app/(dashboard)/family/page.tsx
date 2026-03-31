'use client'

import { useState, useEffect } from 'react'
import { Users, Mail, Crown, Shield, Eye, UserPlus, Trash2, RefreshCw, Clock, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Avatar } from '@/components/ui/Avatar'
import { useProfile } from '@/context/ProfileContext'
import { useAuth } from '@/context/AuthContext'
import { familyApi, ApiError, type BackendInvite } from '@/lib/api'
import type { FamilyRole } from '@/types/profile'

const ROLE_META: Record<string, { label: string; desc: string; icon: React.ElementType; variant: 'gold' | 'info' | 'default' }> = {
  owner:     { label: 'Owner',     desc: 'Full control',           icon: Crown,  variant: 'gold' },
  admin:     { label: 'Admin',     desc: 'Can manage members',     icon: Shield, variant: 'default' },
  member:    { label: 'Member',    desc: 'Can view & add records', icon: Users,  variant: 'info' },
  view_only: { label: 'View Only', desc: 'Read-only access',       icon: Eye,    variant: 'default' },
}

const ROLE_OPTIONS: { value: FamilyRole; label: string }[] = [
  { value: 'admin',     label: 'Admin' },
  { value: 'member',    label: 'Member' },
  { value: 'view_only', label: 'View Only' },
]

export default function FamilyPage() {
  const { user } = useAuth()
  const { family, familyMembers, isLoading } = useProfile()
  const isRealPatient = !!user?.accessToken && user.role === 'patient'

  const [invites, setInvites] = useState<BackendInvite[]>([])
  const [loadingInvites, setLoadingInvites] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'member' as FamilyRole })
  const [inviting, setInviting] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    if (!isRealPatient || !family) return
    setLoadingInvites(true)
    familyApi.listInvites()
      .then(setInvites)
      .catch(() => {})
      .finally(() => setLoadingInvites(false))
  }, [isRealPatient, family?.id])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setInviteError(null)
    try {
      const { inviteId } = await familyApi.invite(inviteForm.email, inviteForm.role)
      // Reload invites
      const updated = await familyApi.listInvites().catch(() => invites)
      setInvites(updated)
      setInviteSent(true)
      setTimeout(() => { setInviteSent(false); setShowInvite(false); setInviteForm({ email: '', role: 'member' }) }, 2000)
    } catch (err) {
      setInviteError(
        err instanceof ApiError && err.status === 404
          ? 'No account found with this email. Ask them to register first.'
          : err instanceof ApiError ? err.detail : 'Failed to send invite.'
      )
    } finally {
      setInviting(false)
    }
  }

  async function handleResend(inviteId: string) {
    setResendingId(inviteId)
    try {
      await familyApi.resendInvite(inviteId)
    } catch {}
    setResendingId(null)
  }

  async function handleCancel(inviteId: string) {
    setCancellingId(inviteId)
    try {
      await familyApi.cancelInvite(inviteId)
      setInvites((prev) => prev.filter((i) => i.id !== inviteId))
    } catch {}
    setCancellingId(null)
  }

  const pendingInvites = invites.filter((i) => i.status === 'pending')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-gold-soft animate-spin" />
      </div>
    )
  }

  if (!family && isRealPatient) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center py-10">
          <Users className="w-10 h-10 text-greige mx-auto mb-3" />
          <h2 className="font-display text-xl text-charcoal-deep mb-2">No Family Group</h2>
          <p className="text-sm text-greige font-body">You are not part of a family group yet.</p>
        </Card>
      </div>
    )
  }

  const familyName = family?.name ?? 'Your Family'
  const totalMembers = familyMembers.length

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep">{familyName}</h1>
          <p className="text-sm text-greige font-body mt-1">{totalMembers} member{totalMembers !== 1 ? 's' : ''} · Family health management</p>
        </div>
        {isRealPatient && (
          <Button onClick={() => setShowInvite(true)} size="sm">
            <UserPlus className="w-4 h-4" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Members', value: totalMembers, icon: Users },
          { label: 'Active', value: totalMembers, icon: Shield },
          { label: 'Pending', value: pendingInvites.length, icon: Clock },
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
          {familyMembers.map((member) => {
            const roleKey = family?.member_roles?.[member.user_id] ?? 'member'
            const meta = ROLE_META[roleKey] ?? ROLE_META.member
            const RoleIcon = meta.icon
            const displayName = [member.first_name, member.last_name].filter(Boolean).join(' ') || member.email || member.user_id
            return (
              <div key={member.user_id} className="flex items-center gap-3 py-2 border-b border-sand-light last:border-0">
                <Avatar name={displayName} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-body font-semibold text-charcoal-deep truncate">{displayName}</p>
                    <Badge variant={meta.variant}>
                      <RoleIcon className="w-3 h-3 mr-1" />
                      {meta.label}
                    </Badge>
                  </div>
                  {member.email && <p className="text-xs text-greige truncate">{member.email}</p>}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Pending invites */}
      {(pendingInvites.length > 0 || loadingInvites) && (
        <Card>
          <CardHeader>
            <CardTitle className="font-body text-base">Pending Invites</CardTitle>
            <CardDescription>Awaiting acceptance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingInvites ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 text-gold-soft animate-spin" />
              </div>
            ) : pendingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center gap-3 py-2 border-b border-sand-light last:border-0">
                <div className="w-9 h-9 rounded-full bg-ivory-warm border border-dashed border-greige flex items-center justify-center">
                  <Mail className="w-4 h-4 text-greige" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-medium text-charcoal-deep truncate">{invite.email}</p>
                  <p className="text-xs text-greige capitalize">{invite.role}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="warning">Pending</Badge>
                  <button
                    onClick={() => handleResend(invite.id)}
                    disabled={resendingId === invite.id}
                    className="p-1.5 text-greige hover:text-charcoal-deep rounded-lg transition-colors"
                    title="Resend"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resendingId === invite.id ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleCancel(invite.id)}
                    disabled={cancellingId === invite.id}
                    className="p-1.5 text-greige hover:text-error-DEFAULT rounded-lg transition-colors"
                    title="Cancel"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
            <CardDescription>They'll receive an email to join {familyName}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="member@example.com"
                value={inviteForm.email}
                onChange={(e) => { setInviteForm((p) => ({ ...p, email: e.target.value })); setInviteError(null) }}
                required
              />
              <Select
                label="Role"
                options={ROLE_OPTIONS}
                value={inviteForm.role}
                onChange={(e) => setInviteForm((p) => ({ ...p, role: e.target.value as FamilyRole }))}
              />
              {inviteError && <p className="text-xs text-error-DEFAULT font-body">{inviteError}</p>}
              <div className={`text-xs font-body p-3 rounded-lg ${inviteSent ? 'bg-success-soft text-success-DEFAULT' : ''}`}>
                {inviteSent ? '✓ Invite sent successfully!' : (
                  <span className="text-greige">
                    <strong>admin</strong> — can manage members &nbsp;·&nbsp; <strong>member</strong> — view &amp; add records &nbsp;·&nbsp; <strong>view_only</strong> — read only
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
