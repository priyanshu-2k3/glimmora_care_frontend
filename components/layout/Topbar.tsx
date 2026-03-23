'use client'

import { usePathname } from 'next/navigation'
import { Menu, Bell, Search } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { NAV_ITEMS, ROLES } from '@/lib/constants'
import { Avatar } from '@/components/ui/Avatar'
import type { Role } from '@/types/auth'

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname()
  const { user } = useAuth()

  const currentNav = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  )
  const pageTitle = currentNav?.label || 'Dashboard'

  if (!user) return null

  return (
    <header className="h-16 bg-white border-b border-sand-light flex items-center px-5 gap-4 sticky top-0 z-10">
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 text-greige hover:text-charcoal-deep transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumb + title */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-greige font-body leading-none mb-0.5">
          Home / <span className="text-stone">{pageTitle}</span>
        </p>
        <h2 className="text-lg font-body font-semibold text-charcoal-deep leading-none truncate">
          {pageTitle}
        </h2>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Search bar */}
        <div className="hidden md:flex items-center gap-2 bg-ivory-warm border border-sand-light rounded-lg px-3 py-1.5 w-44">
          <Search className="w-3.5 h-3.5 text-greige shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-xs font-body text-charcoal-deep placeholder:text-greige outline-none w-full"
          />
        </div>

        {/* Notification bell */}
        <button className="relative p-2 text-greige hover:text-charcoal-deep transition-colors">
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1 right-1 w-4 h-4 bg-error-DEFAULT text-ivory-cream text-[9px] font-body font-semibold rounded-full flex items-center justify-center leading-none">
            3
          </span>
        </button>

        {/* Divider */}
        <div className="w-px h-7 bg-sand-light mx-1" />

        {/* User */}
        <div className="flex items-center gap-2.5">
          <Avatar name={user.name} size="sm" />
          <div className="hidden sm:block leading-tight">
            <p className="text-xs font-body font-semibold text-charcoal-deep">{user.name.split(' ')[0]} {user.name.split(' ')[1]?.[0]}.</p>
            <p className="text-[10px] font-body text-greige">{ROLES[user.role as Role]?.label}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
