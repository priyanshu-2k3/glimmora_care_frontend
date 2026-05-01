'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Upload, Shield, Brain, Bot, MessageSquare,
  Activity, Globe, WifiOff, Settings, LogOut, ChevronDown, ChevronRight,
  Users, AlertTriangle, Bell, User, Heart, Baby,
  UserCheck, FileCheck, Lock, ClipboardList, Sparkles,
  UserPlus, RefreshCw, Share2, Smartphone, Building2, Stethoscope, TrendingUp,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useProfile } from '@/context/ProfileContext'
import { NAV_ITEMS, ROLES } from '@/lib/constants'
import { ADMIN_SIDEBAR_SECTIONS, type SidebarItem } from '@/config/sidebar-config'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import type { Role } from '@/types/auth'
import type { ProfileRelation } from '@/types/profile'

const ICONS: Record<string, React.ElementType> = {
  LayoutDashboard, Upload, Shield, Brain, Bot,
  MessageSquare, Activity, Globe, WifiOff, Settings,
  Users, AlertTriangle, Bell, User, UserCheck, FileCheck, Lock, ClipboardList,
  UserPlus, RefreshCw, Share2, Smartphone, Building2, Stethoscope, TrendingUp,
}

const RELATION_ICONS: Record<ProfileRelation, React.ElementType> = {
  self: User,
  spouse: Heart,
  child: Baby,
  parent: Users,
  sibling: Users,
}

/* Sections for non-admin roles */
const DEFAULT_NAV_SECTIONS = [
  { label: null, hrefs: ['/dashboard'] },
  { label: 'HEALTH', hrefs: ['/vault', '/intake', '/twin'] },
  { label: 'FAMILY & ACCOUNT', hrefs: ['/family', '/profiles', '/my-doctor', '/assign-doctor'] },
  { label: 'ACCESS & CONSENT', hrefs: ['/consent', '/emergency', '/access'] },
  { label: 'ORGANISATION', hrefs: ['/organization'] },
  { label: 'MANAGEMENT', hrefs: ['/admin/users', '/admin/doctors', '/admin/patients', '/manage-users'] },
  { label: 'TOOLS', hrefs: ['/assistants', '/intelligence'] },
  { label: 'SYSTEM', hrefs: ['/logs', '/notifications', '/settings'] },
]

