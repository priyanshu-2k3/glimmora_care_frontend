'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Users, Plus, Save, AlertCircle, CheckCircle, Loader2, Edit2, Stethoscope, Search, ChevronDown, ChevronUp, UserCheck, UserMinus, Trash2, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/context/AuthContext'
import { orgApi, adminApi, ApiError, type OrgOut, type PatientOut, type AdminOrgItem } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { validatePhone, validateWebsite, normaliseWebsite } from '@/lib/validators'

// ─── Admin view ────────────────────────────────────────────────────────────────
function AdminOrgView() {
  const router = useRouter()
  const [org, setOrg] = useState<OrgOut | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', phone: '', website: '', logo: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create org form
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [creating, setCreating] = useState(false)

  // Stats
  const [doctorCount, setDoctorCount] = useState(0)
  const [patientCount, setPatientCount] = useState(0)

  // Co-admins
  const [admins, setAdmins] = useState<{ user_id: string; email: string; first_name: string | null; last_name: string | null }[]>([])
  const [showAddAdmin, setShowAddAdmin] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminFirst, setNewAdminFirst] = useState('')
  const [newAdminLast, setNewAdminLast] = useState('')
  const [addingAdmin, setAddingAdmin] = useState(false)
  const [addAdminMsg, setAddAdminMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    orgApi.getMine()
      .then((data) => {
        setOrg(data)
        setForm({ name: data.name, address: data.address ?? '', phone: data.phone ?? '', website: data.website ?? '', logo: '' })
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setShowCreate(true)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!org) return
    orgApi.listDoctors().then((d) => setDoctorCount(d.length)).catch(() => {})
    orgApi.listPatients().then((p) => setPatientCount(p.length)).catch(() => {})
    orgApi.listOrgAdmins().then(setAdmins).catch(() => {})
  }, [org?.id])

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault()
    if (!newAdminEmail.trim()) return
    setAddingAdmin(true)
    setAddAdminMsg(null)
    try {
      const result = await orgApi.addOrgAdmin({
        email: newAdminEmail.trim(),
        first_name: newAdminFirst.trim() || undefined,
        last_name: newAdminLast.trim() || undefined,
      })
      const refreshed = await orgApi.listOrgAdmins().catch(() => admins)
      setAdmins(refreshed)
      setAddAdminMsg({
        ok: true,
        text: result.account_created
          ? 'Co-admin account created. They will receive a setup email with the default password.'
          : 'Existing user promoted to admin and linked to your organisation.',
      })
      setNewAdminEmail(''); setNewAdminFirst(''); setNewAdminLast('')
      setTimeout(() => { setShowAddAdmin(false); setAddAdminMsg(null) }, 2500)
    } catch (err) {
      setAddAdminMsg({ ok: false, text: err instanceof ApiError ? err.detail : 'Failed to add admin.' })
    } finally {
      setAddingAdmin(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!createName.trim()) return
    setCreating(true)
    setError(null)
    try {
      const created = await orgApi.create(createName.trim())
      setOrg(created)
      setForm({ name: created.name, address: '', phone: '', website: '', logo: '' })
      setShowCreate(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : 'Failed to create organisation.')
    } finally {
      setCreating(false)
    }
  }

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const phoneErr = validatePhone(form.phone, { optional: true })
    if (phoneErr) { setError(phoneErr); return }
    const webErr = validateWebsite(form.website, { optional: true })
    if (webErr) { setError(webErr); return }
    setSaving(true)
    setError(null)
    try {
      const updated = await orgApi.update({
        name: form.name || undefined,
        address: form.address || undefined,
        phone: form.phone || undefined,
        website: form.website ? normaliseWebsite(form.website) : undefined,
      })
      setOrg(updated)
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : 'Failed to update organisation.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-gold-soft animate-spin" />
      </div>
    )
  }

  if (showCreate && !org) {
    return (
      <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep">Create Organisation</h1>
          <p className="text-sm text-greige font-body mt-1">Set up your healthcare organisation to start inviting doctors and managing patients.</p>
        </div>
        <Card>
          <CardHeader>
            <div className="w-14 h-14 bg-gold-whisper rounded-full flex items-center justify-center mx-auto mb-3 border border-gold-soft/40">
              <Building2 className="w-6 h-6 text-gold-deep" />
            </div>
            <CardTitle className="text-center font-body">New Organisation</CardTitle>
            <CardDescription className="text-center">You can edit the name and add details afterwards</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Organisation Name"
                placeholder="e.g. Sunrise Health Clinic"
                value={createName}
                onChange={(e) => { setCreateName(e.target.value); setError(null) }}
                required
              />
              {error && (
                <div className="flex items-center gap-2 bg-error-soft border border-[#DC2626]/20 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0" />
                  <p className="text-xs font-body text-[#B91C1C]">{error}</p>
                </div>
              )}
              <Button type="submit" isLoading={creating} className="w-full">
                <Plus className="w-4 h-4" />
                Create Organisation
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep">{org?.name ?? 'Organisation'}</h1>
          <p className="text-sm text-greige font-body mt-1">Manage your organisation, doctors, and patients</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
          <Edit2 className="w-4 h-4" />
          {editing ? 'Cancel' : 'Edit'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Doctors', value: doctorCount, icon: Stethoscope, href: '/organization/doctors' },
          { label: 'Patients', value: patientCount, icon: Users, href: '/organization/patients' },
        ].map((stat) => (
          <button key={stat.label} onClick={() => router.push(stat.href)} className="text-left">
            <Card className="p-4 hover:border-gold-soft/50 transition-colors cursor-pointer">
              <stat.icon className="w-5 h-5 text-gold-soft mb-1" />
              <p className="font-display text-2xl text-charcoal-deep">{stat.value}</p>
              <p className="text-xs text-greige font-body">{stat.label}</p>
            </Card>
          </button>
        ))}
      </div>

      {/* Org details card */}
      <Card>
        <CardHeader>
          <CardTitle className="font-body text-base">Organisation Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-error-soft border border-[#DC2626]/20 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0" />
              <p className="text-xs font-body text-[#B91C1C]">{error}</p>
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-2 bg-success-soft border border-success-DEFAULT/20 rounded-xl p-3">
              <CheckCircle className="w-4 h-4 text-success-DEFAULT shrink-0" />
              <p className="text-xs font-body text-success-DEFAULT">Organisation updated successfully.</p>
            </div>
          )}
          {editing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <Input label="Organisation Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              <Input label="Address" value={form.address} placeholder="123 Medical Street, Mumbai" onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
              <Input label="Phone" type="tel" value={form.phone} placeholder="+91 98765 43210" onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              <Input label="Website" type="url" value={form.website} placeholder="https://clinic.example.com" onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} />
              <Input label="Logo URL" type="url" value={form.logo} placeholder="https://clinic.example.com/logo.png" onChange={(e) => setForm((p) => ({ ...p, logo: e.target.value }))} hint="Public URL of your organisation logo (mock)" />
              <Button type="submit" isLoading={saving} className="w-full">
                <Save className="w-4 h-4" />
                {saved ? 'Saved!' : 'Save Changes'}
              </Button>
            </form>
          ) : (
            <div className="space-y-3 text-sm font-body">
              {[
                { label: 'Name', value: org?.name },
                { label: 'Address', value: org?.address },
                { label: 'Phone', value: org?.phone },
                { label: 'Website', value: org?.website },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-1.5 border-b border-sand-light last:border-0">
                  <span className="text-greige">{label}</span>
                  <span className="text-charcoal-deep font-medium">{value || <span className="text-greige italic">Not set</span>}</span>
                </div>
              ))}
              {org?.created_at && (
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-greige">Created</span>
                  <span className="text-greige text-xs">{new Date(org.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Co-admins */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-body text-base">Organisation Admins</CardTitle>
              <CardDescription>Other admins who can manage this organisation</CardDescription>
            </div>
            <Button size="sm" onClick={() => { setShowAddAdmin(!showAddAdmin); setAddAdminMsg(null) }}>
              <Plus className="w-3.5 h-3.5" />
              {showAddAdmin ? 'Cancel' : 'Add Admin'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showAddAdmin && (
            <form onSubmit={handleAddAdmin} className="bg-gold-whisper/30 border border-gold-soft/30 rounded-xl p-4 space-y-3">
              <Input
                label="Email"
                type="email"
                placeholder="newadmin@yourorg.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Input label="First name (optional)" value={newAdminFirst} onChange={(e) => setNewAdminFirst(e.target.value)} />
                <Input label="Last name (optional)" value={newAdminLast} onChange={(e) => setNewAdminLast(e.target.value)} />
              </div>
              {addAdminMsg && (
                <div className={cn('flex items-center gap-2 rounded-xl p-3 border',
                  addAdminMsg.ok ? 'bg-success-soft border-success-DEFAULT/20' : 'bg-error-soft border-[#DC2626]/20')}>
                  {addAdminMsg.ok
                    ? <CheckCircle className="w-4 h-4 text-success-DEFAULT shrink-0" />
                    : <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0" />}
                  <p className={cn('text-xs font-body', addAdminMsg.ok ? 'text-success-DEFAULT' : 'text-[#B91C1C]')}>{addAdminMsg.text}</p>
                </div>
              )}
              <Button type="submit" size="sm" isLoading={addingAdmin} disabled={!newAdminEmail.trim()}>
                <Plus className="w-3.5 h-3.5" />
                Add Admin
              </Button>
            </form>
          )}

          {admins.length === 0 ? (
            <p className="text-xs text-greige font-body py-4 text-center">No additional admins yet.</p>
          ) : (
            <div className="divide-y divide-sand-light">
              {admins.map((a) => {
                const name = `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim() || a.email
                return (
                  <div key={a.user_id} className="flex items-center gap-3 py-2.5">
                    <div className="w-8 h-8 rounded-full bg-gold-whisper border border-gold-soft/40 flex items-center justify-center shrink-0">
                      <UserCheck className="w-4 h-4 text-gold-deep" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body font-semibold text-charcoal-deep truncate">{name}</p>
                      {name !== a.email && <p className="text-xs text-greige truncate">{a.email}</p>}
                    </div>
                    <Badge variant="info">Admin</Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={() => router.push('/organization/doctors')} className="w-full">
          <Stethoscope className="w-4 h-4" />
          Manage Doctors
        </Button>
        <Button variant="outline" onClick={() => router.push('/organization/patients')} className="w-full">
          <Users className="w-4 h-4" />
          Manage Patients
        </Button>
      </div>
    </div>
  )
}

// ─── Assign Admin modal ────────────────────────────────────────────────────────
function AssignAdminModal({
  org,
  onClose,
  onSuccess,
}: {
  org: AdminOrgItem
  onClose: () => void
  onSuccess: (updatedOrg: AdminOrgItem) => void
}) {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    setSubmitting(true)
    setError(null)
    try {
      await adminApi.assignAdmin(org.id, { email: trimmed })
      setSuccess(true)
      setTimeout(() => {
        onSuccess({ ...org, admin_email: trimmed })
      }, 800)
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : 'Failed to assign admin.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal-deep/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <Card className="relative z-10 w-full max-w-md animate-fade-in">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="font-body text-base flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-gold-soft" />
                Assign Admin
              </CardTitle>
              <CardDescription className="mt-0.5">
                Assigning to: <span className="font-medium text-charcoal-deep">{org.name}</span>
              </CardDescription>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-greige hover:text-charcoal-deep hover:bg-parchment transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle className="w-10 h-10 text-success-DEFAULT" />
              <p className="text-sm font-body text-charcoal-deep font-medium">
                {org.admin_email ? 'Admin switched successfully!' : 'Admin assigned successfully!'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                ref={inputRef}
                label="User Email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null) }}
                required
              />
              <p className="text-xs text-greige font-body">
                The user&apos;s role will be promoted to <span className="font-medium text-charcoal-deep">Admin</span> and linked to this organisation.
              </p>
              {error && (
                <div className="flex items-center gap-2 bg-error-soft border border-[#DC2626]/20 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0" />
                  <p className="text-xs font-body text-[#B91C1C]">{error}</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" isLoading={submitting} disabled={!email.trim()} className="flex-1">
                  <UserCheck className="w-4 h-4" />
                  Assign
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Super Admin view ─────────────────────────────────────────────────────────
function SuperAdminOrgView() {
  const toast = useToast()
  const [orgs, setOrgs] = useState<AdminOrgItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  // Create org state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createAddress, setCreateAddress] = useState('')
  const [createPhone, setCreatePhone] = useState('')
  const [createWebsite, setCreateWebsite] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState(false)

  // Assign admin state
  const [assignOrgTarget, setAssignOrgTarget] = useState<AdminOrgItem | null>(null)

  // Edit / delete / remove-admin
  const [editTarget, setEditTarget] = useState<AdminOrgItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminOrgItem | null>(null)
  const [removeAdminTargetId, setRemoveAdminTargetId] = useState<string | null>(null)
  const [confirmRemoveAdmin, setConfirmRemoveAdmin] = useState<AdminOrgItem | null>(null)

  function loadOrgs() {
    return adminApi.listAllOrgs()
      .then((data) => setOrgs(data))
      .catch(() => setOrgs([]))
  }

  useEffect(() => {
    let active = true
    adminApi.listAllOrgs()
      .then((data) => { if (active) setOrgs(data) })
      .catch(() => { if (active) setOrgs([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const filtered = orgs.filter((o) =>
    !search ||
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    (o.admin_email ?? '').toLowerCase().includes(search.toLowerCase())
  )

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault()
    if (!createName.trim()) return
    const phoneErr = validatePhone(createPhone, { optional: true })
    if (phoneErr) { setCreateError(phoneErr); return }
    const webErr = validateWebsite(createWebsite, { optional: true })
    if (webErr) { setCreateError(webErr); return }
    setCreating(true)
    setCreateError(null)
    try {
      const created = await adminApi.createOrg({
        name: createName.trim(),
        address: createAddress.trim() || undefined,
        phone: createPhone.trim() || undefined,
        website: createWebsite.trim() ? normaliseWebsite(createWebsite) : undefined,
      })
      toast.success(`Organisation created: ${created.name}`)
      setCreateSuccess(true)
      setCreateName('')
      setCreateAddress('')
      setCreatePhone('')
      setCreateWebsite('')
      await loadOrgs()
      setTimeout(() => {
        setCreateSuccess(false)
        setShowCreateForm(false)
      }, 1200)
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.detail : 'Failed to create organisation.')
    } finally {
      setCreating(false)
    }
  }

  function handleAssignSuccess(updatedOrg: AdminOrgItem) {
    setOrgs((prev) => prev.map((o) => o.id === updatedOrg.id ? updatedOrg : o))
    toast.success(`Admin assigned to ${updatedOrg.name}`)
    setAssignOrgTarget(null)
    // Re-fetch from server so admin_email reflects the actual assigned admin
    loadOrgs()
  }

  async function handleRemoveAdmin(orgId: string) {
    setRemoveAdminTargetId(orgId)
    const org = orgs.find((o) => o.id === orgId)
    try {
      await adminApi.removeOrgAdmin(orgId)
      await loadOrgs()
      toast.success(`Admin removed from ${org?.name ?? 'organisation'}`)
    } catch (err) {
      const detail = err instanceof ApiError ? err.detail : (err instanceof Error ? err.message : 'Failed to remove admin')
      toast.error(detail)
      // eslint-disable-next-line no-console
      console.error('removeOrgAdmin failed', { orgId, err })
    }
    setRemoveAdminTargetId(null)
    setConfirmRemoveAdmin(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-gold-soft animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {assignOrgTarget && (
        <AssignAdminModal
          org={assignOrgTarget}
          onClose={() => setAssignOrgTarget(null)}
          onSuccess={handleAssignSuccess}
        />
      )}

      {editTarget && (
        <EditOrgModal
          org={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) => {
            setOrgs((prev) => prev.map((o) => o.id === updated.id ? { ...o, ...updated } : o))
            toast.success(`Organisation updated: ${updated.name}`)
            setEditTarget(null)
          }}
        />
      )}

      {confirmRemoveAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-charcoal-deep/40 backdrop-blur-sm" onClick={() => setConfirmRemoveAdmin(null)} />
          <Card className="relative z-10 w-full max-w-md animate-fade-in bg-white">
            <CardHeader>
              <CardTitle className="font-body text-base flex items-center gap-2 text-charcoal-deep">
                <UserMinus className="w-4 h-4 text-[#B91C1C]" />
                Remove Admin
              </CardTitle>
              <CardDescription className="mt-0.5">
                Detach <span className="font-medium text-charcoal-deep">{confirmRemoveAdmin.admin_email ?? 'the current admin'}</span> from{' '}
                <span className="font-medium text-charcoal-deep">{confirmRemoveAdmin.name}</span>?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); handleRemoveAdmin(confirmRemoveAdmin.id) }}>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => setConfirmRemoveAdmin(null)}>Cancel</Button>
                  <Button
                    type="submit"
                    variant="danger"
                    size="sm"
                    isLoading={removeAdminTargetId === confirmRemoveAdmin.id}
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                    Remove
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {deleteTarget && (
        <DeleteOrgModal
          org={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            const name = deleteTarget.name
            setOrgs((prev) => prev.filter((o) => o.id !== deleteTarget.id))
            toast.success(`Organisation deleted: ${name}`)
            setDeleteTarget(null)
          }}
        />
      )}

      <div>
        <h1 className="font-body text-2xl lg:text-3xl font-bold text-charcoal-deep flex items-center gap-2">
          <Building2 className="w-5 h-5 text-gold-soft" />
          All Organisations
        </h1>
        <p className="text-sm lg:text-[15px] text-stone font-body mt-1">Platform-wide view of all registered organisations.</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Orgs',      value: orgs.length },
          { label: 'Total Doctors',   value: orgs.reduce((s, o) => s + o.doctor_count, 0) },
          { label: 'Total Patients',  value: orgs.reduce((s, o) => s + o.patient_count, 0) },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="font-display text-2xl text-charcoal-deep">{s.value}</p>
            <p className="text-xs text-greige font-body mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* ── Create New Organisation card ── */}
      <Card className={cn('overflow-hidden transition-all duration-300', showCreateForm && 'border-gold-soft/50')}>
        <button
          type="button"
          onClick={() => { setShowCreateForm((v) => !v); setCreateError(null); setCreateSuccess(false) }}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-parchment/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-gold-soft" />
            <span className="font-body font-semibold text-charcoal-deep text-sm">Create New Organisation</span>
          </div>
          {showCreateForm
            ? <ChevronUp className="w-4 h-4 text-greige" />
            : <ChevronDown className="w-4 h-4 text-greige" />}
        </button>

        {showCreateForm && (
          <div className="border-t border-sand-light px-5 pb-5 pt-4 bg-white text-charcoal-deep">
            {createSuccess ? (
              <div className="flex items-center gap-2 bg-success-soft border border-success-DEFAULT/20 rounded-xl p-3">
                <CheckCircle className="w-4 h-4 text-success-DEFAULT shrink-0" />
                <p className="text-xs font-body text-success-DEFAULT">Organisation created successfully.</p>
              </div>
            ) : (
              <form onSubmit={handleCreateOrg} className="space-y-4 [&_label]:text-charcoal-deep [&_label]:font-semibold">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Organisation Name *"
                    placeholder="e.g. Sunrise Health Clinic"
                    value={createName}
                    onChange={(e) => { setCreateName(e.target.value); setCreateError(null) }}
                    required
                    className="sm:col-span-2"
                  />
                  <Input
                    label="Address"
                    placeholder="123 Medical Street, Mumbai"
                    value={createAddress}
                    onChange={(e) => setCreateAddress(e.target.value)}
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                  />
                  <Input
                    label="Website"
                    type="url"
                    placeholder="https://clinic.example.com"
                    value={createWebsite}
                    onChange={(e) => setCreateWebsite(e.target.value)}
                    className="sm:col-span-2"
                  />
                </div>
                {createError && (
                  <div className="flex items-center gap-2 bg-error-soft border border-[#DC2626]/20 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0" />
                    <p className="text-xs font-body text-[#B91C1C]">{createError}</p>
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" isLoading={creating} disabled={!createName.trim()}>
                    <Plus className="w-4 h-4" />
                    Create Organisation
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </Card>

      {/* Search */}
      <Input
        placeholder="Search by org name or admin email…"
        leftIcon={<Search className="w-4 h-4" />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Org list */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Building2 className="w-10 h-10 text-greige mx-auto mb-3" />
          <p className="text-sm text-greige font-body">No organisations found.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((org) => (
            <Card key={org.id} hover>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gold-whisper border border-gold-soft/40 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-gold-deep" />
                      </div>
                      <div>
                        <p className="font-body font-semibold text-charcoal-deep">{org.name}</p>
                        {org.admin_email
                          ? <p className="text-xs text-greige">Admin: {org.admin_email}</p>
                          : <p className="text-xs text-warning-DEFAULT italic">No admin assigned</p>}
                        {org.address && <p className="text-xs text-greige">{org.address}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      <Badge variant="info">{org.doctor_count} doctor{org.doctor_count !== 1 ? 's' : ''}</Badge>
                      <Badge variant="success">{org.patient_count} patient{org.patient_count !== 1 ? 's' : ''}</Badge>
                      {!org.admin_email ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAssignOrgTarget(org)}
                          className="text-xs px-2 py-1 h-auto"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Assign Admin
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          isLoading={removeAdminTargetId === org.id}
                          onClick={() => setConfirmRemoveAdmin(org)}
                          className="text-xs px-2 py-1 h-auto !text-[#B91C1C] !border-[#DC2626]/40 hover:!text-[#7F1D1D] hover:!bg-[#FEE2E2]"
                          title="Detach the current admin"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          Remove Admin
                        </Button>
                      )}
                      <button
                        onClick={() => setEditTarget(org)}
                        className="p-1.5 rounded-lg text-greige hover:text-charcoal-deep hover:bg-parchment transition-colors"
                        title="Edit organisation"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(org)}
                        className="p-1.5 rounded-lg text-greige hover:text-[#B91C1C] hover:bg-error-soft transition-colors"
                        title="Delete organisation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setExpanded(expanded === org.id ? null : org.id)}
                        className="p-1.5 rounded-lg text-greige hover:text-charcoal-deep hover:bg-parchment transition-colors"
                      >
                        <ChevronDown className={cn('w-4 h-4 transition-transform', expanded === org.id && 'rotate-180')} />
                      </button>
                    </div>
                  </div>

                  {expanded === org.id && (
                    <div className="pt-3 border-t border-sand-light grid grid-cols-2 gap-x-6 gap-y-2">
                      {[
                        { label: 'Org ID',   value: org.id },
                        { label: 'Phone',    value: org.phone ?? 'Not set' },
                        { label: 'Website',  value: org.website ?? 'Not set' },
                        { label: 'Created',  value: org.created_at ? new Date(org.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex flex-col">
                          <span className="text-xs text-greige">{label}</span>
                          <span className="text-charcoal-deep text-xs font-medium truncate">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Doctor view ───────────────────────────────────────────────────────────────
function DoctorOrgView() {
  const router = useRouter()
  const [org, setOrg] = useState<{ org_id: string; org_name: string } | null>(null)
  const [patients, setPatients] = useState<PatientOut[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      orgApi.getDoctorOrg(),
      orgApi.getDoctorPatients(),
    ]).then(([orgData, patientData]) => {
      setOrg(orgData)
      setPatients(patientData)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-gold-soft animate-spin" />
      </div>
    )
  }

  if (!org) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="text-center py-12">
          <Building2 className="w-12 h-12 text-greige mx-auto mb-4" />
          <h2 className="font-display text-xl text-charcoal-deep mb-2">Not Part of an Organisation</h2>
          <p className="text-sm text-greige font-body mb-6">You haven&apos;t joined an organisation yet. Check your email for an invite from an admin.</p>
          <p className="text-xs text-greige font-body">Once you receive an invite link, open it to join your organisation.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-body text-2xl font-bold text-charcoal-deep">{org.org_name}</h1>
        <p className="text-sm text-greige font-body mt-1">Your organisation · {patients.length} assigned patient{patients.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Colleagues — other doctors in the same org (mock) */}
      <Card>
        <CardHeader>
          <CardTitle className="font-body text-base">Colleagues</CardTitle>
          <CardDescription>Other doctors at {org.org_name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-sand-light">
            {[
              { id: 'col_001', name: 'Dr. Anjali Verma',   specialty: 'Endocrinology' },
              { id: 'col_002', name: 'Dr. Rajeev Iyer',    specialty: 'Cardiology' },
              { id: 'col_003', name: 'Dr. Meera Krishnan', specialty: 'General Medicine' },
              { id: 'col_004', name: 'Dr. Suresh Patel',   specialty: 'Diabetology' },
            ].map((c) => (
              <div key={c.id} className="flex items-center gap-3 py-3">
                <div className="w-9 h-9 rounded-full bg-gold-whisper border border-gold-soft/40 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-4 h-4 text-gold-deep" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-semibold text-charcoal-deep">{c.name}</p>
                  <p className="text-xs text-greige">{c.specialty}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => alert(`Message ${c.name} (mock)`)}>
                  Message
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-body text-base">My Assigned Patients</CardTitle>
          <CardDescription>Patients assigned to you by your organisation admin</CardDescription>
        </CardHeader>
        <CardContent>
          {patients.length === 0 ? (
            <p className="text-sm text-greige font-body text-center py-6">No patients assigned yet. Your admin will assign patients to you.</p>
          ) : (
            <div className="divide-y divide-sand-light">
              {patients.map((p) => {
                const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email || p.patient_id
                return (
                  <div key={p.patient_id} className="flex items-center gap-3 py-3">
                    <div className="w-9 h-9 rounded-full bg-parchment border border-sand-light flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-greige" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body font-semibold text-charcoal-deep">{name}</p>
                      {p.email && <p className="text-xs text-greige truncate">{p.email}</p>}
                    </div>
                    <Badge variant="info">Patient</Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Edit Org modal (super admin) ─────────────────────────────────────────────
function EditOrgModal({
  org,
  onClose,
  onSaved,
}: {
  org: AdminOrgItem
  onClose: () => void
  onSaved: (updated: AdminOrgItem) => void
}) {
  const [name, setName] = useState(org.name)
  const [address, setAddress] = useState(org.address ?? '')
  const [phone, setPhone] = useState(org.phone ?? '')
  const [website, setWebsite] = useState(org.website ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const phoneErr = validatePhone(phone, { optional: true })
    if (phoneErr) { setError(phoneErr); return }
    const webErr = validateWebsite(website, { optional: true })
    if (webErr) { setError(webErr); return }
    setSaving(true); setError(null)
    try {
      const updated = await adminApi.updateOrg(org.id, {
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        website: website ? normaliseWebsite(website) : '',
      })
      onSaved({ ...org, ...updated })
    } catch (err) {
      const detail = err instanceof ApiError ? err.detail : (err instanceof Error ? err.message : 'Failed to update organisation.')
      setError(detail)
      // eslint-disable-next-line no-console
      console.error('updateOrg failed', { orgId: org.id, err })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal-deep/40 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-md animate-fade-in bg-white">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="font-body text-base flex items-center gap-2 text-charcoal-deep">
                <Edit2 className="w-4 h-4 text-gold-soft" />
                Edit Organisation
              </CardTitle>
              <CardDescription className="mt-0.5">
                Updating <span className="font-medium text-charcoal-deep">{org.name}</span>
              </CardDescription>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-greige hover:text-charcoal-deep hover:bg-parchment transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-3">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
            <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input label="Website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} />
            {error && (
              <div className="flex items-center gap-2 bg-error-soft border border-[#DC2626]/20 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0" />
                <p className="text-xs font-body text-[#B91C1C]">{error}</p>
              </div>
            )}
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
              <Button type="submit" size="sm" isLoading={saving}>
                <Save className="w-3.5 h-3.5" />
                Save
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Delete Org modal (super admin) ───────────────────────────────────────────
function DeleteOrgModal({
  org,
  onClose,
  onDeleted,
}: {
  org: AdminOrgItem
  onClose: () => void
  onDeleted: () => void
}) {
  const hasLinked = (org.doctor_count + org.patient_count) > 0
  const [confirmText, setConfirmText] = useState('')
  const [force, setForce] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!canDelete) return
    setDeleting(true); setError(null)
    try {
      await adminApi.deleteOrg(org.id, force)
      onDeleted()
    } catch (err) {
      const detail = err instanceof ApiError ? err.detail : (err instanceof Error ? err.message : 'Failed to delete organisation.')
      setError(detail)
      // eslint-disable-next-line no-console
      console.error('deleteOrg failed', { orgId: org.id, force, err })
    } finally {
      setDeleting(false)
    }
  }

  const canDelete = confirmText.trim().toLowerCase() === org.name.toLowerCase() && (!hasLinked || force)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal-deep/40 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-md animate-fade-in bg-white border-[#DC2626]/30">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="font-body text-base flex items-center gap-2 text-[#B91C1C]">
                <Trash2 className="w-4 h-4" />
                Delete Organisation
              </CardTitle>
              <CardDescription className="mt-0.5">
                This permanently deletes <span className="font-medium text-charcoal-deep">{org.name}</span>.
              </CardDescription>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-greige hover:text-charcoal-deep hover:bg-parchment transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDelete} className="space-y-3">
          <div className="bg-error-soft/40 border border-[#DC2626]/20 rounded-xl p-3 space-y-1">
            <p className="text-xs font-body text-charcoal-deep">
              <span className="font-semibold">{org.doctor_count}</span> doctor(s) ·{' '}
              <span className="font-semibold">{org.patient_count}</span> patient assignment(s) linked.
            </p>
            {hasLinked && (
              <p className="text-xs text-[#B91C1C] font-body">
                Reassign them first, or check "Force detach" to clear their org links and downgrade admins to patients.
              </p>
            )}
          </div>

          {hasLinked && (
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} className="mt-0.5" />
              <span className="text-xs font-body text-charcoal-deep">
                Force detach all linked users and delete anyway.
              </span>
            </label>
          )}

          <Input
            label={`Type "${org.name}" to confirm`}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />

          {error && (
            <div className="flex items-center gap-2 bg-error-soft border border-[#DC2626]/20 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0" />
              <p className="text-xs font-body text-[#B91C1C]">{error}</p>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="danger" size="sm" isLoading={deleting} disabled={!canDelete}>
              <Trash2 className="w-3.5 h-3.5" />
              Delete{force ? ' (forced)' : ''}
            </Button>
          </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Page router ───────────────────────────────────────────────────────────────
export default function OrganizationPage() {
  const { user } = useAuth()

  if (!user) return null
  if (user.role === 'super_admin') return <SuperAdminOrgView />
  if (user.role === 'admin') return <AdminOrgView />
  if (user.role === 'doctor') return <DoctorOrgView />

  return (
    <div className="text-center py-16">
      <p className="text-greige font-body text-sm">This page is not available for your role.</p>
    </div>
  )
}
