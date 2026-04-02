'use client'

import { useState } from 'react'
import { FileCheck, Search, RotateCcw, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import { MOCK_CONSENT_RECORDS, type ConsentRecord } from '@/data/admin-mock'

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error'> = {
  active: 'success',
  expired: 'warning',
  revoked: 'error',
}

const TYPE_LABELS: Record<string, string> = {
  view: 'View Only',
  edit: 'Edit',
  full: 'Full Access',
}

export function ConsentManager() {
  const [records, setRecords] = useState<ConsentRecord[]>(MOCK_CONSENT_RECORDS)
  const [search, setSearch] = useState('')
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const filtered = records.filter((r) =>
    !search ||
    r.patientName.toLowerCase().includes(search.toLowerCase()) ||
    r.doctorName.toLowerCase().includes(search.toLowerCase())
  )

  function handleRevoke(id: string) {
    setRecords((prev) => prev.map((r) => r.id === id ? { ...r, status: 'revoked' as const } : r))
    setActionMsg({ type: 'success', text: 'Consent revoked successfully.' })
    setTimeout(() => setActionMsg(null), 2000)
  }

  function handleReactivate(id: string) {
    setRecords((prev) => prev.map((r) => r.id === id ? { ...r, status: 'active' as const } : r))
    setActionMsg({ type: 'success', text: 'Consent reactivated.' })
    setTimeout(() => setActionMsg(null), 2000)
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by patient or doctor..."
        leftIcon={<Search className="w-4 h-4" />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {actionMsg && (
        <div className={`flex items-center gap-2 rounded-xl p-3 border ${
          actionMsg.type === 'success' ? 'bg-success-soft border-success-DEFAULT/20' : 'bg-error-soft border-error-DEFAULT/20'
        }`}>
          <p className={`text-xs font-body ${actionMsg.type === 'success' ? 'text-success-DEFAULT' : 'text-error-DEFAULT'}`}>
            {actionMsg.text}
          </p>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={FileCheck} title="No consent records found" description="Try a different search term." />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id} hover>
              <CardContent>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-semibold text-charcoal-deep">{r.patientName}</p>
                    <p className="text-xs text-greige">
                      Doctor: <span className="text-charcoal-warm">{r.doctorName}</span> · {TYPE_LABELS[r.type]}
                    </p>
                    <p className="text-xs text-greige mt-0.5">
                      Granted: {formatDate(r.grantedAt)}
                      {r.expiresAt && <> · Expires: {formatDate(r.expiresAt)}</>}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANT[r.status]} className="capitalize">{r.status}</Badge>
                  {r.status === 'active' && (
                    <Button variant="danger" size="sm" onClick={() => handleRevoke(r.id)}>
                      <XCircle className="w-3.5 h-3.5" />
                      Revoke
                    </Button>
                  )}
                  {(r.status === 'revoked' || r.status === 'expired') && (
                    <Button variant="outline" size="sm" onClick={() => handleReactivate(r.id)}>
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reactivate
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
