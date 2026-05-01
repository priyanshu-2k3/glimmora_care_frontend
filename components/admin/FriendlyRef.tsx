'use client'

import type { AdminUserOut, AdminOrgItem } from '@/lib/api'

/**
 * Backend audit logs store actor / target as either a raw mongo id or
 * a typed reference like "user:abc…" / "org:abc…". This helper resolves
 * those refs to friendly labels using already-loaded admin user + org maps.
 *
 * Used by:
 *  - app/(dashboard)/admin/page.tsx       (Recent Activity strip)
 *  - app/(dashboard)/admin/logs/page.tsx  (full audit table)
 *  - app/(dashboard)/logs/page.tsx        (personal logs page)
 */

export type IdMaps = {
  users: Record<string, AdminUserOut>
  orgs:  Record<string, AdminOrgItem>
}

export function parseRef(ref: string | null | undefined): { kind: 'user' | 'org' | null; id: string } {
  if (!ref) return { kind: null, id: '' }
  const m = ref.match(/^(user|org):(.+)$/)
  if (m) return { kind: m[1] as 'user' | 'org', id: m[2] }
  return { kind: null, id: ref }
}

export function FriendlyRef({
  refValue,
  maps,
  inline = false,
}: {
  refValue: string | null | undefined
  maps: IdMaps
  /** Kept for API stability — IDs are no longer rendered in the UI. */
  showId?: boolean
  inline?: boolean
}) {
  if (!refValue) return <span className="text-greige italic">—</span>
  const { kind, id } = parseRef(refValue)

  // Try both: explicit "user:" / "org:" prefix, and fallback to a bare id
  // matching either map.
  const u = (kind === 'user' || kind === null) ? maps.users[id] : undefined
  const o = (kind === 'org'  || kind === null) ? maps.orgs[id]  : undefined

  if (u) {
    const name = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email
    return inline
      ? <span className="text-charcoal-deep">User: <span className="font-medium">{name}</span></span>
      : <span className="text-charcoal-deep">User: <span className="font-medium">{name}</span></span>
  }
  if (o) {
    return inline
      ? <span className="text-charcoal-deep">Org: <span className="font-medium">{o.name}</span></span>
      : <span className="text-charcoal-deep">Org: <span className="font-medium">{o.name}</span></span>
  }

  // Unknown reference — fall back to a neutral label rather than leaking raw ids.
  return <span className="text-greige italic">Unknown reference</span>
}
