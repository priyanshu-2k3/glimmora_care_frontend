import { Shield, Eye, Upload, Download, Key, Lock, Unlock, LogIn, Bot } from 'lucide-react'
import type { AuditEntry, AuditAction } from '@/types/vault'
import { formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'

const ACTION_META: Record<AuditAction, { label: string; icon: React.ElementType; variant: 'default' | 'gold' | 'success' | 'warning' | 'error' | 'info' | 'dark' }> = {
  record_upload: { label: 'Uploaded', icon: Upload, variant: 'info' },
  record_view: { label: 'Viewed', icon: Eye, variant: 'default' },
  record_edit: { label: 'Edited', icon: Shield, variant: 'warning' },
  consent_grant: { label: 'Consent Granted', icon: Unlock, variant: 'success' },
  consent_revoke: { label: 'Consent Revoked', icon: Lock, variant: 'error' },
  data_export: { label: 'Exported', icon: Download, variant: 'gold' },
  ai_analysis: { label: 'AI Analysis', icon: Bot, variant: 'info' },
  agent_trigger: { label: 'Agent Triggered', icon: Bot, variant: 'warning' },
  login: { label: 'Login', icon: LogIn, variant: 'default' },
  logout: { label: 'Logout', icon: LogIn, variant: 'default' },
}

export function AuditTrailViewer({ entries }: { entries: AuditEntry[] }) {
  return (
    <div className="space-y-0">
      {entries.map((entry, i) => {
        const meta = ACTION_META[entry.action]
        const Icon = meta.icon
        return (
          <div key={entry.id} className="flex gap-3 pb-4 relative">
            {/* Timeline line */}
            {i < entries.length - 1 && (
              <div className="absolute left-4 top-8 bottom-0 w-px bg-sand-light" />
            )}
            <div className="w-8 h-8 rounded-full bg-ivory-warm border border-sand-light flex items-center justify-center shrink-0 z-10">
              <Icon className="w-3.5 h-3.5 text-greige" />
            </div>
            <div className="flex-1 pt-1">
              <div className="flex flex-wrap items-start gap-2">
                <p className="text-sm font-body text-charcoal-deep flex-1">{entry.description}</p>
                <Badge variant={meta.variant}>{meta.label}</Badge>
              </div>
              <p className="text-xs text-greige font-body mt-0.5">
                {entry.actorName} · {entry.actorRole} · {formatDateTime(entry.timestamp)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
