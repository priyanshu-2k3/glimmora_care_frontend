'use client'

import { useState } from 'react'
import { Users, Crown, Shield, Eye, Trash2, RefreshCw, Mail, Check, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { MOCK_FAMILY } from '@/data/family'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import type { FamilyRole } from '@/types/profile'

const ROLE_META: Record<FamilyRole, { label: string; icon: React.ElementType; color: string; desc: string }> = {
  owner: { label: 'Owner', icon: Crown, color: 'text-gold-deep', desc: 'Full control of family account' },
  admin: { label: 'Admin', icon: Shield, color: 'text-charcoal-deep', desc: 'Can manage members & records' },
  member: { label: 'Member', icon: Users, color: 'text-stone', desc: 'Can view & add own records' },
  view_only: { label: 'View Only', icon: Eye, color: 'text-greige', desc: 'Read-only access' },
}

const ROLE_SELECT_OPTIONS: { value: FamilyRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'view_only', label: 'View Only' },
]

export default function FamilyMembersPage() {
  const [members, setMembers] = useState(MOCK_FAMILY.members)
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [pendingRole, setPendingRole] = useState<FamilyRole | null>(null)

  function changeRole(memberId: string, role: FamilyRole) {
    setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role } : m))
    setEditingRole(null)
    setPendingRole(null)
  }

  function removeMember(memberId: string) {
    setMembers((prev) => prev.filter((m) => m.id !== memberId))
  }

  const active = members.filter((m) => m.status === 'active')
  const pending = members.filter((m) => m.status === 'pending')

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/family" className="p-1.5 text-greige hover:text-charcoal-deep rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep">Manage Members</h1>
          <p className="text-sm text-greige font-body mt-0.5">{MOCK_FAMILY.name} · {members.length} total members</p>
        </div>
      </div>

      {/* Role reference */}
      <Card>
        <CardContent className="p-4 grid grid-cols-2 gap-3">
          {(Object.entries(ROLE_META) as [FamilyRole, typeof ROLE_META[FamilyRole]][]).map(([role, meta]) => (
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
          <CardTitle className="font-body text-base">Active Members ({active.length})</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-sand-light">
          {active.map((member) => {
            const meta = ROLE_META[member.role]
            const isOwner = member.role === 'owner'
            const isEditing = editingRole === member.id
            return (
              <div key={member.id} className="flex items-center gap-3 py-3">
                <Avatar name={member.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-semibold text-charcoal-deep truncate">{member.name}</p>
                  <p className="text-xs text-greige truncate">{member.email} · <span className="capitalize">{member.relation}</span></p>
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Select
                      label=""
                      options={ROLE_SELECT_OPTIONS}
                      value={pendingRole || member.role}
                      onChange={(e) => setPendingRole(e.target.value as FamilyRole)}
                    />
                    <button onClick={() => changeRole(member.id, pendingRole || member.role)} className="p-1.5 text-success-DEFAULT hover:bg-success-soft rounded-lg">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setEditingRole(null); setPendingRole(null) }} className="p-1.5 text-greige hover:bg-parchment rounded-lg">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { if (!isOwner) { setEditingRole(member.id); setPendingRole(member.role) } }}
                      disabled={isOwner}
                      className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-body font-medium transition-colors', isOwner ? 'cursor-default' : 'hover:bg-parchment cursor-pointer')}
                    >
                      <meta.icon className={cn('w-3.5 h-3.5', meta.color)} />
                      <span>{meta.label}</span>
                    </button>
                    {!isOwner && (
                      <button onClick={() => removeMember(member.id)} className="p-1.5 text-greige hover:text-error-DEFAULT rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
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
      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-body text-base">Pending Invitations ({pending.length})</CardTitle>
            <CardDescription>Waiting for acceptance</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-sand-light">
            {pending.map((member) => (
              <div key={member.id} className="flex items-center gap-3 py-3">
                <div className="w-9 h-9 rounded-full bg-ivory-warm border border-dashed border-greige flex items-center justify-center">
                  <Mail className="w-4 h-4 text-greige" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-medium text-charcoal-deep truncate">{member.name}</p>
                  <p className="text-xs text-greige truncate">{member.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning">Pending</Badge>
                  <button className="p-1.5 text-greige hover:text-charcoal-deep rounded-lg transition-colors" title="Resend invite">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => removeMember(member.id)} className="p-1.5 text-greige hover:text-error-DEFAULT rounded-lg transition-colors" title="Cancel invite">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => window.location.href = '/family/invite'}>
          <Mail className="w-4 h-4" />
          Invite New Member
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/family/roles'}>
          <Shield className="w-4 h-4" />
          Manage Roles
        </Button>
      </div>
    </div>
  )
}
