'use client'

import { useAuth } from '@/context/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { canAccess } from '@/config/role-permissions'
import { ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Role } from '@/types/auth'

interface RoleGuardProps {
  /** Roles allowed to view this content */
  allowed: Role[]
  children: React.ReactNode
  /** If true, show an access-denied card instead of redirecting */
  inline?: boolean
}

/**
 * Blocks rendering if the current user's role is not in `allowed`.
 *
 * Usage:
 *   <RoleGuard allowed={['admin']}>
 *     <AdminContent />
 *   </RoleGuard>
 *
 * Or use `inline` to show an access-denied card within the page layout:
 *   <RoleGuard allowed={['super_admin']} inline>
 *     <SuperAdminWidget />
 *   </RoleGuard>
 */
export function RoleGuard({ allowed, children, inline }: RoleGuardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const hasAccess = user && allowed.includes(user.role as Role)

  useEffect(() => {
    if (!inline && user && !hasAccess) {
      router.replace('/dashboard')
    }
  }, [user, hasAccess, inline, router])

  if (!user) return null

  if (!hasAccess) {
    if (inline) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-parchment flex items-center justify-center mb-4">
            <ShieldOff className="w-6 h-6 text-greige" />
          </div>
          <p className="font-display text-lg text-charcoal-deep mb-1">Access Restricted</p>
          <p className="text-sm text-greige font-body max-w-xs">
            You don&apos;t have permission to view this section.
          </p>
        </div>
      )
    }
    return null
  }

  return <>{children}</>
}

/**
 * Hook to check if the current user can access a given route.
 * Uses the centralized ROLE_ROUTES config.
 */
export function useRoleAccess(route?: string): boolean {
  const { user } = useAuth()
  const pathname = usePathname()
  const target = route ?? pathname
  if (!user) return false
  return canAccess(user.role, target)
}
