'use client'

import { useEffect, useState } from 'react'
import { Search, Shield, Users as UsersIcon, Loader2 } from 'lucide-react'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { adminApi, type AdminUserOut } from '@/lib/api'
import { formatDate } from '@/lib/utils'

const ROLE_BADGE: Record<string, string> = {
  super_admin: 'bg-violet-soft text-violet-muted',
  admin:       'bg-amber-soft text-amber-muted',
  doctor:      'bg-ocean-soft text-ocean-muted',
  patient:     'bg-emerald-soft text-emerald-muted',
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState<AdminUserOut[]>([])
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load(s = search) {
    setLoading(true)
    try {
      const data = await adminApi.listUsers(s)
      setUsers(data)
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load('') }, [])

  useEffect(() => {
    const t = setTimeout(() => load(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const filtered = role ? users.filter((u) => u.role === role) : users

  async function toggleActive(u: AdminUserOut) {
    setBusyId(u.id)
    try {
      const updated = await adminApi.updateUser(u.id, { is_active: !u.is_active })
      setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)))
    } catch {} finally { setBusyId(null) }
  }

  return (
    <RoleGuard allowed={['super_admin']}>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep flex items-center gap-2">
            <Shield className="w-5 h-5 text-gold-soft" /> Manage Users
          </h1>
          <p className="text-sm text-greige font-body mt-1">
            Platform-wide user list. Search, filter by role, toggle active state.
          </p>
        </div>

        <Card>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Search by email, first or last name…"
                  leftIcon={<Search className="w-4 h-4" />}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="text-sm font-body border border-sand-light rounded-xl px-3 py-2 bg-ivory-cream focus:outline-none focus:border-gold-soft"
              >
                <option value="">All roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="doctor">Doctor</option>
                <option value="patient">Patient</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            {loading ? (
              <div className="py-10 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-gold-soft animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-greige font-body py-8 text-center">No users.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-greige border-b border-sand-light">
                    <tr>
                      <th className="py-2 pr-3 font-medium">Name</th>
                      <th className="py-2 pr-3 font-medium">Email</th>
                      <th className="py-2 pr-3 font-medium">Role</th>
                      <th className="py-2 pr-3 font-medium">Org</th>
                      <th className="py-2 pr-3 font-medium">Verified</th>
                      <th className="py-2 pr-3 font-medium">Active</th>
                      <th className="py-2 pr-3 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => (
                      <tr key={u.id} className="border-b border-sand-light/50 last:border-0">
                        <td className="py-2.5 pr-3 font-body text-charcoal-deep">
                          {[u.first_name, u.last_name].filter(Boolean).join(' ') || '—'}
                        </td>
                        <td className="py-2.5 pr-3 font-body text-stone">{u.email}</td>
                        <td className="py-2.5 pr-3">
                          <span className={`text-[10px] font-body font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGE[u.role] ?? 'bg-parchment text-charcoal-warm'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 text-xs text-stone">{u.organization ?? '—'}</td>
                        <td className="py-2.5 pr-3 text-xs">
                          {u.email_verified ? <span className="text-[#059669]">✓</span> : <span className="text-[#B91C1C]">✗</span>}
                        </td>
                        <td className="py-2.5 pr-3">
                          <button
                            onClick={() => toggleActive(u)}
                            disabled={busyId === u.id || u.role === 'super_admin'}
                            className={`text-[10px] font-body font-semibold px-2 py-0.5 rounded-full transition-opacity ${u.is_active ? 'bg-emerald-soft text-emerald-muted' : 'bg-[#FEE2E2] text-[#B91C1C]'} ${u.role === 'super_admin' ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                          >
                            {busyId === u.id ? '…' : u.is_active ? 'Active' : 'Disabled'}
                          </button>
                        </td>
                        <td className="py-2.5 pr-3 text-xs text-greige">
                          {u.created_at ? formatDate(u.created_at) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-greige font-body flex items-center gap-2">
          <UsersIcon className="w-3.5 h-3.5" /> Total shown: {filtered.length}
        </p>
      </div>
    </RoleGuard>
  )
}
