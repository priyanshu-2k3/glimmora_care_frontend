'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, Bell, Search, AlertTriangle, Info, Shield, RefreshCw, Bot, Users, Trash2, X, ChevronRight, ChevronDown, User as UserIcon, Settings as SettingsIcon, LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { NAV_ITEMS, SEARCHABLE_SUBPAGES, FEATURE_INDEX, ROLES } from '@/lib/constants'
import { Avatar } from '@/components/ui/Avatar'
import { notificationApi, getAccessToken, type NotificationOut } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Role } from '@/types/auth'

const TYPE_ICONS: Record<string, React.ElementType> = {
  alert: AlertTriangle,
  info: Info,
  consent: Shield,
  sync: RefreshCw,
  agent: Bot,
  family: Users,
}

const TYPE_COLORS: Record<string, string> = {
  alert: 'text-[#B91C1C]',
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
  const { user, logout } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [notifications, setNotifications] = useState<NotificationOut[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchWrapRef = useRef<HTMLDivElement>(null)

  const currentNav = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  )
  const pageTitle = currentNav?.label || 'Dashboard'
  const unreadCount = notifications.filter((n) => !n.isRead).length

  // Role-aware destinations brought in from main: super-admin lands on the
  // admin profile/settings; patient lands on /profiles; otherwise /settings.
  const isAdminRole = user?.role === 'admin' || user?.role === 'super_admin'
  const profileHref  = isAdminRole ? '/admin/settings/profile' : user?.role === 'patient' ? '/profiles' : '/settings'
  const settingsHref = isAdminRole ? '/admin/settings' : '/settings'

  async function handleLogout() {
    setShowUserMenu(false)
    // logout() in AuthContext does window.location.replace('/login') itself.
    // Calling router.push here as well caused a duplicate navigation that
    // showed the same redirect/toast twice — a known "multiple same issues
    // triggered" symptom on the profile dropdown.
    await logout()
  }

  // Load real notifications and poll every 60s.
  // Reset notifications immediately on user change so a new login never sees
  // the previous user's stale items before the first fetch resolves.
  // Also listen for `notifications:refresh` events fired after special-operation
  // toasts (org create, admin assign, user soft-delete, etc.) so the bell
  // updates immediately without waiting for the next poll tick.
  useEffect(() => {
    setNotifications([])
    if (!getAccessToken()) return
    let alive = true
    const load = () => {
      notificationApi.list(20)
        .then((data) => { if (alive) setNotifications(data) })
        .catch(() => {})
    }
    load()
    const id = setInterval(load, 60000)
    const onRefresh = () => load()
    window.addEventListener('notifications:refresh', onRefresh)
    return () => { alive = false; clearInterval(id); window.removeEventListener('notifications:refresh', onRefresh) }
  }, [user?.id])

  // Filter nav items + feature index by current user's role + search query.
  // Strict role gating: a feature whose `roles` does not include the active
  // user's role must NEVER appear, regardless of text match. Page matches
  // (NAV_ITEMS + SEARCHABLE_SUBPAGES) are listed first, then feature matches.
  type SearchMatch =
    | { kind: 'page'; href: string; label: string }
    | { kind: 'feature'; href: string; feature: string; parentLabel: string }

  const searchTrimmed = searchQuery.trim().toLowerCase()
  const searchMatches: SearchMatch[] = searchTrimmed && user
    ? (() => {
        const role = user.role as Role
        // Step 1 — role filter, Step 2 — text filter, on pages
        const pages = [...NAV_ITEMS, ...SEARCHABLE_SUBPAGES]
          .filter((item) => item.roles.includes(role))
          .filter((item) => item.label.toLowerCase().includes(searchTrimmed) || item.href.toLowerCase().includes(searchTrimmed))

        const pageHrefs = new Set<string>()
        const pageLabelByHref = new Map<string, string>()
        const pageMatches: SearchMatch[] = []
        for (const p of pages) {
          if (pageHrefs.has(p.href)) continue
          pageHrefs.add(p.href)
          pageLabelByHref.set(p.href, p.label)
          pageMatches.push({ kind: 'page', href: p.href, label: p.label })
        }

        // Build a global parent-label lookup so feature chips show a friendly
        // page name, even when that page didn't itself match the query.
        const allParentLabels = new Map<string, string>()
        for (const item of [...NAV_ITEMS, ...SEARCHABLE_SUBPAGES]) {
          if (!allParentLabels.has(item.href)) allParentLabels.set(item.href, item.label)
        }

        // Step 1 — role filter, Step 2 — text filter, on features
        const featureMatches: SearchMatch[] = []
        for (const f of FEATURE_INDEX) {
          if (!f.roles.includes(role)) continue
          if (
            !f.feature.toLowerCase().includes(searchTrimmed) &&
            !f.href.toLowerCase().includes(searchTrimmed)
          ) continue

          // Dedupe: skip if a page row with the same href already appears AND
          // the feature text closely matches the page label (avoid noise).
          if (pageHrefs.has(f.href)) {
            const pageLabel = (pageLabelByHref.get(f.href) ?? '').toLowerCase()
            const featLower = f.feature.toLowerCase()
            if (pageLabel && (featLower === pageLabel || pageLabel.includes(featLower) || featLower.includes(pageLabel))) {
              continue
            }
          }

          featureMatches.push({
            kind: 'feature',
            href: f.href,
            feature: f.feature,
            parentLabel: allParentLabels.get(f.href) ?? f.href,
          })
        }

        return [...pageMatches, ...featureMatches].slice(0, 12)
      })()
    : []

  function goToMatch(href: string) {
    setSearchQuery('')
    setShowSearchDropdown(false)
    searchInputRef.current?.blur()
    router.push(href)
  }

  function submitSearch() {
    if (searchMatches.length > 0) {
      goToMatch(searchMatches[0].href)
      return
    }
    const q = searchQuery.trim()
    setShowSearchDropdown(false)
    if (!q) {
      router.push('/vault/search')
      return
    }
    router.push(`/vault/search?q=${encodeURIComponent(q)}`)
  }

  // Clear search when navigating to a new route (Bug 16)
  useEffect(() => {
    setSearchQuery('')
    setShowSearchDropdown(false)
  }, [pathname])

  // Refresh on dropdown open
  useEffect(() => {
    if (!showNotifications || !getAccessToken()) return
    notificationApi.list(20).then(setNotifications).catch(() => {})
  }, [showNotifications])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n))
    notificationApi.markRead(id).catch(() => {})
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    notificationApi.markAllRead().catch(() => {})
  }

  function dismiss(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    notificationApi.dismiss(id).catch(() => {})
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
        {/* Search bar with page suggestions dropdown */}
        <div ref={searchWrapRef} className="relative hidden md:block">
          <div className="flex items-center gap-2 bg-ivory-warm border border-sand-light rounded-lg px-3 py-1.5 w-52 hover:border-gold-soft/40 transition-colors focus-within:border-gold-soft/60 focus-within:bg-white">
            <Search className="w-3.5 h-3.5 text-greige shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSearchDropdown(true)
              }}
              onFocus={() => setShowSearchDropdown(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  submitSearch()
                } else if (e.key === 'Escape') {
                  setSearchQuery('')
                  setShowSearchDropdown(false)
                  ;(e.target as HTMLInputElement).blur()
                }
              }}
              className="bg-transparent text-xs font-body text-charcoal-deep placeholder:text-greige outline-none w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); searchInputRef.current?.focus() }}
                className="text-greige hover:text-charcoal-deep transition-colors shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {showSearchDropdown && searchTrimmed.length > 0 && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-sand-light overflow-hidden z-50">
              {searchMatches.length === 0 ? (
                <div className="px-4 py-3 text-xs font-body text-greige">
                  No pages match &quot;{searchQuery.trim()}&quot;
                </div>
              ) : (
                <ul className="max-h-72 overflow-y-auto py-1">
                  {searchMatches.map((item, idx) => (
                    <li key={`${item.kind}-${item.href}-${idx}`}>
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); goToMatch(item.href) }}
                        className="w-full text-left px-4 py-2 text-xs font-body text-charcoal-deep hover:bg-parchment/60 transition-colors flex items-center justify-between gap-2"
                      >
                        {item.kind === 'page' ? (
                          <>
                            <span className="font-medium truncate">{item.label}</span>
                            <span className="text-[10px] text-greige truncate">{item.href}</span>
                          </>
                        ) : (
                          <>
                            <span className="flex flex-col min-w-0 flex-1">
                              <span className="font-medium truncate">{item.feature}</span>
                              <span className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] uppercase tracking-wide text-gold-deep bg-champagne/40 px-1.5 py-0.5 rounded">
                                  on {item.parentLabel}
                                </span>
                                <span className="text-[10px] text-greige truncate">{item.href}</span>
                              </span>
                            </span>
                          </>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

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
                      onClick={markAllRead}
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
                    const Icon = TYPE_ICONS[notif.type] ?? Info
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
                          <Icon className={cn('w-3.5 h-3.5', TYPE_COLORS[notif.type] ?? 'text-stone')} />
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

        {/* User pill — click for profile / settings / logout dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setShowUserMenu((s) => !s)}
            aria-haspopup="menu"
            aria-expanded={showUserMenu}
            aria-label="Open account menu"
            title="Account menu — Profile, Settings, Logout"
            className={cn(
              'flex items-center gap-2 bg-ivory-warm border border-sand-light rounded-xl px-2.5 py-1.5 transition-all duration-200',
              showUserMenu
                ? 'border-gold-soft/60 bg-champagne/30'
                : 'hover:border-gold-soft/40 hover:bg-champagne/20',
            )}
          >
            <div className="flex items-center gap-2 pointer-events-none">
              <Avatar name={user.name} size="sm" />
              <div className="hidden sm:block leading-tight text-left">
                <p className="text-xs font-body font-semibold text-charcoal-deep">{user.name.split(' ')[0]}</p>
                <p className="text-[10px] font-body text-greige">{ROLES[user.role as Role]?.label}</p>
              </div>
              <ChevronDown className={cn('w-3.5 h-3.5 text-greige transition-transform', showUserMenu && 'rotate-180')} />
            </div>
          </button>

          {showUserMenu && (
            <div role="menu" className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-sand-light overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-sand-light">
                <p className="text-sm font-body font-semibold text-charcoal-deep truncate">{user.name}</p>
                <p className="text-[11px] font-body text-greige truncate">{user.email}</p>
                <span className="inline-block mt-1.5 text-[10px] font-body font-semibold uppercase tracking-wide text-gold-deep">
                  {ROLES[user.role as Role]?.label}
                </span>
              </div>
              <ul className="py-1">
                <li>
                  <Link
                    href={profileHref}
                    role="menuitem"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm font-body text-charcoal-deep hover:bg-parchment/60 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-greige" />
                    Profile
                  </Link>
                </li>
                <li>
                  <Link
                    href={settingsHref}
                    role="menuitem"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm font-body text-charcoal-deep hover:bg-parchment/60 transition-colors"
                  >
                    <SettingsIcon className="w-4 h-4 text-greige" />
                    Settings
                  </Link>
                </li>
              </ul>
              <div className="border-t border-sand-light py-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm font-body text-coral-muted hover:bg-coral-soft/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
