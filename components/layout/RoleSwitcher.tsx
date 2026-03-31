'use client'

import { useRouter } from 'next/navigation'
import { SwitchCamera } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ROLES } from '@/lib/constants'
import type { Role } from '@/types/auth'
import { cn } from '@/lib/utils'

const ROLES_LIST: Role[] = ['patient', 'doctor', 'ngo_worker', 'gov_analyst', 'admin']

export function RoleSwitcher() {
  const { user, demoLogin } = useAuth()
  const router = useRouter()

  async function switchRole(role: Role) {
    await demoLogin(role)
    router.push('/dashboard')
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <details className="group">
        <summary className="flex items-center gap-1.5 px-3 py-1.5 bg-noir text-ivory-cream rounded-full text-xs font-body cursor-pointer shadow-lg list-none select-none">
          <SwitchCamera className="w-3 h-3" />
          Dev: Switch Role
        </summary>
        <div className="absolute bottom-full right-0 mb-2 bg-ivory-cream border border-sand-light rounded-xl shadow-lg overflow-hidden min-w-40">
          {ROLES_LIST.map((role) => (
            <button
              key={role}
              onClick={() => switchRole(role)}
              className={cn(
                'w-full text-left px-4 py-2.5 text-sm font-body transition-colors hover:bg-parchment',
                user?.role === role ? 'text-gold-deep font-medium bg-champagne' : 'text-charcoal-warm'
              )}
            >
              {ROLES[role].label}
            </button>
          ))}
        </div>
      </details>
    </div>
  )
}
