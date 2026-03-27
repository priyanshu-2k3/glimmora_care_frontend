'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Upload, Shield, Brain, Bot, MessageSquare,
  Activity, Globe, WifiOff, Settings, LogOut, ChevronDown,
  Users, AlertTriangle, Bell, User, Heart, Baby,
  UserCheck, FileCheck, Lock, ClipboardList, Sparkles,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useProfile } from '@/context/ProfileContext'
import { NAV_ITEMS, ROLES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import type { Role } from '@/types/auth'
import type { ProfileRelation } from '@/types/profile'

const ICONS: Record<string, React.ElementType> = {
  LayoutDashboard, Upload, Shield, Brain, Bot,
  MessageSquare, Activity, Globe, WifiOff, Settings,
  Users, AlertTriangle, Bell, User, UserCheck, FileCheck, Lock, ClipboardList,
}

const RELATION_ICONS: Record<ProfileRelation, React.ElementType> = {
  self: User,
  spouse: Heart,
  child: Baby,
  parent: Users,
  sibling: Users,
}

const NAV_SECTIONS = [
  { label: null, hrefs: ['/dashboard'] },
  { label: 'HEALTH', hrefs: ['/intake', '/vault', '/twin', '/profiles'] },
  { label: 'FAMILY & CONSENT', hrefs: ['/family', '/family/members', '/emergency', '/consent', '/access', '/logs'] },
  { label: 'INTELLIGENCE', hrefs: ['/intelligence', '/assistants', '/agents'] },
  { label: 'COMMUNITY', hrefs: ['/population', '/offline'] },
  { label: 'SYSTEM', hrefs: ['/notifications', '/settings'] },
]

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { profiles, activeProfile, switchProfile, canSwitchProfile } = useProfile()
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false)

  if (!user) return null

  const navItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(user.role as Role)
  )

  return (
    <div className="flex flex-col h-full bg-white border-r border-sand-light">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-sand-light">
        <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-charcoal-deep flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-gold-soft" />
          </div>
          <div>
            <h1 className="font-display text-lg text-charcoal-deep tracking-tight leading-none">
              Glimmora<span className="text-gold-deep italic">Care</span>
            </h1>
            <p className="text-[9px] text-greige font-body uppercase tracking-widest mt-0.5">
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
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-parchment hover:bg-sand-light/60 transition-all duration-200 border border-sand-light"
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
                href="/profiles"
                onClick={() => { setShowProfileSwitcher(false); onClose?.() }}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-gold-deep hover:text-gold-muted border-t border-sand-light transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                Manage profiles
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {NAV_SECTIONS.map((section) => {
          const sectionItems = navItems.filter((item) =>
            section.hrefs.includes(item.href)
          )
          if (sectionItems.length === 0) return null
          return (
            <div key={section.label ?? 'main'} className="mb-5">
              {section.label && (
                <p className="text-[10px] font-body font-semibold text-greige/70 uppercase tracking-widest px-3 mb-1.5">
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
                        'relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-body font-medium transition-all duration-200 group',
                        isActive
                          ? 'bg-charcoal-deep/5 text-charcoal-deep'
                          : 'text-stone hover:text-charcoal-deep hover:bg-parchment/70'
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-gold-deep" />
                      )}
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
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-parchment/70 transition-colors cursor-default">
          <Avatar name={user.name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-body font-semibold text-charcoal-deep truncate">{user.name}</p>
            <p className="text-[10px] font-body text-greige capitalize">{ROLES[user.role as Role]?.label}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-greige hover:text-error-DEFAULT hover:bg-error-soft/10 rounded-md transition-all duration-200"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
