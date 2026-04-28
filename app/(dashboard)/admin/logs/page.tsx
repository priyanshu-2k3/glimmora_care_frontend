'use client'

import { useEffect, useState } from 'react'
import { ClipboardList, Search, AlertCircle } from 'lucide-react'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { adminApi, type AuditLogOut } from '@/lib/api'

const SEVERITY_VARIANT: Record<string, 'success' | 'warning' | 'error'> = {
  info: 'success',
  warning: 'warning',
  critical: 'error',
}

const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-error-DEFAULT',
  warning: 'bg-warning-DEFAULT',
  info: 'bg-success-DEFAULT',
}

function formatDateTime(ts: string) {
  try { return new Date(ts).toLocaleString() } catch { return ts }
}

export default function AdminLogsPage() {
  const PAGE_SIZE = 25
  const [logs, setLogs] = useState<AuditLogOut[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

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

  return (
    <RoleGuard allowed={['admin', 'super_admin']}>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-body text-2xl font-bold text-charcoal-deep flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-gold-soft" />
              Admin Logs
            </h1>
            <p className="text-sm text-greige font-body mt-1">Audit trail of all admin operations.</p>
          </div>
          <Badge variant="dark">{loading ? '…' : `${filtered.length} entries`}</Badge>
        </div>

        <Input
          placeholder="Search by action, target, or user ID…"
          leftIcon={<Search className="w-4 h-4" />}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />

        {loading ? (
          <p className="text-sm text-greige font-body">Loading logs...</p>
        ) : error ? (
          <div className="flex items-center gap-3 bg-error-soft border border-error-DEFAULT/20 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-error-DEFAULT shrink-0" />
            <p className="text-sm font-body text-error-DEFAULT">{error}</p>
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
                      {log.target && <p className="text-xs text-greige mt-0.5">{log.target}</p>}
                      <p className="text-xs text-greige mt-0.5">By: {log.performed_by} · {formatDateTime(log.timestamp)}</p>
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
