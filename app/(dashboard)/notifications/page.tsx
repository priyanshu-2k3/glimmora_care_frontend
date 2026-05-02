'use client'

import { useState, useEffect } from 'react'
import { Bell, AlertTriangle, Info, Shield, RefreshCw, Bot, Users, Check, Trash2, Loader2, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { familyApi, notificationApi, getAccessToken, ApiError, type IncomingInvite, type NotificationOut } from '@/lib/api'

const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  alert:   { icon: AlertTriangle, color: 'text-[#B91C1C]',      bg: 'bg-error-soft' },
  info:    { icon: Info,          color: 'text-stone',               bg: 'bg-ivory-warm' },
  consent: { icon: Shield,        color: 'text-gold-deep',           bg: 'bg-gold-whisper' },
  sync:    { icon: RefreshCw,     color: 'text-success-DEFAULT',     bg: 'bg-success-soft' },
  agent:   { icon: Bot,           color: 'text-charcoal-deep',       bg: 'bg-parchment' },
  family:  { icon: Users,         color: 'text-sapphire-mist',       bg: 'bg-sapphire-mist/10' },
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  return 'Just now'
}

export default function NotificationsPage() {
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const isReal = !!getAccessToken()

  // Real family invites
  const [invites, setInvites]           = useState<IncomingInvite[]>([])
  const [loadingInvites, setLoadingInvites] = useState(false)
  const [respondingId, setRespondingId] = useState<string | null>(null)
  const [inviteMsg, setInviteMsg]       = useState<Record<string, string>>({})

  // Real notifications
  const [notifications, setNotifications] = useState<NotificationOut[]>([])
  const [loadingNotifs, setLoadingNotifs] = useState(false)
  const [actingId, setActingId]           = useState<string | null>(null)

  useEffect(() => {
    if (!isReal) return
    // Family invites — patients only
    if (user?.role === 'patient') {
      setLoadingInvites(true)
      familyApi.listIncomingInvites()
        .then(setInvites)
        .catch(() => {})
        .finally(() => setLoadingInvites(false))
    }
    // Notifications — all roles
    setLoadingNotifs(true)
    notificationApi.list()
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setLoadingNotifs(false))
  }, [isReal, user?.role])

  async function handleRespond(inviteId: string, action: 'accept' | 'decline') {
    setRespondingId(inviteId)
    try {
      await familyApi.respondToInvite(inviteId, action)
      setInvites((prev) => prev.filter((i) => i.id !== inviteId))
      setInviteMsg((prev) => ({ ...prev, [inviteId]: action === 'accept' ? '✓ Joined family!' : 'Invite declined.' }))
      if (action === 'accept') await refreshUser()
    } catch (err) {
      setInviteMsg((prev) => ({ ...prev, [inviteId]: err instanceof ApiError ? err.detail : 'Something went wrong.' }))
    } finally {
      setRespondingId(null)
    }
  }

  async function handleMarkRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n))
    notificationApi.markRead(id).catch(() => {})
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    notificationApi.markAllRead().catch(() => {})
  }

  async function handleDismiss(id: string) {
    setActingId(id)
    try {
      await notificationApi.dismiss(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } finally {
      setActingId(null)
    }
  }

  const unreadCount  = notifications.filter((n) => !n.isRead).length
  const totalUnread  = unreadCount + invites.length
  const isEmpty      = !loadingInvites && !loadingNotifs && invites.length === 0 && notifications.length === 0

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep">Notifications</h1>
          <p className="text-sm text-greige font-body mt-1">
            {totalUnread > 0 ? `${totalUnread} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <Check className="w-3.5 h-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Family invites — real data */}
      {user?.role === 'patient' && (loadingInvites || invites.length > 0) && (
        <Card className="border-gold-soft/40">
          <CardHeader>
            <CardTitle className="font-body text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-gold-deep" />
              Family Invites
              {invites.length > 0 && <Badge variant="gold">{invites.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-sand-light">
            {loadingInvites ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 text-gold-soft animate-spin" />
              </div>
            ) : invites.map((invite) => (
              <div key={invite.id} className="flex items-start gap-4 px-5 py-4 bg-gold-whisper/20">
                <div className="w-9 h-9 rounded-full bg-gold-whisper border border-gold-soft/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Users className="w-4 h-4 text-gold-deep" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-semibold text-charcoal-deep">
                    Join <span className="text-gold-deep">{invite.family_name}</span>
                  </p>
                  <p className="text-xs text-greige font-body mt-0.5">
                    Invited by <span className="font-medium text-stone">{invite.invited_by}</span> · Role: <span className="capitalize">{invite.role}</span>
                  </p>
                  {invite.expires_at && (
                    <p className="text-[11px] text-greige font-body mt-0.5">
                      Expires {new Date(invite.expires_at).toLocaleDateString()}
                    </p>
                  )}
                  {inviteMsg[invite.id] && (
                    <p className="text-xs text-success-DEFAULT font-body mt-1">{inviteMsg[invite.id]}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={() => handleRespond(invite.id, 'accept')} disabled={respondingId === invite.id} isLoading={respondingId === invite.id}>
                      <Check className="w-3.5 h-3.5" /> Accept
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleRespond(invite.id, 'decline')} disabled={respondingId === invite.id}>
                      <X className="w-3.5 h-3.5" /> Decline
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* General notifications — real data */}
      {loadingNotifs ? (
        <Card>
          <CardContent className="p-5 space-y-4">
            {[1,2,3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-sand-light shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-sand-light rounded w-1/3" />
                  <div className="h-2 bg-sand-light rounded w-2/3" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : isEmpty ? (
        <Card className="py-16 text-center">
          <Bell className="w-10 h-10 text-greige mx-auto mb-3" />
          <p className="font-body font-medium text-charcoal-deep">No notifications</p>
          <p className="text-sm text-greige mt-1">You're all caught up!</p>
        </Card>
      ) : notifications.length > 0 && (
        <Card>
          <CardContent className="p-0 divide-y divide-sand-light">
            {notifications.map((notif) => {
              const meta = TYPE_META[notif.type] ?? TYPE_META.info
              const Icon = meta.icon
              return (
                <div
                  key={notif.id}
                  className={cn('flex items-start gap-4 px-5 py-4 transition-colors cursor-pointer hover:bg-ivory-warm', !notif.isRead && 'bg-gold-whisper/30')}
                  onClick={() => {
                    handleMarkRead(notif.id)
                    if (notif.actionHref) router.push(notif.actionHref)
                  }}
                >
                  <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5', meta.bg)}>
                    <Icon className={cn('w-4 h-4', meta.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={cn('text-sm font-body font-semibold', notif.isRead ? 'text-stone' : 'text-charcoal-deep')}>{notif.title}</p>
                      {!notif.isRead && <span className="w-2 h-2 rounded-full bg-gold-deep shrink-0" />}
                    </div>
                    <p className="text-xs text-greige font-body leading-relaxed">{notif.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[11px] text-greige font-body">{timeAgo(notif.timestamp)}</span>
                      {notif.actionLabel && notif.actionHref && (
                        <Link href={notif.actionHref} className="text-[11px] text-gold-deep font-body hover:underline">
                          {notif.actionLabel} →
                        </Link>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDismiss(notif.id) }}
                    disabled={actingId === notif.id}
                    className="p-1 text-greige hover:text-charcoal-deep rounded transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
