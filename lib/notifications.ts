import type { NotificationOut } from '@/lib/api'

/**
 * Resolves the correct frontend route for a notification based on its type,
 * stored actionHref, and the current user's role.
 *
 * Priority:
 *   1. notif.actionHref — if set AND starts with '/', trust it (backend sends role-correct hrefs)
 *   2. Role-based fallback per notification type
 *   3. null — notification is informational only, no navigation
 *
 * Used by both Topbar dropdown and the full Notifications page so routing
 * is always consistent regardless of where the user clicks.
 */
export function resolveHref(notif: NotificationOut, role: string | undefined): string | null {
  switch (notif.type) {
    case 'alert':
      if (notif.actionHref?.startsWith('/')) return notif.actionHref
      if (role === 'patient') return '/twin'
      if (role === 'doctor' || role === 'super_admin') return '/intelligence'
      return '/dashboard'

    case 'consent':
      if (notif.actionHref?.startsWith('/')) return notif.actionHref
      if (role === 'patient') return '/consent/requests'
      if (role === 'doctor') return '/consent/active'
      if (role === 'admin' || role === 'super_admin') return '/admin/doctor-management/consent'
      return '/consent'

    case 'sync':
      if (notif.actionHref?.startsWith('/')) return notif.actionHref
      return '/dashboard'

    case 'agent':
      if (notif.actionHref?.startsWith('/')) return notif.actionHref
      if (role === 'super_admin') return '/agents'
      if (role === 'admin') return '/admin'
      return '/dashboard'

    case 'family':
      if (notif.actionHref?.startsWith('/')) return notif.actionHref
      if (role === 'patient' || role === 'super_admin' || role === 'family_admin') return '/family'
      return '/dashboard'

    case 'info': {
      if (notif.actionHref?.startsWith('/')) return notif.actionHref
      // Revoke notifications arrive as 'info' type — route doctor to vault
      const msg = (notif.message ?? '').toLowerCase()
      if (msg.includes('revoked') && role === 'doctor') return '/vault'
      if (msg.includes('revoked') && role === 'patient') return '/access'
      return null  // info-only by default; only navigate if backend set an explicit href
    }

    default:
      return null
  }
}
