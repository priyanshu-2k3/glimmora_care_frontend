'use client'

import { useState } from 'react'
import { Activity, Eye, Upload, Shield, Download, Bot, Filter, Search, User } from 'lucide-react'
import { MOCK_AUDIT_ENTRIES } from '@/data/audit-trail'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { cn } from '@/lib/utils'
import type { AuditAction } from '@/types/vault'

const ACTION_META: Partial<Record<AuditAction, { icon: React.ElementType; label: string; color: string; bg: string }>> = {
  record_view: { icon: Eye, label: 'Record Viewed', color: 'text-stone', bg: 'bg-parchment' },
  record_upload: { icon: Upload, label: 'Record Uploaded', color: 'text-success-DEFAULT', bg: 'bg-success-soft' },
  consent_grant: { icon: Shield, label: 'Consent Granted', color: 'text-gold-deep', bg: 'bg-gold-whisper' },
  consent_revoke: { icon: Shield, label: 'Consent Revoked', color: 'text-error-DEFAULT', bg: 'bg-error-soft' },
  data_export: { icon: Download, label: 'Data Exported', color: 'text-sapphire-mist', bg: 'bg-sapphire-mist/10' },
  ai_analysis: { icon: Bot, label: 'AI Analysis', color: 'text-charcoal-deep', bg: 'bg-ivory-warm' },
  agent_trigger: { icon: Bot, label: 'Agent Triggered', color: 'text-charcoal-deep', bg: 'bg-ivory-warm' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const TABS = [
  { id: 'activity', label: 'Activity Logs', icon: <Activity className="w-4 h-4" /> },
  { id: 'access', label: 'Access Logs', icon: <Eye className="w-4 h-4" /> },
]

export default function LogsPage() {
  const [search, setSearch] = useState('')

  const activityLogs = MOCK_AUDIT_ENTRIES.filter((e) => !search || e.description.toLowerCase().includes(search.toLowerCase()) || e.actorName.toLowerCase().includes(search.toLowerCase()))
  const accessLogs = MOCK_AUDIT_ENTRIES.filter((e) => (e.action === 'record_view' || e.action === 'data_export') && (!search || e.description.toLowerCase().includes(search.toLowerCase())))

  function LogEntry({ entry }: { entry: typeof MOCK_AUDIT_ENTRIES[number] }) {
    const meta = ACTION_META[entry.action] || { icon: Activity, label: entry.action, color: 'text-greige', bg: 'bg-parchment' }
    const Icon = meta.icon
    return (
      <div className="flex items-start gap-3 py-4 border-b border-sand-light last:border-0">
        <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0', meta.bg)}>
          <Icon className={cn('w-4 h-4', meta.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <p className="text-sm font-body font-medium text-charcoal-deep">{meta.label}</p>
            <Badge variant="default" className="text-[10px]">{entry.actorRole}</Badge>
          </div>
          <p className="text-xs text-stone font-body leading-relaxed">{entry.description}</p>
          <div className="flex items-center gap-2 mt-1">
            <User className="w-3 h-3 text-greige" />
            <span className="text-[11px] text-greige font-body">{entry.actorName}</span>
            <span className="text-greige">·</span>
            <span className="text-[11px] text-greige font-body">{formatDate(entry.timestamp)}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-body text-2xl font-bold text-charcoal-deep">Audit Logs</h1>
        <p className="text-sm text-greige font-body mt-1">Immutable record of all activities on your health data</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Events', value: MOCK_AUDIT_ENTRIES.length, icon: Activity },
          { label: 'Record Views', value: MOCK_AUDIT_ENTRIES.filter((e) => e.action === 'record_view').length, icon: Eye },
          { label: 'Exports', value: MOCK_AUDIT_ENTRIES.filter((e) => e.action === 'data_export').length, icon: Download },
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
        {(activeTab) => (
          <Card>
            <CardHeader>
              <CardTitle className="font-body text-base">
                {activeTab === 'activity' ? 'All Activity' : 'Data Access Events'}
              </CardTitle>
              <CardDescription>
                {activeTab === 'activity'
                  ? `${activityLogs.length} events recorded`
                  : `${accessLogs.length} access events — who viewed your data`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 px-5">
              {(activeTab === 'activity' ? activityLogs : accessLogs).length === 0 ? (
                <div className="py-10 text-center">
                  <Activity className="w-10 h-10 text-greige mx-auto mb-3" />
                  <p className="text-sm text-greige font-body">No logs found</p>
                </div>
              ) : (
                (activeTab === 'activity' ? activityLogs : accessLogs).map((entry) => (
                  <LogEntry key={entry.id} entry={entry} />
                ))
              )}
            </CardContent>
          </Card>
        )}
      </Tabs>
    </div>
  )
}
