'use client'

import Link from 'next/link'
import { ArrowLeft, Clock, X, CheckCircle, Filter } from 'lucide-react'
import { useState } from 'react'
import { MOCK_CONSENT_HISTORY, type ConsentHistoryEntry } from '@/data/consent'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

type FilterType = 'all' | 'expired' | 'revoked' | 'completed'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const OUTCOME_META: Record<ConsentHistoryEntry['outcome'], { label: string; icon: React.ElementType; variant: 'error' | 'default' | 'success' }> = {
  revoked: { label: 'Revoked', icon: X, variant: 'error' },
  expired: { label: 'Expired', icon: Clock, variant: 'default' },
  completed: { label: 'Completed', icon: CheckCircle, variant: 'success' },
}

const SCOPE_LABELS: Record<string, string> = {
  view_records: 'View records',
  view_trends: 'View trends',
  export_summary: 'Export summary',
  add_records: 'Add records',
}

export default function ConsentHistoryPage() {
  const [filter, setFilter] = useState<FilterType>('all')

  const filtered = filter === 'all' ? MOCK_CONSENT_HISTORY : MOCK_CONSENT_HISTORY.filter((h) => h.outcome === filter)

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/consent" className="p-1.5 text-greige hover:text-charcoal-deep rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep">Consent History</h1>
          <p className="text-sm text-greige font-body mt-0.5">Past and expired access records</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-greige" />
        {(['all', 'expired', 'revoked', 'completed'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-body font-medium transition-all capitalize',
              filter === f ? 'bg-charcoal-deep text-ivory-cream' : 'bg-parchment text-greige hover:text-charcoal-deep'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Expired', count: MOCK_CONSENT_HISTORY.filter((h) => h.outcome === 'expired').length, variant: 'default' as const },
          { label: 'Revoked', count: MOCK_CONSENT_HISTORY.filter((h) => h.outcome === 'revoked').length, variant: 'error' as const },
          { label: 'Completed', count: MOCK_CONSENT_HISTORY.filter((h) => h.outcome === 'completed').length, variant: 'success' as const },
        ].map((s) => (
          <Card key={s.label} className="p-4 text-center">
            <p className="font-display text-2xl text-charcoal-deep">{s.count}</p>
            <Badge variant={s.variant} className="mt-1">{s.label}</Badge>
          </Card>
        ))}
      </div>

      {/* History list */}
      {filtered.length === 0 ? (
        <Card className="py-10 text-center">
          <Clock className="w-10 h-10 text-greige mx-auto mb-3" />
          <p className="text-sm text-greige font-body">No history for this filter</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => {
            const meta = OUTCOME_META[entry.outcome]
            const Icon = meta.icon
            return (
              <Card key={entry.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar name={entry.grantedToName} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-body font-semibold text-charcoal-deep">{entry.grantedToName}</p>
                        <Badge variant={meta.variant}>
                          <Icon className="w-3 h-3" />
                          {meta.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-greige capitalize">{entry.grantedToRole}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-x-4 gap-y-1 bg-parchment rounded-xl p-3">
                    <div>
                      <p className="text-[10px] text-greige uppercase tracking-wide">Granted</p>
                      <p className="text-xs font-body font-medium text-charcoal-deep">{formatDate(entry.grantedAt)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-greige uppercase tracking-wide">
                        {entry.revokedAt ? 'Revoked' : 'Expired'}
                      </p>
                      <p className="text-xs font-body font-medium text-charcoal-deep">
                        {entry.revokedAt ? formatDate(entry.revokedAt) : entry.expiresAt ? formatDate(entry.expiresAt) : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-greige uppercase tracking-wide">Usage</p>
                      <p className="text-xs font-body font-medium text-charcoal-deep">{entry.usageCount} views</p>
                    </div>
                  </div>

                  {entry.revokedReason && (
                    <p className="text-xs text-greige font-body bg-error-soft/30 rounded-lg px-3 py-2">
                      Reason: {entry.revokedReason}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {entry.scope.map((s) => (
                      <span key={s} className="text-[11px] font-body bg-ivory-warm border border-sand-light rounded-full px-2.5 py-1 text-stone">
                        {SCOPE_LABELS[s] || s}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
