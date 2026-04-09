'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Users, UserCheck, Settings, Plus, Save, AlertCircle, CheckCircle, Loader2, Edit2, Stethoscope } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/context/AuthContext'
import { orgApi, ApiError, type OrgOut, type PatientOut } from '@/lib/api'

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
  if (user.role === 'admin' || user.role === 'super_admin') return <AdminOrgView />
  if (user.role === 'doctor') return <DoctorOrgView />

  return (
    <div className="text-center py-16">
      <p className="text-greige font-body text-sm">This page is not available for your role.</p>
    </div>
  )
}
