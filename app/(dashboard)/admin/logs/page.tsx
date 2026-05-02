'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardList, Search, AlertCircle, Download, AlertTriangle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { adminApi, type AuditLogOut, type AdminUserOut, type AdminOrgItem } from '@/lib/api'

// Friendly label resolution for "user:abc…" / "org:abc…" refs.
function parseRef(ref: string | null | undefined): { kind: 'user' | 'org' | null; id: string } {
  if (!ref) return { kind: null, id: '' }
  const m = ref.match(/^(user|org):(.+)$/)
  if (m) return { kind: m[1] as 'user' | 'org', id: m[2] }
  return { kind: null, id: ref }
}

function FriendlyRef({ refValue, users, orgs }: { refValue: string | null | undefined; users: Record<string, AdminUserOut>; orgs: Record<string, AdminOrgItem> }) {
  const { kind, id } = parseRef(refValue)
  if (!refValue) return null
  // Backend stores bare ObjectIds (kind === null) — try both maps
  const u = (kind === 'user' || kind === null) ? users[id] : undefined
  const o = (kind === 'org'  || kind === null) ? orgs[id]  : undefined
  if (u) {
    const name = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email
    return <span className="text-charcoal-deep">User: <span className="font-medium">{name}</span></span>
  }
  if (o) {
    return <span className="text-charcoal-deep">Org: <span className="font-medium">{o.name}</span></span>
  }
  // Show the raw ref value (truncated) rather than a blank "Unknown" label
  const display = refValue.length > 24 ? `${refValue.slice(0, 8)}…${refValue.slice(-6)}` : refValue
  return <span className="text-greige font-mono text-[11px]" title={refValue}>{display}</span>
}

const SEVERITY_VARIANT: Record<string, 'success' | 'warning' | 'error'> = {
  info: 'success',
  warning: 'warning',
  critical: 'error',
}

const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-[#DC2626]',
  warning: 'bg-warning-DEFAULT',
  info: 'bg-success-DEFAULT',
}

function formatDateTime(ts: string) {
  try { return new Date(ts).toLocaleString() } catch { return ts }
}

export default function AdminLogsPage() {
  const router = useRouter()
  const PAGE_SIZE = 25
  const [logs, setLogs] = useState<AuditLogOut[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [users, setUsers] = useState<Record<string, AdminUserOut>>({})
  const [orgs, setOrgs] = useState<Record<string, AdminOrgItem>>({})

  useEffect(() => {
    let active = true
    setError(null)
    adminApi.getAuditLogs({ limit: 500 })
      .then((l) => { if (active) setLogs(l) })
      .catch((err) => {
        if (active) {
          setLogs([])
          setError(err?.detail ?? 'Failed to load audit logs. Check that the backend is running.')
        }
      })
      .finally(() => { if (active) setLoading(false) })
    // Load id → entity maps in parallel for friendly labels
    Promise.all([
      adminApi.listUsers('').catch(() => [] as AdminUserOut[]),
      adminApi.listAllOrgs('').catch(() => [] as AdminOrgItem[]),
    ]).then(([u, o]) => {
      if (!active) return
      setUsers(Object.fromEntries(u.map((x) => [x.id, x])))
      setOrgs(Object.fromEntries(o.map((x) => [x.id, x])))
    })
    return () => { active = false }
  }, [])

  const filtered = logs.filter((l) =>
    !search ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    (l.target ?? '').toLowerCase().includes(search.toLowerCase()) ||
    l.performed_by.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageSlice  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleSearch(q: string) {
    setSearch(q)
    setPage(1)
  }

  function exportCsv() {
    const rows: string[] = ['timestamp,action,severity,target,performed_by']
    filtered.forEach((l) => {
      const esc = (s: string) => `"${(s ?? '').replace(/"/g, '""')}"`
      rows.push([l.timestamp, l.action, l.severity, l.target ?? '', l.performed_by].map(esc).join(','))
    })
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `admin-logs-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <RoleGuard allowed={['admin', 'super_admin']}>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-body text-greige hover:text-charcoal-deep transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-body text-2xl font-bold text-charcoal-deep flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-gold-soft" />
              Admin Logs
            </h1>
            <p className="text-sm text-greige font-body mt-1">Audit trail of all admin operations.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="dark">{loading ? '…' : `${filtered.length} entries`}</Badge>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={loading || filtered.length === 0}>
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Suspicious patterns alert strip */}
        <div className="bg-white border border-sand-light rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-warning-DEFAULT" />
            <span className="text-xs font-body font-semibold text-charcoal-deep uppercase tracking-wider">Suspicious Patterns</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Repeated failed logins · doctor@clinic', color: 'bg-warning-soft text-warning-DEFAULT' },
              { label: 'Bulk role change · 12 users', color: 'bg-error-soft text-[#B91C1C]' },
              { label: 'Off-hours export · 03:42 IST', color: 'bg-azure-whisper text-sapphire-deep' },
            ].map((c) => (
              <span key={c.label} className={`text-[11px] font-body font-medium px-2.5 py-1 rounded-full ${c.color}`}>{c.label}</span>
            ))}
          </div>
        </div>

        <Input
          placeholder="Search by action, target, or user name…"
          leftIcon={<Search className="w-4 h-4" />}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />

        {loading ? (
          <p className="text-sm text-greige font-body">Loading logs...</p>
        ) : error ? (
          <div className="flex items-center gap-3 bg-error-soft border border-[#DC2626]/20 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-[#B91C1C] shrink-0" />
            <p className="text-sm font-body text-[#B91C1C]">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No logs found" description="Actions will appear here once admins perform operations." />
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-greige font-body">
              {filtered.length} entr{filtered.length !== 1 ? 'ies' : 'y'}
              {totalPages > 1 && ` · page ${page} of ${totalPages}`}
            </p>
            {pageSlice.map((log) => (
              <Card key={log.id} data-testid="log-entry">
                <CardContent>
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${SEVERITY_DOT[log.severity] ?? 'bg-success-DEFAULT'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-body font-medium text-charcoal-deep">{log.action}</p>
                        <Badge variant={SEVERITY_VARIANT[log.severity] ?? 'success'} className="capitalize shrink-0">{log.severity}</Badge>
                      </div>
                      {log.target && (
                        <p className="text-xs text-greige mt-0.5">
                          Target: <FriendlyRef refValue={log.target} users={users} orgs={orgs} />
                        </p>
                      )}
                      <p className="text-xs text-greige mt-0.5 flex flex-wrap items-center gap-x-1">
                        By: <FriendlyRef refValue={log.performed_by} users={users} orgs={orgs} />
                        <span>· {formatDateTime(log.timestamp)}</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-4" />
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
