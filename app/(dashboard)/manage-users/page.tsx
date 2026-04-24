'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Users, Search, Shield, Trash2, ChevronDown, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { adminApi, ApiError, type AdminUserOut } from '@/lib/api'
import { cn } from '@/lib/utils'

const ROLE_VARIANT: Record<string, 'info' | 'gold' | 'success' | 'warning' | 'dark'> = {
  doctor: 'info',
  admin: 'gold',
  super_admin: 'dark',
  patient: 'success',
}

const ROLE_OPTIONS = [
  { value: 'patient', label: 'Patient' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
]

interface UserRowProps {
  u: AdminUserOut
  currentUserId: string
  onUpdated: (updated: AdminUserOut) => void
  onDeleted: (id: string) => void
}

function UserRow({ u, currentUserId, onUpdated, onDeleted }: UserRowProps) {
  const [showActions, setShowActions] = useState(false)
  const [roleValue, setRoleValue] = useState(u.role)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const isSelf = u.id === currentUserId

  async function handleRoleChange(newRole: string) {
    if (newRole === u.role) return
    setSaving(true)
    setError(null)
    try {
      const updated = await adminApi.updateUser(u.id, { role: newRole })
      setRoleValue(updated.role)
      onUpdated(updated)
      setSuccess('Role updated')
      setTimeout(() => setSuccess(null), 2000)
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : 'Failed to update role')
      setRoleValue(u.role)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive() {
    setSaving(true)
    setError(null)
    try {
      const updated = await adminApi.updateUser(u.id, { is_active: !u.is_active })
      onUpdated(updated)
      setSuccess(updated.is_active ? 'User activated' : 'User deactivated')
      setTimeout(() => setSuccess(null), 2000)
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : 'Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      await adminApi.deleteUser(u.id)
      onDeleted(u.id)
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : 'Failed to delete user')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email

  return (
    <Card hover>
      <CardContent>
        <div className="space-y-3">
          {/* Main row */}
          <div className="flex items-center gap-3">
            <Avatar name={name} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-body font-semibold text-charcoal-deep text-sm">{name}</p>
              <p className="text-xs text-greige truncate">{u.email}</p>
              {u.organization && <p className="text-xs text-greige">{u.organization}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={ROLE_VARIANT[u.role] ?? 'dark'} className="capitalize hidden sm:flex">
                {u.role.replace('_', ' ')}
              </Badge>
              <Badge variant={u.is_active ? 'success' : 'error'} className="hidden sm:flex">
                {u.is_active ? 'Active' : 'Inactive'}
              </Badge>
              {!isSelf && (
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-1.5 rounded-lg text-greige hover:text-charcoal-deep hover:bg-parchment transition-colors"
                >
                  <ChevronDown className={cn('w-4 h-4 transition-transform', showActions && 'rotate-180')} />
                </button>
              )}
              {isSelf && <Badge variant="warning">You</Badge>}
            </div>
          </div>

          {/* Expanded actions */}
          {showActions && !isSelf && (
            <div className="pt-2 border-t border-sand-light space-y-3">
              {error && (
                <div className="flex items-center gap-2 bg-error-soft border border-error-DEFAULT/20 rounded-xl p-2.5">
                  <AlertCircle className="w-3.5 h-3.5 text-error-DEFAULT shrink-0" />
                  <p className="text-xs font-body text-error-DEFAULT">{error}</p>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 bg-success-soft border border-success-DEFAULT/20 rounded-xl p-2.5">
                  <CheckCircle className="w-3.5 h-3.5 text-success-DEFAULT shrink-0" />
                  <p className="text-xs font-body text-success-DEFAULT">{success}</p>
                </div>
              )}
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex-1 min-w-36">
                  <Select
                    label="Role"
                    options={ROLE_OPTIONS}
                    value={roleValue}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    disabled={saving}
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleToggleActive}
                  isLoading={saving}
                  className={u.is_active ? 'border-warning-DEFAULT/30 text-warning-DEFAULT hover:bg-warning-soft' : 'border-success-DEFAULT/30 text-success-DEFAULT hover:bg-success-soft'}
                >
                  {u.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                {confirmDelete ? (
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)} disabled={deleting}>Cancel</Button>
                    <Button
                      size="sm"
                      onClick={handleDelete}
                      isLoading={deleting}
                      className="bg-error-DEFAULT text-white border-0 hover:opacity-90"
                    >
                      Confirm Delete
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDelete}
                    className="text-error-DEFAULT hover:bg-error-soft"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </Button>
                )}
              </div>
              {saving && (
                <div className="flex items-center gap-1.5 text-xs text-greige">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving…
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function ManageUsersPage() {
  const { user } = useAuth()
  const PAGE_SIZE = 20
  const [users, setUsers] = useState<AdminUserOut[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const load = useCallback(async (q = '') => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminApi.listUsers(q)
      setUsers(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Debounced backend search — fires 400ms after the user stops typing
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  function handleSearch(q: string) {
    setSearch(q)
    setPage(1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => load(q), 400)
  }

  const filtered = users
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageSlice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    doctors: users.filter((u) => u.role === 'doctor').length,
    patients: users.filter((u) => u.role === 'patient').length,
  }

  return (
    <RoleGuard allowed={['super_admin']}>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-body text-2xl font-bold text-charcoal-deep flex items-center gap-2">
              <Shield className="w-5 h-5 text-gold-soft" />
              Manage Users
            </h1>
            <p className="text-sm text-greige font-body mt-1">View and manage all registered users on the platform.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => load(search)} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Users', value: stats.total },
            { label: 'Active', value: stats.active },
            { label: 'Doctors', value: stats.doctors },
            { label: 'Patients', value: stats.patients },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <p className="font-display text-2xl text-charcoal-deep">{s.value}</p>
              <p className="text-xs text-greige font-body mt-0.5">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Search */}
        <Input
          placeholder="Search by name, email, or role…"
          leftIcon={<Search className="w-4 h-4" />}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          data-testid="users-search"
        />

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-error-soft border border-error-DEFAULT/20 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 text-error-DEFAULT shrink-0" />
            <p className="text-xs font-body text-error-DEFAULT">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-gold-soft animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title="No users found" description="Try a different search term." />
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-greige font-body">
              {filtered.length} user{filtered.length !== 1 ? 's' : ''}
              {totalPages > 1 && ` · page ${page} of ${totalPages}`}
            </p>
            {pageSlice.map((u) => (
              <UserRow
                key={u.id}
                u={u}
                currentUserId={user?.id ?? ''}
                onUpdated={(updated) => setUsers((prev) => prev.map((x) => x.id === updated.id ? updated : x))}
                onDeleted={(id) => setUsers((prev) => prev.filter((x) => x.id !== id))}
              />
            ))}
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
