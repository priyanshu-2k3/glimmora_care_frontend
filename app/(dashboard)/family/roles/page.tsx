'use client'

import { ArrowLeft, Crown, Shield, Users, Eye, Check, X } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import type { FamilyRole } from '@/types/profile'

interface Permission {
  id: string
  label: string
  category: string
}

const PERMISSIONS: Permission[] = [
  { id: 'view_records', label: 'View health records', category: 'Records' },
  { id: 'upload_records', label: 'Upload health records', category: 'Records' },
  { id: 'delete_records', label: 'Delete health records', category: 'Records' },
  { id: 'manage_consent', label: 'Manage own consents', category: 'Consent' },
  { id: 'approve_consent', label: 'Approve consent requests', category: 'Consent' },
  { id: 'invite_members', label: 'Invite new members', category: 'Family' },
  { id: 'manage_roles', label: 'Change member roles', category: 'Family' },
  { id: 'remove_members', label: 'Remove members', category: 'Family' },
  { id: 'view_audit', label: 'View audit trail', category: 'Access' },
  { id: 'emergency_access', label: 'Trigger emergency access', category: 'Access' },
  { id: 'export_data', label: 'Export health data', category: 'Access' },
]

const ROLE_PERMISSIONS: Record<FamilyRole, string[]> = {
  owner: PERMISSIONS.map((p) => p.id),
  admin: ['view_records', 'upload_records', 'manage_consent', 'approve_consent', 'invite_members', 'manage_roles', 'view_audit', 'emergency_access', 'export_data'],
  member: ['view_records', 'upload_records', 'manage_consent', 'emergency_access'],
  view_only: ['view_records'],
}

const ROLES: { role: FamilyRole; icon: React.ElementType; label: string; desc: string; color: string }[] = [
  { role: 'owner', icon: Crown, label: 'Owner', desc: 'Full control', color: 'text-gold-deep' },
  { role: 'admin', icon: Shield, label: 'Admin', desc: 'Manage members & records', color: 'text-charcoal-deep' },
  { role: 'member', icon: Users, label: 'Member', desc: 'View & upload records', color: 'text-stone' },
  { role: 'view_only', icon: Eye, label: 'View Only', desc: 'Read-only access', color: 'text-greige' },
]

export default function FamilyRolesPage() {
  const categories = [...new Set(PERMISSIONS.map((p) => p.category))]

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/family" className="p-1.5 text-greige hover:text-charcoal-deep rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep">Roles & Permissions</h1>
          <p className="text-sm text-greige font-body mt-0.5">What each family role can do</p>
        </div>
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ROLES.map((r) => (
          <Card key={r.role} className="p-4 text-center">
            <r.icon className={cn('w-6 h-6 mx-auto mb-2', r.color)} />
            <p className="text-sm font-body font-semibold text-charcoal-deep">{r.label}</p>
            <p className="text-[11px] text-greige mt-0.5">{r.desc}</p>
            <p className="text-[11px] font-body font-medium text-gold-deep mt-1">
              {ROLE_PERMISSIONS[r.role].length} permissions
            </p>
          </Card>
        ))}
      </div>

      {/* Permission matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="font-body text-base">Permission Matrix</CardTitle>
          <CardDescription>What each role can do across all features</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-light">
                <th className="text-left px-5 py-3 text-xs font-body font-semibold text-greige uppercase tracking-wide w-1/2">Permission</th>
                {ROLES.map((r) => (
                  <th key={r.role} className="px-3 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <r.icon className={cn('w-3.5 h-3.5', r.color)} />
                      <span className="text-[10px] font-body font-semibold text-charcoal-deep">{r.label}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <>
                  <tr key={`cat-${cat}`} className="bg-parchment">
                    <td colSpan={5} className="px-5 py-2 text-[10px] font-body font-semibold text-greige uppercase tracking-widest">{cat}</td>
                  </tr>
                  {PERMISSIONS.filter((p) => p.category === cat).map((perm) => (
                    <tr key={perm.id} className="border-b border-sand-light/50 hover:bg-ivory-warm transition-colors">
                      <td className="px-5 py-3 text-sm font-body text-charcoal-deep">{perm.label}</td>
                      {ROLES.map((r) => (
                        <td key={r.role} className="px-3 py-3 text-center">
                          {ROLE_PERMISSIONS[r.role].includes(perm.id) ? (
                            <Check className="w-4 h-4 text-success-DEFAULT mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-greige/40 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="bg-ivory-warm border border-sand-light rounded-xl p-4">
        <p className="text-xs text-greige font-body">Role changes take effect immediately. The account owner's role cannot be changed. Contact GlimmoraCare support if you need to transfer ownership.</p>
      </div>
    </div>
  )
}
