'use client'

import { useEffect, useState } from 'react'
import { Building2, Plus, UserCheck, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { adminApi, ApiError, type AdminOrgItem, type AdminUserOut } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

export default function ManageOrganizationsPage() {
  const toast = useToast()
  const [orgs, setOrgs] = useState<AdminOrgItem[]>([])
  const [loading, setLoading] = useState(true)

  // Create org
  const [orgName, setOrgName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createMsg, setCreateMsg] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)

  // Assign admin
  const [assignOrgId, setAssignOrgId] = useState('')
  // 'existing' = pick from admin dropdown · 'new' = enter email to auto-create
  const [assignMode, setAssignMode] = useState<'existing' | 'new'>('existing')
  const [assignAdminId, setAssignAdminId] = useState('')
  const [assignEmail, setAssignEmail] = useState('')
  const [assignFirst, setAssignFirst] = useState('')
  const [assignLast, setAssignLast] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [assignMsg, setAssignMsg] = useState<string | null>(null)
  const [assignError, setAssignError] = useState<string | null>(null)

  // Pool of existing admin users for the dropdown
  const [admins, setAdmins] = useState<AdminUserOut[]>([])

  async function reload() {
    try {
      const data = await adminApi.listAllOrgs()
      setOrgs(data)
    } catch {
      setOrgs([])
    } finally {
      setLoading(false)
    }
  }

  async function reloadAdmins() {
    try {
      const data = await adminApi.listUsers('', 'admin')
      setAdmins(data)
    } catch {
      setAdmins([])
    }
  }

  useEffect(() => { reload(); reloadAdmins() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!orgName.trim()) return
    setCreating(true); setCreateError(null); setCreateMsg(null)
    try {
      const created = await adminApi.createOrg(orgName.trim())
      setCreateMsg(`Organisation "${created.name}" created.`)
      toast.success(`Organisation created: ${created.name}`)
      setOrgName('')
      await reload()
      setTimeout(() => setCreateMsg(null), 3000)
    } catch (err: unknown) {
      setCreateError(err instanceof ApiError ? err.detail : 'Failed to create organisation.')
    } finally {
      setCreating(false)
    }
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault()
    if (!assignOrgId) return
    if (assignMode === 'existing' && !assignAdminId) return
    if (assignMode === 'new' && !assignEmail.trim()) return
    setAssigning(true); setAssignError(null); setAssignMsg(null)
    try {
      const payload = assignMode === 'existing'
        ? { userId: assignAdminId }
        : {
            email: assignEmail.trim(),
            first_name: assignFirst.trim() || undefined,
            last_name: assignLast.trim() || undefined,
          }
      const result = await adminApi.assignAdmin(assignOrgId, payload as never)
      const orgName = orgs.find((o) => o.id === assignOrgId)?.name ?? 'organisation'
      setAssignMsg(
        // assignAdmin response includes account_created when admin was auto-created
        (result as { account_created?: boolean }).account_created
          ? 'Admin assigned (account auto-created with temp password Glimmora@2025).'
          : 'Admin assigned.'
      )
      toast.success(`Admin assigned to ${orgName}`)
      setAssignOrgId('')
      setAssignAdminId(''); setAssignEmail(''); setAssignFirst(''); setAssignLast('')
      setAssignMode('existing')
      await reload()
      await reloadAdmins()
      setTimeout(() => setAssignMsg(null), 4000)
    } catch (err: unknown) {
      setAssignError(err instanceof ApiError ? err.detail : 'Failed to assign admin.')
    } finally {
      setAssigning(false)
    }
  }

  return (
    <RoleGuard allowed={['super_admin']}>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-body text-2xl lg:text-3xl font-bold text-charcoal-deep flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gold-soft" /> Manage Organisations
          </h1>
          <p className="text-sm lg:text-[15px] text-stone font-body mt-1">Create organisations and assign their administrators.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Create org */}
          <Card>
            <CardContent>
              <p className="text-sm font-body font-semibold text-charcoal-deep flex items-center gap-2 mb-3">
                <Plus className="w-4 h-4 text-gold-soft" /> Create Organisation
              </p>
              <form onSubmit={handleCreate} className="space-y-3">
                <Input
                  placeholder="Organisation name"
                  value={orgName}
                  onChange={(e) => { setOrgName(e.target.value); setCreateError(null) }}
                  required
                />
                {createError && (
                  <div className="flex items-start gap-2 bg-[#FEE2E2] border border-[#DC2626]/30 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0 mt-0.5" />
                    <p className="text-xs font-body text-[#B91C1C]">{createError}</p>
                  </div>
                )}
                {createMsg && (
                  <div className="flex items-center gap-2 bg-success-soft border border-success-DEFAULT/30 rounded-xl p-3">
                    <CheckCircle className="w-4 h-4 text-[#059669] shrink-0" />
                    <p className="text-xs font-body text-charcoal-deep">{createMsg}</p>
                  </div>
                )}
                <Button type="submit" isLoading={creating} className="w-full">
                  <Plus className="w-4 h-4" /> {creating ? 'Creating…' : 'Create'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Assign admin */}
          <Card>
            <CardContent>
              <p className="text-sm font-body font-semibold text-charcoal-deep flex items-center gap-2 mb-3">
                <UserCheck className="w-4 h-4 text-gold-soft" /> Assign Admin to Org
              </p>
              <form onSubmit={handleAssign} className="space-y-3">
                <select
                  value={assignOrgId}
                  onChange={(e) => { setAssignOrgId(e.target.value); setAssignError(null) }}
                  required
                  className="w-full text-sm font-body border border-sand-light rounded-xl px-3 py-2 bg-ivory-cream focus:outline-none focus:border-gold-soft"
                >
                  <option value="">Select organisation…</option>
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}{o.admin_email ? ` (current: ${o.admin_email})` : ' — no admin'}
                    </option>
                  ))}
                </select>

                {/* Mode toggle: pick existing admin vs auto-create new */}
                <div className="flex gap-1 p-1 bg-ivory-cream border border-sand-light rounded-xl">
                  <button
                    type="button"
                    onClick={() => { setAssignMode('existing'); setAssignError(null) }}
                    className={`flex-1 text-xs font-body font-medium px-3 py-1.5 rounded-lg transition-colors ${assignMode === 'existing' ? 'bg-white text-charcoal-deep shadow-sm' : 'text-greige hover:text-charcoal-deep'}`}
                  >
                    Pick existing admin
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAssignMode('new'); setAssignError(null) }}
                    className={`flex-1 text-xs font-body font-medium px-3 py-1.5 rounded-lg transition-colors ${assignMode === 'new' ? 'bg-white text-charcoal-deep shadow-sm' : 'text-greige hover:text-charcoal-deep'}`}
                  >
                    Add new admin
                  </button>
                </div>

                {assignMode === 'existing' ? (
                  <select
                    value={assignAdminId}
                    onChange={(e) => { setAssignAdminId(e.target.value); setAssignError(null) }}
                    required
                    className="w-full text-sm font-body border border-sand-light rounded-xl px-3 py-2 bg-ivory-cream focus:outline-none focus:border-gold-soft"
                  >
                    <option value="">Select admin…</option>
                    {admins.length === 0 ? (
                      <option disabled>No admin accounts yet — switch to &quot;Add new admin&quot;</option>
                    ) : (
                      admins.map((a) => {
                        const fullName = `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim()
                        const label = fullName ? `${fullName} · ${a.email}` : a.email
                        return (
                          <option key={a.id} value={a.id}>
                            {label}
                          </option>
                        )
                      })
                    )}
                  </select>
                ) : (
                  <>
                    <Input
                      type="email"
                      placeholder="admin@example.com"
                      value={assignEmail}
                      onChange={(e) => { setAssignEmail(e.target.value); setAssignError(null) }}
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="First name (optional)" value={assignFirst} onChange={(e) => setAssignFirst(e.target.value)} />
                      <Input placeholder="Last name (optional)" value={assignLast} onChange={(e) => setAssignLast(e.target.value)} />
                    </div>
                    <p className="text-[11px] text-greige font-body">
                      If no account exists for this email, one will be auto-created with role &quot;admin&quot; and a temporary password.
                    </p>
                  </>
                )}
                {assignError && (
                  <div className="flex items-start gap-2 bg-[#FEE2E2] border border-[#DC2626]/30 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0 mt-0.5" />
                    <p className="text-xs font-body text-[#B91C1C]">{assignError}</p>
                  </div>
                )}
                {assignMsg && (
                  <div className="flex items-center gap-2 bg-success-soft border border-success-DEFAULT/30 rounded-xl p-3">
                    <CheckCircle className="w-4 h-4 text-[#059669] shrink-0" />
                    <p className="text-xs font-body text-charcoal-deep">{assignMsg}</p>
                  </div>
                )}
                <Button type="submit" isLoading={assigning} className="w-full">
                  <UserCheck className="w-4 h-4" /> {assigning ? 'Assigning…' : 'Assign Admin'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Org list */}
        <Card>
          <CardContent>
            <p className="text-sm font-body font-semibold text-charcoal-deep mb-3">Organisations on the platform</p>
            {loading ? (
              <div className="py-10 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-gold-soft animate-spin" />
              </div>
            ) : orgs.length === 0 ? (
              <p className="text-sm text-greige font-body py-8 text-center">No organisations yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-greige border-b border-sand-light">
                    <tr>
                      <th className="py-2 pr-3 font-medium">Name</th>
                      <th className="py-2 pr-3 font-medium">Admin</th>
                      <th className="py-2 pr-3 font-medium">Doctors</th>
                      <th className="py-2 pr-3 font-medium">Patients</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgs.map((o) => (
                      <tr key={o.id} className="border-b border-sand-light/50 last:border-0">
                        <td className="py-2.5 pr-3 font-body text-charcoal-deep">{o.name}</td>
                        <td className="py-2.5 pr-3 font-body text-stone text-xs">
                          {o.admin_email ?? <span className="text-[#B91C1C]">— no admin</span>}
                        </td>
                        <td className="py-2.5 pr-3 text-xs">{o.doctor_count}</td>
                        <td className="py-2.5 pr-3 text-xs">{o.patient_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
