'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Crown, Shield, Eye, Trash2, RefreshCw, Mail, Check, X, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import { useProfile } from '@/context/ProfileContext'
import { useAuth } from '@/context/AuthContext'
import { familyApi, ApiError, type BackendInvite } from '@/lib/api'
import type { FamilyRole } from '@/types/profile'

const ROLE_META: Record<string, { label: string; icon: React.ElementType; color: string; desc: string }> = {
  owner:     { label: 'Owner',     icon: Crown,  color: 'text-gold-deep',     desc: 'Full control of family account' },
  admin:     { label: 'Admin',     icon: Shield, color: 'text-charcoal-deep', desc: 'Can manage members & records' },
  member:    { label: 'Member',    icon: Users,  color: 'text-stone',         desc: 'Can view & add own records' },
  view_only: { label: 'View Only', icon: Eye,    color: 'text-greige',        desc: 'Read-only access' },
}

const ROLE_SELECT_OPTIONS: { value: FamilyRole; label: string }[] = [
  { value: 'admin',     label: 'Admin' },
  { value: 'member',    label: 'Member' },
  { value: 'view_only', label: 'View Only' },
]

export default function FamilyMembersPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { family, familyMembers, isLoading } = useProfile()
  const isRealPatient = !!user?.accessToken && user.role === 'patient'

  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [pendingRole, setPendingRole] = useState<FamilyRole | null>(null)
  const [savingRole, setSavingRole] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const [invites, setInvites] = useState<BackendInvite[]>([])
  const [loadingInvites, setLoadingInvites] = useState(false)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  // Local members state so role/remove changes reflect immediately
  const [localMembers, setLocalMembers] = useState(familyMembers)
  useEffect(() => { setLocalMembers(familyMembers) }, [familyMembers])

  useEffect(() => {
    if (!isRealPatient || !family) return
    setLoadingInvites(true)
    familyApi.listInvites()
      .then(setInvites)
      .catch(() => {})
      .finally(() => setLoadingInvites(false))
  }, [isRealPatient, family?.id])

  async function changeRole(memberId: string, role: FamilyRole) {
    setSavingRole(true)
    try {
      await familyApi.updateMemberRole(memberId, role)
      setLocalMembers((prev) => prev.map((m) => m.user_id === memberId ? { ...m, role } : m))
    } catch {}
    setSavingRole(false)
    setEditingRole(null)
    setPendingRole(null)
  }

  async function removeMember(memberId: string) {
    setRemovingId(memberId)
    try {
      await familyApi.removeMember(memberId)
      setLocalMembers((prev) => prev.filter((m) => m.user_id !== memberId))
    } catch {}
    setRemovingId(null)
  }

  async function handleResend(inviteId: string) {
    setResendingId(inviteId)
    try { await familyApi.resendInvite(inviteId) } catch {}
    setResendingId(null)
  }

  async function handleCancelInvite(inviteId: string) {
    setCancellingId(inviteId)
    try {
      await familyApi.cancelInvite(inviteId)
      setInvites((prev) => prev.filter((i) => i.id !== inviteId))
    } catch {}
    setCancellingId(null)
  }

  const pendingInvites = invites.filter((i) => i.status === 'pending')
  const familyName = family?.name ?? 'Your Family'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-gold-soft animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/family" className="p-1.5 text-greige hover:text-charcoal-deep rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep">Manage Members</h1>
          <p className="text-sm text-greige font-body mt-0.5">{familyName} · {localMembers.length} total members</p>
        </div>
      </div>

      {/* Role reference */}
      <Card>
        <CardContent className="p-4 grid grid-cols-2 gap-3">
          {(Object.entries(ROLE_META) as [string, typeof ROLE_META[string]][]).map(([role, meta]) => (
            <div key={role} className="flex items-start gap-2">
              <meta.icon className={cn('w-4 h-4 shrink-0 mt-0.5', meta.color)} />
              <div>
                <p className="text-xs font-body font-semibold text-charcoal-deep">{meta.label}</p>
                <p className="text-[11px] text-greige">{meta.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Active members */}
      <Card>
        <CardHeader>
          <CardTitle className="font-body text-base">Active Members ({localMembers.length})</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-sand-light">
          {localMembers.map((member) => {
            const roleKey = family?.member_roles?.[member.user_id] ?? member.role ?? 'member'
            const meta = ROLE_META[roleKey] ?? ROLE_META.member
            const isOwner = roleKey === 'owner'
            const isEditing = editingRole === member.user_id
            const displayName = [member.first_name, member.last_name].filter(Boolean).join(' ') || member.email || member.user_id
            return (
              <div key={member.user_id} className="flex items-center gap-3 py-3">
                <Avatar name={displayName} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-semibold text-charcoal-deep truncate">{displayName}</p>
                  {member.email && <p className="text-xs text-greige truncate">{member.email}</p>}
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Select
                      label=""
                      options={ROLE_SELECT_OPTIONS}
                      value={pendingRole || (roleKey as FamilyRole)}
                      onChange={(e) => setPendingRole(e.target.value as FamilyRole)}
                    />
                    <button
                      onClick={() => changeRole(member.user_id, pendingRole || (roleKey as FamilyRole))}
                      disabled={savingRole}
                      className="p-1.5 text-success-DEFAULT hover:bg-success-soft rounded-lg"
                    >
                      {savingRole ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button onClick={() => { setEditingRole(null); setPendingRole(null) }} className="p-1.5 text-greige hover:bg-parchment rounded-lg">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { if (!isOwner && isRealPatient) { setEditingRole(member.user_id); setPendingRole(roleKey as FamilyRole) } }}
                      disabled={isOwner || !isRealPatient}
                      className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-body font-medium transition-colors', (isOwner || !isRealPatient) ? 'cursor-default' : 'hover:bg-parchment cursor-pointer')}
                    >
                      <meta.icon className={cn('w-3.5 h-3.5', meta.color)} />
                      <span>{meta.label}</span>
                    </button>
                    {!isOwner && isRealPatient && (
                      <button
                        onClick={() => removeMember(member.user_id)}
                        disabled={removingId === member.user_id}
                        className="p-1.5 text-greige hover:text-error-DEFAULT rounded-lg transition-colors"
                      >
                        {removingId === member.user_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Pending invites */}
      {(pendingInvites.length > 0 || loadingInvites) && (
        <Card>
          <CardHeader>
            <CardTitle className="font-body text-base">Pending Invitations ({pendingInvites.length})</CardTitle>
            <CardDescription>Waiting for acceptance</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-sand-light">
            {loadingInvites ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 text-gold-soft animate-spin" />
              </div>
            ) : pendingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center gap-3 py-3">
                <div className="w-9 h-9 rounded-full bg-ivory-warm border border-dashed border-greige flex items-center justify-center">
                  <Mail className="w-4 h-4 text-greige" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-medium text-charcoal-deep truncate">{invite.email}</p>
                  <p className="text-xs text-greige capitalize">{invite.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning">Pending</Badge>
                  <button
                    onClick={() => handleResend(invite.id)}
                    disabled={resendingId === invite.id}
                    className="p-1.5 text-greige hover:text-charcoal-deep rounded-lg transition-colors"
                    title="Resend invite"
                  >
                    <RefreshCw className={cn('w-3.5 h-3.5', resendingId === invite.id && 'animate-spin')} />
                  </button>
                  <button
                    onClick={() => handleCancelInvite(invite.id)}
                    disabled={cancellingId === invite.id}
                    className="p-1.5 text-greige hover:text-error-DEFAULT rounded-lg transition-colors"
                    title="Cancel invite"
                  >
                    {cancellingId === invite.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => router.push('/family')}>
          <Mail className="w-4 h-4" />
          Invite New Member
        </Button>
        <Button variant="outline" onClick={() => router.push('/family')}>
          <Shield className="w-4 h-4" />
          Back to Family
        </Button>
      </div>
    </div>
  )
}
