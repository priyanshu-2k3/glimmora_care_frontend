'use client'

import { useEffect, useState } from 'react'
import {
  Users, UserCheck, FileCheck, ClipboardList, TrendingUp,
  AlertTriangle, Building2, Shield, PlusCircle, CheckCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardContent } from '@/components/ui/Card'
import {
  adminApi,
  type AdminStatsOut, type AuditLogOut,
  type AdminPatientOut, type AdminDoctorOut, type AdminOrgItem,
  type AdminUserOut,
} from '@/lib/api'
import { formatDate } from '@/lib/utils'

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: number | string
  href: string
  color: string
}

function StatCard({ icon: Icon, label, value, href, color }: StatCardProps) {
  return (
    <Link href={href}>
      <Card hover className="transition-all duration-200">
        <CardContent className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: color + '20' }}>
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
          <div>
            <p className="text-2xl font-body font-bold text-charcoal-deep">{value}</p>
            <p className="text-xs text-greige font-body">{label}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-error-DEFAULT',
  warning: 'bg-warning-DEFAULT',
  info: 'bg-success-DEFAULT',
}

// ── Org-scoped admin view ──────────────────────────────────────────────────────

function AdminDashboard({ userName, stats, logs, loading }: {
  userName: string
  stats: AdminStatsOut | null
  logs: AuditLogOut[]
  loading: boolean
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-body text-2xl font-bold text-charcoal-deep">
          Welcome back, {userName.split(' ')[0]}
        </h1>
        <p className="text-sm text-greige font-body mt-1">Operational overview of your team and patients.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard icon={FileCheck}    label="Patients"          value={loading ? '—' : (stats?.total_patients ?? 0)}          href="/admin/doctor-management"  color="#D97706" />
        <StatCard icon={UserCheck}    label="Doctors"           value={loading ? '—' : (stats?.total_doctors ?? 0)}           href="/admin/manage-team"        color="#2563EB" />
        <StatCard icon={AlertTriangle} label="New Users (30d)"  value={loading ? '—' : (stats?.new_users_last_30_days ?? 0)}  href="/admin/logs"               color="#DC2626" />
      </div>

      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-body font-semibold text-charcoal-deep flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-gold-soft" />
              Recent Activity
            </p>
            <Link href="/admin/logs" className="text-xs text-gold-deep hover:text-gold-muted font-body transition-colors">
              View all logs
            </Link>
          </div>
          {loading ? (
            <p className="text-xs text-greige font-body">Loading...</p>
          ) : logs.length === 0 ? (
            <p className="text-xs text-greige font-body">No activity yet.</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 py-2 border-b border-sand-light/50 last:border-0">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${SEVERITY_DOT[log.severity] ?? 'bg-success-DEFAULT'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body text-charcoal-deep">{log.action}</p>
                    <p className="text-xs text-greige">{log.target} · {log.performed_by}</p>
                  </div>
                  <p className="text-xs text-greige font-body shrink-0">{formatDate(log.timestamp)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/admin/doctor-management/assign">
          <Card hover className="text-center py-6">
            <CardContent>
              <UserCheck className="w-6 h-6 text-gold-soft mx-auto mb-2" />
              <p className="text-sm font-body font-medium text-charcoal-deep">Assign Doctor</p>
              <p className="text-xs text-greige mt-0.5">Map patients to doctors</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/manage-team">
          <Card hover className="text-center py-6">
            <CardContent>
              <Users className="w-6 h-6 text-gold-soft mx-auto mb-2" />
              <p className="text-sm font-body font-medium text-charcoal-deep">Manage Team</p>
              <p className="text-xs text-greige mt-0.5">View and add doctors</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/logs">
          <Card hover className="text-center py-6">
            <CardContent>
              <TrendingUp className="w-6 h-6 text-gold-soft mx-auto mb-2" />
              <p className="text-sm font-body font-medium text-charcoal-deep">Audit Logs</p>
              <p className="text-xs text-greige mt-0.5">View all admin actions</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}

// ── Super admin view ───────────────────────────────────────────────────────────

function SuperAdminDashboard({ userName, stats, logs, loading }: {
  userName: string
  stats: AdminStatsOut | null
  logs: AuditLogOut[]
  loading: boolean
}) {
  const [tab, setTab] = useState<'patients' | 'doctors' | 'orgs'>('patients')
  const [patients, setPatients] = useState<AdminPatientOut[]>([])
  const [doctors, setDoctors] = useState<AdminDoctorOut[]>([])
  const [orgs, setOrgs] = useState<AdminOrgItem[]>([])
  const [listLoading, setListLoading] = useState(true)

  // Create org
  const [orgName, setOrgName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createMsg, setCreateMsg] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)

  // Assign admin
  const [assignOrgId, setAssignOrgId] = useState('')
  const [allUsers, setAllUsers] = useState<AdminUserOut[]>([])
  const [assignUserId, setAssignUserId] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [assignMsg, setAssignMsg] = useState<string | null>(null)
  const [assignError, setAssignError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      adminApi.listPatients().catch(() => [] as AdminPatientOut[]),
      adminApi.listDoctors().catch(() => [] as AdminDoctorOut[]),
      adminApi.listAllOrgs().catch(() => [] as AdminOrgItem[]),
      adminApi.listUsers().catch(() => [] as AdminUserOut[]),
    ]).then(([p, d, o, u]) => {
      setPatients(p)
      setDoctors(d)
      setOrgs(o)
      setAllUsers(u)
      setListLoading(false)
    })
  }, [])

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault()
    if (!orgName.trim()) return
    setCreating(true); setCreateError(null); setCreateMsg(null)
    try {
      await adminApi.createOrg(orgName.trim())
      setCreateMsg(`Organisation "${orgName.trim()}" created.`)
      setOrgName('')
      adminApi.listAllOrgs().then(setOrgs).catch(() => {})
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Failed.')
    } finally {
      setCreating(false)
    }
  }

  async function handleAssignAdmin(e: React.FormEvent) {
    e.preventDefault()
    if (!assignOrgId || !assignUserId) return
    setAssigning(true); setAssignError(null); setAssignMsg(null)
    try {
      await adminApi.assignAdmin(assignOrgId, { userId: assignUserId })
      setAssignMsg('Admin assigned successfully.')
      setAssignOrgId(''); setAssignUserId('')
      adminApi.listAllOrgs().then(setOrgs).catch(() => {})
    } catch (err: unknown) {
      setAssignError(err instanceof Error ? err.message : 'Failed.')
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-body text-2xl font-bold text-charcoal-deep">
          Welcome back, {userName.split(' ')[0]}
        </h1>
        <p className="text-sm text-greige font-body mt-1">Global platform overview — all organisations.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Users}       label="Total Patients"  value={loading ? '—' : (stats?.total_patients ?? 0)}       href="#patients" color="#2563EB" />
        <StatCard icon={UserCheck}   label="Total Doctors"   value={loading ? '—' : (stats?.total_doctors ?? 0)}        href="#doctors"  color="#7C3AED" />
        <StatCard icon={Building2}   label="Organisations"   value={loading ? '—' : (stats?.total_organizations ?? 0)}  href="#orgs"     color="#0891B2" />
        <StatCard icon={Shield}      label="Admins"          value={loading ? '—' : (stats?.total_admins ?? 0)}         href="/manage-users" color="#059669" />
      </div>

      {/* Patients / Doctors / Orgs tabs */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <p className="text-sm font-body font-semibold text-charcoal-deep">Platform Users</p>
            <div className="flex gap-1">
              {(['patients', 'doctors', 'orgs'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`text-xs font-body font-semibold px-3 py-1.5 rounded-full transition-colors capitalize ${
                    tab === t ? 'bg-gold-soft text-white' : 'bg-parchment text-charcoal-warm hover:bg-sand-light'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1 max-h-64 overflow-y-auto">
            {listLoading && [1,2,3,4].map((i) => (
              <div key={i} className="h-10 bg-sand-light rounded-xl animate-pulse mb-1" />
            ))}

            {/* Patients tab */}
            {!listLoading && tab === 'patients' && (
              patients.length === 0
                ? <p className="text-xs text-greige font-body py-4 text-center">No patients on the platform yet.</p>
                : patients.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 py-2 border-b border-sand-light last:border-0">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-body font-bold text-white bg-ocean-500" style={{ background: '#2563EB' }}>
                      {(p.first_name?.[0] ?? p.email?.[0] ?? '?').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-body font-semibold text-charcoal-deep">{p.first_name} {p.last_name}</p>
                      <p className="text-[10px] text-greige">{p.email}</p>
                    </div>
                  </div>
                ))
            )}

            {/* Doctors tab */}
            {!listLoading && tab === 'doctors' && (
              doctors.length === 0
                ? <p className="text-xs text-greige font-body py-4 text-center">No doctors on the platform yet.</p>
                : doctors.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 py-2 border-b border-sand-light last:border-0">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-body font-bold text-white" style={{ background: '#7C3AED' }}>
                      {(d.first_name?.[0] ?? d.email?.[0] ?? '?').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-body font-semibold text-charcoal-deep">{d.first_name} {d.last_name}</p>
                      <p className="text-[10px] text-greige">{d.email}</p>
                    </div>
                    <span className="text-[10px] font-body font-semibold px-2 py-0.5 rounded-full shrink-0 bg-violet-100 text-violet-700">
                      {d.patient_count} pts
                    </span>
                  </div>
                ))
            )}

            {/* Orgs tab */}
            {!listLoading && tab === 'orgs' && (
              orgs.length === 0
                ? <p className="text-xs text-greige font-body py-4 text-center">No organisations created yet.</p>
                : orgs.map((o) => (
                  <div key={o.id} className="flex items-center gap-3 py-2 border-b border-sand-light last:border-0">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-body font-bold text-white" style={{ background: '#0891B2' }}>
                      {(o.name?.[0] ?? '?').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-body font-semibold text-charcoal-deep">{o.name}</p>
                      <p className="text-[10px] text-greige">{o.admin_email ?? 'No admin assigned'} · {o.doctor_count}d {o.patient_count}p</p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create org + Assign admin forms */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent>
            <p className="text-sm font-body font-semibold text-charcoal-deep flex items-center gap-2 mb-3">
              <PlusCircle className="w-4 h-4 text-gold-soft" />
              Create Organisation
            </p>
            <form onSubmit={handleCreateOrg} className="space-y-3">
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Organisation name…"
                required
                className="w-full text-sm font-body border border-sand-light rounded-xl px-3 py-2 bg-ivory-cream focus:outline-none focus:border-gold-soft"
              />
              <button
                type="submit"
                disabled={creating}
                className="w-full text-sm font-body font-semibold bg-gold-soft text-white px-4 py-2.5 rounded-xl hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                {creating ? 'Creating…' : 'Create Organisation'}
              </button>
              {createMsg && <p className="text-xs text-green-700">{createMsg}</p>}
              {createError && <p className="text-xs text-red-600">{createError}</p>}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm font-body font-semibold text-charcoal-deep flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-gold-soft" />
              Assign Admin to Org
            </p>
            <form onSubmit={handleAssignAdmin} className="space-y-3">
              <select
                value={assignOrgId}
                onChange={(e) => setAssignOrgId(e.target.value)}
                required
                className="w-full text-sm font-body border border-sand-light rounded-xl px-3 py-2 bg-ivory-cream focus:outline-none focus:border-gold-soft"
              >
                <option value="">Select organisation…</option>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              <select
                value={assignUserId}
                onChange={(e) => setAssignUserId(e.target.value)}
                required
                className="w-full text-sm font-body border border-sand-light rounded-xl px-3 py-2 bg-ivory-cream focus:outline-none focus:border-gold-soft"
              >
                <option value="">Select user to promote…</option>
                {allUsers.filter((u) => u.role !== 'super_admin').map((u) => (
                  <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={assigning}
                className="w-full text-sm font-body font-semibold bg-gold-soft text-white px-4 py-2.5 rounded-xl hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                {assigning ? 'Assigning…' : 'Assign Admin'}
              </button>
              {assignMsg && <p className="text-xs text-green-700">{assignMsg}</p>}
              {assignError && <p className="text-xs text-red-600">{assignError}</p>}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions — super admin only */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/admin/logs">
          <Card hover className="text-center py-6">
            <CardContent>
              <ClipboardList className="w-6 h-6 text-gold-soft mx-auto mb-2" />
              <p className="text-sm font-body font-medium text-charcoal-deep">Platform Logs</p>
              <p className="text-xs text-greige mt-0.5">Full audit trail</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/manage-users">
          <Card hover className="text-center py-6">
            <CardContent>
              <Shield className="w-6 h-6 text-gold-soft mx-auto mb-2" />
              <p className="text-sm font-body font-medium text-charcoal-deep">Manage Admins</p>
              <p className="text-xs text-greige mt-0.5">Roles & permissions</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/settings">
          <Card hover className="text-center py-6">
            <CardContent>
              <Building2 className="w-6 h-6 text-gold-soft mx-auto mb-2" />
              <p className="text-sm font-body font-medium text-charcoal-deep">Platform Settings</p>
              <p className="text-xs text-greige mt-0.5">Global configuration</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent logs */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-body font-semibold text-charcoal-deep flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-gold-soft" />
              Recent Activity
            </p>
            <Link href="/admin/logs" className="text-xs text-gold-deep hover:text-gold-muted font-body transition-colors">
              View all logs
            </Link>
          </div>
          {loading ? (
            <p className="text-xs text-greige font-body">Loading...</p>
          ) : logs.length === 0 ? (
            <p className="text-xs text-greige font-body">No activity yet.</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 py-2 border-b border-sand-light/50 last:border-0">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${SEVERITY_DOT[log.severity] ?? 'bg-success-DEFAULT'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body text-charcoal-deep">{log.action}</p>
                    <p className="text-xs text-greige">{log.target} · {log.performed_by}</p>
                  </div>
                  <p className="text-xs text-greige font-body shrink-0">{formatDate(log.timestamp)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<AdminStatsOut | null>(null)
  const [logs, setLogs] = useState<AuditLogOut[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([
      adminApi.getStats().catch(() => null),
      adminApi.getAuditLogs({ limit: 4 }).catch(() => []),
    ]).then(([s, l]) => {
      if (!active) return
      setStats(s)
      setLogs(Array.isArray(l) ? l : [])
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  return (
    <RoleGuard allowed={['admin', 'super_admin']}>
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        {user?.role === 'super_admin' ? (
          <SuperAdminDashboard
            userName={user.name}
            stats={stats}
            logs={logs}
            loading={loading}
          />
        ) : (
          <AdminDashboard
            userName={user?.name ?? 'Admin'}
            stats={stats}
            logs={logs}
            loading={loading}
          />
        )}
      </div>
    </RoleGuard>
  )
}
