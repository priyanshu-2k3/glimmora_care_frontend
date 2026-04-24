'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Shield, Clock, History, AlertCircle, Check, Users, ArrowRight, Search, Filter } from 'lucide-react'
import { consentApi, adminApi, type ConsentRequest } from '@/lib/api'
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

// ─── Admin / Super-admin view ─────────────────────────────────────────────────
function AdminConsentView() {
  const PAGE_SIZE = 20
  const [consents, setConsents] = useState<ConsentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [patientSearch, setPatientSearch] = useState('')
  const [doctorSearch, setDoctorSearch] = useState('')
  const [page, setPage] = useState(1)

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

  // reset page on filter change
  useEffect(() => { setPage(1) }, [statusFilter, patientSearch, doctorSearch])

  const totalPages = Math.ceil(consents.length / PAGE_SIZE)
  const pageSlice = consents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const counts = STATUS_FILTERS.slice(1).reduce<Record<string, number>>((acc, s) => {
    acc[s] = consents.filter((c) => c.status === s).length
    return acc
  }, {})

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-body text-2xl font-bold text-charcoal-deep">Consent Management</h1>
        <p className="text-sm text-greige font-body mt-1">Platform-wide view of all patient consent records.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {[
          { label: 'Pending',  status: 'pending',  color: 'text-warning-DEFAULT', bg: 'bg-warning-soft' },
          { label: 'Active',   status: 'approved', color: 'text-success-DEFAULT', bg: 'bg-success-soft' },
          { label: 'Revoked',  status: 'revoked',  color: 'text-error-DEFAULT',   bg: 'bg-error-soft'   },
          { label: 'Rejected', status: 'rejected', color: 'text-error-DEFAULT',   bg: 'bg-error-soft'   },
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
                  {/* Patient */}
                  <div className="col-span-12 sm:col-span-3 flex items-center gap-2">
                    <Avatar name={c.patient_email} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-body font-medium text-charcoal-deep truncate">{c.patient_email}</p>
                    </div>
                  </div>
                  {/* Requester */}
                  <div className="col-span-12 sm:col-span-3 flex items-center gap-2">
                    <Avatar name={c.requester_name} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-body font-medium text-charcoal-deep truncate">{c.requester_name}</p>
                      <p className="text-[11px] text-greige truncate">{c.requester_email}</p>
                    </div>
                  </div>
                  {/* Status */}
                  <div className="col-span-4 sm:col-span-2">
                    <Badge variant={STATUS_VARIANT[c.status] ?? 'default'} className="capitalize text-[11px]">
                      {c.status}
                    </Badge>
                  </div>
                  {/* Scope */}
                  <div className="col-span-4 sm:col-span-2">
                    <span className="text-xs text-greige font-body">{c.scope.length} permission{c.scope.length !== 1 ? 's' : ''}</span>
                  </div>
                  {/* Date */}
                  <div className="col-span-4 sm:col-span-2">
                    <p className="text-[11px] text-greige font-body">{formatDate(c.requested_at)}</p>
                    {c.revocation_reason && (
                      <p className="text-[10px] text-error-DEFAULT mt-0.5 truncate" title={c.revocation_reason}>
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

// ─── Patient / Doctor view (unchanged) ────────────────────────────────────────
function PatientDoctorConsentView() {
  const [pending, setPending] = useState<ConsentRequest[]>([])
  const [active, setActive] = useState<ConsentRequest[]>([])
  const [history, setHistory] = useState<ConsentRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const [p, a, h] = await Promise.all([
          consentApi.getIncoming(),
          consentApi.getActive(),
          consentApi.getHistory(),
        ])
        if (alive) { setPending(p); setActive(a); setHistory(h) }
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [])

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-body text-2xl font-bold text-charcoal-deep">Consent Management</h1>
        <p className="text-sm text-greige font-body mt-1">Control who can access your health records and for how long</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending Requests', value: loading ? '…' : pending.length, icon: Clock, href: '/consent/requests', color: 'text-warning-DEFAULT', bg: 'bg-warning-soft' },
          { label: 'Active Consents',  value: loading ? '…' : active.length,  icon: Shield, href: '/consent/active',   color: 'text-success-DEFAULT', bg: 'bg-success-soft' },
          { label: 'Past Consents',    value: loading ? '…' : history.length,  icon: History, href: '/consent/history', color: 'text-stone',          bg: 'bg-parchment'    },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="p-4 text-center hover:border-gold-soft transition-all">
              <div className={`w-9 h-9 rounded-full ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
                <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
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

      {/* Pending preview */}
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

      {/* Active preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-body text-base">Active Consents</CardTitle>
            <Link href="/consent/active" className="text-xs text-gold-deep hover:underline font-body">View all →</Link>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-sand-light">
          {active.slice(0, 3).map((consent) => (
            <div key={consent.id} className="flex items-center gap-3 py-3">
              <div className="w-9 h-9 rounded-full bg-success-soft flex items-center justify-center">
                <Users className="w-4 h-4 text-success-DEFAULT" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body font-semibold text-charcoal-deep truncate">{consent.requester_name}</p>
                <p className="text-xs text-greige truncate">{consent.scope.length} permissions</p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick nav */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Consent Requests', href: '/consent/requests', icon: Clock    },
          { label: 'Active Consents',  href: '/consent/active',   icon: Shield   },
          { label: 'Consent History',  href: '/consent/history',  icon: History  },
          { label: 'Access Logs',      href: '/logs',              icon: AlertCircle },
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
  return <PatientDoctorConsentView />
}
