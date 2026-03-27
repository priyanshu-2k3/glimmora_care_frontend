'use client'

import { useState } from 'react'
import { Bell, AlertTriangle, Info, Shield, RefreshCw, Bot, Users, Check, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { MOCK_NOTIFICATIONS } from '@/data/notifications'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types/profile'

const TYPE_META: Record<Notification['type'], { icon: React.ElementType; color: string; bg: string }> = {
  alert: { icon: AlertTriangle, color: 'text-error-DEFAULT', bg: 'bg-error-soft' },
  info: { icon: Info, color: 'text-stone', bg: 'bg-ivory-warm' },
  consent: { icon: Shield, color: 'text-gold-deep', bg: 'bg-gold-whisper' },
  sync: { icon: RefreshCw, color: 'text-success-DEFAULT', bg: 'bg-success-soft' },
  agent: { icon: Bot, color: 'text-charcoal-deep', bg: 'bg-parchment' },
  family: { icon: Users, color: 'text-sapphire-mist', bg: 'bg-sapphire-mist/10' },
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
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const unreadCount = notifications.filter((n) => !n.isRead).length

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n))
  }

  function dismiss(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep">Notifications</h1>
          <p className="text-sm text-greige font-body mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <Check className="w-3.5 h-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="py-16 text-center">
          <Bell className="w-10 h-10 text-greige mx-auto mb-3" />
          <p className="font-body font-medium text-charcoal-deep">No notifications</p>
          <p className="text-sm text-greige mt-1">You're all caught up!</p>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y divide-sand-light">
            {notifications.map((notif) => {
              const meta = TYPE_META[notif.type]
              const Icon = meta.icon
              return (
                <div
                  key={notif.id}
                  className={cn('flex items-start gap-4 px-5 py-4 transition-colors', !notif.isRead && 'bg-gold-whisper/30')}
                  onClick={() => markRead(notif.id)}
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
                    onClick={(e) => { e.stopPropagation(); dismiss(notif.id) }}
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