/* ── Admin nested nav item renderer ────────────────────────────────────────── */
function AdminNavItem({ item, pathname, onClose, depth = 0 }: { item: SidebarItem; pathname: string; onClose?: () => void; depth?: number }) {
  const [expanded, setExpanded] = useState(
    item.children ? item.children.some((c) => pathname === c.href || pathname.startsWith(c.href + '/')) : false
  )
  const Icon = ICONS[item.icon]
  const isActive = pathname === item.href || (item.children && pathname.startsWith(item.href + '/'))
  const hasChildren = item.children && item.children.length > 0

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'w-full flex items-center gap-3 py-2 rounded-lg text-sm font-body font-medium transition-all duration-200 group',
            isActive ? 'bg-gold-whisper border-l-2 border-gold-deep text-charcoal-deep pl-2 pr-3' : 'text-stone hover:text-charcoal-deep hover:bg-parchment/70 px-3'
          )}
        >
          {Icon && <Icon className={cn('w-4 h-4 shrink-0 transition-colors', isActive ? 'text-gold-deep' : 'text-greige group-hover:text-stone')} />}
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronRight className={cn('w-3.5 h-3.5 text-greige transition-transform duration-200', expanded && 'rotate-90')} />
        </button>
        {expanded && (
          <div className="ml-4 mt-0.5 space-y-0.5 border-l border-sand-light/50 pl-2">
            {item.children!.map((child) => (
              <AdminNavItem key={child.href} item={child} pathname={pathname} onClose={onClose} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        'flex items-center gap-3 py-2 rounded-lg text-sm font-body font-medium transition-all duration-200 group',
        pathname === item.href
          ? 'bg-gold-whisper border-l-2 border-gold-deep text-charcoal-deep pl-2 pr-3'
          : 'text-stone hover:text-charcoal-deep hover:bg-parchment/70 px-3'
      )}
    >
      {Icon && (
        <Icon className={cn('w-4 h-4 shrink-0 transition-colors', pathname === item.href ? 'text-gold-deep' : 'text-greige group-hover:text-stone')} />
      )}
      <span className="flex-1">{item.label}</span>
    </Link>
  )
}

/* ── Main Sidebar ──────────────────────────────────────────────────────────── */
export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { profiles, activeProfile, switchProfile, canSwitchProfile } = useProfile()
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false)

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  if (!user) return null

  const isAdmin = user.role === 'admin'

  /* For admin role, use the dedicated sidebar config with nested menus */
  if (isAdmin) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-b from-ivory-cream to-white border-r border-sand-light">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-sand-light">
          <Link href="/admin" onClick={onClose} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-charcoal-deep to-stone ring-1 ring-gold-soft/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-gold-soft" />
            </div>
            <div>
              <h1 className="font-display text-xl text-charcoal-deep tracking-tight leading-none">
                Glimmora<span className="text-gold-deep italic">Care</span>
              </h1>
              <p className="text-[9px] text-gold-deep/60 font-body uppercase tracking-widest mt-0.5">
                Super Admin Console
              </p>
            </div>
          </Link>
        </div>

        {/* Admin nested navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {ADMIN_SIDEBAR_SECTIONS.map((section) => (
            <div key={section.label ?? 'main'} className="mb-5">
              {section.label && (
                <p className="text-[10px] font-body font-semibold text-gold-deep/50 uppercase tracking-widest px-3 mb-1.5">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <AdminNavItem key={item.href} item={item} pathname={pathname} onClose={onClose} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User profile */}
        <div className="p-3 border-t border-sand-light">
          <div className="bg-ivory-warm/60 rounded-xl mx-1 mb-1 mt-1">
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-parchment/70 transition-colors cursor-default">
              <Avatar name={user.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-body font-semibold text-charcoal-deep truncate">{user.name}</p>
                <p className="text-[10px] font-body text-greige capitalize">{ROLES[user.role as Role]?.label}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-greige hover:text-[#B91C1C] hover:bg-error-soft/10 rounded-md transition-all duration-200"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── Default sidebar for all other roles ─── */
  const navItems = NAV_ITEMS
    .filter((item) => item.roles.includes(user.role as Role))
    .map((item) => {
      // Doctor: rename Health Vault → Patient Vault
      if (item.href === '/vault' && user.role === 'doctor') {
        return { ...item, label: 'Patient Vault' }
      }
      return item
    })

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-ivory-cream to-white border-r border-sand-light">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-sand-light">
        <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-charcoal-deep to-stone ring-1 ring-gold-soft/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-gold-soft" />
          </div>
          <div>
            <h1 className="font-display text-xl text-charcoal-deep tracking-tight leading-none">
              Glimmora<span className="text-gold-deep italic">Care</span>
            </h1>
            <p className="text-[9px] text-gold-deep/60 font-body uppercase tracking-widest mt-0.5">
              Preventive Intelligence
            </p>
          </div>
        </Link>
      </div>

      {/* Profile switcher */}
      {profiles.length > 0 && canSwitchProfile && (
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={() => setShowProfileSwitcher(!showProfileSwitcher)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-ivory-warm hover:bg-sand-light/60 transition-all duration-200 border border-sand-light"
          >
            <div className="w-6 h-6 rounded-full bg-gold-soft/20 flex items-center justify-center shrink-0">
              {activeProfile && (() => {
                const Icon = RELATION_ICONS[activeProfile.relation]
                return <Icon className="w-3 h-3 text-gold-deep" />
              })()}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs font-body font-medium text-charcoal-deep truncate">{activeProfile?.name || 'Select profile'}</p>
              <p className="text-[10px] text-greige capitalize truncate">{activeProfile?.relation}</p>
            </div>
            <ChevronDown className={cn('w-3.5 h-3.5 text-greige transition-transform duration-200', showProfileSwitcher && 'rotate-180')} />
          </button>

          {showProfileSwitcher && (
            <div className="mt-1 rounded-lg bg-white overflow-hidden border border-sand-light shadow-md">
              {profiles.map((profile) => {
                const Icon = RELATION_ICONS[profile.relation]
                const isActive = activeProfile?.id === profile.id
                return (
                  <button
                    key={profile.id}
                    onClick={() => { switchProfile(profile.id); setShowProfileSwitcher(false) }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 transition-colors text-left',
                      isActive ? 'bg-gold-soft/8 text-charcoal-deep' : 'text-stone hover:bg-parchment hover:text-charcoal-deep'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0 text-greige" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-body font-medium truncate">{profile.name}</p>
                      <p className="text-[10px] capitalize text-greige">{profile.relation}</p>
                    </div>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-gold-deep shrink-0" />}
                  </button>
                )
              })}
              <Link
                href="/family"
                onClick={() => { setShowProfileSwitcher(false); onClose?.() }}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-gold-deep hover:text-gold-muted border-t border-sand-light transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                Manage family & profiles
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {DEFAULT_NAV_SECTIONS.map((section) => {
          const sectionItems = navItems.filter((item) =>
            section.hrefs.includes(item.href)
          )
          if (sectionItems.length === 0) return null
          return (
            <div key={section.label ?? 'main'} className="mb-5">
              {section.label && (
                <p className="text-[10px] font-body font-semibold text-gold-deep/50 uppercase tracking-widest px-3 mb-1.5">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {sectionItems.map((item) => {
                  const Icon = ICONS[item.icon]
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 py-2 rounded-lg text-sm font-body font-medium transition-all duration-200 group',
                        isActive
                          ? 'bg-gold-whisper border-l-2 border-gold-deep text-charcoal-deep pl-2 pr-3'
                          : 'text-stone hover:text-charcoal-deep hover:bg-parchment/70 px-3'
                      )}
                    >
                      {Icon && (
                        <Icon className={cn('w-4 h-4 shrink-0 transition-colors', isActive ? 'text-gold-deep' : 'text-greige group-hover:text-stone')} />
                      )}
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* User profile */}
      <div className="p-3 border-t border-sand-light">
        <div className="bg-ivory-warm/60 rounded-xl mx-1 mb-1 mt-1">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-parchment/70 transition-colors cursor-default">
            <Avatar name={user.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-body font-semibold text-charcoal-deep truncate">{user.name}</p>
              <p className="text-[10px] font-body text-greige capitalize">{ROLES[user.role as Role]?.label}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-greige hover:text-[#B91C1C] hover:bg-error-soft/10 rounded-md transition-all duration-200"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
