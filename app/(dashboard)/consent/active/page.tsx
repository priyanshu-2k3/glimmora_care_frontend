'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Shield, Trash2, Clock, Eye, Activity } from 'lucide-react'
import { MOCK_ACTIVE_CONSENTS, type ExtendedConsentRecord } from '@/data/consent'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'

const SCOPE_LABELS: Record<string, string> = {
  view_records: 'View records',
  view_trends: 'View trends',
  export_summary: 'Export summary',
  add_records: 'Add records',
}

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86400000))
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ActiveConsentsPage() {
  const [consents, setConsents] = useState<ExtendedConsentRecord[]>(MOCK_ACTIVE_CONSENTS)
  const [revoking, setRevoking] = useState<string | null>(null)

  async function handleRevoke(id: string) {
    setRevoking(id)
    await new Promise((r) => setTimeout(r, 800))
    setConsents((prev) => prev.filter((c) => c.id !== id))
    setRevoking(null)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/consent" className="p-1.5 text-greige hover:text-charcoal-deep rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep">Active Consents</h1>
          <p className="text-sm text-greige font-body mt-0.5">{consents.length} healthcare providers have access to your records</p>
        </div>
      </div>

      {consents.length === 0 ? (
        <Card className="py-10 text-center">
          <Shield className="w-10 h-10 text-greige mx-auto mb-3" />
          <p className="font-body font-medium text-charcoal-deep">No active consents</p>
          <p className="text-sm text-greige mt-1">No one currently has access to your records</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {consents.map((consent) => {
            const days = consent.expiresAt ? daysUntil(consent.expiresAt) : null
            const isExpiringSoon = days !== null && days <= 30
            return (
              <Card key={consent.id} className={isExpiringSoon ? 'border-warning-DEFAULT/40' : ''}>
                <CardContent className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <Avatar name={consent.grantedToName} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-body font-semibold text-charcoal-deep">{consent.grantedToName}</p>
                        <Badge variant="success">Active</Badge>
                      </div>
                      <p className="text-xs text-greige capitalize">{consent.grantedToRole} · Granted {formatDate(consent.grantedAt)}</p>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div className="flex flex-wrap gap-2">
                    {consent.scope.map((s) => (
                      <span key={s} className="text-[11px] font-body bg-parchment border border-sand-light rounded-full px-2.5 py-1 text-stone">
                        {SCOPE_LABELS[s] || s}
                      </span>
                    ))}
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3 bg-ivory-warm rounded-xl p-3">
                    <div className="text-center">
                      <p className="font-display text-lg text-charcoal-deep">{consent.usageCount}</p>
                      <p className="text-[11px] text-greige font-body flex items-center justify-center gap-1">
                        <Eye className="w-3 h-3" /> Views
                      </p>
                    </div>
                    <div className="text-center border-x border-sand-light">
                      <p className={`font-display text-lg ${isExpiringSoon ? 'text-warning-DEFAULT' : 'text-charcoal-deep'}`}>
                        {days !== null ? `${days}d` : '∞'}
                      </p>
                      <p className="text-[11px] text-greige font-body flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" /> Expires
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-display text-lg text-charcoal-deep">{consent.recordTypes.length}</p>
                      <p className="text-[11px] text-greige font-body flex items-center justify-center gap-1">
                        <Activity className="w-3 h-3" /> Types
                      </p>
                    </div>
                  </div>

                  {isExpiringSoon && (
                    <div className="bg-warning-soft border border-warning-DEFAULT/30 rounded-xl p-3">
                      <p className="text-xs text-warning-DEFAULT font-body">
                        ⚠ Expiring in {days} day{days !== 1 ? 's' : ''}. This consent will auto-revoke on {consent.expiresAt ? formatDate(consent.expiresAt) : 'N/A'}.
                      </p>
                    </div>
                  )}

                  <Button
                    variant="danger"
                    className="w-full"
                    isLoading={revoking === consent.id}
                    onClick={() => handleRevoke(consent.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Revoke Access
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
