'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Activity, Eye, Upload, Shield, Download, Bot, Search, User, FileText, Filter, X, AlertTriangle, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { intakeApi, adminApi, getAccessToken } from '@/lib/api'
import type { AuditTrailEntry, AuditLogOut, AdminUserOut, AdminOrgItem } from '@/lib/api'
import { FriendlyRef, type IdMaps } from '@/components/admin/FriendlyRef'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { Pagination } from '@/components/ui/Pagination'
import { cn } from '@/lib/utils'

const ACTION_META: Record<string, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  upload:         { icon: Upload,   label: 'Record Uploaded',  color: 'text-success-DEFAULT', bg: 'bg-success-soft'   },
  confirm:        { icon: FileText, label: 'Record Confirmed', color: 'text-gold-deep',       bg: 'bg-gold-whisper'   },
  manual_entry:   { icon: FileText, label: 'Manual Entry',     color: 'text-gold-deep',       bg: 'bg-gold-whisper'   },
  read:           { icon: Eye,      label: 'Record Viewed',    color: 'text-stone',           bg: 'bg-parchment'      },
  read_list:      { icon: Eye,      label: 'Records Listed',   color: 'text-stone',           bg: 'bg-parchment'      },
  download_url:   { icon: Download, label: 'Download Issued',  color: 'text-sapphire-deep',   bg: 'bg-azure-whisper'  },
  share:          { icon: Shield,   label: 'Record Shared',    color: 'text-gold-deep',       bg: 'bg-gold-whisper'   },
  revoke_share:   { icon: Shield,   label: 'Access Revoked',   color: 'text-[#B91C1C]',   bg: 'bg-error-soft'     },
  bulk_import:    { icon: Upload,   label: 'Bulk Import',      color: 'text-success-DEFAULT', bg: 'bg-success-soft'   },
  assign_patient: { icon: User,     label: 'Patient Assigned', color: 'text-stone',           bg: 'bg-parchment'      },
  invite_doctor:  { icon: User,     label: 'Doctor Invited',   color: 'text-gold-deep',       bg: 'bg-gold-whisper'   },
  update_role:    { icon: Shield,   label: 'Role Updated',     color: 'text-sapphire-deep',   bg: 'bg-azure-whisper'  },
  delete_user:    { icon: User,     label: 'User Deleted',     color: 'text-[#B91C1C]',   bg: 'bg-error-soft'     },
  ai_analysis:    { icon: Bot,      label: 'AI Analysis',      color: 'text-charcoal-deep',   bg: 'bg-ivory-warm'     },
}

