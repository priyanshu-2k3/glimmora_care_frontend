'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Upload, Shield, Brain, Bot, MessageSquare,
  Activity, Globe, WifiOff, Settings, LogOut, ChevronRight
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { NAV_ITEMS, ROLES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import type { Role } from '@/types/auth'

const ICONS: Record<string, React.ElementType> = {
  LayoutDashboard, Upload, Shield, Brain, Bot,
  MessageSquare, Activity, Globe, WifiOff, Settings,
}

const NAV_SECTIONS = [
  { label: null, hrefs: ['/dashboard'] },
  { label: 'HEALTH', hrefs: ['/intake', '/vault', '/twin'] },
  { label: 'INTELLIGENCE', hrefs: ['/intelligence', '/assistants', '/agents'] },
  { label: 'COMMUNITY', hrefs: ['/population', '/offline'] },
  { label: 'SYSTEM', hrefs: ['/settings'] },
]

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  if (!user) return null

  const navItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(user.role as Role)
  )

  return (
    <div className="flex flex-col h-full bg-dark-espresso border-r border-white/10">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <Link href="/dashboard" onClick={onClose}>
          <h1 className="font-display text-2xl text-ivory-cream tracking-tight">
            Glimmora<span className="text-gold-soft italic">Care</span>
          </h1>
          <p className="text-[10px] text-ivory-cream/40 font-body uppercase tracking-widest mt-0.5">
            Preventive Intelligence
          </p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {NAV_SECTIONS.map((section) => {
          const sectionItems = navItems.filter((item) =>
            section.hrefs.includes(item.href)
          )
          if (sectionItems.length === 0) return null
          return (
            <div key={section.label ?? 'main'} className="mb-4">
              {section.label && (
                <p className="text-[10px] font-body font-semibold text-ivory-cream/25 uppercase tracking-widest px-3 mb-1.5">
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
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium transition-all duration-200 group',
                        isActive
                          ? 'bg-gold-soft/20 text-ivory-cream border border-gold-soft/30 shadow-sm'
                          : 'text-ivory-cream/55 hover:bg-white/8 hover:text-ivory-cream'
                      )}
                    >
                      {Icon && (
                        <Icon className={cn('w-4 h-4 shrink-0 transition-colors', isActive ? 'text-gold-soft' : 'text-ivory-cream/35 group-hover:text-gold-soft/70')} />
                      )}
                      <span className="flex-1">{item.label}</span>
                      {isActive && <ChevronRight className="w-3 h-3 text-gold-soft/60" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* User profile */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3 px-1">
          <Avatar name={user.name} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-body font-medium text-ivory-cream truncate">{user.name}</p>
            <Badge variant="gold" className="text-[10px] mt-0.5">{ROLES[user.role as Role]?.label}</Badge>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-ivory-cream/40 hover:text-error-soft hover:bg-white/5 rounded-lg transition-all duration-200 font-body"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </div>
  )
}
