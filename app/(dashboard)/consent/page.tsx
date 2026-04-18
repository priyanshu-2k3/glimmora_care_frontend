'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Shield, Clock, History, AlertCircle, Check, Users, ArrowRight } from 'lucide-react'
import { consentApi, type ConsentRequest } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'

export default function ConsentDashboardPage() {
  const [pending, setPending] = useState<ConsentRequest[]>([])
  const [active, setActive] = useState<ConsentRequest[]>([])
  const [history, setHistory] = useState<ConsentRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const [p, a, h] = await Promise.all([
          consentApi.getIncoming(),
          consentApi.getActive(),
          consentApi.getHistory(),
        ])
        if (alive) { setPending(p); setActive(a); setHistory(h) }
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [])

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-body text-2xl font-bold text-charcoal-deep">Consent Management</h1>
        <p className="text-sm text-greige font-body mt-1">Control who can access your health records and for how long</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending Requests', value: loading ? '…' : pending.length, icon: Clock, href: '/consent/requests', color: 'text-warning-DEFAULT', bg: 'bg-warning-soft' },
          { label: 'Active Consents', value: loading ? '…' : active.length, icon: Shield, href: '/consent/active', color: 'text-success-DEFAULT', bg: 'bg-success-soft' },
          { label: 'Past Consents', value: loading ? '…' : history.length, icon: History, href: '/consent/history', color: 'text-stone', bg: 'bg-parchment' },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="p-4 text-center hover:border-gold-soft transition-all">
              <div className={`w-9 h-9 rounded-full ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
                <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
              </div>
              <p className="font-display text-2xl text-charcoal-deep">{stat.value}</p>
              <p className="text-[11px] text-greige font-body mt-0.5">{stat.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pending requests alert */}
      {!loading && pending.length > 0 && (
        <div className="bg-warning-soft border border-warning-DEFAULT/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning-DEFAULT shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-body font-semibold text-charcoal-deep mb-0.5">
              {pending.length} pending consent request{pending.length > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-stone font-body">Healthcare providers are waiting for your approval to access specific records.</p>
          </div>
          <Link href="/consent/requests">
            <Button size="sm">
              Review
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Recent pending requests preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-body text-base">Pending Requests</CardTitle>
            <Link href="/consent/requests" className="text-xs text-gold-deep hover:underline font-body">View all →</Link>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-sand-light">
          {pending.length === 0 ? (
            <div className="py-8 text-center">
              <Check className="w-8 h-8 text-success-DEFAULT mx-auto mb-2" />
              <p className="text-sm text-greige font-body">No pending requests</p>
            </div>
          ) : (
            pending.slice(0, 3).map((req) => (
              <div key={req.id} className="flex items-center gap-3 py-3">
                <Avatar name={req.requester_name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-semibold text-charcoal-deep truncate">{req.requester_name}</p>
                  <p className="text-xs text-greige truncate">{req.requester_email} · {req.scope.length} permissions</p>
                </div>
                <Badge variant="warning">Pending</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Active consents preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-body text-base">Active Consents</CardTitle>
            <Link href="/consent/active" className="text-xs text-gold-deep hover:underline font-body">View all →</Link>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-sand-light">
          {active.slice(0, 3).map((consent) => (
            <div key={consent.id} className="flex items-center gap-3 py-3">
              <div className="w-9 h-9 rounded-full bg-success-soft flex items-center justify-center">
                <Users className="w-4 h-4 text-success-DEFAULT" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body font-semibold text-charcoal-deep truncate">{consent.requester_name}</p>
                <p className="text-xs text-greige truncate">{consent.scope.length} permissions</p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick nav */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Consent Requests', href: '/consent/requests', icon: Clock },
          { label: 'Active Consents', href: '/consent/active', icon: Shield },
          { label: 'Consent History', href: '/consent/history', icon: History },
          { label: 'Access Logs', href: '/logs', icon: AlertCircle },
        ].map((item) => (
          <Link key={item.label} href={item.href}>
            <Card className="p-4 flex items-center gap-3 hover:border-gold-soft transition-all">
              <item.icon className="w-4 h-4 text-gold-soft shrink-0" />
              <span className="text-sm font-body font-medium text-charcoal-deep">{item.label}</span>
              <ArrowRight className="w-4 h-4 text-greige ml-auto" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
