'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Shield, Trash2, Clock, Eye, Activity } from 'lucide-react'
import { consentApi, type ConsentRequest } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/Card'
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
  const [consents, setConsents] = useState<ConsentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [revokeId, setRevokeId] = useState<string | null>(null)
  const [revokeReason, setRevokeReason] = useState('')
  const [revoking, setRevoking] = useState(false)

  useEffect(() => {
    let alive = true
    consentApi.getActive().then((data) => {
      if (alive) { setConsents(data); setLoading(false) }
    }).catch(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  async function handleRevoke(id: string) {
    if (!revokeReason.trim()) return
    setRevoking(true)
    try {
      await consentApi.revoke(id, revokeReason)
      setConsents((prev) => prev.filter((c) => c.id !== id))
      setRevokeId(null)
      setRevokeReason('')
    } finally {
      setRevoking(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-greige font-body">Loading…</div>

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
            const days = consent.expires_at ? daysUntil(consent.expires_at) : null
            const isExpiringSoon = days !== null && days <= 30
            return (
              <Card key={consent.id} className={isExpiringSoon ? 'border-warning-DEFAULT/40' : ''}>
                <CardContent className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <Avatar name={consent.requester_name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-body font-semibold text-charcoal-deep">{consent.requester_name}</p>
                        <Badge variant="success">Active</Badge>
                      </div>
                      <p className="text-xs text-greige">{consent.requester_email} · Granted {formatDate(consent.requested_at)}</p>
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
                  <div className="grid grid-cols-2 gap-3 bg-ivory-warm rounded-xl p-3">
                    <div className="text-center">
                      <p className={`font-display text-lg ${isExpiringSoon ? 'text-warning-DEFAULT' : 'text-charcoal-deep'}`}>
                        {days !== null ? `${days}d` : '∞'}
                      </p>
                      <p className="text-[11px] text-greige font-body flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" /> Expires
                      </p>
                    </div>
                    <div className="text-center border-l border-sand-light">
                      <p className="font-display text-lg text-charcoal-deep">{consent.scope.length}</p>
                      <p className="text-[11px] text-greige font-body flex items-center justify-center gap-1">
                        <Activity className="w-3 h-3" /> Permissions
                      </p>
                    </div>
                  </div>

                  {isExpiringSoon && (
                    <div className="bg-warning-soft border border-warning-DEFAULT/30 rounded-xl p-3">
                      <p className="text-xs text-warning-DEFAULT font-body">
                        ⚠ Expiring in {days} day{days !== 1 ? 's' : ''}. This consent will auto-revoke on {consent.expires_at ? formatDate(consent.expires_at) : 'N/A'}.
                      </p>
                    </div>
                  )}

                  <Button
                    variant="danger"
                    className="w-full"
                    onClick={() => setRevokeId(consent.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Revoke Access
                  </Button>

                  {revokeId === consent.id && (
                    <div className="mt-3 flex gap-2 items-center">
                      <input
                        type="text"
                        value={revokeReason}
                        onChange={(e) => setRevokeReason(e.target.value)}
                        placeholder="Reason for revoking…"
                        className="flex-1 text-xs border border-sand-light rounded-lg px-3 py-2 bg-ivory-warm font-body text-charcoal-deep focus:outline-none focus:border-gold-soft"
                      />
                      <button
                        onClick={() => handleRevoke(consent.id)}
                        disabled={revoking || !revokeReason.trim()}
                        className="text-xs px-3 py-2 rounded-lg bg-error-soft text-[#B91C1C] font-body disabled:opacity-50"
                      >
                        {revoking ? 'Revoking…' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => { setRevokeId(null); setRevokeReason('') }}
                        className="text-xs px-3 py-2 rounded-lg border border-sand-light text-greige font-body"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
