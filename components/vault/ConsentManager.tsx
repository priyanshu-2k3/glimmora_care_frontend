'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import type { ConsentRecord } from '@/types/vault'
import { Badge } from '@/components/ui/Badge'
import { Toggle } from '@/components/ui/Toggle'
import { formatDate } from '@/lib/utils'

interface ConsentManagerProps {
  consents: ConsentRecord[]
}

export function ConsentManager({ consents }: ConsentManagerProps) {
  const [localConsents, setLocalConsents] = useState(consents)

  function toggle(id: string) {
    setLocalConsents((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, isActive: !c.isActive, revokedAt: !c.isActive ? undefined : new Date().toISOString() } : c
      )
    )
  }

  return (
    <div className="space-y-3">
      {localConsents.length === 0 && (
        <p className="text-sm text-greige font-body text-center py-4">No consent records found.</p>
      )}
      {localConsents.map((c) => (
        <div key={c.id} className="flex items-start gap-3 p-4 bg-ivory-warm border border-sand-light rounded-xl">
          {c.isActive
            ? <CheckCircle className="w-4 h-4 text-success-DEFAULT mt-0.5 shrink-0" />
            : <XCircle className="w-4 h-4 text-error-soft mt-0.5 shrink-0" />
          }
          <div className="flex-1 min-w-0">
            <p className="text-sm font-body font-medium text-charcoal-deep">{c.grantedToName}</p>
            <p className="text-xs text-greige capitalize">{c.grantedToRole.replace('_', ' ')} · {c.scope.join(', ')}</p>
            <p className="text-xs text-greige mt-0.5">
              <Clock className="w-2.5 h-2.5 inline mr-0.5" />
              Granted {formatDate(c.grantedAt)}
              {c.revokedAt && ` · Revoked ${formatDate(c.revokedAt)}`}
            </p>
          </div>
          <div className="shrink-0">
            <Toggle checked={c.isActive} onChange={() => toggle(c.id)} size="sm" />
          </div>
        </div>
      ))}
    </div>
  )
}