function getMeta(action: string) {
  return ACTION_META[action] ?? { icon: Activity, label: action, color: 'text-greige', bg: 'bg-parchment' }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const ACCESS_ACTIONS = new Set(['read', 'read_list', 'download_url', 'share', 'revoke_share'])

const TABS = [
  { id: 'activity', label: 'Activity Logs', icon: <Activity className="w-4 h-4" /> },
  { id: 'access',   label: 'Access Logs',   icon: <Eye      className="w-4 h-4" /> },
]

interface LogRow {
  id: string
  action: string
  actor: string
  detail: string
  severity?: string
  timestamp: string
}

function fromTrail(e: AuditTrailEntry): LogRow {
  return { id: e.id, action: e.action, actor: '', detail: e.detail, timestamp: e.timestamp }
}
function fromAdminLog(e: AuditLogOut): LogRow {
  return { id: e.id, action: e.action, actor: e.performed_by, detail: e.detail ?? '', severity: e.severity, timestamp: e.timestamp }
}

function LogEntry({ row, idMaps }: { row: LogRow; idMaps: IdMaps }) {
  const meta = getMeta(row.action)
  const Icon = meta.icon
  return (
    <div className="flex items-start gap-3 py-4 border-b border-sand-light last:border-0">
      <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0', meta.bg)}>
        <Icon className={cn('w-4 h-4', meta.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <p className="text-sm font-body font-medium text-charcoal-deep">{meta.label}</p>
          {row.severity && <Badge variant="default" className="text-[10px]">{row.severity}</Badge>}
        </div>
        <p className="text-xs text-stone font-body leading-relaxed">{row.detail || '—'}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {row.actor && (
            <>
              <User className="w-3 h-3 text-greige" />
              <span className="text-[11px] text-greige font-body truncate max-w-[200px]">
                <FriendlyRef refValue={row.actor} maps={idMaps} inline />
              </span>
              <span className="text-greige">·</span>
            </>
          )}
          <span className="text-[11px] text-greige font-body">{formatDate(row.timestamp)}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Filter bar shared component ─────────────────────────────────────────────

interface FilterPillsProps {
  label: string
  options: string[]
  value: string
  onChange: (v: string) => void
}

function FilterPills({ label, options, value, onChange }: FilterPillsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11px] text-greige font-body font-semibold uppercase tracking-wider shrink-0">{label}:</span>
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={cn(
            'px-2.5 py-1 rounded-full text-xs font-body transition-all capitalize',
            value === o ? 'bg-charcoal-deep text-ivory-cream' : 'bg-parchment text-greige hover:text-charcoal-deep'
          )}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LogsPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const PAGE_SIZE = 20

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const fromConsent = searchParams.get('from') === 'consent'

  // Shared
  const [rows, setRows]     = useState<LogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  // Friendly-name maps for FriendlyRef (admin-only fetch).
  const [users, setUsers] = useState<Record<string, AdminUserOut>>({})
  const [orgs,  setOrgs ] = useState<Record<string, AdminOrgItem>>({})
  const idMaps: IdMaps = { users, orgs }

  useEffect(() => {
    if (!getAccessToken()) return
    // Seed the current user's own entry so their ID resolves to their name
    // even without admin permissions to fetch the full user list.
    if (user?.id) {
      const nameParts = (user.name ?? '').split(' ')
      const selfEntry: AdminUserOut = {
        id: user.id,
        email: user.email ?? '',
        first_name: nameParts[0] ?? '',
        last_name: nameParts.slice(1).join(' '),
        role: user.role ?? '',
        is_active: true,
        email_verified: true,
        organization: null,
        location: null,
        created_at: null,
      }
      setUsers((prev) => ({ ...prev, [user.id]: selfEntry }))
    }
    if (!isAdmin) return
    let alive = true
    Promise.all([
      adminApi.listUsers('').catch(() => [] as AdminUserOut[]),
      adminApi.listAllOrgs('').catch(() => [] as AdminOrgItem[]),
    ]).then(([u, o]) => {
      if (!alive) return
      setUsers(Object.fromEntries(u.map((x) => [x.id, x])))
      setOrgs(Object.fromEntries(o.map((x) => [x.id, x])))
    })
    return () => { alive = false }
  }, [isAdmin, user?.id])

  // Admin-specific filters (sent to backend)
  const [severity, setSeverity]     = useState('all')
  const [actionFilter, setActionFilter] = useState('all')

  // Patient/doctor-specific filters (client-side)
  const [actionType, setActionType] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')

  // Debounce admin search to avoid hammering the backend
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function reloadAdmin(sev: string, act: string, q: string) {
    setLoading(true)
    adminApi.getAuditLogs({
      search: q || undefined,
      severity: sev !== 'all' ? sev : undefined,
      limit: 500,
    }).then((logs) => {
      let result = logs.map(fromAdminLog)
      if (act !== 'all') result = result.filter((r) => r.action === act)
      setRows(result)
    })
    .catch(() => setRows([]))
    .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!getAccessToken()) { setLoading(false); return }
    if (isAdmin) {
      reloadAdmin(severity, actionFilter, search)
    } else {
      // Non-admin roles: combine the per-record intake audit trail with the
      // role-scoped admin audit log (which the backend now scopes to the
      // user's own actor/target rows for doctor/patient).
      Promise.all([
        intakeApi.getAuditTrail(500).catch(() => [] as AuditTrailEntry[]),
        adminApi.getAuditLogs({ limit: 500 }).catch(() => [] as AuditLogOut[]),
      ])
        .then(([trail, sysLogs]) => {
          const merged: LogRow[] = [...trail.map(fromTrail), ...sysLogs.map(fromAdminLog)]
          // Deduplicate by id, and also by action+timestamp(minute)+detail to prevent logical duplicates
          const seen = new Set<string>()
          const uniqueRows = merged.filter((row) => {
            // Truncate timestamp to YYYY-MM-DDTHH:mm to group events happening in the same minute
            // This matches the UI display which only shows down to the minute.
            const minuteTimestamp = row.timestamp.substring(0, 16)
            const compositeKey = `${row.action}|${minuteTimestamp}|${row.detail}`
            if (seen.has(row.id) || seen.has(compositeKey)) return false
            seen.add(row.id)
            seen.add(compositeKey)
            return true
          })
          uniqueRows.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
          setRows(uniqueRows)
        })
        .finally(() => setLoading(false))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  // Admin: re-fetch when severity or actionFilter changes
  useEffect(() => {
    if (!isAdmin) return
    reloadAdmin(severity, actionFilter, search)
    setPage(1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [severity, actionFilter])

  // Admin: debounced search
  function handleSearch(q: string) {
    setSearch(q)
    setPage(1)
    if (!isAdmin) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => reloadAdmin(severity, actionFilter, q), 400)
  }

  // Patient/doctor: client-side filter
  const patientFiltered = rows.filter((r) => {
    if (search && !r.action.toLowerCase().includes(search.toLowerCase()) && !r.detail.toLowerCase().includes(search.toLowerCase())) return false
    if (actionType !== 'all') {
      if (actionType === 'uploads'  && !['upload', 'confirm', 'manual_entry', 'bulk_import'].includes(r.action)) return false
      if (actionType === 'views'    && !['read', 'read_list'].includes(r.action)) return false
      if (actionType === 'shares'   && !['share', 'revoke_share'].includes(r.action)) return false
      if (actionType === 'downloads' && r.action !== 'download_url') return false
    }
    if (dateFrom && r.timestamp < dateFrom) return false
    if (dateTo   && r.timestamp > dateTo + 'T23:59:59') return false
    return true
  })

  const displayRows = isAdmin ? rows : patientFiltered
  const totalPages  = Math.ceil(displayRows.length / PAGE_SIZE)
  const pageSlice   = displayRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // reset page on patient filters change
  useEffect(() => { setPage(1) }, [actionType, dateFrom, dateTo])

  const totalEvents = rows.length
  const viewCount   = rows.filter((r) => r.action === 'read' || r.action === 'read_list').length
  const exportCount = rows.filter((r) => r.action === 'download_url').length

  const adminActions = [...new Set(rows.map((r) => r.action))].sort()

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        {fromConsent && (
          <div className="mb-4">
            <Link
              href="/consent"
              aria-label="Back to Consent Management"
              title="Back to Consent Management"
              className="inline-flex items-center gap-1.5 px-2 py-1.5 text-greige hover:text-charcoal-deep hover:bg-parchment rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-body font-medium">Back to Consent</span>
            </Link>
          </div>
        )}
        <h1 className="font-body text-2xl font-bold text-charcoal-deep">Audit Logs</h1>
        <p className="text-sm text-greige font-body mt-1">
          {isAdmin ? 'Full system audit trail — all user actions' : 'Immutable record of all activity on your health data'}
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Events', value: loading ? '—' : totalEvents, icon: Activity },
          { label: 'Record Views', value: loading ? '—' : viewCount,   icon: Eye      },
          { label: 'Downloads',    value: loading ? '—' : exportCount,  icon: Download },
        ].map((s) => (
          <Card key={s.label} className="p-4 text-center">
            <s.icon className="w-4 h-4 text-gold-soft mx-auto mb-1.5" />
            <p className="font-display text-2xl text-charcoal-deep">{s.value}</p>
            <p className="text-[11px] text-greige font-body">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Anomaly highlights */}
      <div className="bg-white border border-sand-light rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-3.5 h-3.5 text-warning-DEFAULT" />
          <span className="text-xs font-body font-semibold text-charcoal-deep uppercase tracking-wider">Anomaly Highlights</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Off-hours login · 02:14 IST', color: 'bg-warning-soft text-warning-DEFAULT' },
            { label: 'Foreign IP · 185.220.x.x', color: 'bg-error-soft text-[#B91C1C]' },
            { label: '3× failed 2FA · pat_001', color: 'bg-warning-soft text-warning-DEFAULT' },
            { label: 'Bulk export · 240 records', color: 'bg-azure-whisper text-sapphire-deep' },
          ].map((c) => (
            <span key={c.label} className={cn('text-[11px] font-body font-medium px-2.5 py-1 rounded-full', c.color)}>{c.label}</span>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-sand-light rounded-xl px-4 py-3 focus-within:border-gold-soft transition-all">
        <Search className="w-4 h-4 text-greige shrink-0" />
        <input
          type="text"
          placeholder={isAdmin ? 'Search by action, target, or user name…' : 'Search logs…'}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm font-body text-charcoal-deep placeholder:text-greige outline-none"
        />
        {search && (
          <button onClick={() => handleSearch('')} className="text-greige hover:text-charcoal-deep transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Admin filters */}
      {isAdmin && (
        <div className="space-y-3 p-4 bg-parchment rounded-xl border border-sand-light">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-greige" />
            <span className="text-xs font-body font-semibold text-greige">Admin Filters</span>
          </div>
          <FilterPills
            label="Severity"
            options={['all', 'info', 'warning', 'critical']}
            value={severity}
            onChange={setSeverity}
          />
          <FilterPills
            label="Action"
            options={['all', ...adminActions]}
            value={actionFilter}
            onChange={setActionFilter}
          />
        </div>
      )}

      {/* Patient / Doctor filters */}
      {!isAdmin && (
        <div className="space-y-3 p-4 bg-parchment rounded-xl border border-sand-light">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-greige" />
            <span className="text-xs font-body font-semibold text-greige">Filters</span>
          </div>
          <FilterPills
            label="Type"
            options={['all', 'uploads', 'views', 'shares', 'downloads']}
            value={actionType}
            onChange={setActionType}
          />
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[11px] text-greige font-body font-semibold uppercase tracking-wider">Date:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-xs border border-sand-light rounded-lg px-2.5 py-1.5 bg-white font-body text-charcoal-deep focus:outline-none focus:border-gold-soft"
            />
            <span className="text-xs text-greige">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-xs border border-sand-light rounded-lg px-2.5 py-1.5 bg-white font-body text-charcoal-deep focus:outline-none focus:border-gold-soft"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo('') }}
                className="text-xs text-greige hover:text-charcoal-deep transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      <Tabs tabs={TABS} defaultTab={fromConsent ? 'access' : undefined}>
        {(activeTab) => {
          const list = activeTab === 'activity' ? pageSlice : pageSlice.filter((r) => ACCESS_ACTIONS.has(r.action))
          const tabTotal = activeTab === 'activity' ? displayRows.length : displayRows.filter((r) => ACCESS_ACTIONS.has(r.action)).length
          return (
            <Card>
              <CardHeader>
                <CardTitle className="font-body text-base">
                  {activeTab === 'activity' ? 'All Activity' : 'Data Access Events'}
                </CardTitle>
                <CardDescription>
                  {activeTab === 'activity'
                    ? `${tabTotal} event${tabTotal !== 1 ? 's' : ''}${totalPages > 1 ? ` · page ${page} of ${totalPages}` : ''}`
                    : `${tabTotal} access event${tabTotal !== 1 ? 's' : ''} — who viewed your data`}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 px-5">
                {loading ? (
                  <div className="space-y-4 py-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-9 h-9 rounded-full bg-sand-light shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-sand-light rounded w-1/3" />
                          <div className="h-2 bg-sand-light rounded w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : list.length === 0 ? (
                  <div className="py-10 text-center">
                    <Activity className="w-10 h-10 text-greige mx-auto mb-3" />
                    <p className="text-sm text-greige font-body">No logs found</p>
                  </div>
                ) : (
                  list.map((row) => <LogEntry key={row.id} row={row} idMaps={idMaps} />)
                )}
              </CardContent>
              {activeTab === 'activity' && totalPages > 1 && (
                <div className="px-5 pb-4">
                  <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              )}
            </Card>
          )
        }}
      </Tabs>
    </div>
  )
}
