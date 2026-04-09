/**
 * Role-based route permissions.
 *
 * Each role has a list of route prefixes it can access.
 * The RoleGuard component uses this to block unauthorized access.
 */

import { UserRole } from './roles'

export const ROLE_ROUTES: Record<UserRole, string[]> = {
  [UserRole.PATIENT]: [
    '/dashboard',
    '/intake',
    '/vault',
    '/profiles',
    '/twin',
    '/family',
    '/emergency',
    '/consent',
    '/access',
    '/logs',
    '/assistants',
    '/notifications',
    '/settings',
  ],

  [UserRole.DOCTOR]: [
    '/dashboard',
    '/intake',
    '/vault',
    '/profiles',
    '/twin',
    '/consent',
    '/logs',
    '/intelligence',
    '/assistants',
    '/notifications',
    '/settings',
  ],

  [UserRole.ADMIN]: [
    '/dashboard',
    '/admin',
    '/consent',
    '/logs',
    '/notifications',
    '/settings',
  ],

  [UserRole.SUPER_ADMIN]: [
    '/dashboard',
    '/intake',
    '/vault',
    '/profiles',
    '/family',
    '/emergency',
    '/consent',
    '/access',
    '/logs',
    '/intelligence',
    '/agents',
    '/assistants',
    '/admin',
    '/manage-users',
    '/notifications',
    '/settings',
  ],
}

/** Check if a role can access a given pathname */
export function canAccess(role: string, pathname: string): boolean {
  const routes = ROLE_ROUTES[role as UserRole]
  if (!routes) return false
  return routes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))
}
