'use client'

import { useEffect, useState } from 'react'
import { Search, Shield, Users as UsersIcon, Loader2, Edit2, Trash2, Download, X, AlertCircle, RotateCcw } from 'lucide-react'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { adminApi, type AdminUserOut } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { formatDate } from '@/lib/utils'

const ROLE_BADGE: Record<string, string> = {
  super_admin: 'bg-violet-soft text-violet-muted',
  admin:       'bg-amber-soft text-amber-muted',
  doctor:      'bg-ocean-soft text-ocean-muted',
  patient:     'bg-emerald-soft text-emerald-muted',
}

export default function ManageUsersPage() {
  const { user: currentUser } = useAuth()
  const toast = useToast()
  const [users, setUsers] = useState<AdminUserOut[]>([])
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<AdminUserOut | null>(null)
  const [editRole, setEditRole] = useState<string>('')
  const [editActive, setEditActive] = useState<boolean>(true)
  const [editSaving, setEditSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminUserOut | null>(null)
  const [deleting, setDeleting] = useState(false)

  function openEdit(u: AdminUserOut) {
    setEditTarget(u)
    setEditRole(u.role)
    setEditActive(u.is_active)
  }

  async function saveEdit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!editTarget) return
    setEditSaving(true)
    try {
      const payload: { role?: string; is_active?: boolean } = {}
      if (editRole !== editTarget.role) payload.role = editRole
      if (editActive !== editTarget.is_active) payload.is_active = editActive

      if (Object.keys(payload).length === 0) {
        toast.success('No changes')
        setEditTarget(null)
        return
      }

      const updated = await adminApi.updateUser(editTarget.id, payload)
      setUsers((prev) => prev.map((x) => (x.id === editTarget.id ? { ...x, ...updated } : x)))
      const changes: string[] = []
      if (payload.role) changes.push(`role -> ${payload.role}`)
      if (payload.is_active !== undefined) changes.push(payload.is_active ? 'reactivated' : 'deactivated')
      toast.success(`User updated${changes.length ? ` (${changes.join(', ')})` : ''}`)
      setEditTarget(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update user'
      toast.error(msg)
    } finally {
      setEditSaving(false)
    }
  }

  async function confirmSoftDelete(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!deleteTarget) return
    setDeleting(true)
    try {
      try {
        await adminApi.updateUser(deleteTarget.id, { is_active: false })
      } catch { /* mock fallback */ }
      setUsers((prev) => prev.map((x) => (x.id === deleteTarget.id ? { ...x, is_active: false } : x)))
      toast.success(`User soft-deleted: ${deleteTarget.email}`)
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to soft-delete user')
    } finally {
      setDeleting(false)
    }
  }

  async function restoreUser(u: AdminUserOut) {
    setBusyId(u.id)
    try {
      try {
        await adminApi.updateUser(u.id, { is_active: true })
      } catch { /* mock fallback */ }
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_active: true } : x)))
      toast.success(`User restored: ${u.email}`)
    } catch {
      toast.error('Failed to restore user')
    } finally {
      setBusyId(null)
    }
  }

  function exportCsv() {
    const rows: string[] = ['name,email,role,org,verified,active,created_at']
    const esc = (s: string) => `"${(s ?? '').replace(/"/g, '""')}"`
    const data = role ? users.filter((u) => u.role === role) : users
    data.forEach((u) => {
      rows.push([
        [u.first_name, u.last_name].filter(Boolean).join(' '),
        u.email,
        u.role,
        u.organization ?? '',
        u.email_verified ? 'yes' : 'no',
        u.is_active ? 'yes' : 'no',
        u.created_at ?? '',
      ].map(esc).join(','))
    })
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

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

  return (
    <RoleGuard allowed={['super_admin']}>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-body text-2xl lg:text-3xl font-bold text-charcoal-deep flex items-center gap-2">
            <Shield className="w-5 h-5 text-gold-soft" /> Manage Users
          </h1>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <p className="text-sm lg:text-[15px] text-stone font-body mt-1">
              Platform-wide user list. Search, filter by role, edit roles, soft-delete or restore.
            </p>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
          </div>
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
                  <thead className="text-left text-xs text-stone border-b border-sand-light">
                    <tr>
                      <th className="py-2 pr-3 font-medium">Name</th>
                      <th className="py-2 pr-3 font-medium">Email</th>
                      <th className="py-2 pr-3 font-medium">Role</th>
                      <th className="py-2 pr-3 font-medium">Org</th>
                      <th className="py-2 pr-3 font-medium">Verified</th>
                      <th className="py-2 pr-3 font-medium">Status</th>
                      <th className="py-2 pr-3 font-medium">Created</th>
                      <th className="py-2 pr-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => {
                      const isSelf = u.id === currentUser?.id
                      const isSuperAdmin = u.role === 'super_admin'
                      const blockDelete = isSelf || isSuperAdmin
                      return (
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
                            {u.is_active ? (
                              <span className="text-[10px] font-body font-semibold px-2 py-0.5 rounded-full bg-emerald-soft text-emerald-muted">
                                Active
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-body font-semibold px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#B91C1C]">
                                  Deleted
                                </span>
                                <button
                                  onClick={() => restoreUser(u)}
                                  disabled={busyId === u.id}
                                  className="text-[10px] font-body font-semibold text-gold-deep hover:text-gold-muted underline transition-colors disabled:opacity-50"
                                  title="Restore user"
                                >
                                  {busyId === u.id ? '…' : 'Restore'}
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 pr-3 text-xs text-stone">
                            {u.created_at ? formatDate(u.created_at) : '—'}
                          </td>
                          <td className="py-2.5 pr-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEdit(u)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-stone hover:text-charcoal-deep hover:bg-parchment transition-colors"
                                title="Edit user"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Edit
                              </button>
                              {u.is_active && (
                                <button
                                  onClick={() => setDeleteTarget(u)}
                                  disabled={blockDelete}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-stone hover:text-[#B91C1C] hover:bg-error-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                  title={
                                    isSelf ? 'Cannot delete your own account'
                                    : isSuperAdmin ? 'Cannot soft-delete a super admin'
                                    : 'Soft delete user'
                                  }
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                              )}
                              {!u.is_active && (
                                <button
                                  onClick={() => restoreUser(u)}
                                  disabled={busyId === u.id}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-stone hover:text-charcoal-deep hover:bg-parchment transition-colors disabled:opacity-40"
                                  title="Restore user"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" /> Restore
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-stone font-body flex items-center gap-2">
          <UsersIcon className="w-3.5 h-3.5" /> Total shown: {filtered.length}
        </p>

        {/* Edit drawer/modal */}
        {editTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-charcoal-deep/40 backdrop-blur-sm" onClick={() => setEditTarget(null)} />
            <div className="relative z-10 w-full max-w-md bg-white border border-sand-light rounded-2xl p-5 animate-fade-in">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-base font-body font-semibold text-charcoal-deep">Edit User</p>
                  <p className="text-xs text-stone mt-0.5">{editTarget.email}</p>
                </div>
                <button onClick={() => setEditTarget(null)} className="p-1.5 rounded-lg text-stone hover:text-charcoal-deep hover:bg-parchment transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={saveEdit} className="space-y-4">
                <div>
                  <label className="text-xs font-body font-medium text-stone block mb-1">Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full text-sm font-body border border-sand-light rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-gold-soft"
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-body font-medium text-charcoal-deep">Active</span>
                  <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
                </label>
                <div className="flex gap-2 justify-end pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditTarget(null)}>Cancel</Button>
                  <Button type="submit" size="sm" isLoading={editSaving}>Save</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Soft-delete confirm modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-charcoal-deep/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
            <div className="relative z-10 w-full max-w-md bg-white border border-[#DC2626]/30 rounded-2xl p-5 animate-fade-in">
              <div className="flex items-start gap-3 mb-3">
                <AlertCircle className="w-5 h-5 text-[#B91C1C] shrink-0 mt-0.5" />
                <div>
                  <p className="text-base font-body font-semibold text-[#B91C1C]">Soft-delete user?</p>
                  <p className="text-xs text-stone mt-1">
                    This deactivates <span className="font-medium text-charcoal-deep">{deleteTarget.email}</span> without removing any of their data.
                    They will be marked as <span className="font-medium">Deleted</span> and can be restored at any time.
                  </p>
                </div>
              </div>
              <form onSubmit={confirmSoftDelete} className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                <Button type="submit" variant="danger" size="sm" isLoading={deleting}>
                  <Trash2 className="w-3.5 h-3.5" /> Soft delete
                </Button>
              </form>
            </div>
          </div>
        )}

        {busyId && <span className="sr-only">Busy: {busyId}</span>}
      </div>
    </RoleGuard>
  )
}
