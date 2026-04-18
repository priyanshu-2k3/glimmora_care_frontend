'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, X, Clock, Shield, AlertCircle } from 'lucide-react'
import { consentApi, type ConsentRequest } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

const SCOPE_LABELS: Record<string, string> = {
  view_records: 'View health records',
  view_trends: 'View health trends',
  export_summary: 'Export summary',
  add_records: 'Add records',
}

function timeAgo(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  return 'Just now'
}

export default function ConsentRequestsPage() {
  const [requests, setRequests] = useState<ConsentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    consentApi.getIncoming().then((data) => {
      if (alive) { setRequests(data); setLoading(false) }
    }).catch(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  async function handleApprove(id: string) {
    setActionLoading(id)
    try {
      await consentApi.approve(id)
      setRequests((prev) => prev.filter((r) => r.id !== id))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject(id: string) {
    setActionLoading(id)
    try {
      await consentApi.reject(id)
      setRequests((prev) => prev.filter((r) => r.id !== id))
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) return <div className="p-8 text-center text-greige font-body">Loading…</div>

  const pending = requests.filter((r) => r.status === 'pending')
  const resolved = requests.filter((r) => r.status !== 'pending')

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/consent" className="p-1.5 text-greige hover:text-charcoal-deep rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep">Consent Requests</h1>
          <p className="text-sm text-greige font-body mt-0.5">{pending.length} pending · {resolved.length} resolved</p>
        </div>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-body font-semibold text-greige uppercase tracking-widest px-1">Awaiting your decision</p>
          {pending.map((req) => (
            <Card key={req.id} className={cn('overflow-hidden', expanded === req.id && 'border-gold-soft')}>
              <CardContent
                className="p-4 cursor-pointer"
                onClick={() => setExpanded(expanded === req.id ? null : req.id)}
              >
                <div className="flex items-start gap-3">
                  <Avatar name={req.requester_name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-body font-semibold text-charcoal-deep">{req.requester_name}</p>
                      <Badge variant="warning"><Clock className="w-3 h-3" /> Pending</Badge>
                    </div>
                    <p className="text-xs text-greige truncate">{req.requester_email} · {timeAgo(req.requested_at)}</p>
                  </div>
                </div>

                {expanded === req.id && (
                  <div className="mt-4 space-y-3 pt-4 border-t border-sand-light">
                    {req.message && (
                      <div className="bg-parchment rounded-xl p-3">
                        <p className="text-xs font-body font-semibold text-charcoal-deep mb-1">Message from requester:</p>
                        <p className="text-xs text-stone font-body italic">"{req.message}"</p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-body font-semibold text-charcoal-deep mb-2 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-gold-soft" />
                        Requesting access to:
                      </p>
                      <div className="space-y-1.5">
                        {req.scope.map((s) => (
                          <div key={s} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-gold-soft shrink-0" />
                            <span className="text-xs text-stone font-body">{SCOPE_LABELS[s] || s}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-ivory-warm border border-sand-light rounded-xl p-3">
                      <p className="text-[11px] text-greige font-body flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-gold-soft shrink-0 mt-0.5" />
                        Approving grants access until{req.expires_at ? ` ${new Date(req.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ' further notice'}. You can revoke at any time from Active Consents.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={(e) => { e.stopPropagation(); handleApprove(req.id) }}
                        disabled={actionLoading === req.id}
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => { e.stopPropagation(); handleReject(req.id) }}
                        disabled={actionLoading === req.id}
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pending.length === 0 && (
        <Card className="py-10 text-center">
          <Check className="w-10 h-10 text-success-DEFAULT mx-auto mb-3" />
          <p className="font-body font-medium text-charcoal-deep">All caught up!</p>
          <p className="text-sm text-greige mt-1">No pending consent requests</p>
        </Card>
      )}

      {/* Resolved */}
      {resolved.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-body font-semibold text-greige uppercase tracking-widest px-1">Resolved</p>
          {resolved.map((req) => (
            <Card key={req.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <Avatar name={req.requester_name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-semibold text-charcoal-deep truncate">{req.requester_name}</p>
                  <p className="text-xs text-greige">{req.requester_email} · {timeAgo(req.requested_at)}</p>
                </div>
                <Badge variant={req.status === 'approved' ? 'success' : 'error'}>
                  {req.status === 'approved' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  {req.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
