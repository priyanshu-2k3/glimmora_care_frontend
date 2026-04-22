'use client'

import { useState, useEffect } from 'react'
import { Activity, Eye, Upload, Shield, Download, Bot, Search, User, FileText } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { intakeApi, adminApi, getAccessToken } from '@/lib/api'
import type { AuditTrailEntry, AuditLogOut } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { cn } from '@/lib/utils'

// Map backend action strings → display metadata
const ACTION_META: Record<string, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  // Intake audit trail actions
  upload:        { icon: Upload,   label: 'Record Uploaded',   color: 'text-success-DEFAULT', bg: 'bg-success-soft' },
  confirm:       { icon: FileText, label: 'Record Confirmed',  color: 'text-gold-deep',       bg: 'bg-gold-whisper' },
  manual_entry:  { icon: FileText, label: 'Manual Entry',      color: 'text-gold-deep',       bg: 'bg-gold-whisper' },
  read:          { icon: Eye,      label: 'Record Viewed',     color: 'text-stone',           bg: 'bg-parchment' },
  read_list:     { icon: Eye,      label: 'Records Listed',    color: 'text-stone',           bg: 'bg-parchment' },
  download_url:  { icon: Download, label: 'Download Issued',   color: 'text-sapphire-deep',   bg: 'bg-azure-whisper' },
  share:         { icon: Shield,   label: 'Record Shared',     color: 'text-gold-deep',       bg: 'bg-gold-whisper' },
  revoke_share:  { icon: Shield,   label: 'Access Revoked',    color: 'text-error-DEFAULT',   bg: 'bg-error-soft' },
  bulk_import:   { icon: Upload,   label: 'Bulk Import',       color: 'text-success-DEFAULT', bg: 'bg-success-soft' },
  // Admin audit log actions
  assign_patient:   { icon: User,     label: 'Patient Assigned',  color: 'text-stone',         bg: 'bg-parchment' },
  invite_doctor:    { icon: User,     label: 'Doctor Invited',    color: 'text-gold-deep',     bg: 'bg-gold-whisper' },
  update_role:      { icon: Shield,   label: 'Role Updated',      color: 'text-sapphire-deep', bg: 'bg-azure-whisper' },
  delete_user:      { icon: User,     label: 'User Deleted',      color: 'text-error-DEFAULT', bg: 'bg-error-soft' },
  ai_analysis:      { icon: Bot,      label: 'AI Analysis',       color: 'text-charcoal-deep', bg: 'bg-ivory-warm' },
}

function getMeta(action: string) {
  return ACTION_META[action] ?? { icon: Activity, label: action, color: 'text-greige', bg: 'bg-parchment' }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const ACCESS_ACTIONS = new Set(['read', 'read_list', 'download_url', 'share', 'revoke_share'])

const TABS = [
  { id: 'activity', label: 'Activity Logs',  icon: <Activity className="w-4 h-4" /> },
  { id: 'access',   label: 'Access Logs',    icon: <Eye className="w-4 h-4" /> },
]

// ─── Unified log entry shape ──────────────────────────────────────────────────

interface LogRow {
  id: string
  action: string
  actor: string   // user_id or performed_by
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

// ─── Single log row ───────────────────────────────────────────────────────────

function LogEntry({ row }: { row: LogRow }) {
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
        <div className="flex items-center gap-2 mt-1">
          {row.actor && (
            <>
              <User className="w-3 h-3 text-greige" />
              <span className="text-[11px] text-greige font-body truncate max-w-[160px]">{row.actor}</span>
              <span className="text-greige">·</span>
            </>
          )}
          <span className="text-[11px] text-greige font-body">{formatDate(row.timestamp)}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LogsPage() {
  const { user } = useAuth()
  const [rows, setRows]       = useState<LogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  useEffect(() => {
    if (!getAccessToken()) { setLoading(false); return }

    const fetch = isAdmin
      ? adminApi.getAuditLogs({ limit: 200 }).then((logs) => logs.map(fromAdminLog))
      : intakeApi.getAuditTrail(200).then((entries) => entries.map(fromTrail))

    fetch
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isAdmin])

  const filtered = rows.filter((r) => {
    if (!search) return true
    const q = search.toLowerCase()
    return r.action.includes(q) || r.detail.toLowerCase().includes(q) || r.actor.toLowerCase().includes(q)
  })

  const activityRows = filtered
  const accessRows   = filtered.filter((r) => ACCESS_ACTIONS.has(r.action))

  const totalEvents  = rows.length
  const viewCount    = rows.filter((r) => r.action === 'read' || r.action === 'read_list').length
  const exportCount  = rows.filter((r) => r.action === 'download_url').length

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-body text-2xl font-bold text-charcoal-deep">Audit Logs</h1>
        <p className="text-sm text-greige font-body mt-1">
          {isAdmin ? 'Full system audit trail — all user actions' : 'Immutable record of all activity on your health data'}
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Events', value: loading ? '—' : totalEvents, icon: Activity },
          { label: 'Record Views', value: loading ? '—' : viewCount,   icon: Eye },
          { label: 'Downloads',    value: loading ? '—' : exportCount,  icon: Download },
        ].map((s) => (
          <Card key={s.label} className="p-4 text-center">
            <s.icon className="w-4 h-4 text-gold-soft mx-auto mb-1.5" />
            <p className="font-display text-2xl text-charcoal-deep">{s.value}</p>
            <p className="text-[11px] text-greige font-body">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-sand-light rounded-xl px-4 py-3 focus-within:border-gold-soft transition-all">
        <Search className="w-4 h-4 text-greige shrink-0" />
        <input
          type="text"
          placeholder="Search logs…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm font-body text-charcoal-deep placeholder:text-greige outline-none"
        />
      </div>

      <Tabs tabs={TABS}>
        {(activeTab) => {
          const list = activeTab === 'activity' ? activityRows : accessRows
          return (
            <Card>
              <CardHeader>
                <CardTitle className="font-body text-base">
                  {activeTab === 'activity' ? 'All Activity' : 'Data Access Events'}
                </CardTitle>
                <CardDescription>
                  {activeTab === 'activity'
                    ? `${activityRows.length} events recorded`
                    : `${accessRows.length} access events — who viewed your data`}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 px-5">
                {loading ? (
                  <div className="space-y-4 py-4">
                    {[1,2,3].map((i) => (
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
                  list.map((row) => <LogEntry key={row.id} row={row} />)
                )}
              </CardContent>
            </Card>
          )
        }}
      </Tabs>
    </div>
  )
}
