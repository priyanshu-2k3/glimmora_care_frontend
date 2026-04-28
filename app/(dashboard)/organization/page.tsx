'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Users, Plus, Save, AlertCircle, CheckCircle, Loader2, Edit2, Stethoscope, Search, ChevronDown, ChevronUp, UserCheck, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/context/AuthContext'
import { orgApi, adminApi, ApiError, type OrgOut, type PatientOut, type AdminOrgItem } from '@/lib/api'
import { cn } from '@/lib/utils'

// ─── Admin view ────────────────────────────────────────────────────────────────
function AdminOrgView() {
  const router = useRouter()
  const [org, setOrg] = useState<OrgOut | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', phone: '', website: '' })
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

  useEffect(() => {
    orgApi.getMine()
      .then((data) => {
        setOrg(data)
        setForm({ name: data.name, address: data.address ?? '', phone: data.phone ?? '', website: data.website ?? '' })
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
  }, [org?.id])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!createName.trim()) return
    setCreating(true)
    setError(null)
    try {
      const created = await orgApi.create(createName.trim())
      setOrg(created)
      setForm({ name: created.name, address: '', phone: '', website: '' })
      setShowCreate(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : 'Failed to create organisation.')
    } finally {
      setCreating(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const updated = await orgApi.update({
        name: form.name || undefined,
        address: form.address || undefined,
        phone: form.phone || undefined,
        website: form.website || undefined,
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
                <div className="flex items-center gap-2 bg-error-soft border border-error-DEFAULT/20 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-error-DEFAULT shrink-0" />
                  <p className="text-xs font-body text-error-DEFAULT">{error}</p>
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
            <div className="flex items-center gap-2 bg-error-soft border border-error-DEFAULT/20 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-error-DEFAULT shrink-0" />
              <p className="text-xs font-body text-error-DEFAULT">{error}</p>
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-2 bg-success-soft border border-success-DEFAULT/20 rounded-xl p-3">
              <CheckCircle className="w-4 h-4 text-success-DEFAULT shrink-0" />
              <p className="text-xs font-body text-success-DEFAULT">Organisation updated successfully.</p>
            </div>
          )}
          {editing ? (
            <>
              <Input label="Organisation Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              <Input label="Address" value={form.address} placeholder="123 Medical Street, Mumbai" onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
              <Input label="Phone" type="tel" value={form.phone} placeholder="+91 98765 43210" onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              <Input label="Website" type="url" value={form.website} placeholder="https://clinic.example.com" onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} />
              <Button onClick={handleSave} isLoading={saving} className="w-full">
                <Save className="w-4 h-4" />
                {saved ? 'Saved!' : 'Save Changes'}
              </Button>
            </>
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
                {org.admin_email ? 'Switch Admin' : 'Assign Admin'}
              </CardTitle>
              <CardDescription className="mt-0.5">
                {org.admin_email
                  ? <>Replacing <span className="font-medium text-charcoal-deep">{org.admin_email}</span> on <span className="font-medium text-charcoal-deep">{org.name}</span></>
                  : <>Assigning to: <span className="font-medium text-charcoal-deep">{org.name}</span></>}
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
                <div className="flex items-center gap-2 bg-error-soft border border-error-DEFAULT/20 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-error-DEFAULT shrink-0" />
                  <p className="text-xs font-body text-error-DEFAULT">{error}</p>
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
    setCreating(true)
    setCreateError(null)
    try {
      await adminApi.createOrg(createName.trim())
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
    setAssignOrgTarget(null)
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

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gold-soft" />
            All Organisations
          </h1>
          <p className="text-sm text-greige font-body mt-1">Platform-wide view of all registered organisations.</p>
        </div>
        <Badge variant="dark">{filtered.length} org{filtered.length !== 1 ? 's' : ''}</Badge>
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
          <div className="border-t border-sand-light px-5 pb-5 pt-4">
            {createSuccess ? (
              <div className="flex items-center gap-2 bg-success-soft border border-success-DEFAULT/20 rounded-xl p-3">
                <CheckCircle className="w-4 h-4 text-success-DEFAULT shrink-0" />
                <p className="text-xs font-body text-success-DEFAULT">Organisation created successfully.</p>
              </div>
            ) : (
              <form onSubmit={handleCreateOrg} className="space-y-4">
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
                  <div className="flex items-center gap-2 bg-error-soft border border-error-DEFAULT/20 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 text-error-DEFAULT shrink-0" />
                    <p className="text-xs font-body text-error-DEFAULT">{createError}</p>
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
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="info">{org.doctor_count} doctor{org.doctor_count !== 1 ? 's' : ''}</Badge>
                      <Badge variant="success">{org.patient_count} patient{org.patient_count !== 1 ? 's' : ''}</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAssignOrgTarget(org)}
                        className="text-xs px-2 py-1 h-auto"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        {org.admin_email ? 'Switch Admin' : 'Assign Admin'}
                      </Button>
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
