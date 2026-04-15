'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, Bell, Search, AlertTriangle, Info, Shield, RefreshCw, Bot, Users, Trash2, X, Sun, Moon, ChevronRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { NAV_ITEMS, ROLES } from '@/lib/constants'
import { Avatar } from '@/components/ui/Avatar'
import { MOCK_NOTIFICATIONS } from '@/data/notifications'
import { cn } from '@/lib/utils'
import type { Role } from '@/types/auth'
import type { Notification } from '@/types/profile'

const TYPE_ICONS: Record<Notification['type'], React.ElementType> = {
  alert: AlertTriangle,
  info: Info,
  consent: Shield,
  sync: RefreshCw,
  agent: Bot,
  family: Users,
}

const TYPE_COLORS: Record<Notification['type'], string> = {
  alert: 'text-error-DEFAULT',
  info: 'text-stone',
  consent: 'text-gold-deep',
  sync: 'text-success-DEFAULT',
  agent: 'text-charcoal-deep',
  family: 'text-sapphire-mist',
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  return 'Just now'
}

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const [darkMode, setDarkMode] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const currentNav = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  )
  const pageTitle = currentNav?.label || 'Dashboard'
  const unreadCount = notifications.filter((n) => !n.isRead).length

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n))
  }

  function dismiss(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  if (!user) return null

  return (
    <header className="h-14 bg-white/95 backdrop-blur-sm border-b border-sand-light/60 shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex items-center px-5 gap-4 sticky top-0 z-10">
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 text-greige hover:text-charcoal-deep transition-colors rounded-md"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-body text-greige hidden md:block">GlimmoraCare</span>
          <ChevronRight className="w-3.5 h-3.5 text-greige/50 hidden md:block" />
          <h2 className="text-sm font-body font-semibold text-charcoal-deep leading-none truncate">{pageTitle}</h2>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {/* Search bar */}
        <div className="hidden md:flex items-center gap-2 bg-ivory-warm border border-sand-light rounded-lg px-3 py-1.5 w-52 hover:border-gold-soft/40 transition-colors focus-within:border-gold-soft/60 focus-within:bg-white">
          <Search className="w-3.5 h-3.5 text-greige shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-xs font-body text-charcoal-deep placeholder:text-greige outline-none w-full"
          />
          <kbd className="hidden lg:block text-[10px] text-greige bg-sand-light px-1 py-0.5 rounded font-body shrink-0">⌘K</kbd>
        </div>

        {/* Light/Dark toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg text-greige hover:text-charcoal-deep hover:bg-parchment/60 transition-all duration-200"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notification bell */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              'relative p-2 rounded-lg transition-all duration-200',
              showNotifications ? 'bg-parchment text-charcoal-deep' : 'text-greige hover:text-charcoal-deep hover:bg-parchment/60'
            )}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[14px] h-3.5 bg-gold-deep text-ivory-cream text-[8px] font-bold font-body rounded-full flex items-center justify-center px-0.5">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification panel */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-sand-light overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-sand-light">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-body font-semibold text-charcoal-deep">Notifications</p>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-body font-semibold text-ivory-cream bg-gold-deep px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => setNotifications((p) => p.map((n) => ({ ...n, isRead: true })))}
                      className="text-[11px] text-gold-deep hover:text-gold-muted font-body px-2 py-1 rounded hover:bg-parchment transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowNotifications(false)} className="p-1 text-greige hover:text-charcoal-deep rounded-md hover:bg-parchment transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-sand-light">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell className="w-8 h-8 text-greige mx-auto mb-2" />
                    <p className="text-sm text-greige font-body">All caught up!</p>
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notif) => {
                    const Icon = TYPE_ICONS[notif.type]
                    return (
                      <div
                        key={notif.id}
                        className={cn(
                          'flex items-start gap-3 px-4 py-3 hover:bg-ivory-warm cursor-pointer transition-colors',
                          !notif.isRead && 'bg-parchment/40'
                        )}
                        onClick={() => { markRead(notif.id); if (notif.actionHref) { setShowNotifications(false); router.push(notif.actionHref) } }}
                      >
                        <div className="w-7 h-7 rounded-lg bg-parchment flex items-center justify-center shrink-0 mt-0.5">
                          <Icon className={cn('w-3.5 h-3.5', TYPE_COLORS[notif.type])} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className={cn('text-xs font-body font-semibold truncate', notif.isRead ? 'text-stone' : 'text-charcoal-deep')}>{notif.title}</p>
                            {!notif.isRead && <span className="w-1.5 h-1.5 rounded-full bg-gold-deep shrink-0" />}
                          </div>
                          <p className="text-[11px] text-greige font-body line-clamp-2 leading-relaxed">{notif.message}</p>
                          <p className="text-[10px] text-greige mt-0.5">{timeAgo(notif.timestamp)}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); dismiss(notif.id) }}
                          className="p-1 text-greige hover:text-charcoal-deep rounded transition-colors shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="border-t border-sand-light px-4 py-2.5">
                <Link
                  href="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-gold-deep hover:text-gold-muted font-body transition-colors"
                >
                  View all notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-sand-light mx-1" />

        {/* User */}
        <div className="bg-ivory-warm border border-sand-light rounded-xl px-2.5 py-1.5 hover:border-gold-soft/40 hover:bg-champagne/20 transition-all duration-200 cursor-default">
          <div className="flex items-center gap-2">
            <Avatar name={user.name} size="sm" />
            <div className="hidden sm:block leading-tight">
              <p className="text-xs font-body font-semibold text-charcoal-deep">{user.name.split(' ')[0]}</p>
              <p className="text-[10px] font-body text-greige">{ROLES[user.role as Role]?.label}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
