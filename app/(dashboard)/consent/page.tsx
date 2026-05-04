'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Shield, Clock, History, AlertCircle, Check, Users, ArrowRight,
  Search, Filter, Plus, Trash2, UserPlus, ChevronDown,
} from 'lucide-react'
import { consentApi, adminApi, orgApi, familyApi, type ConsentRequest, type DoctorOut, type PatientOut, type AdminDoctorOut, type AdminPatientOut, type ManageableMember } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { cn } from '@/lib/utils'

// ─── Status helpers ────────────────────────────────────────────────────────────
const STATUS_VARIANT: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
  pending:  'warning',
  approved: 'success',
  revoked:  'error',
  rejected: 'error',
  expired:  'default',
}

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return iso }
}

const STATUS_FILTERS = ['all', 'pending', 'approved', 'revoked', 'rejected', 'expired'] as const
type StatusFilter = typeof STATUS_FILTERS[number]

const ALL_SCOPES = ['view_records', 'view_trends', 'view_markers', 'view_timeline'] as const
const SCOPE_LABELS: Record<string, string> = {
  view_records:   'View Records',
  view_trends:    'View Trends',
  view_markers:   'View Markers',
  view_timeline:  'View Timeline',
}

// ─── Admin / Super-admin view ─────────────────────────────────────────────────
function AdminConsentView() {
  const PAGE_SIZE = 20
  const [consents, setConsents] = useState<ConsentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [patientSearch, setPatientSearch] = useState('')
  const [doctorSearch, setDoctorSearch] = useState('')
  const [page, setPage] = useState(1)

  // Request on behalf panel
  const [doctors, setDoctors] = useState<AdminDoctorOut[]>([])
  const [patients, setPatients] = useState<AdminPatientOut[]>([])
  const [reqDoctorEmail, setReqDoctorEmail] = useState('')
  const [reqPatientEmail, setReqPatientEmail] = useState('')
  const [reqReason, setReqReason] = useState('')
  const [reqLoading, setReqLoading] = useState(false)
  const [reqMsg, setReqMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    adminApi.listDoctors().then(setDoctors).catch(() => {})
    adminApi.listPatients().then(setPatients).catch(() => {})
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    adminApi.listConsents({
      status: statusFilter === 'all' ? '' : statusFilter,
      patient_email: patientSearch.trim(),
      requester_email: doctorSearch.trim(),
    })
      .then((data) => { if (active) setConsents(data) })
      .catch(() => { if (active) setConsents([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [statusFilter, patientSearch, doctorSearch])

  useEffect(() => { setPage(1) }, [statusFilter, patientSearch, doctorSearch])

  const totalPages = Math.ceil(consents.length / PAGE_SIZE)
  const pageSlice = consents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const counts = STATUS_FILTERS.slice(1).reduce<Record<string, number>>((acc, s) => {
    acc[s] = consents.filter((c) => c.status === s).length
    return acc
  }, {})

  async function handleAdminRequest() {
    if (!reqDoctorEmail || !reqPatientEmail) return
    setReqLoading(true)
    setReqMsg(null)
    try {
      await consentApi.adminRequest(reqDoctorEmail, reqPatientEmail, reqReason || undefined)
      setReqMsg({ ok: true, text: 'Consent request sent successfully.' })
      setReqDoctorEmail(''); setReqPatientEmail(''); setReqReason('')
      // Refresh list
      const data = await adminApi.listConsents({})
      setConsents(data)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to send request'
      setReqMsg({ ok: false, text: msg })
    } finally {
      setReqLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-body text-2xl font-bold text-charcoal-deep">Consent Management</h1>
        <p className="text-sm text-greige font-body mt-1">Platform-wide view of all patient consent records.</p>
      </div>

      {/* Request on behalf of doctor panel */}
      <Card>
        <CardHeader>
          <CardTitle className="font-body text-base flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-gold-deep" />
            Request Consent on Behalf of a Doctor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-greige font-body">
            As an admin, you can initiate a consent request attributed to a doctor. The patient will see the doctor&apos;s name; your admin ID is logged for audit.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-greige font-body block mb-1">Doctor</label>
              <select
                value={reqDoctorEmail}
                onChange={(e) => setReqDoctorEmail(e.target.value)}
                className="w-full text-xs border border-sand-light rounded-lg px-3 py-2 bg-ivory-warm font-body text-charcoal-deep focus:outline-none focus:border-gold-soft"
              >
                <option value="">Select doctor…</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.email}>
                    {d.email}{(d.first_name || d.last_name) ? ` (${[d.first_name, d.last_name].filter(Boolean).join(' ')})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-greige font-body block mb-1">Patient</label>
              <select
                value={reqPatientEmail}
                onChange={(e) => setReqPatientEmail(e.target.value)}
                className="w-full text-xs border border-sand-light rounded-lg px-3 py-2 bg-ivory-warm font-body text-charcoal-deep focus:outline-none focus:border-gold-soft"
              >
                <option value="">Select patient…</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.email}>
                    {p.email}{(p.first_name || p.last_name) ? ` (${[p.first_name, p.last_name].filter(Boolean).join(' ')})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <textarea
            value={reqReason}
            onChange={(e) => setReqReason(e.target.value)}
            placeholder="Reason for request (optional)…"
            rows={2}
            className="w-full text-xs border border-sand-light rounded-lg px-3 py-2 bg-ivory-warm font-body text-charcoal-deep focus:outline-none focus:border-gold-soft resize-none"
          />
          {reqMsg && (
            <p className={cn('text-xs font-body', reqMsg.ok ? 'text-success-DEFAULT' : 'text-[#B91C1C]')}>
              {reqMsg.text}
            </p>
          )}
          <Button
            size="sm"
            onClick={handleAdminRequest}
            disabled={reqLoading || !reqDoctorEmail || !reqPatientEmail}
          >
            {reqLoading ? 'Sending…' : 'Send Request'}
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {[
          { label: 'Pending',  status: 'pending',  color: 'text-warning-DEFAULT', bg: 'bg-warning-soft' },
          { label: 'Active',   status: 'approved', color: 'text-success-DEFAULT', bg: 'bg-success-soft' },
          { label: 'Revoked',  status: 'revoked',  color: 'text-[#B91C1C]',   bg: 'bg-error-soft'   },
          { label: 'Rejected', status: 'rejected', color: 'text-[#B91C1C]',   bg: 'bg-error-soft'   },
          { label: 'Expired',  status: 'expired',  color: 'text-stone',           bg: 'bg-parchment'    },
        ].map((s) => (
          <button
            key={s.status}
            onClick={() => setStatusFilter(s.status as StatusFilter)}
            className={cn(
              'text-left rounded-xl border p-4 transition-all',
              statusFilter === s.status ? 'border-gold-soft bg-gold-whisper' : 'border-sand-light bg-white hover:border-gold-soft/50'
            )}
          >
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center mb-2', s.bg)}>
              <Shield className={cn('w-4 h-4', s.color)} />
            </div>
            <p className="font-display text-xl text-charcoal-deep">{loading ? '—' : (counts[s.status] ?? 0)}</p>
            <p className="text-[11px] text-greige font-body">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Search filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          placeholder="Search by patient email…"
          leftIcon={<Search className="w-4 h-4" />}
          value={patientSearch}
          onChange={(e) => setPatientSearch(e.target.value)}
        />
        <Input
          placeholder="Search by doctor/requester email…"
          leftIcon={<Search className="w-4 h-4" />}
          value={doctorSearch}
          onChange={(e) => setDoctorSearch(e.target.value)}
        />
      </div>

      {/* Status filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-greige shrink-0" />
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-body font-medium transition-all capitalize',
              statusFilter === f ? 'bg-charcoal-deep text-ivory-cream' : 'bg-parchment text-greige hover:text-charcoal-deep'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-parchment rounded-xl animate-pulse" />
          ))}
        </div>
      ) : consents.length === 0 ? (
        <Card className="py-12 text-center">
          <Shield className="w-10 h-10 text-greige mx-auto mb-3" />
          <p className="text-sm text-greige font-body">No consent records found.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-greige font-body">
            {consents.length} record{consents.length !== 1 ? 's' : ''}
            {totalPages > 1 && ` · page ${page} of ${totalPages}`}
          </p>

          {/* Header row */}
          <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 text-[11px] font-body font-semibold text-greige uppercase tracking-wider">
            <div className="col-span-3">Patient</div>
            <div className="col-span-3">Doctor / Requester</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Scope</div>
            <div className="col-span-2">Requested</div>
          </div>

          {pageSlice.map((c) => (
            <Card key={c.id} hover>
              <CardContent>
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-12 sm:col-span-3 flex items-center gap-2">
                    <Avatar name={c.patient_email} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-body font-medium text-charcoal-deep truncate">{c.patient_email}</p>
                    </div>
                  </div>
                  <div className="col-span-12 sm:col-span-3 flex items-center gap-2">
                    <Avatar name={c.requester_name} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-body font-medium text-charcoal-deep truncate">{c.requester_name}</p>
                      <p className="text-[11px] text-greige truncate">{c.requester_email}</p>
                    </div>
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Badge variant={STATUS_VARIANT[c.status] ?? 'default'} className="capitalize text-[11px]">
                      {c.status}
                    </Badge>
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <span className="text-xs text-greige font-body">{c.scope.length} permission{c.scope.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <p className="text-[11px] text-greige font-body">{formatDate(c.requested_at)}</p>
                    {c.revocation_reason && (
                      <p className="text-[10px] text-[#B91C1C] mt-0.5 truncate" title={c.revocation_reason}>
                        {c.revocation_reason}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}

// ─── Doctor view ───────────────────────────────────────────────────────────────
function DoctorConsentView() {
  const [active, setActive] = useState<ConsentRequest[]>([])
  const [history, setHistory] = useState<ConsentRequest[]>([])
  const [loading, setLoading] = useState(true)

  // Request access panel
  const [patients, setPatients] = useState<PatientOut[]>([])
  const [reqPatientEmail, setReqPatientEmail] = useState('')
  const [reqReason, setReqReason] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<string[]>([...ALL_SCOPES])
  const [reqLoading, setReqLoading] = useState(false)
  const [reqMsg, setReqMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const [a, h, p] = await Promise.all([
          consentApi.getActive(),
          consentApi.getHistory(),
          orgApi.getDoctorPatients(),
        ])
        if (alive) { setActive(a); setHistory(h); setPatients(p) }
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [])

  function toggleScope(s: string) {
    setSelectedScopes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  async function handleRequestAccess() {
    if (!reqPatientEmail || selectedScopes.length === 0) return
    setReqLoading(true)
    setReqMsg(null)
    try {
      await consentApi.request(reqPatientEmail, selectedScopes, reqReason || undefined)
      setReqMsg({ ok: true, text: 'Request sent. The patient will be notified.' })
      setReqPatientEmail(''); setReqReason('')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to send request'
      setReqMsg({ ok: false, text: msg })
    } finally {
      setReqLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-body text-2xl font-bold text-charcoal-deep">Consent Management</h1>
        <p className="text-sm text-greige font-body mt-1">Manage patient access permissions granted to you</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Active Consents', value: loading ? '…' : active.length,  icon: Shield,  href: '/consent/active',   color: 'text-success-DEFAULT', bg: 'bg-success-soft' },
          { label: 'Past Consents',   value: loading ? '…' : history.length,  icon: History, href: '/consent/history',  color: 'text-stone',          bg: 'bg-parchment'    },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="p-4 text-center hover:border-gold-soft transition-all">
              <div className={`w-9 h-9 rounded-full ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="font-display text-2xl text-charcoal-deep">{stat.value}</p>
              <p className="text-[11px] text-greige font-body mt-0.5">{stat.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Request access panel */}
      <Card>
        <CardHeader>
          <CardTitle className="font-body text-base flex items-center gap-2">
            <Plus className="w-4 h-4 text-gold-deep" />
            Request Access to a Patient&apos;s Records
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-[11px] text-greige font-body block mb-1">Patient</label>
            <select
              value={reqPatientEmail}
              onChange={(e) => setReqPatientEmail(e.target.value)}
              className="w-full text-xs border border-sand-light rounded-lg px-3 py-2 bg-ivory-warm font-body text-charcoal-deep focus:outline-none focus:border-gold-soft"
            >
              <option value="">Select patient…</option>
              {patients.map((p) => (
                <option key={p.patient_id} value={p.email ?? ''}>
                  {p.first_name} {p.last_name} ({p.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-greige font-body block mb-1">Permissions to request</label>
            <div className="flex flex-wrap gap-2">
              {ALL_SCOPES.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleScope(s)}
                  className={cn(
                    'text-[11px] font-body px-2.5 py-1 rounded-full border transition-all',
                    selectedScopes.includes(s)
                      ? 'bg-charcoal-deep text-ivory-cream border-charcoal-deep'
                      : 'bg-parchment text-greige border-sand-light hover:border-gold-soft'
                  )}
                >
                  {SCOPE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={reqReason}
            onChange={(e) => setReqReason(e.target.value)}
            placeholder="Reason for request (optional — helps the patient decide)…"
            rows={2}
            className="w-full text-xs border border-sand-light rounded-lg px-3 py-2 bg-ivory-warm font-body text-charcoal-deep focus:outline-none focus:border-gold-soft resize-none"
          />
          {reqMsg && (
            <p className={cn('text-xs font-body', reqMsg.ok ? 'text-success-DEFAULT' : 'text-[#B91C1C]')}>
              {reqMsg.text}
            </p>
          )}
          <Button
            size="sm"
            onClick={handleRequestAccess}
            disabled={reqLoading || !reqPatientEmail || selectedScopes.length === 0}
          >
            {reqLoading ? 'Sending…' : 'Send Request'}
          </Button>
        </CardContent>
      </Card>

      {/* Active consents preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-body text-base">My Active Patient Consents</CardTitle>
            <Link href="/consent/active" className="text-xs text-gold-deep hover:underline font-body">View all →</Link>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-sand-light">
          {active.length === 0 ? (
            <div className="py-8 text-center">
              <Shield className="w-8 h-8 text-greige mx-auto mb-2" />
              <p className="text-sm text-greige font-body">No active patient consents</p>
            </div>
          ) : (
            active.slice(0, 3).map((consent) => (
              <div key={consent.id} className="flex items-center gap-3 py-3">
                <Avatar name={consent.patient_email} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-semibold text-charcoal-deep truncate">{consent.patient_email}</p>
                  <p className="text-xs text-greige truncate">{consent.scope.length} permissions</p>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Quick nav */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Active Consents', href: '/consent/active',  icon: Shield   },
          { label: 'Consent History', href: '/consent/history', icon: History  },
        ].map((item) => (
          <Link key={item.label} href={item.href}>
            <Card className="p-4 flex items-center gap-3 hover:border-gold-soft transition-all">
              <item.icon className="w-4 h-4 text-gold-soft shrink-0" />
              <span className="text-sm font-body font-medium text-charcoal-deep">{item.label}</span>
              <ArrowRight className="w-4 h-4 text-greige ml-auto" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── Patient view ──────────────────────────────────────────────────────────────
function PatientConsentView() {
  const { user } = useAuth()
  const [pending, setPending] = useState<ConsentRequest[]>([])
  const [active, setActive] = useState<ConsentRequest[]>([])
  const [history, setHistory] = useState<ConsentRequest[]>([])
  const [loading, setLoading] = useState(true)

  // Acting-for selector (for family owners)
  const [manageableMembers, setManageableMembers] = useState<ManageableMember[]>([])
  const [actingFor, setActingFor] = useState<string>('') // '' = self, else subject_id
  const isOwnerActing = !!actingFor

  // Grant direct panel
  const [doctors, setDoctors] = useState<DoctorOut[]>([])
  const [grantDoctorEmail, setGrantDoctorEmail] = useState('')
  const [grantScopes, setGrantScopes] = useState<string[]>([...ALL_SCOPES])
  const [grantMsg, setGrantMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [grantLoading, setGrantLoading] = useState(false)

  // Revoke state
  const [revokeId, setRevokeId] = useState<string | null>(null)
  const [revokeReason, setRevokeReason] = useState('')
  const [revoking, setRevoking] = useState(false)

  // Load manageable members once (only relevant if user is a family owner)
  useEffect(() => {
    familyApi.listManageableMembers().then(setManageableMembers).catch(() => {})
  }, [])

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const docs = await orgApi.listDoctorsForConsent()
        if (isOwnerActing) {
          const [p, a] = await Promise.all([
            consentApi.getSubjectIncoming(actingFor),
            consentApi.getSubjectActive(actingFor),
          ])
          if (alive) { setPending(p); setActive(a); setHistory([]); setDoctors(docs) }
        } else {
          const [p, a, h] = await Promise.all([
            consentApi.getIncoming(),
            consentApi.getActive(),
            consentApi.getHistory(),
          ])
          if (alive) { setPending(p); setActive(a); setHistory(h); setDoctors(docs) }
        }
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [actingFor, isOwnerActing])

  function toggleScope(s: string) {
    setGrantScopes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  async function handleGrantDirect() {
    if (!grantDoctorEmail || grantScopes.length === 0) return
    setGrantLoading(true)
    setGrantMsg(null)
    try {
      const result = isOwnerActing
        ? await consentApi.ownerGrantDirect(actingFor, grantDoctorEmail, grantScopes)
        : await consentApi.grantDirect(grantDoctorEmail, grantScopes)
      setActive((prev) => [result, ...prev])
      setGrantMsg({ ok: true, text: 'Access granted successfully.' })
      setGrantDoctorEmail('')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to grant access'
      setGrantMsg({ ok: false, text: msg })
    } finally {
      setGrantLoading(false)
    }
  }

  async function handleRevoke(id: string) {
    if (!revokeReason.trim()) return
    setRevoking(true)
    try {
      if (isOwnerActing) {
        await consentApi.ownerRevoke(id, actingFor, revokeReason)
      } else {
        await consentApi.revoke(id, revokeReason)
      }
      setActive((prev) => prev.filter((c) => c.id !== id))
      setRevokeId(null)
      setRevokeReason('')
    } finally {
      setRevoking(false)
    }
  }

  const eligibleMembers = manageableMembers.filter((m) => m.allow_owner_actions)
  const isFamilyOwner = manageableMembers.length > 0
  const subjectMember = eligibleMembers.find((m) => m.user_id === actingFor)
  const subjectName = subjectMember
    ? `${subjectMember.first_name ?? ''} ${subjectMember.last_name ?? ''}`.trim() || subjectMember.email || 'Member'
    : 'Self'

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-body text-2xl font-bold text-charcoal-deep">Consent Management</h1>
        <p className="text-sm text-greige font-body mt-1">
          {isOwnerActing
            ? <>Acting on behalf of <span className="font-semibold text-charcoal-deep">{subjectName}</span> as family owner.</>
            : 'Control who can access your health records and for how long'}
        </p>
      </div>

      {/* Acting-for selector — visible to family owners */}
      {isFamilyOwner && (
        <Card className="border-gold-soft/40">
          <CardContent className="p-4">
            <label className="text-[11px] text-greige font-body block mb-1">Acting for</label>
            <select
              value={actingFor}
              onChange={(e) => setActingFor(e.target.value)}
              className="w-full text-sm border border-sand-light rounded-lg px-3 py-2 bg-ivory-warm font-body text-charcoal-deep focus:outline-none focus:border-gold-soft"
            >
              <option value="">Self ({user?.email})</option>
              {manageableMembers.map((m) => {
                const name = `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim() || m.email || m.user_id
                return (
                  <option key={m.user_id} value={m.user_id} disabled={!m.allow_owner_actions}>
                    {name}{m.email ? ` (${m.email})` : ''}{!m.allow_owner_actions ? ' — opted out' : ''}
                  </option>
                )
              })}
            </select>
            {isOwnerActing && (
              <p className="text-[11px] text-greige font-body mt-2">All actions below will be performed for this member and audited under your name.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending Requests', value: loading ? '…' : pending.length, icon: Clock,    href: '/consent/requests', color: 'text-warning-DEFAULT', bg: 'bg-warning-soft' },
          { label: 'Active Consents',  value: loading ? '…' : active.length,  icon: Shield,   href: '/consent/active',   color: 'text-success-DEFAULT', bg: 'bg-success-soft' },
          { label: 'Past Consents',    value: loading ? '…' : history.length,  icon: History,  href: '/consent/history',  color: 'text-stone',           bg: 'bg-parchment'    },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="p-4 text-center hover:border-gold-soft transition-all">
              <div className={`w-9 h-9 rounded-full ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="font-display text-2xl text-charcoal-deep">{stat.value}</p>
              <p className="text-[11px] text-greige font-body mt-0.5">{stat.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pending alert */}
      {!loading && pending.length > 0 && (
        <div className="bg-warning-soft border border-warning-DEFAULT/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning-DEFAULT shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-body font-semibold text-charcoal-deep mb-0.5">
              {pending.length} pending consent request{pending.length > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-stone font-body">Healthcare providers are waiting for your approval.</p>
          </div>
          <Link href="/consent/requests">
            <Button size="sm">Review <ArrowRight className="w-3.5 h-3.5" /></Button>
          </Link>
        </div>
      )}

      {/* Grant direct panel */}
      <Card>
        <CardHeader>
          <CardTitle className="font-body text-base flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-gold-deep" />
            Grant Access to a Doctor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-greige font-body">
            You can proactively share your records with a doctor — no request needed from their side.
          </p>
          <div>
            <label className="text-[11px] text-greige font-body block mb-1">Doctor</label>
            <select
              value={grantDoctorEmail}
              onChange={(e) => setGrantDoctorEmail(e.target.value)}
              className="w-full text-xs border border-sand-light rounded-lg px-3 py-2 bg-ivory-warm font-body text-charcoal-deep focus:outline-none focus:border-gold-soft"
            >
              <option value="">Select doctor…</option>
              {doctors.map((d) => (
                <option key={d.user_id} value={d.email}>
                  {d.first_name} {d.last_name} ({d.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-greige font-body block mb-1">Permissions to grant</label>
            <div className="flex flex-wrap gap-2">
              {ALL_SCOPES.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleScope(s)}
                  className={cn(
                    'text-[11px] font-body px-2.5 py-1 rounded-full border transition-all',
                    grantScopes.includes(s)
                      ? 'bg-charcoal-deep text-ivory-cream border-charcoal-deep'
                      : 'bg-parchment text-greige border-sand-light hover:border-gold-soft'
                  )}
                >
                  {SCOPE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          {grantMsg && (
            <p className={cn('text-xs font-body', grantMsg.ok ? 'text-success-DEFAULT' : 'text-[#B91C1C]')}>
              {grantMsg.text}
            </p>
          )}
          <Button
            size="sm"
            onClick={handleGrantDirect}
            disabled={grantLoading || !grantDoctorEmail || grantScopes.length === 0}
          >
            {grantLoading ? 'Granting…' : 'Grant Access'}
          </Button>
        </CardContent>
      </Card>

      {/* Doctors with access — Bug 5 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-body text-base">Doctors with Access to My Records</CardTitle>
            <Link href="/consent/active" className="text-xs text-gold-deep hover:underline font-body">View all →</Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-0 divide-y divide-sand-light">
          {active.length === 0 ? (
            <div className="py-8 text-center">
              <Check className="w-8 h-8 text-success-DEFAULT mx-auto mb-2" />
              <p className="text-sm text-greige font-body">No doctors currently have access</p>
            </div>
          ) : (
            active.map((consent) => (
              <div key={consent.id} className="py-3 space-y-2">
                <div className="flex items-center gap-3">
                  <Avatar name={consent.requester_name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-semibold text-charcoal-deep truncate">{consent.requester_name}</p>
                    <p className="text-xs text-greige">
                      Since {formatDate(consent.requested_at)} · {consent.scope.length} permission{consent.scope.length !== 1 ? 's' : ''}
                      {consent.expires_at && ` · Expires ${formatDate(consent.expires_at)}`}
                    </p>
                    {consent.acted_by_owner_name && (
                      <p className="text-[11px] text-gold-deep font-body mt-0.5">Approved by {consent.acted_by_owner_name} (family owner)</p>
                    )}
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>

                <div className="flex flex-wrap gap-1.5 pl-10">
                  {consent.scope.map((s) => (
                    <span key={s} className="text-[10px] font-body bg-parchment border border-sand-light rounded-full px-2 py-0.5 text-stone">
                      {SCOPE_LABELS[s] || s}
                    </span>
                  ))}
                </div>

                <div className="pl-10">
                  {revokeId === consent.id ? (
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={revokeReason}
                        onChange={(e) => setRevokeReason(e.target.value)}
                        placeholder="Reason for revoking…"
                        className="flex-1 text-xs border border-sand-light rounded-lg px-3 py-1.5 bg-ivory-warm font-body text-charcoal-deep focus:outline-none focus:border-gold-soft"
                      />
                      <button
                        onClick={() => handleRevoke(consent.id)}
                        disabled={revoking || !revokeReason.trim()}
                        className="text-xs px-3 py-1.5 rounded-lg bg-error-soft text-[#B91C1C] font-body disabled:opacity-50"
                      >
                        {revoking ? '…' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => { setRevokeId(null); setRevokeReason('') }}
                        className="text-xs px-3 py-1.5 rounded-lg border border-sand-light text-greige font-body"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRevokeId(consent.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Revoke
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}

          {active.length > 0 && (
            <div className="pt-3 pb-1">
              <p className="text-[11px] text-greige font-body bg-azure-whisper/50 border border-sapphire-mist/20 rounded-lg px-3 py-2">
                Multiple doctors can have access at the same time. Each consent is independent — revoking one does not affect others.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending requests preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-body text-base">Pending Requests</CardTitle>
            <Link href="/consent/requests" className="text-xs text-gold-deep hover:underline font-body">View all →</Link>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-sand-light">
          {pending.length === 0 ? (
            <div className="py-8 text-center">
              <Check className="w-8 h-8 text-success-DEFAULT mx-auto mb-2" />
              <p className="text-sm text-greige font-body">No pending requests</p>
            </div>
          ) : (
            pending.slice(0, 3).map((req) => (
              <div key={req.id} className="flex items-center gap-3 py-3">
                <Avatar name={req.requester_name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-semibold text-charcoal-deep truncate">{req.requester_name}</p>
                  <p className="text-xs text-greige truncate">{req.requester_email} · {req.scope.length} permissions</p>
                </div>
                <Badge variant="warning">Pending</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Quick nav */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Consent Requests', href: '/consent/requests', icon: Clock    },
          { label: 'Active Consents',  href: '/consent/active',   icon: Shield   },
          { label: 'Consent History',  href: '/consent/history',  icon: History  },
          { label: 'Access Logs',      href: '/logs?from=consent', icon: AlertCircle },
        ].map((item) => (
          <Link key={item.label} href={item.href}>
            <Card className="p-4 flex items-center gap-3 hover:border-gold-soft transition-all">
              <item.icon className="w-4 h-4 text-gold-soft shrink-0" />
              <span className="text-sm font-body font-medium text-charcoal-deep">{item.label}</span>
              <ArrowRight className="w-4 h-4 text-greige ml-auto" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── Page router ───────────────────────────────────────────────────────────────
export default function ConsentDashboardPage() {
  const { user } = useAuth()
  if (!user) return null
  if (user.role === 'admin' || user.role === 'super_admin') return <AdminConsentView />
  if (user.role === 'doctor') return <DoctorConsentView />
  return <PatientConsentView />
}
