'use client'

import { usePathname } from 'next/navigation'
import { Menu, Bell, Search } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { NAV_ITEMS, ROLES } from '@/lib/constants'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
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

  if (!user) return null

  return (
    <header className="h-14 bg-ivory-cream border-b border-sand-light flex items-center px-4 gap-4 sticky top-0 z-10">
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 text-greige hover:text-charcoal-deep transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <div className="flex-1">
        <h2 className="text-base font-display text-charcoal-deep tracking-tight">
          {currentNav?.label || 'Dashboard'}
        </h2>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="p-1.5 text-greige hover:text-charcoal-deep transition-colors hidden sm:flex">
          <Search className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-greige hover:text-charcoal-deep transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-warning-DEFAULT rounded-full" />
        </button>
        <div className="flex items-center gap-2 pl-2 border-l border-sand-light">
          <Avatar name={user.name} size="sm" />
          <div className="hidden sm:block">
            <p className="text-xs font-body font-medium text-charcoal-deep leading-none">{user.name.split(' ')[0]}</p>
            <Badge variant="default" className="text-[9px] mt-0.5">{ROLES[user.role as Role]?.label}</Badge>
          </div>
        </div>
      </div>
    </header>
  )
}
