'use client'

import { useState, useEffect } from 'react'
import { FileCheck, Search, RotateCcw, XCircle, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import { adminApi, consentApi, type ConsentRequest } from '@/lib/api'

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  approved: 'success',
  pending:  'warning',
  expired:  'warning',
  rejected: 'error',
  revoked:  'error',
}

export function ConsentManager() {
  const [records, setRecords] = useState<ConsentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    adminApi.listConsents({})
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = records.filter((r) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      r.patient_email.toLowerCase().includes(q) ||
      r.requester_email.toLowerCase().includes(q) ||
      r.requester_name.toLowerCase().includes(q)
    )
  })

  async function handleRevoke(id: string) {
    try {
      await consentApi.revoke(id, 'Revoked by admin')
      setRecords((prev) => prev.map((r) => r.id === id ? { ...r, status: 'revoked' as const } : r))
      setActionMsg({ type: 'success', text: 'Consent revoked successfully.' })
    } catch {
      setActionMsg({ type: 'error', text: 'Failed to revoke consent.' })
    }
    setTimeout(() => setActionMsg(null), 2500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 text-gold-soft animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by patient or doctor email…"
        leftIcon={<Search className="w-4 h-4" />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {actionMsg && (
        <div className={`flex items-center gap-2 rounded-xl p-3 border ${
          actionMsg.type === 'success' ? 'bg-success-soft border-success-DEFAULT/20' : 'bg-error-soft border-[#DC2626]/20'
        }`}>
          <p className={`text-xs font-body ${actionMsg.type === 'success' ? 'text-success-DEFAULT' : 'text-[#B91C1C]'}`}>
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
                    <p className="text-sm font-body font-semibold text-charcoal-deep truncate">{r.patient_email}</p>
                    <p className="text-xs text-greige">
                      Doctor: <span className="text-charcoal-warm">{r.requester_email}</span>
                      {r.requester_name ? ` (${r.requester_name})` : ''}
                    </p>
                    <p className="text-xs text-greige mt-0.5">
                      Requested: {formatDate(r.requested_at)}
                      {r.expires_at && <> · Expires: {formatDate(r.expires_at)}</>}
                      {r.scope.length > 0 && <> · {r.scope.join(', ')}</>}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANT[r.status] ?? 'default'} className="capitalize">{r.status}</Badge>
                  {r.status === 'approved' && (
                    <Button variant="danger" size="sm" onClick={() => handleRevoke(r.id)}>
                      <XCircle className="w-3.5 h-3.5" />
                      Revoke
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
